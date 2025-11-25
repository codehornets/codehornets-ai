import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar, FileText, Plus, Paperclip, Clock, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import SendEmailModal from './SendEmailModal';
import LogCommunicationModal from './LogCommunicationModal';

export default function CommunicationHub({ client }) {
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [logCommOpen, setLogCommOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('email');
  const queryClient = useQueryClient();

  const { data: communications = [] } = useQuery({
    queryKey: ['communications', client.id],
    queryFn: () => client.entities.Communication.filter({ client_id: client.id }, '-created_date'),
    initialData: [],
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => client.entities.Contact.list(),
    initialData: [],
  });

  const clientContacts = contacts.filter(c => c.client_id === client.id);

  const typeIcons = {
    email: Mail,
    call: Phone,
    meeting: Calendar,
    note: FileText,
  };

  const typeColors = {
    email: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    call: 'bg-green-500/20 text-green-400 border-green-500/30',
    meeting: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    note: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const filteredComms = communications.filter(c => 
    selectedType === 'all' || c.type === selectedType
  );

  const stats = {
    emails: communications.filter(c => c.type === 'email').length,
    calls: communications.filter(c => c.type === 'call').length,
    meetings: communications.filter(c => c.type === 'meeting').length,
    notes: communications.filter(c => c.type === 'note').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Communication Hub
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {communications.length} total communications
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setSendEmailOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-initial"
          >
            <Mail className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Send Email</span>
            <span className="sm:hidden">Email</span>
          </Button>
          <Button 
            onClick={() => setLogCommOpen(true)}
            variant="outline"
            className="border-slate-700 text-white hover:bg-slate-800 flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Log Activity</span>
            <span className="sm:hidden">Log</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Emails</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.emails}</p>
            </div>
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
        </Card>
        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Calls</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.calls}</p>
            </div>
            <Phone className="w-5 h-5 text-green-400" />
          </div>
        </Card>
        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Meetings</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.meetings}</p>
            </div>
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
        </Card>
        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Notes</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{stats.notes}</p>
            </div>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="email">Emails</TabsTrigger>
          <TabsTrigger value="call">Calls</TabsTrigger>
          <TabsTrigger value="meeting">Meetings</TabsTrigger>
          <TabsTrigger value="note">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="mt-4">
          {/* Communications List */}
          {filteredComms.length === 0 ? (
            <Card className="p-8 text-center" style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-subtle)' 
            }}>
              <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                No {selectedType === 'all' ? 'communications' : selectedType + 's'} yet
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredComms.map((comm, index) => {
                const Icon = typeIcons[comm.type];
                const contact = contacts.find(c => c.id === comm.contact_id);
                
                return (
                  <motion.div
                    key={comm.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="p-4 hover:shadow-md transition-all cursor-pointer"
                      style={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-subtle)' 
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${typeColors[comm.type]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {comm.subject}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {comm.direction && (
                                <Badge variant="outline" className="text-xs">
                                  {comm.direction}
                                </Badge>
                              )}
                              {comm.status && comm.type === 'email' && (
                                <Badge variant="outline" className="text-xs">
                                  {comm.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                            {contact && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {contact.full_name}
                              </div>
                            )}
                            {comm.recipient_email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {comm.recipient_email}
                              </div>
                            )}
                            {comm.duration_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {comm.duration_minutes}m
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(comm.created_date), { addSuffix: true })}
                            </div>
                          </div>

                          {comm.body && (
                            <p className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
                              {comm.body}
                            </p>
                          )}

                          {comm.attachments && comm.attachments.length > 0 && (
                            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                              <Paperclip className="w-3 h-3" />
                              {comm.attachments.length} attachment{comm.attachments.length > 1 ? 's' : ''}
                            </div>
                          )}

                          {comm.tags && comm.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {comm.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
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
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <SendEmailModal
        open={sendEmailOpen}
        onOpenChange={setSendEmailOpen}
        client={client}
        contacts={clientContacts}
      />

      <LogCommunicationModal
        open={logCommOpen}
        onOpenChange={setLogCommOpen}
        client={client}
        contacts={clientContacts}
      />
    </div>
  );
}