import { FileText, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface ReportEmptyStateProps {
  type: 'chart' | 'table' | 'forecast';
  message?: string;
  className?: string;
}

export function ReportEmptyState({ type, message, className }: ReportEmptyStateProps) {
  const { t } = useI18n();
  const re = t.reportEmpty;

  const config = {
    chart: {
      icon: BarChart3,
      title: re.chartTitle,
      description: message || re.chartDesc,
    },
    table: {
      icon: FileText,
      title: re.tableTitle,
      description: message || re.tableDesc,
    },
    forecast: {
      icon: TrendingUp,
      title: re.forecastTitle,
      description: message || re.forecastDesc,
    },
  };

  const { icon: Icon, title, description } = config[type];

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="p-4 rounded-full bg-muted/50 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {description}
      </p>
    </div>
  );
}
