/**
 * dateUtils.js
 * Standard 12-hour AM/PM time and date formatting utilities.
 * Enforces explicit AM/PM across all browser locales and operating systems.
 */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a date or timestamp as 12-hour time with explicit AM/PM
 * Example: "10:00 PM", "9:15 AM", "12:00 PM"
 *
 * @param {Date|string|number} date
 * @param {Object} [options]
 * @param {boolean} [options.includeSeconds=false]
 * @returns {string}
 */
export function formatTime12h(date, { includeSeconds = false } = {}) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12

  if (includeSeconds) {
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  }
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Format a date or timestamp with date and 12-hour AM/PM time
 * Example: "Oct 12, 10:00 PM" or "Oct 12, 2026, 10:00 PM"
 *
 * @param {Date|string|number} date
 * @param {Object} [options]
 * @param {boolean} [options.includeYear=false]
 * @param {boolean} [options.includeSeconds=false]
 * @returns {string}
 */
export function formatDateTime12h(date, { includeYear = false, includeSeconds = false } = {}) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const month = MONTH_NAMES[d.getMonth()];
  const day = d.getDate();
  const yearStr = includeYear ? `, ${d.getFullYear()}` : '';
  const timeStr = formatTime12h(d, { includeSeconds });

  return `${month} ${day}${yearStr}, ${timeStr}`;
}
