import type { Appointment } from '../types';

// Appointment dates are calendar dates in Saudi Arabia, not UTC instants.
export function appointmentDateTime(appointment: Pick<Appointment, 'date' | 'time'>): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(appointment.date ?? '');
  if (!dateMatch) return null;
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(appointment.time ?? '');
  const hour = timeMatch ? Number(timeMatch[1]) : 0;
  const minute = timeMatch ? Number(timeMatch[2]) : 0;
  const value = new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]), hour, minute);
  if (Number.isNaN(value.getTime()) || value.getFullYear() !== Number(dateMatch[1]) || value.getMonth() !== Number(dateMatch[2]) - 1 || value.getDate() !== Number(dateMatch[3])) return null;
  return value;
}

export function isUpcomingAppointment(appointment: Appointment, now = new Date()): boolean {
  if (!(appointment.status === 'upcoming' || appointment.status === 'updated' || (appointment.status as string) === 'booked')) return false;
  const scheduled = appointmentDateTime(appointment);
  return Boolean(scheduled && scheduled.getTime() >= now.getTime());
}

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidAppointmentDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]);
}

export function getNextAppointment(appointments: Appointment[], now = new Date()): Appointment | undefined {
  return appointments
    .filter((appointment) => isUpcomingAppointment(appointment, now))
    .sort((a, b) => (appointmentDateTime(a)?.getTime() ?? Infinity) - (appointmentDateTime(b)?.getTime() ?? Infinity))[0];
}

export function formatAppointmentDate(date: string, locale: 'ar' | 'en'): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-SA-u-ca-gregory', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(value);
}
