const state = {
  page: 'plan',
  time: 60,
  customTime: 75,
  energy: 'tired',
  goal: 'stay_on_track',
  selectedAssignment: null,
  plan: null,
  loadingPlan: false,
  assignments: [],
  assignmentDetails: {},
  assignmentLoading: false,
  gaps: [],
  calendar: [],
  startedActivities: [],
  session: {
    open: false,
    loading: false,
    steps: [],
    index: 0,
    done: [],
    advances: {},
    refOpen: false,
    sharpening: false,
    sharpenFrom: 100,
    sharpenTimer: null,
    growing: false,
    growFrom: 100,
    growTimer: null
  },
  profile: null,
  classroom: { connected: false, configured: true, email: null, name: null, courses: [] },
  signedIn: true,
  profileOpen: false,
  coachOpen: false,
  coachMessages: [
    { role: 'assistant', text: 'How much time do you have, and how tired are you?' }
  ],
  settings: {
    google: false,
    integrity: true,
    blockLength: 25,
    defaultEnergy: 'tired'
  }
};

const svg = (body) => `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const navIcons = {
  // crescent moon + twinkle star
  plan: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="currentColor" stroke="none"/><path d="M18 3.2l.75 1.7 1.7.75-1.7.75L18 8.1l-.75-1.7-1.7-.75 1.7-.75z" fill="currentColor" stroke="none"/>'),
  // radar dish with sweep + blip
  radar: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.4"/><path d="M12 12V3.5"/><path d="M12 12l6 3.4"/><circle cx="16.4" cy="8.6" r="1.3" fill="currentColor" stroke="none"/>'),
  // lightbulb idea
  gaps: svg('<path d="M9 18.5h6"/><path d="M10 21.5h4"/><path d="M8 14.5a6 6 0 1 1 8 0c-.85.75-1.1 1.35-1.1 2.5H9.1c0-1.15-.25-1.75-1.1-2.5z"/>'),
  // tear-off calendar
  calendar: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17"/><path d="M8 3v4M16 3v4"/><circle cx="8.6" cy="13.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="13.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.4" cy="13.6" r="1.1" fill="currentColor" stroke="none"/>'),
  // settings gear
  settings: svg('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>')
};
const navItems = [
  ['plan', 'Plan My Night', navIcons.plan],
  ['radar', 'Assignment Radar', navIcons.radar],
  ['gaps', 'Learning Gaps', navIcons.gaps],
  ['calendar', 'Calendar', navIcons.calendar],
  ['settings', 'Settings', navIcons.settings]
];

const energyOptions = [
  ['focused', 'Focused'],
  ['normal', 'Normal'],
  ['tired', 'Tired'],
  ['bare_minimum', 'Bare Minimum']
];

const goalOptions = [
  ['stay_on_track', 'Stay on Track'],
  ['catch_up', 'Catch Up'],
  ['get_ahead', 'Get Ahead'],
  ['minimum_viable_night', 'Minimum Viable Night']
];

const coachPrompts = [
  'Plan my night',
  'Help me start',
  "I'm behind",
  "I'm tired",
  'What should I skip?',
  'Quiz me',
  'Explain my mistake',
  'Make a recovery plan'
];

const $ = (selector) => document.querySelector(selector);
const main = $('#main');

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function toast(message) {
  const stack = $('#toastStack');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function tone(value) {
  const v = String(value).toLowerCase();
  if (v.includes('panic') || v.includes('high') || v === 'critical') return 'red';
  if (v.includes('danger') || v.includes('medium')) return 'amber';
  if (v.includes('safe') || v.includes('low')) return 'green';
  return 'blue';
}

function chip(text, extra = '') {
  return `<span class="chip ${extra || tone(text)}">${text}</span>`;
}

// Distinct colour per course (kept clear of red/amber/green so it never reads as a risk).
const courseColors = {
  'AP Chemistry': 'teal',
  'AP Calculus BC': 'blue',
  'AP World History': 'lav',
  'AP English Literature': 'plum',
  'Computer Science': 'pink',
  'Economics': 'dark'
};
function courseClass(course) {
  return courseColors[course] || 'dark';
}

// Distinct colour per task type (kept clear of red/amber/green so it never reads as a risk).
const typeColors = {
  'Problem Set': 'blue',
  'Lab Report': 'teal',
  'Essay': 'lav',
  'Presentation': 'plum',
  'Exam Prep': 'dark'
};
function typeClass(type) {
  return typeColors[type] || 'blue';
}

// Mastery -> learning-gap severity: High (red), Medium (amber), Low (green).
function abilityChip(mastery) {
  const [label, cls] = mastery < 50 ? ['High', 'red']
    : mastery < 65 ? ['Medium', 'amber']
    : ['Low', 'green'];
  return chip(label, cls);
}

// Calendar pressure -> High / Medium / Low chip (red / amber / green).
function pressureChip(pressure) {
  const map = { high: ['High', 'red'], danger: ['Medium', 'amber'], safe: ['Low', 'green'] };
  const [label, cls] = map[pressure] || [pressure, tone(pressure)];
  return chip(label, cls);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

function renderNav() {
  $('#nav').innerHTML = navItems.map(([id, label, icon]) => `
    <button class="nav-button ${state.page === id ? 'active' : ''}" data-page="${id}" type="button" aria-label="${label}" ${state.page === id ? 'aria-current="page"' : ''}>
      <span class="nav-icon" aria-hidden="true">${icon}</span>
      <span>${label}</span>
    </button>
  `).join('');
}

function renderProfile() {
  $('#profileMenu').hidden = !state.profileOpen;
  $('#profileButton').setAttribute('aria-expanded', String(state.profileOpen));
  $('#signedInProfile').hidden = !state.signedIn;
  $('#signedOutProfile').hidden = state.signedIn;
  const syncBtn = $('#syncGoogleBtn');
  if (syncBtn) {
    syncBtn.textContent = state.classroom.connected ? 'Disconnect Classroom' : 'Connect Google Classroom';
  }
}

function renderTonightProgress() {
  const activities = state.plan?.plan || [];
  const started = state.startedActivities.filter((id) => activities.some((item) => item.id === id));
  const total = activities.length;
  const visible = total > 0 && started.length > 0;
  const percent = total ? Math.round((started.length / total) * 100) : 0;
  const progress = $('#tonightProgress');

  progress.hidden = !visible;
  $('#tonightProgressLabel').textContent = `${started.length} of ${total} activities started`;
  $('#tonightProgressFill').style.width = `${percent}%`;
  const track = progress.querySelector('[role="progressbar"]');
  track.setAttribute('aria-valuemax', String(total));
  track.setAttribute('aria-valuenow', String(started.length));
}

function pageShell(title, subtitle, content) {
  return `
    <section class="page">
      <div class="section-head">
        <div>
          <div class="eyebrow">The Hub</div>
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>
      </div>
      ${content}
    </section>
  `;
}

function optionButton(value, label, active, key) {
  return `<button class="option ${active ? 'active' : ''}" type="button" data-option-key="${key}" data-option="${value}" aria-pressed="${active}">${label}</button>`;
}

function updatePlanOptions(key) {
  document.querySelectorAll(`[data-option-key="${key}"]`).forEach((button) => {
    const value = key === 'time' && button.dataset.option !== 'custom'
      ? Number(button.dataset.option)
      : button.dataset.option;
    button.classList.toggle('active', state[key] === value);
    button.setAttribute('aria-pressed', String(state[key] === value));
  });
  if (key === 'time') {
    document.querySelector('.custom-row')?.classList.toggle('open', state.time === 'custom');
  }
}

function renderPlanPage() {
  const output = state.loadingPlan ? loadingPlan() : state.plan ? planOutput(state.plan) : emptyPlan();
  main.innerHTML = `
    <section class="page">
      <div class="hero">
        <div class="hero-inner">
          <div>
            <div class="eyebrow">Tonight</div>
            <h1>Plan My Night</h1>
            <p>Choose your time, energy, and goal. Get a plan you can finish.</p>
          </div>
          <div class="decision-card">
            <div class="eyebrow" style="color:#8cf0de">Start here</div>
            <h2 style="margin:10px 0 0">Chemistry first.</h2>
            <div class="decision-mini">
              <strong>What needs attention</strong>
              <small>Chemistry needs a short start before the week gets harder.</small>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-grid">
        <form class="card" id="planForm">
          <fieldset class="control-group">
            <legend class="control-label">Available Time</legend>
            <div class="option-grid compact">
              ${[30, 60, 120].map((m) => optionButton(m, m === 120 ? '2 hours' : `${m} min`, state.time === m, 'time')).join('')}
              ${optionButton('custom', 'Custom', state.time === 'custom', 'time')}
            </div>
          </fieldset>
          <div class="custom-row ${state.time === 'custom' ? 'open' : ''}">
            <label for="customTimeInput">Custom time</label>
            <input id="customTimeInput" type="number" min="15" max="240" value="${state.customTime}" aria-describedby="customTimeUnit">
            <span class="meta" id="customTimeUnit">minutes</span>
          </div>
          <fieldset class="control-group">
            <legend class="control-label">Energy Level</legend>
            <div class="option-grid compact">
              ${energyOptions.map(([id, label]) => optionButton(id, label, state.energy === id, 'energy')).join('')}
            </div>
          </fieldset>
          <fieldset class="control-group">
            <legend class="control-label">Tonight's Goal</legend>
            <div class="option-grid compact">
              ${goalOptions.map(([id, label]) => optionButton(id, label, state.goal === id, 'goal')).join('')}
            </div>
          </fieldset>
          <button class="primary-button wide" type="submit" ${state.loadingPlan ? 'disabled aria-busy="true"' : ''}>${state.loadingPlan ? 'Building...' : 'Build My Plan'}</button>
        </form>
        <div class="output-stack" aria-live="polite" aria-busy="${state.loadingPlan}">${output}</div>
      </div>
    </section>
  `;

  const planContext = main.querySelector('.plan-context');
  if (planContext) {
    main.querySelector('.panel-grid')?.append(planContext);
  }
}

function emptyPlan() {
  return `
    <div class="empty-state">
      <div>
        <div class="eyebrow">Waiting for inputs</div>
        <h2>Your plan will appear here.</h2>
      </div>
    </div>
  `;
}

function loadingPlan() {
  return `
    <div class="card">
      <div class="skeleton" style="width:45%;height:18px"></div>
      <div class="skeleton" style="width:80%;height:42px;margin-top:18px"></div>
      <div class="skeleton" style="width:60%;height:18px;margin-top:14px"></div>
    </div>
    <div class="card"><div class="skeleton" style="height:140px"></div></div>
  `;
}

function planOutput(result) {
  const recovery = result.recoveryPlan ? `
    <div class="card" style="border-color:rgba(24,183,163,.24)">
      <div class="eyebrow">Recovery Mode</div>
      <h3>${result.recoveryPlan.headline}</h3>
      <ul>${result.recoveryPlan.minimumPlan.map((item) => `<li>${item}</li>`).join('')}</ul>
      <p>${result.recoveryPlan.message}</p>
    </div>
  ` : '';

  return `
    <div class="next-action">
      <div class="eyebrow" style="color:#8cf0de">Start here</div>
      <h2>${result.nextBestAction.title}</h2>
      <p><strong>${result.nextBestAction.minutes} minutes</strong> - ${result.nextBestAction.why}</p>
      <button class="ghost-button" data-start-activity="${result.plan[0].id}" data-start-step="${escapeAttr(result.justStart.step)}" type="button" aria-pressed="${state.startedActivities.includes(result.plan[0].id)}">${state.startedActivities.includes(result.plan[0].id) ? 'Started' : 'Just Start'}</button>
    </div>
    <div class="card whiteboard">
      <div class="section-head">
        <div><h2>Tonight's Plan</h2><p>${result.explanation}</p></div>
      </div>
      <div class="plan-list">
        ${result.plan.map((item) => `
          <article class="plan-item">
            <div class="time-chip">${item.minutes}<br>min</div>
            <div>
              <div class="chip-row">${chip(item.priority)}${chip(item.zone)}</div>
              <h3>${item.title}</h3>
              <p>${item.course} - ${item.reason}</p>
            </div>
            <button class="ghost-button" data-start-activity="${item.id}" data-start-step="${escapeAttr(item.startStep)}" type="button" aria-pressed="${state.startedActivities.includes(item.id)}">${state.startedActivities.includes(item.id) ? 'Started' : 'Start'}</button>
          </article>
        `).join('')}
      </div>
      <button class="primary-button wide session-start" data-session-open type="button">Start Session →</button>
    </div>
    <details class="card plan-context">
      <summary>More context for tonight</summary>
      <div class="two-col plan-context-grid">
        <div>
          <h3>What not to do tonight</h3>
          ${result.skipTonight.map((item) => `<div class="mini-box"><strong>${item.title}</strong><p>${item.reason}</p></div>`).join('')}
        </div>
        <div>
          <h3>Pressure to watch</h3>
          <div class="timeline">
            ${result.panicWarnings.map((warning) => `
              <article class="timeline-item">
                <div class="meta">${warning.due}</div>
                <div><strong>${warning.title}</strong><p>${warning.message}</p></div>
                ${chip(warning.zone)}
              </article>
            `).join('')}
          </div>
        </div>
      </div>
    </details>
    ${recovery}
  `;
}

function escapeAttr(text) {
  return String(text).replace(/"/g, '&quot;');
}

/* ============================================================
   GUIDED SESSION (fullscreen workflow overlay)
   ============================================================ */
const sessionRoot = document.getElementById('sessionRoot');

const stepMeta = {
  brief: { label: 'Brief', tag: 'Why this matters' },
  materials: { label: 'Materials', tag: 'Pull these up' },
  rubric: { label: 'Rubric', tag: 'How it is graded' },
  keysteps: { label: 'Key steps', tag: 'Do this in order' },
  focus: { label: 'Focus', tag: 'Work block' }
};

function buildSessionSteps(plan, detailsById) {
  const steps = [];
  plan.forEach((item, activityIndex) => {
    const intel = detailsById[item.id]?.intelligence || {};
    const base = {
      activityId: item.id,
      activityIndex,
      activityTitle: item.title,
      course: item.course,
      minutes: item.minutes,
      priority: item.priority,
      zone: item.zone,
      startStep: item.startStep,
      outcome: item.reason,
      summary: item.basedOn?.summary || intel.summary || '',
      nextMilestone: item.basedOn?.nextMilestone || '',
      materials: intel.materials || [],
      requirements: intel.requirements || [],
      risks: intel.risks || [],
      outline: intel.suggestedOutline || []
    };
    steps.push({ ...base, kind: 'brief' });
    if (base.materials.length) steps.push({ ...base, kind: 'materials' });
    if (base.requirements.length || base.risks.length) steps.push({ ...base, kind: 'rubric' });
    steps.push({ ...base, kind: 'keysteps' });
    steps.push({ ...base, kind: 'focus' });
  });
  steps.push({ kind: 'summary' });
  return steps;
}

function sessionActivities() {
  // Distinct activities in order, with their starting global step index.
  const seen = new Map();
  state.session.steps.forEach((step, i) => {
    if (step.kind === 'summary') return;
    if (!seen.has(step.activityId)) {
      seen.set(step.activityId, { ...step, firstIndex: i, steps: [] });
    }
    seen.get(step.activityId).steps.push({ kind: step.kind, index: i });
  });
  return [...seen.values()];
}

function sessionMinutesLeft() {
  const total = (state.plan?.plan || []).reduce((sum, item) => sum + item.minutes, 0);
  return Math.max(0, total - sessionProgressMinutes());
}

function sessionProgressMinutes() {
  return sessionActivities().reduce((sum, activity) => {
    const totalAdvances = Math.max(1, activity.steps.length - 1);
    const completedAdvances = Math.min(totalAdvances, (state.session.advances[activity.activityId] || []).length);
    return sum + activity.minutes * (completedAdvances / totalAdvances);
  }, 0);
}

function list(items, cls = '') {
  return `<ul class="${cls}">${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
}

