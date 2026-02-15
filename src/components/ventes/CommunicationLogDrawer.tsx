import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Mail,
  Phone,
  MessageCircle,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  FileText,
  Receipt,
  Truck,
  CreditCard,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale } from '@/i18n/dateLocale';
import { getRecentCommunications, CommunicationLog, CommunicationType, CommunicationCategory } from '@/lib/communicationLogger';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<CommunicationType, { label: string; icon: React.ReactNode; color: string }> = {
  email: { label: 'Email', icon: <Mail className="h-4 w-4" />, color: 'text-blue-500 bg-blue-50' },
  whatsapp: { label: 'WhatsApp', icon: <MessageCircle className="h-4 w-4" />, color: 'text-green-500 bg-green-50' },
  sms: { label: 'SMS', icon: <MessageSquare className="h-4 w-4" />, color: 'text-purple-500 bg-purple-50' },
  call: { label: 'Appel', icon: <Phone className="h-4 w-4" />, color: 'text-orange-500 bg-orange-50' },
  other: { label: 'Autre', icon: <Send className="h-4 w-4" />, color: 'text-gray-500 bg-gray-50' },
};

const CATEGORY_CONFIG: Record<CommunicationCategory, { label: string; icon: React.ReactNode }> = {
  devis_reminder: { label: 'Relance Devis', icon: <FileText className="h-3 w-3" /> },
  facture_reminder: { label: 'Relance Facture', icon: <Receipt className="h-3 w-3" /> },
  devis_send: { label: 'Envoi Devis', icon: <FileText className="h-3 w-3" /> },
  bc_confirmation: { label: 'Confirmation BC', icon: <FileText className="h-3 w-3" /> },
  bl_notification: { label: 'Notification BL', icon: <Truck className="h-3 w-3" /> },
  payment_confirmation: { label: 'Confirmation Paiement', icon: <CreditCard className="h-3 w-3" /> },
  general: { label: 'Général', icon: <MessageSquare className="h-3 w-3" /> },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  sent: { label: 'Envoyé', icon: <Send className="h-3 w-3" />, color: 'text-blue-500' },
  delivered: { label: 'Livré', icon: <CheckCircle className="h-3 w-3" />, color: 'text-green-500' },
  failed: { label: 'Échec', icon: <XCircle className="h-3 w-3" />, color: 'text-red-500' },
  pending: { label: 'En attente', icon: <Clock className="h-3 w-3" />, color: 'text-yellow-500' },
};

interface CommunicationLogDrawerProps {
  clientId?: string;
  clientName?: string;
}

export function CommunicationLogDrawer({ clientId, clientName }: CommunicationLogDrawerProps) {
  const { lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getRecentCommunications(100);
    setLogs(clientId ? data.filter(l => l.client_id === clientId) : data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, clientId]);

  const filteredLogs = typeFilter === 'all' 
    ? logs 
    : logs.filter(l => l.type === typeFilter);

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const date = format(new Date(log.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, CommunicationLog[]>);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          {clientName ? 'Historique' : 'Communications'}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {clientName ? `Communications - ${clientName}` : 'Journal des Communications'}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="call">Appel</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary">{filteredLogs.length} message(s)</Badge>
          </div>

          <Separator />

          {/* Logs List */}
          <ScrollArea className="h-[calc(100vh-200px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Aucune communication enregistrée</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                  <div key={date}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                      {format(new Date(date), 'EEEE d MMMM yyyy', { locale: dateLocale })}
                    </h4>
                    <div className="space-y-3">
                      {dayLogs.map((log) => {
                        const typeConfig = TYPE_CONFIG[log.type];
                        const categoryConfig = CATEGORY_CONFIG[log.category];
                        const statusConfig = STATUS_CONFIG[log.status];

                        return (
                          <div 
                            key={log.id}
                            className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {/* Type Icon */}
                              <div className={cn(
                                "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                                typeConfig.color
                              )}>
                                {typeConfig.icon}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">
                                    {typeConfig.label}
                                  </span>
                                  <Badge variant="outline" className="text-xs gap-1">
                                    {categoryConfig.icon}
                                    {categoryConfig.label}
                                  </Badge>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className={cn("flex items-center gap-1 text-xs", statusConfig.color)}>
                                        {statusConfig.icon}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>{statusConfig.label}</TooltipContent>
                                  </Tooltip>
                                </div>

                                {log.subject && (
                                  <p className="text-sm font-medium truncate">
                                    {log.subject}
                                  </p>
                                )}

                                {log.recipient && (
                                  <p className="text-xs text-muted-foreground">
                                    → {log.recipient}
                                  </p>
                                )}

                                {log.message_preview && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {log.message_preview}
                                  </p>
                                )}

                                {log.reference_id && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Réf: {log.reference_id}
                                  </Badge>
                                )}

                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(log.created_at), { 
                                    addSuffix: true,
                                    locale: dateLocale 
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
