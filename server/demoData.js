const now = new Date('2026-06-12T20:00:00-04:00');

const profile = {
  name: 'David Deng',
  email: 'david.deng@yrdsb.ca',
  grade: 'Grade 12',
  state: 'Busy week, several AP assignments, Chemistry test coming soon, somewhat behind but recoverable.',
  courses: [
    'AP Calculus BC',
    'AP Chemistry',
    'AP World History',
    'AP English Literature',
    'Computer Science',
    'Economics'
  ]
};

const assignments = [
  {
    id: 'calculus-integration',
    title: 'Unit 4 Problem Set: Integration Applications',
    course: 'AP Calculus BC',
    type: 'Problem Set',
    dueLabel: 'Tomorrow',
    dueInDays: 1,
    completion: 55,
    remainingHours: 2,
    risk: 'Medium',
    zone: 'Danger',
    masteryKey: 'applications-of-integration',
    recommendedNextAction: 'Complete the first unfinished application problem and check its bounds and units.',
    justStart: 'Complete the first unfinished problem from diagram through final answer and units.',
    requirements: [
      'Complete assigned problems',
      'Show full setup',
      'Use correct bounds',
      'Label units',
      'Explain reasoning for application problems'
    ],
    materials: [
      'Integration applications notes',
      'Area between curves formula sheet',
      'Disk/washer method examples',
      'Accumulation function examples'
    ],
    risks: [
      'Wrong bounds',
      'Upper/lower function confusion',
      'Washer radius errors',
      'Calculator mistakes'
    ],
    outline: [
      'Area between curves setup',
      'Disk and washer method problems',
      'Average value applications',
      'Final answer and units check'
    ],
    milestones: [
      { label: 'Problems 1-4 setup', done: true },
      { label: 'Volume problems', done: false },
      { label: 'Application explanations', done: false }
    ]
  },
  {
    id: 'titration-lab',
    title: 'Titration Lab Report',
    course: 'AP Chemistry',
    type: 'Lab Report',
    dueLabel: 'In 3 days',
    dueInDays: 3,
    completion: 25,
    remainingHours: 4.5,
    risk: 'High',
    zone: 'Danger',
    masteryKey: 'titration-calculations',
    recommendedNextAction: 'Complete the final data table and calculate molarity for Trial 1.',
    justStart: 'Fill the final table row for Trial 1 and calculate its molarity with units and significant figures.',
    requirements: [
      'Purpose',
      'Background',
      'Data table',
      'Balanced equation',
      'Molarity calculations',
      'Error analysis',
      'Conclusion',
      'Significant figures'
    ],
    materials: [
      'Acid-base titration notes',
      'Lab handout',
      'Raw data',
      'Molarity examples',
      'Significant figures guide'
    ],
    risks: [
      'Wrong mole ratio',
      'Forgetting mL to L',
      'Confusing endpoint/equivalence point',
      'Weak error analysis'
    ],
    outline: [
      'Clean data table',
      'Balanced equation and mole ratio',
      'Molarity calculations',
      'Error analysis and conclusion'
    ],
    milestones: [
      { label: 'Raw data collected', done: true },
      { label: 'Clean table', done: false },
      { label: 'Calculations checked', done: false },
      { label: 'Write-up drafted', done: false }
    ]
  },
  {
    id: 'congress-essay',
    title: 'Congress of Vienna Essay',
    course: 'AP World History',
    type: 'Essay',
    dueLabel: 'In 4 days',
    dueInDays: 4,
    completion: 15,
    remainingHours: 6,
    risk: 'High',
    zone: 'Danger',
    masteryKey: 'congress-of-vienna',
    recommendedNextAction: 'Write a defensible thesis and list three facts that support it.',
    justStart: 'Write the final thesis sentence and two evidence bullets that directly support it.',
    requirements: [
      'Clear thesis',
      'Historical context',
      'Specific evidence',
      'Balance of power analysis',
      'Discussion of major figures',
      'Analysis, not summary'
    ],
    materials: [
      'Napoleon/postwar Europe notes',
      'Congress of Vienna overview',
      'Map before/after 1815',
      'Metternich notes',
      'Teacher rubric'
    ],
    risks: [
      'Summary instead of argument',
      'Weak thesis',
      'Unexplained evidence',
      'Ignoring long-term effects'
    ],
    outline: [
      'Thesis direction',
      'Context after Napoleon',
      'Evidence for balance of power',
      'Long-term nationalist pressure'
    ],
    milestones: [
      { label: 'Prompt unpacked', done: true },
      { label: 'Thesis direction', done: false },
      { label: 'Evidence list', done: false },
      { label: 'Draft body paragraphs', done: false }
    ]
  },
  {
    id: 'hamlet-presentation',
    title: 'Hamlet Themes Presentation',
    course: 'AP English Literature',
    type: 'Presentation',
    dueLabel: 'In 8 days',
    dueInDays: 8,
    completion: 20,
    remainingHours: 5,
    risk: 'Low',
    zone: 'Safe',
    masteryKey: 'hamlet-themes',
    recommendedNextAction: 'Create one evidence slide with a theme claim, quotation, and interpretation.',
    justStart: 'Create one slide with a theme claim, supporting quotation, and two-sentence interpretation.',
    requirements: [
      'Theme selection',
      'Interpretive claim',
      'Direct textual evidence',
      'Literary device analysis',
      'Visuals/slides',
      'Speaking notes'
    ],
    materials: [
      'Hamlet full text',
      'Class notes',
      'Presentation rubric',
      'Soliloquy notes',
      'Literary device sheet'
    ],
    risks: [
      'Too much plot summary',
      'Weak quote analysis',
      'Overloaded slides',
      'Not enough practice'
    ],
    outline: [
      'Pick theme',
      'Choose 3 supporting quotes',
      'Make slide skeleton',
      'Practice speaking notes'
    ],
    milestones: [
      { label: 'Theme ideas listed', done: true },
      { label: 'Quotes selected', done: false },
      { label: 'Slides drafted', done: false }
    ]
  },
  {
    id: 'world-midterm',
    title: 'AP World History Midterm Exam',
    course: 'AP World History',
    type: 'Exam Prep',
    dueLabel: 'In 6 days',
    dueInDays: 6,
    completion: 30,
    remainingHours: 8,
    risk: 'Medium-High',
    zone: 'Danger',
    masteryKey: 'historical-causation',
    recommendedNextAction: 'Add eight anchor events and cause/effect links to the midterm timeline.',
    justStart: 'Write five anchor events in chronological order and add a cause beside the first event.',
    requirements: [
      'Review major units',
      'Build timeline',
      'Practice MCQ',
      'Practice SAQ/essay thinking',
      'Review weak periods and themes'
    ],
    materials: [
      'Teacher study guide',
      'AP World notes',
      'Unit timelines',
      'Previous quizzes',
      'MCQ/SAQ practice'
    ],
    risks: [
      'Memorizing facts without themes',
      'Weak timeline awareness',
      'Ignoring historical reasoning skills',
      'Not practicing question format'
    ],
    outline: [
      'Timeline spine',
      'Weak unit review',
      'MCQ practice',
      'One SAQ or thesis drill'
    ],
    milestones: [
      { label: 'Study guide opened', done: true },
      { label: 'Timeline built', done: false },
      { label: 'Practice set completed', done: false }
    ]
  }
];

