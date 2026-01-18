import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, AlertCircle, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  date: string;
  libelle: string;
  montant: string;
  reference?: string;
  type?: string;
}

interface BankCSVImportProps {
  onImport: (transactions: Array<{
    date_transaction: string;
    date_valeur: string | null;
    libelle: string;
    reference_bancaire: string | null;
    montant: number;
    devise: string;
    type_transaction: string;
    notes: string | null;
  }>) => Promise<{ success: boolean; count?: number }>;
}

const COMMON_BANK_FORMATS = [
  { id: 'auto', label: 'Détection automatique' },
  { id: 'attijariwafa', label: 'Attijariwafa Bank' },
  { id: 'bmce', label: 'BMCE Bank (Bank of Africa)' },
  { id: 'bp', label: 'Banque Populaire' },
  { id: 'cih', label: 'CIH Bank' },
  { id: 'generic', label: 'Format générique' },
];

export default function BankCSVImport({ onImport }: BankCSVImportProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [bankFormat, setBankFormat] = useState('auto');
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    date: '',
    libelle: '',
    montant: '',
    reference: '',
    type: '',
  });
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  const parseCSV = useCallback((text: string): { headers: string[]; rows: CSVRow[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Detect delimiter (comma, semicolon, or tab)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headerRow = parseRow(lines[0]);
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseRow(lines[i]);
      if (values.length === headerRow.length) {
        const row: CSVRow = {};
        headerRow.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return { headers: headerRow, rows };
  }, []);

  const autoDetectMapping = useCallback((headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = { date: '', libelle: '', montant: '' };
    const lowerHeaders = headers.map(h => h.toLowerCase());

    // Date detection
    const datePatterns = ['date', 'dt', 'jour', 'operation', 'valeur'];
    for (const pattern of datePatterns) {
      const idx = lowerHeaders.findIndex(h => h.includes(pattern));
      if (idx !== -1 && !mapping.date) {
        mapping.date = headers[idx];
        break;
      }
    }

    // Libelle/Description detection
    const libellePatterns = ['libelle', 'libellé', 'description', 'detail', 'détail', 'motif', 'wording'];
    for (const pattern of libellePatterns) {
      const idx = lowerHeaders.findIndex(h => h.includes(pattern));
      if (idx !== -1) {
        mapping.libelle = headers[idx];
        break;
      }
    }

    // Amount detection
    const montantPatterns = ['montant', 'amount', 'somme', 'credit', 'debit', 'mouvement'];
    for (const pattern of montantPatterns) {
      const idx = lowerHeaders.findIndex(h => h.includes(pattern));
      if (idx !== -1) {
        mapping.montant = headers[idx];
        break;
      }
    }

    // Reference detection
    const refPatterns = ['reference', 'référence', 'ref', 'numero', 'numéro', 'id'];
    for (const pattern of refPatterns) {
      const idx = lowerHeaders.findIndex(h => h.includes(pattern));
      if (idx !== -1) {
        mapping.reference = headers[idx];
        break;
      }
    }

    return mapping;
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Format invalide',
        description: 'Veuillez sélectionner un fichier CSV',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const { headers, rows } = parseCSV(text);

      if (rows.length === 0) {
        toast({
          title: 'Fichier vide',
          description: 'Le fichier CSV ne contient aucune donnée',
          variant: 'destructive',
        });
        return;
      }

      setHeaders(headers);
      setCsvData(rows);
      setColumnMapping(autoDetectMapping(headers));
      setStep('mapping');
    } catch (err) {
      toast({
        title: 'Erreur de lecture',
        description: 'Impossible de lire le fichier CSV',
        variant: 'destructive',
      });
    }
  }, [parseCSV, autoDetectMapping, toast]);

  const parseDate = (dateStr: string): string => {
    // Try various date formats
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{2})$/, // DD/MM/YY
    ];

    for (const regex of formats) {
      const match = dateStr.match(regex);
      if (match) {
        if (regex === formats[0] || regex === formats[1]) {
          // DD/MM/YYYY or DD-MM-YYYY
          return `${match[3]}-${match[2]}-${match[1]}`;
        } else if (regex === formats[2]) {
          // YYYY-MM-DD (already correct)
          return dateStr;
        } else if (regex === formats[3]) {
          // DD/MM/YY
          const year = parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`;
          return `${year}-${match[2]}-${match[1]}`;
        }
      }
    }

    // Fallback: try native parsing
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM-dd');
    }

    return format(new Date(), 'yyyy-MM-dd');
  };

  const parseAmount = (amountStr: string): { value: number; type: 'credit' | 'debit' } => {
    // Remove spaces and replace comma with dot
    let cleaned = amountStr.replace(/\s/g, '').replace(',', '.');
    
    // Check for negative indicator
    const isNegative = cleaned.startsWith('-') || cleaned.includes('(') || cleaned.toLowerCase().includes('d');
    
    // Remove non-numeric characters except dot and minus
    cleaned = cleaned.replace(/[^0-9.-]/g, '');
    
    const value = Math.abs(parseFloat(cleaned) || 0);
    
    return {
      value,
      type: isNegative ? 'debit' : 'credit',
    };
  };

  const getPreviewData = useCallback(() => {
    return csvData.slice(0, 10).map(row => {
      const dateStr = row[columnMapping.date] || '';
      const libelleStr = row[columnMapping.libelle] || '';
      const montantStr = row[columnMapping.montant] || '0';
      const refStr = columnMapping.reference ? row[columnMapping.reference] : '';

      const { value, type } = parseAmount(montantStr);

      return {
        date: parseDate(dateStr),
        libelle: libelleStr,
        montant: value,
        type,
        reference: refStr,
        original: row,
      };
    });
  }, [csvData, columnMapping]);

  const handleImport = async () => {
    if (!columnMapping.date || !columnMapping.libelle || !columnMapping.montant) {
      toast({
        title: 'Mapping incomplet',
        description: 'Veuillez mapper les colonnes Date, Libellé et Montant',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      const transactions = csvData.map(row => {
        const dateStr = row[columnMapping.date] || '';
        const libelleStr = row[columnMapping.libelle] || '';
        const montantStr = row[columnMapping.montant] || '0';
        const refStr = columnMapping.reference ? row[columnMapping.reference] : null;

        const { value, type } = parseAmount(montantStr);

        return {
          date_transaction: parseDate(dateStr),
          date_valeur: null,
          libelle: libelleStr,
          reference_bancaire: refStr,
          montant: value,
          devise: 'MAD',
          type_transaction: type,
          notes: `Import CSV: ${file?.name}`,
        };
      }).filter(t => t.montant > 0 && t.libelle);

      const result = await onImport(transactions);

      if (result.success) {
        toast({
          title: 'Import réussi',
          description: `${result.count} transaction(s) importée(s)`,
        });
        handleClose();
      } else {
        throw new Error('Import failed');
      }
    } catch (err) {
      toast({
        title: 'Erreur d\'import',
        description: 'Une erreur est survenue lors de l\'import',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setColumnMapping({ date: '', libelle: '', montant: '' });
    setStep('upload');
  };

  const previewData = step === 'preview' ? getPreviewData() : [];

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Import CSV
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === 'upload' && 'Importer un relevé bancaire CSV'}
              {step === 'mapping' && 'Mapper les colonnes'}
              {step === 'preview' && 'Aperçu avant import'}
            </DialogTitle>
          </DialogHeader>

          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Glissez-déposez votre fichier CSV ou cliquez pour sélectionner
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="max-w-xs mx-auto"
                />
              </div>

              <div className="space-y-2">
                <Label>Format bancaire (optionnel)</Label>
                <Select value={bankFormat} onValueChange={setBankFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_BANK_FORMATS.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  La détection automatique fonctionne dans la plupart des cas
                </p>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">
                  <strong>{csvData.length}</strong> lignes détectées dans <strong>{file?.name}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={columnMapping.date} 
                    onValueChange={(v) => setColumnMapping({ ...columnMapping, date: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Libellé <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={columnMapping.libelle} 
                    onValueChange={(v) => setColumnMapping({ ...columnMapping, libelle: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Montant <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={columnMapping.montant} 
                    onValueChange={(v) => setColumnMapping({ ...columnMapping, montant: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Référence (optionnel)</Label>
                  <Select 
                    value={columnMapping.reference || ''} 
                    onValueChange={(v) => setColumnMapping({ ...columnMapping, reference: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucune</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sample data preview */}
              <div>
                <p className="text-sm font-medium mb-2">Aperçu des données brutes (3 premières lignes)</p>
                <div className="overflow-x-auto border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.slice(0, 5).map(h => (
                          <TableHead key={h} className="text-xs">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 3).map((row, i) => (
                        <TableRow key={i}>
                          {headers.slice(0, 5).map(h => (
                            <TableCell key={h} className="text-xs truncate max-w-[150px]">
                              {row[h]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 p-3 rounded-lg">
                <Check className="h-5 w-5" />
                <p className="text-sm">
                  <strong>{csvData.filter(r => r[columnMapping.libelle] && parseAmount(r[columnMapping.montant] || '0').value > 0).length}</strong> transactions prêtes à être importées
                </p>
              </div>

              <div className="overflow-x-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Référence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap">{row.date}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.libelle}</TableCell>
                        <TableCell className={`font-medium ${row.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {row.type === 'credit' ? '+' : '-'}{row.montant.toLocaleString('fr-MA')} MAD
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.type === 'credit' ? 'default' : 'secondary'}>
                            {row.type === 'credit' ? 'Crédit' : 'Débit'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{row.reference || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {csvData.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... et {csvData.length - 10} autres transactions
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            {step === 'mapping' && (
              <>
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Retour
                </Button>
                <Button 
                  onClick={() => setStep('preview')}
                  disabled={!columnMapping.date || !columnMapping.libelle || !columnMapping.montant}
                >
                  Aperçu
                </Button>
              </>
            )}
            {step === 'preview' && (
              <>
                <Button variant="outline" onClick={() => setStep('mapping')}>
                  Retour
                </Button>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Importer {csvData.length} transactions
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
