const express = require('express');

function createStubRouter(featureName) {
  const router = express.Router();
  router.use((req, res) => {
    res.status(501).json({ error: `ส่วน${featureName}ยังไม่พร้อมใช้งาน` });
  });
  return router;
}

module.exports = createStubRouter;
