const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const db = require('../config/db');

const router = express.Router();

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.post('/register', (req, res) => {
  const { name, email, password, businessName } = req.body;
  if (!name || !email || !password || !businessName) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const existing = db.prepare('SELECT id FROM owners WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const id = uuid();
  let slug = slugify(businessName);
  const slugExists = db.prepare('SELECT id FROM owners WHERE slug = ?').get(slug);
  if (slugExists) slug = `${slug}-${id.slice(0, 6)}`;

  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare(`
    INSERT INTO owners (id, name, email, password_hash, business_name, slug)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, email, passwordHash, businessName, slug);

  // default working hours Mon–Sat 09:00–18:00
  const insertHours = db.prepare(`
    INSERT INTO working_hours (id, owner_id, day_of_week, start_time, end_time)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (let d = 1; d <= 6; d++) {
    insertHours.run(uuid(), id, d, '09:00', '18:00');
  }

  const token = jwt.sign({ id, email, slug }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '7d',
  });

  res.status(201).json({
    token,
    owner: { id, name, email, businessName, slug },
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const owner = db.prepare('SELECT * FROM owners WHERE email = ?').get(email);
  if (!owner || !bcrypt.compareSync(password, owner.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: owner.id, email: owner.email, slug: owner.slug },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );

  res.json({
    token,
    owner: {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      businessName: owner.business_name,
      slug: owner.slug,
    },
  });
});

module.exports = router;
