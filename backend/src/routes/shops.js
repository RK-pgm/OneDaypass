const express = require('express');
const db = require('../db');
const { distanceKm } = require('../lib/haversine');

const router = express.Router();
const serialize = (row) => ({
  id: row.id, name: row.name, district: row.district, category: row.category,
  lat: row.lat, lng: row.lng, avgPrice: row.avgPrice,
  tags: JSON.parse(row.tagsJson || '[]'), recommendedMenu: row.recommendedMenu,
  coupon: row.couponJson ? JSON.parse(row.couponJson) : null,
  openFrom: row.openFrom, openTo: row.openTo, durationMin: row.durationMin,
  mission: row.missionJson ? JSON.parse(row.missionJson) : null
});

router.get('/', (req, res) => {
  const keys = ['lat', 'lng', 'radiusKm'];
  const provided = keys.filter((key) => req.query[key] !== undefined);
  if (provided.length && provided.length !== keys.length) {
    return res.status(400).json({ error: 'กรุณาระบุ lat, lng และ radiusKm ให้ครบ' });
  }
  if (!provided.length) {
    return res.json({ shops: db.prepare('SELECT * FROM shops ORDER BY name').all().map(serialize) });
  }
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Number(req.query.radiusKm);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180 || !Number.isFinite(radiusKm) || radiusKm <= 0) {
    return res.status(400).json({ error: 'พิกัดหรือรัศมีไม่ถูกต้อง' });
  }
  const shops = db.prepare('SELECT * FROM shops').all().map(serialize)
    .filter((shop) => distanceKm(lat, lng, shop.lat, shop.lng) <= radiusKm);
  return res.json({ shops });
});

module.exports = router;
