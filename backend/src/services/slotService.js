const db = require('../config/db');
const { parse, format, addMinutes, isBefore, isAfter, areIntervalsOverlapping } = require('date-fns');

const BUFFER = parseInt(process.env.BUFFER_MINUTES || '5', 10);

/**
 * Generate available time slots for a given owner, service and date (YYYY-MM-DD).
 */
function getAvailableSlots(ownerId, serviceId, dateStr) {
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND owner_id = ? AND active = 1')
    .get(serviceId, ownerId);
  if (!service) return [];

  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  const dayOfWeek = date.getDay(); // 0 = Sunday

  const hours = db.prepare(
    'SELECT * FROM working_hours WHERE owner_id = ? AND day_of_week = ?'
  ).get(ownerId, dayOfWeek);

  if (!hours) return []; // closed that day

  const dayStart = parse(`${dateStr} ${hours.start_time}`, 'yyyy-MM-dd HH:mm', new Date());
  const dayEnd = parse(`${dateStr} ${hours.end_time}`, 'yyyy-MM-dd HH:mm', new Date());

  const existing = db.prepare(`
    SELECT start_at, end_at FROM appointments
    WHERE owner_id = ? AND date(start_at) = ? AND status IN ('confirmed', 'completed')
  `).all(ownerId, dateStr);

  const busy = existing.map((a) => ({
    start: new Date(a.start_at),
    end: addMinutes(new Date(a.end_at), BUFFER),
  }));

  const slots = [];
  let cursor = dayStart;
  const duration = service.duration_minutes;

  while (true) {
    const slotEnd = addMinutes(cursor, duration);
    if (isAfter(slotEnd, dayEnd)) break;

    const overlaps = busy.some((b) =>
      areIntervalsOverlapping(
        { start: cursor, end: slotEnd },
        { start: b.start, end: b.end },
        { inclusive: true }
      )
    );

    // skip past slots if date is today
    const now = new Date();
    const isPast = dateStr === format(now, 'yyyy-MM-dd') && isBefore(cursor, now);

    if (!overlaps && !isPast) {
      slots.push({
        start: format(cursor, "yyyy-MM-dd'T'HH:mm:ss"),
        end: format(slotEnd, "yyyy-MM-dd'T'HH:mm:ss"),
        label: format(cursor, 'HH:mm'),
      });
    }

    cursor = addMinutes(cursor, 15); // step every 15 min
  }

  return slots;
}

module.exports = { getAvailableSlots };
