/**
 * Central API client for DayPass backend endpoints.
 */

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function fetchShops(lat, lng, radiusKm) {
  const params = new URLSearchParams();
  if (lat !== undefined && lng !== undefined) {
    params.append('lat', lat);
    params.append('lng', lng);
  }
  if (radiusKm !== undefined) {
    params.append('radiusKm', radiusKm);
  }
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return request(`/shops${queryStr}`);
}

export async function generatePlan({ budget, style, radiusKm, startLat, startLng, people, startTime }) {
  return request('/plans/generate', {
    method: 'POST',
    body: JSON.stringify({
      budget,
      style,
      radiusKm,
      startLat,
      startLng,
      people,
      startTime
    })
  });
}

export async function createOrder({ deviceId, plan, people, usePoints }) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify({
      deviceId,
      plan,
      people,
      usePoints
    })
  });
}

export async function confirmOrder(orderId, slipImageName = 'mock_slip.jpg') {
  return request(`/orders/${orderId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ slipImageName })
  });
}

export async function getPass(passId) {
  return request(`/passes/${passId}`);
}

export async function redeemCoupon(couponId, passId) {
  return request(`/coupons/${couponId}/redeem`, {
    method: 'POST',
    body: JSON.stringify({ passId })
  });
}

export async function checkin({ passId, shopId, lat, lng, simulate = false }) {
  return request('/checkin', {
    method: 'POST',
    body: JSON.stringify({
      passId,
      shopId,
      lat,
      lng,
      simulate
    })
  });
}

export async function submitMission({ missionId, passId, deviceId, imageFile }) {
  const formData = new FormData();
  formData.append('passId', passId);
  formData.append('deviceId', deviceId);
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const res = await fetch(`${BASE_URL}/missions/${missionId}/submit`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || `Mission submit failed (${res.status})`;
    const err = new Error(errorMsg);
    err.status = res.status;
    throw err;
  }

  return data;
}

export async function getPoints(deviceId) {
  return request(`/points?deviceId=${encodeURIComponent(deviceId)}`);
}
