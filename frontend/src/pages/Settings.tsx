import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function Toggle({ label, enabled, onToggle, loading }: {
  label: string;
  enabled: boolean;
  onToggle: (val: boolean) => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span>{label}</span>
      <Button variant="outline" size="sm" disabled={loading} onClick={() => onToggle(!enabled)}>
        {enabled ? 'ON' : 'OFF'}
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Manager';
  const queryClient = useQueryClient();

  // ESG Settings (toggles)
  const { data: esgSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['esgSettings'],
    queryFn: async () => {
      const res = await api.get('/esg/settings');
      return res.data as { auto_emission_calc_enabled: boolean; evidence_required_enabled: boolean };
    },
    enabled: isAdmin,
  });

  const toggleMutation = useMutation({
    mutationFn: async (payload: { auto_emission_calc_enabled?: boolean; evidence_required_enabled?: boolean }) =>
      api.put('/esg/settings', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esgSettings'] }),
  });

  // ESG Weight config
  const { data: weightConfig, isLoading: weightLoading } = useQuery({
    queryKey: ['esgWeights'],
    queryFn: async () => {
      const res = await api.get('/esg/weights');
      return res.data as { env_weight: number; soc_weight: number; gov_weight: number };
    },
    enabled: isAdmin,
  });

  const weightMutation = useMutation({
    mutationFn: async (payload: { env_weight?: number; soc_weight?: number; gov_weight?: number }) =>
      api.put('/esg/weights', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esgWeights'] }),
  });

  // Departments (list only)
  const { data: departments, isLoading: deptLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data;
    },
    enabled: isAdmin,
  });

  // Categories (list only)
  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
    enabled: isAdmin,
  });

  // EmissionFactor (list only)
  const { data: factors, isLoading: factorLoading } = useQuery({
    queryKey: ['emissionFactors'],
    queryFn: async () => {
      const res = await api.get('/emission_factor');
      return res.data;
    },
    enabled: isAdmin,
  });

  const handleWeightChange = (field: keyof typeof weightConfig, value: string) => {
    const num = Number(value);
    if (!isNaN(num) && weightConfig) {
      weightMutation.mutate({ ...weightConfig, [field]: num });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* ESG Toggles */}
      <Card>
        <CardHeader><CardTitle>ESG Settings</CardTitle></CardHeader>
        <CardContent>
          {settingsLoading ? <p>Loading...</p> : (
            <div className="space-y-4">
              <Toggle label="Auto Emission Calculation" enabled={esgSettings?.auto_emission_calc_enabled ?? false} loading={toggleMutation.isLoading} onToggle={(val) => toggleMutation.mutate({ auto_emission_calc_enabled: val })} />
              <Toggle label="Evidence Required" enabled={esgSettings?.evidence_required_enabled ?? false} loading={toggleMutation.isLoading} onToggle={(val) => toggleMutation.mutate({ evidence_required_enabled: val })} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Weights */}
      <Card>
        <CardHeader><CardTitle>Score Weights</CardTitle></CardHeader>
        <CardContent>
          {weightLoading ? <p>Loading...</p> : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Env</label>
                <Input type="number" defaultValue={weightConfig?.env_weight ?? ''} onBlur={e => handleWeightChange('env_weight', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Soc</label>
                <Input type="number" defaultValue={weightConfig?.soc_weight ?? ''} onBlur={e => handleWeightChange('soc_weight', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gov</label>
                <Input type="number" defaultValue={weightConfig?.gov_weight ?? ''} onBlur={e => handleWeightChange('gov_weight', e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Departments */}
      <Card>
        <CardHeader><CardTitle>Departments</CardTitle></CardHeader>
        <CardContent>
          {deptLoading ? <p>Loading...</p> : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Name</th>
                </tr>
              </thead>
              <tbody>
                {departments?.map((d: any) => (
                  <tr key={d.id}>
                    <td className="p-2">{d.id}</td>
                    <td className="p-2">{d.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader><CardTitle>Categories</CardTitle></CardHeader>
        <CardContent>
          {catLoading ? <p>Loading...</p> : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Name</th>
                </tr>
              </thead>
              <tbody>
                {categories?.map((c: any) => (
                  <tr key={c.id}>
                    <td className="p-2">{c.id}</td>
                    <td className="p-2">{c.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Emission Factors */}
      <Card>
        <CardHeader><CardTitle>Emission Factors</CardTitle></CardHeader>
        <CardContent>
          {factorLoading ? <p>Loading...</p> : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Source Type</th>
                  <th className="text-left p-2">Factor</th>
                </tr>
              </thead>
              <tbody>
                {factors?.map((f: any) => (
                  <tr key={f.id}>
                    <td className="p-2">{f.id}</td>
                    <td className="p-2">{f.source_type}</td>
                    <td className="p-2">{f.factor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Placeholder Notifications */}
      <Card>
        <CardHeader><CardTitle>Notifications (placeholder)</CardTitle></CardHeader>
        <CardContent><p>No notifications configured for the admin page.</p></CardContent>
      </Card>
    </div>
  );
}