function sessionStepBody(step) {
  if (step.kind === 'summary') {
    const acts = sessionActivities();
    const total = (state.plan?.plan || []).reduce((s, i) => s + i.minutes, 0);
    const doneCount = state.session.done.length;
    return `
      <div class="session-summary">
        <div class="eyebrow">Session complete</div>
        <h2>${doneCount === acts.length ? 'Everything done. Stop here.' : 'Good work tonight.'}</h2>
        <p>You moved through ${acts.length} ${acts.length === 1 ? 'activity' : 'activities'} across a ${total}-minute plan.</p>
        <div class="summary-list">
          ${acts.map((a) => `
            <div class="summary-row ${state.session.done.includes(a.activityId) ? 'is-done' : ''}">
              <span class="summary-mark" aria-hidden="true">${state.session.done.includes(a.activityId) ? '✓' : '○'}</span>
              <div><strong>${a.activityTitle}</strong><small>${a.course} · ${a.minutes} min</small></div>
            </div>
          `).join('')}
        </div>
        <button class="primary-button wide" data-session-finish type="button">Finish &amp; exit</button>
      </div>
    `;
  }

  const meta = stepMeta[step.kind];
  const head = `
    <div class="session-step-head">
      <div class="eyebrow">${meta.tag}</div>
      <h2>${step.activityTitle}</h2>
      <div class="chip-row">${chip(step.course, 'blue')}${chip(`${step.minutes} min`, 'blue')}${chip(step.priority)}</div>
    </div>
  `;

  if (step.kind === 'brief') {
    return `
      ${head}
      <div class="session-block tint-blue">
        <h3>Why this matters</h3>
        <p>${step.summary || step.outcome}</p>
      </div>
      <div class="session-block tint-green">
        <h3>What you'll have when you stop</h3>
        <p>${step.outcome}</p>
      </div>
      ${step.nextMilestone ? `<div class="session-block accent"><h3>Next milestone</h3><p>${step.nextMilestone}</p></div>` : ''}
    `;
  }

  if (step.kind === 'materials') {
    return `
      ${head}
      <div class="session-block tint-green">
        <h3>Open these before you start</h3>
        ${list(step.materials, 'check-list')}
      </div>
    `;
  }

  if (step.kind === 'rubric') {
    return `
      ${head}
      <div class="session-two">
        ${step.requirements.length ? `<div class="session-block tint-blue"><h3>Graded on</h3>${list(step.requirements)}</div>` : ''}
        ${step.risks.length ? `<div class="session-block warn"><h3>Common mistakes to avoid</h3>${list(step.risks)}</div>` : ''}
      </div>
    `;
  }

  if (step.kind === 'keysteps') {
    return `
      ${head}
      <div class="session-block accent">
        <h3>Start with</h3>
        <p>${step.startStep}</p>
      </div>
      ${step.outline.length ? `<div class="session-block tint-teal"><h3>Then work through</h3><ol class="step-ol">${step.outline.map((x) => `<li>${x}</li>`).join('')}</ol></div>` : ''}
    `;
  }

  // focus
  const done = state.session.done.includes(step.activityId);
  return `
    ${head}
    <div class="session-focus">
      <div class="focus-time"><strong>${step.minutes}</strong><span>minutes<br>budget</span></div>
      <div class="session-block accent">
        <h3>Do this now</h3>
        <p>${step.startStep}</p>
      </div>
      <div class="session-block tint-blue">
        <h3>Reach this outcome</h3>
        <p>${step.outcome}</p>
      </div>
      <button class="primary-button wide ${done ? 'is-done' : ''}" data-session-done="${step.activityId}" type="button">${done ? 'Completed ✓ — next' : 'Mark done &amp; continue →'}</button>
    </div>
  `;
}

