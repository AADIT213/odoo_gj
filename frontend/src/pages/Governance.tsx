import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, FileWarning, CheckCircle, AlertTriangle, FileText, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function Governance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: '', description: '', severity: 'Medium', due_date: '', department_id: 1, owner_id: 1 });

  // Automatically detect overdue issues on load
  useEffect(() => {
    api.post('/governance/compliance-issues/detect-overdue').then(() => {
      queryClient.invalidateQueries({ queryKey: ['complianceIssues'] });
    }).catch(console.error);
  }, [queryClient]);

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

  const resolveMutation = useMutation({
    mutationFn: async (issueId: number) => {
      return api.put(`/governance/compliance-issues/${issueId}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceIssues'] });
    }
  });

  const createIssueMutation = useMutation({
    mutationFn: async () => {
      return api.post('/governance/compliance-issues', newIssue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceIssues'] });
      setShowCreateForm(false);
      setNewIssue({ title: '', description: '', severity: 'Medium', due_date: '', department_id: 1, owner_id: 1 });
    }
  });

  const openIssues = issues?.filter((i: any) => i.status === 'Open' || i.status === 'Overdue')?.length || 0;
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Compliance Issues</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowCreateForm(!showCreateForm)} className="gap-1">
              <Plus className="w-4 h-4" /> New Issue
            </Button>
          </CardHeader>
          <CardContent>
            {showCreateForm && (
              <div className="p-4 mb-4 rounded-lg border border-border/50 bg-accent/5 space-y-3">
                <Input placeholder="Issue Title" value={newIssue.title} onChange={e => setNewIssue({...newIssue, title: e.target.value})} />
                <Input placeholder="Description" value={newIssue.description} onChange={e => setNewIssue({...newIssue, description: e.target.value})} />
                <div className="flex gap-2">
                  <Input type="date" value={newIssue.due_date} onChange={e => setNewIssue({...newIssue, due_date: e.target.value})} />
                  <Input placeholder="Owner ID" type="number" value={newIssue.owner_id} onChange={e => setNewIssue({...newIssue, owner_id: parseInt(e.target.value)})} />
                </div>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newIssue.severity} 
                  onChange={(e) => setNewIssue({...newIssue, severity: e.target.value})}
                >
                  <option value="" disabled>Severity</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                  <Button size="sm" onClick={() => createIssueMutation.mutate()} disabled={createIssueMutation.isPending || !newIssue.title || !newIssue.due_date}>Save Issue</Button>
                </div>
              </div>
            )}

            {issuesLoading ? (
              <div className="space-y-4">
                {[1,2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded"></div>)}
              </div>
            ) : issues?.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent findings or issues.</div>
            ) : (
              <div className="space-y-4">
                {issues?.map((issue: any) => (
                  <div key={issue.id} className={`p-4 rounded-lg border flex justify-between gap-4 ${issue.status === 'Overdue' ? 'bg-red-500/20 border-red-500/40' : issue.severity === 'Critical' ? 'bg-red-500/10 border-red-500/20' : issue.severity === 'High' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-yellow-500/10 border-yellow-500/20'} ${issue.status === 'Resolved' && 'opacity-60 bg-green-500/10 border-green-500/20'}`}>
                    <div className="flex gap-4">
                      <FileWarning className={`w-6 h-6 shrink-0 ${issue.status === 'Overdue' ? 'text-red-600' : issue.severity === 'Critical' ? 'text-red-500' : issue.severity === 'High' ? 'text-orange-500' : 'text-yellow-500'} ${issue.status === 'Resolved' && 'text-green-500'}`} />
                      <div>
                        <h4 className={`font-semibold ${issue.status === 'Overdue' ? 'text-red-600' : issue.severity === 'Critical' ? 'text-red-500' : issue.severity === 'High' ? 'text-orange-500' : 'text-yellow-500'} ${issue.status === 'Resolved' && 'text-green-500'}`}>
                          {issue.title} {issue.status === 'Overdue' && '(OVERDUE)'}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{issue.description || 'No description provided.'}</p>
                        <div className="mt-2 text-xs font-medium">Due: {new Date(issue.due_date).toLocaleDateString()} | Owner ID: {issue.owner_id} | Status: {issue.status}</div>
                      </div>
                    </div>
                    {issue.status !== 'Resolved' && (
                        <Button size="sm" variant="outline" onClick={() => resolveMutation.mutate(issue.id)} disabled={resolveMutation.isPending} className="self-center">
                          Resolve
                        </Button>
                    )}
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
