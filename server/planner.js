const { assignments, learningGaps } = require('./demoData');

const energyProfiles = {
  focused: { label: 'Focused', block: 35, difficulty: 1.1, recovery: false },
  normal: { label: 'Normal', block: 30, difficulty: 1, recovery: false },
  tired: { label: 'Tired', block: 25, difficulty: 0.8, recovery: false },
  essentials_only: { label: 'Essentials only', block: 15, difficulty: 0.55, recovery: true }
};

const goalProfiles = {
  stay_on_track: { label: 'Stay on track', dueWeight: 1.1, masteryWeight: 1 },
  catch_up: { label: 'Catch up', dueWeight: 1.15, masteryWeight: 1.1, recovery: true },
  improve_test_readiness: { label: 'Improve test readiness', dueWeight: 0.9, masteryWeight: 1.45 },
  minimum_viable_night: { label: 'Minimum viable night', dueWeight: 1.2, masteryWeight: 0.8, recovery: true }
};

function zoneMultiplier(zone) {
  if (zone === 'Panic') return 1.55;
  if (zone === 'Danger') return 1.22;
  return 0.72;
}

function riskPoints(risk) {
  if (risk === 'High') return 28;
  if (risk === 'Medium-High') return 24;
  if (risk === 'Medium') return 18;
  return 8;
}

function linkedGap(assignment) {
  return learningGaps.find((gap) => gap.id === assignment.masteryKey || gap.linkedAssignmentId === assignment.id);
}

function scoreAssignment(assignment, input) {
  const goal = goalProfiles[input.goal] || goalProfiles.stay_on_track;
  const gap = linkedGap(assignment);
  const dueScore = Math.max(0, 9 - assignment.dueInDays) * 8 * goal.dueWeight;
  const completionScore = (100 - assignment.completion) * 0.35;
  const timeScore = assignment.remainingHours * 4.2;
  const masteryScore = gap ? (100 - gap.mastery) * 0.42 * goal.masteryWeight : 0;
  const riskScore = riskPoints(assignment.risk);
  return Math.round((dueScore + completionScore + timeScore + masteryScore + riskScore) * zoneMultiplier(assignment.zone));
}

function getTaskTemplate(assignment, input) {
  const energy = energyProfiles[input.energy] || energyProfiles.normal;
  if (assignment.id === 'titration-lab') {
    return {
      title: 'Chemistry Equilibrium Review',
      course: 'AP Chemistry',
      reason: 'Test risk is high and Chemistry has your lowest mastery topic.',
      justStart: 'Open your equilibrium notes and set up one ICE table. Do not solve the whole worksheet yet.',
      difficulty: 'hard'
    };
  }
  if (assignment.id === 'calculus-integration') {
    return {
      title: 'Calculus Integration Setup',
      course: assignment.course,
      reason: 'The problem set is due tomorrow, and setup mistakes create most of the lost time.',
      justStart: assignment.justStart,
      difficulty: 'medium'
    };
  }
  if (assignment.id === 'congress-essay') {
    return {
      title: 'Congress of Vienna Thesis Direction',
      course: assignment.course,
      reason: 'Choosing a thesis tonight keeps the essay out of the panic zone.',
      justStart: assignment.justStart,
      difficulty: energy.recovery ? 'easy' : 'medium'
    };
  }
  if (assignment.id === 'world-midterm') {
    return {
      title: 'World History Timeline Anchor',
      course: assignment.course,
      reason: 'The midterm is close enough that spaced prep beats one late cram.',
      justStart: assignment.justStart,
      difficulty: 'medium'
    };
  }
  return {
    title: assignment.title,
    course: assignment.course,
    reason: 'This can wait unless the high-risk work is already under control.',
    justStart: assignment.justStart,
    difficulty: 'easy'
  };
}

