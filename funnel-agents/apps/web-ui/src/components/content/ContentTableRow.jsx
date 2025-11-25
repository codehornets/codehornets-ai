import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Image as ImageIcon, Video, Mail, File,
  Zap, Eye, Copy, Send, Archive, MoreHorizontal, Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import apiClient from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function ContentTableRow({ item, client, campaigns = [] }) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const typeIcons = {
    blog_post: FileText,
    social_post: ImageIcon,
    email: Mail,
    landing_page: FileText,
    ad_creative: ImageIcon,
    video: Video,
  };

  const statusStyles = {
    brief: { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' },
    draft: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
    review: { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' },
    approved: { bg: '#D1FAE5', text: '#059669', border: '#BBF7D0' },
    published: { bg: '#D1FAE5', text: '#059669', border: '#BBF7D0' },
    archived: { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' },
  };

  const channelMap = {
    blog: 'Blog',
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    facebook: 'Facebook',
    instagram: 'Instagram',
    email: 'Email',
    website: 'Website',
    google_ads: 'Google Ads',
    meta_ads: 'Meta Ads',
  };

  const Icon = typeIcons[item.type] || File;
  const statusStyle = statusStyles[item.status] || statusStyles.brief;
  const relatedCampaigns = campaigns.filter(c => c.id === item.campaign_id);
  const isAIGenerated = item.agent_id; // Check if created by an agent

  // Mutations
  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const duplicateData = {
        ...item,
        title: `${item.title} (Copy)`,
        status: 'draft',
      };
      delete duplicateData.id;
      delete duplicateData.created_date;
      delete duplicateData.updated_date;
      return apiClient.post('/api/content', duplicateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      toast.success('Content duplicated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to duplicate content: ${error.message}`);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiClient.patch(`/api/content/${item.id}`, { status: 'archived' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      toast.success('Content archived');
    },
    onError: (error) => {
      toast.error(`Failed to archive content: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/content/${item.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      toast.success('Content deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete content: ${error.message}`);
    },
  });

  // Handlers
  const handleRowClick = (e) => {
    // Don't navigate if clicking on dropdown or buttons
    if (e.target.closest('button')) return;
    navigate(createPageUrl('ContentDetail') + `?id=${item.id}`);
  };

  const handlePreview = () => {
    toast.info('Preview feature coming soon');
    // TODO: Implement preview modal or navigate to preview page
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    duplicateMutation.mutate();
  };

  const handleSendToCampaign = () => {
    toast.info('Send to campaign feature coming soon');
    // TODO: Implement send to campaign modal
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    archiveMutation.mutate();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this content?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <TableRow
      className="cursor-pointer transition-all"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: isHovered ? 'var(--bg-surface-hover)' : 'transparent'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRowClick}
    >
      {/* Title */}
      <TableCell>
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" 
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {item.title}
              </span>
              {isAIGenerated && (
                <Zap className="w-3 h-3 text-purple-400 flex-shrink-0" title="AI-generated" />
              )}
            </div>
            {item.brief && (
              <div className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {item.brief}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      {/* Type */}
      <TableCell>
        <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
          {item.type.replace('_', ' ')}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell>
        <span 
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: statusStyle.bg,
            color: statusStyle.text,
            border: `1px solid ${statusStyle.border}`
          }}
        >
          {item.status}
        </span>
      </TableCell>

      {/* Channel */}
      <TableCell>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {channelMap[item.channel] || item.channel || '—'}
        </span>
      </TableCell>

      {/* Client */}
      <TableCell>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {client?.name || '—'}
        </span>
      </TableCell>

      {/* Campaign(s) */}
      <TableCell>
        {relatedCampaigns.length > 0 ? (
          <div className="flex items-center gap-1 flex-wrap">
            {relatedCampaigns.slice(0, 2).map(campaign => (
              <Badge 
                key={campaign.id}
                variant="outline" 
                className="text-xs px-2 py-0.5"
                style={{ 
                  borderColor: 'var(--border-medium)',
                  color: 'var(--text-secondary)'
                }}
              >
                {campaign.name}
              </Badge>
            ))}
            {relatedCampaigns.length > 2 && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                +{relatedCampaigns.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </TableCell>

      {/* Owner */}
      <TableCell>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {item.created_by || 'Unknown'}
        </span>
      </TableCell>

      {/* Last Updated */}
      <TableCell>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {item.updated_date 
            ? formatDistanceToNow(new Date(item.updated_date), { addSuffix: true })
            : 'Just now'
          }
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell>
        {isHovered && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                style={{ color: 'var(--text-muted)' }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)'
              }}
            >
              <DropdownMenuItem
                onClick={() => navigate(createPageUrl('ContentDetail') + `?id=${item.id}`)}
                className="focus:bg-[var(--bg-surface-hover)] cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handlePreview}
                className="focus:bg-[var(--bg-surface-hover)] cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDuplicate}
                disabled={duplicateMutation.isPending}
                className="focus:bg-[var(--bg-surface-hover)] cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Copy className="w-4 h-4 mr-2" />
                {duplicateMutation.isPending ? 'Duplicating...' : 'Duplicate'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSendToCampaign}
                className="focus:bg-[var(--bg-surface-hover)] cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Send className="w-4 h-4 mr-2" />
                Send to Campaign
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleArchive}
                disabled={archiveMutation.isPending}
                className="focus:bg-[var(--bg-surface-hover)] cursor-pointer"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Archive className="w-4 h-4 mr-2" />
                {archiveMutation.isPending ? 'Archiving...' : 'Archive'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="focus:bg-[var(--bg-surface-hover)] cursor-pointer text-red-600"
                style={{ color: '#ef4444' }}
              >
                <Archive className="w-4 h-4 mr-2" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}