import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Mail, Plus, Trash2, Loader2, Users, Settings, Calendar, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

type Frequency = 'daily' | 'weekly' | 'both';

interface Recipient {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  frequency: Frequency;
  created_at: string;
}

export function DigestRecipientsManager() {
  const { t } = useI18n();
  const dr = t.digestRecipients;

  const FREQUENCY_CONFIG: Record<Frequency, { label: string; icon: React.ReactNode; color: string }> = {
    daily: { label: dr.daily, icon: <Calendar className="h-3 w-3" />, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
    weekly: { label: dr.weekly, icon: <CalendarDays className="h-3 w-3" />, color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
    both: { label: dr.both, icon: <Mail className="h-3 w-3" />, color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  };

  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newFrequency, setNewFrequency] = useState<Frequency>('weekly');
  const [adding, setAdding] = useState(false);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('security_digest_recipients').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setRecipients((data || []) as Recipient[]);
    } catch (error: any) {
      console.error('Error fetching recipients:', error);
      toast.error(dr.loadError);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (open) fetchRecipients(); }, [open]);

  const handleAddRecipient = async () => {
    if (!newEmail.trim()) { toast.error(dr.emailRequired); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) { toast.error(dr.invalidEmail); return; }
    setAdding(true);
    try {
      const { error } = await supabase.from('security_digest_recipients').insert({ email: newEmail.trim().toLowerCase(), name: newName.trim() || null, is_active: true, frequency: newFrequency });
      if (error) { if (error.code === '23505') { toast.error(dr.duplicateEmail); } else { throw error; } return; }
      toast.success(dr.added); setNewEmail(''); setNewName(''); setNewFrequency('weekly'); fetchRecipients();
    } catch (error: any) { console.error('Error adding recipient:', error); toast.error(error.message || dr.addError); } finally { setAdding(false); }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('security_digest_recipients').update({ is_active: !isActive }).eq('id', id);
      if (error) throw error;
      setRecipients(prev => prev.map(r => (r.id === id ? { ...r, is_active: !isActive } : r)));
      toast.success(isActive ? dr.deactivated : dr.activated);
    } catch (error: any) { toast.error(dr.updateError); }
  };

  const handleFrequencyChange = async (id: string, frequency: Frequency) => {
    try {
      const { error } = await supabase.from('security_digest_recipients').update({ frequency }).eq('id', id);
      if (error) throw error;
      setRecipients(prev => prev.map(r => (r.id === id ? { ...r, frequency } : r)));
      toast.success(dr.frequencyUpdated);
    } catch (error: any) { toast.error(dr.updateError); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('security_digest_recipients').delete().eq('id', id);
      if (error) throw error;
      setRecipients(prev => prev.filter(r => r.id !== id));
      toast.success(dr.deleted);
    } catch (error: any) { toast.error(dr.deleteError); }
  };

  const activeCount = recipients.filter(r => r.is_active).length;
  const dailyCount = recipients.filter(r => r.is_active && (r.frequency === 'daily' || r.frequency === 'both')).length;
  const weeklyCount = recipients.filter(r => r.is_active && (r.frequency === 'weekly' || r.frequency === 'both')).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 border-purple-500/30 text-purple-500 hover:bg-purple-500/10">
          <Settings className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{dr.recipients}</span>
          {activeCount > 0 && (<Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeCount}</Badge>)}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />{dr.title}</DialogTitle>
          <DialogDescription>{dr.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/30">
            <div className="flex gap-2">
              <Input placeholder="email@exemple.com" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="flex-1" />
              <Input placeholder={dr.name} value={newName} onChange={(e) => setNewName(e.target.value)} className="w-24" />
            </div>
            <div className="flex gap-2">
              <Select value={newFrequency} onValueChange={(v) => setNewFrequency(v as Frequency)}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily"><span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{dr.dailyTime}</span></SelectItem>
                  <SelectItem value="weekly"><span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" />{dr.weeklyTime}</span></SelectItem>
                  <SelectItem value="both"><span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{dr.both}</span></SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddRecipient} disabled={adding || !newEmail.trim()} size="sm" className="gap-1.5 px-4">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {dr.add}
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : recipients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-50" /><p className="text-sm">{dr.noRecipients}</p></div>
            ) : (
              recipients.map((recipient) => {
                const freqConfig = FREQUENCY_CONFIG[recipient.frequency];
                return (
                  <div key={recipient.id} className={cn('flex items-center gap-2 p-3 rounded-lg border transition-colors', recipient.is_active ? 'bg-background' : 'bg-muted/50 opacity-60')}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{recipient.name || recipient.email}</p>
                      {recipient.name && <p className="text-xs text-muted-foreground truncate">{recipient.email}</p>}
                    </div>
                    <Select value={recipient.frequency} onValueChange={(v) => handleFrequencyChange(recipient.id, v as Frequency)}>
                      <SelectTrigger className={cn('w-28 h-7 text-xs border', freqConfig.color)}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{dr.daily}</SelectItem>
                        <SelectItem value="weekly">{dr.weekly}</SelectItem>
                        <SelectItem value="both">{dr.both}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Switch checked={recipient.is_active} onCheckedChange={() => handleToggleActive(recipient.id, recipient.is_active)} className="data-[state=checked]:bg-green-500" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(recipient.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {recipients.length > 0 && (
            <div className="flex gap-4 justify-center text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-blue-500" /><span>{dailyCount} {dr.daily.toLowerCase()}</span></div>
              <div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-purple-500" /><span>{weeklyCount} {dr.weekly.toLowerCase()}</span></div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
