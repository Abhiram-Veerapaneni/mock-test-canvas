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

/**
 * Format a Date object or timestamp as HTML datetime-local input string (YYYY-MM-DDTHH:mm)
 *
 * @param {Date|string|number} date
 * @returns {string}
 */
export function toDateTimeLocalValue(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${YYYY}-${MM}-${DD}T${HH}:${mm}`;
}

/**
 * Format a start and end date range in 12-hour AM/PM format
 *
 * @param {Date|string|number} start
 * @param {Date|string|number} end
 * @returns {string}
 */
export function formatDateRange12h(start, end) {
  if (!start && !end) return '';
  if (start && !end) return `From ${formatDateTime12h(start)}`;
  if (!start && end) return `Until ${formatDateTime12h(end)}`;

  const startDate = new Date(start);
  const endDate = new Date(end);
  const isSameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();

  if (isSameDay) {
    const month = MONTH_NAMES[startDate.getMonth()];
    const day = startDate.getDate();
    return `${month} ${day}, ${formatTime12h(startDate)} – ${formatTime12h(endDate)}`;
  }

  return `${formatDateTime12h(startDate)} – ${formatDateTime12h(endDate)}`;
}

/**
 * Check if a timestamp falls within a selected time filter
 *
 * @param {Date|string|number} timestamp
 * @param {Object} options
 * @param {'ALL'|'15M'|'1H'|'TODAY'|'CUSTOM'} [options.timePreset='ALL']
 * @param {string} [options.customStart='']
 * @param {string} [options.customEnd='']
 * @param {number} [options.referenceNow=Date.now()]
 * @returns {boolean}
 */
export function isTimestampInFilter(timestamp, { timePreset = 'ALL', customStart = '', customEnd = '', referenceNow = Date.now() } = {}) {
  if (!timestamp) return false;
  const itemMs = new Date(timestamp).getTime();
  if (isNaN(itemMs)) return false;

  if (timePreset === 'ALL') {
    return true;
  }

  if (timePreset === '15M') {
    return itemMs >= referenceNow - 15 * 60 * 1000;
  }

  if (timePreset === '1H') {
    return itemMs >= referenceNow - 60 * 60 * 1000;
  }

  if (timePreset === 'TODAY') {
    const itemDate = new Date(itemMs);
    const today = new Date(referenceNow);
    return (
      itemDate.getFullYear() === today.getFullYear() &&
      itemDate.getMonth() === today.getMonth() &&
      itemDate.getDate() === today.getDate()
    );
  }

  if (timePreset === 'CUSTOM') {
    if (customStart) {
      const startMs = new Date(customStart).getTime();
      if (!isNaN(startMs) && itemMs < startMs) {
        return false;
      }
    }
    if (customEnd) {
      const endMs = new Date(customEnd).getTime();
      if (!isNaN(endMs) && itemMs > endMs) {
        return false;
      }
    }
    return true;
  }

  return true;
}
