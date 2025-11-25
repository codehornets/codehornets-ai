import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Mail, Phone, Building2, MoreVertical, Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Contacts() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', job_title: '', company: '',
    client_id: '', type: 'lead', notes: ''
  });
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await client.get('/api/crm/contacts');
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
    mutationFn: (data) => client.post('/api/crm/contacts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setCreateModalOpen(false);
      setFormData({ full_name: '', email: '', phone: '', job_title: '', company: '', client_id: '', type: 'lead', notes: '' });
      toast.success('Contact created');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => client.patch(`/api/crm/contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/api/crm/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
    },
  });

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || contact.type === filterType;
    return matchesSearch && matchesType;
  });

  const typeColors = {
    lead: 'bg-yellow-500/20 text-yellow-400',
    client: 'bg-green-500/20 text-green-400',
    partner: 'bg-blue-500/20 text-blue-400',
    other: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Contacts</h1>
          <p className="text-slate-400 mt-1 text-sm">{contacts.length} total contacts</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Add Contact</span>
          <span className="md:hidden">Add</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" style={{ color: 'var(--text-muted)' }} />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48" style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-medium)'
          }}>
            <SelectItem value="all" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>All Types</SelectItem>
            <SelectItem value="lead" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>Leads</SelectItem>
            <SelectItem value="client" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>Clients</SelectItem>
            <SelectItem value="partner" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>Partners</SelectItem>
            <SelectItem value="other" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contacts List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card className="glassmorphism-light border-slate-800/50 p-12 text-center">
          <p className="text-slate-400">No contacts found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filteredContacts.map((contact, index) => {
            const client = clients.find(c => c.id === contact.client_id);
            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="glassmorphism-light border-slate-800/50 p-5 hover:border-blue-500/30 transition-all group cursor-pointer"
                  onClick={() => navigate(createPageUrl('ContactDetail') + `?id=${contact.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {contact.full_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{contact.full_name}</h3>
                        {contact.job_title && (
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{contact.job_title}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(createPageUrl('ContactDetail') + `?id=${contact.id}`);
                          }}
                          className="text-slate-300 focus:bg-slate-700 focus:text-white"
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this contact?')) {
                              deleteMutation.mutate(contact.id);
                            }
                          }}
                          className="text-red-400 focus:bg-slate-700 focus:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-3">
                    {contact.company && (
                      <div className="flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Building2 className="w-3.5 h-3.5 mr-2" />
                        {contact.company}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-slate-400">
                      <Mail className="w-3.5 h-3.5 mr-2" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-400">
                        {contact.email}
                      </a>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center text-sm text-slate-400">
                        <Phone className="w-3.5 h-3.5 mr-2" />
                        {contact.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className={typeColors[contact.type]}>
                      {contact.type}
                    </Badge>
                    {client && (
                      <span className="text-xs text-slate-500">{client.name}</span>
                    )}
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
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  placeholder="Marketing Director"
                  value={formData.job_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                placeholder="Acme Corp"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
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
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Internal notes about this contact..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button 
              onClick={() => formData.full_name && formData.email && createMutation.mutate(formData)} 
              disabled={!formData.full_name || !formData.email}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}