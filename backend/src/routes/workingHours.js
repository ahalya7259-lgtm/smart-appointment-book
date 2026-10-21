const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const hours = db.prepare(
    'SELECT * FROM working_hours WHERE owner_id = ? ORDER BY day_of_week'
  ).all(req.owner.id);
  res.json(hours);
});

router.put('/', auth, (req, res) => {
  const { hours } = req.body; // array of { dayOfWeek, startTime, endTime } or null to close
  if (!Array.isArray(hours)) {
    return res.status(400).json({ error: 'hours array required' });
  }

  const del = db.prepare('DELETE FROM working_hours WHERE owner_id = ?');
  const insert = db.prepare(`
    INSERT INTO working_hours (id, owner_id, day_of_week, start_time, end_time)
    VALUES (?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    del.run(req.owner.id);
    for (const h of hours) {
      if (h.startTime && h.endTime) {
        insert.run(uuid(), req.owner.id, h.dayOfWeek, h.startTime, h.endTime);
      }
    }
  });
  tx();

  res.json(db.prepare('SELECT * FROM working_hours WHERE owner_id = ? ORDER BY day_of_week').all(req.owner.id));
});

module.exports = router;
