import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Medal, Star, X, Calendar, Zap, Trophy, Sparkles, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Badge {
  id: number;
  name: string;
  description: string | null;
  icon_url: string | null;
  required_xp: number;
}

interface UserBadge {
  id: number;
  badge_id: number;
  date_earned: string;
  badge: Badge;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives a display category from the badge name / description.
 * Falls back to "General" if nothing matches.
 */
function deriveCategory(badge: Badge): string {
  const text = `${badge.name} ${badge.description ?? ''}`.toLowerCase();
  if (text.includes('environ') || text.includes('eco') || text.includes('green') || text.includes('carbon')) return 'Environmental';
  if (text.includes('social') || text.includes('team') || text.includes('community') || text.includes('people')) return 'Social';
  if (text.includes('govern') || text.includes('compli') || text.includes('report') || text.includes('audit')) return 'Governance';
  if (text.includes('xp') || text.includes('level') || text.includes('reward') || text.includes('achiev')) return 'Achievement';
  return 'General';
}

const CATEGORY_COLORS: Record<string, string> = {
  Environmental: 'from-emerald-500 to-teal-600',
  Social:        'from-blue-500 to-indigo-600',
  Governance:    'from-purple-500 to-violet-600',
  Achievement:   'from-yellow-500 to-orange-500',
  General:       'from-slate-500 to-slate-600',
};

const CATEGORY_BG: Record<string, string> = {
  Environmental: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Social:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Governance:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Achievement:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  General:       'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

/** Maps a badge to an emoji icon when there is no icon_url. */
function badgeEmoji(badge: Badge): string {
  const cat = deriveCategory(badge);
  const map: Record<string, string> = {
    Environmental: '🌿',
    Social:        '🤝',
    Governance:    '🏛️',
    Achievement:   '⚡',
    General:       '🏅',
  };
  return map[cat] ?? '🏅';
}

// ─── XP Progress Bar ─────────────────────────────────────────────────────────

function XPProgressBar({ current, required }: { current: number; required: number }) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{current.toLocaleString()} XP</span>
        <span>{required.toLocaleString()} XP</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
        />
      </div>
      <div className="text-right text-xs text-muted-foreground">{pct}%</div>
    </div>
  );
}

// ─── Earned Badge Card ─────────────────────────────────────────────────────────

