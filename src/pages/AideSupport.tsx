import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SystemHealthReport } from '@/components/documents/SystemHealthReport';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
];

export default function AideSupport() {
  const [activeGuide, setActiveGuide] = useState<string | null>(null);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Aide & Support
            </h1>
            <p className="text-muted-foreground">
              Manuel d'utilisation et documentation système
            </p>
          </div>
          <SystemHealthReport />
        </div>

        {/* Golden Rules Section */}
        <div>
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
                  'relative overflow-hidden transition-all hover:shadow-lg',
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
        </div>

        {/* Quick Start Guides */}
        <Tabs defaultValue="reception" className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Guides Rapides</h2>
          </div>
          
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            {QUICK_GUIDES.map((guide) => (
              <TabsTrigger key={guide.id} value={guide.id} className="gap-2">
                <guide.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{guide.id === 'reception' ? 'Réception' : guide.id === 'depense' ? 'Dépense' : 'Livraison'}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {QUICK_GUIDES.map((guide) => (
            <TabsContent key={guide.id} value={guide.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <guide.icon className="h-5 w-5 text-primary" />
                    {guide.title}
                  </CardTitle>
                  <CardDescription>
                    Suivez ces 3 étapes simples
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {guide.steps.map((step, index) => (
                      <div 
                        key={step.step}
                        className="flex gap-4 items-start"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{step.step}</span>
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="font-medium">{step.title}</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {step.description}
                          </p>
                        </div>
                        {index < guide.steps.length - 1 && (
                          <ArrowRight className="h-5 w-5 text-muted-foreground/30 hidden sm:block" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* FAQ Section */}
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
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Security Architecture Summary */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Architecture Sécuritaire
            </CardTitle>
            <CardDescription>
              TBOS utilise une architecture de sécurité "Titanium Shield"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-background/50 border">
                <Shield className="h-8 w-8 text-success mb-2" />
                <h4 className="font-medium">RLS Policies</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Contrôle d'accès au niveau de chaque ligne de données
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border">
                <FileText className="h-8 w-8 text-warning mb-2" />
                <h4 className="font-medium">Audit Trail</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  28+ triggers capturant toutes les modifications
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border">
                <Camera className="h-8 w-8 text-primary mb-2" />
                <h4 className="font-medium">Vérification IA</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  OCR automatique pour valider les documents
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border">
                <Users className="h-8 w-8 text-destructive mb-2" />
                <h4 className="font-medium">10 Rôles</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Permissions granulaires par fonction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Version Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground">
          <p>TBOS - Talmi Beton Operating System</p>
          <p className="mt-1">Version 1.0 • Imperial Launch Edition • {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </MainLayout>
  );
}
