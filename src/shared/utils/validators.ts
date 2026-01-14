export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function isValidTimeFormat(time: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
}

export function isValidDateFormat(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, "");
  const regex = /^\+?[1-9]\d{6,14}$/;
  return regex.test(cleaned);
}

export function isWithinOperatingHours(
  openingTime: string,
  closingTime: string,
  startTime: string,
  endTime: string
): boolean {
  const opening = timeToMinutes(openingTime);
  const closing = timeToMinutes(closingTime);
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return start >= opening && end <= closing;
}

export function hasTimeOverlap(
  existingStart: string,
  existingEnd: string,
  newStart: string,
  newEnd: string
): boolean {
  const existStart = timeToMinutes(existingStart);
  const existEnd = timeToMinutes(existingEnd);
  const newStartMin = timeToMinutes(newStart);
  const newEndMin = timeToMinutes(newEnd);
  return existStart < newEndMin && existEnd > newStartMin;
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const start = timeToMinutes(startTime);
  return minutesToTime(start + durationMinutes);
}
