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
  gaps: [],
  calendar: [],
  startedActivities: [],
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
  ['settings', 'Settings', 'SE']
];

const energyOptions = [
  ['focused', 'Focused'],
  ['normal', 'Normal'],
  ['tired', 'Tired'],
  ['essentials_only', 'Essentials only']
];

const goalOptions = [
  ['stay_on_track', 'Stay on track'],
  ['catch_up', 'Catch up'],
  ['improve_test_readiness', 'Improve test readiness'],
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
  $('#demoModeBtn').textContent = state.demoMode ? 'Demo Mode' : 'Live Mode';
  $('#demoModeBtn').setAttribute('aria-pressed', String(state.demoMode));
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
            <div class="eyebrow">Know what to do next</div>
            <h1>Plan My Night</h1>
            <p>Tell The Hub how much time and energy you have. We will turn deadlines, weak topics, and pressure into the smartest plan for tonight.</p>
          </div>
          <div class="decision-card">
            <div class="eyebrow" style="color:#8cf0de">Tonight's decision</div>
            <h2 style="margin:10px 0 0">Stop guessing. Start the right thing.</h2>
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
          <button class="primary-button wide" type="submit" ${state.loadingPlan ? 'disabled aria-busy="true"' : ''}>${state.loadingPlan ? 'Generating...' : 'Generate My Plan'}</button>
        </form>
        <div class="output-stack" aria-live="polite" aria-busy="${state.loadingPlan}">${output}</div>
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
        <p>For the demo, choose 60 minutes, Tired, and Stay on track.</p>
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
      <button class="ghost-button" data-start-activity="${result.plan[0].id}" data-start-step="${escapeAttr(result.justStart.step)}" type="button" aria-pressed="${state.startedActivities.includes(result.plan[0].id)}">${state.startedActivities.includes(result.plan[0].id) ? 'Started' : 'Just Start'}</button>
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
            <button class="ghost-button" data-start-activity="${item.id}" data-start-step="${escapeAttr(item.startStep)}" type="button" aria-pressed="${state.startedActivities.includes(item.id)}">${state.startedActivities.includes(item.id) ? 'Started' : 'Start'}</button>
          </article>
        `).join('')}
      </div>
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
    <button class="assignment-card ${active ? 'active' : ''}" data-assignment="${item.id}" type="button" aria-pressed="${active}">
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
    toast('Plan generated');
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
}

async function loadData() {
  try {
    const data = await api('/bootstrap');
    state.profile = data.profile;
    state.assignments = data.assignments;
    state.gaps = data.gaps;
    state.calendar = data.calendar;
    state.selectedAssignment = data.assignments[0]?.id || null;
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
    state.selectedAssignment = assignmentBtn.dataset.assignment;
    render();
  }

  const startBtn = event.target.closest('[data-start-activity]');
  if (startBtn) {
    const id = startBtn.dataset.startActivity;
    if (!state.startedActivities.includes(id)) state.startedActivities.push(id);
    renderTonightProgress();
    if (state.page === 'plan') renderPlanPage();
    toast(startBtn.dataset.startStep);
  }

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
  state.coachOpen = false;
  renderProfile();
  renderCoach();
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
  state.profileOpen = false;
  renderProfile();
  renderCoach();
});
$('#closeCoachBtn').addEventListener('click', () => {
  state.coachOpen = false;
  renderCoach();
});
document.addEventListener('keydown', (event) => {
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
