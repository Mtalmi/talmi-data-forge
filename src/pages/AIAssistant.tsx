import MainLayout from '@/components/layout/MainLayout';
import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { useAIChat } from '@/hooks/useAIChat';
import { Bot, Shield, Zap, Eye } from 'lucide-react';

export default function AIAssistant() {
  const chat = useAIChat();

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-0 lg:gap-6 p-0 lg:p-6">
        {/* Sidebar - Desktop only */}
        <div className="hidden lg:flex flex-col w-72 shrink-0 gap-4">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">TBOS AI</h1>
                <p className="text-xs text-muted-foreground">Centre de Commande AI</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Votre co-pilote intelligent pour les opérations béton. Posez des questions sur vos commandes, stocks, livraisons, et finances.
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/50 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capacités AI</p>
            <CapabilityItem icon={Zap} label="Chat Intelligent" desc="Questions/réponses sur vos données" />
            <CapabilityItem icon={Shield} label="Garde Anti-Erreur" desc="Validation temps-réel des saisies" />
            <CapabilityItem icon={Eye} label="Détection Anomalies" desc="Analyse forensique automatique" />
            <CapabilityItem icon={Bot} label="OCR Document" desc="Extraction AI des documents" />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 lg:rounded-2xl lg:border lg:border-border/50 lg:bg-card/30 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border/30 bg-card/50 lg:rounded-t-2xl">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Assistant TBOS</p>
              <p className="text-[10px] text-success">● En ligne • Gemini 3 Flash</p>
            </div>
          </div>
          <AIChatPanel chat={chat} />
        </div>
      </div>
    </MainLayout>
  );
}

function CapabilityItem({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-accent/50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
