const fs = require('fs');
const path = require('path');

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const CLASSROOM = 'https://classroom.googleapis.com/v1';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly'
];

// In-memory single-user session (demo scope). Holds tokens + imported data.
const store = {
  tokens: null,
  expiresAt: 0,
  profile: null,
  courses: []
};

function loadConfig() {
  let fileConfig = {};
  try {
    fileConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'secrets.json'), 'utf8'));
  } catch (error) {
    fileConfig = {};
  }
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || fileConfig.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || fileConfig.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || fileConfig.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
  };
}

function isConfigured() {
  const { clientId, clientSecret } = loadConfig();
  return Boolean(clientId && clientSecret);
}

function buildAuthUrl(state = 'hub') {
  const { clientId, redirectUri } = loadConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function exchangeCode(code) {
  const { clientId, clientSecret, redirectUri } = loadConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || 'Token exchange failed');
  store.tokens = data;
  store.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return data;
}

async function authedGet(url) {
  if (!store.tokens) throw new Error('Not connected');
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${store.tokens.access_token}` }
  });
  if (response.status === 401) throw new Error('Google session expired. Reconnect.');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Google API request failed');
  return data;
}

function formatDue(dueDate) {
  if (!dueDate) return null;
  const { year, month, day } = dueDate;
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

async function importClassroom() {
  const me = await authedGet(USERINFO_URL);
  store.profile = { name: me.name, email: me.email, picture: me.picture };

  const courseData = await authedGet(`${CLASSROOM}/courses?courseStates=ACTIVE&pageSize=20`);
  const courses = courseData.courses || [];

  const enriched = [];
  for (const course of courses) {
    let coursework = [];
    try {
      const cw = await authedGet(`${CLASSROOM}/courses/${course.id}/courseWork?pageSize=20`);
      coursework = (cw.courseWork || []).map((work) => ({
        id: work.id,
        title: work.title,
        type: work.workType,
        dueDate: formatDue(work.dueDate),
        link: work.alternateLink,
        maxPoints: work.maxPoints || null
      }));
    } catch (error) {
      coursework = [];
    }
    enriched.push({
      id: course.id,
      name: course.name,
      section: course.section || '',
      room: course.room || '',
      link: course.alternateLink,
      coursework
    });
  }
  store.courses = enriched;
  return { profile: store.profile, courses: enriched };
}

function status() {
  return {
    connected: Boolean(store.tokens && store.profile),
    configured: isConfigured(),
    email: store.profile?.email || null,
    name: store.profile?.name || null,
    courseCount: store.courses.length
  };
}

function snapshot() {
  return {
    ...status(),
    courses: store.courses
  };
}

function disconnect() {
  store.tokens = null;
  store.expiresAt = 0;
  store.profile = null;
  store.courses = [];
}

module.exports = {
  isConfigured,
  buildAuthUrl,
  exchangeCode,
  importClassroom,
  status,
  snapshot,
  disconnect
};
