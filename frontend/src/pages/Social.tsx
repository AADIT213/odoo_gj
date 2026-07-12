import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Clock, CheckCircle2, Award } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

export default function Social() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'csr' | 'diversity' | 'training'>('csr');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['csrActivities'],
    queryFn: async () => {
      const res = await api.get('/social/activities');
      return res.data;
    }
  });

  const { data: participations, isLoading: participationsLoading } = useQuery({
    queryKey: ['participations'],
    queryFn: async () => {
      const res = await api.get('/social/participations');
      return res.data;
    }
  });

  const { data: diversityMetrics } = useQuery({
    queryKey: ['diversityMetrics'],
    queryFn: async () => {
      const res = await api.get('/social/diversity-metrics');
      return res.data;
    }
  });

  const { data: trainingMetrics } = useQuery({
    queryKey: ['trainingMetrics'],
    queryFn: async () => {
      const res = await api.get('/social/training-metrics');
      return res.data;
    }
  });

  const enrollMutation = useMutation({
    mutationFn: async ({ activityId, url }: { activityId: number, url: string }) => {
      const res = await api.post('/social/participations', {
        activity_id: activityId,
        user_id: 0, // Handled by backend
        hours_contributed: 0,
        proof_url: url
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participations'] });
      setProofUrl('');
      alert('Successfully enrolled!');
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (participationId: number) => {
      const res = await api.put(`/social/participations/${participationId}/approve`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['participations'] });
      
      // Check for auto-awarded badges
      if (data.new_badges && data.new_badges.length > 0) {
        setUnlockedBadges(data.new_badges);
      } else {
        alert('Participation approved!');
      }
    }
  });

  const totalPoints = activities?.reduce((acc: number, item: any) => acc + (item.points_awarded || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Social Module</h1>
        <div className="flex space-x-2">
           <Button variant={activeTab === 'csr' ? 'default' : 'outline'} onClick={() => setActiveTab('csr')}>CSR</Button>
           <Button variant={activeTab === 'diversity' ? 'default' : 'outline'} onClick={() => setActiveTab('diversity')}>Diversity</Button>
           <Button variant={activeTab === 'training' ? 'default' : 'outline'} onClick={() => setActiveTab('training')}>Training</Button>
        </div>
      </div>

      {activeTab === 'csr' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total CSR Points</CardTitle>
                <Clock className="w-4 h-4 text-esg-blue" />
              </CardHeader>
              <CardContent>
                {activitiesLoading ? <div className="animate-pulse h-8 bg-muted rounded w-24"></div> : (
                  <div className="text-3xl font-bold">{totalPoints.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Available to earn</p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Participations</CardTitle>
                <Users className="w-4 h-4 text-esg-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{participations?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Events joined</p>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <CheckCircle2 className="w-4 h-4 text-esg-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{participations?.filter((p: any) => !p.is_approved).length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting manager review</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Upcoming CSR Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="space-y-4">
                      {[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded"></div>)}
                    </div>
                  ) : activities?.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No upcoming activities found.</div>
                  ) : (
                    <div className="space-y-4">
                      {activities?.map((activity: any) => (
                        <div key={activity.id} className="flex flex-col space-y-2 p-4 rounded-lg border border-border/50 bg-accent/10">
                          <div className="flex justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{activity.title}</h3>
                                <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {activity.points_awarded} pts</span>
                                  <span className="flex items-center gap-1">Cat: {activity.category}</span>
                                  <span className="flex items-center gap-1">Date: {new Date(activity.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                  <Input 
                                      placeholder="Proof URL (Optional)" 
                                      className="h-8 text-xs"
                                      onChange={(e) => setProofUrl(e.target.value)}
                                  />
                                  <Button size="sm" onClick={() => enrollMutation.mutate({ activityId: activity.id, url: proofUrl })} disabled={enrollMutation.isPending}>
                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Enroll
                                  </Button>
                              </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle>Participation Status (Manager View included)</CardTitle>
                </CardHeader>
                <CardContent>
                  {participationsLoading ? (
                    <div className="space-y-4">
                      {[1,2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded"></div>)}
                    </div>
                  ) : participations?.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No participations yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {participations?.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-accent/10">
                          <div>
                            <h3 className="font-semibold">Activity #{p.activity_id}</h3>
                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">Status: {p.is_approved ? 'Approved' : 'Pending'}</span>
                              {p.proof_url && <span className="flex items-center gap-1 text-blue-500"><a href={p.proof_url} target="_blank" rel="noreferrer">Proof</a></span>}
                            </div>
                          </div>
                          {!p.is_approved && (
                              <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(p.id)} disabled={approveMutation.isPending}>
                                Approve
                              </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        </>
      )}

      {activeTab === 'diversity' && (
          <Card className="glass">
              <CardHeader>
                  <CardTitle>Diversity & Inclusion Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {diversityMetrics?.length === 0 ? <p className="text-muted-foreground">No data available.</p> : diversityMetrics?.map((metric: any) => (
                          <div key={metric.id} className="flex justify-between p-4 border rounded">
                              <span className="font-medium">{metric.metric_name}</span>
                              <span className="text-esg-purple font-bold">{metric.metric_value}%</span>
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
      )}

      {activeTab === 'training' && (
          <Card className="glass">
              <CardHeader>
                  <CardTitle>Training Completion Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {trainingMetrics?.length === 0 ? <p className="text-muted-foreground">No data available.</p> : trainingMetrics?.map((metric: any) => (
                          <div key={metric.id} className="flex justify-between p-4 border rounded">
                              <span className="font-medium">{metric.course_name}</span>
                              <span className="text-esg-green font-bold">{metric.completion_percentage}%</span>
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
      )}

      {/* Badge Unlock Toast Modal */}
      <AnimatePresence>
        {unlockedBadges.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setUnlockedBadges([])}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <Card className="shadow-2xl border-primary/50 text-center bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                      <Award className="w-10 h-10 text-primary" />
                    </div>
                    New Badge Unlocked!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {unlockedBadges.map((badge, idx) => (
                    <div key={idx} className="bg-accent/20 p-4 rounded-xl border border-primary/20">
                      <h3 className="text-xl font-bold">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{badge.description || "You earned a new badge!"}</p>
                    </div>
                  ))}
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => setUnlockedBadges([])}
                  >
                    Awesome!
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
