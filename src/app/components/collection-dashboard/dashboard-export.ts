export function dashboardCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value);
          const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
          return `"${safe.replaceAll('"', '""')}"`;
        })
        .join(','),
    )
    .join('\r\n');
}
export function downloadDashboardCsv(rows: (string | number)[][], filename: string) {
  const url = URL.createObjectURL(
    new Blob(['\uFEFF', dashboardCsv(rows)], { type: 'text/csv;charset=utf-8' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
