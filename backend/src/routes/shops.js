const express = require('express');
const db = require('../db');
const { distanceKm } = require('../lib/haversine');
const { DISTRICTS } = require('../lib/districts');

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
  const { districtId } = req.query;
  if (districtId && !DISTRICTS[districtId]) {
    return res.status(400).json({ error: 'ไม่รู้จักย่านที่ระบุ' });
  }
  const keys = ['lat', 'lng', 'radiusKm'];
  const provided = keys.filter((key) => req.query[key] !== undefined);
  if (provided.length && provided.length !== keys.length) {
    return res.status(400).json({ error: 'กรุณาระบุ lat, lng และ radiusKm ให้ครบ' });
  }
  if (!provided.length) {
    const rows = districtId
      ? db.prepare('SELECT * FROM shops WHERE district = ? AND isDemo = 0 ORDER BY name').all(DISTRICTS[districtId])
      : db.prepare('SELECT * FROM shops WHERE isDemo = 0 ORDER BY name').all();
    return res.json({ shops: rows.map(serialize) });
  }
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Number(req.query.radiusKm);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180 || !Number.isFinite(radiusKm) || radiusKm <= 0) {
    return res.status(400).json({ error: 'พิกัดหรือรัศมีไม่ถูกต้อง' });
  }
  const rows = districtId
    ? db.prepare('SELECT * FROM shops WHERE district = ? AND isDemo = 0').all(DISTRICTS[districtId])
    : db.prepare('SELECT * FROM shops WHERE isDemo = 0').all();
  const shops = rows.map(serialize)
    .filter((shop) => distanceKm(lat, lng, shop.lat, shop.lng) <= radiusKm);
  return res.json({ shops });
});

module.exports = router;
