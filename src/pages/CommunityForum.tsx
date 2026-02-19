import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp, ChevronDown, MessageSquare, Eye, Bookmark, Search,
  ArrowLeft, X, Check, Pin, Flame, Users, Globe, CheckCircle,
  Bold, Italic, Code, List, Link2, Image, Bell, Edit3,
} from 'lucide-react';

// ============================================================================
// TOKENS
// ============================================================================
const T = {
  base: '#0F1419', card: '#161D26', elevated: '#1C2533',
  gold: '#FFD700', goldDim: '#B8960C',
  text1: '#FFFFFF', text2: '#B0B8C1',
  success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  border: '#2A3545', upvote: '#10B981',
};

const stagger = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.08, duration: 0.3 } });

// ============================================================================
// DATA
// ============================================================================
type Category = 'best-practices' | 'troubleshooting' | 'feature-requests' | 'integrations' | 'general' | 'urgent-help';
const CAT_META: Record<Category, { label: string; emoji: string; color: string }> = {
  'best-practices': { label: 'Best Practices', emoji: '🟡', color: T.gold },
  'troubleshooting': { label: 'Troubleshooting', emoji: '🔵', color: '#3B82F6' },
  'feature-requests': { label: 'Feature Requests', emoji: '🟢', color: T.success },
  'integrations': { label: 'Integrations', emoji: '🟣', color: '#8B5CF6' },
  'general': { label: 'General', emoji: '⚪', color: '#94A3B8' },
  'urgent-help': { label: 'Urgent Help', emoji: '🔴', color: T.danger },
};
const CAT_COUNTS: Record<Category, number> = { 'best-practices': 847, 'troubleshooting': 634, 'feature-requests': 412, 'integrations': 289, 'general': 512, 'urgent-help': 153 };

interface Post {
  id: number; category: Category; title: string; desc: string; votes: number;
  author: string; company: string; time: string; views: number; replies: number;
  solved: boolean; hot: boolean; pinned: boolean; tags: string[];
  body?: string;
  answers?: Answer[];
}
interface Answer { id: number; author: string; company: string; rep: number; time: string; body: string; votes: number; accepted: boolean; isStaff: boolean; }

