require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const db = require('./config/db');

const email = 'owner@demo.com';
const existing = db.prepare('SELECT id FROM owners WHERE email = ?').get(email);
if (existing) {
  console.log('Demo owner already exists');
  process.exit(0);
}

const id = uuid();
const passwordHash = bcrypt.hashSync('password123', 10);

db.prepare(`
  INSERT INTO owners (id, name, email, password_hash, business_name, slug)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(id, 'Demo Owner', email, passwordHash, 'Glow Salon', 'glow-salon');

const services = [
  { name: 'Haircut', duration: 30, price: 25 },
  { name: 'Haircut + Wash', duration: 45, price: 35 },
  { name: 'Beard Trim', duration: 20, price: 15 },
  { name: 'Full Color', duration: 90, price: 80 },
];

const insertService = db.prepare(`
  INSERT INTO services (id, owner_id, name, duration_minutes, price)
  VALUES (?, ?, ?, ?, ?)
`);
for (const s of services) {
  insertService.run(uuid(), id, s.name, s.duration, s.price);
}

const insertHours = db.prepare(`
  INSERT INTO working_hours (id, owner_id, day_of_week, start_time, end_time)
  VALUES (?, ?, ?, ?, ?)
`);
for (let d = 1; d <= 6; d++) {
  insertHours.run(uuid(), id, d, '09:00', '18:00');
}

console.log('Seeded demo owner:');
console.log('  Email:    owner@demo.com');
console.log('  Password: password123');
console.log('  Booking:  /book/glow-salon');
