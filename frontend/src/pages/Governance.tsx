
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileWarning, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function Governance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const res = await api.get('/governance/policies');
      return res.data;
    }
  });

  const { data: issues, isLoading: issuesLoading } = useQuery({
    queryKey: ['complianceIssues'],
    queryFn: async () => {
      const res = await api.get('/governance/compliance-issues');
      return res.data;
    }
  });

  const ackMutation = useMutation({
    mutationFn: async (policyId: number) => {
      return api.post('/governance/policies/acknowledge', {
        user_id: user?.id,
        policy_id: policyId,
        date_acknowledged: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    }
  });

  const openIssues = issues?.filter((i: any) => i.status === 'Open')?.length || 0;
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Governance & Compliance</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-t-4 border-t-esg-purple">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="w-4 h-4 text-esg-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
          </CardContent>
        </Card>
        <Card className="glass border-t-4 border-t-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Audit Issues</CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {issuesLoading ? <div className="animate-pulse h-8 bg-muted rounded w-16"></div> : (
              <div className="text-3xl font-bold">{openIssues}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Requires immediate action</p>
          </CardContent>
        </Card>
        <Card className="glass border-t-4 border-t-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {policiesLoading ? <div className="animate-pulse h-8 bg-muted rounded w-16"></div> : (
              <div className="text-3xl font-bold">{policies?.filter((p:any) => p.is_active).length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Global org policies</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>My Policy Acknowledgements</CardTitle>
          </CardHeader>
          <CardContent>
            {policiesLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>)}
              </div>
            ) : policies?.length === 0 ? (
              <div className="text-sm text-muted-foreground">No policies require acknowledgement.</div>
            ) : (
              <div className="space-y-4">
                {policies?.map((policy: any) => (
                  <div key={policy.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-accent/5">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-esg-purple" />
                      <div>
                        <h4 className="font-medium text-sm">{policy.title}</h4>
                        <p className="text-xs text-muted-foreground">Please review and acknowledge</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs border-esg-purple text-esg-purple hover:bg-esg-purple hover:text-white"
                      onClick={() => ackMutation.mutate(policy.id)}
                      disabled={ackMutation.isPending}
                    >
                      {ackMutation.isPending ? 'Signing...' : 'Sign Now'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Recent Audit Findings</CardTitle>
          </CardHeader>
          <CardContent>
            {issuesLoading ? (
              <div className="space-y-4">
                {[1,2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded"></div>)}
              </div>
            ) : issues?.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent findings or issues.</div>
            ) : (
              <div className="space-y-4">
                {issues?.map((issue: any) => (
                  <div key={issue.id} className={`p-4 rounded-lg border flex gap-4 ${issue.severity === 'Critical' ? 'bg-red-500/10 border-red-500/20' : issue.severity === 'High' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                    <FileWarning className={`w-6 h-6 shrink-0 ${issue.severity === 'Critical' ? 'text-red-500' : issue.severity === 'High' ? 'text-orange-500' : 'text-yellow-500'}`} />
                    <div>
                      <h4 className={`font-semibold ${issue.severity === 'Critical' ? 'text-red-500' : issue.severity === 'High' ? 'text-orange-500' : 'text-yellow-500'}`}>
                        {issue.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{issue.description || 'No description provided.'}</p>
                      <div className="mt-2 text-xs font-medium">Due: {new Date(issue.due_date).toLocaleDateString()} | Status: {issue.status}</div>
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
