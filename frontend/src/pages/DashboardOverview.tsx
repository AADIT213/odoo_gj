import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Heart, Shield, Activity, Trophy, Settings } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function DashboardOverview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: weightsData, isLoading: weightsLoading } = useQuery({
    queryKey: ['esgWeights'],
    queryFn: async () => {
      const res = await api.get('/esg/weights');
      return res.data;
    }
  });

  const [editWeights, setEditWeights] = useState({ env_weight: 0.4, soc_weight: 0.3, gov_weight: 0.3 });
  const [isEditingWeights, setIsEditingWeights] = useState(false);

  useEffect(() => {
    if (weightsData) {
      setEditWeights(weightsData);
    }
  }, [weightsData]);

  const updateWeightsMutation = useMutation({
    mutationFn: async (newWeights: any) => {
      return api.put('/esg/weights', newWeights);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esgWeights'] });
      queryClient.invalidateQueries({ queryKey: ['orgScore'] });
      setIsEditingWeights(false);
    }
  });
  const { data: scoreData, isLoading: scoreLoading } = useQuery({
    queryKey: ['orgScore'],
    queryFn: async () => {
      const res = await api.get('/analytics/organization-score');
      return res.data;
    }
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activityFeed'],
    queryFn: async () => {
      const res = await api.get('/analytics/activity-feed');
      return res.data;
    }
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['historicalTrend'],
    queryFn: async () => {
      const res = await api.get('/analytics/historical-trend');
      return res.data;
    }
  });
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass border-t-4 border-t-esg-green">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Environmental Score</CardTitle>
            <Leaf className="w-4 h-4 text-esg-green" />
          </CardHeader>
          <CardContent>
            {scoreLoading ? <div className="animate-pulse h-8 w-16 bg-muted rounded"></div> : (
              <>
                <div className="text-3xl font-bold text-esg-green">{scoreData?.env_score}</div>
                <p className="text-xs text-muted-foreground mt-1">Based on global emissions</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-t-4 border-t-esg-blue">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Social Score</CardTitle>
            <Heart className="w-4 h-4 text-esg-blue" />
          </CardHeader>
          <CardContent>
            {scoreLoading ? <div className="animate-pulse h-8 w-16 bg-muted rounded"></div> : (
              <>
                <div className="text-3xl font-bold text-esg-blue">{scoreData?.soc_score}</div>
                <p className="text-xs text-muted-foreground mt-1">Based on CSR hours</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-t-4 border-t-esg-purple">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Governance Score</CardTitle>
            <Shield className="w-4 h-4 text-esg-purple" />
          </CardHeader>
          <CardContent>
            {scoreLoading ? <div className="animate-pulse h-8 w-16 bg-muted rounded"></div> : (
              <>
                <div className="text-3xl font-bold text-esg-purple">{scoreData?.gov_score}</div>
                <p className="text-xs text-muted-foreground mt-1">Based on audit results</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total ESG Score</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {scoreLoading ? <div className="animate-pulse h-8 w-16 bg-muted rounded"></div> : (
              <>
                <div className="text-3xl font-bold text-primary">{scoreData?.total_score}</div>
                <p className="text-xs text-muted-foreground mt-1">{scoreData?.status}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ESG Configuration Card */}
      {user?.role === 'SuperAdmin' && (
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>ESG Weight Configuration</CardTitle>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {weightsLoading ? <div className="animate-pulse h-8 w-1/3 bg-muted rounded"></div> : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Configure the weights for Environmental, Social, and Governance scores. Must sum to 1.0.</p>
                <div className="flex gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Environmental</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={editWeights.env_weight} 
                      onChange={e => setEditWeights({ ...editWeights, env_weight: parseFloat(e.target.value) })}
                      disabled={!isEditingWeights}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Social</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={editWeights.soc_weight} 
                      onChange={e => setEditWeights({ ...editWeights, soc_weight: parseFloat(e.target.value) })}
                      disabled={!isEditingWeights}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Governance</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={editWeights.gov_weight} 
                      onChange={e => setEditWeights({ ...editWeights, gov_weight: parseFloat(e.target.value) })}
                      disabled={!isEditingWeights}
                    />
                  </div>
                  {isEditingWeights ? (
                    <div className="flex gap-2">
                       <Button variant="outline" onClick={() => {
                         setIsEditingWeights(false);
                         setEditWeights(weightsData);
                       }}>Cancel</Button>
                       <Button onClick={() => updateWeightsMutation.mutate(editWeights)} disabled={updateWeightsMutation.isPending}>Save & Recalculate</Button>
                    </div>
                  ) : (
                    <Button onClick={() => setIsEditingWeights(true)}>Edit Weights</Button>
                  )}
                </div>
                {Math.abs(editWeights.env_weight + editWeights.soc_weight + editWeights.gov_weight - 1.0) > 0.001 && (
                  <p className="text-xs text-red-500">Weights must sum to exactly 1.0 (current sum: {(editWeights.env_weight + editWeights.soc_weight + editWeights.gov_weight).toFixed(2)})</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 glass">
          <CardHeader>
            <CardTitle>ESG Score Trends (YTD)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {trendLoading ? (
               <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse rounded"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorEnv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSoc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: 'none' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorEnv)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="col-span-1 glass">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded"></div>)}
              </div>
            ) : activityData?.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent activity.</div>
            ) : (
              <div className="space-y-4">
                {activityData?.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {item.user_name} {item.action} in {item.module}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
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