function EarnedBadgeCard({ ub, onClick }: { ub: UserBadge; onClick: () => void }) {
  const cat = deriveCategory(ub.badge);
  const gradient = CATEGORY_COLORS[cat];

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className={`relative rounded-2xl p-px bg-gradient-to-br ${gradient} shadow-lg hover:shadow-2xl transition-shadow duration-300`}>
        {/* Shimmer overlay */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />
        </motion.div>

        <div className="relative bg-card rounded-2xl p-5 flex flex-col items-center gap-3 text-center h-full">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl shadow-md`}>
            {ub.badge.icon_url
              ? <img src={ub.badge.icon_url} alt={ub.badge.name} className="w-10 h-10 object-contain" />
              : <span>{badgeEmoji(ub.badge)}</span>
            }
          </div>

          {/* Name */}
          <h3 className="font-bold text-sm leading-tight">{ub.badge.name}</h3>

          {/* Category chip */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_BG[cat]}`}>
            {cat}
          </span>

          {/* Unlock date */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-auto">
            <Calendar className="w-3 h-3" />
            {new Date(ub.date_earned).toLocaleDateString()}
          </div>

          {/* Checkmark badge */}
          <div className="absolute top-2 right-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Locked Badge Card ─────────────────────────────────────────────────────────

function LockedBadgeCard({ badge, userXp, onClick }: { badge: Badge; userXp: number; onClick: () => void }) {
  const pct = Math.min(100, Math.round((userXp / badge.required_xp) * 100));

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className="rounded-2xl p-px bg-border/50">
        <div className="relative bg-card rounded-2xl p-5 flex flex-col items-center gap-3 text-center h-full grayscale opacity-70 hover:opacity-90 transition-opacity duration-200">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl relative">
            {badge.icon_url
              ? <img src={badge.icon_url} alt={badge.name} className="w-10 h-10 object-contain" />
              : <span className="opacity-40">{badgeEmoji(badge)}</span>
            }
            {/* Lock overlay */}
            <div className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          {/* Name */}
          <h3 className="font-bold text-sm leading-tight text-muted-foreground">{badge.name}</h3>

          {/* XP required chip */}
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border bg-muted text-muted-foreground">
            {badge.required_xp.toLocaleString()} XP required
          </span>

          {/* Mini progress bar */}
          <div className="w-full space-y-1">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden w-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-slate-400 to-slate-500"
              />
            </div>
            <div className="text-[10px] text-muted-foreground/70">{pct}% there</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface ModalProps {
  badge: Badge;
  earnedEntry: UserBadge | undefined;
  userXp: number;
  onClose: () => void;
}

function BadgeDetailModal({ badge, earnedEntry, userXp, onClose }: ModalProps) {
  const isEarned = !!earnedEntry;
  const cat = deriveCategory(badge);
  const gradient = CATEGORY_COLORS[cat];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Gradient header band */}
          <div className={`h-2 bg-gradient-to-r ${gradient}`} />

          {/* Close button */}
          <button
            id="badge-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="p-6 space-y-5">
            {/* Icon + name */}
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-4xl shadow-lg ${!isEarned ? 'grayscale opacity-60' : ''}`}>
                {badge.icon_url
                  ? <img src={badge.icon_url} alt={badge.name} className="w-12 h-12 object-contain" />
                  : (isEarned
                      ? <span>{badgeEmoji(badge)}</span>
                      : <Lock className="w-8 h-8 text-white/70" />
                    )
                }
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{badge.name}</h2>
                <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${CATEGORY_BG[cat]}`}>
                  {cat}
                </span>
                {isEarned && (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs mt-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Unlocked
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {badge.description ?? 'No description available for this badge.'}
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <div className="text-lg font-bold">{badge.required_xp.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">XP Required</div>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-primary mb-1">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold">{userXp.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">Your XP</div>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Progress towards badge
              </div>
              <XPProgressBar current={userXp} required={badge.required_xp} />
            </div>

            {/* Unlock date (earned only) */}
            {isEarned && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Unlocked on</div>
                  <div className="font-semibold text-sm text-emerald-400">
                    {new Date(earnedEntry!.date_earned).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            )}

            {!isEarned && (
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl p-3">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  Earn <span className="font-semibold text-foreground">{Math.max(0, badge.required_xp - userXp).toLocaleString()} more XP</span> to unlock this badge.
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'all' | 'earned' | 'locked';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Badges() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selectedBadgeId, setSelectedBadgeId] = useState<number | null>(null);

  // All available badges (earned + locked)
  const { data: allBadges = [], isLoading: badgesLoading } = useQuery<Badge[]>({
    queryKey: ['badges'],
    queryFn: async () => {
      const res = await api.get('/gamification/badges');
      return res.data;
    },
  });

  // Current user's earned badges with date_earned
  const { data: myBadges = [], isLoading: myBadgesLoading } = useQuery<UserBadge[]>({
    queryKey: ['myBadges'],
    queryFn: async () => {
      const res = await api.get('/gamification/me/badges');
      return res.data;
    },
  });

  // User XP + level
  const { data: stats } = useQuery<{ xp: number; level: number; badges: number }>({
    queryKey: ['gamificationStats'],
    queryFn: async () => {
      const res = await api.get('/gamification/me');
      return res.data;
    },
  });

  const userXp = stats?.xp ?? 0;
  const earnedBadgeIds = new Set(myBadges.map(ub => ub.badge_id));
  const earnedMap = new Map<number, UserBadge>(myBadges.map(ub => [ub.badge_id, ub]));
  const lockedBadges = allBadges.filter(b => !earnedBadgeIds.has(b.id));

  const displayedBadges: Badge[] = (() => {
    if (activeTab === 'earned') return allBadges.filter(b => earnedBadgeIds.has(b.id));
    if (activeTab === 'locked') return lockedBadges;
    return allBadges;
  })();

  const selectedBadge = selectedBadgeId != null ? allBadges.find(b => b.id === selectedBadgeId) : null;
  const isLoading = badgesLoading || myBadgesLoading;

  const TABS: { id: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'all',    label: 'All Badges', count: allBadges.length,    icon: <Trophy className="w-4 h-4" /> },
    { id: 'earned', label: 'Earned',     count: myBadges.length,     icon: <Medal className="w-4 h-4" /> },
    { id: 'locked', label: 'Locked',     count: lockedBadges.length, icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8 relative">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Medal className="w-8 h-8 text-yellow-400" />
            My Badges
          </h1>
          <p className="text-muted-foreground mt-1">Track your achievements and unlock new badges</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-4 py-2 rounded-full font-bold text-sm">
            <Star className="w-4 h-4 fill-current" />
            {userXp.toLocaleString()} XP
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-full font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            Level {stats?.level ?? 1}
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {([
          { label: 'Total Badges',  value: allBadges.length,    color: 'from-slate-500 to-slate-600',  icon: <Trophy className="w-5 h-5 text-slate-300" /> },
          { label: 'Badges Earned', value: myBadges.length,     color: 'from-emerald-500 to-teal-600', icon: <Medal className="w-5 h-5 text-white" /> },
          { label: 'Badges Locked', value: lockedBadges.length, color: 'from-slate-600 to-slate-700',  icon: <Lock className="w-5 h-5 text-slate-300" /> },
        ] as const).map(stat => (
          <Card key={stat.label} className="glass border-0 overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`badge-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-background'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Badge Grid ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : displayedBadges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Medal className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-lg text-muted-foreground">
            {activeTab === 'earned' ? 'No badges earned yet' : 'No badges available'}
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {activeTab === 'earned' ? 'Complete challenges and earn XP to unlock your first badge!' : ''}
          </p>
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {displayedBadges.map(badge => {
            const isEarned = earnedBadgeIds.has(badge.id);
            return isEarned ? (
              <EarnedBadgeCard
                key={badge.id}
                ub={earnedMap.get(badge.id)!}
                onClick={() => setSelectedBadgeId(badge.id)}
              />
            ) : (
              <LockedBadgeCard
                key={badge.id}
                badge={badge}
                userXp={userXp}
                onClick={() => setSelectedBadgeId(badge.id)}
              />
            );
          })}
        </motion.div>
      )}

      {/* ── Badge Detail Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge}
            earnedEntry={earnedMap.get(selectedBadge.id)}
            userXp={userXp}
            onClose={() => setSelectedBadgeId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
