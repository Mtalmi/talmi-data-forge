import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Factory,
  CalendarClock,
  Truck,
  DollarSign,
  Warehouse,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const mainNav = [
  { title: 'Accueil', url: '/', icon: LayoutDashboard },
  { title: 'Production', url: '/production', icon: Factory },
  { title: 'Planning', url: '/planning', icon: CalendarClock },
  { title: 'Livraisons', url: '/bons', icon: Truck },
];

const managementNav = [
  { title: 'Finance', url: '/ventes', icon: DollarSign },
  { title: 'Stocks', url: '/stocks', icon: Warehouse },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Rapports', url: '/rapports', icon: BarChart3 },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => location.pathname === path;

  const renderItems = (items: typeof mainNav) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          onClick={() => navigate(item.url)}
          tooltip={item.title}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/40',
            isActive(item.url) &&
              'bg-primary/10 text-primary border border-primary/20 font-semibold'
          )}
        >
          <item.icon
            className={cn(
              'h-4 w-4 flex-shrink-0',
              isActive(item.url) ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          {!collapsed && <span className="truncate">{item.title}</span>}
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar
      className="border-r border-border/40 bg-background"
      collapsible="icon"
    >
      <SidebarContent className="py-4">
        {/* Brand */}
        {!collapsed && (
          <div className="px-4 pb-4 mb-2 border-b border-border/30">
            <span className="text-sm font-bold tracking-wide text-primary">
              TBOS
            </span>
            <span className="text-xs text-muted-foreground ml-1">Suite</span>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">
            Gestion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(managementNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/30 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => navigate('/user_profile')}
              tooltip="Paramètres"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>Paramètres</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              tooltip="Déconnexion"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>Déconnexion</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
