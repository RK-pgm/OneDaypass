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
    body: JSON.stringify({ budget: 350, style: 'cafe', radiusKm: 2, startTime: '10:00', passPackageId: 'single' })
  });
  const p = await pRes.json();
  assert(p.plan && p.plan.items.length >= 3 && p.plan.style === 'cafe', 'Plan generation failed for selected style');
  console.log(`✅ 3. Plan generated: "${p.plan.title}" (${p.plan.items.length} stops)`);

  const seededDistricts = [
    { districtId: 'taladnoi', districtName: 'ตลาดน้อย', startLat: 13.7313, startLng: 100.5105 },
    { districtId: 'ari', districtName: 'อารีย์', startLat: 13.7797, startLng: 100.5447 },
    { districtId: 'banthatthong', districtName: 'บรรทัดทอง', startLat: 13.7425, startLng: 100.5235 },
    { districtId: 'phranakorn', districtName: 'พระนคร', startLat: 13.7525, startLng: 100.5015 },
  ];
  for (const district of seededDistricts) {
    const districtResponse = await fetch(`${base}/api/plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...district, budget: 350, style: 'cafe', radiusKm: 2, startTime: '10:00' }),
    });
    const districtResult = await districtResponse.json();
    assert(
      districtResponse.ok && districtResult.plan?.items.length >= 3,
      `Plan generation failed for ${district.districtName}`
    );
  }
  console.log('✅ 3a. All 4 seeded districts generated itineraries');

  for (const district of seededDistricts) {
    for (const passPackageId of ['single', 'explorer']) {
      const packageResponse = await fetch(`${base}/api/plans/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...district,
          budget: 2000,
          style: 'chill',
          radiusKm: 3,
          startTime: '09:00',
          endTime: '22:00',
          passPackageId,
        }),
      });
      const packageResult = await packageResponse.json();
      const expectedStops = passPackageId === 'single' ? 4 : 6;
      assert(
        packageResponse.ok && packageResult.plan?.items.length === expectedStops,
        `${district.districtName} ${passPackageId} package did not generate ${expectedStops} stops`
      );
      if (passPackageId === 'explorer') {
        assert(
          packageResult.plan.items.filter((item) => item.coupon).length === 2 &&
            packageResult.plan.items.some((item) => item.mission),
          `${district.districtName} explorer package did not include its coupons and mission`
        );
        assert(
          !packageResult.plan.items.some((item) => item.coupon?.isDemo && !item.coupon.title.includes('ตัวอย่าง')),
          `${district.districtName} included an unlabeled demo coupon`
        );
      }
    }
  }
  console.log('✅ 3a. All seeded districts generated exactly 4 or 6 stops with required explorer benefits');

  // 4. Create Order
  const deviceId = `dev-test-${Date.now()}`;
  const shortSingleOrderRes = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId,
      plan: { ...p.plan, items: p.plan.items.slice(1), selectedPackage: { id: 'single' } },
      people: 1,
      usePoints: 0,
    }),
  });
  assert.strictEqual(shortSingleOrderRes.status, 400, 'A 3-stop itinerary was accepted for the 4-stop single package');
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
  assert(o.orderId && o.isDemo && !o.qrDataUrl, 'Prototype order should not create a payment QR');
  console.log(`✅ 4. Demo order created without real payment (amount shown: ฿${o.amount})`);

  // 5. Confirm Order (Mock Payment)
  const cRes = await fetch(`${base}/api/orders/${o.orderId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slipImageName: 'mock_slip.jpg' })
  });
  const c = await cRes.json();
  assert(c.passId && c.status === 'paid', 'Order confirmation failed');
  console.log(`✅ 5. Order confirmed: Pass ID ${c.passId} (Status: ${c.status})`);

  const retryConfirmRes = await fetch(`${base}/api/orders/${o.orderId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  const retryConfirm = await retryConfirmRes.json();
  assert(retryConfirmRes.ok && retryConfirm.passId === c.passId, 'Retrying order confirmation created a different pass');

  // 6. Get Pass Details
  const passRes = await fetch(`${base}/api/passes/${c.passId}`);
  const pass = await passRes.json();
  assert(
    pass.id === c.passId &&
      pass.isDemo &&
      Array.isArray(pass.coupons) &&
      pass.purchase?.orderId === o.orderId &&
      pass.purchase?.amount === o.amount &&
      pass.purchase?.purchasedAt,
    'Pass details or purchase receipt failed'
  );
  console.log(`✅ 6. Pass fetched: Status ${pass.status}, ${pass.coupons.length} coupons attached`);

  const eligibleShops = await fetch(`${base}/api/merchant/eligible-shops`).then((response) => response.json());
  assert(Array.isArray(eligibleShops.shops) && eligibleShops.shops.length >= 2, 'Participating merchants were not listed');
  assert(pass.coupons.length >= 2, 'Expected multiple coupons for merchant access-control tests');
  const merchantCoupon = pass.coupons.at(-1);
  const merchantShop = eligibleShops.shops.find((shop) => shop.id === merchantCoupon?.shopId);
  const otherMerchantShop = eligibleShops.shops.find((shop) => shop.id !== merchantShop?.id);
  assert(merchantShop && otherMerchantShop, 'Could not find two eligible merchants for access-control tests');
  const merchantRegistration = await fetch(`${base}/api/merchant/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopName: merchantShop.name,
      ownerName: 'Merchant Test Owner',
      phone: '0812345678',
      address: '1 ถนนสุขุมวิท กรุงเทพมหานคร',
      password: 'merchant-test-pass',
    }),
  });
  const merchantAccount = await merchantRegistration.json();
  assert(merchantRegistration.status === 201 && merchantAccount.token, 'Merchant registration failed');
  assert(
    merchantAccount.merchant.shopName === merchantShop.name &&
      merchantAccount.merchant.ownerName === 'Merchant Test Owner',
    'Merchant registration did not return the registered shop identity'
  );
  const duplicateMerchantRegistration = await fetch(`${base}/api/merchant/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopName: merchantShop.name,
      ownerName: 'Duplicate Merchant',
      phone: '0898765432',
      address: '2 ถนนสุขุมวิท กรุงเทพมหานคร',
      password: 'merchant-test-pass',
    }),
  });
  assert(duplicateMerchantRegistration.status === 409, 'A second merchant account claimed an already registered shop');
  const merchantLogin = await fetch(`${base}/api/merchant/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shopName: merchantShop.name, password: 'merchant-test-pass' }),
  }).then((response) => response.json());
  assert(merchantLogin.token && merchantLogin.merchant.shopId === merchantShop.id, 'Merchant login failed');
  const unauthenticatedMerchantLookup = await fetch(`${base}/api/merchant/passes/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passCode: pass.code }),
  });
  assert(unauthenticatedMerchantLookup.status === 401, 'Unauthenticated users could look up passes as a merchant');
  const merchantLookupRes = await fetch(`${base}/api/merchant/passes/lookup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${merchantLogin.token}`,
    },
    body: JSON.stringify({ passCode: pass.code }),
  });
  const merchantLookup = await merchantLookupRes.json();
  assert(
    merchantLookupRes.ok &&
      merchantLookup.pass.code === pass.code &&
      merchantLookup.coupons.length === 1 &&
      merchantLookup.coupons[0].id === merchantCoupon.id,
    'Merchant pass lookup did not restrict results to the merchant shop'
  );
  const otherMerchantRegistration = await fetch(`${base}/api/merchant/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopName: otherMerchantShop.name,
      ownerName: 'Other Merchant',
      phone: '0823456789',
      address: '3 ถนนสุขุมวิท กรุงเทพมหานคร',
      password: 'other-merchant-pass',
    }),
  }).then((response) => response.json());
  const otherMerchantRedeem = await fetch(`${base}/api/merchant/coupons/${merchantCoupon.id}/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${otherMerchantRegistration.token}`,
    },
  });
  assert(otherMerchantRedeem.status === 404, 'A different merchant could redeem another shop coupon');
  const merchantRedeem = await fetch(`${base}/api/merchant/coupons/${merchantCoupon.id}/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${merchantLogin.token}`,
    },
  });
  assert(merchantRedeem.ok, 'The registered merchant could not redeem its coupon');
  const duplicateMerchantRedeem = await fetch(`${base}/api/merchant/coupons/${merchantCoupon.id}/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${merchantLogin.token}`,
    },
  });
  assert(duplicateMerchantRedeem.status === 409, 'A merchant could redeem the same coupon more than once');
  await fetch(`${base}/api/merchant/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${merchantLogin.token}` },
  });
  const revokedMerchantSession = await fetch(`${base}/api/merchant/me`, {
    headers: { Authorization: `Bearer ${merchantLogin.token}` },
  });
  assert(revokedMerchantSession.status === 401, 'Merchant logout did not revoke the session');
  console.log('✅ 6b. Merchant registration/login, shop-only coupon access, one-time redemption, and logout passed');

  const explorerPlanRes = await fetch(`${base}/api/plans/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      districtId: 'taladnoi',
      districtName: 'ตลาดน้อย',
      provinceId: 'bangkok',
      provinceName: 'กรุงเทพมหานคร',
      budget: 2000,
      style: 'chill',
      radiusKm: 3,
      startLat: 13.7335,
      startLng: 100.5126,
      startTime: '09:00',
      endTime: '22:00',
      passPackageId: 'explorer',
    }),
  });
  const explorerPlanResult = await explorerPlanRes.json();
  assert(
    explorerPlanRes.ok &&
      explorerPlanResult.plan?.items.length === 6 &&
      explorerPlanResult.plan.items.filter((item) => item.coupon).length === 2 &&
      explorerPlanResult.plan.items.some((item) => item.mission),
    `Explorer plan did not meet its benefits: ${explorerPlanResult.error || 'invalid plan'}`
  );
  const explorerOrderRes = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId,
      plan: { ...explorerPlanResult.plan, selectedPackage: { id: 'explorer' } },
      people: 1,
      usePoints: 0,
    }),
  });
  const explorerOrder = await explorerOrderRes.json();
  assert(explorerOrderRes.status === 201 && explorerOrder.amount === 299, 'Explorer package price should be ฿299 per person');
  const explorerConfirmRes = await fetch(`${base}/api/orders/${explorerOrder.orderId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const explorerConfirmed = await explorerConfirmRes.json();
  assert(explorerConfirmRes.ok && explorerConfirmed.pointsEarned > 0, 'Explorer pass did not award purchase points');
  const explorerPass = await fetch(`${base}/api/passes/${explorerConfirmed.passId}`).then((response) => response.json());
  assert(
    explorerPass.coupons.length === 2 &&
      explorerPass.plan.items.length === 6 &&
      explorerPass.plan.items.some((item) => item.mission),
    'Explorer pass did not provide 6 stops, exactly 2 coupons, and a mission'
  );
  console.log('✅ 6a. Explorer pass generated 6 stops, issued 2 coupons, included a mission, and awarded points');

  // 7. Verify purchase history and cashback are tied to the same device
  const historyRes = await fetch(`${base}/api/passes?deviceId=${deviceId}`);
  const history = await historyRes.json();
  assert(Array.isArray(history.history) && history.history.some((entry) => entry.passId === pass.id), 'Pass history failed');
  assert(history.history.find((entry) => entry.passId === pass.id).isDemo, 'Pass history did not mark the prototype pass as a demo');
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
  assert(demoPlanResult.warning?.includes('จุดตัวอย่าง'), 'Demo itinerary warning did not explain its limitations');
  assert(demoPlanResult.plan.items.length >= 3, 'Demo destination plan has too few stops');
  assert(demoPlanResult.plan.items.every((item) => item.shopName.includes('จุดตัวอย่าง')), 'Demo itinerary included unverified venue names');
  assert(demoPlanResult.plan.items.every((item) => !item.coupon), 'Demo itinerary advertised real coupons');

  const remoteExplorerRes = await fetch(`${base}/api/plans/generate`, {
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
      endTime: '22:00',
      passPackageId: 'explorer',
    }),
  });
  const remoteExplorer = await remoteExplorerRes.json();
  assert(
    remoteExplorerRes.ok &&
      remoteExplorer.plan?.items.length === 6 &&
      remoteExplorer.plan.items.filter((item) => item.coupon?.isDemo).length === 2 &&
      remoteExplorer.plan.items.some((item) => item.mission),
    'Explorer package for an unmapped destination did not generate 6 labeled demo stops, 2 sample coupons, and a mission'
  );
  const remoteSingleRes = await fetch(`${base}/api/plans/generate`, {
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
      endTime: '22:00',
      passPackageId: 'single',
    }),
  });
  const remoteSingle = await remoteSingleRes.json();
  assert(
    remoteSingleRes.ok && remoteSingle.plan?.items.length === 4 && remoteSingle.plan.demoGenerated,
    'Single package for an unmapped destination did not generate 4 labeled demo stops'
  );
  const remoteExplorerOrderRes = await fetch(`${base}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId,
      plan: { ...remoteExplorer.plan, selectedPackage: { id: 'explorer' } },
      people: 1,
      usePoints: 0,
    }),
  });
  const remoteExplorerOrder = await remoteExplorerOrderRes.json();
  assert(remoteExplorerOrderRes.status === 201, 'Explorer package with sample benefits could not be purchased');
  const remoteExplorerConfirmRes = await fetch(`${base}/api/orders/${remoteExplorerOrder.orderId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const remoteExplorerPassResult = await remoteExplorerConfirmRes.json();
  assert(remoteExplorerConfirmRes.ok, 'Explorer sample pass could not be confirmed');
  const remoteExplorerPass = remoteExplorerPassResult;
  const remotePass = await fetch(`${base}/api/passes/${remoteExplorerPass.passId}`).then((response) => response.json());
  assert(
    remotePass.coupons.length === 2 && remotePass.coupons.every((coupon) => coupon.isDemo),
    'Sample coupons were not clearly marked after pass purchase'
  );
  const sampleRedeem = await fetch(`${base}/api/coupons/${remotePass.coupons[0].id}/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, passId: remotePass.id }),
  });
  assert(sampleRedeem.status === 409, 'A sample coupon was redeemable as a real shop benefit');

  const customPlanRes = await fetch(`${base}/api/plans/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      districtId: 'custom_test',
      districtName: 'ย่านทดลอง',
      provinceId: 'chiangmai',
      provinceName: 'เชียงใหม่',
      budget: 350,
      style: 'cafe',
      radiusKm: 0.5,
      startLat: 18.7883,
      startLng: 98.9853,
      startTime: '10:00',
    }),
  });
  const customPlan = await customPlanRes.json();
  assert(customPlanRes.ok && customPlan.plan?.items.length >= 3, 'Custom destination did not generate a plan');
  assert(customPlan.plan.demoGenerated, 'Custom destination was not clearly labeled as a demo plan');
  assert(customPlan.plan.items.every((item) => !item.coupon), 'Custom destination demo advertised real coupons');
  const shopsAfterDemo = await (await fetch(`${base}/api/shops`)).json();
  assert((shopsAfterDemo.shops || shopsAfterDemo).length === shops.length, 'Demo stops were persisted as real shops');
  console.log('✅ 3b. Unmapped and custom destinations generated labeled demo plans without exposing demo stops as real shops');

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
  const foreignCheckinRes = await fetch(`${base}/api/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passId: pass.id,
      shopId: firstShop.shopId,
      deviceId: `${deviceId}-other`,
      lat: firstShop.lat,
      lng: firstShop.lng,
      simulate: true
    })
  });
  assert(foreignCheckinRes.status === 403, 'A different device was allowed to check in to this pass');
  const chkRes = await fetch(`${base}/api/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passId: pass.id,
      shopId: firstShop.shopId,
      deviceId,
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
    const foreignCouponRes = await fetch(`${base}/api/coupons/${couponToUse.id}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passId: pass.id, deviceId: `${deviceId}-other` })
    });
    assert(foreignCouponRes.status === 403, 'A different device was allowed to redeem this coupon');
    const cpRes = await fetch(`${base}/api/coupons/${couponToUse.id}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passId: pass.id, deviceId })
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
  const contact = `086${Math.floor(1000000 + Math.random() * 9000000)}`;
  const contactEmail = `auth-test-${Date.now()}@example.test`;
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
      email: contactEmail,
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

  const minimalRegisterRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: 'Minimal Profile',
      fullName: 'Minimal Profile Example',
      phoneOrEmail: `087${Math.floor(1000000 + Math.random() * 9000000)}`,
      email: `minimal-${Date.now()}@example.test`,
      dateOfBirth: '1997-04-12',
      password: 'minimal-password-123',
      province: 'bangkok',
      amphoe: 'samphanthawong',
      tambon: 'ตลาดน้อย',
      previousDeviceId: `minimal-dev-${Date.now()}`,
    }),
  });
  const minimalRegistered = await minimalRegisterRes.json();
  assert(
    minimalRegisterRes.status === 201 &&
      minimalRegistered.account?.currentAddress === '' &&
      minimalRegistered.account?.profilePhoto === '',
    'Registration should allow an omitted profile photo and address'
  );

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

    const updatedEmail = `updated-${Date.now()}@example.test`;
    const profileRes = await fetch(`${base}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId,
        profile: {
          nickname: 'Updated Auth Test',
          fullName: 'Updated Example',
          email: updatedEmail,
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
    assert(reloggedIn.account?.province === 'chiangmai' && reloggedIn.account?.email === updatedEmail, 'Updated profile was not shared across login sessions');

  const loggedOutDeviceId = `after-logout-${Date.now()}`;
  const logoutLoginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneOrEmail: contact,
      password: 'test-password-123',
      previousDeviceId: loggedOutDeviceId,
    }),
  });
  const loggedOutLogin = await logoutLoginRes.json();
  assert(logoutLoginRes.ok && loggedOutLogin.account?.accountId === accountId, 'Login after logout failed with the correct password');
  const historyAfterLogoutLogin = await fetch(`${base}/api/passes?deviceId=${accountId}`).then((response) => response.json());
  assert(historyAfterLogoutLogin.history.some((entry) => entry.passId === pass.id), 'Purchase history was missing after login from a fresh device');

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

  // 14b. Test phone registration with separate email, login via email, +66 phone login, and email uniqueness
  const testPhone = `089${Math.floor(1000000 + Math.random() * 9000000)}`;
  const testPhoneEmail = `phone-user-${Date.now()}@example.test`;
  const phoneRegisterRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: 'Phone User',
      fullName: 'Phone User Example',
      phoneOrEmail: testPhone,
      email: testPhoneEmail,
      dateOfBirth: '1998-03-20',
      currentAddress: 'เชียงใหม่',
      profilePhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxykAAAAASUVORK5CYII=',
      password: 'phone-password-123',
      province: 'chiangmai',
      amphoe: 'เมืองเชียงใหม่',
      tambon: 'สุเทพ',
      previousDeviceId: `phone-dev-${Date.now()}`,
    }),
  });
  assert(phoneRegisterRes.status === 201, 'Phone registration failed');

  // Login via email (even though phone was in phoneOrEmail)
  const loginByEmailRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneOrEmail: testPhoneEmail, password: 'phone-password-123' }),
  });
  const loginByEmailData = await loginByEmailRes.json();
  assert(loginByEmailRes.ok && loginByEmailData.account?.phoneOrEmail === testPhone, 'Could not log in using email when registered with phone');

  // Login via +66 formatted phone
  const plus66Phone = `+66${testPhone.slice(1)}`;
  const loginByPlus66Res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneOrEmail: plus66Phone, password: 'phone-password-123' }),
  });
  assert(loginByPlus66Res.ok, 'Could not log in using +66 international phone format');

  // Duplicate email check when phone is different
  const duplicateEmailRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname: 'Dup Email',
      fullName: 'Dup Email User',
      phoneOrEmail: `088${Math.floor(1000000 + Math.random() * 9000000)}`,
      email: testPhoneEmail, // duplicate email!
      dateOfBirth: '1998-03-20',
      currentAddress: 'เชียงใหม่',
      profilePhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxykAAAAASUVORK5CYII=',
      password: 'phone-password-123',
      province: 'chiangmai',
      amphoe: 'เมืองเชียงใหม่',
      tambon: 'สุเทพ',
      previousDeviceId: `dup-dev-${Date.now()}`,
    }),
  });
  assert(duplicateEmailRes.status === 409, 'Accepted duplicate email on registration with different phone');

  console.log('✅ 14. Account registration, device data migration, +66 phone format, email login, and password login passed');

  // 15. Fast 1-Click Social Login (Google & LINE)
  const socialGoogleEmail = `google-traveler-${Date.now()}@gmail.com`;
  const socialGoogleRes = await fetch(`${base}/api/auth/social`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      providerId: `g_${Date.now()}`,
      email: socialGoogleEmail,
      name: 'สมชาย ใจดี',
      previousDeviceId: `social-dev-${Date.now()}`,
    }),
  });
  const socialGoogleData = await socialGoogleRes.json();
  assert(socialGoogleRes.status === 201 && socialGoogleData.isNew && socialGoogleData.account?.email === socialGoogleEmail, 'Google 1-click registration failed');

  // Relogin with same Google account (should not duplicate, should sign in existing)
  const socialGoogleReloginRes = await fetch(`${base}/api/auth/social`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      providerId: `g_${Date.now()}`,
      email: socialGoogleEmail,
    }),
  });
  const socialGoogleReloginData = await socialGoogleReloginRes.json();
  assert(socialGoogleReloginRes.ok && !socialGoogleReloginData.isNew && socialGoogleReloginData.account?.accountId === socialGoogleData.account.accountId, 'Google 1-click relogin failed');

  // LINE Social Login
  const socialLineEmail = `line-user-${Date.now()}@line.me`;
  const socialLineRes = await fetch(`${base}/api/auth/social`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'line',
      providerId: `line_${Date.now()}`,
      email: socialLineEmail,
      name: 'นักเดินทาง LINE',
    }),
  });
  const socialLineData = await socialLineRes.json();
  assert(socialLineRes.status === 201 && socialLineData.account?.provider === 'line', 'LINE 1-click registration failed');
  console.log('✅ 15. Fast 1-Click Social Login (Google & LINE) passed');

  // 16. Real Google OAuth Endpoint Validation
  const emptyGoogleRes = await fetch(`${base}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert(emptyGoogleRes.status === 400, 'Empty Google token request should return 400');

  const invalidGoogleRes = await fetch(`${base}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: 'invalid.jwt.token' }),
  });
  assert(invalidGoogleRes.status === 401, 'Invalid Google token should return 401');
  console.log('✅ 16. Real Google OAuth Token Verification endpoint passed');

  console.log('\n🎉 ALL DAYPASS API CHECKS PASSED!');
}

runE2ETest().catch(err => {
  console.error('\n❌ E2E Test Failed:', err);
  process.exit(1);
});
