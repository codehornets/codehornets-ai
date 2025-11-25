import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LogCommunicationModal({ open, onOpenChange, client, contacts }) {
  const [formData, setFormData] = useState({
    type: 'call',
    contact_id: '',
    subject: '',
    body: '',
    direction: 'outbound',
    duration_minutes: '',
    scheduled_at: '',
    tags: '',
  });
  const queryClient = useQueryClient();

  const logCommMutation = useMutation({
    mutationFn: async (data) => {
      await client.entities.Communication.create({
        client_id: client.id,
        contact_id: data.contact_id || null,
        type: data.type,
        direction: data.direction,
        subject: data.subject,
        body: data.body,
        duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
        scheduled_at: data.scheduled_at || null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        status: 'sent',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', client.id] });
      toast.success('Communication logged successfully');
      onOpenChange(false);
      setFormData({
        type: 'call',
        contact_id: '',
        subject: '',
        body: '',
        direction: 'outbound',
        duration_minutes: '',
        scheduled_at: '',
        tags: '',
      });
    },
    onError: (error) => {
      toast.error('Failed to log communication: ' + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Communication for {client.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={formData.direction} onValueChange={(v) => setFormData(prev => ({ ...prev, direction: v }))}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contact (Optional)</Label>
            <Select value={formData.contact_id} onValueChange={(v) => setFormData(prev => ({ ...prev, contact_id: v }))}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {contacts.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input
              placeholder={formData.type === 'call' ? 'e.g., Q1 Strategy Call' : formData.type === 'meeting' ? 'e.g., Campaign Review Meeting' : 'Note title'}
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          {formData.type !== 'note' && (
            <div className="grid grid-cols-2 gap-4">
              {formData.type === 'call' && (
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              )}

              {formData.type === 'meeting' && (
                <div className="space-y-2">
                  <Label>Meeting Date/Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              )}

              {formData.type === 'meeting' && (
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                    className="bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes *</Label>
            <Textarea
              placeholder={formData.type === 'call' ? 'Call notes and key takeaways...' : formData.type === 'meeting' ? 'Meeting notes and action items...' : 'Your notes...'}
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              className="bg-slate-800/50 border-slate-700 text-white h-32"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              placeholder="e.g., follow-up, important, strategy"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={() => logCommMutation.mutate(formData)}
            disabled={!formData.subject || !formData.body || logCommMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {logCommMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging...
              </>
            ) : (
              'Log Communication'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}