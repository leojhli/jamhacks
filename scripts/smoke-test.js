const { spawn } = require('child_process');

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
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) return;
    } catch {
      await delay(150);
    }
  }
  throw new Error(`Server did not start. ${stderr}`);
}

async function post(path, body) {
  const response = await fetch(`http://localhost:3000/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function get(path) {
  const response = await fetch(`http://localhost:3000/api${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

(async () => {
  try {
    await waitForServer();
    const bootstrap = await get('/bootstrap');
    const assignments = await get('/assignments');
    const gaps = await get('/learning-gaps');
    const plan = await post('/plan-night', {
      availableMinutes: 90,
      energy: 'tired',
      goal: 'stay_on_track'
    });
    const coach = await post('/coach', {
      message: "I have 45 minutes and I'm tired. What should I do?"
    });

    if (!bootstrap.assignments.length || !bootstrap.gaps.length) throw new Error('Bootstrap data missing');
    if (!assignments.length) throw new Error('No assignments returned');
    if (!gaps.length) throw new Error('No learning gaps returned');
    if (!plan.nextBestAction || !plan.plan.length) throw new Error('No plan returned');
    if (!coach.answer || !coach.plan.length) throw new Error('No coach response returned');

    console.log('Smoke test passed');
    console.log(`Next best action: ${plan.nextBestAction.title}`);
    console.log(`Assignments: ${assignments.length}`);
    console.log(`Learning gaps: ${gaps.length}`);
  } finally {
    server.kill();
  }
})().catch((error) => {
  server.kill();
  console.error(error);
  process.exit(1);
});