function buildPlan(input = {}) {
  const availableMinutes = Number(input.availableMinutes || 90);
  const energy = energyProfiles[input.energy] || energyProfiles.normal;
  const goal = goalProfiles[input.goal] || goalProfiles.stay_on_track;
  const recovery = energy.recovery || goal.recovery;
  const ranked = assignments
    .map((assignment) => ({ assignment, score: scoreAssignment(assignment, input), task: getTaskTemplate(assignment, input) }))
    .sort((a, b) => b.score - a.score);

  let remaining = Math.max(25, Math.min(180, availableMinutes));
  const maxItems = recovery ? 3 : 4;
  const plan = [];

  for (const item of ranked) {
    if (plan.length >= maxItems || remaining <= 6) break;
    if (recovery && item.assignment.zone === 'Safe') continue;
    let minutes = Math.min(remaining, Math.round(energy.block * energy.difficulty));
    if (item.assignment.id === 'calculus-integration' && !recovery) minutes = Math.min(remaining, Math.max(minutes, 30));
    if (item.assignment.id === 'congress-essay') minutes = Math.min(remaining, recovery ? 10 : 20);
    if (item.assignment.id === 'world-midterm' && availableMinutes < 90) continue;
    minutes = Math.max(recovery ? 10 : 15, minutes);
    if (minutes > remaining) minutes = remaining;
    plan.push({
      id: item.assignment.id,
      title: item.task.title,
      course: item.task.course,
      minutes,
      priority: item.score > 120 ? 'Critical' : item.score > 90 ? 'High' : item.score > 65 ? 'Medium' : 'Low',
      reason: item.task.reason,
      startStep: item.task.justStart,
      zone: item.assignment.zone
    });
    remaining -= minutes;
  }

  if (!recovery && remaining >= 5) {
    plan.push({
      id: 'shutdown',
      title: 'Shutdown Review',
      course: 'The Hub',
      minutes: Math.min(remaining, 5),
      priority: 'Low',
      reason: 'Confirm tomorrow\'s first task so you do not restart from zero.',
      startStep: 'Write tomorrow\'s first task in one sentence.',
      zone: 'Safe'
    });
  }

  const next = plan[0];
  const skipTonight = [
    {
      title: 'Do not polish Hamlet slides tonight.',
      reason: 'The presentation is not due for 8 days and Chemistry has a higher short-term risk.'
    },
    {
      title: 'Do not rewrite old notes.',
      reason: 'Active setup practice will reduce more pressure than making notes prettier.'
    },
    {
      title: 'Do not start with the easiest task.',
      reason: 'That would feel productive while avoiding the highest-risk work.'
    }
  ];

  const panicWarnings = assignments
    .filter((assignment) => assignment.zone !== 'Safe')
    .map((assignment) => ({
      assignmentId: assignment.id,
      title: assignment.title,
      due: assignment.dueLabel,
      remaining: `${assignment.remainingHours} hours`,
      zone: assignment.zone,
      message: assignment.id === 'congress-essay'
        ? 'If you do not choose a thesis direction tonight, this essay becomes difficult to finish without rushing.'
        : assignment.id === 'titration-lab'
          ? 'Calculations should be completed before the final write-up. Do not leave analysis for the due date.'
          : 'This task has enough remaining work that waiting will create pressure.'
    }));

  const recoveryPlan = recovery ? {
    headline: 'This is recoverable. Do not try to fix everything tonight.',
    minimumPlan: [
      'Chemistry: 10 flashcards or one ICE table setup',
      'Calculus: 2 setup problems',
      'History: choose thesis direction'
    ],
    message: 'Your goal tonight is not perfection. Your goal is to reduce tomorrow\'s pressure.'
  } : null;

  return {
    inputs: {
      availableMinutes,
      energy: energy.label,
      goal: goal.label
    },
    nextBestAction: next ? {
      title: next.title,
      course: next.course,
      minutes: next.minutes,
      why: next.reason
    } : null,
    plan,
    skipTonight,
    justStart: next ? {
      title: `Just start: ${next.title}`,
      step: next.startStep
    } : null,
    panicWarnings,
    recoveryPlan,
    explanation: `The Hub prioritized work by deadline pressure, completion, remaining time, concept mastery, risk, and your ${energy.label.toLowerCase()} energy level.`
  };
}

function coach(message = '') {
  const text = String(message).toLowerCase();
  const tired = text.includes('tired') || text.includes('burned') || text.includes('exhausted');
  const behind = text.includes('behind') || text.includes('catch') || text.includes('panic');
  const minutesMatch = text.match(/(\d+)\s*(min|minute|minutes|hour|hours)/);
  let availableMinutes = 45;
  if (minutesMatch) {
    availableMinutes = Number(minutesMatch[1]) * (minutesMatch[2].startsWith('hour') ? 60 : 1);
  }
  const plan = buildPlan({
    availableMinutes,
    energy: tired ? 'tired' : behind ? 'essentials_only' : 'normal',
    goal: behind ? 'catch_up' : 'stay_on_track'
  });

  return {
    answer: tired
      ? 'Do not try to do everything. Your best move is to reduce tomorrow\'s pressure with a small high-impact plan.'
      : behind
        ? 'This is recoverable. The goal is to lower risk, not fix the whole week tonight.'
        : 'Your best move is to start with the highest-pressure task, then stop before the plan becomes unrealistic.',
    plan: plan.plan,
    recommendedActions: plan.plan.map((item) => item.title),
    skipTonight: plan.skipTonight,
    justStart: plan.justStart
  };
}

module.exports = { buildPlan, coach, scoreAssignment };
