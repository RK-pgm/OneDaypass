import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROVINCES,
  findAdministrativeDistrict,
  findAdministrativeSubdistrict,
  getAdministrativeDistricts,
  getAdministrativeSubdistricts,
} from '../src/data/locations.js';

test('all 77 app provinces have official address selector data', () => {
  assert.equal(PROVINCES.length, 77);
  let districtCount = 0;
  let subdistrictCount = 0;
  for (const province of PROVINCES) {
    const districts = getAdministrativeDistricts(province.id);
    assert.ok(districts.length > 0, `${province.name} has no districts`);
    districtCount += districts.length;
    for (const district of districts) {
      const subdistricts = getAdministrativeSubdistricts(province.id, district.id);
      assert.ok(subdistricts.length > 0, `${province.name}/${district.name} has no subdistricts`);
      subdistrictCount += subdistricts.length;
    }
  }
  assert.equal(districtCount, 928);
  assert.equal(subdistrictCount, 7438);
});

test('district and subdistrict selectors cascade and resolve legacy home-base values', () => {
  const district = findAdministrativeDistrict('bangkok', 'samphanthawong');
  assert.equal(district?.name, 'สัมพันธวงศ์');

  const subdistrict = findAdministrativeSubdistrict('bangkok', district.id, 'แขวงตลาดน้อย');
  assert.equal(subdistrict?.name, 'ตลาดน้อย');
  assert.ok(getAdministrativeSubdistricts('chiangmai', 'เมืองเชียงใหม่').some((item) => item.name === 'สุเทพ'));
});