const POSTS: Post[] = [
  { id: 1, category: 'best-practices', title: 'Best mix design ratios for C30 in high-temperature environments?', desc: 'We operate in 45°C+ summer temperatures and our C30 batches keep losing workability...', votes: 47, author: 'Hassan A.', company: 'Atlas Concrete', time: '2h ago', views: 124, replies: 8, solved: true, hot: false, pinned: false, tags: ['concrete-mix', 'temperature', 'quality', 'c30'],
    body: `We operate in 45°C+ summer temperatures and our C30 batches keep losing workability before reaching the job site (25-40 min drives). We've tried:\n\n• Chilled mixing water (helps but expensive)\n• Ice flakes (logistically complex)\n• Retarders at 0.3% (inconsistent results)\n\nOur target slump is 140-160mm but we're arriving at site at 80-100mm. What ratios and admixture strategies work best for extreme heat?\n\nUsing TBOS formulation engine but wondering if there are manual overrides others have found effective.`,
    answers: [
      { id: 1, author: 'Ahmed K.', company: 'Casablanca Nord', rep: 1840, time: '1h ago', body: `Great question. We faced exactly this in our Marrakech plant (routinely 48°C in summer). Here's what worked:\n\n**1. Water-Cement Ratio Adjustment**\nIncrease w/c by 0.02-0.03 above nominal for the transit time. In TBOS, use the "Climate Override" in Formulation → Advanced.\n\n**2. Superplasticizer Timing**\nDon't add at batching. Split dose: 70% at plant, 30% at site. TBOS supports "split admixture" logging since v4.2.\n\n**3. Aggregate Pre-cooling**\nSpray stockpiles at dawn. Reduces aggregate temp by 8-12°C. Cheapest intervention by far.\n\nResult: We maintain 145mm slump at 40-min delivery radius in August.`, votes: 32, accepted: true, isStaff: false },
      { id: 2, author: 'TBOS Team', company: 'TBOS', rep: 9999, time: '45m ago', body: `Ahmed's advice is spot on. We also recommend enabling the **"Heat Protocol"** in Settings → Production → Climate Profiles. This automatically adjusts target water content based on ambient temperature readings.\n\nThis feature was released in v4.3 and is available to all Professional+ plans.`, votes: 18, accepted: false, isStaff: true },
      { id: 3, author: 'Omar S.', company: 'Saudi Ready Mix', rep: 2100, time: '30m ago', body: `We use a combination of ice flakes (5% of water weight) + retarder at 0.25%. The key insight: **retarder dosage should decrease with temperature**, not increase. Counter-intuitive but chemically correct — higher temps accelerate retarder absorption.\n\nAlso, schedule your longest deliveries before 10am and after 5pm when possible. Route optimization in TBOS Fleet module helps here.`, votes: 14, accepted: false, isStaff: false },
    ]
  },
  { id: 2, category: 'troubleshooting', title: 'Slump values inconsistent after changing cement supplier — anyone experienced this?', desc: 'Switched from LafargeHolcim to a local supplier and our slump variance doubled...', votes: 38, author: 'Karim B.', company: 'Rabat Béton', time: '4h ago', views: 89, replies: 6, solved: false, hot: true, pinned: false, tags: ['cement', 'slump', 'supplier'] },
  { id: 3, category: 'feature-requests', title: 'Can we get batch report export directly to WhatsApp? Our clients ask for this daily', desc: 'Every single client asks us to WhatsApp them the batch certificate...', votes: 156, author: 'Fatima Z.', company: 'Gulf Concrete', time: '1d ago', views: 412, replies: 24, solved: false, hot: true, pinned: false, tags: ['whatsapp', 'export', 'client-experience'] },
  { id: 4, category: 'best-practices', title: 'How we reduced fuel costs by 22% using TBOS route optimization — full breakdown', desc: 'Complete guide to our fleet optimization strategy that saved us $48,000 annually...', votes: 89, author: 'Omar S.', company: 'Saudi Ready Mix', time: '2d ago', views: 567, replies: 15, solved: true, hot: false, pinned: false, tags: ['fleet', 'fuel', 'route-optimization', 'cost-reduction'] },
  { id: 5, category: 'integrations', title: 'Anyone successfully integrated TBOS with SAP? Looking for the webhook config', desc: 'Our corporate requires SAP integration for financial reporting...', votes: 34, author: 'Youssef A.', company: 'Atlas Group', time: '2d ago', views: 198, replies: 7, solved: false, hot: false, pinned: false, tags: ['sap', 'webhook', 'api', 'integration'] },
  { id: 6, category: 'troubleshooting', title: 'Arabic RTL mode — date fields showing wrong format in batch reports', desc: 'When switching to Arabic, date fields in PDF exports show LTR format...', votes: 28, author: 'Nadia T.', company: 'Tanger Mix', time: '3d ago', views: 156, replies: 4, solved: true, hot: false, pinned: false, tags: ['arabic', 'rtl', 'reports', 'bug'] },
  { id: 7, category: 'best-practices', title: 'Our quality pass rate went from 91% to 98.8% in 6 months — here\'s exactly what we changed', desc: 'Full operational breakdown of our quality transformation journey...', votes: 203, author: 'Ahmed K.', company: 'Casablanca Nord', time: '3d ago', views: 1247, replies: 31, solved: true, hot: false, pinned: true, tags: ['quality', 'improvement', 'case-study'] },
  { id: 8, category: 'feature-requests', title: 'Multi-plant consolidated reporting — when is this coming?', desc: 'Managing 4 plants and need a single dashboard view...', votes: 78, author: 'Said M.', company: 'Morocco Béton', time: '4d ago', views: 234, replies: 9, solved: false, hot: false, pinned: false, tags: ['multi-plant', 'reporting', 'dashboard'] },
  { id: 9, category: 'general', title: 'New to TBOS — what courses should I prioritize as an ops manager?', desc: 'Just started using TBOS and feeling overwhelmed by the features...', votes: 19, author: 'Layla M.', company: 'CIH Construction', time: '4d ago', views: 87, replies: 11, solved: true, hot: false, pinned: false, tags: ['onboarding', 'training', 'operations'] },
  { id: 10, category: 'troubleshooting', title: 'Predictive maintenance alert triggered but equipment looks fine — false positive?', desc: 'MX-005 showing bearing failure alert but visual inspection shows no issues...', votes: 31, author: 'Ibrahim H.', company: 'Dubai Concrete', time: '5d ago', views: 145, replies: 5, solved: false, hot: false, pinned: false, tags: ['predictive-maintenance', 'false-positive', 'equipment'] },
  { id: 11, category: 'best-practices', title: 'Workflow automation for end-of-day reporting — share your templates', desc: 'What automations are you all running for daily reporting?', votes: 67, author: 'Sara K.', company: 'Addoha Corp', time: '1w ago', views: 345, replies: 18, solved: true, hot: false, pinned: false, tags: ['automation', 'reporting', 'workflow'] },
  { id: 12, category: 'integrations', title: 'TBOS API rate limits — hitting 429 errors during batch sync', desc: 'Our middleware is hitting rate limits during peak batch processing...', votes: 22, author: 'Dev Team', company: 'Atlas Concrete', time: '1w ago', views: 178, replies: 6, solved: true, hot: false, pinned: false, tags: ['api', 'rate-limit', '429', 'sync'] },
];

