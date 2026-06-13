const state = {
  page: 'plan',
  time: 90,
  customTime: 75,
  energy: 'tired',
  goal: 'stay_on_track',
  selectedAssignment: null,
  plan: null,
  loadingPlan: false,
  assignments: [],
  gaps: [],
  calendar: [],
  progress: null,
  profile: null,
  demoMode: true,
  signedIn: true,
  profileOpen: false,
  coachOpen: false,
  coachMessages: [
    { role: 'assistant', text: 'Tell me your time and energy. I will help you lower pressure without doing the work for you.' }
  ],
  settings: {
    demo: true,
    google: false,
    integrity: true,
    blockLength: 25,
    defaultEnergy: 'tired'
  }
};

const navItems = [
  ['plan', 'Plan My Night', 'PM'],
  ['radar', 'Assignment Radar', 'AR'],
  ['gaps', 'Learning Gaps', 'LG'],
  ['calendar', 'Calendar', 'CA'],
  ['progress', 'Progress', 'PR'],
  ['settings', 'Settings', 'SE']
];

const energyOptions = [
  ['focused', 'Focused'],
  ['normal', 'Normal'],
  ['tired', 'Tired'],
  ['burned_out', 'Burned out'],
  ['essentials_only', 'Essentials only']
];

const goalOptions = [
  ['stay_on_track', 'Stay on track'],
  ['catch_up', 'Catch up'],
  ['improve_test_readiness', 'Improve test readiness'],
  ['avoid_panic', 'Avoid panic'],
  ['minimum_viable_night', 'Minimum viable night']
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

function renderNav() {
  $('#nav').innerHTML = navItems.map(([id, label, icon]) => `
    <button class="nav-button ${state.page === id ? 'active' : ''}" data-page="${id}" type="button">
      <span class="nav-icon">${icon}</span>
      <span>${label}</span>
    </button>
  `).join('');
}

function renderProfile() {
  $('#profileMenu').classList.toggle('open', state.profileOpen);
  $('#signedInProfile').hidden = !state.signedIn;
  $('#signedOutProfile').hidden = state.signedIn;
  $('#demoModeBtn').textContent = state.demoMode ? 'Demo Mode' : 'Live Mode';
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
  return `<button class="option ${active ? 'active' : ''}" type="button" data-option-key="${key}" data-option="${value}">${label}</button>`;
}

function renderPlanPage() {
  const output = state.loadingPlan ? loadingPlan() : state.plan ? planOutput(state.plan) : emptyPlan();
  main.innerHTML = `
    <section class="page">
      <div class="hero">
        <div class="hero-inner">
          <div>
            <div class="eyebrow">Know what to do next</div>
            <h1>Plan My Night</h1>
            <p>Tell The Hub how much time and energy you have. We will turn deadlines, weak topics, and pressure into the smartest plan for tonight.</p>
          </div>
          <div class="decision-card">
            <div class="eyebrow" style="color:#8cf0de">Tonight's decision</div>
            <h2 style="margin:10px 0 0">Stop guessing. Start the right thing.</h2>
            <div class="meter"><span></span></div>
            <div class="decision-mini">
              <strong>Current risk signal</strong>
              <small>Chemistry is pulling the week into danger zone.</small>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-grid">
        <form class="card" id="planForm">
          <div class="control-group">
            <div class="control-label">Available Time</div>
            <div class="option-grid">
              ${[30, 60, 90, 120].map((m) => optionButton(m, m === 120 ? '2 hours' : `${m} min`, state.time === m, 'time')).join('')}
              ${optionButton('custom', 'Custom', state.time === 'custom', 'time')}
            </div>
          </div>
          <div class="custom-row ${state.time === 'custom' ? 'open' : ''}">
            <input id="customTimeInput" type="number" min="15" max="240" value="${state.customTime}">
            <span class="meta">minutes</span>
          </div>
          <div class="control-group">
            <div class="control-label">Energy Level</div>
            <div class="option-grid compact">
              ${energyOptions.map(([id, label]) => optionButton(id, label, state.energy === id, 'energy')).join('')}
            </div>
          </div>
          <div class="control-group">
            <div class="control-label">Tonight's Goal</div>
            <div class="option-grid compact">
              ${goalOptions.map(([id, label]) => optionButton(id, label, state.goal === id, 'goal')).join('')}
            </div>
          </div>
          <button class="primary-button wide" type="submit">${state.loadingPlan ? 'Generating...' : 'Generate My Plan'}</button>
        </form>
        <div class="output-stack">${output}</div>
      </div>
    </section>
  `;
}

function emptyPlan() {
  return `
    <div class="empty-state">
      <div>
        <div class="eyebrow">Waiting for inputs</div>
        <h2>Your plan will appear here.</h2>
        <p>For the demo, choose 90 minutes, Tired, and Stay on track.</p>
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
      <div class="eyebrow" style="color:#8cf0de">Next Best Action</div>
      <h2>${result.nextBestAction.title}</h2>
      <p><strong>${result.nextBestAction.minutes} minutes</strong> - ${result.nextBestAction.why}</p>
      <button class="ghost-button" data-just-start type="button">Just Start</button>
    </div>
    <div class="card">
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
            <button class="ghost-button" data-start-step="${escapeAttr(item.startStep)}" type="button">Start</button>
          </article>
        `).join('')}
      </div>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="eyebrow">What Not To Do Tonight</div>
        ${result.skipTonight.map((item) => `<div class="mini-box" style="margin-top:10px"><strong>${item.title}</strong><p>${item.reason}</p></div>`).join('')}
      </div>
      <div class="card">
        <div class="eyebrow">Just Start Mode</div>
        <h3>${result.justStart.title}</h3>
        <p>${result.justStart.step}</p>
      </div>
    </div>
    <div class="card">
      <div class="eyebrow">Panic Prevention</div>
      <div class="timeline" style="margin-top:12px">
        ${result.panicWarnings.map((warning) => `
          <article class="timeline-item">
            <div class="meta">${warning.due}</div>
            <div><strong>${warning.title}</strong><p>${warning.message}</p></div>
            ${chip(warning.zone)}
          </article>
        `).join('')}
      </div>
    </div>
    ${recovery}
  `;
}

function escapeAttr(text) {
  return String(text).replace(/"/g, '&quot;');
}

function renderRadarPage() {
  if (!state.selectedAssignment && state.assignments.length) state.selectedAssignment = state.assignments[0].id;
  const selected = state.assignments.find((item) => item.id === state.selectedAssignment) || state.assignments[0];
  main.innerHTML = pageShell('Assignment Radar', 'Every card shows pressure, next action, and what could go wrong.', `
    <div class="assignment-grid">
      <div class="assignment-list">
        ${state.assignments.map((item) => assignmentCard(item, selected && selected.id === item.id)).join('')}
      </div>
      ${selected ? assignmentDetail(selected) : '<div class="card">No assignment selected.</div>'}
    </div>
  `);
}

function assignmentCard(item, active) {
  return `
    <button class="assignment-card ${active ? 'active' : ''}" data-assignment="${item.id}" type="button">
      <div class="chip-row">${chip(item.risk)}${chip(item.zone)}</div>
      <h3>${item.title}</h3>
      <p>${item.course} - ${item.type} - ${item.dueLabel}</p>
      <div class="progress-line"><span style="--w:${item.completion}%"></span></div>
      <div class="meta">${item.completion}% complete - ${item.remainingHours}h remaining</div>
      <p><strong>Next:</strong> ${item.recommendedNextAction}</p>
    </button>
  `;
}

function assignmentDetail(item) {
  const list = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  return `
    <article class="card detail-panel">
      <div class="chip-row">${chip(item.risk)}${chip(item.zone)}${chip(item.dueLabel, 'blue')}</div>
      <h2>${item.title}</h2>
      <p>${item.course} - ${item.type}</p>
      <div class="next-action" style="margin-top:16px;padding:18px;border-radius:22px">
        <div class="eyebrow" style="color:#8cf0de">Next Best Action</div>
        <h3>${item.recommendedNextAction}</h3>
        <p>${item.justStart}</p>
      </div>
      <div class="detail-grid">
        <div class="mini-box"><strong>Requirements</strong>${list(item.requirements)}</div>
        <div class="mini-box"><strong>Suggested outline</strong>${list(item.outline)}</div>
        <div class="mini-box"><strong>Materials</strong>${list(item.materials)}</div>
        <div class="mini-box"><strong>Risks</strong>${list(item.risks)}</div>
      </div>
      <div class="mini-box" style="margin-top:12px">
        <strong>Milestones</strong>
        ${list(item.milestones.map((m) => `${m.done ? 'Done' : 'Todo'}: ${m.label}`))}
      </div>
      <div class="mini-box" style="margin-top:12px;background:var(--teal-soft)">
        <strong>Academic integrity note</strong>
        <p>The Hub helps you plan and start the work. It does not complete assignments for you.</p>
      </div>
    </article>
  `;
}

function renderGapsPage() {
  main.innerHTML = pageShell('Learning Gaps', 'Weak concepts are connected to upcoming consequences, not shown as vague analytics.', `
    <div class="two-col">
      ${state.gaps.map((gap) => `
        <article class="gap-card">
          <div class="mastery-orb">${gap.mastery}%</div>
          <div>
            <div class="chip-row">${chip(gap.course, 'blue')}${chip(gap.mastery < 50 ? 'Weak' : gap.mastery < 65 ? 'Developing' : 'Stable')}</div>
            <h3>${gap.topic}</h3>
            <p><strong>Where it matters:</strong> ${gap.whereItMatters}</p>
            <p><strong>When:</strong> ${gap.whenItMatters}</p>
            <p><strong>Recommended fix:</strong> ${gap.recommendedFix}</p>
            <p><strong>Just start:</strong> ${gap.justStart}</p>
          </div>
        </article>
      `).join('')}
    </div>
  `);
}

function renderCalendarPage() {
  main.innerHTML = pageShell('Academic Pressure Calendar', 'A simple timeline that shows pressure, not just dates.', `
    <div class="card">
      <div class="timeline">
        ${state.calendar.map((item) => `
          <article class="timeline-item">
            <div class="meta">${item.day}</div>
            <div>
              <div class="chip-row">${chip(item.label, 'blue')}${chip(item.pressure)}</div>
              <h3>${item.title}</h3>
              <p>${item.type === 'study' ? 'Recommended study block generated from tonight pressure.' : 'Pressure increases if this stays untouched.'}</p>
            </div>
            <span class="pressure ${item.pressure}"></span>
          </article>
        `).join('')}
      </div>
    </div>
  `);
}

function renderProgressPage() {
  const p = state.progress || {};
  main.innerHTML = pageShell('Progress', 'Simple proof that the student is reducing pressure, not just clicking around.', `
    <div class="three-col">
      ${progressCard('Tasks completed', p.tasksCompletedThisWeek, 'this week')}
      ${progressCard('Panic zones avoided', p.panicZonesAvoided, 'by starting earlier')}
      ${progressCard('Study minutes', p.studyMinutesCompleted, 'completed')}
    </div>
    <div class="two-col" style="margin-top:18px">
      <div class="card">
        <div class="eyebrow">Readiness trend</div>
        <div class="progress-line" style="height:14px;margin-top:18px"><span style="--w:74%"></span></div>
        <p>${(p.readinessTrend || []).join(' -> ')}</p>
      </div>
      <div class="card">
        <div class="eyebrow">Signals</div>
        <h3>Hardest concept: ${p.hardestConcept || 'Loading'}</h3>
        <h3>Most improved: ${p.mostImprovedConcept || 'Loading'}</h3>
      </div>
    </div>
  `);
}

function progressCard(title, value, label) {
  return `<article class="progress-card"><div class="eyebrow">${title}</div><h1 style="font-size:54px;margin:10px 0">${value ?? '-'}</h1><p>${label}</p></article>`;
}

function renderSettingsPage() {
  main.innerHTML = pageShell('Settings', 'Keep the MVP demo-first, safe, and configurable.', `
    <div class="settings-grid">
      ${settingRow('Demo Mode', 'Preload realistic student data so the pitch never depends on Google.', 'demo')}
      ${settingRow('Google connection status', 'Optional future sync. Demo Mode works perfectly without it.', 'google')}
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

