import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  User, 
  ChevronDown, 
  Check, 
  Truck, 
  MapPin, 
  Calculator,
  Send,
  Pencil,
  ClipboardCheck,
  Camera,
  CreditCard,
  Signature,
  Navigation,
  Radar,
  Target,
  AlertTriangle,
  Fuel,
  BarChart3,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialScreenSimulatorProps {
  tutorialId: string;
  currentStep: number;
  isPlaying: boolean;
}

// Cursor component that moves around
const AnimatedCursor = ({ 
  x, 
  y, 
  clicking 
}: { 
  x: number; 
  y: number; 
  clicking: boolean;
}) => (
  <motion.div
    className="absolute z-50 pointer-events-none"
    animate={{ 
      left: `${x}%`, 
      top: `${y}%`,
      scale: clicking ? 0.8 : 1
    }}
    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path 
        d="M4 2L20 12L12 14L10 22L4 2Z" 
        fill="hsl(var(--primary))" 
        stroke="hsl(var(--background))" 
        strokeWidth="2"
      />
    </svg>
    {clicking && (
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-primary bg-primary/30"
      />
    )}
  </motion.div>
);

// Typing animation for form fields
const TypingText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    setDisplayText('');
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);
  
  return (
    <span>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className="inline-block w-0.5 h-4 bg-primary ml-0.5"
      />
    </span>
  );
};

