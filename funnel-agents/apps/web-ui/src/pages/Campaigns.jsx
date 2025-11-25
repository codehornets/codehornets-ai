import { useState } from 'react';
import apiClient from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Target, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Campaigns() {
  const navigate = useNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '', status: 'draft', budget: '' });
  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await apiClient.get('/campaigns');
      return response.data || response;
    },
    initialData: [],
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await apiClient.get('/tasks');
      return response.data || response;
    },
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/campaigns', data);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setCreateModalOpen(false);
      toast.success('Campaign created');
      setNewCampaign({ name: '', description: '', status: 'draft', budget: '' });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create campaign');
    },
  });

  const getCampaignMetrics = (campaign) => {
    const campaignTasks = tasks.filter(t => t.campaign_id === campaign.id);
    const completed = campaignTasks.filter(t => t.status === 'completed').length;
    const progress = campaignTasks.length > 0 ? (completed / campaignTasks.length) * 100 : 0;
    return { tasks: campaignTasks.length, progress };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Campaigns</h1>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <Target className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No campaigns yet</h3>
          <p className="text-slate-400 mb-6">Create your first campaign to get started</p>
          <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign, i) => {
            const metrics = getCampaignMetrics(campaign);
            return (
              <motion.div key={campaign.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer" onClick={() => navigate(createPageUrl('CampaignDetail') + '?id=' + campaign.id)}>
                  <CardHeader>
                    <CardTitle className="text-white">{campaign.name}</CardTitle>
                    <Badge className="w-fit bg-green-500/20 text-green-400">{campaign.status}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Progress</span>
                          <span className="text-white">{metrics.progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={metrics.progress} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-slate-400">Tasks</div>
                          <div className="text-lg font-semibold text-white">{metrics.tasks}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">Budget</div>
                          <div className="text-lg font-semibold text-white">${campaign.budget || 0}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newCampaign.name} onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))} className="bg-slate-800/50 border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newCampaign.description} onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))} className="bg-slate-800/50 border-slate-700 text-white h-20" />
            </div>
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input type="number" value={newCampaign.budget} onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: e.target.value }))} className="bg-slate-800/50 border-slate-700 text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="border-slate-700">Cancel</Button>
            <Button onClick={() => newCampaign.name && createMutation.mutate(newCampaign)} className="bg-blue-600">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
