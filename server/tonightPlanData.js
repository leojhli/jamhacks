const { getAssignmentDetail } = require('./academicData');

const workPackages = {
  'calculus-integration': {
    stay_on_track: {
      title: 'Complete Two Volume Problems',
      outcome: 'Two finished volume problems with diagrams, bounds, setup, calculations, and units.',
      startStep: 'Complete the diagram, bounds, and washer-method integral for the first unfinished volume problem.',
      minutes: 30
    },
    catch_up: {
      title: 'Finish the Volume Problems',
      outcome: 'The unfinished volume section completed and checked for radius and bounds errors.',
      startStep: 'Finish the first incomplete volume problem through the final answer and units.',
      minutes: 40
    },
    get_ahead: {
      title: 'Complete and Check the Problem Set',
      outcome: 'Remaining problems completed, with every bound, unit, and application explanation checked.',
      startStep: 'Complete the next unfinished problem, then check its bounds and units against the diagram.',
      minutes: 45
    },
    minimum_viable_night: {
      title: 'Finish One Calculus Problem',
      outcome: 'One unfinished application problem fully completed and checked.',
      startStep: 'Complete the first unfinished problem from diagram through final answer and units.',
      minutes: 20
    }
  },
  'titration-lab': {
    stay_on_track: {
      title: 'Complete the Titration Data Table',
      outcome: 'A clean report-ready data table plus one checked molarity calculation.',
      startStep: 'Enter all trial volumes and endpoint notes into the final data table, then calculate molarity for Trial 1.',
      minutes: 30
    },
    catch_up: {
      title: 'Finish Titration Calculations',
      outcome: 'All trial molarity calculations completed and checked for units, mole ratio, and significant figures.',
      startStep: 'Complete and label the full molarity calculation for Trial 1, including the mL-to-L conversion.',
      minutes: 40
    },
    get_ahead: {
      title: 'Draft the Titration Analysis',
      outcome: 'Calculations checked and a first error-analysis paragraph added to the report.',
      startStep: 'Complete Trial 1’s calculation, then write one sentence explaining the largest source of experimental error.',
      minutes: 45
    },
    minimum_viable_night: {
      title: 'Complete One Titration Trial',
      outcome: 'One report-ready trial row and molarity calculation completed.',
      startStep: 'Fill the final table row for Trial 1 and calculate its molarity with units and significant figures.',
      minutes: 20
    }
  },
  'congress-essay': {
    stay_on_track: {
      title: 'Write the Thesis and Evidence Plan',
      outcome: 'A defensible thesis plus three evidence bullets ready for the essay draft.',
      startStep: 'Write a one-sentence thesis that judges the Congress of Vienna as successful, partly successful, or flawed.',
      minutes: 25
    },
    catch_up: {
      title: 'Draft the First History Paragraph',
      outcome: 'Thesis, evidence list, and one analytical body paragraph drafted.',
      startStep: 'Write the thesis, then draft the first topic sentence and attach one specific piece of evidence.',
      minutes: 40
    },
    get_ahead: {
      title: 'Build the Congress of Vienna Draft',
      outcome: 'Thesis, outline, and two body paragraphs drafted with explained evidence.',
      startStep: 'Write the thesis and first body paragraph using one decision from the Congress as evidence.',
      minutes: 50
    },
    minimum_viable_night: {
      title: 'Lock the Essay Argument',
      outcome: 'A usable thesis and two evidence bullets saved for the next writing block.',
      startStep: 'Write the final thesis sentence and list two facts that directly support it.',
      minutes: 15
    }
  },
  'world-midterm': {
    stay_on_track: {
      title: 'Build the Midterm Timeline',
      outcome: 'A one-page timeline with eight anchor events and cause/effect links.',
      startStep: 'Write the first four anchor events in order and add one cause/effect link between them.',
      minutes: 30
    },
    catch_up: {
      title: 'Complete the Timeline and MCQ Set',
      outcome: 'A complete timeline plus ten reviewed multiple-choice questions.',
      startStep: 'Add eight anchor events to the timeline, then answer the first five practice questions.',
      minutes: 45
    },
    get_ahead: {
      title: 'Complete a Midterm Practice Block',
      outcome: 'Timeline reviewed, ten MCQs completed, and one SAQ response drafted.',
      startStep: 'Answer five timed MCQs and write one sentence explaining each missed answer.',
      minutes: 50
    },
    minimum_viable_night: {
      title: 'Add Five Timeline Anchors',
      outcome: 'Five ordered events added to the midterm timeline.',
      startStep: 'Write five anchor events in chronological order and add a cause beside the first event.',
      minutes: 15
    }
  },
  'hamlet-presentation': {
    stay_on_track: {
      title: 'Choose the Hamlet Theme and Quotes',
      outcome: 'One theme claim and three supporting quotations selected.',
      startStep: 'Write one theme claim, then paste the strongest supporting quotation beneath it.',
      minutes: 25
    },
    catch_up: {
      title: 'Build the Hamlet Slide Skeleton',
      outcome: 'A title slide and three evidence slides with claims and quotations.',
      startStep: 'Create the title slide and first evidence slide with one claim and one quotation.',
      minutes: 40
    },
    get_ahead: {
      title: 'Draft the Hamlet Presentation',
      outcome: 'The slide skeleton completed with evidence and brief speaking notes.',
      startStep: 'Create the first evidence slide with a quotation, interpretation, and one speaking-note bullet.',
      minutes: 50
    },
    minimum_viable_night: {
      title: 'Create One Hamlet Evidence Slide',
      outcome: 'One usable evidence slide completed.',
      startStep: 'Create one slide with a theme claim, supporting quotation, and two-sentence interpretation.',
      minutes: 15
    }
  }
};

const ignoredWords = new Set(['the', 'and', 'with', 'one', 'first', 'then', 'into', 'from', 'through', 'final', 'complete', 'completed']);

function relevantItem(items, work, getText = (item) => item) {
  const source = `${work.title} ${work.outcome} ${work.startStep}`.toLowerCase();
  const words = source.match(/[a-z]+/g)?.filter((word) => word.length > 3 && !ignoredWords.has(word)) || [];
  return items
    .map((item) => ({ item, score: words.filter((word) => getText(item).toLowerCase().includes(word)).length }))
    .sort((a, b) => b.score - a.score)[0]?.item;
}

function getWorkPackage(assignmentId, goal) {
  const assignment = getAssignmentDetail(assignmentId);
  const packages = workPackages[assignmentId];
  if (!assignment || !packages) return null;
  const work = packages[goal] || packages.stay_on_track;
  const openMilestones = assignment.intelligence.milestones.filter((milestone) => !milestone.done);
  const requirement = relevantItem(assignment.intelligence.requirements, work);
  const nextMilestone = relevantItem(openMilestones, work, (milestone) => milestone.label);
  const risk = relevantItem(assignment.intelligence.risks, work);
  return {
    ...work,
    assignmentId,
    course: assignment.course,
    basedOn: {
      summary: assignment.intelligence.summary,
      requirement,
      nextMilestone: nextMilestone?.label || assignment.intelligence.milestones[0]?.label,
      risk
    }
  };
}

module.exports = { getWorkPackage, workPackages };
