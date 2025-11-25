import { useState } from 'react';
import client from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Mail, Star, Trash2, Search, Paperclip, Reply, Inbox, Send, MailOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function EmailInbox() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('inbox');
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });
  const queryClient = useQueryClient();

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['emails'],
    queryFn: () => client.entities.Email.list('-created_date'),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => client.entities.Email.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.entities.Email.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast.success('Email deleted');
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data) => client.entities.Email.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast.success('Email sent');
      setComposeOpen(false);
      setReplyOpen(false);
      setEmailForm({ to: '', subject: '', body: '' });
    },
  });

  const categories = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'starred', label: 'Starred', icon: Star, filter: (e) => e.is_starred },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'unread', label: 'Unread', icon: MailOpen, filter: (e) => !e.is_read },
  ];

  const currentCategory = categories.find(c => c.id === categoryFilter);
  
  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.from_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = true;
    if (currentCategory?.filter) {
      matchesCategory = currentCategory.filter(email);
    } else {
      matchesCategory = email.category === categoryFilter;
    }
    
    return matchesSearch && matchesCategory;
  });

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      updateMutation.mutate({ id: email.id, data: { is_read: true } });
    }
  };

  const toggleStar = (email, e) => {
    e.stopPropagation();
    updateMutation.mutate({ id: email.id, data: { is_starred: !email.is_starred } });
  };

  const handleCompose = () => {
    setEmailForm({ to: '', subject: '', body: '' });
    setComposeOpen(true);
  };

  const handleReply = () => {
    setEmailForm({
      to: selectedEmail.from_email,
      subject: `Re: ${selectedEmail.subject}`,
      body: ''
    });
    setReplyOpen(true);
  };

  const handleSendEmail = () => {
    sendEmailMutation.mutate({
      from_email: 'me@example.com',
      from_name: 'Me',
      subject: emailForm.subject,
      body: emailForm.body,
      category: 'sent',
      is_read: true
    });
  };

  return (
    <div className="flex h-[calc(100vh-120px)] space-x-0">
      {/* Sidebar */}
      <div className="w-56 glassmorphism-light border-r border-slate-800/50 p-4 space-y-1">
        <Button onClick={handleCompose} className="w-full bg-blue-600 hover:bg-blue-700 mb-4">
          <Mail className="w-4 h-4 mr-2" />
          Compose
        </Button>
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryFilter(cat.id);
                setSelectedEmail(null);
              }}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4 mr-3" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Email List */}
      <div className="w-96 glassmorphism-light border-r border-slate-800/50 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800/50">
          <h2 className="text-lg font-semibold text-white mb-1">
            {currentCategory?.label}
          </h2>
          <p className="text-sm text-slate-400">
            {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="px-4 py-3 border-b border-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
              <Mail className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-sm">No emails found</p>
            </div>
          ) : (
            filteredEmails.map((email, index) => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleEmailClick(email)}
                className={`p-4 border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors ${
                  selectedEmail?.id === email.id ? 'bg-slate-800/50' : ''
                } ${!email.is_read ? 'bg-blue-500/5' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <button
                    onClick={(e) => toggleStar(email, e)}
                    className="mt-1 text-slate-400 hover:text-yellow-400"
                  >
                    <Star className={`w-4 h-4 ${email.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-medium text-sm ${!email.is_read ? 'text-white' : 'text-slate-300'}`}>
                        {email.from_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(email.created_date), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`text-sm mb-1 line-clamp-1 ${!email.is_read ? 'text-white font-medium' : 'text-slate-400'}`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">{email.body}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Email Detail Panel */}
      <div className="flex-1 glassmorphism-light overflow-y-auto">
        {!selectedEmail ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Mail className="w-24 h-24 mb-4 opacity-20" />
            <p className="text-sm">Select an email to read</p>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-slate-800/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white pr-8">
                  {selectedEmail.subject}
                </h2>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleStar(selectedEmail, { stopPropagation: () => {} })}
                    className="border-slate-700 text-slate-400 hover:text-yellow-400"
                  >
                    <Star className={`w-4 h-4 ${selectedEmail.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      deleteMutation.mutate(selectedEmail.id);
                      setSelectedEmail(null);
                    }}
                    className="border-slate-700 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {selectedEmail.from_name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{selectedEmail.from_name}</p>
                  <p className="text-slate-400 text-sm">{selectedEmail.from_email}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(selectedEmail.created_date).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <Button onClick={handleReply} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </Button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="text-slate-300 whitespace-pre-wrap mb-6">
                {selectedEmail.body}
              </div>

              {selectedEmail.attachments?.length > 0 && (
                <div className="glassmorphism-light border-slate-800/50 rounded-lg p-4">
                  <p className="text-white font-medium mb-3 flex items-center">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attachments ({selectedEmail.attachments.length})
                  </p>
                  <div className="space-y-2">
                    {selectedEmail.attachments.map((attachment, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                        <span className="text-slate-300 text-sm">{attachment.name || `Attachment ${idx + 1}`}</span>
                        <Button size="sm" variant="ghost" className="text-blue-400">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                placeholder="recipient@example.com"
                value={emailForm.to}
                onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Email subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message..."
                value={emailForm.body}
                onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white h-64"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setComposeOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">
                Cancel
              </Button>
              <Button onClick={handleSendEmail} disabled={!emailForm.subject || !emailForm.body} className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to {selectedEmail?.from_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                value={emailForm.to}
                disabled
                className="bg-slate-800/50 border-slate-700 text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={emailForm.subject}
                disabled
                className="bg-slate-800/50 border-slate-700 text-slate-400"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your reply..."
                value={emailForm.body}
                onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                className="bg-slate-800/50 border-slate-700 text-white h-64"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setReplyOpen(false)} className="border-slate-700 text-white hover:bg-slate-800">
                Cancel
              </Button>
              <Button onClick={handleSendEmail} disabled={!emailForm.body} className="bg-blue-600 hover:bg-blue-700">
                <Send className="w-4 h-4 mr-2" />
                Send Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}