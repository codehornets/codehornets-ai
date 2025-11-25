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
import { ArrowLeft, Mail, Phone, Building2, Loader2, Save, Trash2 } from 'lucide-react';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ContactDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const contactId = urlParams.get('id');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const response = await client.get(`/api/crm/contacts/${contactId}`);
      return response;
    },
    enabled: !!contactId,
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
    mutationFn: ({ id, data }) => client.patch(`/api/crm/contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated');
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.delete(`/api/crm/contacts/${id}`),
    onSuccess: () => {
      toast.success('Contact deleted');
      navigate(createPageUrl('Contacts'));
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ id: contactId, data: formData });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate(contactId);
    }
  };

  const handleCancel = () => {
    setFormData(contact);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Contact not found</p>
        <Button
          onClick={() => navigate(createPageUrl('Contacts'))}
          className="mt-4"
          variant="outline"
        >
          Back to Contacts
        </Button>
      </div>
    );
  }

  const typeColors = {
    lead: 'bg-yellow-500/20 text-yellow-400',
    client: 'bg-green-500/20 text-green-400',
    partner: 'bg-blue-500/20 text-blue-400',
    other: 'bg-slate-500/20 text-slate-400',
  };

  const clientWorkspace = clients.find(c => c.id === contact.client_id);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(createPageUrl('Contacts'))}
        className="text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Contacts
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white text-xl font-semibold">
              {contact.full_name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{contact.full_name}</h1>
            {contact.job_title && (
              <p className="text-slate-400 text-lg mt-1">{contact.job_title}</p>
            )}
            {contact.company && (
              <p className="text-slate-500 mt-1">{contact.company}</p>
            )}
            <div className="flex items-center space-x-3 mt-3">
              <Badge className={typeColors[contact.type]}>
                {contact.type}
              </Badge>
              {clientWorkspace && (
                <Badge variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-300">
                  {clientWorkspace.name}
                </Badge>
              )}
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
                Edit Contact
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

      {/* Contact Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glassmorphism-light border-slate-800/50 p-6">
            <h3 className="text-white font-semibold mb-4">Contact Information</h3>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Full Name</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone</Label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Job Title</Label>
                    <Input
                      value={formData.job_title || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                      className="bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Company</Label>
                  <Input
                    value={formData.company || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
                    >
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
                    <Label className="text-slate-300">Client Workspace</Label>
                    <Select
                      value={formData.client_id || ''}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="">None</SelectItem>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Notes</Label>
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white h-24"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-slate-400 text-xs">Email</p>
                    <a href={`mailto:${contact.email}`} className="text-white hover:text-blue-400">
                      {contact.email}
                    </a>
                  </div>
                </div>
                {contact.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-slate-400 text-xs">Phone</p>
                      <p className="text-white">{contact.phone}</p>
                    </div>
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-slate-400 text-xs">Company</p>
                      <p className="text-white">{contact.company}</p>
                    </div>
                  </div>
                )}
                {contact.notes && (
                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-slate-400 text-xs mb-2">Notes</p>
                    <p className="text-white whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glassmorphism-light border-slate-800/50 p-6">
            <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => window.location.href = `mailto:${contact.email}`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              {contact.phone && (
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => window.location.href = `tel:${contact.phone}`}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Contact
                </Button>
              )}
              {clientWorkspace && (
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => navigate(createPageUrl('ClientWorkspace') + `?id=${clientWorkspace.id}`)}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  View Workspace
                </Button>
              )}
            </div>
          </Card>

          <Card className="glassmorphism-light border-slate-800/50 p-6">
            <h3 className="text-white font-semibold mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Created</p>
                <p className="text-white">
                  {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Last Updated</p>
                <p className="text-white">
                  {contact.updated_at ? new Date(contact.updated_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
