import { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
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
  { value: null, label: 'Mon profil (CEO)', description: 'Vue complète' },
  { value: 'centraliste', label: 'Centraliste', description: 'Production & Bons' },
  { value: 'chauffeur', label: 'Chauffeur', description: 'Livraisons uniquement' },
  { value: 'agent_administratif', label: 'Agent Administratif', description: 'Facturation & Clients' },
  { value: 'responsable_technique', label: 'Responsable Technique', description: 'Labo & Qualité' },
  { value: 'superviseur', label: 'Superviseur', description: 'Vue superviseur' },
] as const;

interface RolePreviewSwitcherProps {
  previewRole: string | null;
  onPreviewRoleChange: (role: string | null) => void;
}

export function RolePreviewSwitcher({ previewRole, onPreviewRoleChange }: RolePreviewSwitcherProps) {
  const { isCeo } = useAuth();
  
  // Only CEO can use this feature
  if (!isCeo) return null;

  const currentPreview = ROLE_OPTIONS.find(r => r.value === previewRole);

  return (
    <div className="flex items-center gap-2">
      {previewRole && (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning gap-1.5 py-1">
          <Eye className="h-3 w-3" />
          Vue: {currentPreview?.label}
          <button 
            onClick={() => onPreviewRoleChange(null)}
            className="ml-1 hover:bg-warning/20 rounded p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            {previewRole ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {previewRole ? 'Changer vue' : 'Voir comme...'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Prévisualiser l'interface</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ROLE_OPTIONS.map((role) => (
            <DropdownMenuItem
              key={role.value ?? 'ceo'}
              onClick={() => onPreviewRoleChange(role.value)}
              className={previewRole === role.value ? 'bg-muted' : ''}
            >
              <div className="flex flex-col">
                <span className="font-medium">{role.label}</span>
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
  const roleLabel = ROLE_OPTIONS.find(r => r.value === previewRole)?.label || previewRole;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning text-warning-foreground py-2 px-4 flex items-center justify-center gap-4 text-sm font-medium">
      <Eye className="h-4 w-4" />
      <span>Mode prévisualisation: Vous voyez l'interface comme un <strong>{roleLabel}</strong></span>
      <Button 
        size="sm" 
        variant="secondary" 
        onClick={onExit}
        className="h-7 px-3"
      >
        Quitter
      </Button>
    </div>
  );
}
