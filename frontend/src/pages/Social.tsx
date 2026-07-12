
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Users, Clock, Plus, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function Social() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['csrActivities'],
    queryFn: async () => {
      const res = await api.get('/social/csr-activities');
      return res.data;
    }
  });

  const totalHours = activities?.reduce((acc: number, item: any) => acc + item.hours_awarded, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Social & CSR</h1>
        <Button className="bg-esg-blue hover:bg-esg-blue/90 text-white gap-2">
          <Plus className="w-4 h-4" /> New CSR Activity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total CSR Hours</CardTitle>
            <Clock className="w-4 h-4 text-esg-blue" />
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="animate-pulse h-8 bg-muted rounded w-24"></div> : (
              <div className="text-3xl font-bold">{totalHours.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Across entire organization</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Employee Participation</CardTitle>
            <Users className="w-4 h-4 text-esg-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground mt-1">Goal: 75% by EOY</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Diversity Score</CardTitle>
            <Heart className="w-4 h-4 text-esg-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">89.2</div>
            <p className="text-xs text-muted-foreground mt-1">Top 10% in industry</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Upcoming CSR Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded"></div>)}
            </div>
          ) : activities?.length === 0 ? (
            <div className="text-sm text-muted-foreground">No upcoming activities found.</div>
          ) : (
            <div className="space-y-4">
              {activities?.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-accent/10">
                  <div>
                    <h3 className="font-semibold text-lg">{activity.title}</h3>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {activity.hours_awarded} hrs</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {activity.department_id ? `Dept #${activity.department_id}` : 'All'}</span>
                      <span className="flex items-center gap-1">Date: {new Date(activity.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Enroll
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
