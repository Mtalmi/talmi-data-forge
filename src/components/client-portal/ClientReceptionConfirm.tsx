import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Loader2, PenTool, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ClientReceptionConfirmProps {
  deliveryToken: string;
  blId: string;
  onConfirm: (token: string, name: string) => void;
}

export function ClientReceptionConfirm({
  deliveryToken,
  blId,
  onConfirm,
}: ClientReceptionConfirmProps) {
  const [step, setStep] = useState<'initial' | 'name' | 'confirming' | 'success'>('initial');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStartConfirm = () => {
    setStep('name');
  };

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError('Veuillez entrer votre nom');
      return;
    }

    setStep('confirming');
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('bons_livraison_reels')
        .update({
          client_confirmed_at: new Date().toISOString(),
          client_confirmed_by_name: name.trim(),
          workflow_status: 'livre',
        })
        .eq('tracking_token', deliveryToken);

      if (updateError) throw updateError;

      // Log to audit
      await supabase.from('audit_superviseur').insert({
        action: 'CLIENT_RECEPTION_CONFIRMED',
        table_name: 'bons_livraison_reels',
        record_id: blId,
        user_id: 'client-portal',
        user_name: name.trim(),
        new_data: {
          confirmed_at: new Date().toISOString(),
          confirmed_by: name.trim(),
          bl_id: blId,
        },
      });

      setStep('success');
      onConfirm(deliveryToken, name.trim());
      toast.success('Réception confirmée avec succès!');
    } catch (err) {
      console.error('Error confirming reception:', err);
      setError('Erreur lors de la confirmation. Veuillez réessayer.');
      setStep('name');
    }
  };

  if (step === 'success') {
    return (
      <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-2xl text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-400 mb-1">
          Réception Confirmée
        </h3>
        <p className="text-sm text-gray-400">
          Merci pour votre confirmation, {name}!
        </p>
      </div>
    );
  }

  if (step === 'name' || step === 'confirming') {
    return (
      <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl">
        <h3 className="text-sm font-medium text-amber-400 mb-4 flex items-center gap-2">
          <PenTool className="h-4 w-4" />
          Confirmation de Réception
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Votre nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Entrez votre nom..."
                disabled={step === 'confirming'}
                className={cn(
                  "w-full pl-10 pr-4 py-3 bg-gray-900/50 border rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all",
                  error ? "border-red-500/50" : "border-gray-700"
                )}
              />
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-1">{error}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep('initial')}
              disabled={step === 'confirming'}
              className="flex-1 py-3 px-4 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={step === 'confirming' || !name.trim()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-black text-sm font-bold hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {step === 'confirming' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Confirmation...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirmer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl">
      <div className="text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
          <CheckCircle className="h-7 w-7 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Confirmer la Réception
          </h3>
          <p className="text-xs text-gray-400">
            Appuyez pour confirmer que vous avez bien reçu la livraison
          </p>
        </div>
        <button
          onClick={handleStartConfirm}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-black text-base font-bold hover:from-amber-400 hover:to-amber-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/30"
        >
          Je Confirme la Réception
        </button>
      </div>
    </div>
  );
}
