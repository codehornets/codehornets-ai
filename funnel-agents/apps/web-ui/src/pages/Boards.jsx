import { useState } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Presentation, Search, MoreVertical, Trash2, Link2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

export default function Boards() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'global',
    client_id: '',
    campaign_id: '',
    task_id: '',
  });

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: () => client.entities.Board.list('-updated_date'),
    initialData: [],
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => client.entities.Workspace.list(),
    initialData: [],
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => client.entities.Campaign.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => client.entities.Board.create({
      ...data,
      excalidraw_data: { elements: [], appState: {}, files: {} },
    }),
    onSuccess: (newBoard) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setCreateModalOpen(false);
      setFormData({ name: '', description: '', type: 'global', client_id: '', campaign_id: '', task_id: '' });
      navigate(createPageUrl('BoardDetail') + `?id=${newBoard.id}`);
      toast.success('Board created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.entities.Board.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Board deleted');
    },
  });

  const filteredBoards = boards.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || b.type === filterType;
    return matchesSearch && matchesType;
  });

  const typeColors = {
    global: 'bg-slate-500/20 text-slate-400',
    client: 'bg-blue-500/20 text-blue-400',
    campaign: 'bg-purple-500/20 text-purple-400',
    task: 'bg-green-500/20 text-green-400',
  };

  const getLinkedName = (board) => {
    if (board.type === 'client') {
      const workspace = workspaces.find(w => w.id === board.client_id);
      return workspace?.name;
    }
    if (board.type === 'campaign') {
      const campaign = campaigns.find(c => c.id === board.campaign_id);
      return campaign?.name;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Boards</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Collaborative whiteboards for planning, brainstorming, and visual thinking
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Board
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-800/50 border-slate-700 text-white">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="global">Global</SelectItem>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="campaign">Campaign</SelectItem>
            <SelectItem value="task">Task</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Boards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredBoards.length === 0 ? (
        <Card className="p-12 text-center" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <Presentation className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {searchQuery ? 'No boards found' : 'No boards yet'}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            {searchQuery ? 'Try adjusting your search' : 'Create your first whiteboard to start visualizing ideas'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Board
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBoards.map((board, idx) => {
            const linkedName = getLinkedName(board);
            return (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card 
                  className="group cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden"
                  onClick={() => navigate(createPageUrl('BoardDetail') + `?id=${board.id}`)}
                  style={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-subtle)' 
                  }}
                >
                  {/* Thumbnail */}
                  <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                    <Presentation className="w-12 h-12 text-slate-600" />
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 bg-slate-900/80 hover:bg-slate-900">
                            <MoreVertical className="w-4 h-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(board.id);
                            }}
                            className="text-red-400 focus:bg-slate-700 focus:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                        {board.name}
                      </h4>
                      <Badge className={`text-xs ml-2 flex-shrink-0 ${typeColors[board.type]}`}>
                        {board.type}
                      </Badge>
                    </div>

                    {board.description && (
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{board.description}</p>
                    )}

                    {linkedName && (
                      <div className="flex items-center space-x-1 mb-2">
                        <Link2 className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-500">{linkedName}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Updated {board.updated_date ? format(new Date(board.updated_date), 'MMM d') : 'recently'}</span>
                      {board.collaborators?.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{board.collaborators.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Board Name</Label>
              <Input
                placeholder="e.g., Product Launch Funnel"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="What's this board for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-slate-800/50 border-slate-700 text-white h-20"
              />
            </div>
            <div className="space-y-2">
              <Label>Link To (optional)</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v, client_id: '', campaign_id: '' })}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="global">Global (Standalone)</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type === 'client' && (
              <div className="space-y-2">
                <Label>Select Client</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Choose client" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {workspaces.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.type === 'campaign' && (
              <div className="space-y-2">
                <Label>Select Campaign</Label>
                <Select value={formData.campaign_id} onValueChange={(v) => setFormData({ ...formData, campaign_id: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Choose campaign" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {campaigns.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.name} className="bg-blue-600 hover:bg-blue-700">
              Create Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}