const TOP_CONTRIBUTORS = [
  { rank: 1, name: 'Ahmed K.', rep: 480, emoji: '🥇' },
  { rank: 2, name: 'Fatima Z.', rep: 340, emoji: '🥈' },
  { rank: 3, name: 'Omar S.', rep: 290, emoji: '🥉' },
  { rank: 4, name: 'Hassan A.', rep: 210, emoji: '⭐' },
  { rank: 5, name: 'Sara K.', rep: 180, emoji: '⭐' },
];

const TRENDING_TAGS = ['#concrete-mix', '#quality-control', '#arabic-rtl', '#fleet-optimization', '#batch-automation', '#c30', '#maintenance', '#api'];

const ANNOUNCEMENTS = [
  { icon: '🆕', text: 'Arabic RTL v2.0 released — 40+ UI improvements', time: '2d ago' },
  { icon: '📊', text: 'New benchmark data: Q1 2025 MENA report', time: '5d ago' },
  { icon: '🎓', text: 'New course: AI & Predictive Maintenance', time: '1w ago' },
];

// ============================================================================
// COMPONENTS
// ============================================================================
function VoteBox({ votes: initialVotes, vertical = true }: { votes: number; vertical?: boolean }) {
  const [v, setV] = useState(initialVotes);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const up = () => { setV(voted === 'up' ? initialVotes : initialVotes + 1); setVoted(voted === 'up' ? null : 'up'); };
  const dn = () => { setV(voted === 'down' ? initialVotes : initialVotes - 1); setVoted(voted === 'down' ? null : 'down'); };
  return (
    <div className={`flex ${vertical ? 'flex-col' : ''} items-center gap-0.5`}>
      <button onClick={up} className="p-1.5 rounded-md transition-all hover:scale-110" style={{ color: voted === 'up' ? T.upvote : T.text2 }}><ChevronUp size={20} /></button>
      <span className="text-sm font-bold" style={{ fontFamily: 'JetBrains Mono', color: voted ? T.gold : T.text1 }}>{v}</span>
      <button onClick={dn} className="p-1.5 rounded-md transition-all hover:scale-110" style={{ color: voted === 'down' ? T.danger : T.text2 }}><ChevronDown size={20} /></button>
    </div>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  const m = CAT_META[category];
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${m.color}20`, color: m.color, border: `1px solid ${m.color}30` }}>{m.emoji} {m.label}</span>;
}

function StatusBadge({ solved, hot, pinned }: { solved: boolean; hot: boolean; pinned: boolean }) {
  if (pinned) return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${T.gold}20`, color: T.gold }}><Pin size={10} /> PINNED</span>;
  if (solved) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${T.success}20`, color: T.success }}>✅ SOLVED</span>;
  if (hot) return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${T.danger}20`, color: '#F97316' }}><Flame size={10} /> HOT</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${T.elevated}`, color: T.text2 }}>💬 OPEN</span>;
}

function Avatar({ name, isStaff = false, size = 32 }: { name: string; isStaff?: boolean; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  return (
    <div className="relative shrink-0">
      <div className="rounded-full flex items-center justify-center font-bold" style={{
        width: size, height: size, fontSize: size * 0.35,
        background: isStaff ? `linear-gradient(135deg, ${T.gold}, ${T.goldDim})` : `linear-gradient(135deg, ${T.gold}40, ${T.goldDim}40)`,
        color: isStaff ? '#000' : T.text1,
      }}>{initials}</div>
      {isStaff && <span className="absolute -bottom-1 -right-1 px-1 rounded text-[7px] font-bold" style={{ background: T.gold, color: '#000' }}>TBOS</span>}
    </div>
  );
}

// ============================================================================
// MAIN
// ============================================================================
export default function CommunityForum() {
  const [activeTab, setActiveTab] = useState<'latest' | 'top' | 'unanswered' | 'mine'>('latest');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState<Category | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());

  // New post form
  const [npTitle, setNpTitle] = useState('');
  const [npCategory, setNpCategory] = useState<Category | null>(null);
  const [npContent, setNpContent] = useState('');
  const [npTags, setNpTags] = useState<string[]>([]);
  const [npTagInput, setNpTagInput] = useState('');

  const filteredPosts = useMemo(() => {
    let list = [...POSTS];
    if (catFilter) list = list.filter(p => p.category === catFilter);
    if (searchQuery) list = list.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeTab === 'top') list.sort((a, b) => b.votes - a.votes);
    if (activeTab === 'unanswered') list = list.filter(p => !p.solved);
    // pinned first
    list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return list;
  }, [activeTab, catFilter, searchQuery]);

  const toggleBookmark = (id: number) => {
    setBookmarked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // ============================================================================
  // POST DETAIL
  // ============================================================================
  if (selectedPost) {
    const post = selectedPost;
    return (
      <div style={{ background: T.base, minHeight: '100vh', color: T.text1 }}>
        <div className="w-full h-0.5" style={{ background: `linear-gradient(90deg, ${T.gold}, transparent 30%, transparent 70%, ${T.gold})` }} />
        <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(rgba(255,215,0,0.02) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />

        <div className="relative z-10 max-w-4xl mx-auto p-6">
          <button onClick={() => setSelectedPost(null)} className="flex items-center gap-2 text-sm mb-6 hover:opacity-80" style={{ color: T.text2 }}>
            <ArrowLeft size={16} /> Back to Community
          </button>

          {/* Post */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1 pt-1">
              <VoteBox votes={post.votes} />
              <button onClick={() => toggleBookmark(post.id)} className="mt-2 p-1.5 rounded-md transition-all" style={{ color: bookmarked.has(post.id) ? T.gold : T.text2 }}>
                <Bookmark size={18} fill={bookmarked.has(post.id) ? T.gold : 'none'} />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CategoryBadge category={post.category} />
                <StatusBadge solved={post.solved} hot={post.hot} pinned={post.pinned} />
              </div>
              <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Poppins' }}>{post.title}</h1>
              <div className="flex items-center gap-3 mb-5">
                <Avatar name={post.author} size={28} />
                <span className="text-sm font-medium">{post.author}</span>
                <span className="text-xs" style={{ color: T.text2 }}>{post.company}</span>
                <span className="text-xs" style={{ color: T.text2 }}>· {post.time}</span>
                <span className="text-xs" style={{ color: T.text2 }}>· 📖 {post.views} views</span>
              </div>

              {/* Body */}
              <div className="p-5 rounded-xl mb-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                {(post.body || post.desc).split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) return <h3 key={i} className="font-bold mt-3 mb-1">{line.replace(/\*\*/g, '')}</h3>;
                  if (line.startsWith('•')) return <li key={i} className="ml-4 text-sm" style={{ color: T.text2, lineHeight: 1.7 }}>{line.slice(2)}</li>;
                  if (line.startsWith('`')) return <code key={i} className="block p-2 rounded text-sm my-2" style={{ background: T.elevated, fontFamily: 'JetBrains Mono' }}>{line.replace(/`/g, '')}</code>;
                  return <p key={i} className="text-sm mb-2" style={{ color: T.text2, lineHeight: 1.7 }}>{line}</p>;
                })}
              </div>

              {/* Tags */}
              <div className="flex gap-2 mb-8">
                {post.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-xs" style={{ background: T.elevated, color: T.text2, border: `1px solid ${T.border}` }}>{tag}</span>
                ))}
              </div>

              {/* Answers */}
              {post.answers && post.answers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>{post.answers.length} Answers <span className="text-xs font-normal" style={{ color: T.text2 }}>— sorted: Best Answer First</span></h3>
                  <div className="space-y-4">
                    {post.answers.map((ans, i) => (
                      <motion.div key={ans.id} {...stagger(i)} className="rounded-xl overflow-hidden"
                        style={{ background: T.card, border: `1px solid ${ans.accepted ? T.success + '40' : T.border}` }}>
                        {ans.accepted && (
                          <div className="px-4 py-2 flex items-center gap-2 text-xs font-bold" style={{ background: `${T.success}15`, color: T.success }}>
                            <CheckCircle size={14} /> ACCEPTED ANSWER
                          </div>
                        )}
                        <div className="p-4 flex gap-4">
                          <VoteBox votes={ans.votes} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <Avatar name={ans.author} isStaff={ans.isStaff} size={28} />
                              <span className="text-sm font-medium">{ans.author}</span>
                              {ans.isStaff && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: T.gold, color: '#000' }}>TBOS Team</span>}
                              <span className="text-xs" style={{ color: T.text2 }}>{ans.company}</span>
                              <span className="text-xs" style={{ fontFamily: 'JetBrains Mono', color: T.gold }}>⭐ {ans.rep.toLocaleString()}</span>
                              <span className="text-xs" style={{ color: T.text2 }}>· {ans.time}</span>
                            </div>
                            <div className="text-sm" style={{ color: T.text2, lineHeight: 1.7 }}>
                              {ans.body.split('\n').map((line, li) => {
                                if (line.startsWith('**') && line.endsWith('**')) return <h4 key={li} className="font-bold mt-2 mb-1" style={{ color: T.text1 }}>{line.replace(/\*\*/g, '')}</h4>;
                                if (line.startsWith('•') || line.startsWith('-')) return <li key={li} className="ml-4">{line.slice(2)}</li>;
                                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                                return <p key={li} className="mb-1.5">{parts.map((part, pi) =>
                                  part.startsWith('**') ? <strong key={pi} style={{ color: T.text1 }}>{part.replace(/\*\*/g, '')}</strong> : part
                                )}</p>;
                              })}
                            </div>
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: T.border }}>
                              <button className="text-xs flex items-center gap-1" style={{ color: T.text2 }}>👍 Helpful ({ans.votes})</button>
                              <button className="text-xs" style={{ color: T.text2 }}>Reply</button>
                              <button className="text-xs" style={{ color: T.text2 }}>Share</button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Answer */}
              <div className="mt-8 p-5 rounded-xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <h4 className="font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>Your Answer</h4>
                <div className="flex gap-1 mb-2 p-1 rounded-lg" style={{ background: T.elevated }}>
                  {[Bold, Italic, Code, List, Link2, Image].map((Icon, i) => (
                    <button key={i} className="p-2 rounded" style={{ color: T.text2 }}><Icon size={14} /></button>
                  ))}
                </div>
                <textarea rows={5} className="w-full p-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text1 }}
                  placeholder="Share your experience. Be specific about what worked for you..." />
                <button className="w-full mt-3 py-3.5 rounded-xl font-medium text-sm"
                  style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: '#000' }}>Post Answer</button>
                <p className="text-center text-xs mt-2" style={{ color: T.text2 }}>Be specific. Share what worked for you. Help the community.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // NEW POST MODAL
  // ============================================================================
  const npValid = npTitle.length > 0 && npCategory && npContent.length >= 50;

  // ============================================================================
  // MAIN LIST
  // ============================================================================
  return (
    <div style={{ background: T.base, minHeight: '100vh', color: T.text1 }}>
      <div className="w-full h-0.5" style={{ background: `linear-gradient(90deg, ${T.gold}, transparent 30%, transparent 70%, ${T.gold})` }} />
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(rgba(255,215,0,0.02) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />

      {/* Top Bar */}
      <div className="relative z-10 px-6 py-3 flex items-center gap-4" style={{ background: T.card, borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2 shrink-0">
          <Users size={22} color={T.gold} />
          <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: T.gold, fontFamily: 'Poppins' }}>COMMUNITY</span>
        </div>
        <div className="flex-1 max-w-lg mx-auto relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color={T.text2} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search 2,847 discussions..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text1 }}
            onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm" style={{ fontFamily: 'JetBrains Mono', color: T.gold }}>⭐ 1,240 rep</span>
          <button onClick={() => setShowNewPost(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: '#000' }}>
            <Edit3 size={14} /> New Post
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 flex gap-6">
        {/* LEFT: Posts */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-5">
            {([['latest', 'Latest'], ['top', 'Top This Week'], ['unanswered', 'Unanswered'], ['mine', 'My Posts']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} className="px-4 py-2 text-sm font-medium transition-all"
                style={{ color: activeTab === id ? T.gold : T.text2, borderBottom: activeTab === id ? `2px solid ${T.gold}` : '2px solid transparent' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Post list */}
          <div className="space-y-3">
            {filteredPosts.map((post, i) => (
              <motion.div key={post.id} {...stagger(i)} className="flex gap-3 p-4 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
                style={{
                  background: T.card, boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                  border: `1px solid ${T.border}`,
                  borderLeft: post.pinned ? `3px solid ${T.gold}` : post.hot ? `3px solid #F97316` : `1px solid ${T.border}`,
                  ...(post.pinned ? { background: `${T.gold}05` } : {}),
                }}
                onClick={() => setSelectedPost(post)}>
                <VoteBox votes={post.votes} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <CategoryBadge category={post.category} />
                    <h3 className="text-sm font-semibold truncate" style={{ fontFamily: 'Poppins' }}>{post.title}</h3>
                  </div>
                  <p className="text-xs mb-2 truncate" style={{ color: T.text2 }}>{post.desc}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Avatar name={post.author} size={20} />
                    <span className="text-xs font-medium">{post.author}</span>
                    <span className="text-xs" style={{ color: T.text2 }}>{post.company} · {post.time}</span>
                    <span className="text-xs flex items-center gap-1" style={{ color: T.text2 }}><Eye size={11} />{post.views}</span>
                    <span className="text-xs flex items-center gap-1" style={{ color: T.text2 }}><MessageSquare size={11} />{post.replies}</span>
                    <div className="flex-1" />
                    <StatusBadge solved={post.solved} hot={post.hot} pinned={post.pinned} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button className="w-full mt-4 py-3.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text2 }}>
            Load 20 more discussions →
          </button>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="w-72 shrink-0 space-y-4">
          {/* Stats */}
          <div className="p-4 rounded-xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>📊 Community Stats</h4>
            <div className="space-y-2">
              {[['👥', 'Members', '1,247'], ['💬', 'Posts', '2,847'], ['✅', 'Solved', '1,923'], ['🌍', 'Countries', '18']].map(([icon, label, val]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span style={{ color: T.text2 }}>{icon} {label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', color: T.gold }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Contributors */}
          <div className="p-4 rounded-xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>🏆 Top Contributors</h4>
            <div className="space-y-2">
              {TOP_CONTRIBUTORS.map(c => (
                <div key={c.rank} className="flex items-center gap-2 text-sm">
                  <span>{c.emoji}</span>
                  <span className="flex-1 font-medium">{c.name}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', color: T.success, fontSize: 12 }}>+{c.rep}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="p-4 rounded-xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>Categories</h4>
            <div className="space-y-1.5">
              {(Object.keys(CAT_META) as Category[]).map(cat => (
                <button key={cat} onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all"
                  style={{ background: catFilter === cat ? `${CAT_META[cat].color}15` : 'transparent', border: catFilter === cat ? `1px solid ${CAT_META[cat].color}30` : '1px solid transparent', color: catFilter === cat ? CAT_META[cat].color : T.text2 }}>
                  <span>{CAT_META[cat].emoji} {CAT_META[cat].label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>({CAT_COUNTS[cat]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trending Tags */}
          <div className="p-4 rounded-xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>Trending Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_TAGS.map(tag => (
                <span key={tag} className="px-2 py-1 rounded-full text-[10px]" style={{ background: T.elevated, color: T.text2, border: `1px solid ${T.border}` }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* TBOS Updates */}
          <div className="p-4 rounded-xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <h4 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>📣 From TBOS Team</h4>
            <div className="space-y-2.5">
              {ANNOUNCEMENTS.map((a, i) => (
                <div key={i} className="text-xs" style={{ color: T.text2 }}>
                  <span className="mr-1">{a.icon}</span>{a.text}
                  <span className="block mt-0.5 text-[10px]" style={{ color: `${T.text2}80` }}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={e => e.target === e.currentTarget && setShowNewPost(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Poppins' }}>New Post</h2>
                <button onClick={() => setShowNewPost(false)} className="p-1.5 rounded-lg" style={{ color: T.text2 }}><X size={18} /></button>
              </div>

              {/* Title */}
              <div className="mb-4">
                <input value={npTitle} onChange={e => setNpTitle(e.target.value.slice(0, 150))} placeholder="What's your question or topic?"
                  className="w-full px-4 py-3.5 rounded-xl text-base outline-none font-medium"
                  style={{ background: T.elevated, border: `1px solid ${!npTitle && npContent ? T.danger : T.border}`, color: T.text1, minHeight: 56 }} />
                <div className="flex justify-between mt-1">
                  {!npTitle && npContent ? <span className="text-xs" style={{ color: T.danger }}>Title is required</span> : <span />}
                  <span className="text-xs" style={{ color: npTitle.length > 140 ? T.danger : T.text2, fontFamily: 'JetBrains Mono' }}>{npTitle.length}/150</span>
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <p className="text-xs font-medium mb-2" style={{ color: T.text2 }}>Category</p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CAT_META) as Category[]).map(cat => (
                    <button key={cat} onClick={() => setNpCategory(cat)} className="py-3 rounded-xl text-xs font-medium transition-all"
                      style={{ background: npCategory === cat ? `${CAT_META[cat].color}15` : T.elevated, border: npCategory === cat ? `1px solid ${T.gold}` : `1px solid ${T.border}`, color: npCategory === cat ? T.text1 : T.text2 }}>
                      {CAT_META[cat].emoji} {CAT_META[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <div className="flex gap-1 mb-2 p-1 rounded-lg" style={{ background: T.elevated }}>
                  {[Bold, Italic, Code, List, Link2, Image].map((Icon, i) => (
                    <button key={i} className="p-2 rounded" style={{ color: T.text2 }}><Icon size={14} /></button>
                  ))}
                </div>
                <textarea value={npContent} onChange={e => setNpContent(e.target.value)} rows={6}
                  className="w-full p-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text1 }}
                  placeholder="Describe your question or share your knowledge..." />
                {npContent.length > 0 && npContent.length < 50 && (
                  <p className="text-xs mt-1" style={{ color: T.warning }}>Add more detail — minimum 50 characters ({50 - npContent.length} more)</p>
                )}
              </div>

              {/* Tags */}
              <div className="mb-4">
                <p className="text-xs font-medium mb-2" style={{ color: T.text2 }}>Tags (max 5)</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {npTags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                      style={{ background: T.elevated, color: T.text2, border: `1px solid ${T.border}` }}>
                      {tag}
                      <button onClick={() => setNpTags(npTags.filter(t => t !== tag))}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                {npTags.length < 5 && (
                  <input value={npTagInput} onChange={e => setNpTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && npTagInput.trim()) { e.preventDefault(); setNpTags([...npTags, npTagInput.trim()]); setNpTagInput(''); } }}
                    placeholder="Type + Enter to add tag" className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text1 }} />
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => setShowNewPost(false)} className="px-5 py-3 rounded-xl text-sm" style={{ color: T.text2, border: `1px solid ${T.border}` }}>Save Draft</button>
                <button onClick={() => { if (npValid) setShowNewPost(false); }} className="flex-1 py-3 rounded-xl font-medium text-sm"
                  style={{ background: npValid ? `linear-gradient(135deg, ${T.gold}, ${T.goldDim})` : T.elevated, color: npValid ? '#000' : T.text2, opacity: npValid ? 1 : 0.5 }}>
                  Post Discussion
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
