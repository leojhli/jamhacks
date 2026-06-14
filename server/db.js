// MongoDB persistence layer for The Hub.
//
// Designed to fail soft: if the driver is missing, no URI is configured, or the
// cluster is unreachable, every function degrades to a no-op / null so the app
// keeps running entirely from the in-memory demo data. When a URI IS configured
// and reachable, the data screens are served from MongoDB and every generated
// plan is persisted.
const fs = require('fs');
const path = require('path');

let MongoClient = null;
try {
  ({ MongoClient } = require('mongodb'));
} catch (_) {
  MongoClient = null; // driver not installed -> stay in-memory
}

const store = { client: null, db: null, connected: false, error: null };

function getUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  try {
    const secrets = JSON.parse(fs.readFileSync(path.join(__dirname, 'secrets.json'), 'utf8'));
    return secrets.MONGODB_URI || '';
  } catch (_) {
    return '';
  }
}

function dbName() {
  return process.env.MONGODB_DB || 'the_hub';
}

function isConfigured() {
  return Boolean(MongoClient && getUri());
}

async function connect() {
  if (!MongoClient) {
    store.error = 'mongodb driver not installed';
    return false;
  }
  const uri = getUri();
  if (!uri) {
    store.error = 'MONGODB_URI not configured';
    return false;
  }
  try {
    store.client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await store.client.connect();
    store.db = store.client.db(dbName());
    await store.db.command({ ping: 1 });
    store.connected = true;
    store.error = null;
    return true;
  } catch (err) {
    store.connected = false;
    store.error = err.message;
    return false;
  }
}

function isConnected() {
  return store.connected;
}

// Seed the read collections from the canonical demo functions. Idempotent:
// only inserts when a collection is empty, so it is safe to run every startup.
async function seed({ profile, calendar, cards, details, gaps }) {
  if (!store.connected) return;
  await Promise.all([
    store.db.collection('profile').updateOne(
      { _id: 'me' },
      { $set: { ...profile, _id: 'me' } },
      { upsert: true }
    ),
    seedCollection('assignments', cards),
    seedCollection('assignmentDetails', details),
    seedCollection('gaps', gaps),
    seedCollection('calendar', calendar.map((item, i) => ({ _seq: i, ...item })))
  ]);
}

async function seedCollection(name, docs) {
  const col = store.db.collection(name);
  const count = await col.countDocuments();
  if (count === 0 && docs.length) {
    await col.insertMany(docs.map((d) => ({ ...d })));
  }
}

async function readCards() {
  if (!store.connected) return null;
  return store.db.collection('assignments').find({}, { projection: { _id: 0 } }).toArray();
}

async function readDetail(id) {
  if (!store.connected) return null;
  return store.db.collection('assignmentDetails').findOne({ id }, { projection: { _id: 0 } });
}

async function readGaps() {
  if (!store.connected) return null;
  return store.db.collection('gaps').find({}, { projection: { _id: 0 } }).toArray();
}

async function readCalendar() {
  if (!store.connected) return null;
  return store.db.collection('calendar')
    .find({}, { projection: { _id: 0, _seq: 0 } })
    .sort({ _seq: 1 })
    .toArray();
}

async function readProfile() {
  if (!store.connected) return null;
  return store.db.collection('profile').findOne({ _id: 'me' }, { projection: { _id: 0 } });
}

// Persist a generated plan (fire-and-forget from the caller's perspective).
async function savePlan(inputs, plan) {
  if (!store.connected) return null;
  const result = await store.db.collection('plans').insertOne({
    createdAt: new Date(),
    inputs,
    summary: (plan.plan || []).map((item) => ({ title: item.title, minutes: item.minutes })),
    plan
  });
  return result.insertedId;
}

async function recentPlans(limit = 10) {
  if (!store.connected) return [];
  return store.db.collection('plans')
    .find({}, { projection: { _id: 0, createdAt: 1, inputs: 1, summary: 1 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

async function status() {
  const base = {
    connected: store.connected,
    configured: isConfigured(),
    driver: Boolean(MongoClient),
    db: dbName(),
    error: store.error
  };
  if (!store.connected) return base;
  try {
    const [assignments, gaps, plans] = await Promise.all([
      store.db.collection('assignments').countDocuments(),
      store.db.collection('gaps').countDocuments(),
      store.db.collection('plans').countDocuments()
    ]);
    return { ...base, counts: { assignments, gaps, plans } };
  } catch (_) {
    return base;
  }
}

module.exports = {
  connect,
  isConnected,
  isConfigured,
  seed,
  readCards,
  readDetail,
  readGaps,
  readCalendar,
  readProfile,
  savePlan,
  recentPlans,
  status
};
