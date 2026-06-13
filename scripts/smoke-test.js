const { spawn } = require('child_process');
const { buildPlan } = require('../server/planner');
const { workPackages } = require('../server/tonightPlanData');

const apiBase = 'http://localhost:3000/api';
const server = spawn(process.execPath, ['server/index.js'], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe']
});

let stderr = '';
server.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch(`${apiBase}/health`);
      if (response.ok) return;
    } catch {
      await delay(150);
    }
  }
  throw new Error(`Server did not start. ${stderr}`);
}

async function post(path, body) {
  const response = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function get(path) {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

(async () => {
  try {
    await waitForServer();
    const bootstrap = await get('/bootstrap');
    const assignments = await get('/assignments');
    const assignmentDetail = await get(`/assignments/${assignments[0].id}`);
    const gaps = await get('/learning-gaps');
    const plan = await post('/plan-night', {
      availableMinutes: 60,
      energy: 'tired',
      goal: 'stay_on_track'
    });
    const coach = await post('/coach', {
      message: "I have 45 minutes and I'm tired. What should I do?"
    });

    if (!bootstrap.assignments.length || !bootstrap.gaps.length) throw new Error('Bootstrap data missing');
    if ('progress' in bootstrap) throw new Error('Legacy progress data still returned');
    if (assignments.length !== 5) throw new Error('Expected five demo assignments');
    const cardFields = ['title', 'course', 'type', 'dueDate', 'estimatedHours', 'completionPercentage', 'riskLevel'];
    if (cardFields.some((field) => !(field in assignments[0]))) throw new Error('Assignment card fields missing');
    if ('intelligence' in assignments[0]) throw new Error('Assignment list should not include intelligence payloads');
    const intelligenceFields = ['summary', 'requirements', 'suggestedOutline', 'milestones', 'materials', 'risks', 'recommendedActions'];
    if (intelligenceFields.some((field) => !(field in assignmentDetail.intelligence))) throw new Error('Assignment intelligence fields missing');
    if (!gaps.length) throw new Error('No learning gaps returned');
    if (gaps.some((gap) => !gap.linkedAssignment)) throw new Error('Learning gap assignment links missing');
    if (!plan.nextBestAction || !plan.plan.length) throw new Error('No plan returned');
    if (!coach.answer || !coach.plan.length) throw new Error('No coach response returned');

    const times = [30, 60, 75, 120];
    const energies = ['focused', 'normal', 'tired', 'bare_minimum'];
    const goals = ['stay_on_track', 'catch_up', 'get_ahead', 'minimum_viable_night'];
    const seenAssignments = new Set();
    let combinations = 0;
    for (const availableMinutes of times) {
      for (const energy of energies) {
        for (const goal of goals) {
          const demoPlan = buildPlan({ availableMinutes, energy, goal });
          combinations += 1;
          if (!demoPlan.plan.length || !demoPlan.justStart?.step) throw new Error(`No demo plan for ${availableMinutes}/${energy}/${goal}`);
          if (demoPlan.plan.reduce((sum, item) => sum + item.minutes, 0) > availableMinutes) throw new Error('Plan exceeds available time');
          for (const item of demoPlan.plan) {
            seenAssignments.add(item.id);
            if (!item.startStep || item.startStep.length < 35) throw new Error(`Weak starter action for ${item.id}`);
            if (!item.basedOn?.requirement || !item.basedOn?.nextMilestone || !item.basedOn?.risk) throw new Error(`Intelligence basis missing for ${item.id}`);
          }
        }
      }
    }
    if (Object.keys(workPackages).some((id) => !seenAssignments.has(id))) throw new Error('An assignment never appears in Tonight\'s Plan demos');
    for (const [assignmentId, packages] of Object.entries(workPackages)) {
      for (const [goal, work] of Object.entries(packages)) {
        if (!work.startStep || work.startStep.length < 35) throw new Error(`Weak work-package starter for ${assignmentId}/${goal}`);
        if (!work.outcome || work.outcome.length < 25) throw new Error(`Missing tangible outcome for ${assignmentId}/${goal}`);
      }
    }

    console.log('Smoke test passed');
    console.log(`Next best action: ${plan.nextBestAction.title}`);
    console.log(`Assignments: ${assignments.length}`);
    console.log(`Learning gaps: ${gaps.length}`);
    console.log(`Plan combinations: ${combinations}`);
  } finally {
    server.kill();
  }
})().catch((error) => {
  server.kill();
  console.error(error);
  process.exit(1);
});
