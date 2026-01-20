import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

const ROLE_OPTIONS = [
  { value: null, label: 'Mon profil (CEO)', description: 'Vue complète', homePage: '/' },
  { value: 'directeur_operations', label: 'Directeur Opérations', description: 'Planning & Supervision', homePage: '/' },
  { value: 'superviseur', label: 'Superviseur', description: 'Site & Pointage', homePage: '/' },
  { value: 'responsable_technique', label: 'Responsable Technique', description: 'Labo uniquement', homePage: '/laboratoire' },
  { value: 'agent_administratif', label: 'Agent Administratif', description: 'Bons & Clients', homePage: '/bons' },
  { value: 'centraliste', label: 'Centraliste', description: 'Production uniquement', homePage: '/production' },
  { value: 'chauffeur', label: 'Chauffeur', description: 'Livraisons uniquement', homePage: '/chauffeur' },
  { value: 'commercial', label: 'Commercial', description: 'Ventes uniquement', homePage: '/ventes' },
] as const;

interface RolePreviewSwitcherProps {
  previewRole: string | null;
  onPreviewRoleChange: (role: string | null) => void;
}

export function RolePreviewSwitcher({ previewRole, onPreviewRoleChange }: RolePreviewSwitcherProps) {
  const { isCeo } = useAuth();
  const navigate = useNavigate();
  
  // Only CEO can use this feature
  if (!isCeo) return null;

  const currentPreview = ROLE_OPTIONS.find(r => r.value === previewRole);

  const handleRoleSelect = (role: typeof ROLE_OPTIONS[number]) => {
    onPreviewRoleChange(role.value);
    // Auto-navigate to that role's home page
    navigate(role.homePage);
  };

  return (
    <div className="flex items-center gap-2">
      {previewRole && (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning gap-1.5 py-1">
          <Eye className="h-3 w-3" />
          Vue: {currentPreview?.label}
          <button 
            onClick={() => {
              onPreviewRoleChange(null);
              navigate('/');
            }}
            className="ml-1 hover:bg-warning/20 rounded p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            {previewRole ? <Navigation className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {previewRole ? 'Tester un rôle' : 'Voir comme...'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Tester l'interface employé
          </DropdownMenuLabel>
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            Naviguez comme un employé pour tester son workflow
          </p>
          <DropdownMenuSeparator />
          {ROLE_OPTIONS.map((role) => (
            <DropdownMenuItem
              key={role.value ?? 'ceo'}
              onClick={() => handleRoleSelect(role)}
              className={previewRole === role.value ? 'bg-muted' : ''}
            >
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{role.label}</span>
                  <span className="text-xs text-muted-foreground">{role.homePage}</span>
                </div>
                <span className="text-xs text-muted-foreground">{role.description}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Preview mode banner
export function RolePreviewBanner({ 
  previewRole, 
  onExit 
}: { 
  previewRole: string; 
  onExit: () => void;
}) {
  const navigate = useNavigate();
  const roleOption = ROLE_OPTIONS.find(r => r.value === previewRole);
  const roleLabel = roleOption?.label || previewRole;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning text-warning-foreground py-2 px-4 flex items-center justify-center gap-4 text-sm font-medium">
      <Eye className="h-4 w-4" />
      <span>Mode Test: Vous naviguez comme <strong>{roleLabel}</strong></span>
      <Button 
        size="sm" 
        variant="secondary" 
        onClick={() => {
          onExit();
          navigate('/');
        }}
        className="h-7 px-3"
      >
        Quitter le test
      </Button>
    </div>
  );
}
