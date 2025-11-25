import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, FileText, Clock, CheckCircle2, Eye, ArrowUpDown, LayoutGrid, List, Sparkles, Upload, BookTemplate, Video, Image } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ContentStatCard from '../components/content/ContentStatCard';
import ContentTableRow from '../components/content/ContentTableRow';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ContentLibrary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [savedView, setSavedView] = useState('all');
  const [activeStatFilter, setActiveStatFilter] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', type: 'blog_post', channel: 'blog', status: 'brief',
    client_id: '', campaign_id: '', brief: ''
  });
  const queryClient = useQueryClient();

  const { data: content = [], isLoading } = useQuery({
    queryKey: ['content'],
    queryFn: async () => {
      const response = await client.get('/api/content');
      return Array.isArray(response) ? response : response.data || [];
    },
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await client.get('/api/workspaces');
      return Array.isArray(response) ? response : response.data || [];
    },
    initialData: [],
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await client.get('/api/campaigns');
      return Array.isArray(response) ? response : response.data || [];
    },
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => client.post('/api/content', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      setCreateModalOpen(false);
      setFormData({ title: '', type: 'blog_post', channel: 'blog', status: 'brief', client_id: '', campaign_id: '', brief: '' });
      toast.success('Content created');
    },
    onError: (error) => {
      toast.error(`Failed to create content: ${error.message}`);
    },
  });

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.brief?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesChannel = filterChannel === 'all' || item.channel === filterChannel;
    const matchesClient = filterClient === 'all' || item.client_id === filterClient;
    const matchesCampaign = filterCampaign === 'all' || item.campaign_id === filterCampaign;
    const matchesStatFilter = !activeStatFilter || item.status === activeStatFilter;
    return matchesSearch && matchesType && matchesStatus && matchesChannel && 
           matchesClient && matchesCampaign && matchesStatFilter;
  });

  const handleStatCardClick = (status) => {
    if (activeStatFilter === status) {
      setActiveStatFilter(null);
      setFilterStatus('all');
    } else {
      setActiveStatFilter(status);
      setFilterStatus(status);
    }
  };

  const handleSavedViewChange = (view) => {
    setSavedView(view);
    switch(view) {
      case 'published':
        setFilterStatus('published');
        break;
      case 'needs_review':
        setFilterStatus('review');
        break;
      case 'top_performers':
        setFilterStatus('published');
        // Would filter by performance metrics if available
        break;
      default:
        setFilterStatus('all');
    }
  };

  const statusColors = {
    brief: 'bg-slate-500/20 text-slate-400',
    draft: 'bg-yellow-500/20 text-yellow-400',
    review: 'bg-orange-500/20 text-orange-400',
    approved: 'bg-green-500/20 text-green-400',
    published: 'bg-blue-500/20 text-blue-400',
    archived: 'bg-slate-500/20 text-slate-400',
  };

  const typeIcons = {
    blog_post: FileText,
    social_post: Image,
    email: FileText,
    landing_page: FileText,
    ad_creative: Image,
    video: Video,
  };

  const stats = {
    total: content.length,
    draft: content.filter(c => c.status === 'draft').length,
    review: content.filter(c => c.status === 'review').length,
    published: content.filter(c => c.status === 'published').length,
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Content Library</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Central hub for all posts, emails, ads and assets used across campaigns.
          </p>
        </div>
        {content.length > 0 && (
          <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Content
          </Button>
        )}
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <ContentStatCard
          title="TOTAL"
          value={stats.total}
          subtitle="All content items used across campaigns"
          icon={FileText}
          trend={{ value: 12 }}
          onClick={() => handleStatCardClick(null)}
          active={activeStatFilter === null && filterStatus === 'all'}
        />
        <ContentStatCard
          title="DRAFT"
          value={stats.draft}
          subtitle="Work in progress"
          icon={Clock}
          trend={{ value: 8 }}
          borderColor="#FDE68A"
          textColor="#D97706"
          onClick={() => handleStatCardClick('draft')}
          active={activeStatFilter === 'draft'}
        />
        <ContentStatCard
          title="IN REVIEW"
          value={stats.review}
          subtitle="Awaiting approval"
          icon={Eye}
          trend={{ value: -3 }}
          borderColor="#BFDBFE"
          textColor="#2563EB"
          onClick={() => handleStatCardClick('review')}
          active={activeStatFilter === 'review'}
        />
        <ContentStatCard
          title="PUBLISHED"
          value={stats.published}
          subtitle="Live content"
          icon={CheckCircle2}
          trend={{ value: 15 }}
          borderColor="#BBF7D0"
          textColor="#059669"
          onClick={() => handleStatCardClick('published')}
          active={activeStatFilter === 'published'}
        />
      </div>

      {/* Enhanced Filters & View Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative min-w-0">
          <Input
            placeholder="Search titles, channels, campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32" style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)' }}>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="blog_post">Blog</SelectItem>
              <SelectItem value="social_post">Social</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="ad_creative">Ad</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterChannel} onValueChange={setFilterChannel}>
            <SelectTrigger className="w-32" style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)' }}>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="google_ads">Google Ads</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-32" style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)' }}>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={savedView} onValueChange={handleSavedViewChange}>
            <SelectTrigger className="w-44" style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue placeholder="Saved views" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-medium)' }}>
              <SelectItem value="all">All Content</SelectItem>
              <SelectItem value="published">All Published</SelectItem>
              <SelectItem value="needs_review">Needs Review</SelectItem>
              <SelectItem value="top_performers">Top Performers (30d)</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('table')}
              style={{ 
                backgroundColor: viewMode === 'table' ? 'var(--bg-card)' : 'transparent',
                color: 'var(--text-primary)'
              }}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode('card')}
              style={{ 
                backgroundColor: viewMode === 'card' ? 'var(--bg-card)' : 'transparent',
                color: 'var(--text-primary)'
              }}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredContent.length === 0 && content.length === 0 ? (
        <Card 
          className="p-10 mx-auto max-w-3xl"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px'
          }}
        >
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Create your first content item
              </h3>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Build your content library with posts, emails, and ads
              </p>
            </div>

            {/* Action Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div 
                className="p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:border-blue-500"
                style={{ borderColor: 'var(--border-subtle)' }}
                onClick={() => setCreateModalOpen(true)}
              >
                <Sparkles className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Draft a post with AI agents
                </p>
              </div>
              
              <div 
                className="p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:border-blue-500"
                style={{ borderColor: 'var(--border-subtle)' }}
                onClick={() => setCreateModalOpen(true)}
              >
                <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Plan content for a campaign
                </p>
              </div>
              
              <div
                className="p-4 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:border-blue-500"
                style={{ borderColor: 'var(--border-subtle)' }}
                onClick={() => toast.info('Import feature coming soon')}
              >
                <Upload className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Import existing content
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Content
              </Button>

              <div>
                <button
                  onClick={() => navigate('/templates')}
                  className="text-sm hover:underline"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <BookTemplate className="w-3 h-3 inline mr-1" />
                  Browse content templates
                </button>
              </div>
            </div>
          </div>
        </Card>
      ) : filteredContent.length === 0 ? (
        <Card 
          className="p-12 text-center"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px'
          }}
        >
          <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No content matches these filters
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Try adjusting your search or filters to find what you're looking for
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setFilterStatus('all');
              setFilterChannel('all');
              setFilterClient('all');
              setActiveStatFilter(null);
            }}
            style={{ 
              borderColor: 'var(--border-medium)',
              color: 'var(--text-primary)'
            }}
          >
            Clear all filters
          </Button>
        </Card>
      ) : (
        <Card 
          style={{ 
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <Table>
            <TableHeader>
              <TableRow style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <TableHead style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-[var(--text-primary)]">
                    <span>Title</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead style={{ color: 'var(--text-secondary)' }}>Type</TableHead>
                <TableHead style={{ color: 'var(--text-secondary)' }}>Status</TableHead>
                <TableHead style={{ color: 'var(--text-secondary)' }}>Channel</TableHead>
                <TableHead style={{ color: 'var(--text-secondary)' }}>Client</TableHead>
                <TableHead style={{ color: 'var(--text-secondary)' }}>Campaign(s)</TableHead>
                <TableHead style={{ color: 'var(--text-secondary)' }}>Owner</TableHead>
                <TableHead style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-[var(--text-primary)]">
                    <span>Last Updated</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead style={{ color: 'var(--text-secondary)', width: '48px' }}></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.map((item) => {
                const client = clients.find(c => c.id === item.client_id);
                return (
                  <ContentTableRow
                    key={item.id}
                    item={item}
                    client={client}
                    campaigns={campaigns}
                  />
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Content title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="blog_post">Blog Post</SelectItem>
                    <SelectItem value="social_post">Social Post</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="landing_page">Landing Page</SelectItem>
                    <SelectItem value="ad_creative">Ad Creative</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="brief">Brief</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client (Optional)</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Campaign (Optional)</Label>
                <Select value={formData.campaign_id} onValueChange={(v) => setFormData(prev => ({ ...prev, campaign_id: v }))}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Brief / Requirements</Label>
              <Textarea
                placeholder="What should this content achieve?"
                value={formData.brief}
                onChange={(e) => setFormData(prev => ({ ...prev, brief: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button 
              onClick={() => formData.title && createMutation.mutate(formData)} 
              disabled={!formData.title}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}