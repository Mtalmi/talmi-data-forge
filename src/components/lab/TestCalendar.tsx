import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FlaskConical,
  Calendar,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';

interface TestCalendarItem {
  id: string;
  bl_id: string;
  client_id: string;
  formule_id: string;
  test_type: '7j' | '28j';
  test_date: string;
  is_completed: boolean;
  resistance_value: number | null;
  is_overdue: boolean;
  is_today: boolean;
  is_upcoming: boolean;
}

interface TestCalendarProps {
  items: TestCalendarItem[];
  onRecordResult: (testId: string, type: '7j' | '28j', value: number) => Promise<boolean>;
  loading?: boolean;
}

export function TestCalendar({ items, onRecordResult, loading = false }: TestCalendarProps) {
  const [selectedTest, setSelectedTest] = useState<TestCalendarItem | null>(null);
  const [resultValue, setResultValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const s = t.testCalendar;

  const overdueTests = items.filter(i => i.is_overdue);
  const todayTests = items.filter(i => i.is_today && !i.is_completed);

  const handleRecordResult = async () => {
    if (!selectedTest || !resultValue) return;
    setSaving(true);
    const testId = selectedTest.id.replace(/-7j$|-28j$/, '');
    const success = await onRecordResult(testId, selectedTest.test_type, parseFloat(resultValue));
    setSaving(false);
    if (success) {
      setSelectedTest(null);
      setResultValue('');
    }
  };

  const getStatusBadge = (item: TestCalendarItem) => {
    if (item.is_completed) {
      return (
        <Badge variant="default" className="bg-success">
          <CheckCircle className="h-3 w-3 mr-1" />
          {item.resistance_value} MPa
        </Badge>
      );
    }
    if (item.is_overdue) {
      return (
        <Badge variant="destructive" className="animate-pulse">
          <AlertTriangle className="h-3 w-3 mr-1" />{s.overdue}
        </Badge>
      );
    }
    if (item.is_today) {
      return (
        <Badge variant="default" className="bg-warning text-warning-foreground">
          <Clock className="h-3 w-3 mr-1" />{s.today}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Calendar className="h-3 w-3 mr-1" />{s.planned}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {overdueTests.length > 0 && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">
                {overdueTests.length} {s.overdueTests}
              </p>
              <p className="text-sm text-muted-foreground">{s.overdueMessage}</p>
            </div>
          </div>
        </div>
      )}

      {todayTests.length > 0 && (
        <div className="card-industrial">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="h-5 w-5 text-warning" />
            <h3 className="font-semibold">{s.todayTests}</h3>
            <Badge variant="default" className="bg-warning text-warning-foreground">{todayTests.length}</Badge>
          </div>
          <Table className="data-table-industrial">
            <TableHeader>
              <TableRow>
                <TableHead>{s.blNumber}</TableHead>
                <TableHead>{s.client}</TableHead>
                <TableHead>{s.formula}</TableHead>
                <TableHead>{s.type}</TableHead>
                <TableHead>{s.action}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayTests.map(item => (
                <TableRow key={item.id} className="bg-warning/5">
                  <TableCell className="font-mono">{item.bl_id}</TableCell>
                  <TableCell>{item.client_id}</TableCell>
                  <TableCell className="font-mono text-sm">{item.formule_id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.resistance} {item.test_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => setSelectedTest(item)}>
                      <FlaskConical className="h-4 w-4 mr-1" />{s.record}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="card-industrial">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{s.crushCalendar}</h3>
        </div>
        {items.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{s.noTestsPlanned}</p>
          </div>
        ) : (
          <Table className="data-table-industrial">
            <TableHeader>
              <TableRow>
                <TableHead>{s.date}</TableHead>
                <TableHead>{s.blNumber}</TableHead>
                <TableHead>{s.client}</TableHead>
                <TableHead>{s.formula}</TableHead>
                <TableHead>{s.type}</TableHead>
                <TableHead>{s.status}</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.slice(0, 20).map(item => (
                <TableRow
                  key={item.id}
                  className={cn(
                    item.is_overdue && 'bg-destructive/5',
                    item.is_today && !item.is_completed && 'bg-warning/5'
                  )}
                >
                  <TableCell className="font-medium">
                    {format(new Date(item.test_date), 'dd/MM/yyyy', { locale: dateLocale || undefined })}
                  </TableCell>
                  <TableCell className="font-mono">{item.bl_id}</TableCell>
                  <TableCell>{item.client_id}</TableCell>
                  <TableCell className="font-mono text-sm">{item.formule_id}</TableCell>
                  <TableCell><Badge variant="outline">{item.test_type}</Badge></TableCell>
                  <TableCell>{getStatusBadge(item)}</TableCell>
                  <TableCell>
                    {!item.is_completed && !item.is_upcoming && (
                      <Button size="sm" variant="ghost" onClick={() => setSelectedTest(item)}>
                        {s.enter}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              {s.recordResult} {selectedTest?.test_type}
            </DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 p-3 rounded bg-muted/30">
                <div>
                  <span className="text-xs text-muted-foreground">{s.blNumber}</span>
                  <p className="font-mono font-medium">{selectedTest.bl_id}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{s.client}</span>
                  <p className="font-medium">{selectedTest.client_id}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{s.formula}</span>
                  <p className="font-mono">{selectedTest.formule_id}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{s.testDate}</span>
                  <p>{format(new Date(selectedTest.test_date), 'dd/MM/yyyy', { locale: dateLocale || undefined })}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="form-label-industrial">
                  {s.resistanceMPa}
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  placeholder="Ex: 28.5"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedTest(null)}>{s.cancel}</Button>
                <Button onClick={handleRecordResult} disabled={!resultValue || saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {s.save}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
