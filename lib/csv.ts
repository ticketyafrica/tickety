export function toCsv<T>(
  rows: T[],
  columns: { key: keyof T; header: string }[]
): string {
  const escape = (value: unknown): string => {
    let str = value === null || value === undefined ? "" : String(value);
    // Prevent user-entered cells from being interpreted as spreadsheet formulas.
    if (typeof value === "string" && /^[\s]*[=+@-]/.test(str)) str = "'" + str;
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = columns.map((c) => escape(c.header)).join(",");
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(","));
  return [headerLine, ...lines].join("\n");
}