const learningGaps = [
  {
    id: 'chemistry-equilibrium',
    topic: 'Chemistry Equilibrium',
    course: 'AP Chemistry',
    mastery: 42,
    whereItMatters: 'AP Chemistry test in 3 days.',
    whenItMatters: 'This week',
    recommendedFix: '25 minutes of equilibrium practice tonight.',
    justStart: 'Complete one equilibrium practice problem and check the final concentration against the answer key.',
    linkedAssignmentId: 'titration-lab'
  },
  {
    id: 'titration-calculations',
    topic: 'Titration Calculations',
    course: 'AP Chemistry',
    mastery: 48,
    whereItMatters: 'Titration lab report due in 3 days.',
    whenItMatters: 'Before the final write-up',
    recommendedFix: 'Clean the data table and do one molarity calculation.',
    justStart: 'Convert mL to L for one trial.',
    linkedAssignmentId: 'titration-lab'
  },
  {
    id: 'applications-of-integration',
    topic: 'Applications of Integration',
    course: 'AP Calculus BC',
    mastery: 58,
    whereItMatters: 'Problem set due tomorrow.',
    whenItMatters: 'Tonight',
    recommendedFix: 'Practice setting up area and volume integrals.',
    justStart: 'Draw one region and identify bounds.',
    linkedAssignmentId: 'calculus-integration'
  },
  {
    id: 'congress-of-vienna',
    topic: 'Congress of Vienna',
    course: 'AP World History',
    mastery: 64,
    whereItMatters: 'Essay due in 4 days and AP World midterm in 6 days.',
    whenItMatters: 'This week',
    recommendedFix: 'Create a thesis and evidence list.',
    justStart: 'Choose one argument direction.',
    linkedAssignmentId: 'congress-essay'
  },
  {
    id: 'historical-causation',
    topic: 'Historical Causation',
    course: 'AP World History',
    mastery: 60,
    whereItMatters: 'AP World History midterm in 6 days.',
    whenItMatters: 'This week',
    recommendedFix: 'Practice cause/effect chains with timeline anchors.',
    justStart: 'Write one cause and one effect for 1815.',
    linkedAssignmentId: 'world-midterm'
  },
  {
    id: 'hamlet-themes',
    topic: 'Hamlet Themes',
    course: 'AP English Literature',
    mastery: 71,
    whereItMatters: 'Presentation in 8 days.',
    whenItMatters: 'Later this week',
    recommendedFix: 'Pick a theme and one quote, but do not prioritize it tonight.',
    justStart: 'Write one theme candidate.',
    linkedAssignmentId: 'hamlet-presentation'
  }
];

const calendar = [
  { day: 'Tonight', label: 'Recommended block', type: 'study', title: 'Chemistry equilibrium review', pressure: 'high' },
  { day: 'Tomorrow', label: 'Due', type: 'assignment', title: 'Integration Applications', pressure: 'high' },
  { day: 'In 3 days', label: 'Due', type: 'assignment', title: 'Titration Lab Report', pressure: 'danger' },
  { day: 'In 4 days', label: 'Due', type: 'assignment', title: 'Congress of Vienna Essay', pressure: 'danger' },
  { day: 'In 6 days', label: 'Exam', type: 'test', title: 'AP World History Midterm', pressure: 'danger' },
  { day: 'In 8 days', label: 'Due', type: 'assignment', title: 'Hamlet Themes Presentation', pressure: 'safe' }
];

module.exports = { now, profile, assignments, learningGaps, calendar };
