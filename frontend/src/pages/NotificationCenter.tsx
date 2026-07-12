import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, Trash2, Filter, Search, RefreshCw,
  Gift, Award, Target, ClipboardCheck, Leaf, Shield, Info, AlertTriangle, Zap, X
} from 'lucide-react';
import api from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const now = Date.now();
  const past = new Date(isoString).getTime();
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  Critical: { label: 'Critical', color: 'text-red-400 bg-red-500/10 border-red-500/30', dot: 'bg-red-500' },
  High:     { label: 'High',     color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-400' },
  Medium:   { label: 'Medium',   color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', dot: 'bg-blue-400' },
  Low:      { label: 'Low',      color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', dot: 'bg-slate-400' },
};

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  Gamification: { icon: Award,          color: 'text-purple-400' },
  Social:       { icon: ClipboardCheck, color: 'text-green-400'  },
  Governance:   { icon: Shield,         color: 'text-yellow-400' },
  Environmental:{ icon: Leaf,           color: 'text-emerald-400'},
  System:       { icon: Info,           color: 'text-blue-400'   },
};

function TypeIcon({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.System;
  const Icon = config.icon;
  return <Icon className={`w-4 h-4 ${config.color}`} />;
}

// ─── Notification Card ────────────────────────────────────────────────────────

function NotificationCard({
  notif,
  onMarkRead,
  onDelete,
}: {
  notif: Notification;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const p = PRIORITY_CONFIG[notif.priority] || PRIORITY_CONFIG.Medium;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className={`relative group flex gap-3 p-4 rounded-xl border transition-colors
        ${notif.is_read
          ? 'border-border/40 bg-card/30 opacity-60'
          : 'border-border/70 bg-card/60 shadow-sm'
        }
        hover:bg-card/80`}
    >
      {/* Priority left strip */}
      <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${p.dot} ${notif.is_read ? 'opacity-30' : ''}`} />

      {/* Icon */}
      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${notif.is_read ? 'bg-muted/30' : 'bg-primary/10'}`}>
        <TypeIcon type={notif.type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold leading-snug ${notif.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
            {notif.title}
          </p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border flex-shrink-0 ${p.color}`}>
            {p.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-muted-foreground/60">{relativeTime(notif.created_at)}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground`}>
            {notif.type}
          </span>
        </div>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notif.is_read && (
          <button
            id={`notif-read-${notif.id}`}
            onClick={() => onMarkRead(notif.id)}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="Mark as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          id={`notif-delete-${notif.id}`}
          onClick={() => onDelete(notif.id)}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationCenter() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const queryParams = new URLSearchParams({
    skip: String(page * PAGE_SIZE),
    limit: String(PAGE_SIZE),
    ...(filterType ? { type: filterType } : {}),
    ...(filterPriority ? { priority: filterPriority } : {}),
    ...(filterRead === 'unread' ? { is_read: 'false' } : filterRead === 'read' ? { is_read: 'true' } : {}),
  });

  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications', filterType, filterPriority, filterRead, page],
    queryFn: async () => {
      const res = await api.get(`/notifications?${queryParams}`);
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: invalidate,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => api.patch('/notifications/read-all'),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/notifications/${id}`),
    onSuccess: invalidate,
  });

  // Client-side search filter
  const filtered = notifications.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
  });

  const unreadCount = countData?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notification Center
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-sm font-bold bg-destructive text-white rounded-full ml-1">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All system notifications, alerts and updates in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id="notif-refresh"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-accent text-sm text-muted-foreground transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              id="notif-mark-all-read"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-card/50 border border-border/60 glass">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            id="notif-search"
            type="text"
            placeholder="Search notifications…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Read filter */}
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {(['all', 'unread', 'read'] as const).map(v => (
            <button
              key={v}
              id={`filter-read-${v}`}
              onClick={() => { setFilterRead(v); setPage(0); }}
              className={`px-3 py-1.5 capitalize transition-colors ${filterRead === v ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          id="filter-type"
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(0); }}
          className="px-3 py-1.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-muted-foreground"
        >
          <option value="">All types</option>
          {['Gamification', 'Social', 'Governance', 'Environmental', 'System'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          id="filter-priority"
          value={filterPriority}
          onChange={e => { setFilterPriority(e.target.value); setPage(0); }}
          className="px-3 py-1.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-muted-foreground"
        >
          <option value="">All priorities</option>
          {['Critical', 'High', 'Medium', 'Low'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Clear filters */}
        {(filterType || filterPriority || filterRead !== 'all' || search) && (
          <button
            id="clear-filters"
            onClick={() => { setFilterType(''); setFilterPriority(''); setFilterRead('all'); setSearch(''); setPage(0); }}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: notifications.length, icon: Bell, color: 'text-primary' },
          { label: 'Unread', value: unreadCount, icon: AlertTriangle, color: 'text-orange-400' },
          { label: 'Critical', value: notifications.filter(n => n.priority === 'Critical').length, icon: Zap, color: 'text-red-400' },
          { label: 'This Page', value: filtered.length, icon: Filter, color: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-muted-foreground"
          >
            <Bell className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No notifications match your filters.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map(notif => (
              <NotificationCard
                key={notif.id}
                notif={notif}
                onMarkRead={id => markReadMutation.mutate(id)}
                onDelete={id => deleteMutation.mutate(id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {notifications.length === PAGE_SIZE && (
        <div className="flex justify-center gap-3">
          {page > 0 && (
            <button
              id="notif-prev"
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
            >
              Previous
            </button>
          )}
          <button
            id="notif-next"
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
