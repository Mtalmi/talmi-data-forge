import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #11182E, #162036)' }}
    >
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 40 }}>
        <div style={{
          fontSize: 72, fontWeight: 700, fontFamily: MONO,
          color: '#D4A843', letterSpacing: 4, lineHeight: 1,
        }}>
          404
        </div>
        <p style={{
          fontFamily: MONO, fontSize: 15, color: '#9CA3AF',
          margin: '16px 0 8px', lineHeight: 1.6,
        }}>
          Page introuvable
        </p>
        <p style={{
          fontFamily: MONO, fontSize: 12, color: 'rgba(156,163,175,0.5)',
          margin: '0 0 32px',
        }}>
          La route <span style={{ color: '#D4A843' }}>{location.pathname}</span> n'existe pas.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              fontFamily: MONO, fontSize: 13, padding: '10px 20px',
              borderRadius: 8, border: '1px solid rgba(212,168,67,0.2)',
              background: 'rgba(212,168,67,0.06)', color: '#D4A843',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 200ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(212,168,67,0.06)')}
          >
            <ArrowLeft size={14} /> Retour
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              fontFamily: MONO, fontSize: 13, padding: '10px 20px',
              borderRadius: 8, border: 'none',
              background: '#D4A843', color: '#0F1629',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              fontWeight: 600, transition: 'all 200ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Home size={14} /> Tableau de Bord
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
