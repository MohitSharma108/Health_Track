'use strict';

/** 'YYYY-MM-DD' for a Date (or today if omitted), in UTC — the API always
 * speaks calendar dates as plain strings; timezone display is the client's job. */
function toDateStr(d) {
  const dt = d ? new Date(d) : new Date();
  return dt.toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return toDateStr(d);
}

/** Inclusive list of 'YYYY-MM-DD' strings from start to end. */
function dateRange(startStr, endStr) {
  const out = [];
  for (let d = startStr; d <= endStr; d = addDays(d, 1)) out.push(d);
  return out;
}

module.exports = { toDateStr, addDays, dateRange };
