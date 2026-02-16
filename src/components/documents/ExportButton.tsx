import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { useI18n } from '@/i18n/I18nContext';

interface Column<T> {
  key: keyof T;
  label: string;
}

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  columns: Column<T>[];
  filename: string;
  disabled?: boolean;
}

export function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  disabled = false,
}: ExportButtonProps<T>) {
  const { t } = useI18n();
  const eb = t.exportButton;

  const handleExport = () => {
    if (data.length === 0) {
      toast.error(eb.noData);
      return;
    }

    exportToCSV(data, columns, filename);
    toast.success(eb.exported.replace('{count}', String(data.length)));
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className="gap-2"
    >
      <FileSpreadsheet className="h-4 w-4" />
      {eb.label}
    </Button>
  );
}
