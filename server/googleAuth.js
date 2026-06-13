// Demo-safe Google Classroom boundary. Real OAuth/import behavior can replace
// this module later without changing the server routes or frontend contract.
const emptySnapshot = () => ({
  connected: false,
  configured: false,
  email: null,
  name: null,
  courses: []
});

function isConfigured() {
  return false;
}

function status() {
  return { connected: false, configured: false };
}

function snapshot() {
  return emptySnapshot();
}

function disconnect() {}

function buildAuthUrl() {
  return '/?google=unconfigured';
}

async function exchangeCode() {
  throw new Error('Google Classroom is not configured in Demo Mode.');
}

async function importClassroom() {
  return emptySnapshot();
}

module.exports = {
  isConfigured,
  status,
  snapshot,
  disconnect,
  buildAuthUrl,
  exchangeCode,
  importClassroom
};
