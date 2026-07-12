import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, Filter, Loader2, Table as TableIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

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

  const { data: reportData, isLoading: isGenerating, refetch } = useQuery({
    queryKey: ['reportGenerate', reportType, deptId, dateRange],
    queryFn: async () => {
      const res = await api.get('/analytics/reports/generate', {
        params: {
          report_type: reportType,
          department_id: deptId,
          // We can expand start/end date parsing based on dateRange in a real prod app
        }
      });
      return res.data;
    },
    enabled: true // Auto load on first render or filter change
  });

  const handleExportPDF = () => {
    if (!reportData?.table_data || reportData.table_data.length === 0) return alert("No data to export");
    const doc = new jsPDF();
    doc.text(`${reportType} Report`, 14, 15);
    const tableColumn = Object.keys(reportData.table_data[0]);
    const tableRows = reportData.table_data.map((row: any) => Object.values(row).map(v => String(v)));
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`${reportType.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  const handleExportExcel = () => {
    if (!reportData?.table_data || reportData.table_data.length === 0) return alert("No data to export");
    const worksheet = XLSX.utils.json_to_sheet(reportData.table_data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${reportType.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
  };

  const handleExportCSV = () => {
    if (!reportData?.table_data || reportData.table_data.length === 0) return alert("No data to export");
    const csv = Papa.unparse(reportData.table_data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${reportType.replace(/[^a-z0-9]/gi, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChartKeys = () => {
    if (!reportData?.chart_data || reportData.chart_data.length === 0) return [];
    return Object.keys(reportData.chart_data[0]).filter(k => k !== 'name');
  };

  const chartKeys = getChartKeys();

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
                <option>All Time</option>
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
              <Button className="w-full gap-2" variant="outline" onClick={() => refetch()} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizations */}
      {reportData?.chart_data && reportData.chart_data.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>{reportType} - Visual Summary</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={reportData.chart_data}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} />
                 <YAxis axisLine={false} tickLine={false} />
                 <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: 'none' }}
                    itemStyle={{ color: '#fff' }}
                 />
                 <Legend />
                 {chartKeys.map((key, index) => {
                   const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];
                   return (
                     <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
                   );
                 })}
               </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Export Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass flex flex-col items-center justify-center p-8 hover:bg-accent/10 transition-colors cursor-pointer" onClick={handleExportPDF}>
          <FileDown className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="font-bold text-lg">Export PDF</h3>
          <p className="text-sm text-muted-foreground mt-2 text-center">Standard formatted report for stakeholders and board members.</p>
        </Card>
        
        <Card className="glass flex flex-col items-center justify-center p-8 hover:bg-accent/10 transition-colors cursor-pointer" onClick={handleExportExcel}>
          <FileDown className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="font-bold text-lg">Export Excel</h3>
          <p className="text-sm text-muted-foreground mt-2 text-center">Raw data with pre-configured pivot tables and formulas.</p>
        </Card>

        <Card className="glass flex flex-col items-center justify-center p-8 hover:bg-accent/10 transition-colors cursor-pointer" onClick={handleExportCSV}>
          <FileDown className="w-12 h-12 text-blue-500 mb-4" />
          <h3 className="font-bold text-lg">Export CSV</h3>
          <p className="text-sm text-muted-foreground mt-2 text-center">Flat data extract for importing into BI tools like Tableau or PowerBI.</p>
        </Card>
      </div>

      {/* Data Table */}
      {reportData?.table_data && reportData.table_data.length > 0 && (
         <Card className="glass">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <TableIcon className="w-5 h-5" />
                Raw Data Table
             </CardTitle>
           </CardHeader>
           <CardContent className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    {Object.keys(reportData.table_data[0]).map(key => (
                      <th key={key} className="px-6 py-3">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.table_data.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                       {Object.values(row).map((val: any, j: number) => (
                         <td key={j} className="px-6 py-4">{val === null ? 'N/A' : String(val)}</td>
                       ))}
                    </tr>
                  ))}
                </tbody>
              </table>
           </CardContent>
         </Card>
      )}

    </div>
  );
}
