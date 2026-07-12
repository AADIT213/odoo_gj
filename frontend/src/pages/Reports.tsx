import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { FileDown, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function Reports() {
  const [reportType, setReportType] = useState('ESG Summary');
  const [dateRange, setDateRange] = useState('Last 12 Months');
  const [deptId, setDeptId] = useState('all');

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data;
    }
  });

  const handleExport = async (format: string) => {
    alert(`Exporting ${reportType} as ${format}... (API Integration Pending)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option>ESG Summary</option>
                <option>Environmental (Carbon & Resources)</option>
                <option>Social (CSR & Diversity)</option>
                <option>Governance (Audits & Compliance)</option>
                <option>Department Breakdown</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option>Last 30 Days</option>
                <option>Last Quarter</option>
                <option>Last 12 Months</option>
                <option>Year to Date</option>
                <option>Custom Range</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department Filter</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button className="w-full gap-2" variant="outline">
                <Filter className="w-4 h-4" /> Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass flex flex-col items-center justify-center p-8 hover:bg-accent/10 transition-colors cursor-pointer" onClick={() => handleExport('PDF')}>
          <FileDown className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="font-bold text-lg">Export PDF</h3>
          <p className="text-sm text-muted-foreground mt-2 text-center">Standard formatted report for stakeholders and board members.</p>
        </Card>
        
        <Card className="glass flex flex-col items-center justify-center p-8 hover:bg-accent/10 transition-colors cursor-pointer" onClick={() => handleExport('Excel')}>
          <FileDown className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="font-bold text-lg">Export Excel</h3>
          <p className="text-sm text-muted-foreground mt-2 text-center">Raw data with pre-configured pivot tables and formulas.</p>
        </Card>

        <Card className="glass flex flex-col items-center justify-center p-8 hover:bg-accent/10 transition-colors cursor-pointer" onClick={() => handleExport('CSV')}>
          <FileDown className="w-12 h-12 text-blue-500 mb-4" />
          <h3 className="font-bold text-lg">Export CSV</h3>
          <p className="text-sm text-muted-foreground mt-2 text-center">Flat data extract for importing into BI tools like Tableau or PowerBI.</p>
        </Card>
      </div>
    </div>
  );
}
