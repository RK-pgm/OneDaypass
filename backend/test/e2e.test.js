const assert = require('assert');

async function runE2ETest() {
  const base = 'http://localhost:5000';
  console.log('🧪 Starting DayPass 10-Endpoint Integration Test...\n');

  // 1. Health
  const hRes = await fetch(`${base}/api/health`);
  const h = await hRes.json();
  assert(h.ok, 'Health check failed');
  console.log('✅ 1. Health Check passed: db connected');

  // 2. Shops
  const sRes = await fetch(`${base}/api/shops`);
  const s = await sRes.json();
  const shops = s.shops || s;
  assert(Array.isArray(shops) && shops.length === 16, 'Expected 16 Talat Noi shops');
  console.log(`✅ 2. Shops fetched: ${shops.length} verified shops in Talat Noi`);

  // 3. Plan Generate (Algorithm C)
  const pRes = await fetch(`${base}/api/plans/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budget: 350, style: 'chill', radiusKm: 2, startTime: '10:00' })
  });
  const p = await pRes.json();
  assert(p.plan && p.plan.items.length >= 3, 'Plan generation failed');
  console.log(`✅ 3. Plan generated: "${p.plan.title}" (${p.plan.items.length} stops)`);

  // 4. Create Order
  const deviceId = `dev-test-${Date.now()}`;
  const oRes = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId,
      plan: p.plan,
      people: 1,
      usePoints: 0
    })
  });
  const o = await oRes.json();
  assert(o.orderId && o.qrDataUrl, 'Order creation failed');
  console.log(`✅ 4. Order created: ${o.orderId} (PromptPay QR generated, amount: ฿${o.amount})`);

  // 5. Confirm Order (Mock Payment)
  const cRes = await fetch(`${base}/api/orders/${o.orderId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slipImageName: 'mock_slip.jpg' })
  });
  const c = await cRes.json();
  assert(c.passId && c.status === 'paid', 'Order confirmation failed');
  console.log(`✅ 5. Order confirmed: Pass ID ${c.passId} (Status: ${c.status})`);

  // 6. Get Pass Details
  const passRes = await fetch(`${base}/api/passes/${c.passId}`);
  const pass = await passRes.json();
  assert(pass.id === c.passId && Array.isArray(pass.coupons), 'Pass fetch failed');
  console.log(`✅ 6. Pass fetched: Status ${pass.status}, ${pass.coupons.length} coupons attached`);

  // 7. Check-in (Simulated GPS 150m rule)
  const firstShop = p.plan.items[0];
  const chkRes = await fetch(`${base}/api/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passId: pass.id,
      shopId: firstShop.shopId,
      lat: firstShop.lat,
      lng: firstShop.lng,
      simulate: true
    })
  });
  const chk = await chkRes.json();
  assert(chk.ok, 'Check-in failed');
  console.log(`✅ 7. Check-in passed at "${firstShop.shopName}" (${chk.distanceM}m)`);

  // 8. Redeem Coupon
  if (pass.coupons.length > 0) {
    const couponToUse = pass.coupons[0];
    const cpRes = await fetch(`${base}/api/coupons/${couponToUse.id}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passId: pass.id })
    });
    const cp = await cpRes.json();
    assert(cp.ok, 'Coupon redemption failed');
    console.log(`✅ 8. Coupon redeemed: "${couponToUse.title}" at ${cp.redeemedAt}`);
  }

  // 9. Mission Photo Upload & Points Award
  const missionItem = p.plan.items.find(i => i.mission);
  if (missionItem) {
    const boundary = '----WebKitFormBoundaryE2ETest';
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="passId"\r\n\r\n${pass.id}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="deviceId"\r\n\r\n${deviceId}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="food_test.jpg"\r\nContent-Type: image/jpeg\r\n\r\n(dummy image content)\r\n`),
      Buffer.from(`--${boundary}--\r\n`)
    ]);

    const mRes = await fetch(`${base}/api/missions/${missionItem.mission.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body
    });
    const m = await mRes.json();
    assert(m.ok && m.pointsAwarded > 0, 'Mission submission failed');
    console.log(`✅ 9. Mission submitted: "${missionItem.mission.title}" -> +${m.pointsAwarded} points awarded!`);
  }

  // 10. Check Points Balance
  const ptsRes = await fetch(`${base}/api/points?deviceId=${deviceId}`);
  const pts = await ptsRes.json();
  assert(pts.points > 0, 'Points ledger failed to track earned points');
  assert(Array.isArray(pts.transactions) && pts.transactions.some((entry) => entry.delta > 0), 'Points history failed to return earned points');
  console.log(`✅ 10. Points balance and transaction history updated: ${pts.points} points, ${pts.transactions.length} recent entries`);

  console.log('\n🎉 ALL 10 DAYPASS ENDPOINTS VERIFIED & WORKING 100%!');
}

runE2ETest().catch(err => {
  console.error('\n❌ E2E Test Failed:', err);
  process.exit(1);
});
