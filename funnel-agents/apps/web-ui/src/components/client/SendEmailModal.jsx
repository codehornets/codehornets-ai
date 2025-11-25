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
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SendEmailModal({ open, onOpenChange, client, contacts }) {
  const [formData, setFormData] = useState({
    contact_id: '',
    recipient_email: '',
    subject: '',
    body: '',
    cc_emails: '',
    attachments: [],
  });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      // Create communication record
      await client.entities.Communication.create({
        client_id: client.id,
        contact_id: data.contact_id || null,
        type: 'email',
        direction: 'outbound',
        subject: data.subject,
        body: data.body,
        recipient_email: data.recipient_email,
        cc_emails: data.cc_emails ? data.cc_emails.split(',').map(e => e.trim()) : [],
        attachments: data.attachments,
        status: 'sent',
      });

      // Send actual email using Core.SendEmail integration
      await client.integrations.Core.SendEmail({
        to: data.recipient_email,
        subject: data.subject,
        body: data.body,
        from_name: client.name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', client.id] });
      toast.success('Email sent successfully');
      onOpenChange(false);
      setFormData({
        contact_id: '',
        recipient_email: '',
        subject: '',
        body: '',
        cc_emails: '',
        attachments: [],
      });
    },
    onError: (error) => {
      toast.error('Failed to send email: ' + error.message);
    },
  });

  const handleContactSelect = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    setFormData(prev => ({
      ...prev,
      contact_id: contactId,
      recipient_email: contact?.email || '',
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await client.integrations.Core.UploadFile({ file });
          return {
            name: file.name,
            url: file_url,
            size: file.size,
          };
        })
      );
      
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedFiles],
      }));
      toast.success(`${files.length} file(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email to {client.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact (Optional)</Label>
              <Select value={formData.contact_id} onValueChange={handleContactSelect}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {contacts.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recipient Email *</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.recipient_email}
                onChange={(e) => setFormData(prev => ({ ...prev, recipient_email: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>CC (comma-separated)</Label>
            <Input
              placeholder="email1@example.com, email2@example.com"
              value={formData.cc_emails}
              onChange={(e) => setFormData(prev => ({ ...prev, cc_emails: e.target.value }))}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input
              placeholder="Email subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="bg-slate-800/50 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea
              placeholder="Write your email message here..."
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              className="bg-slate-800/50 border-slate-700 text-white h-48"
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-400" />
                ) : (
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                )}
                <p className="text-sm text-slate-400">
                  {uploading ? 'Uploading...' : 'Click to upload files or drag and drop'}
                </p>
              </label>
            </div>

            {formData.attachments.length > 0 && (
              <div className="space-y-2 mt-3">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(index)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
            onClick={() => sendEmailMutation.mutate(formData)}
            disabled={!formData.recipient_email || !formData.subject || !formData.body || sendEmailMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sendEmailMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Email'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}