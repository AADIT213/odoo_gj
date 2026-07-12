import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Leaf, Heart, Shield, Trophy, FileText, BrainCircuit, Bell, ShoppingBag, X, CheckCheck, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const sidebarNavItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Departments", href: "/departments", icon: Users },
  { title: "Environmental", href: "/environmental", icon: Leaf },
  { title: "Social", href: "/social", icon: Heart },
  { title: "Governance", href: "/governance", icon: Shield },
  { title: "Gamification", href: "/gamification", icon: Trophy },
  { title: "My Badges", href: "/badges", icon: Medal },
  { title: "Rewards Store", href: "/rewards", icon: ShoppingBag },
  { title: "Reports", href: "/reports", icon: FileText },
  { title: "AI Advisor", href: "/advisor", icon: BrainCircuit },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications?limit=20');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  function relativeTime(isoString: string): string {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  }

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length || 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 border-r bg-card/50 glass flex-shrink-0 flex flex-col hidden md:flex"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-esg-green to-esg-blue">
            EcoSphere
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {sidebarNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-esg-purple to-esg-blue flex items-center justify-center text-white font-bold">
              {user?.full_name?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.full_name || 'User'}</span>
              <span className="text-xs text-muted-foreground">{user?.role || 'Employee'}</span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 border-b bg-card/30 glass flex items-center justify-between px-6 z-10 relative">
          <div className="font-medium text-lg">
            {sidebarNavItems.find(i => i.href === location.pathname)?.title || 'Overview'}
          </div>
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 rounded-full hover:bg-accent transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-14 right-6 w-80 bg-card border border-border shadow-2xl rounded-xl z-50 overflow-hidden glass">
                <div className="p-3 border-b font-medium flex justify-between items-center">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span
                      id="notif-mark-all-bell"
                      className="text-xs text-primary cursor-pointer hover:underline flex items-center gap-1"
                      onClick={() => markAllReadMutation.mutate()}
                    >
                      <CheckCheck className="w-3 h-3" /> Mark all read
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 flex justify-center"><div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div></div>
                  ) : notifications?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    notifications?.map((n: any) => (
                      <div
                        key={n.id}
                        className={`group p-3 border-b border-border/50 hover:bg-accent/50 cursor-pointer transition-colors ${n.is_read ? 'opacity-60' : 'bg-primary/5'}`}
                        onClick={() => {
                          if (!n.is_read) markReadMutation.mutate(n.id);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${n.priority === 'Critical' ? 'bg-red-500' :
                              n.priority === 'High' ? 'bg-orange-400' :
                                n.priority === 'Medium' ? 'bg-blue-400' : 'bg-slate-400'
                            }`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{n.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</div>
                            <div className="text-[10px] text-muted-foreground/60 mt-1">{relativeTime(n.created_at)}</div>
                          </div>
                          <button
                            id={`bell-delete-${n.id}`}
                            onClick={e => { e.stopPropagation(); deleteMutation.mutate(n.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-destructive transition-all flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* View All link */}
                <div className="p-2 border-t text-center">
                  <button
                    id="notif-view-all"
                    onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                    className="text-xs text-primary hover:underline py-1"
                  >
                    View all notifications →
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-background to-accent/20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
