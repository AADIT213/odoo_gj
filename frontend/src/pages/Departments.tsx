import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Plus, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function Departments() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data;
    }
  });

  const filteredDepts = departments?.filter((d: any) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Departments</h1>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Department
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            className="pl-9 glass" 
            placeholder="Search departments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepts.map((dept: any) => (
            <Card key={dept.id} className="glass hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold">{dept.name}</CardTitle>
                <Users className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Department Head</span>
                    <span className="font-medium">{dept.head_id ? `User #${dept.head_id}` : 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">{dept.status}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">ESG Score</span>
                      <div className="flex items-center gap-1 text-esg-green font-bold text-lg">
                        {dept.env_score + dept.soc_score + dept.gov_score > 0 
                          ? (dept.env_score + dept.soc_score + dept.gov_score).toFixed(1) 
                          : 'N/A'}
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    {/* Mini progress bar */}
                    <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-esg-green to-esg-blue h-full rounded-full" 
                        style={{ width: `${Math.min(100, dept.env_score + dept.soc_score + dept.gov_score)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
