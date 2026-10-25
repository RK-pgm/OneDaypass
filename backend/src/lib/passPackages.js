const PASS_PACKAGE_CONFIG = {
  single: {
    id: 'single',
    title: 'พาสเที่ยว 1 วัน (ต้นแบบ)',
    badge: 'แผนเที่ยว 1 วัน',
    pricePerPerson: 199,
    transitAdvice: 'ราคาและสิทธิประโยชน์เป็นข้อมูลต้นแบบ ไม่รวมค่าเดินทาง และไม่มีการเรียกเก็บเงินจริง',
    placesCount: 4,
  },
  explorer: {
    id: 'explorer',
    title: 'พาสเที่ยว 6 จุด (ต้นแบบ)',
    badge: 'แผนเที่ยว 6 จุด',
    pricePerPerson: 299,
    transitAdvice: 'ราคาและสิทธิประโยชน์เป็นข้อมูลต้นแบบ ไม่รวมค่าเดินทาง และไม่มีการเรียกเก็บเงินจริง',
    placesCount: 6,
    couponCount: 2,
    missionCount: 1,
  },
};

module.exports = { PASS_PACKAGE_CONFIG };
