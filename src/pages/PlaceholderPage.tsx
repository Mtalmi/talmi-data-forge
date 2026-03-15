import MainLayout from '@/components/layout/MainLayout';
import { Construction } from 'lucide-react';

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

interface PlaceholderPageProps {
  title: string;
  icon?: React.ReactNode;
}

export default function PlaceholderPage({ title, icon }: PlaceholderPageProps) {
  return (
    <MainLayout>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', gap: 20, textAlign: 'center', padding: 40,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon || <Construction size={28} style={{ color: '#D4A843' }} />}
        </div>
        <h1 style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: '#D4A843', letterSpacing: '1px' }}>
          {title}
        </h1>
        <p style={{ fontFamily: MONO, fontSize: 13, color: '#9CA3AF', maxWidth: 400 }}>
          Cette section sera disponible prochainement
        </p>
        <p style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(156,163,175,0.5)' }}>
          Contenu en cours de déploiement...
        </p>
        <span style={{
          fontFamily: MONO, fontSize: 10, color: '#D4A843',
          border: '1px solid rgba(212,168,67,0.2)', borderRadius: 6,
          padding: '4px 12px', background: 'rgba(212,168,67,0.04)',
        }}>
          Powered by TBOS AI Platform
        </span>
      </div>
    </MainLayout>
  );
}
