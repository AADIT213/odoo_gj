
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplets, Zap, Trash2, Plus, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function Environmental() {
  const { data: envData, isLoading: envLoading } = useQuery({
    queryKey: ['environmentalData'],
    queryFn: async () => {
      const res = await api.get('/environmental');
      return res.data;
    }
  });

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await api.get('/environmental/goals');
      return res.data;
    }
  });

  // Calculate totals
  const totalEnergy = envData?.reduce((acc: number, item: any) => acc + item.energy_usage_kwh, 0) || 0;
  const totalWater = envData?.reduce((acc: number, item: any) => acc + item.water_usage_liters, 0) || 0;
  const totalWaste = envData?.reduce((acc: number, item: any) => acc + item.waste_generated_kg, 0) || 0;

  // Aggregate by month for chart (assuming we had more robust dates)
  const chartData = envData?.length ? envData.map((d: any) => ({
    name: new Date(d.date_recorded).toLocaleDateString('en-US', { month: 'short' }),
    electricity: d.energy_usage_kwh,
    water: d.water_usage_liters,
    waste: d.waste_generated_kg
  })) : [];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Environmental Tracking</h1>
        <Button className="bg-esg-green hover:bg-esg-green/90 text-white gap-2">
          <Plus className="w-4 h-4" /> Log Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-t-4 border-t-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Energy Consumption</CardTitle>
            <Zap className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            {envLoading ? <div className="animate-pulse h-8 bg-muted rounded w-24"></div> : (
              <div className="text-3xl font-bold">{totalEnergy.toLocaleString()} kWh</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total recorded</p>
          </CardContent>
        </Card>
        <Card className="glass border-t-4 border-t-blue-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Water Usage</CardTitle>
            <Droplets className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            {envLoading ? <div className="animate-pulse h-8 bg-muted rounded w-24"></div> : (
              <div className="text-3xl font-bold">{totalWater.toLocaleString()} L</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total recorded</p>
          </CardContent>
        </Card>
        <Card className="glass border-t-4 border-t-orange-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Waste Generated</CardTitle>
            <Trash2 className="w-4 h-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            {envLoading ? <div className="animate-pulse h-8 bg-muted rounded w-24"></div> : (
              <div className="text-3xl font-bold">{totalWaste.toLocaleString()} kg</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total recorded</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Carbon Footprint Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {envLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse rounded"></div>
            ) : chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: 'none' }} itemStyle={{ color: '#fff' }} />
                  <Bar dataKey="electricity" stackId="a" fill="#eab308" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="water" stackId="a" fill="#60a5fa" />
                  <Bar dataKey="waste" stackId="a" fill="#fb923c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Sustainability Goals</CardTitle>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>)}
              </div>
            ) : goals?.length === 0 ? (
              <div className="text-sm text-muted-foreground">No active goals found.</div>
            ) : (
              <div className="space-y-4">
                {goals?.map((goal: any) => (
                  <div key={goal.id} className="p-4 rounded-lg border border-border/50 bg-accent/10 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{goal.title}</h4>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Target className="w-3 h-3"/> {goal.target_reduction_percent}% Reduction</span>
                        <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${goal.status === 'Achieved' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                      {goal.status}
                    </span>
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
