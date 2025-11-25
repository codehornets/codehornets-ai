import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, DollarSign, TrendingUp, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Deals() {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    name: '', client_id: '', value: '', stage: 'discovery', description: '', expected_close_date: ''
  });
  const queryClient = useQueryClient();

  const { data: deals = [] } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const response = await client.get('/api/crm/deals');
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

  const createMutation = useMutation({
    mutationFn: (data) => client.post('/api/crm/deals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setCreateModalOpen(false);
      setFormData({ name: '', client_id: '', value: '', stage: 'discovery', description: '', expected_close_date: '' });
      toast.success('Deal created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => client.patch(`/api/crm/deals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal updated');
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }) => client.patch(`/api/crm/deals/${id}`, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/api/crm/deals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal deleted');
    },
  });

  const stages = [
    { id: 'discovery', label: 'Discovery', color: 'from-blue-500 to-cyan-500' },
    { id: 'proposal', label: 'Proposal', color: 'from-purple-500 to-pink-500' },
    { id: 'negotiation', label: 'Negotiation', color: 'from-orange-500 to-red-500' },
    { id: 'closed_won', label: 'Closed Won', color: 'from-green-500 to-emerald-500' },
    { id: 'closed_lost', label: 'Closed Lost', color: 'from-slate-500 to-slate-700' },
  ];

  const totalValue = deals.filter(d => d.stage !== 'closed_lost').reduce((sum, d) => sum + (d.value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'closed_won');
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    const currentStage = e.dataTransfer.getData('currentStage');

    if (currentStage !== targetStage) {
      updateStageMutation.mutate({ id: dealId, stage: targetStage });
      toast.success(`Deal moved to ${targetStage.replace('_', ' ')}`);
    }
  };

  const handleEditDeal = (deal) => {
    setEditingDeal(deal);
    setFormData({
      name: deal.name,
      client_id: deal.client_id || '',
      value: deal.value?.toString() || '',
      stage: deal.stage,
      description: deal.description || '',
      expected_close_date: deal.expected_close_date || ''
    });
    setCreateModalOpen(true);
  };

  const handleDeleteDeal = (dealId) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      deleteMutation.mutate(dealId);
    }
  };

  const handleSaveDeal = () => {
    const dealData = { ...formData, value: parseFloat(formData.value) || 0 };

    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal.id, data: dealData });
    } else {
      createMutation.mutate(dealData);
    }

    setEditingDeal(null);
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    setEditingDeal(null);
    setFormData({ name: '', client_id: '', value: '', stage: 'discovery', description: '', expected_close_date: '' });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Deals Pipeline</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{deals.length} active deals</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">New Deal</span>
          <span className="md:hidden">New</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card className="bg-black/40 border-slate-800/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">${(totalValue / 1000).toFixed(1)}k</div>
        </Card>
        <Card className="bg-black/40 border-slate-800/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Won This Month</span>
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">${(wonValue / 1000).toFixed(1)}k</div>
        </Card>
        <Card className="bg-black/40 border-slate-800/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Win Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0}%
          </div>
        </Card>
      </div>

      {/* Pipeline Kanban */}
      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
        <div className="grid grid-cols-5 lg:grid-cols-5 gap-3 md:gap-4 min-w-max lg:min-w-0">
        {stages.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage.id);
          const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

          return (
            <div
              key={stage.id}
              className="space-y-3"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">{stage.label}</h3>
                <span className="text-slate-400 text-xs">
                  {stageDeals.length} • ${(stageValue / 1000).toFixed(0)}k
                </span>
              </div>
              <div className="space-y-2 min-h-[400px] p-2 rounded-lg border border-transparent hover:border-slate-700 transition-colors">
                {stageDeals.map((deal, index) => {
                  const client = clients.find(c => c.id === deal.client_id);
                  return (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('dealId', deal.id);
                        e.dataTransfer.setData('currentStage', deal.stage);
                      }}
                    >
                      <Card
                        className="bg-black/40 border-slate-800/50 p-4 hover:border-blue-500/30 transition-all cursor-move group relative"
                        onClick={() => navigate(createPageUrl('DealDetail') + `?id=${deal.id}`)}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(createPageUrl('DealDetail') + `?id=${deal.id}`);
                              }}
                              className="text-slate-300 focus:bg-slate-700 focus:text-white"
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDeal(deal);
                              }}
                              className="text-slate-300 focus:bg-slate-700 focus:text-white"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDeal(deal.id);
                              }}
                              className="text-red-400 focus:bg-slate-700 focus:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <h4 className="text-white font-medium text-sm mb-2 pr-8">{deal.name}</h4>
                        {client && (
                          <p className="text-slate-400 text-xs mb-2">{client.name}</p>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-400 font-medium">
                            ${(deal.value / 1000).toFixed(1)}k
                          </span>
                          {deal.expected_close_date && (
                            <span className="text-slate-500">
                              {new Date(deal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={createModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingDeal ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Deal Name</Label>
              <Input
                placeholder="e.g., Q1 Paid Ads Retainer"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={formData.client_id} onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Value ($)</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Close</Label>
                <Input
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_close_date: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={formData.stage} onValueChange={(v) => setFormData(prev => ({ ...prev, stage: v }))}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {stages.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Deal details..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} className="border-slate-700 text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button
              onClick={handleSaveDeal}
              disabled={!formData.name}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {editingDeal ? 'Update Deal' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}