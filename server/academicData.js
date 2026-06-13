const { assignments, learningGaps } = require('./demoData');

const dueDateByAssignment = {
  'calculus-integration': '2026-06-13',
  'titration-lab': '2026-06-15',
  'congress-essay': '2026-06-16',
  'world-midterm': '2026-06-18',
  'hamlet-presentation': '2026-06-20'
};

const summaryByAssignment = {
  'calculus-integration': 'Finish the remaining integration applications problems and check each setup before calculating.',
  'titration-lab': 'Turn the collected titration data into a complete lab report with checked calculations and a clear error analysis.',
  'congress-essay': 'Build and support an argument about whether the Congress of Vienna created a stable European order.',
  'hamlet-presentation': 'Choose a clear theme, support it with quotations, and prepare concise slides and speaking notes.',
  'world-midterm': 'Review the major units, rebuild the timeline, and practice the question formats used on the midterm.'
};

function assignmentCard(assignment) {
  return {
    id: assignment.id,
    title: assignment.title,
    course: assignment.course,
    type: assignment.type,
    dueDate: dueDateByAssignment[assignment.id],
    dueLabel: assignment.dueLabel,
    estimatedHours: assignment.remainingHours,
    completionPercentage: assignment.completion,
    riskLevel: assignment.risk
  };
}

function assignmentIntelligence(assignment) {
  return {
    summary: summaryByAssignment[assignment.id],
    requirements: assignment.requirements,
    suggestedOutline: assignment.outline,
    milestones: assignment.milestones,
    materials: assignment.materials,
    risks: assignment.risks,
    recommendedActions: [
      assignment.recommendedNextAction,
      assignment.justStart
    ]
  };
}

function assignmentDetail(assignment) {
  return {
    ...assignmentCard(assignment),
    intelligence: assignmentIntelligence(assignment)
  };
}

function getAssignmentCards() {
  return assignments.map(assignmentCard);
}

function getAssignmentDetail(id) {
  const assignment = assignments.find((item) => item.id === id);
  return assignment ? assignmentDetail(assignment) : null;
}

function getLearningGaps() {
  const cardsById = new Map(getAssignmentCards().map((assignment) => [assignment.id, assignment]));
  return learningGaps.map((gap) => ({
    ...gap,
    linkedAssignment: cardsById.get(gap.linkedAssignmentId) || null
  }));
}

module.exports = {
  getAssignmentCards,
  getAssignmentDetail,
  getLearningGaps
};
