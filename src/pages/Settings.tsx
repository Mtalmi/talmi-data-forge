import { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  UserPlus,
  Edit,
  Trash2,
  FileText,
  Video,
  FileSpreadsheet,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────
interface TeamMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastActive: string;
}

type DocType = 'PDF' | 'VIDEO' | 'DOC' | 'XLS';

interface DocItem {
  id: string;
  title: string;
  category: string;
  type: DocType;
}

// ─── Badge Colors ──────────────────────────────────────────────────
const DOC_BADGE: Record<DocType, string> = {
  PDF: 'bg-destructive/20 text-destructive',
  VIDEO: 'bg-warning/20 text-warning',
  DOC: 'bg-primary/20 text-primary',
  XLS: 'bg-success/20 text-success',
};

const DOC_ICON: Record<DocType, React.ReactNode> = {
  PDF: <FileText className="h-3.5 w-3.5" />,
  VIDEO: <Video className="h-3.5 w-3.5" />,
  DOC: <File className="h-3.5 w-3.5" />,
  XLS: <FileSpreadsheet className="h-3.5 w-3.5" />,
};

// ─── Mock Data ─────────────────────────────────────────────────────
const INITIAL_TEAM: TeamMember[] = [
  { id: '1', name: 'Hassan Al-Rashid', initials: 'HA', email: 'hassan@atlasconcrete.ma', role: 'Admin', status: 'Active', lastActive: 'Now' },
  { id: '2', name: 'Fatima Zahra', initials: 'FZ', email: 'fatima@atlasconcrete.ma', role: 'Operations', status: 'Active', lastActive: '1h ago' },
  { id: '3', name: 'Karim Benali', initials: 'KB', email: 'karim@atlasconcrete.ma', role: 'Fleet', status: 'Active', lastActive: '3h ago' },
  { id: '4', name: 'Nadia Tazi', initials: 'NT', email: 'nadia@atlasconcrete.ma', role: 'Quality', status: 'Inactive', lastActive: '3d ago' },
  { id: '5', name: 'Omar Fassi', initials: 'OF', email: 'omar@atlasconcrete.ma', role: 'Finance', status: 'Active', lastActive: '20m ago' },
];

const MOCK_DOCS: DocItem[] = [
  { id: '1', title: 'Rapport Mensuel Production', category: 'Production', type: 'PDF' },
  { id: '2', title: 'Formation Sécurité 2025', category: 'Formation', type: 'VIDEO' },
  { id: '3', title: 'Procédure Qualité ISO', category: 'Qualité', type: 'DOC' },
  { id: '4', title: 'Budget Prévisionnel Q1', category: 'Finance', type: 'XLS' },
  { id: '5', title: 'Audit Environnemental', category: 'Audit', type: 'PDF' },
  { id: '6', title: 'Guide Opérateur Centrale', category: 'Formation', type: 'VIDEO' },
];

// ─── Section Header ────────────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-[28px] font-bold text-foreground tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {children}
      </h2>
      <div className="mt-2 h-[2px] w-32 rounded-full bg-gradient-to-r from-primary to-transparent" />
    </div>
  );
}

// ─── Card Title ────────────────────────────────────────────────────
function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {children}
      </h3>
      <div className="mt-1.5 h-[2px] w-24 rounded-full bg-gradient-to-r from-primary to-transparent" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function Settings() {
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [searchQuery, setSearchQuery] = useState('');

  const seatTotal = 25;
  const seatUsed = team.length;
  const seatPct = (seatUsed / seatTotal) * 100;

  // Filter docs by search
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_DOCS;
    const q = searchQuery.toLowerCase();
    return MOCK_DOCS.filter(
      d => d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleRemoveMember = (id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
  };

  return (
    <MainLayout>
      <div className="space-y-10 animate-fade-in">

        {/* ─── DOCUMENT LIBRARY WITH SEARCH ─────────────────────── */}
        <section>
          <SectionHeader>Document Library</SectionHeader>
          <div className="card-industrial p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or category…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3.5 transition-all duration-200 ease-in-out hover:border-primary/40 hover:shadow-[0_0_12px_hsl(var(--primary)/0.1)]"
                >
                  <div className={cn('flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold', DOC_BADGE[doc.type])}>
                    {DOC_ICON[doc.type]}
                    {doc.type}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.category}</p>
                  </div>
                </div>
              ))}
              {filteredDocs.length === 0 && (
                <p className="col-span-full text-center text-sm text-muted-foreground py-8">No documents match your search.</p>
              )}
            </div>
          </div>
        </section>

        {/* ─── USER MANAGEMENT ──────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <SectionHeader>User Management</SectionHeader>
            <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold gap-2 transition-all duration-200 hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          </div>

          {/* Seat Usage Bar */}
          <div className="card-industrial p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Seats Used</span>
              <span className="text-sm font-semibold text-primary">
                {seatUsed} / {seatTotal}
              </span>
            </div>
            <Progress value={seatPct} className="h-2.5 bg-muted" indicatorClassName="bg-gradient-to-r from-primary to-accent" />
          </div>

          {/* Team Members Table */}
          <div className="card-industrial overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((member, idx) => (
                  <TableRow
                    key={member.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Name + Avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-[11px] font-bold text-primary-foreground">
                          {member.initials}
                        </div>
                        <span className="font-medium text-foreground">{member.name}</span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>

                    {/* Role Badge */}
                    <TableCell>
                      <span className="inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold bg-primary/15 text-primary">
                        {member.role}
                      </span>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                          member.status === 'Active'
                            ? 'bg-success/15 text-success'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            member.status === 'Active' ? 'bg-success' : 'bg-muted-foreground'
                          )}
                        />
                        {member.status}
                      </span>
                    </TableCell>

                    {/* Last Active */}
                    <TableCell className="text-muted-foreground text-sm">{member.lastActive}</TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 border-border/50 transition-all duration-200 hover:border-primary hover:text-primary"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 border-border/50 transition-all duration-200 hover:border-destructive hover:text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {team.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No team members.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
