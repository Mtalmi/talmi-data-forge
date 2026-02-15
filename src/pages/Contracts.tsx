import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { getDateLocale, getNumberLocale } from '@/i18n/dateLocale';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileText, 
  Plus, 
  Truck, 
  Tractor, 
  MapPin, 
  Upload, 
  Loader2, 
  ExternalLink,
  Calendar,
  DollarSign,
  Shield,
  Building,
  Check,
  X,
  AlertTriangle,
  TrendingDown,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContractCompliance } from '@/hooks/useContractCompliance';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

type ContractType = 'camion_rental' | 'trax_rental' | 'terrain_rental';

interface Contract {
  id: string;
  contract_type: ContractType;
  title: string;
  description: string | null;
  provider_name: string;
  monthly_amount: number;
  start_date: string;
  end_date: string | null;
  pdf_url: string;
  is_active: boolean;
  ras_applicable: boolean;
  ras_rate: number;
  created_at: string;
}

export default function Contracts() {
  const { user, canApproveDevis, isCeo } = useAuth();
  const { t, lang } = useI18n();
  const dateLocale = getDateLocale(lang);
  const numberLocale = getNumberLocale(lang);
  const c = t.pages.contracts;
  const { stats, expirationAlerts, suppliers } = useContractCompliance();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [contractType, setContractType] = useState<ContractType>('camion_rental');
  const [title, setTitle] = useState('');
  const [providerName, setProviderName] = useState('');
  const [selectedFournisseur, setSelectedFournisseur] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [equipmentCount, setEquipmentCount] = useState('1');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CONTRACT_TYPE_CONFIG: Record<ContractType, { label: string; icon: React.ReactNode; color: string }> = {
    camion_rental: { label: c.truckRental, icon: <Truck className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
    trax_rental: { label: c.traxRental, icon: <Tractor className="h-4 w-4" />, color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
    terrain_rental: { label: c.landRental, icon: <MapPin className="h-4 w-4" />, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
  };

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      toast.error(c.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error(c.pdfOnly);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(c.fileTooLarge);
      return;
    }

    setUploading(true);
    try {
      const fileName = `${contractType}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName);

      setPdfUrl(urlData.publicUrl);
      setPdfFileName(file.name);
      toast.success(c.pdfUploaded);
    } catch (error: any) {
      toast.error(c.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setContractType('camion_rental');
    setTitle('');
    setProviderName('');
    setSelectedFournisseur('');
    setMonthlyAmount('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setContactPerson('');
    setContactPhone('');
    setContactEmail('');
    setEquipmentCount('1');
    setEquipmentDescription('');
    setPdfUrl('');
    setPdfFileName('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !providerName.trim() || !monthlyAmount || !startDate || !pdfUrl) {
      toast.error(c.fillRequired);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .insert({
          contract_type: contractType,
          title: title.trim(),
          description: description.trim() || null,
          provider_name: providerName.trim(),
          fournisseur_id: selectedFournisseur && selectedFournisseur !== 'none' ? selectedFournisseur : null,
          monthly_amount: parseFloat(monthlyAmount),
          start_date: startDate,
          end_date: endDate || null,
          pdf_url: pdfUrl,
          is_active: true,
          ras_applicable: contractType === 'terrain_rental',
          ras_rate: contractType === 'terrain_rental' ? 15 : 0,
          contact_person: contactPerson.trim() || null,
          contact_phone: contactPhone.trim() || null,
          contact_email: contactEmail.trim() || null,
          equipment_count: parseInt(equipmentCount) || 1,
          equipment_description: equipmentDescription.trim() || null,
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success(c.contractAdded);
      setDialogOpen(false);
      resetForm();
      fetchContracts();
    } catch (error: any) {
      toast.error(error.message || c.loadError);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleContractStatus = async (contract: Contract) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ is_active: !contract.is_active })
        .eq('id', contract.id);

      if (error) throw error;

      toast.success(contract.is_active ? c.contractDeactivated : c.contractActivated);
      fetchContracts();
    } catch (error: any) {
      toast.error(c.updateError);
    }
  };

  const groupedContracts = {
    camion_rental: contracts.filter(c => c.contract_type === 'camion_rental'),
    trax_rental: contracts.filter(c => c.contract_type === 'trax_rental'),
    terrain_rental: contracts.filter(c => c.contract_type === 'terrain_rental'),
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              {c.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{c.subtitle}</p>
          </div>
          
          {canApproveDevis && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {c.newContract}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {c.addContract}
                  </DialogTitle>
                  <DialogDescription>{c.addContractDesc}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{c.contractType} *</Label>
                    <Select value={contractType} onValueChange={(v) => setContractType(v as ContractType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTRACT_TYPE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {config.icon}
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {contractType === 'terrain_rental' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <Shield className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="text-xs text-amber-500">
                        <strong>RAS 15%</strong> {c.rasNotice}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{c.contractTitle} *</Label>
                    <Input placeholder="Ex: Location Camion Benne 20T" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{c.provider} *</Label>
                      <Input placeholder={c.providerName} value={providerName} onChange={(e) => setProviderName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{c.linkSupplier}</Label>
                      <Select value={selectedFournisseur} onValueChange={setSelectedFournisseur}>
                        <SelectTrigger><SelectValue placeholder={c.selectSupplier} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{c.none}</SelectItem>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.nom_fournisseur}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{c.monthlyAmount} *</Label>
                      <Input type="number" placeholder="0.00" value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{c.equipmentCount}</Label>
                      <Input type="number" placeholder="1" value={equipmentCount} onChange={(e) => setEquipmentCount(e.target.value)} min="1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{c.equipmentDesc}</Label>
                    <Input placeholder={c.equipmentPlaceholder} value={equipmentDescription} onChange={(e) => setEquipmentDescription(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{c.startDate} *</Label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{c.endDate}</Label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                  </div>

                  <Separator />
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><User className="h-4 w-4" />{c.contactPerson}</Label>
                    <Input placeholder={c.contactName} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Phone className="h-4 w-4" />{c.phone}</Label>
                      <Input placeholder="+212 6XX XXX XXX" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Mail className="h-4 w-4" />{c.email}</Label>
                      <Input type="email" placeholder="contact@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                    </div>
                  </div>

                  <Separator />
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Upload className="h-4 w-4" />{c.pdfDocument} *</Label>
                    
                    {pdfUrl ? (
                      <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg">
                        <FileText className="h-5 w-5 text-success" />
                        <span className="text-sm flex-1 truncate">{pdfFileName}</span>
                        <Check className="h-4 w-4 text-success" />
                        <Button variant="ghost" size="sm" onClick={() => { setPdfUrl(''); setPdfFileName(''); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                          "hover:border-primary hover:bg-primary/5",
                          "flex flex-col items-center gap-2"
                        )}
                      >
                        {uploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{c.uploadPdf}</p>
                          </>
                        )}
                      </div>
                    )}
                    
                    <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
                  </div>

                  <div className="space-y-2">
                    <Label>{c.notes}</Label>
                    <Textarea placeholder={c.notesPlaceholder} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>{c.cancel}</Button>
                  <Button onClick={handleSubmit} disabled={submitting || !pdfUrl}>
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{c.saving}</>
                    ) : (
                      c.save
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Compliance Summary Banner */}
        {stats.missingContracts > 0 && (
          <Alert className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-warning">
                  ⚠️ {stats.missingContracts} {c.missingContracts}
                </span>
                <span className="text-muted-foreground ml-2">
                  {c.taxRisk}: {stats.potentialNonDeductible.toLocaleString(numberLocale)} DH/{lang === 'en' ? 'yr' : lang === 'ar' ? 'سنة' : 'an'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-warning text-warning hover:bg-warning/10"
                onClick={() => setDialogOpen(true)}
              >
                {c.addContracts}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Compliance Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden">
            <div className={cn(
              "absolute inset-0 opacity-10",
              stats.complianceRate >= 90 ? "bg-success" : 
              stats.complianceRate >= 70 ? "bg-warning" : "bg-destructive"
            )} />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {c.complianceRate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={cn(
                  "text-3xl font-bold",
                  stats.complianceRate >= 90 ? "text-success" : 
                  stats.complianceRate >= 70 ? "text-warning" : "text-destructive"
                )}>
                  {stats.complianceRate}%
                </span>
              </div>
              <Progress 
                value={stats.complianceRate} 
                className={cn(
                  "h-2",
                  stats.complianceRate >= 90 ? "[&>div]:bg-success" : 
                  stats.complianceRate >= 70 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"
                )} 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {c.activeContracts}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stats.activeContracts}</span>
                <span className="text-sm text-muted-foreground">/ {stats.totalContracts}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.missingContracts > 0 && (
                  <span className="text-warning">{stats.missingContracts} {c.missing}</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {c.monthlyTotal}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {stats.monthlyTotal.toLocaleString(numberLocale)}
                <span className="text-sm font-normal text-muted-foreground ml-1">DH</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(stats.monthlyTotal * 12).toLocaleString(numberLocale)} DH{c.perYear}
              </p>
            </CardContent>
          </Card>

          <Card className={cn(stats.expiringSoon > 0 && "border-warning/50")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {c.expirations}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-3xl font-bold",
                  stats.expiringSoon > 0 ? "text-warning" : "text-success"
                )}>
                  {stats.expiringSoon}
                </span>
                <span className="text-sm text-muted-foreground">{c.lessThan30}</span>
              </div>
              {expirationAlerts.length > 0 && (
                <p className="text-xs text-warning mt-1">
                  {c.next}: {expirationAlerts[0]?.providerName}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(CONTRACT_TYPE_CONFIG).map(([type, config]) => {
            const typeContracts = groupedContracts[type as ContractType];
            const activeCount = typeContracts.filter(c => c.is_active).length;
            const totalMonthly = typeContracts
              .filter(c => c.is_active)
              .reduce((sum, c) => sum + c.monthly_amount, 0);

            return (
              <Card key={type} className="relative overflow-hidden">
                <div className={cn("absolute inset-0 opacity-5", config.color.split(' ')[0])} />
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge className={cn("gap-1", config.color)}>
                      {config.icon}
                      {config.label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{activeCount}</span>
                    <span className="text-sm text-muted-foreground">{c.activeCount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.monthlyTotalLabel}: <span className="font-mono font-semibold text-foreground">
                      {totalMonthly.toLocaleString()} MAD
                    </span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator />

        {/* Contracts Table */}
        <Card>
          <CardHeader>
            <CardTitle>{c.contractList}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{c.noContracts}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{c.type}</TableHead>
                    <TableHead>{c.titleCol}</TableHead>
                    <TableHead>{c.providerCol}</TableHead>
                    <TableHead>{c.amountPerMonth}</TableHead>
                    <TableHead>{c.period}</TableHead>
                    <TableHead>{c.ras}</TableHead>
                    <TableHead>{c.status}</TableHead>
                    <TableHead>{c.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => {
                    const config = CONTRACT_TYPE_CONFIG[contract.contract_type];
                    return (
                      <TableRow key={contract.id}>
                        <TableCell>
                          <Badge className={cn("gap-1", config.color)}>
                            {config.icon}
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{contract.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            {contract.provider_name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {contract.monthly_amount.toLocaleString()} MAD
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(contract.start_date), 'dd/MM/yy', { locale: dateLocale || undefined })}
                            {contract.end_date && (
                              <>
                                {' → '}
                                {format(new Date(contract.end_date), 'dd/MM/yy', { locale: dateLocale || undefined })}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {contract.ras_applicable ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                              {contract.ras_rate}% {c.ras}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={contract.is_active ? 'default' : 'secondary'}
                            className={contract.is_active ? 'bg-success/10 text-success border-success/30' : ''}
                          >
                            {contract.is_active ? c.active : c.inactive}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(contract.pdf_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {canApproveDevis && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleContractStatus(contract)}
                              >
                                {contract.is_active ? (
                                  <X className="h-4 w-4 text-destructive" />
                                ) : (
                                  <Check className="h-4 w-4 text-success" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
