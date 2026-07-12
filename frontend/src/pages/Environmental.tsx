import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplets, Zap, Trash2, Plus, Target, X, Settings, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const SOURCE_TYPES = ['Purchase', 'Manufacturing', 'Expense', 'Fleet'] as const;
type SourceType = typeof SOURCE_TYPES[number];

export default function Environmental() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'Manager';

  // ── modal / form state ────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-calc form fields
  const [sourceType, setSourceType] = useState<SourceType>('Purchase');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [txType, setTxType] = useState<'Credit' | 'Offset'>('Credit');
  const [deptId, setDeptId] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));

  // Manual form fields
  const [manualAmountMt, setManualAmountMt] = useState('');
  const [manualTxType, setManualTxType] = useState<'Credit' | 'Offset'>('Credit');
  const [manualDeptId, setManualDeptId] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
  const [manualDesc, setManualDesc] = useState('');

  // ── queries ───────────────────────────────────────────────────────────────
  const { data: envData, isLoading: envLoading } = useQuery({
    queryKey: ['environmentalData'],
    queryFn: async () => {
      const res = await api.get('/environmental');
      return res.data;
    },
  });

  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await api.get('/environmental/goals');
      return res.data;
    },
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['carbonTransactions'],
    queryFn: async () => {
      const res = await api.get('/environmental/transactions');
      return res.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data;
    },
  });

  // Settings: auto_emission_calc_enabled toggle
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['esgSettings'],
    queryFn: async () => {
      const res = await api.get('/esg/settings');
      return res.data as { auto_emission_calc_enabled: boolean; evidence_required_enabled: boolean };
    },
    enabled: isAdmin,
  });

  const autoCalcEnabled = settings?.auto_emission_calc_enabled ?? false;
  const evidenceEnabled = settings?.evidence_required_enabled ?? false;

  // ── mutations ─────────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) =>
      api.put('/esg/settings', { auto_emission_calc_enabled: enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esgSettings'] }),
  });

  const toggleEvidenceMutation = useMutation({
    mutationFn: async (enabled: boolean) =>
      api.put('/esg/settings', { auto_emission_calc_enabled: settings?.auto_emission_calc_enabled ?? false, evidence_required_enabled: enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['esgSettings'] }),
  });

  const autoTransactionMutation = useMutation({
    mutationFn: async (payload: {
      department_id: number;
      source_type: string;
      quantity: number;
      unit: string;
      transaction_type: string;
      date: string;
    }) => api.post('/environmental/transactions/auto', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carbonTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['environmentalData'] });
      setShowForm(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail || 'Auto-calculation failed.');
    },
  });

  const manualTransactionMutation = useMutation({
    mutationFn: async (payload: {
      department_id: number;
      transaction_type: string;
      amount_mt: number;
      date: string;
      description: string;
    }) => api.post('/environmental/transactions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carbonTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['environmentalData'] });
      setShowForm(false);
      resetManualForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail || 'Failed to create transaction.');
    },
  });

  function resetForm() {
    setSourceType('Purchase');
    setQuantity('');
    setUnit('');
    setTxType('Credit');
    setDeptId('');
    setTxDate(new Date().toISOString().slice(0, 10));
    setFormError(null);
  }

  function resetManualForm() {
    setManualAmountMt('');
    setManualTxType('Credit');
    setManualDeptId('');
    setManualDate(new Date().toISOString().slice(0, 10));
    setManualDesc('');
    setFormError(null);
  }

  function handleAutoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!deptId || !quantity || !unit) {
      setFormError('Please fill in all required fields.');
      return;
    }
    autoTransactionMutation.mutate({
      department_id: Number(deptId),
      source_type: sourceType,
      quantity: Number(quantity),
      unit,
      transaction_type: txType,
      date: txDate,
    });
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!manualDeptId || !manualAmountMt) {
      setFormError('Please fill in all required fields.');
      return;
    }
    manualTransactionMutation.mutate({
      department_id: Number(manualDeptId),
      transaction_type: manualTxType,
      amount_mt: Number(manualAmountMt),
      date: manualDate,
      description: manualDesc,
    });
  }

  // ── chart data ────────────────────────────────────────────────────────────
  const totalEnergy = envData?.reduce((acc: number, item: any) => acc + item.energy_usage_kwh, 0) || 0;
  const totalWater  = envData?.reduce((acc: number, item: any) => acc + item.water_usage_liters, 0) || 0;
  const totalWaste  = envData?.reduce((acc: number, item: any) => acc + item.waste_generated_kg, 0) || 0;

  const chartData = envData?.length
    ? envData.map((d: any) => ({
        name: new Date(d.date_recorded).toLocaleDateString('en-US', { month: 'short' }),
        electricity: d.energy_usage_kwh,
        water: d.water_usage_liters,
        waste: d.waste_generated_kg,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Environmental Tracking</h1>
        <div className="flex items-center gap-3">
          {/* Admin-only auto-calc toggle */}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 glass">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Auto Emission Calc</span>
              {settingsLoading ? (
                <div className="w-10 h-5 rounded-full bg-muted animate-pulse" />
              ) : (
                <button
                  id="auto-emission-toggle"
                  role="switch"
                  aria-checked={autoCalcEnabled}
                  onClick={() => toggleMutation.mutate(!autoCalcEnabled)}
                  disabled={toggleMutation.isPending}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    autoCalcEnabled ? 'bg-esg-green' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      autoCalcEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              )}
              <span className={`text-xs font-semibold ${autoCalcEnabled ? 'text-esg-green' : 'text-muted-foreground'}`}>
                {autoCalcEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          )}
          {/* Evidence Required toggle */}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 glass ml-4">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Evidence Required</span>
              {settingsLoading ? (
                <div className="w-10 h-5 rounded-full bg-muted animate-pulse" />
              ) : (
                <button
                  id="evidence-toggle"
                  role="switch"
                  aria-checked={evidenceEnabled}
                  onClick={() => toggleEvidenceMutation.mutate(!evidenceEnabled)}
                  disabled={toggleEvidenceMutation.isPending}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    evidenceEnabled ? 'bg-esg-green' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      evidenceEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              )}
              <span className={`text-xs font-semibold ${evidenceEnabled ? 'text-esg-green' : 'text-muted-foreground'}`}>
                {evidenceEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          )}

          {isAdmin && (
            <Button
              id="add-transaction-btn"
              className="bg-esg-green hover:bg-esg-green/90 text-white gap-2"
              onClick={() => { setShowForm(true); setFormError(null); }}
            >
              <Plus className="w-4 h-4" />
              {autoCalcEnabled ? 'Auto Log Emission' : 'Log Transaction'}
            </Button>
          )}
        </div>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-t-4 border-t-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Energy Consumption</CardTitle>
            <Zap className="w-4 h-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            {envLoading ? <div className="animate-pulse h-8 bg-muted rounded w-24" /> : (
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
            {envLoading ? <div className="animate-pulse h-8 bg-muted rounded w-24" /> : (
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
            {envLoading ? <div className="animate-pulse h-8 bg-muted rounded w-24" /> : (
              <div className="text-3xl font-bold">{totalWaste.toLocaleString()} kg</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Chart + Goals ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Carbon Footprint Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {envLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse rounded" />
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
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: 'none' }} itemStyle={{ color: '#fff' }} />
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
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}
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
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {goal.target_reduction_percent}% Reduction</span>
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

      {/* ── Carbon Transactions table ────────────────────────────────────────── */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Carbon Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {txLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
            </div>
          ) : transactions?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No carbon transactions logged yet.</div>
          ) : (
            <div className="divide-y divide-border/50">
              {transactions?.map((tx: any) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.transaction_type === 'Credit' ? 'bg-red-400' : 'bg-green-400'}`} />
                    <div>
                      <p className="text-sm font-medium">{tx.description || `${tx.transaction_type} — Dept #${tx.department_id}`}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {tx.calculation_method === 'Auto' && (
                      <span className="text-[10px] bg-esg-green/10 text-esg-green border border-esg-green/20 px-1.5 py-0.5 rounded-full font-medium">Auto</span>
                    )}
                    <span className={`font-semibold text-sm ${tx.transaction_type === 'Credit' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.transaction_type === 'Credit' ? '+' : '-'}{tx.amount_mt} MT
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Transaction Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => { setShowForm(false); resetForm(); resetManualForm(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <Card className="shadow-2xl border-border glass">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">
                    {autoCalcEnabled ? '⚡ Auto Emission Entry' : '📋 Manual Carbon Transaction'}
                  </CardTitle>
                  <button
                    id="close-transaction-modal"
                    onClick={() => { setShowForm(false); resetForm(); resetManualForm(); }}
                    className="p-1.5 rounded-full hover:bg-accent transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Error banner */}
                  {formError && (
                    <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {formError}
                    </div>
                  )}

                  {autoCalcEnabled ? (
                    /* ── AUTO CALC FORM ── */
                    <form id="auto-emission-form" onSubmit={handleAutoSubmit} className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Department</label>
                        <select
                          id="auto-dept-select"
                          value={deptId}
                          onChange={e => setDeptId(e.target.value)}
                          className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          required
                        >
                          <option value="">Select department…</option>
                          {departments?.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Source Type</label>
                        <select
                          id="source-type-select"
                          value={sourceType}
                          onChange={e => setSourceType(e.target.value as SourceType)}
                          className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          {SOURCE_TYPES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Quantity</label>
                          <input
                            id="auto-quantity"
                            type="number"
                            min="0"
                            step="any"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            placeholder="e.g. 100"
                            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Unit</label>
                          <input
                            id="auto-unit"
                            type="text"
                            value={unit}
                            onChange={e => setUnit(e.target.value)}
                            placeholder="e.g. kg, kWh, USD"
                            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Transaction Type</label>
                          <select
                            id="auto-tx-type"
                            value={txType}
                            onChange={e => setTxType(e.target.value as 'Credit' | 'Offset')}
                            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <option value="Credit">Credit (Emission)</option>
                            <option value="Offset">Offset (Reduction)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
                          <input
                            id="auto-date"
                            type="date"
                            value={txDate}
                            onChange={e => setTxDate(e.target.value)}
                            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                          />
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                        CO₂e will be calculated automatically using the stored Emission Factor for the selected source type.
                      </div>

                      <div className="flex gap-2 justify-end pt-1">
                        <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                          Cancel
                        </Button>
                        <Button
                          id="auto-submit-btn"
                          type="submit"
                          className="bg-esg-green hover:bg-esg-green/90 text-white"
                          disabled={autoTransactionMutation.isPending}
                        >
                          {autoTransactionMutation.isPending ? 'Calculating…' : '⚡ Calculate & Save'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* ── MANUAL FORM (unchanged behaviour) ── */
                    <form id="manual-transaction-form" onSubmit={handleManualSubmit} className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Department</label>
                        <select
                          id="manual-dept-select"
                          value={manualDeptId}
                          onChange={e => setManualDeptId(e.target.value)}
                          className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          required
                        >
                          <option value="">Select department…</option>
                          {departments?.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Transaction Type</label>
                          <select
                            id="manual-tx-type"
                            value={manualTxType}
                            onChange={e => setManualTxType(e.target.value as 'Credit' | 'Offset')}
                            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <option value="Credit">Credit (Emission)</option>
                            <option value="Offset">Offset (Reduction)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">Amount (MT CO₂e)</label>
                          <input
                            id="manual-amount-mt"
                            type="number"
                            min="0"
                            step="any"
                            value={manualAmountMt}
                            onChange={e => setManualAmountMt(e.target.value)}
                            placeholder="e.g. 5.25"
                            className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
                        <input
                          id="manual-date"
                          type="date"
                          value={manualDate}
                          onChange={e => setManualDate(e.target.value)}
                          className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Description (optional)</label>
                        <input
                          id="manual-desc"
                          type="text"
                          value={manualDesc}
                          onChange={e => setManualDesc(e.target.value)}
                          placeholder="e.g. Q1 diesel fleet emissions"
                          className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-1">
                        <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetManualForm(); }}>
                          Cancel
                        </Button>
                        <Button
                          id="manual-submit-btn"
                          type="submit"
                          disabled={manualTransactionMutation.isPending}
                        >
                          {manualTransactionMutation.isPending ? 'Saving…' : 'Save Transaction'}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
