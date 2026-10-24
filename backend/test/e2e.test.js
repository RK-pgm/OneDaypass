const assert = require('assert');

async function runE2ETest() {
  const base = process.env.API_BASE_URL || 'http://localhost:5000';
  console.log('🧪 Starting DayPass API Integration Test...\n');

  // 1. Health
  const hRes = await fetch(`${base}/api/health`);
  const h = await hRes.json();
  assert(h.ok, 'Health check failed');
  console.log('✅ 1. Health Check passed: db connected');

  // 2. Shops
  const sRes = await fetch(`${base}/api/shops`);
  const s = await sRes.json();
  const shops = s.shops || s;
  assert(Array.isArray(shops) && shops.length >= 16, 'Expected seeded shops');
  console.log(`✅ 2. Shops fetched: ${shops.length} seeded shops`);

  // 3. Plan Generate (Algorithm C)
  const pRes = await fetch(`${base}/api/plans/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budget: 350, style: 'cafe', radiusKm: 2, startTime: '10:00' })
  });
  const p = await pRes.json();
  assert(p.plan && p.plan.items.length >= 3 && p.plan.style === 'cafe', 'Plan generation failed for selected style');
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
  assert(
    pass.id === c.passId &&
      Array.isArray(pass.coupons) &&
      pass.purchase?.orderId === o.orderId &&
      pass.purchase?.amount === o.amount &&
      pass.purchase?.purchasedAt,
    'Pass details or purchase receipt failed'
  );
  console.log(`✅ 6. Pass fetched: Status ${pass.status}, ${pass.coupons.length} coupons attached`);

  // 7. Verify purchase history and cashback are tied to the same device
  const historyRes = await fetch(`${base}/api/passes?deviceId=${deviceId}`);
  const history = await historyRes.json();
  assert(Array.isArray(history.history) && history.history.some((entry) => entry.passId === pass.id), 'Pass history failed');
  assert(history.history.find((entry) => entry.passId === pass.id).pointsEarned > 0, 'Pass history cashback was not recorded');
  console.log(`✅ 7. Pass history fetched for device: ${history.history.length} pass(es)`);

  // 8. Generate and purchase a clearly labeled demo itinerary for an unmapped destination
  const demoPlanRes = await fetch(`${base}/api/plans/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      districtId: 'yaowarat',
      districtName: 'เยาวราช - ไชน่าทาวน์',
      provinceId: 'bangkok',
      provinceName: 'กรุงเทพมหานคร',
      budget: 350,
      style: 'cafe',
      radiusKm: 2,
      startLat: 13.7404,
      startLng: 100.5133,
      startTime: '10:00',
    }),
  });
  const demoPlanResult = await demoPlanRes.json();
  assert(demoPlanRes.ok && demoPlanResult.plan?.demoGenerated, 'Unmapped destination demo plan was not generated');
  assert(demoPlanResult.warning?.includes('ไม่มีสิทธิประโยชน์จริง'), 'Demo itinerary warning did not explain its limitations');
  assert(demoPlanResult.plan.items.length >= 3, 'Demo destination plan has too few stops');
  assert(demoPlanResult.plan.items.every((item) => item.shopName.includes('จุดตัวอย่าง')), 'Demo itinerary included unverified venue names');
  assert(demoPlanResult.plan.items.every((item) => !item.coupon), 'Demo itinerary advertised real coupons');

  const demoOrderRes = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, plan: demoPlanResult.plan, people: 1, usePoints: 0 }),
  });
  const demoOrder = await demoOrderRes.json();
  assert(demoOrderRes.ok && demoOrder.orderId, 'Demo itinerary order creation failed');
  const demoConfirmRes = await fetch(`${base}/api/orders/${demoOrder.orderId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slipImageName: 'mock_slip.jpg' }),
  });
  const demoConfirmed = await demoConfirmRes.json();
  assert(demoConfirmRes.ok && demoConfirmed.passId, 'Demo destination pass confirmation failed');
  const demoPassRes = await fetch(`${base}/api/passes/${demoConfirmed.passId}`);
  const demoPass = await demoPassRes.json();
  assert(demoPassRes.ok && demoPass.id === demoConfirmed.passId, 'Demo destination pass could not be retrieved');
  const demoHistoryRes = await fetch(`${base}/api/passes?deviceId=${deviceId}`);
  const demoHistory = await demoHistoryRes.json();
  assert(demoHistory.history.some((entry) => entry.passId === demoPass.id), 'Demo destination pass was missing from purchase history');
  console.log('✅ 8. Unsupported destination demo plan created an order, pass, and history entry without claiming real venues or coupons');

  // 9. Add an allowed reward and reject a duplicate
  const rewardRes = await fetch(`${base}/api/points/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId,
      delta: 20,
      type: 'quiz_complete',
      reason: 'ทดสอบรายการแต้ม'
    })
  });
  const reward = await rewardRes.json();
  assert(rewardRes.status === 201 && reward.ok, 'Points reward was not recorded');
  const duplicateRewardRes = await fetch(`${base}/api/points/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, delta: 20, type: 'quiz_complete' })
  });
  assert(duplicateRewardRes.status === 409, 'Duplicate points reward was accepted');
  console.log('✅ 9. Points reward recorded once');

  // 10. Check-in (Simulated GPS 150m rule)
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
  console.log(`✅ 9. Check-in passed at "${firstShop.shopName}" (${chk.distanceM}m)`);

  // 11. Redeem Coupon
  if (pass.coupons.length > 0) {
    const couponToUse = pass.coupons[0];
    const cpRes = await fetch(`${base}/api/coupons/${couponToUse.id}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passId: pass.id })
    });
    const cp = await cpRes.json();
    assert(cp.ok, 'Coupon redemption failed');
    console.log(`✅ 10. Coupon redeemed: "${couponToUse.title}" at ${cp.redeemedAt}`);
  }

  // 12. Mission Photo Upload & Points Award
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
    console.log(`✅ 11. Mission submitted: "${missionItem.mission.title}" -> +${m.pointsAwarded} points awarded!`);
  }

  // 13. Check Points Balance
  const ptsRes = await fetch(`${base}/api/points?deviceId=${deviceId}`);
  const pts = await ptsRes.json();
  assert(pts.points > 0, 'Points ledger failed to track earned points');
  assert(Array.isArray(pts.transactions) && pts.transactions.some((entry) => entry.delta > 0), 'Points history failed to return earned points');
  console.log(`✅ 12. Points balance and transaction history updated: ${pts.points} points, ${pts.transactions.length} recent entries`);

  // 14. Register an account, migrate device data, and authenticate on another device
  const contact = `auth-test-${Date.now()}@example.test`;
  const incompleteRegisterRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: 'Incomplete',
      phoneOrEmail: `incomplete-${contact}`,
      password: 'test-password-123',
      province: 'bangkok',
      amphoe: 'สัมพันธวงศ์',
      tambon: 'ตลาดน้อย',
      previousDeviceId: `incomplete-${deviceId}`,
    }),
  });
  assert(incompleteRegisterRes.status === 400, 'Registration accepted an incomplete required profile');

  const registerRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: 'Auth Test',
      fullName: 'Auth Example',
      phoneOrEmail: contact,
      email: `profile-${contact}`,
      dateOfBirth: '1995-06-15',
      currentAddress: '123 ถนนสุขุมวิท เขตวัฒนา กรุงเทพมหานคร',
      profilePhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxykAAAAASUVORK5CYII=',
      password: 'test-password-123',
      province: 'bangkok',
      provinceName: 'กรุงเทพมหานคร',
      provinceEmoji: '🏙️',
      amphoe: 'สัมพันธวงศ์',
      amphoeName: 'สัมพันธวงศ์',
      tambon: 'ตลาดน้อย',
      lat: 13.7313,
      lng: 100.5105,
      previousDeviceId: deviceId,
    }),
  });
  const registered = await registerRes.json();
  assert(registerRes.status === 201 && registered.account?.accountId, 'Account registration failed');
  assert(registered.account.fullName === 'Auth Example' && registered.account.profilePhoto?.startsWith('data:image/png;base64,'), 'Required profile details were not saved');
  const accountId = registered.account.accountId;

  const migratedHistoryRes = await fetch(`${base}/api/passes?deviceId=${accountId}`);
  const migratedHistory = await migratedHistoryRes.json();
  assert(migratedHistory.history.some((entry) => entry.passId === pass.id), 'Existing device history was not linked to the new account');

  const secondDeviceId = `new-device-${Date.now()}`;
  const secondDeviceRewardRes = await fetch(`${base}/api/points/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: secondDeviceId, delta: 20, type: 'quiz_complete' }),
  });
  assert(secondDeviceRewardRes.status === 201, 'Could not create second-device points for migration test');
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneOrEmail: contact.toUpperCase(),
      password: 'test-password-123',
      previousDeviceId: secondDeviceId,
    }),
  });
  const loggedIn = await loginRes.json();
  assert(loginRes.ok && loggedIn.account?.accountId === accountId, 'Cross-device account login failed');
  const migratedPointsRes = await fetch(`${base}/api/points?deviceId=${accountId}`);
  const migratedPoints = await migratedPointsRes.json();
  assert(migratedPoints.totalPoints >= pts.totalPoints + 70, 'Existing points and welcome bonus were not linked to the account');
  const previousDevicePointsRes = await fetch(`${base}/api/points?deviceId=${secondDeviceId}`);
  const previousDevicePoints = await previousDevicePointsRes.json();
  assert(previousDevicePoints.totalPoints === 0, 'Second-device points were not moved to the account');

  const profileRes = await fetch(`${base}/api/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId,
      profile: {
        nickname: 'Updated Auth Test',
        fullName: 'Updated Example',
        email: 'updated@example.test',
        dateOfBirth: '1996-07-16',
        currentAddress: '99 ถนนนิมมานเหมินท์ อำเภอเมืองเชียงใหม่',
        profilePhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxykAAAAASUVORK5CYII=',
        province: 'chiangmai',
        provinceName: 'เชียงใหม่',
        provinceEmoji: '🌿',
        district: 'เมืองเชียงใหม่',
        districtName: 'เมืองเชียงใหม่',
        tambon: 'สุเทพ',
        lat: 18.7883,
        lng: 98.9853,
      },
    }),
  });
  const updatedProfile = await profileRes.json();
  assert(profileRes.ok && updatedProfile.account?.nickname === 'Updated Auth Test' && updatedProfile.account.fullName === 'Updated Example', 'Account profile update failed');
  const reloginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneOrEmail: contact, password: 'test-password-123' }),
  });
  const reloggedIn = await reloginRes.json();
  assert(reloggedIn.account?.province === 'chiangmai' && reloggedIn.account?.email === 'updated@example.test', 'Updated profile was not shared across login sessions');

  const wrongPasswordRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneOrEmail: contact, password: 'wrong-password' }),
  });
  assert(wrongPasswordRes.status === 401, 'Login accepted an incorrect password');

  const duplicateRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: 'Duplicate',
      fullName: 'Duplicate Example',
      phoneOrEmail: contact,
      email: 'duplicate@example.test',
      dateOfBirth: '1995-06-15',
      currentAddress: 'กรุงเทพมหานคร',
      profilePhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxykAAAAASUVORK5CYII=',
      password: 'test-password-123',
      province: 'bangkok',
      amphoe: 'samphanthawong',
      tambon: 'ตลาดน้อย',
      previousDeviceId: `unused-${Date.now()}`,
    }),
  });
  assert(duplicateRes.status === 409, 'Duplicate account registration was accepted');
  console.log('✅ 14. Account registration, device data migration, and password login passed');

  console.log('\n🎉 ALL DAYPASS API CHECKS PASSED!');
}

runE2ETest().catch(err => {
  console.error('\n❌ E2E Test Failed:', err);
  process.exit(1);
});
