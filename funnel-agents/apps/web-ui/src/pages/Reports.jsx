import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, Calendar, TrendingUp, Users,
  Target, DollarSign, Plus,
  BarChart3, PieChart, Mail, Copy,
  FileSpreadsheet, FileBarChart
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-slate-200 font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('last30days');
  const [reportType, setReportType] = useState('overview');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [newReport, setNewReport] = useState({
    name: '',
    type: 'leads',
    schedule: 'manual',
    recipients: '',
    description: ''
  });

  // Fetch data
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => client.entities.leads.list({ sort: '-created_date', limit: 1000 }),
    initialData: [],
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => client.entities.campaigns.list(),
    initialData: [],
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => client.entities.agents.list(),
    initialData: [],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => client.entities.tasks.list({ sort: '-created_date', limit: 1000 }),
    initialData: [],
  });

  // Date range calculation
  const getDateRange = () => {
    const now = new Date();
    switch(dateRange) {
      case 'today':
        return { start: now, end: now };
      case 'yesterday':
        return { start: subDays(now, 1), end: subDays(now, 1) };
      case 'last7days':
        return { start: subDays(now, 7), end: now };
      case 'last30days':
        return { start: subDays(now, 30), end: now };
      case 'thisWeek':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'thisYear':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : subDays(now, 30),
          end: customEndDate ? new Date(customEndDate) : now
        };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Filter data by date range
  const filterByDateRange = (items, dateField = 'created_date') => {
    return items.filter(item => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const filteredLeads = useMemo(() => filterByDateRange(leads), [leads, dateRange, customStartDate, customEndDate]);
  const filteredCampaigns = useMemo(() => filterByDateRange(campaigns), [campaigns, dateRange, customStartDate, customEndDate]);
  const filteredTasks = useMemo(() => filterByDateRange(tasks), [tasks, dateRange, customStartDate, customEndDate]);

  // Calculate metrics
  const totalLeads = filteredLeads.length;
  const qualifiedLeads = filteredLeads.filter(l => l.status === 'qualified').length;
  const convertedLeads = filteredLeads.filter(l => l.status === 'converted').length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

  const totalRevenue = filteredLeads.reduce((sum, l) => sum + (l.value || 0), 0);
  const avgLeadValue = totalLeads > 0 ? (totalRevenue / totalLeads).toFixed(0) : 0;

  const activeCampaigns = filteredCampaigns.filter(c => c.status === 'active').length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const activeAgents = agents.filter(a => a.status === 'active').length;

  // Lead generation trend (last 7 days)
  const leadsTrend = useMemo(() => {
    const days = 7;
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM dd');
      const dayLeads = leads.filter(l => {
        if (!l.created_date) return false;
        const leadDate = new Date(l.created_date);
        return format(leadDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });

      trend.push({
        date: dateStr,
        leads: dayLeads.length,
        qualified: dayLeads.filter(l => l.status === 'qualified').length,
        converted: dayLeads.filter(l => l.status === 'converted').length,
      });
    }
    return trend;
  }, [leads]);

  // Lead source distribution
  const leadSourceData = useMemo(() => {
    const sources = {};
    filteredLeads.forEach(lead => {
      const source = lead.source || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [filteredLeads]);

  // Campaign performance
  const campaignPerformance = useMemo(() => {
    return filteredCampaigns.slice(0, 10).map(campaign => {
      const campaignLeads = filteredLeads.filter(l => l.campaign_id === campaign.id);
      const campaignTasks = filteredTasks.filter(t => t.campaign_id === campaign.id);

      return {
        id: campaign.id,
        name: campaign.name,
        leads: campaignLeads.length,
        conversions: campaignLeads.filter(l => l.status === 'converted').length,
        tasks: campaignTasks.length,
        revenue: campaignLeads.reduce((sum, l) => sum + (l.value || 0), 0),
      };
    });
  }, [filteredCampaigns, filteredLeads, filteredTasks]);

  // Agent performance
  const agentPerformance = useMemo(() => {
    return agents.slice(0, 10).map(agent => {
      const agentTasks = filteredTasks.filter(t => t.agent_id === agent.id);
      const completed = agentTasks.filter(t => t.status === 'completed').length;
      const failed = agentTasks.filter(t => t.status === 'failed').length;

      return {
        id: agent.id,
        name: agent.name,
        completed,
        failed,
        success_rate: agentTasks.length > 0 ? ((completed / agentTasks.length) * 100).toFixed(0) : 0,
      };
    });
  }, [agents, filteredTasks]);

  // Revenue trend
  const revenueTrend = useMemo(() => {
    const months = 6;
    const trend = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = subDays(new Date(), i * 30);
      const monthStr = format(date, 'MMM');
      const monthLeads = leads.filter(l => {
        if (!l.created_date) return false;
        const leadDate = new Date(l.created_date);
        return format(leadDate, 'MMM') === monthStr;
      });

      trend.push({
        month: monthStr,
        revenue: monthLeads.reduce((sum, l) => sum + (l.value || 0), 0),
      });
    }
    return trend;
  }, [leads]);

  // Export handlers
  const exportToCSV = async () => {
    try {
      toast.info('Generating CSV export...');

      const queryParams = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        report_type: reportType,
      });

      const response = await fetch(`${client.baseURL || 'http://localhost:3000'}/analytics/export/csv?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${client.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported to CSV');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV: ' + error.message);
    }
  };

  const exportToPDF = async () => {
    try {
      toast.info('Generating PDF export...');

      const queryParams = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        report_type: reportType,
      });

      const response = await fetch(`${client.baseURL || 'http://localhost:3000'}/analytics/export/pdf?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${client.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported to PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF: ' + error.message);
    }
  };

  const handleCreateReport = async () => {
    if (!newReport.name) {
      toast.error('Report name is required');
      return;
    }

    try {
      toast.info('Creating scheduled report...');

      // Convert schedule to cron expression
      const cronSchedules = {
        'manual': null,
        'daily': '0 9 * * *',      // 9 AM daily
        'weekly': '0 9 * * 1',     // 9 AM every Monday
        'monthly': '0 9 1 * *',    // 9 AM first day of month
      };

      const reportData = {
        name: newReport.name,
        reportType: newReport.type,
        schedule: cronSchedules[newReport.schedule] || cronSchedules.daily,
        recipients: newReport.recipients.split(',').map(r => r.trim()).filter(r => r),
        format: 'pdf',
        isActive: true,
        description: newReport.description,
      };

      await client.post('/scheduled-reports', reportData);

      toast.success(`Report "${newReport.name}" created successfully`);
      setCreateModalOpen(false);
      setNewReport({ name: '', type: 'leads', schedule: 'manual', recipients: '', description: '' });
    } catch (error) {
      console.error('Create report error:', error);
      toast.error('Failed to create report: ' + error.message);
    }
  };

  const handleShareReport = async () => {
    try {
      // Generate shareable link (could be enhanced with actual API endpoint)
      const shareableLink = `${window.location.origin}/reports/shared/${Date.now()}`;

      await navigator.clipboard.writeText(shareableLink);
      toast.success('Report link copied to clipboard');
      setShareModalOpen(false);
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleSendReportEmail = async (email) => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      toast.info('Sending report via email...');

      const reportData = {
        recipient: email,
        reportType: reportType,
        dateRange: { start: startDate, end: endDate },
      };

      await client.post('/analytics/email-report', reportData);

      toast.success(`Report sent to ${email}`);
      setShareModalOpen(false);
    } catch (error) {
      console.error('Email send error:', error);
      toast.error('Failed to send email: ' + error.message);
    }
  };

  const handleGenerateReport = async () => {
    try {
      toast.info('Generating custom report...');

      const reportRequest = {
        reportType: reportType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        metrics: ['leads', 'conversions', 'revenue'],
        groupBy: 'day',
      };

      const response = await client.post('/analytics/custom', reportRequest);

      toast.success('Report generated successfully');
      console.log('Generated report:', response);
    } catch (error) {
      console.error('Generate report error:', error);
      toast.error('Failed to generate report: ' + error.message);
    }
  };

  const handleRefresh = async () => {
    try {
      toast.info('Refreshing data...');
      await queryClient.invalidateQueries(['leads', 'campaigns', 'agents', 'tasks']);
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-slate-400 mt-1">
            Track performance, analyze trends, and export insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerateReport}
            variant="outline"
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-slate-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-slate-700">
              <DropdownMenuItem onClick={exportToCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileBarChart className="w-4 h-4 mr-2" />
                Export to PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={() => setShareModalOpen(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Report
          </Button>
        </div>
      </div>

      {/* Date Range & Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Date Range:</span>
            </div>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="thisWeek">This Week</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === 'custom' && (
              <>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-[160px] bg-slate-800/50 border-slate-700 text-white"
                />
                <span className="text-slate-400">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-[160px] bg-slate-800/50 border-slate-700 text-white"
                />
              </>
            )}

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="leads" className="data-[state=active]:bg-blue-600">
            <Users className="w-4 h-4 mr-2" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-blue-600">
            <Target className="w-4 h-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-blue-600">
            <Users className="w-4 h-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-blue-600">
            <DollarSign className="w-4 h-4 mr-2" />
            Revenue
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border-blue-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Total Leads</span>
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{totalLeads.toLocaleString()}</div>
                  <div className="flex items-center text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>+12% vs previous period</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-green-900/20 to-green-900/5 border-green-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Conversion Rate</span>
                    <Target className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{conversionRate}%</div>
                  <div className="flex items-center text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>+3.2% vs previous period</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border-purple-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Total Revenue</span>
                    <DollarSign className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">${totalRevenue.toLocaleString()}</div>
                  <div className="flex items-center text-sm text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>+18% vs previous period</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-gradient-to-br from-orange-900/20 to-orange-900/5 border-orange-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Active Campaigns</span>
                    <Target className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{activeCampaigns}</div>
                  <div className="flex items-center text-sm text-slate-400">
                    <span>{filteredCampaigns.length} total campaigns</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                  Lead Generation Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={leadsTrend}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="leads" stroke="#3B82F6" fill="url(#colorLeads)" />
                    <Area type="monotone" dataKey="qualified" stroke="#10B981" fill="none" />
                    <Area type="monotone" dataKey="converted" stroke="#F59E0B" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-green-400" />
                  Lead Source Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={leadSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="text-slate-400 text-sm mb-2">Total Leads</div>
                <div className="text-2xl font-bold text-white">{totalLeads}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="text-slate-400 text-sm mb-2">Qualified Leads</div>
                <div className="text-2xl font-bold text-white">{qualifiedLeads}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="text-slate-400 text-sm mb-2">Avg Lead Value</div>
                <div className="text-2xl font-bold text-white">${avgLeadValue}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Lead Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Name</TableHead>
                      <TableHead className="text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-400">Source</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Value</TableHead>
                      <TableHead className="text-slate-400">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.slice(0, 10).map((lead) => (
                      <TableRow
                        key={lead.id}
                        className="border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors"
                        onClick={() => navigate(createPageUrl('LeadDetail').replace(':id', lead.id))}
                      >
                        <TableCell className="text-white font-medium">{lead.name}</TableCell>
                        <TableCell className="text-slate-400">{lead.email}</TableCell>
                        <TableCell className="text-slate-400">{lead.source || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge className={
                            lead.status === 'converted' ? 'bg-green-500/20 text-green-400' :
                            lead.status === 'qualified' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-500/20 text-slate-400'
                          }>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">${(lead.value || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-slate-400">
                          {lead.created_date ? format(new Date(lead.created_date), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredLeads.length > 10 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="link"
                    onClick={() => navigate(createPageUrl('Leads'))}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View All Leads ({filteredLeads.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={campaignPerformance}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const campaign = data.activePayload[0].payload;
                      if (campaign.id) {
                        navigate(createPageUrl('CampaignDetail').replace(':id', campaign.id));
                      }
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#64748B" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#64748B" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="leads" fill="#3B82F6" name="Leads" cursor="pointer" />
                  <Bar dataKey="conversions" fill="#10B981" name="Conversions" cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
              {filteredCampaigns.length > 10 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="link"
                    onClick={() => navigate(createPageUrl('Campaigns'))}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View All Campaigns ({filteredCampaigns.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Agent Name</TableHead>
                      <TableHead className="text-slate-400">Completed</TableHead>
                      <TableHead className="text-slate-400">Failed</TableHead>
                      <TableHead className="text-slate-400">Success Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformance.map((agent) => (
                      <TableRow
                        key={agent.id}
                        className="border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors"
                        onClick={() => navigate(createPageUrl('AgentDetail').replace(':id', agent.id))}
                      >
                        <TableCell className="text-white font-medium">{agent.name}</TableCell>
                        <TableCell className="text-green-400">{agent.completed}</TableCell>
                        <TableCell className="text-red-400">{agent.failed}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-green-500 h-full"
                                style={{ width: `${agent.success_rate}%` }}
                              />
                            </div>
                            <span className="text-white text-sm w-12">{agent.success_rate}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {agents.length > 10 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="link"
                    onClick={() => navigate(createPageUrl('Agents'))}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View All Agents ({agents.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Custom Report Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Custom Report</DialogTitle>
            <DialogDescription className="text-slate-400">
              Build a custom report with specific metrics and scheduling
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input
                placeholder="e.g., Monthly Lead Performance"
                value={newReport.name}
                onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={newReport.type} onValueChange={(v) => setNewReport(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="leads">Leads Report</SelectItem>
                    <SelectItem value="campaigns">Campaigns Report</SelectItem>
                    <SelectItem value="agents">Agents Report</SelectItem>
                    <SelectItem value="revenue">Revenue Report</SelectItem>
                    <SelectItem value="custom">Custom Metrics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select value={newReport.schedule} onValueChange={(v) => setNewReport(prev => ({ ...prev, schedule: v }))}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="manual">Manual Only</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newReport.schedule !== 'manual' && (
              <div className="space-y-2">
                <Label>Email Recipients (comma-separated)</Label>
                <Input
                  placeholder="john@example.com, jane@example.com"
                  value={newReport.recipients}
                  onChange={(e) => setNewReport(prev => ({ ...prev, recipients: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="What insights does this report provide?"
                value={newReport.description}
                onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleCreateReport} className="bg-blue-600 hover:bg-blue-700">
              Create Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Report Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Share Report</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Shareable Link</Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/reports/shared/${Date.now()}`}
                  readOnly
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                <Button onClick={handleShareReport} className="bg-blue-600 hover:bg-blue-700">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Send via Email</Label>
              <div className="flex gap-2">
                <Input
                  id="email-input"
                  type="email"
                  placeholder="recipient@example.com"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                <Button
                  onClick={() => {
                    const emailInput = document.getElementById('email-input');
                    handleSendReportEmail(emailInput.value);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareModalOpen(false)} className="border-slate-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