function renderSession() {
  if (!sessionRoot) return;
  if (!state.session.open) {
    sessionRoot.innerHTML = '';
    return;
  }

  if (state.session.loading || !state.session.steps.length) {
    sessionRoot.innerHTML = `
      <div class="session-overlay" role="dialog" aria-modal="true" aria-label="Study session">
        <div class="session-loading"><div class="skeleton" style="width:220px;height:24px"></div><div class="skeleton" style="width:60%;height:48px;margin-top:16px"></div></div>
      </div>
    `;
    return;
  }

  const steps = state.session.steps;
  const index = Math.min(state.session.index, steps.length - 1);
  const step = steps[index];
  const plan = state.plan?.plan || [];
  const totalMinutes = plan.reduce((sum, item) => sum + item.minutes, 0);
  const completedMinutes = sessionProgressMinutes();
  const percent = totalMinutes ? Math.round((completedMinutes / totalMinutes) * 100) : 0;
  const remaining = totalMinutes ? Math.max(0, 100 - (completedMinutes / totalMinutes) * 100) : 100;
  const spent = remaining <= 0.001;
  const pencilWidth = `calc((100% - 18px) * ${(remaining / 100).toFixed(4)})`;
  const pencilStartWidth = `calc((100% - 18px) * ${(state.session.sharpenFrom / 100).toFixed(4)})`;
  const pencilGrowWidth = `calc((100% - 18px) * ${(state.session.growFrom / 100).toFixed(4)})`;
  const sharpening = state.session.sharpening;
  const growing = state.session.growing;
  const showPencil = !spent || sharpening;
  const acts = sessionActivities();
  const currentActivityId = step.activityId;
  const refStep = step.kind === 'summary' ? null : step;

  const timeline = acts.map((a) => {
    const activityDone = state.session.done.includes(a.activityId);
    const isCurrent = a.activityId === currentActivityId;
    return `
      <div class="tl-activity ${isCurrent ? 'current' : ''} ${activityDone ? 'done' : ''}">
        <button class="tl-activity-head" data-session-jump="${a.firstIndex}" type="button">
          <span class="tl-mark" aria-hidden="true">${activityDone ? '✓' : isCurrent ? '▸' : '○'}</span>
          <span class="tl-activity-name">${a.activityTitle}<small>${a.minutes} min</small></span>
        </button>
        <div class="tl-substeps">
          ${a.steps.map((s) => `
            <button class="tl-sub ${s.index === index ? 'active' : ''}" data-session-jump="${s.index}" type="button">
              ${stepMeta[s.kind].label}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  sessionRoot.innerHTML = `
    <div class="session-overlay ${state.session.refOpen ? 'ref-open' : ''}" role="dialog" aria-modal="true" aria-label="Study session">
      <header class="session-top">
        <button class="ghost-button session-exit" data-session-exit type="button">← Back to plan</button>
        ${refStep ? `<button class="ghost-button session-ref-toggle" data-session-ref type="button" aria-pressed="${state.session.refOpen}">📋 Reference</button>` : '<span class="session-ref-spacer"></span>'}
      </header>

      <div class="session-body">
        <aside class="session-timeline" aria-label="Tonight's workflow">
          <div class="eyebrow">Tonight's workflow</div>
          ${timeline}
          <button class="tl-sub tl-finish ${step.kind === 'summary' ? 'active' : ''}" data-session-jump="${steps.length - 1}" type="button">Session complete</button>
        </aside>

        <main class="session-stage" tabindex="-1">
          <div class="session-progress session-progress-stage">
          <div class="pencil-meter" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
            <div class="pencil ${sharpening ? 'is-sharpening' : ''} ${growing ? 'is-growing' : ''} ${spent && !sharpening ? 'spent' : ''}" style="width:${pencilWidth};--pencil-from:${pencilStartWidth};--pencil-grow-from:${pencilGrowWidth}" aria-hidden="true">
              <span class="tip"></span>
              <span class="barrel"></span>
              <span class="ferrule"></span>
              ${sharpening ? `
                <span class="sharpener">
                  <span class="crank"></span>
                  <span class="shaving"></span>
                  <span class="shaving shaving-2"></span>
                  <span class="shaving shaving-3"></span>
                </span>
              ` : ''}
            </div>
            ${showPencil ? '<span class="pencil-eraser" aria-hidden="true"></span>' : ''}
          </div>
          <div class="session-progress-meta">
            <span>${Math.round(completedMinutes)} of ${totalMinutes} min completed</span>
            <span>${Math.round(sessionMinutesLeft())} min left</span>
          </div>
          </div>
          ${sessionStepBody(step)}
          ${step.kind !== 'summary' && step.kind !== 'focus' ? `
            <div class="session-nav">
              <button class="ghost-button" data-session-back type="button" ${index === 0 ? 'disabled' : ''}>← Back</button>
              <button class="primary-button" data-session-next type="button">Next →</button>
            </div>
          ` : ''}
        </main>

        ${refStep ? `
          <aside class="session-ref" aria-label="Reference for ${refStep.activityTitle}" ${state.session.refOpen ? '' : 'hidden'}>
            <div class="session-ref-head">
              <strong>${refStep.activityTitle}</strong>
              <button class="icon-button" data-session-ref type="button" aria-label="Close reference">×</button>
            </div>
            ${refStep.requirements.length ? `<div class="session-block tint-blue"><h3>Graded on</h3>${list(refStep.requirements)}</div>` : ''}
            ${refStep.materials.length ? `<div class="session-block tint-green"><h3>Materials</h3>${list(refStep.materials, 'check-list')}</div>` : ''}
            ${refStep.risks.length ? `<div class="session-block warn"><h3>Avoid</h3>${list(refStep.risks)}</div>` : ''}
          </aside>
        ` : ''}
      </div>
    </div>
  `;

}

async function openSession() {
  const plan = state.plan?.plan || [];
  if (!plan.length) {
    toast('Build a plan first');
    return;
  }
  state.session.open = true;
  state.session.loading = true;
  state.session.index = 0;
  state.session.done = [];
  state.session.advances = {};
  state.session.refOpen = false;
  state.session.sharpening = false;
  state.session.sharpenFrom = 100;
  state.session.growing = false;
  state.session.growFrom = 100;
  clearTimeout(state.session.sharpenTimer);
  clearTimeout(state.session.growTimer);
  document.body.classList.add('session-active');
  renderSession();

  await Promise.all(plan.map(async (item) => {
    if (state.assignmentDetails[item.id]) return;
    try {
      state.assignmentDetails[item.id] = await api(`/assignments/${encodeURIComponent(item.id)}`);
    } catch (error) {
      state.assignmentDetails[item.id] = null;
    }
  }));

  state.session.steps = buildSessionSteps(plan, state.assignmentDetails);
  state.session.loading = false;
  renderSession();
  sessionRoot.querySelector('.session-stage')?.focus();
}

function closeSession() {
  state.session.open = false;
  state.session.refOpen = false;
  state.session.sharpening = false;
  state.session.growing = false;
  clearTimeout(state.session.sharpenTimer);
  clearTimeout(state.session.growTimer);
  document.body.classList.remove('session-active');
  renderSession();
  render();
}

function sessionGo(index) {
  state.session.index = Math.max(0, Math.min(index, state.session.steps.length - 1));
  renderSession();
  sessionRoot.querySelector('.session-stage')?.focus();
}

function sessionNext() {
  const current = state.session.steps[state.session.index];
  const next = state.session.steps[state.session.index + 1];
  if (!current || !next) return;

  if (current.activityId && current.activityId === next.activityId) {
    const activitySteps = state.session.steps.filter((item) => item.activityId === current.activityId);
    const totalAdvances = Math.max(1, activitySteps.length - 1);
    const advanceNumber = activitySteps.indexOf(next);
    state.session.advances ||= {};
    const completedAdvances = state.session.advances[current.activityId] || [];

    if (advanceNumber > 0 && advanceNumber <= totalAdvances && !completedAdvances.includes(advanceNumber)) {
      const totalMinutes = (state.plan?.plan || []).reduce((sum, item) => sum + item.minutes, 0);
      const completedBefore = sessionProgressMinutes();
      state.session.sharpenFrom = totalMinutes ? Math.max(0, 100 - (completedBefore / totalMinutes) * 100) : 100;
      state.session.advances[current.activityId] = [...completedAdvances, advanceNumber];
      state.session.sharpening = true;
      state.session.growing = false;
      clearTimeout(state.session.sharpenTimer);
      clearTimeout(state.session.growTimer);
      state.session.sharpenTimer = setTimeout(() => {
        state.session.sharpening = false;
        renderSession();
      }, 2400);
    }
  }

  sessionGo(state.session.index + 1);
}

function sessionBack() {
  const current = state.session.steps[state.session.index];
  const previous = state.session.steps[state.session.index - 1];
  if (!current || !previous) return;

  if (current.activityId && current.activityId === previous.activityId) {
    const activitySteps = state.session.steps.filter((item) => item.activityId === current.activityId);
    const advanceNumber = activitySteps.indexOf(current);
    const completedAdvances = state.session.advances[current.activityId] || [];

    if (completedAdvances.includes(advanceNumber)) {
      const totalMinutes = (state.plan?.plan || []).reduce((sum, item) => sum + item.minutes, 0);
      const completedBefore = sessionProgressMinutes();
      state.session.growFrom = totalMinutes ? Math.max(0, 100 - (completedBefore / totalMinutes) * 100) : 100;
      state.session.advances[current.activityId] = completedAdvances.filter((item) => item !== advanceNumber);
      state.session.sharpening = false;
      state.session.growing = true;
      clearTimeout(state.session.sharpenTimer);
      clearTimeout(state.session.growTimer);
      state.session.growTimer = setTimeout(() => {
        state.session.growing = false;
        renderSession();
      }, 650);
    }
  }

  sessionGo(state.session.index - 1);
}

function sessionMarkDone(id) {
  if (state.session.done.includes(id)) {
    sessionGo(state.session.index + 1);
    return;
  }
  state.session.done.push(id);
  if (!state.startedActivities.includes(id)) state.startedActivities.push(id);
  sessionGo(state.session.index + 1);
}

function renderRadarPage() {
  if (!state.selectedAssignment && state.assignments.length) state.selectedAssignment = state.assignments[0].id;
  const selected = state.assignmentDetails[state.selectedAssignment];
  const panel = state.assignmentLoading
    ? '<div class="card detail-panel"><div class="skeleton" style="height:360px"></div></div>'
    : selected
      ? assignmentDetail(selected)
      : '<div class="card detail-panel">Select an assignment to view its intelligence.</div>';
  main.innerHTML = pageShell('Assignment Radar', 'See what is due, what is risky, and what to do next.', `
    <div class="assignment-grid">
      <div class="assignment-list">
        ${state.assignments.map((item) => assignmentCard(item, state.selectedAssignment === item.id)).join('')}
      </div>
      ${panel}
    </div>
  `);
}

function assignmentCard(item, active) {
  return `
    <button class="assignment-card ${active ? 'active' : ''}" data-assignment="${item.id}" type="button" aria-pressed="${active}">
      <div class="chip-row">${chip(item.riskLevel)}${chip(item.type, typeClass(item.type))}</div>
      <h3>${item.title}</h3>
      <p>${item.course}</p>
      <div class="assignment-facts">
        <span><strong>Due</strong><time datetime="${item.dueDate}">${formatDate(item.dueDate)} - ${item.dueLabel}</time></span>
        <span><strong>Estimate</strong>${item.estimatedHours} hours</span>
      </div>
      <div class="progress-line" aria-label="${item.completionPercentage}% complete"><span style="--w:${item.completionPercentage}%"></span></div>
      <div class="meta">${item.completionPercentage}% complete</div>
    </button>
  `;
}

function assignmentDetail(item) {
  const intelligence = item.intelligence;
  const list = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  return `
    <article class="card detail-panel">
      <div class="eyebrow">Assignment Intelligence</div>
      <div class="chip-row">${chip(item.riskLevel)}${chip(item.type, typeClass(item.type))}${chip(item.dueLabel, 'blue')}</div>
      <h2>${item.title}</h2>
      <p>${item.course} - ${item.estimatedHours} estimated hours - ${item.completionPercentage}% complete</p>
      <div class="next-action" style="margin-top:16px;padding:18px;border-radius:22px">
        <div class="eyebrow" style="color:#8cf0de">Summary</div>
        <p>${intelligence.summary}</p>
      </div>
      <div class="detail-grid">
        <div class="mini-box"><strong>Requirements</strong>${list(intelligence.requirements)}</div>
        <div class="mini-box"><strong>Suggested Outline</strong>${list(intelligence.suggestedOutline)}</div>
        <div class="mini-box"><strong>Materials</strong>${list(intelligence.materials)}</div>
        <div class="mini-box"><strong>Risks</strong>${list(intelligence.risks)}</div>
      </div>
      <div class="mini-box" style="margin-top:12px">
        <strong>Milestones</strong>
        ${list(intelligence.milestones.map((m) => `${m.done ? 'Done' : 'Todo'}: ${m.label}`))}
      </div>
      <div class="mini-box" style="margin-top:12px;background:var(--teal-soft)">
        <strong>Recommended Actions</strong>
        ${list(intelligence.recommendedActions)}
      </div>
    </article>
  `;
}

async function selectAssignment(id) {
  state.selectedAssignment = id;
  if (state.assignmentDetails[id]) {
    render();
    return;
  }
  state.assignmentLoading = true;
  render();
  try {
    state.assignmentDetails[id] = await api(`/assignments/${encodeURIComponent(id)}`);
  } catch (error) {
    toast('Could not load assignment details');
  } finally {
    state.assignmentLoading = false;
    render();
  }
}

function renderGapsPage() {
  main.innerHTML = pageShell('Learning Gaps', 'See which topics need work before the next deadline.', `
    <div class="two-col">
      ${state.gaps.map((gap) => `
        <article class="gap-card">
          <div class="mastery-orb">${gap.mastery}%</div>
          <div>
            <div class="chip-row">${chip(gap.course, courseClass(gap.course))}${abilityChip(gap.mastery)}</div>
            <h3>${gap.topic}</h3>
            <p><strong>Where it matters:</strong> ${gap.whereItMatters}</p>
            <p><strong>When:</strong> ${gap.whenItMatters}</p>
            <p><strong>Recommended fix:</strong> ${gap.recommendedFix}</p>
            <p><strong>Just start:</strong> ${gap.justStart}</p>
            ${gap.linkedAssignment ? `<p><strong>Linked assignment:</strong> ${gap.linkedAssignment.title} - ${gap.linkedAssignment.dueLabel}</p>` : ''}
          </div>
        </article>
      `).join('')}
    </div>
  `);
}

function renderCalendarPage() {
  main.innerHTML = pageShell('Academic Pressure Calendar', 'See what is coming up and when to work on it.', `
    <div class="card">
      <div class="timeline">
        ${state.calendar.map((item) => `
          <article class="timeline-item">
            <div class="meta">${item.day}</div>
            <div>
              <div class="chip-row">${chip(item.label, item.type === 'test' ? 'lav' : item.type === 'study' ? 'teal' : 'blue')}${pressureChip(item.pressure)}</div>
              <h3>${item.title}</h3>
              <p>${item.type === 'study' ? 'Study this tonight.' : 'Waiting will make this harder.'}</p>
            </div>
            <span class="pressure ${item.pressure}"></span>
          </article>
        `).join('')}
      </div>
    </div>
  `);
}

function renderSettingsPage() {
  main.innerHTML = pageShell('Settings', 'Choose how The Hub works for you.', `
    <div class="settings-grid">
      ${googleSettingRow()}
      ${settingRow('Academic integrity mode', 'The Hub plans and teaches starts. It does not produce submissions.', 'integrity')}
      <div class="setting-row">
        <div><strong>Preferred study block length</strong><p>${state.settings.blockLength} minutes</p></div>
        <button class="ghost-button" data-cycle-block type="button">Change</button>
      </div>
      <div class="setting-row">
        <div><strong>Default energy mode</strong><p>${labelFor(state.settings.defaultEnergy, energyOptions)}</p></div>
        <button class="ghost-button" data-cycle-energy type="button">Change</button>
      </div>
    </div>
  `);
}

function googleSettingRow() {
  const c = state.classroom;
  if (c.connected) {
    const courses = c.courses || [];
    const courseList = courses.length ? `
      <div class="classroom-list">
        ${courses.map((course) => {
          const next = (course.coursework || [])
            .filter((w) => w.dueDate)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
          return `
            <div class="classroom-course">
              <div class="chip-row">${chip(course.name, 'blue')}${chip(`${(course.coursework || []).length} items`)}</div>
              ${course.section ? `<small>${course.section}</small>` : ''}
              ${next ? `<p>Next due: <strong>${next.title}</strong> - ${formatDate(next.dueDate)}</p>` : '<p>No upcoming coursework with due dates.</p>'}
            </div>
          `;
        }).join('')}
      </div>
    ` : '<p class="meta">No active courses returned from Google Classroom.</p>';
    return `
      <div class="setting-row classroom-row">
        <div>
          <strong>Google Classroom</strong>
          <p>Connected as ${c.email || c.name || 'your Google account'} - ${courses.length} ${courses.length === 1 ? 'course' : 'courses'} imported.</p>
          ${courseList}
        </div>
        <button class="ghost-button" data-google-disconnect type="button">Disconnect</button>
      </div>
    `;
  }
  const note = c.configured === false
    ? 'Server is missing Google credentials. Add them to server/secrets.json.'
    : 'Connect your Google Classroom to import real courses and coursework.';
  return `
    <div class="setting-row">
      <div><strong>Google Classroom</strong><p>${note}</p></div>
      <button class="primary-button" data-google-connect type="button" ${c.configured === false ? 'disabled' : ''}>Connect</button>
    </div>
  `;
}

function settingRow(title, detail, key) {
  return `
    <div class="setting-row">
      <div><strong>${title}</strong><p>${detail}</p></div>
      <button class="toggle ${state.settings[key] ? 'on' : ''}" data-setting="${key}" type="button" role="switch" aria-checked="${state.settings[key]}" aria-label="${title}"></button>
    </div>
  `;
}

function labelFor(id, options) {
  return (options.find((x) => x[0] === id) || [id, id])[1];
}

function renderCoach() {
  $('#coachPanel').hidden = !state.coachOpen;
  $('#coachFab').setAttribute('aria-expanded', String(state.coachOpen));
  $('#coachLog').innerHTML = state.coachMessages.map((message) => `
    <div class="message ${message.role === 'user' ? 'user' : ''}">${message.text}</div>
  `).join('');
  $('#coachChips').innerHTML = coachPrompts.map((prompt) => `<button type="button" data-coach-prompt="${prompt}">${prompt}</button>`).join('');
}

async function generatePlan() {
  const minutes = state.time === 'custom' ? Number(state.customTime) : Number(state.time);
  if (!Number.isFinite(minutes) || minutes < 15 || minutes > 240) {
    toast('Choose a time between 15 and 240 minutes');
    $('#customTimeInput')?.focus();
    return;
  }
  state.loadingPlan = true;
  render();
  try {
    state.plan = await api('/plan-night', {
      method: 'POST',
      body: JSON.stringify({ availableMinutes: minutes, energy: state.energy, goal: state.goal })
    });
    state.startedActivities = [];
    toast('Plan ready');
  } catch (error) {
    toast('Could not generate the plan. Try again.');
  } finally {
    state.loadingPlan = false;
    render();
  }
}

async function sendCoach(message) {
  const text = String(message || '').trim();
  if (!text) return;
  state.coachMessages.push({ role: 'user', text });
  renderCoach();
  try {
    const response = await api('/coach', {
      method: 'POST',
      body: JSON.stringify({ message: text })
    });
    const planLine = response.plan.slice(0, 3).map((item) => `${item.title} (${item.minutes} min)`).join('; ');
    state.coachMessages.push({
      role: 'assistant',
      text: `${response.answer} Plan: ${planLine}. Skip: ${response.skipTonight[0].title} Just start: ${response.justStart.step}`
    });
  } catch (error) {
    state.coachMessages.push({ role: 'assistant', text: 'I could not reach the planning endpoint. Demo Mode is still safe, but the server may need to restart.' });
  }
  renderCoach();
}

function connectGoogle() {
  window.location.href = '/auth/google';
}

async function disconnectGoogle() {
  try {
    await api('/classroom/disconnect', { method: 'POST', body: '{}' });
  } catch (error) {
    // ignore; reset locally anyway
  }
  state.classroom = { connected: false, configured: state.classroom.configured, email: null, name: null, courses: [] };
  state.settings.google = false;
  toast('Disconnected Google Classroom');
  render();
}

async function loadClassroom() {
  try {
    const status = await api('/classroom/status');
    if (status.connected) {
      state.classroom = await api('/classroom');
    } else {
      state.classroom = { ...state.classroom, ...status, courses: [] };
    }
    state.settings.google = !!state.classroom.connected;
  } catch (error) {
    // leave defaults
  }
}

function handleGoogleReturn() {
  const params = new URLSearchParams(window.location.search);
  const result = params.get('google');
  if (!result) return;
  const messages = {
    connected: 'Google Classroom connected',
    error: 'Google Classroom connection failed. Try again.',
    unconfigured: 'Google credentials are not configured on the server.'
  };
  if (messages[result]) toast(messages[result]);
  // Clean the query string so a refresh does not re-toast.
  window.history.replaceState({}, '', window.location.pathname);
}

function render() {
  renderNav();
  renderProfile();
  renderTonightProgress();
  if (state.page === 'plan') renderPlanPage();
  if (state.page === 'radar') renderRadarPage();
  if (state.page === 'gaps') renderGapsPage();
  if (state.page === 'calendar') renderCalendarPage();
  if (state.page === 'settings') renderSettingsPage();
  renderCoach();
  renderSession();
}

async function loadData() {
  handleGoogleReturn();
  await loadClassroom();
  try {
    const data = await api('/bootstrap');
    state.profile = data.profile;
    state.assignments = data.assignments;
    state.gaps = data.gaps;
    state.calendar = data.calendar;
    state.selectedAssignment = data.assignments[0]?.id || null;
    if (state.selectedAssignment) {
      state.assignmentDetails[state.selectedAssignment] = await api(`/assignments/${encodeURIComponent(state.selectedAssignment)}`);
    }
  } catch (error) {
    toast('Demo data failed to load');
  }
  render();
}

document.addEventListener('click', (event) => {
  const pageBtn = event.target.closest('[data-page]');
  if (pageBtn) {
    state.page = pageBtn.dataset.page;
    render();
    main.focus();
  }

  const optionBtn = event.target.closest('[data-option]');
  if (optionBtn) {
    const key = optionBtn.dataset.optionKey;
    let value = optionBtn.dataset.option;
    if (key === 'time' && value !== 'custom') value = Number(value);
    state[key] = value;
    updatePlanOptions(key);
  }

  const assignmentBtn = event.target.closest('[data-assignment]');
  if (assignmentBtn) {
    selectAssignment(assignmentBtn.dataset.assignment);
  }

  if (event.target.closest('[data-session-open]')) { openSession(); return; }
  if (event.target.closest('[data-session-exit]')) { closeSession(); return; }
  if (event.target.closest('[data-session-finish]')) { closeSession(); return; }
  if (event.target.closest('[data-session-next]')) { sessionNext(); return; }
  if (event.target.closest('[data-session-back]')) { sessionBack(); return; }
  const jumpBtn = event.target.closest('[data-session-jump]');
  if (jumpBtn) { sessionGo(Number(jumpBtn.dataset.sessionJump)); return; }
  const doneBtn = event.target.closest('[data-session-done]');
  if (doneBtn) { sessionMarkDone(doneBtn.dataset.sessionDone); return; }
  if (event.target.closest('[data-session-ref]')) {
    state.session.refOpen = !state.session.refOpen;
    renderSession();
    return;
  }

  const startBtn = event.target.closest('[data-start-activity]');
  if (startBtn) {
    const id = startBtn.dataset.startActivity;
    if (!state.startedActivities.includes(id)) state.startedActivities.push(id);
    renderTonightProgress();
    if (state.page === 'plan') renderPlanPage();
    toast(startBtn.dataset.startStep);
  }

  if (event.target.closest('[data-google-connect]')) { connectGoogle(); return; }
  if (event.target.closest('[data-google-disconnect]')) { disconnectGoogle(); return; }

  const settingBtn = event.target.closest('[data-setting]');
  if (settingBtn) {
    const key = settingBtn.dataset.setting;
    state.settings[key] = !state.settings[key];
    render();
  }

  if (event.target.closest('[data-cycle-block]')) {
    const values = [15, 20, 25, 30, 45];
    const next = values[(values.indexOf(state.settings.blockLength) + 1) % values.length];
    state.settings.blockLength = next;
    render();
  }

  if (event.target.closest('[data-cycle-energy]')) {
    const values = energyOptions.map((x) => x[0]);
    state.settings.defaultEnergy = values[(values.indexOf(state.settings.defaultEnergy) + 1) % values.length];
    render();
  }

  const promptBtn = event.target.closest('[data-coach-prompt]');
  if (promptBtn) {
    $('#coachInput').value = promptBtn.dataset.coachPrompt;
    $('#coachInput').focus();
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'customTimeInput') {
    state.customTime = Number(event.target.value || 75);
  }
});

document.addEventListener('submit', (event) => {
  if (event.target.id === 'planForm') {
    event.preventDefault();
    generatePlan();
  }
  if (event.target.id === 'coachForm') {
    event.preventDefault();
    const input = $('#coachInput');
    sendCoach(input.value);
    input.value = '';
  }
});

$('#profileButton').addEventListener('click', () => {
  state.profileOpen = !state.profileOpen;
  state.coachOpen = false;
  renderProfile();
  renderCoach();
});
$('#notifyBtn').addEventListener('click', () => toast('No new alerts. Chemistry still needs attention tonight.'));
$('#syncGoogleBtn').addEventListener('click', () => {
  if (state.classroom.connected) disconnectGoogle();
  else connectGoogle();
});
$('#signOutBtn').addEventListener('click', () => {
  state.signedIn = false;
  state.profileOpen = false;
  render();
});
$('#signInBtn').addEventListener('click', () => {
  state.signedIn = true;
  state.profileOpen = false;
  toast('Demo sign-in restored');
  render();
});
$('#coachFab').addEventListener('click', () => {
  state.coachOpen = true;
  state.profileOpen = false;
  renderProfile();
  renderCoach();
  requestAnimationFrame(() => $('#coachInput').focus());
});
$('#closeCoachBtn').addEventListener('click', () => {
  state.coachOpen = false;
  renderCoach();
});
document.addEventListener('keydown', (event) => {
  if (state.session.open) {
    if (event.key === 'Escape') {
      if (state.session.refOpen) { state.session.refOpen = false; renderSession(); }
      else closeSession();
      return;
    }
    if (event.key === 'ArrowRight') { sessionNext(); return; }
    if (event.key === 'ArrowLeft') { sessionBack(); return; }
    return;
  }
  if (event.target.id === 'searchInput' && event.key === 'Enter') {
    const query = event.target.value.trim().toLowerCase();
    const match = navItems.find(([, label]) => label.toLowerCase().includes(query));
    if (match && query) {
      state.page = match[0];
      render();
      main.focus();
    } else {
      toast(query ? 'No matching Hub page' : 'Type a page name to search');
    }
  }
  if (event.key === 'Escape') {
    state.profileOpen = false;
    state.coachOpen = false;
    render();
  }
});

// Idle ambient motion: when the user goes still on a data screen, gently
// animate the sticky notes, flashcards and tabs. Any input wakes it back up.
let idleTimer;
function setIdle(on) {
  document.body.classList.toggle('is-idle', on);
}
function pokeIdle() {
  setIdle(false);
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => setIdle(true), 4000);
}
['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'focusin'].forEach((evt) => {
  document.addEventListener(evt, pokeIdle, { passive: true });
});
pokeIdle();

loadData();