function settingRow(title, detail, key) {
  return `
    <div class="setting-row">
      <div><strong>${title}</strong><p>${detail}</p></div>
      <button class="toggle ${state.settings[key] ? 'on' : ''}" data-setting="${key}" type="button" aria-label="${title}"></button>
    </div>
  `;
}

function labelFor(id, options) {
  return (options.find((x) => x[0] === id) || [id, id])[1];
}

function renderCoach() {
  $('#coachPanel').classList.toggle('open', state.coachOpen);
  $('#coachLog').innerHTML = state.coachMessages.map((message) => `
    <div class="message ${message.role === 'user' ? 'user' : ''}">${message.text}</div>
  `).join('');
  $('#coachChips').innerHTML = coachPrompts.map((prompt) => `<button type="button" data-coach-prompt="${prompt}">${prompt}</button>`).join('');
}

async function generatePlan() {
  state.loadingPlan = true;
  render();
  try {
    const minutes = state.time === 'custom' ? Number(state.customTime) : Number(state.time);
    state.plan = await api('/plan-night', {
      method: 'POST',
      body: JSON.stringify({ availableMinutes: minutes, energy: state.energy, goal: state.goal })
    });
    toast('Plan generated');
  } catch (error) {
    toast('Could not generate plan');
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

function render() {
  renderNav();
  renderProfile();
  if (state.page === 'plan') renderPlanPage();
  if (state.page === 'radar') renderRadarPage();
  if (state.page === 'gaps') renderGapsPage();
  if (state.page === 'calendar') renderCalendarPage();
  if (state.page === 'progress') renderProgressPage();
  if (state.page === 'settings') renderSettingsPage();
  renderCoach();
}

async function loadData() {
  try {
    const [profile, assignments, gaps, calendar, progress] = await Promise.all([
      api('/profile'),
      api('/assignments'),
      api('/learning-gaps'),
      api('/calendar'),
      api('/progress')
    ]);
    state.profile = profile;
    state.assignments = assignments;
    state.gaps = gaps;
    state.calendar = calendar;
    state.progress = progress;
    state.selectedAssignment = assignments[0]?.id || null;
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
    render();
  }

  const assignmentBtn = event.target.closest('[data-assignment]');
  if (assignmentBtn) {
    state.selectedAssignment = assignmentBtn.dataset.assignment;
    render();
  }

  const startBtn = event.target.closest('[data-start-step]');
  if (startBtn) toast(startBtn.dataset.startStep);
  if (event.target.closest('[data-just-start]') && state.plan?.justStart) toast(state.plan.justStart.step);

  const settingBtn = event.target.closest('[data-setting]');
  if (settingBtn) {
    const key = settingBtn.dataset.setting;
    state.settings[key] = !state.settings[key];
    if (key === 'demo') state.demoMode = state.settings.demo;
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
  renderProfile();
});
$('#demoModeBtn').addEventListener('click', () => {
  state.demoMode = !state.demoMode;
  state.settings.demo = state.demoMode;
  toast(state.demoMode ? 'Demo Mode enabled' : 'Live Mode placeholder');
  render();
});
$('#notifyBtn').addEventListener('click', () => toast('No new alerts. Chemistry still needs attention tonight.'));
$('#syncGoogleBtn').addEventListener('click', async () => {
  await api('/sync/google-classroom', { method: 'POST', body: '{}' });
  toast('Demo data is already synced');
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
$('#continueDemoBtn').addEventListener('click', () => {
  state.demoMode = true;
  state.profileOpen = false;
  toast('Continuing in Demo Mode');
  render();
});
$('#coachFab').addEventListener('click', () => {
  state.coachOpen = true;
  renderCoach();
});
$('#closeCoachBtn').addEventListener('click', () => {
  state.coachOpen = false;
  renderCoach();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    state.profileOpen = false;
    state.coachOpen = false;
    render();
  }
});

loadData();
