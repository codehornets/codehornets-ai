import { useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, DollarSign, Calendar, Loader2, Save, Trash2, TrendingUp } from 'lucide-react';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { useState } from 'react';

export default function DealDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const dealId = urlParams.get('id');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      const response = await client.get(`/api/crm/deals/${dealId}`);
      return response;
    },
    enabled: !!dealId,
    onSuccess: (data) => {
      setFormData(data);
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await client.get('/api/workspaces');
      return Array.isArray(response) ? response : response.data || [];
    },
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => client.patch(`/api/crm/deals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal updated');
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/api/crm/deals/${id}`),
    onSuccess: () => {
      toast.success('Deal deleted');
      navigate(createPageUrl('Deals'));
    },
  });

  const handleSave = () => {
    const dealData = {
      ...formData,
      value: parseFloat(formData.value) || 0
    };
    updateMutation.mutate({ id: dealId, data: dealData });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this deal?')) {
      deleteMutation.mutate(dealId);
    }
  };

  const handleCancel = () => {
    setFormData(deal);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Deal not found</p>
        <Button
          onClick={() => navigate(createPageUrl('Deals'))}
          className="mt-4"
          variant="outline"
        >
          Back to Deals
        </Button>
      </div>
    );
  }

  const stages = [
    { id: 'discovery', label: 'Discovery', color: 'from-blue-500 to-cyan-500' },
    { id: 'proposal', label: 'Proposal', color: 'from-purple-500 to-pink-500' },
    { id: 'negotiation', label: 'Negotiation', color: 'from-orange-500 to-red-500' },
    { id: 'closed_won', label: 'Closed Won', color: 'from-green-500 to-emerald-500' },
    { id: 'closed_lost', label: 'Closed Lost', color: 'from-slate-500 to-slate-700' },
  ];

  const currentStage = stages.find(s => s.id === deal.stage) || stages[0];
  const clientWorkspace = clients.find(c => c.id === deal.client_id);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(createPageUrl('Deals'))}
        className="text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Deals
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${currentStage.color} flex items-center justify-center`}>
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{deal.name}</h1>
            {clientWorkspace && (
              <p className="text-slate-400 text-lg mt-1">{clientWorkspace.name}</p>
            )}
            <div className="flex items-center space-x-3 mt-3">
              <Badge className={`bg-gradient-to-r ${currentStage.color} text-white`}>
                {currentStage.label}
              </Badge>
              <div className="flex items-center text-green-400 font-semibold">
                <DollarSign className="w-4 h-4" />
                {(deal.value / 1000).toFixed(1)}k
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={updateMutation.isLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
              >
                Edit Deal
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/40 border-slate-800/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Deal Value</span>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            ${(deal.value / 1000).toFixed(1)}k
          </div>
        </Card>
        <Card className="bg-black/40 border-slate-800/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Expected Close</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {deal.expected_close_date
              ? new Date(deal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Not set'}
          </div>
        </Card>
        <Card className="bg-black/40 border-slate-800/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Stage</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {currentStage.label}
          </div>
        </Card>
      </div>

      {/* Deal Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glassmorphism-light border-slate-800/50 p-6">
            <h3 className="text-white font-semibold mb-4">Deal Information</h3>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Deal Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Client</Label>
                  <Select
                    value={formData.client_id || ''}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}
                  >
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
                    <Label className="text-slate-300">Value ($)</Label>
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Expected Close Date</Label>
                    <Input
                      type="date"
                      value={formData.expected_close_date || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, expected_close_date: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Stage</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, stage: v }))}
                  >
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
                  <Label className="text-slate-300">Description</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white h-24"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {deal.description && (
                  <div>
                    <p className="text-slate-400 text-xs mb-2">Description</p>
                    <p className="text-white whitespace-pre-wrap">{deal.description}</p>
                  </div>
                )}
                {clientWorkspace && (
                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-slate-400 text-xs mb-2">Client</p>
                    <Button
                      variant="link"
                      className="text-blue-400 hover:text-blue-300 p-0"
                      onClick={() => navigate(createPageUrl('ClientWorkspace') + `?id=${clientWorkspace.id}`)}
                    >
                      {clientWorkspace.name}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Pipeline Progress */}
          <Card className="glassmorphism-light border-slate-800/50 p-6">
            <h3 className="text-white font-semibold mb-4">Pipeline Progress</h3>
            <div className="space-y-3">
              {stages.map((stage, index) => {
                const isActive = stage.id === deal.stage;
                const isPast = stages.findIndex(s => s.id === deal.stage) > index;
                return (
                  <div key={stage.id} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? `bg-gradient-to-r ${stage.color}` :
                      isPast ? 'bg-green-600' : 'bg-slate-700'
                    }`}>
                      {isPast && <span className="text-white">✓</span>}
                      {isActive && <span className="text-white font-bold">{index + 1}</span>}
                      {!isPast && !isActive && <span className="text-slate-400">{index + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <p className={isActive ? 'text-white font-semibold' : 'text-slate-400'}>
                        {stage.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glassmorphism-light border-slate-800/50 p-6">
            <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {clientWorkspace && (
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => navigate(createPageUrl('ClientWorkspace') + `?id=${clientWorkspace.id}`)}
                >
                  View Client Workspace
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => toast.info('Activity logging coming soon')}
              >
                Log Activity
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => toast.info('Document upload coming soon')}
              >
                Add Document
              </Button>
            </div>
          </Card>

          <Card className="glassmorphism-light border-slate-800/50 p-6">
            <h3 className="text-white font-semibold mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Created</p>
                <p className="text-white">
                  {deal.created_at ? new Date(deal.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Last Updated</p>
                <p className="text-white">
                  {deal.updated_at ? new Date(deal.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              {deal.expected_close_date && (
                <div>
                  <p className="text-slate-400">Days Until Close</p>
                  <p className="text-white">
                    {Math.ceil((new Date(deal.expected_close_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
