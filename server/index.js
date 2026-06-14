const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { profile, calendar } = require('./demoData');
const { getAssignmentCards, getAssignmentDetail, getLearningGaps } = require('./academicData');
const { buildPlan, coach } = require('./planner');
const googleAuth = require('./googleAuth');
const db = require('./db');

// Read app data from MongoDB when it is connected, else fall back to the
// in-memory demo data so the app always works.
async function getBootstrapData() {
  if (db.isConnected()) {
    const [mProfile, cards, gaps, cal] = await Promise.all([
      db.readProfile(), db.readCards(), db.readGaps(), db.readCalendar()
    ]);
    if (cards && gaps && cal) {
      return { profile: mProfile || profile, assignments: cards, gaps, calendar: cal };
    }
  }
  return { profile, assignments: getAssignmentCards(), gaps: getLearningGaps(), calendar };
}

async function getAssignmentDetailData(id) {
  if (db.isConnected()) {
    const detail = await db.readDetail(id);
    if (detail) return detail;
  }
  return getAssignmentDetail(id);
}

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 3000);

function send(res, status, body, type = 'application/json', headers = {}) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

function notFound(res) {
  send(res, 404, { error: 'Not found' });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function serveFile(req, res, file) {
  fs.readFile(file, (error, data) => {
    if (error) return notFound(res);
    const type = contentType(file);
    const cacheControl = file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600';
    const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    const compressible = type.startsWith('text/');

    if (acceptsGzip && compressible && data.length > 1024) {
      return zlib.gzip(data, (gzipError, compressed) => {
        if (gzipError) return send(res, 200, data, type, { 'Cache-Control': cacheControl });
        send(res, 200, compressed, type, {
          'Cache-Control': cacheControl,
          'Content-Encoding': 'gzip',
          'Content-Length': compressed.length,
          'Vary': 'Accept-Encoding'
        });
      });
    }

    send(res, 200, data, type, {
      'Cache-Control': cacheControl,
      'Content-Length': data.length,
      'Vary': 'Accept-Encoding'
    });
  });
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true });
  if (req.method === 'GET' && url.pathname === '/api/profile') return send(res, 200, profile);
  if (req.method === 'GET' && url.pathname === '/api/bootstrap') {
    return send(res, 200, await getBootstrapData());
  }
  if (req.method === 'GET' && url.pathname === '/api/assignments') return send(res, 200, getAssignmentCards());
  if (req.method === 'GET' && url.pathname.startsWith('/api/assignments/')) {
    const id = decodeURIComponent(url.pathname.split('/').pop());
    const assignment = await getAssignmentDetailData(id);
    return assignment ? send(res, 200, assignment) : notFound(res);
  }
  if (req.method === 'GET' && url.pathname === '/api/learning-gaps') return send(res, 200, getLearningGaps());
  if (req.method === 'GET' && url.pathname === '/api/calendar') return send(res, 200, calendar);
  if (req.method === 'POST' && url.pathname === '/api/plan-night') {
    const body = await readBody(req);
    const plan = buildPlan(body);
    db.savePlan(body, plan).catch((err) => console.warn('Plan persistence skipped:', err.message));
    return send(res, 200, plan);
  }
  if (req.method === 'GET' && url.pathname === '/api/db/status') {
    return send(res, 200, await db.status());
  }
  if (req.method === 'GET' && url.pathname === '/api/plans/recent') {
    return send(res, 200, await db.recentPlans());
  }
  if (req.method === 'POST' && url.pathname === '/api/coach') {
    const body = await readBody(req);
    return send(res, 200, coach(body.message));
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/google') {
    return send(res, 200, { status: 'demo', message: 'Google OAuth is optional. Demo Mode works without it.' });
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/google/callback') {
    return send(res, 200, { status: 'demo', message: 'OAuth callback placeholder for the MVP.' });
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/me') {
    return send(res, 200, { mode: 'demo', signedIn: true, profile });
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    return send(res, 200, { signedIn: false });
  }
  if (req.method === 'POST' && url.pathname === '/api/sync/google-classroom') {
    return send(res, 200, { status: 'demo', message: 'Demo data is already loaded. Configure Google keys for real sync later.' });
  }
  if (req.method === 'GET' && url.pathname === '/api/classroom/status') {
    return send(res, 200, googleAuth.status());
  }
  if (req.method === 'GET' && url.pathname === '/api/classroom') {
    return send(res, 200, googleAuth.snapshot());
  }
  if (req.method === 'POST' && url.pathname === '/api/classroom/disconnect') {
    googleAuth.disconnect();
    return send(res, 200, { connected: false });
  }
  return notFound(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);

    if (url.pathname === '/auth/google') {
      if (!googleAuth.isConfigured()) {
        res.writeHead(302, { Location: '/?google=unconfigured' });
        return res.end();
      }
      res.writeHead(302, { Location: googleAuth.buildAuthUrl() });
      return res.end();
    }

    if (url.pathname === '/auth/google/callback') {
      const error = url.searchParams.get('error');
      if (error) {
        res.writeHead(302, { Location: `/?google=error` });
        return res.end();
      }
      try {
        await googleAuth.exchangeCode(url.searchParams.get('code'));
        await googleAuth.importClassroom();
        res.writeHead(302, { Location: '/?google=connected' });
      } catch (err) {
        console.error('Google connect failed:', err.message);
        res.writeHead(302, { Location: '/?google=error' });
      }
      return res.end();
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return serveFile(req, res, path.join(root, 'The Hub.dc.html'));
    }

    const publicPath = path.join(root, 'public', decodeURIComponent(url.pathname.replace(/^\/+/, '')));
    if (!publicPath.startsWith(path.join(root, 'public'))) return notFound(res);
    if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) return serveFile(req, res, publicPath);

    return serveFile(req, res, path.join(root, 'The Hub.dc.html'));
  } catch (error) {
    send(res, 500, { error: error.message || 'Server error' });
  }
});

async function initDatabase() {
  const connected = await db.connect();
  if (!connected) {
    console.log('MongoDB not active - serving in-memory demo data.');
    return;
  }
  try {
    const cards = getAssignmentCards();
    await db.seed({
      profile,
      calendar,
      cards,
      details: cards.map((card) => getAssignmentDetail(card.id)),
      gaps: getLearningGaps()
    });
    const s = await db.status();
    console.log(`MongoDB connected (db: ${s.db}) - assignments:${s.counts?.assignments} gaps:${s.counts?.gaps} plans:${s.counts?.plans}`);
  } catch (err) {
    console.warn('MongoDB seed failed, falling back to in-memory:', err.message);
  }
}

server.listen(port, () => {
  console.log(`The Hub is running at http://localhost:${port}`);
  initDatabase();
});
