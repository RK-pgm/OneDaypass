/**
 * Helper to manage client-side persistent device ID and local pass history.
 */

const DEVICE_KEY = 'daypass_device_id';
const PASSES_KEY = 'daypass_my_passes';

export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    deviceId = `dev_${Date.now()}_${randomSuffix}`;
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
}

export function savePassId(passId) {
  try {
    const raw = localStorage.getItem(PASSES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!list.includes(passId)) {
      list.unshift(passId);
      localStorage.setItem(PASSES_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.error('Error saving passId to localStorage', err);
  }
}

export function getSavedPassIds() {
  try {
    const raw = localStorage.getItem(PASSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}
