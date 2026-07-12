import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Package, Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function RewardMarketplace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [selectedReward, setSelectedReward] = useState<any>(null);

  const { data: rewards, isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const res = await api.get('/gamification/rewards');
      return res.data;
    }
  });
  
  const { data: stats } = useQuery({
    queryKey: ['gamificationStats'],
    queryFn: async () => {
      const res = await api.get('/gamification/me');
      return res.data;
    }
  });

  const { data: redemptions, isLoading: redemptionsLoading } = useQuery({
    queryKey: ['redemptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await api.get(`/gamification/users/${user.id}/redemptions`);
      return res.data;
    },
    enabled: !!user?.id
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      return api.post(`/gamification/rewards/${rewardId}/redeem`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['redemptions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['gamificationStats'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      setSelectedReward(null);
    },
    onError: (error: any) => {
      alert(error?.response?.data?.detail || 'Failed to redeem reward');
    }
  });

  const userXp = stats?.xp || 0;

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reward Marketplace</h1>
          <p className="text-muted-foreground mt-1">Exchange your earned XP for exclusive rewards</p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-full font-bold">
          <Star className="w-5 h-5 fill-current" />
          <span>{userXp.toLocaleString()} XP</span>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Available Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewardsLoading ? (
            [1, 2, 3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-xl"></div>)
          ) : (
            rewards?.map((reward: any) => {
              const isAffordable = userXp >= reward.cost_xp;
              const hasStock = reward.stock > 0;
              const isActive = reward.status === 'active';
              const disabled = !isAffordable || !hasStock || !isActive;
              
              return (
                <motion.div whileHover={{ y: -4 }} key={reward.id}>
                  <Card 
                    className={`glass overflow-hidden h-full flex flex-col transition-all cursor-pointer ${disabled ? 'opacity-70' : 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'}`}
                    onClick={() => !disabled && setSelectedReward(reward)}
                  >
                    <div className="h-2 bg-primary"></div>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span className="text-lg">{reward.title}</span>
                        <div className="flex items-center gap-1 text-sm bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded">
                          <Star className="w-3 h-3" />
                          {reward.cost_xp}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {reward.description || "No description available."}
                      </p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="w-3 h-3" />
                          {reward.stock} in stock
                        </div>
                        {!isActive ? (
                          <span className="text-xs text-red-500 font-medium">Inactive</span>
                        ) : !hasStock ? (
                          <span className="text-xs text-red-500 font-medium">Out of stock</span>
                        ) : !isAffordable ? (
                          <span className="text-xs text-muted-foreground font-medium">Need {reward.cost_xp - userXp} more XP</span>
                        ) : (
                          <span className="text-xs text-green-500 font-medium">Available</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">My Redemptions</h2>
        <Card className="glass">
          <CardContent className="p-0">
            {redemptionsLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : redemptions?.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground flex flex-col items-center">
                <Package className="w-8 h-8 mb-2 opacity-50" />
                <p>You haven't redeemed any rewards yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {redemptions?.map((redemption: any) => {
                  const reward = rewards?.find((r: any) => r.id === redemption.reward_id);
                  return (
                    <div key={redemption.id} className="p-4 flex items-center justify-between hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{reward?.title || `Reward #${redemption.reward_id}`}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(redemption.redeemed_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-medium text-yellow-500">
                        <Star className="w-4 h-4" />
                        -{redemption.xp_used} XP
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {selectedReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="shadow-2xl border-primary/20">
                <CardHeader>
                  <CardTitle>Redeem Reward</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold">{selectedReward.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{selectedReward.description}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Your XP</span>
                      <span className="font-bold">{userXp.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cost</span>
                      <span className="font-bold text-yellow-500">-{selectedReward.cost_xp.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between font-bold">
                      <span>Remaining XP</span>
                      <span>{(userXp - selectedReward.cost_xp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end mt-6">
                    <Button variant="outline" onClick={() => setSelectedReward(null)} disabled={redeemMutation.isPending}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => redeemMutation.mutate(selectedReward.id)}
                      disabled={redeemMutation.isPending}
                    >
                      {redeemMutation.isPending ? 'Redeeming...' : 'Confirm Redemption'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
