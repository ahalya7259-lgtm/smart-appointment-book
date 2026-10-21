const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { getAvailableSlots } = require('../services/slotService');

const router = express.Router();

// Public availability
router.get('/availability', (req, res) => {
  const { slug, serviceId, date } = req.query;
  if (!slug || !serviceId || !date) {
    return res.status(400).json({ error: 'slug, serviceId and date required' });
  }
  const owner = db.prepare('SELECT id FROM owners WHERE slug = ?').get(slug);
  if (!owner) return res.status(404).json({ error: 'Business not found' });

  const slots = getAvailableSlots(owner.id, serviceId, date);
  res.json({ date, slots });
});

// Public book
router.post('/book', (req, res) => {
  const { slug, serviceId, customerName, customerPhone, startAt, notes } = req.body;
  if (!slug || !serviceId || !customerName || !customerPhone || !startAt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const owner = db.prepare('SELECT id FROM owners WHERE slug = ?').get(slug);
  if (!owner) return res.status(404).json({ error: 'Business not found' });

  const service = db.prepare('SELECT * FROM services WHERE id = ? AND owner_id = ? AND active = 1')
    .get(serviceId, owner.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  // verify slot still free
  const dateStr = startAt.slice(0, 10);
  const slots = getAvailableSlots(owner.id, serviceId, dateStr);
  const ok = slots.some((s) => s.start === startAt || s.start.startsWith(startAt.slice(0, 16)));
  if (!ok) {
    return res.status(409).json({ error: 'Slot no longer available' });
  }

  const start = new Date(startAt);
  const end = new Date(start.getTime() + service.duration_minutes * 60000);
  const id = uuid();

  db.prepare(`
    INSERT INTO appointments (id, owner_id, service_id, customer_name, customer_phone, start_at, end_at, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
  `).run(
    id,
    owner.id,
    serviceId,
    customerName,
    customerPhone,
    start.toISOString(),
    end.toISOString(),
    notes || null
  );

  res.status(201).json({
    id,
    customerName,
    customerPhone,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    service: service.name,
    status: 'confirmed',
  });
});

// Owner list
router.get('/', auth, (req, res) => {
  const { date, status } = req.query;
  let sql = `
    SELECT a.*, s.name AS service_name
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    WHERE a.owner_id = ?
  `;
  const params = [req.owner.id];

  if (date) {
    sql += ` AND date(a.start_at) = ?`;
    params.push(date);
  }
  if (status) {
    sql += ` AND a.status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY a.start_at ASC`;

  res.json(db.prepare(sql).all(...params));
});

// Owner update status
router.patch('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const allowed = ['confirmed', 'completed', 'cancelled', 'no-show'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = db.prepare(
    'UPDATE appointments SET status = ? WHERE id = ? AND owner_id = ?'
  ).run(status, req.params.id, req.owner.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Appointment not found' });
  res.json(db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id));
});

// Owner manual create (walk-in)
router.post('/', auth, (req, res) => {
  const { serviceId, customerName, customerPhone, startAt, notes } = req.body;
  if (!serviceId || !customerName || !customerPhone || !startAt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const service = db.prepare('SELECT * FROM services WHERE id = ? AND owner_id = ?')
    .get(serviceId, req.owner.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  const start = new Date(startAt);
  const end = new Date(start.getTime() + service.duration_minutes * 60000);
  const id = uuid();

  db.prepare(`
    INSERT INTO appointments (id, owner_id, service_id, customer_name, customer_phone, start_at, end_at, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
  `).run(id, req.owner.id, serviceId, customerName, customerPhone, start.toISOString(), end.toISOString(), notes || null);

  res.status(201).json(db.prepare('SELECT * FROM appointments WHERE id = ?').get(id));
});

module.exports = router;
