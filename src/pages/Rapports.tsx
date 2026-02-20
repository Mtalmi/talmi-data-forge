import * as React from 'react';
const { useState, useRef } = React;
import WorldClassReports from '@/components/reports/WorldClassReports';
import MainLayout from '@/components/layout/MainLayout';
import { useI18n } from '@/i18n/I18nContext';
import { useReportingData } from '@/hooks/useReportingData';
import { MonthlyReportPdfGenerator } from '@/components/reports/MonthlyReportPdfGenerator';
import { ReportKPICard } from '@/components/reports/ReportKPICard';
import { ReportEmptyState } from '@/components/reports/ReportEmptyState';
import { ReportPageSkeleton, ChartSkeleton, TableSkeleton } from '@/components/reports/ReportSkeleton';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Package,
  DollarSign,
  BarChart3,
  Calendar,
  RefreshCw,
  Target,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))'];

export default function Rapports() {
  const { data, loading, selectedPeriod, setSelectedPeriod, refresh, previousPeriodData } = useReportingData();
  const { t, lang } = useI18n();
  const [activeTab, setActiveTab] = useState('overview');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { containerRef, isRefreshing, pullDistance, progress } = usePullToRefresh({
    onRefresh: async () => {
      await refresh();
    },
  });

  // Calculate trend percentages
  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case '6m': return t.pages.rapports.previousPeriod;
      case '12m': return t.pages.rapports.previousYear;
      case 'ytd': return t.pages.rapports.samePeriodLastYear;
      default: return t.pages.rapports.previousPeriod;
    }
  };

  if (loading && !data) {
    return (
      <MainLayout>
        <ReportPageSkeleton />
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">{t.pages.rapports.unableToLoad}</p>
          <Button onClick={refresh}>{t.pages.rapports.retry}</Button>
        </div>
      </MainLayout>
    );
  }

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 2) return <TrendingUp className="h-4 w-4 text-success" />;
    if (value < -2) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  // Calculate trends from previous period
  const caTrend = previousPeriodData 
    ? calculateTrend(data.summary.totalCA, previousPeriodData.totalCA)
    : undefined;
  const profitTrend = previousPeriodData
    ? calculateTrend(data.summary.profitNet, previousPeriodData.profitNet)
    : undefined;
  const volumeTrend = previousPeriodData
    ? calculateTrend(data.summary.totalVolume, previousPeriodData.totalVolume)
    : undefined;
  const margeTrend = previousPeriodData
    ? data.summary.avgMargePct - previousPeriodData.avgMargePct
    : undefined;

  return (
    <MainLayout>
      <WorldClassReports />
      {/* Legacy content hidden — WorldClassReports is the active UI */}
    </MainLayout>
  );
}
