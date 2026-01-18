// Excel/CSV Export Utilities

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
) {
  if (data.length === 0) return;

  // Create header row
  const headers = columns.map(col => col.label).join(';');
  
  // Create data rows
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return value.toString().replace('.', ',');
      if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
      // Escape quotes and wrap in quotes if contains semicolon
      const strValue = String(value);
      if (strValue.includes(';') || strValue.includes('"') || strValue.includes('\n')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    }).join(';')
  ).join('\n');

  const csvContent = `\uFEFF${headers}\n${rows}`; // BOM for Excel UTF-8

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatDateFR(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR');
}

export function formatNumberFR(num: number | null | undefined): string {
  if (num === null || num === undefined) return '';
  return num.toLocaleString('fr-FR');
}
