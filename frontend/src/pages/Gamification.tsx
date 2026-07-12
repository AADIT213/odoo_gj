
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Medal, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function Gamification() {
  const { data: challenges, isLoading: challengesLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const res = await api.get('/gamification/challenges');
      return res.data;
    }
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await api.get('/gamification/leaderboard');
      return res.data;
    }
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['gamificationStats'],
    queryFn: async () => {
      const res = await api.get('/gamification/me');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Gamification & Rewards</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-t-4 border-t-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Total XP</CardTitle>
            <Zap className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <div className="animate-pulse h-8 bg-muted rounded w-16"></div> : (
              <div className="text-3xl font-bold">{stats?.xp?.toLocaleString() || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Level {stats?.level || 1}</p>
          </CardContent>
        </Card>
        <Card className="glass border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Medal className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <div className="animate-pulse h-8 bg-muted rounded w-16"></div> : (
              <div className="text-3xl font-bold">{stats?.badges || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total collected</p>
          </CardContent>
        </Card>
        <Card className="glass border-t-4 border-t-purple-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
            <Trophy className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            {challengesLoading ? <div className="animate-pulse h-8 bg-muted rounded w-16"></div> : (
              <div className="text-3xl font-bold">{challenges?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Available to complete</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Challenges */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Available Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            {challengesLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>)}
              </div>
            ) : challenges?.length === 0 ? (
              <div className="text-sm text-muted-foreground">No active challenges available.</div>
            ) : (
              <div className="space-y-4">
                {challenges?.map((challenge: any) => (
                  <div key={challenge.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-accent/10">
                    <div>
                      <h3 className="font-semibold">{challenge.title}</h3>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 text-yellow-500 font-medium"><Star className="w-3 h-3" /> {challenge.points} XP</span>
                      </div>
                    </div>
                    <Button variant="outline" className="gap-2">Accept</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Leaderboard */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Global Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded border-b border-border/50"></div>)}
              </div>
            ) : leaderboard?.length === 0 ? (
              <div className="text-sm text-muted-foreground">Leaderboard empty.</div>
            ) : (
              <div className="space-y-4">
                {leaderboard?.map((user: any, index: number) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{user.name}</h4>
                        <p className="text-xs text-muted-foreground">{user.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-yellow-500 text-sm">{user.xp.toLocaleString()} XP</div>
                      <div className="text-xs text-muted-foreground">{user.badges} Badges</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
