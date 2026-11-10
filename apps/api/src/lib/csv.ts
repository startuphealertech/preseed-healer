type Column<T> = { header: string; value: (row: T) => unknown };

function cell(v: unknown): string {
  let s = v == null ? "" : v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join("; ") : String(v);
  // Neutralise spreadsheet formula injection (=, +, -, @, tab, CR at the start of a cell).
  // Plain numbers / phone numbers (+91 98765 43210) can't be formulas, so keep them readable.
  if (/^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** RFC 4180 CSV with a UTF-8 BOM so Excel opens ₹ and non-Latin text correctly. */
export function toCsv<T>(rows: T[], columns: Column<T>[]): string {
  const lines = [columns.map((c) => cell(c.header)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => cell(c.value(row))).join(","));
  return "﻿" + lines.join("\r\n");
}
