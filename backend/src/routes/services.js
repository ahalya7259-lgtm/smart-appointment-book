const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// Public: list services by business slug
router.get('/public/:slug', (req, res) => {
  const owner = db.prepare('SELECT id, business_name FROM owners WHERE slug = ?').get(req.params.slug);
  if (!owner) return res.status(404).json({ error: 'Business not found' });

  const services = db.prepare(
    'SELECT id, name, duration_minutes, price FROM services WHERE owner_id = ? AND active = 1'
  ).all(owner.id);

  res.json({ businessName: owner.business_name, services });
});

// Owner: list own services
router.get('/', auth, (req, res) => {
  const services = db.prepare('SELECT * FROM services WHERE owner_id = ? ORDER BY name').all(req.owner.id);
  res.json(services);
});

router.post('/', auth, (req, res) => {
  const { name, durationMinutes, price } = req.body;
  if (!name || !durationMinutes) {
    return res.status(400).json({ error: 'name and durationMinutes required' });
  }
  const id = uuid();
  db.prepare(`
    INSERT INTO services (id, owner_id, name, duration_minutes, price)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.owner.id, name, durationMinutes, price || 0);

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  res.status(201).json(service);
});

router.put('/:id', auth, (req, res) => {
  const { name, durationMinutes, price, active } = req.body;
  const existing = db.prepare('SELECT * FROM services WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.owner.id);
  if (!existing) return res.status(404).json({ error: 'Service not found' });

  db.prepare(`
    UPDATE services SET name = ?, duration_minutes = ?, price = ?, active = ?
    WHERE id = ?
  `).run(
    name ?? existing.name,
    durationMinutes ?? existing.duration_minutes,
    price ?? existing.price,
    active !== undefined ? (active ? 1 : 0) : existing.active,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id));
});

router.delete('/:id', auth, (req, res) => {
  const result = db.prepare('DELETE FROM services WHERE id = ? AND owner_id = ?')
    .run(req.params.id, req.owner.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Service not found' });
  res.status(204).end();
});

module.exports = router;
