const { assignments, learningGaps } = require('./demoData');
const { getWorkPackage } = require('./tonightPlanData');

const energyProfiles = {
  focused: { label: 'Focused', pace: 1.15, maxItems: 4, recovery: false },
  normal: { label: 'Normal', pace: 1, maxItems: 4, recovery: false },
  tired: { label: 'Tired', pace: 0.85, maxItems: 3, recovery: false },
  bare_minimum: { label: 'Bare Minimum', pace: 0.65, maxItems: 2, recovery: true }
};

const goalProfiles = {
  stay_on_track: { label: 'Stay on Track', dueWeight: 1.2, masteryWeight: 1, completionWeight: 1 },
  catch_up: { label: 'Catch Up', dueWeight: 1.1, masteryWeight: 1, completionWeight: 1.45 },
  get_ahead: { label: 'Get Ahead', dueWeight: 0.8, masteryWeight: 1.25, completionWeight: 1.1, safeBoost: 105 },
  minimum_viable_night: { label: 'Minimum Viable Night', dueWeight: 1.35, masteryWeight: 0.75, completionWeight: 0.85, recovery: true }
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
  const completionScore = (100 - assignment.completion) * 0.35 * goal.completionWeight;
  const timeScore = assignment.remainingHours * 4.2;
  const masteryScore = gap ? (100 - gap.mastery) * 0.42 * goal.masteryWeight : 0;
  const riskScore = riskPoints(assignment.risk);
  const safeBoost = assignment.zone === 'Safe' ? goal.safeBoost || 0 : 0;
  return Math.round((dueScore + completionScore + timeScore + masteryScore + riskScore) * zoneMultiplier(assignment.zone) + safeBoost);
}

function buildPlan(input = {}) {
  const availableMinutes = Math.max(15, Math.min(240, Number(input.availableMinutes || 60)));
  const energy = energyProfiles[input.energy] || energyProfiles.normal;
  const goal = goalProfiles[input.goal] || goalProfiles.stay_on_track;
  const recovery = energy.recovery || goal.recovery;
  const ranked = assignments
    .map((assignment) => ({
      assignment,
      score: scoreAssignment(assignment, input),
      work: getWorkPackage(assignment.id, input.goal)
    }))
    .filter((item) => item.work)
    .sort((a, b) => b.score - a.score);

  const plan = [];
  const selectedItems = [];
  let remainingForSelection = availableMinutes;
  let totalRequested = 0;

  for (const item of ranked) {
    if (selectedItems.length >= energy.maxItems || remainingForSelection < 10) break;
    if (recovery && item.assignment.zone === 'Safe') continue;
    if (input.goal !== 'get_ahead' && item.assignment.id === 'world-midterm' && availableMinutes < 90) continue;
    
    const requested = Math.round(item.work.minutes / energy.pace);
    selectedItems.push({ item, requested });
    totalRequested += requested;
    remainingForSelection -= requested;
  }

  if (selectedItems.length > 0) {
    let unallocated = availableMinutes;

    for (const sel of selectedItems) {
      let alloc = Math.round((sel.requested / totalRequested) * availableMinutes / 5) * 5;
      if (alloc < 10) alloc = 10;
      sel.minutes = alloc;
      unallocated -= alloc;
    }

    let i = 0;
    let iterations = 0;
    while (unallocated !== 0 && iterations < 100) {
      iterations++;
      let idx = i % selectedItems.length;
      if (unallocated > 0) {
        selectedItems[idx].minutes += 5;
        unallocated -= 5;
      } else if (unallocated < 0) {
        let maxIdx = 0;
        for (let j = 1; j < selectedItems.length; j++) {
          if (selectedItems[j].minutes > selectedItems[maxIdx].minutes) {
            maxIdx = j;
          }
        }
        if (selectedItems[maxIdx].minutes > 10) {
          selectedItems[maxIdx].minutes -= 5;
          unallocated += 5;
        } else {
          break;
        }
      }
      i++;
    }

    for (const sel of selectedItems) {
      plan.push({
        id: sel.item.assignment.id,
        title: sel.item.work.title,
        course: sel.item.work.course,
        minutes: sel.minutes,
        priority: sel.item.score > 120 ? 'Critical' : sel.item.score > 90 ? 'High' : sel.item.score > 65 ? 'Medium' : 'Low',
        reason: sel.item.work.outcome,
        startStep: sel.item.work.startStep,
        basedOn: sel.item.work.basedOn,
        zone: sel.item.assignment.zone
      });
    }
  }

  const next = plan[0];
  const skipTonight = ranked
    .filter((item) => !plan.some((planned) => planned.id === item.assignment.id))
    .slice(0, 3)
    .map((item) => ({
      title: `Skip ${item.assignment.title} tonight.`,
      reason: `${item.assignment.dueLabel}; the selected plan uses the available time on higher-priority work.`
    }));

  const panicWarnings = assignments
    .filter((assignment) => assignment.zone !== 'Safe')
    .map((assignment) => ({
      assignmentId: assignment.id,
      title: assignment.title,
      due: assignment.dueLabel,
      remaining: `${assignment.remainingHours} hours`,
      zone: assignment.zone,
      message: getWorkPackage(assignment.id, 'minimum_viable_night').outcome
    }));

  const recoveryPlan = recovery ? {
    headline: 'Do the minimum tonight.',
    minimumPlan: plan.map((item) => item.startStep),
    message: 'Finish these steps, then stop.'
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
    explanation: `A ${availableMinutes}-minute plan for ${energy.label.toLowerCase()} energy and the goal to ${goal.label.toLowerCase()}.`
  };
}

function coach(message = '') {
  const text = String(message).toLowerCase();
  const tired = text.includes('tired') || text.includes('burned') || text.includes('exhausted');
  const behind = text.includes('behind') || text.includes('catch') || text.includes('panic');
  const minutesMatch = text.match(/(\d+)\s*(min|minute|minutes|hour|hours)/);
  let availableMinutes = 45;
  if (minutesMatch) availableMinutes = Number(minutesMatch[1]) * (minutesMatch[2].startsWith('hour') ? 60 : 1);
  const plan = buildPlan({
    availableMinutes,
    energy: tired ? 'tired' : behind ? 'bare_minimum' : 'normal',
    goal: behind ? 'catch_up' : 'stay_on_track'
  });

  return {
    answer: tired
      ? 'Keep tonight small. Start with the first task, then reassess.'
      : behind
        ? 'You do not need to fix the whole week tonight. Start with the first task.'
        : 'Start with the first task. Stop when your planned time is up.',
    plan: plan.plan,
    recommendedActions: plan.plan.map((item) => item.title),
    skipTonight: plan.skipTonight,
    justStart: plan.justStart
  };
}

module.exports = { buildPlan, coach, scoreAssignment, energyProfiles, goalProfiles };
