const os = require('node:os');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..', '..');
const storageRoot = process.env.DAYPASS_STORAGE_ROOT
  ? path.resolve(process.env.DAYPASS_STORAGE_ROOT)
  : process.env.VERCEL
    ? path.join(os.tmpdir(), 'daypass')
    : backendRoot;

function resolveStoragePath(value, fallback) {
  if (!value) return fallback;
  return path.isAbsolute(value) ? value : path.resolve(storageRoot, value);
}

module.exports = {
  databasePath: resolveStoragePath(process.env.DB_PATH, path.join(storageRoot, 'data', 'daypass.sqlite')),
  uploadsDir: resolveStoragePath(process.env.UPLOADS_DIR, path.join(storageRoot, 'uploads')),
};
