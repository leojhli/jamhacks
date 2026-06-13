const http = require('http');
const fs = require('fs');
const path = require('path');
const { profile, assignments, learningGaps, calendar, progress } = require('./demoData');
const { buildPlan, coach } = require('./planner');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 3000);

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store'
  });
  res.end(type === 'application/json' ? JSON.stringify(body, null, 2) : body);
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

function serveFile(res, file) {
  fs.readFile(file, (error, data) => {
    if (error) return notFound(res);
    send(res, 200, data, contentType(file));
  });
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true });
  if (req.method === 'GET' && url.pathname === '/api/profile') return send(res, 200, profile);
  if (req.method === 'GET' && url.pathname === '/api/assignments') return send(res, 200, assignments);
  if (req.method === 'GET' && url.pathname.startsWith('/api/assignments/')) {
    const id = decodeURIComponent(url.pathname.split('/').pop());
    const assignment = assignments.find((item) => item.id === id);
    return assignment ? send(res, 200, assignment) : notFound(res);
  }
  if (req.method === 'GET' && url.pathname === '/api/learning-gaps') return send(res, 200, learningGaps);
  if (req.method === 'GET' && url.pathname === '/api/calendar') return send(res, 200, calendar);
  if (req.method === 'GET' && url.pathname === '/api/progress') return send(res, 200, progress);
  if (req.method === 'POST' && url.pathname === '/api/plan-night') {
    const body = await readBody(req);
    return send(res, 200, buildPlan(body));
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
  return notFound(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return serveFile(res, path.join(root, 'The Hub.dc.html'));
    }

    const publicPath = path.join(root, 'public', decodeURIComponent(url.pathname.replace(/^\/+/, '')));
    if (!publicPath.startsWith(path.join(root, 'public'))) return notFound(res);
    if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) return serveFile(res, publicPath);

    return serveFile(res, path.join(root, 'The Hub.dc.html'));
  } catch (error) {
    send(res, 500, { error: error.message || 'Server error' });
  }
});

server.listen(port, () => {
  console.log(`The Hub is running at http://localhost:${port}`);
});
