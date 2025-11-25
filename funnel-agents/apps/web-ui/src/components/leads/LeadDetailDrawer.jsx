import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, Linkedin, Globe, Bot, CheckCircle2, Loader2, Building2, Trash2 } from 'lucide-react';
import AISummaryCard from './AISummaryCard';
import LeadTimeline from './LeadTimeline';
import LeadScoreBreakdown from './LeadScoreBreakdown';
import ConvertToClientModal from './ConvertToClientModal';
import { useState } from 'react';

export default function LeadDetailDrawer({ lead, open, onOpenChange, activities, onStatusChange, onQualify, onGenerateOutreach, onConvert, onDelete }) {
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#0A0A0A] border-slate-800 text-white w-full sm:max-w-2xl overflow-y-auto p-0">
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-slate-800 p-6 z-10">
          <SheetHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    {lead.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <SheetTitle className="text-white text-2xl">{lead.name}</SheetTitle>
                  <p className="text-slate-400 text-base mt-1">{lead.company}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Select value={lead.status} onValueChange={onStatusChange}>
                      <SelectTrigger className="w-44 bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="enriched">Enriched</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="in_conversation">In Conversation</SelectItem>
                        <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="disqualified">Disqualified</SelectItem>
                      </SelectContent>
                    </Select>
                    {lead.source && (
                      <Badge variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-300 h-9 px-3 flex items-center">
                        {lead.source}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Button
              onClick={onQualify}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-blue-600 text-blue-400 hover:bg-blue-600/10 flex items-center"
              disabled={lead.qualification_status === 'processing'}
            >
              {lead.qualification_status === 'processing' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Qualifying...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Qualify
                </>
              )}
            </Button>
            <Button
              onClick={onGenerateOutreach}
              variant="outline"
              size="sm"
              className="bg-slate-800/50 border-purple-600 text-purple-400 hover:bg-purple-600/10 flex items-center"
            >
              <Mail className="w-4 h-4 mr-2" />
              Outreach
            </Button>
            {(lead.status === 'qualified' || lead.status === 'won') && !lead.converted_to_client_id && (
              <Button
                onClick={() => setConvertModalOpen(true)}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Building2 className="w-3.5 h-3.5 mr-1.5" />
                Convert to Client
              </Button>
            )}
            {lead.converted_to_client_id && (
              <Button
                variant="outline"
                size="sm"
                className="border-green-600 text-green-400"
                disabled
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Converted
              </Button>
            )}
            {onDelete && (
              <Button
                onClick={() => onDelete(lead.id)}
                variant="outline"
                size="sm"
                className="bg-slate-800/50 border-red-600 text-red-400 hover:bg-red-600/10 flex items-center ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <Card className="bg-black/40 border-slate-800/50 p-4">
            <h3 className="text-white font-semibold mb-3 text-sm">Contact Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-slate-500 text-xs">Email</p>
                  <a href={`mailto:${lead.email}`} className="text-white text-sm hover:text-blue-400">
                    {lead.email}
                  </a>
                </div>
              </div>
              {lead.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-slate-500 text-xs">Phone</p>
                    <a href={`tel:${lead.phone}`} className="text-white text-sm hover:text-blue-400">
                      {lead.phone}
                    </a>
                  </div>
                </div>
              )}
              {lead.linkedin && (
                <div className="flex items-center space-x-2">
                  <Linkedin className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-slate-500 text-xs">LinkedIn</p>
                    <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                      Profile
                    </a>
                  </div>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-slate-500 text-xs">Website</p>
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">
                      Visit
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Score Breakdown */}
          <LeadScoreBreakdown score={lead.score} breakdown={lead.score_breakdown} />

          {/* AI Summary */}
          <AISummaryCard lead={lead} onQualify={onQualify} />

          {/* Timeline */}
          <LeadTimeline activities={activities || []} />
        </div>
      </SheetContent>
      <ConvertToClientModal
        open={convertModalOpen}
        onOpenChange={setConvertModalOpen}
        lead={lead}
        onConvert={onConvert}
      />
    </Sheet>
  );
}