// ========== DEVIS/BC TUTORIAL SCREENS ==========
const DevisBCScreens = ({ step, isPlaying }: { step: number; isPlaying: boolean }) => {
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [clicking, setClicking] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedFormule, setSelectedFormule] = useState('');
  const [volume, setVolume] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    
    const animations: Record<number, () => void> = {
      0: () => {
        // Navigate to Ventes
        setCursorPos({ x: 10, y: 30 });
        setTimeout(() => setClicking(true), 500);
        setTimeout(() => setClicking(false), 700);
      },
      1: () => {
        // Click Nouveau Devis
        setCursorPos({ x: 85, y: 15 });
        setTimeout(() => setClicking(true), 500);
        setTimeout(() => setClicking(false), 700);
      },
      2: () => {
        // Select client
        setCursorPos({ x: 50, y: 35 });
        setTimeout(() => {
          setClicking(true);
          setShowDropdown(true);
        }, 500);
        setTimeout(() => {
          setClicking(false);
          setCursorPos({ x: 50, y: 50 });
        }, 1000);
        setTimeout(() => {
          setClicking(true);
          setSelectedClient('Entreprise Atlas Construction');
          setShowDropdown(false);
        }, 1500);
        setTimeout(() => setClicking(false), 1700);
      },
      3: () => {
        // Select formule
        setCursorPos({ x: 50, y: 55 });
        setTimeout(() => {
          setClicking(true);
          setShowDropdown(true);
        }, 500);
        setTimeout(() => {
          setClicking(false);
          setCursorPos({ x: 50, y: 70 });
        }, 1000);
        setTimeout(() => {
          setClicking(true);
          setSelectedFormule('B30 - Béton Armé Standard');
          setShowDropdown(false);
        }, 1500);
        setTimeout(() => setClicking(false), 1700);
      },
      4: () => {
        // Enter volume
        setCursorPos({ x: 30, y: 75 });
        setTimeout(() => setClicking(true), 500);
        setTimeout(() => {
          setClicking(false);
          setVolume('25');
        }, 700);
      },
      5: () => {
        // Calculate price
        setCursorPos({ x: 70, y: 75 });
        setTimeout(() => setClicking(true), 500);
        setTimeout(() => setClicking(false), 700);
      },
      6: () => {
        // Submit
        setCursorPos({ x: 50, y: 90 });
        setTimeout(() => setClicking(true), 500);
        setTimeout(() => {
          setClicking(false);
          setShowSuccess(true);
        }, 1000);
      },
      7: () => {
        // Validation
        setShowSuccess(true);
      },
      8: () => {
        // Convert to BC
        setCursorPos({ x: 85, y: 50 });
        setTimeout(() => setClicking(true), 500);
        setTimeout(() => setClicking(false), 700);
      }
    };
    
    animations[step]?.();
  }, [step, isPlaying]);

  return (
    <div className="relative w-full h-full bg-background rounded-lg overflow-hidden">
      <AnimatedCursor x={cursorPos.x} y={cursorPos.y} clicking={clicking} />
      
      {/* Sidebar simulation */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-muted/50 border-r flex flex-col items-center py-4 gap-4">
        <motion.div 
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            step >= 0 ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
          animate={step === 0 ? { scale: [1, 1.1, 1] } : {}}
        >
          <FileText className="h-5 w-5" />
        </motion.div>
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Truck className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      
      {/* Main content */}
      <div className="absolute left-20 right-4 top-4 bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Ventes</h2>
          <motion.button
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg",
              step >= 1 ? "bg-primary text-primary-foreground" : "bg-primary/50"
            )}
            animate={step === 1 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: step === 1 ? Infinity : 0, duration: 1 }}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Nouveau Devis</span>
          </motion.button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <div className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium">Devis</div>
          <div className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Bons de Commande</div>
          <div className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm">Factures</div>
        </div>
        
        {/* Form simulation */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border rounded-xl p-4 space-y-4"
            >
              {/* Client field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                <motion.div 
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-lg",
                    step === 2 && "ring-2 ring-primary"
                  )}
                  animate={step === 2 ? { scale: [1, 1.02, 1] } : {}}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className={selectedClient ? "text-foreground" : "text-muted-foreground"}>
                      {selectedClient || "Sélectionner un client..."}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
                
                {/* Dropdown */}
                <AnimatePresence>
                  {showDropdown && step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-40 w-64 bg-popover border rounded-lg shadow-xl p-2"
                    >
                      {['Entreprise Atlas Construction', 'Groupe Immobilier Maroc', 'Bâtiments Modernes SA'].map((client, i) => (
                        <motion.div
                          key={client}
                          className={cn(
                            "p-2 rounded hover:bg-muted cursor-pointer text-sm",
                            i === 0 && "bg-primary/20 text-primary"
                          )}
                          animate={i === 0 ? { x: [0, 5, 0] } : {}}
                        >
                          {client}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Formule field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Formule Béton</label>
                <motion.div 
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-lg",
                    step === 3 && "ring-2 ring-primary"
                  )}
                  animate={step === 3 ? { scale: [1, 1.02, 1] } : {}}
                >
                  <span className={selectedFormule ? "text-foreground" : "text-muted-foreground"}>
                    {selectedFormule || "Choisir une formule..."}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>
              
              {/* Volume & Zone */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Volume (m³)</label>
                  <motion.div 
                    className={cn(
                      "p-3 border rounded-lg",
                      step === 4 && "ring-2 ring-primary"
                    )}
                  >
                    {step >= 4 ? <TypingText text="25" /> : "0"}
                  </motion.div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Zone Livraison</label>
                  <div className="p-3 border rounded-lg text-muted-foreground">
                    Zone A - Casablanca
                  </div>
                </div>
              </div>
              
              {/* Price calculation */}
              <AnimatePresence>
                {step >= 5 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-success/10 border border-success/30 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-success" />
                        <span className="font-medium">Prix Calculé</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-success">21,250 DH</div>
                        <div className="text-sm text-muted-foreground">850 DH/m³ × 25m³</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Submit button */}
              <motion.button
                className={cn(
                  "w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2",
                  step >= 6 ? "bg-primary text-primary-foreground" : "bg-primary/50"
                )}
                animate={step === 6 ? { scale: [1, 1.05, 1] } : {}}
              >
                <Send className="h-4 w-4" />
                Soumettre pour Approbation
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Success overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4"
                >
                  <Check className="h-10 w-10 text-success" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">
                  {step === 8 ? 'BC Créé !' : 'Devis Soumis !'}
                </h3>
                <p className="text-muted-foreground">
                  {step === 8 ? 'DEV-2024-0089 → BC-2024-0045' : 'En attente de validation...'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ========== LIVRAISON VALIDATION SCREENS ==========
const LivraisonScreens = ({ step, isPlaying }: { step: number; isPlaying: boolean }) => {
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [clicking, setClicking] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureComplete, setSignatureComplete] = useState(false);
  const [paymentSelected, setPaymentSelected] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    
    if (step === 5) {
      setShowSignature(true);
      setTimeout(() => setSignatureComplete(true), 2000);
    }
    if (step === 6) {
      setPaymentSelected(true);
    }
  }, [step, isPlaying]);

  return (
    <div className="relative w-full h-full bg-background rounded-lg overflow-hidden">
      <AnimatedCursor x={cursorPos.x} y={cursorPos.y} clicking={clicking} />
      
      {/* Planning view simulation */}
      <div className="absolute inset-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Planning Livraisons
          </h2>
          <div className="text-sm text-muted-foreground">24 Janvier 2026</div>
        </div>
        
        {/* Timeline */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {['08:00', '10:00', '12:00', '14:00'].map((time, i) => (
            <div key={time} className="text-center text-xs text-muted-foreground border-b pb-2">
              {time}
            </div>
          ))}
        </div>
        
        {/* BL Card */}
        <motion.div
          className={cn(
            "bg-card border-2 rounded-xl p-4",
            step >= 1 ? "border-warning" : "border-muted"
          )}
          animate={step === 1 ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: step === 1 ? Infinity : 0, duration: 1.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
              <span className="font-bold">BL-2024-0123</span>
            </div>
            <div className="text-sm px-2 py-1 bg-warning/20 text-warning rounded">
              En attente validation
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Client</div>
              <div className="font-medium">Atlas Construction</div>
            </div>
            <div>
              <div className="text-muted-foreground">Volume</div>
              <div className="font-medium">8 m³</div>
            </div>
            <div>
              <div className="text-muted-foreground">Camion</div>
              <div className="font-medium flex items-center gap-1">
                <Truck className="h-4 w-4" />
                T-001
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Chauffeur</div>
              <div className="font-medium">Mohammed B.</div>
            </div>
          </div>
          
          {/* Quality Check */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg"
              >
                <div className="flex items-center gap-2 text-success">
                  <Camera className="h-4 w-4" />
                  <span className="text-sm font-medium">Contrôle Qualité Validé</span>
                  <Check className="h-4 w-4 ml-auto" />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Slump: 180mm ✓ | Photo pupitre ✓
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Signature */}
          <AnimatePresence>
            {showSignature && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 bg-muted rounded-lg"
              >
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Signature Client
                </div>
                <div className="h-20 bg-background rounded border-2 border-dashed border-primary/50 relative overflow-hidden">
                  {signatureComplete ? (
                    <motion.svg
                      viewBox="0 0 200 80"
                      className="w-full h-full"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                    >
                      <motion.path
                        d="M20 60 Q40 20 60 50 T100 40 T140 50 T180 30"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </motion.svg>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                      En attente...
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Payment */}
          <AnimatePresence>
            {paymentSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg"
              >
                <div className="flex items-center gap-2 text-success">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm font-medium">Paiement: Espèces</span>
                  <span className="ml-auto font-bold">6,800 DH</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <motion.button
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium",
              step >= 7 ? "bg-success text-white" : "bg-muted"
            )}
            animate={step === 7 ? { scale: [1, 1.05, 1] } : {}}
          >
            <Check className="h-4 w-4 inline mr-1" />
            Retour Validé
          </motion.button>
          <motion.button
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium",
              step >= 8 ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
            animate={step === 8 ? { scale: [1, 1.05, 1] } : {}}
          >
            <FileText className="h-4 w-4 inline mr-1" />
            Générer Facture
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// ========== FLEET PREDATOR SCREENS ==========
const FleetPredatorScreens = ({ step, isPlaying }: { step: number; isPlaying: boolean }) => {
  const [truckPositions, setTruckPositions] = useState([
    { id: 'T-001', x: 30, y: 40, status: 'en_route' },
    { id: 'T-002', x: 60, y: 55, status: 'livraison' },
    { id: 'T-003', x: 45, y: 30, status: 'retour' },
    { id: 'T-004', x: 25, y: 65, status: 'arret' }
  ]);
  const [followingTruck, setFollowingTruck] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(false);
  const [showGeofence, setShowGeofence] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    
    // Animate trucks
    const interval = setInterval(() => {
      setTruckPositions(prev => prev.map(truck => ({
        ...truck,
        x: truck.x + (Math.random() - 0.5) * 2,
        y: truck.y + (Math.random() - 0.5) * 2
      })));
    }, 500);
    
    if (step >= 4) setFollowingTruck('T-001');
    if (step >= 5) setShowBreadcrumbs(true);
    if (step >= 6) setShowGeofence(true);
    if (step >= 7) setShowAlert(true);
    
    return () => clearInterval(interval);
  }, [step, isPlaying]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_route': return 'bg-success';
      case 'livraison': return 'bg-warning';
      case 'retour': return 'bg-primary';
      case 'arret': return 'bg-destructive animate-pulse';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] rounded-lg overflow-hidden">
      {/* Map background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary)/0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary)/0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }} />
      </div>
      
      {/* Geofence zones */}
      <AnimatePresence>
        {showGeofence && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute w-24 h-24 rounded-full border-2 border-dashed border-success/50 bg-success/10"
              style={{ left: '20%', top: '60%', transform: 'translate(-50%, -50%)' }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-success text-xs">
                Centrale
              </div>
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute w-16 h-16 rounded-full border-2 border-dashed border-warning/50 bg-warning/10"
              style={{ left: '70%', top: '35%', transform: 'translate(-50%, -50%)' }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-warning text-[8px]">
                Chantier
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Breadcrumbs trail */}
      <AnimatePresence>
        {showBreadcrumbs && (
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            className="absolute inset-0 w-full h-full"
          >
            <motion.path
              d="M30 40 Q35 35 40 38 T50 35 T60 40 T70 35"
              fill="none"
              stroke="hsl(var(--primary)/0.5)"
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2 }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
      
      {/* Trucks */}
      {truckPositions.map((truck, i) => (
        <motion.div
          key={truck.id}
          className={cn(
            "absolute flex flex-col items-center",
            followingTruck === truck.id && "z-20"
          )}
          animate={{
            left: `${truck.x}%`,
            top: `${truck.y}%`,
            scale: followingTruck === truck.id ? 1.3 : 1
          }}
          transition={{ type: 'spring', stiffness: 100 }}
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <motion.div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border-2",
              getStatusColor(truck.status),
              followingTruck === truck.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            animate={truck.status === 'arret' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Truck className="h-4 w-4 text-white" />
          </motion.div>
          <span className="text-[10px] text-primary mt-1 font-mono">{truck.id}</span>
        </motion.div>
      ))}
      
      {/* Alert panel */}
      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute right-2 top-2 w-48 bg-background/90 backdrop-blur border border-destructive/50 rounded-lg p-3"
          >
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-bold">ALERTE</span>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1">
                <Fuel className="h-3 w-3 text-warning" />
                <span>Consommation anormale</span>
              </div>
              <div className="text-muted-foreground">T-004 • 42L/100km</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Control panel */}
      <div className="absolute left-2 top-2 space-y-2">
        <div className="bg-background/80 backdrop-blur rounded-lg p-2">
          <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1">
            <Radar className="h-3 w-3" />
            FLEET PREDATOR
          </div>
          <div className="space-y-1">
            {truckPositions.map(truck => (
              <div
                key={truck.id}
                className={cn(
                  "flex items-center gap-2 text-xs p-1 rounded",
                  followingTruck === truck.id && "bg-primary/20"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", getStatusColor(truck.status))} />
                <span>{truck.id}</span>
              </div>
            ))}
          </div>
        </div>
        
        <motion.button
          className={cn(
            "w-full text-xs py-2 rounded-lg",
            step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
          animate={step === 3 ? { scale: [1, 1.05, 1] } : {}}
        >
          Mode Démo ON
        </motion.button>
      </div>
      
      {/* Stats bar */}
      <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur rounded-lg p-2">
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-success" />
            <span>4 camions</span>
          </div>
          <div className="flex items-center gap-1">
            <Navigation className="h-3 w-3 text-primary" />
            <span>3 en mission</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span>1 alerte</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component
export function TutorialScreenSimulator({ tutorialId, currentStep, isPlaying }: TutorialScreenSimulatorProps) {
  switch (tutorialId) {
    case 'creer-devis-bc':
      return <DevisBCScreens step={currentStep} isPlaying={isPlaying} />;
    case 'valider-livraison-complete':
      return <LivraisonScreens step={currentStep} isPlaying={isPlaying} />;
    case 'fleet-predator-avance':
      return <FleetPredatorScreens step={currentStep} isPlaying={isPlaying} />;
    default:
      // Generic placeholder for other tutorials
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted rounded-lg">
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
            >
              <BarChart3 className="h-8 w-8 text-primary" />
            </motion.div>
            <p className="text-sm text-muted-foreground">
              Étape {currentStep + 1}
            </p>
          </div>
        </div>
      );
  }
}
