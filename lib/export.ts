/**
 * Exports an array of records to an Excel (.xlsx) file and triggers a browser download.
 * Uses dynamic import to avoid bundling xlsx on the server side.
 */
export async function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName = "Sheet1"
): Promise<void> {
  if (typeof window === "undefined") return;
  if (data.length === 0) {
    alert("No data to export.");
    return;
  }

  // Dynamic import keeps xlsx out of the server bundle
  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Adjust column widths based on content
  const colWidths = Object.keys(data[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? "").length)
    ) + 2,
  }));
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
