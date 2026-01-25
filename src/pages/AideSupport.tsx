import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { SystemHealthReport } from '@/components/documents/SystemHealthReport';
import { TrainingReceptionForm } from '@/components/manual/TrainingReceptionForm';
import { generateManualPdf } from '@/components/manual/ManualPdfGenerator';
import {
  BookOpen,
  Shield,
  Camera,
  Clock,
  Ban,
  Package,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Truck,
  FileText,
  Users,
  Zap,
  ArrowRight,
  Download,
  Star,
  Lock,
  GraduationCap,
  Crown,
  Play,
  Workflow,
  Eye,
  Gauge,
  Bell,
  MapPin,
  Fuel,
  Calculator,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const GOLDEN_RULES = [
  {
    number: 1,
    title: 'Photo First',
    subtitle: 'La Photo Avant Tout',
    icon: Camera,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    description: 'Aucune réception de stock ou dépense ne peut être validée sans preuve photographique.',
    details: [
      'Photographiez le bon de livraison ou la facture',
      'Capturez les détails lisibles (date, montant, fournisseur)',
      'Le système vérifie automatiquement les données par IA',
      'Les photos sont archivées dans le coffre-fort numérique',
    ],
  },
  {
    number: 2,
    title: 'Justify Midnight',
    subtitle: 'Justifier les Heures Creuses',
    icon: Clock,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    description: 'Toute activité entre 18h00 et 06h00 doit être accompagnée d\'une justification écrite.',
    details: [
      'Les actions hors-heures sont signalées au CEO',
      'Un champ de justification obligatoire apparaît',
      'Les urgences légitimes sont acceptées avec raison',
      'L\'historique complet est conservé pour audit',
    ],
  },
  {
    number: 3,
    title: 'No Deletions',
    subtitle: 'Zéro Suppression',
    icon: Ban,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    description: 'Les données critiques ne peuvent jamais être supprimées. Seul le CEO peut autoriser des corrections.',
    details: [
      'Les BL, factures et formules sont immuables',
      'Les modifications sont versionnées et tracées',
      'Le CEO peut autoriser des corrections avec code d\'urgence',
      'La piste d\'audit complète est préservée',
    ],
  },
];

const QUICK_GUIDES = [
  {
    id: 'reception',
    title: 'Nouvelle Réception de Stock',
    icon: Package,
    steps: [
      {
        step: 1,
        title: 'Photographier le bon',
        description: 'Prenez une photo claire du bon de livraison fournisseur avec le montant visible.',
      },
      {
        step: 2,
        title: 'Sélectionner le matériau',
        description: 'Choisissez le type de matériau (ciment, sable, gravette, adjuvant) et entrez la quantité.',
      },
      {
        step: 3,
        title: 'Valider la réception',
        description: 'Vérifiez que l\'IA a bien extrait les données et cliquez sur "Confirmer la Réception".',
      },
    ],
  },
  {
    id: 'depense',
    title: 'Nouvelle Dépense',
    icon: Receipt,
    steps: [
      {
        step: 1,
        title: 'Photographier la facture',
        description: 'Capturez la facture ou le reçu avec le montant, la date et le fournisseur lisibles.',
      },
      {
        step: 2,
        title: 'Catégoriser la dépense',
        description: 'Sélectionnez le département (Logistique, Maintenance, Admin) et le type de dépense.',
      },
      {
        step: 3,
        title: 'Soumettre pour approbation',
        description: 'Les dépenses L1 (<500 DH) sont auto-approuvées. L2/L3 nécessitent une validation CEO.',
      },
    ],
  },
  {
    id: 'livraison',
    title: 'Planifier une Livraison',
    icon: Truck,
    steps: [
      {
        step: 1,
        title: 'Créer le Bon de Commande',
        description: 'Depuis la page Ventes, créez un BC avec le client, la formule et le volume.',
      },
      {
        step: 2,
        title: 'Assigner un camion',
        description: 'Dans Planning, glissez le BC vers un créneau horaire et assignez une toupie.',
      },
      {
        step: 3,
        title: 'Valider la qualité',
        description: 'Le Resp. Technique valide le slump test avant le départ du camion.',
      },
    ],
  },
];

const CEO_FEATURES = [
  {
    title: 'Profit en Temps Réel',
    description: 'Suivi instantané des marges par formule et par client',
    icon: Calculator,
    color: 'text-success',
  },
  {
    title: 'Fleet Predator',
    description: 'GPS tactique avec détection d\'arrêts non planifiés et vol de carburant',
    icon: MapPin,
    color: 'text-amber-400',
  },
  {
    title: 'Alertes Critiques',
    description: 'Notifications push pour stocks bas, marges faibles, transactions nocturnes',
    icon: Bell,
    color: 'text-destructive',
  },
  {
    title: 'Codes d\'Urgence',
    description: 'Génération de codes à usage unique pour corrections exceptionnelles',
    icon: Lock,
    color: 'text-primary',
  },
  {
    title: 'Audit Forensique',
    description: 'Historique complet de toutes les modifications avec preuves photo',
    icon: Eye,
    color: 'text-warning',
  },
  {
    title: 'Consommation Carburant',
    description: 'Détection automatique des anomalies et alertes vol de carburant',
    icon: Fuel,
    color: 'text-red-400',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Comment obtenir un code d\'urgence CEO ?',
    answer: 'Les codes d\'urgence sont générés uniquement par le CEO depuis le tableau de bord "Sanctum". Contactez directement le directeur pour les situations critiques nécessitant une dérogation.',
  },
  {
    question: 'Pourquoi ma dépense est-elle bloquée ?',
    answer: 'Les dépenses sont bloquées si : (1) Le plafond mensuel de 15,000 MAD est atteint, (2) La catégorie nécessite une approbation L2/L3, (3) La photo est manquante ou illisible. Vérifiez ces points avant de contacter le support.',
  },
  {
    question: 'Comment corriger une erreur de saisie ?',
    answer: 'Les données validées ne peuvent pas être supprimées. Créez une nouvelle entrée corrective et ajoutez une note explicative. Pour les cas critiques, demandez un code d\'urgence CEO.',
  },
  {
    question: 'Le système signale une anomalie de marge. Que faire ?',
    answer: 'Les alertes de marge (<15%) sont automatiques. Vérifiez : (1) Le prix de vente est correct, (2) Les dosages respectent la formule, (3) Il n\'y a pas de surconsommation. Documentez l\'écart dans le champ justification.',
  },
  {
    question: 'Comment fonctionne le tracking client ?',
    answer: 'Chaque BC peut avoir un lien de suivi unique. Le client voit : statut en temps réel, position GPS du camion (si en route), et peut confirmer la réception depuis son téléphone.',
  },
  {
    question: 'Que se passe-t-il si j\'oublie de photographier ?',
    answer: 'L\'Agent Administratif ne peut pas valider une réception sans photo. Le système bloque la soumission. Pour les rôles CEO/Superviseur, la photo est recommandée mais pas obligatoire.',
  },
];

export default function AideSupport() {
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [trainingCompleted, setTrainingCompleted] = useState(false);

  const handleDownloadPdf = () => {
    try {
      generateManualPdf();
      toast.success('Manuel téléchargé avec succès!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Manuel Système
                <Badge className="bg-warning/20 text-warning border-warning/30">
                  Imperial Decree
                </Badge>
              </h1>
              <p className="text-muted-foreground">
                Guide opérationnel complet pour TBOS
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleDownloadPdf}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Télécharger PDF</span>
            </Button>
            <SystemHealthReport />
          </div>
        </div>

        {/* Training Mode CTA */}

        {/* Training Mode CTA */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Mode Formation
                    {trainingCompleted && (
                      <Badge className="bg-success/20 text-success border-success/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complété
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Pratiquez sans affecter les données réelles
                  </CardDescription>
                </div>
              </div>
              <Button 
                className="gap-2 bg-primary hover:bg-primary/90"
                onClick={() => setTrainingOpen(true)}
              >
                <Play className="h-4 w-4" />
                Lancer la Simulation
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nouveaux employés: Utilisez ce mode pour vous entraîner à enregistrer une réception de stock 
              sans risque d'erreur dans la base de données réelle.
            </p>
          </CardContent>
        </Card>

        {/* Training Dialog */}
        <TrainingReceptionForm 
          open={trainingOpen} 
          onOpenChange={setTrainingOpen}
          onComplete={() => setTrainingCompleted(true)}
        />

        {/* Main Tabs */}
        <Tabs defaultValue="rules" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="rules" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Règles d'Or</span>
            </TabsTrigger>
            <TabsTrigger value="workflows" className="gap-2">
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Procédures</span>
            </TabsTrigger>
            <TabsTrigger value="ceo" className="gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Mode CEO</span>
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">FAQ</span>
            </TabsTrigger>
          </TabsList>

          {/* Golden Rules Tab */}
          <TabsContent value="rules" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold">Les 3 Règles d'Or</h2>
              <Badge className="bg-warning/20 text-warning border-warning/30">
                Obligatoire
              </Badge>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              {GOLDEN_RULES.map((rule) => (
                <Card 
                  key={rule.number}
                  className={cn(
                    'relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]',
                    rule.borderColor
                  )}
                >
                  {/* Golden Number Badge */}
                  <div className="absolute top-0 right-0 w-16 h-16">
                    <div className={cn(
                      'absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center',
                      rule.bgColor
                    )}>
                      <span className={cn('text-xl font-bold', rule.color)}>
                        {rule.number}
                      </span>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <div className={cn('p-2 rounded-lg w-fit', rule.bgColor)}>
                      <rule.icon className={cn('h-5 w-5', rule.color)} />
                    </div>
                    <CardTitle className="text-lg mt-2">{rule.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {rule.subtitle}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {rule.description}
                    </p>
                    <ul className="space-y-1">
                      {rule.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className={cn('h-3 w-3 mt-0.5 flex-shrink-0', rule.color)} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Procédures Opérationnelles</h2>
            </div>
            
            <div className="grid gap-4 lg:grid-cols-3">
              {QUICK_GUIDES.map((guide) => (
                <Card key={guide.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <guide.icon className="h-5 w-5 text-primary" />
                      </div>
                      {guide.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {guide.steps.map((step, index) => (
                        <div 
                          key={step.step}
                          className="flex gap-3 items-start"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{step.step}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{step.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Security Note */}
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Règles de Sécurité Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-destructive mt-0.5" />
                    <span><strong>Centralistes:</strong> AUCUN accès manuel aux silos. Le stock est déduit automatiquement par les triggers de production.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-success mt-0.5" />
                    <span><strong>Agent Administratif:</strong> SEUL rôle autorisé à ajouter du stock via le formulaire de réception.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Crown className="h-4 w-4 text-warning mt-0.5" />
                    <span><strong>CEO/Superviseur:</strong> Ajustements manuels possibles avec code de raison obligatoire.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CEO Mode Tab */}
          <TabsContent value="ceo" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold">Mode CEO - God View</h2>
              <Badge className="bg-warning/20 text-warning border-warning/30">
                Accès Exclusif
              </Badge>
            </div>

            <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-warning" />
                  Le Sanctum - Tableau de Bord Exécutif
                </CardTitle>
                <CardDescription>
                  Vue complète et contrôle total sur toutes les opérations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {CEO_FEATURES.map((feature, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-lg bg-background/50 border hover:border-warning/50 transition-colors"
                    >
                      <feature.icon className={cn('h-8 w-8 mb-2', feature.color)} />
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alert Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-destructive" />
                  Types d'Alertes Critiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <span className="text-xl">🚨</span>
                    <div>
                      <p className="font-medium text-sm text-destructive">STOCK CRITIQUE</p>
                      <p className="text-xs text-muted-foreground">Niveau inférieur à 15% de la capacité</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="font-medium text-sm text-warning">MARGE FAIBLE</p>
                      <p className="text-xs text-muted-foreground">Marge inférieure à 15% sur une commande</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/30">
                    <span className="text-xl">🌙</span>
                    <div>
                      <p className="font-medium text-sm text-primary">TRANSACTION NOCTURNE</p>
                      <p className="text-xs text-muted-foreground">Activité détectée entre 18h et 06h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="font-medium text-sm text-red-400">ARRÊT NON PLANIFIÉ</p>
                      <p className="text-xs text-muted-foreground">Camion immobile &gt;15 min hors zone sécurisée</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Questions Fréquentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {FAQ_ITEMS.map((item, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left text-sm">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Architecture Summary */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Architecture Sécuritaire "Titanium Shield"
            </CardTitle>
            <CardDescription>
              Protection multicouche contre la fraude et les erreurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-background/50 border text-center">
                <Shield className="h-8 w-8 text-success mx-auto mb-2" />
                <h4 className="font-medium">RLS Policies</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Contrôle d'accès au niveau de chaque ligne
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border text-center">
                <FileText className="h-8 w-8 text-warning mx-auto mb-2" />
                <h4 className="font-medium">Audit Trail</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  28+ triggers capturant toutes modifications
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border text-center">
                <Camera className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium">Vérification IA</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  OCR automatique pour valider documents
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border text-center">
                <Users className="h-8 w-8 text-destructive mx-auto mb-2" />
                <h4 className="font-medium">10 Rôles</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Permissions granulaires par fonction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Version Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground border-t">
          <p className="font-medium">TBOS - Talmi Beton Operating System</p>
          <p className="mt-1">Version 1.0 • Imperial Launch Edition • {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </MainLayout>
  );
}
