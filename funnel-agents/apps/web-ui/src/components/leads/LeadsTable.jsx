import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star, Mail, Phone, MoreVertical, Eye, Bot } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LeadsTable({ leads, selectedLeads, onSelectLead, onSelectAll, onLeadClick, onFieldUpdate, onAction }) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const statusColors = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    enriched: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    qualified: 'bg-green-500/20 text-green-400 border-green-500/30',
    contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    in_conversation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    proposal_sent: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    won: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    lost: 'bg-red-500/20 text-red-400 border-red-500/30',
    disqualified: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const handleCellClick = (leadId, field, currentValue) => {
    setEditingCell({ leadId, field });
    setEditValue(currentValue || '');
  };

  const handleCellBlur = (leadId, field) => {
    if (editingCell && editingCell.leadId === leadId && editingCell.field === field) {
      if (editValue !== '') {
        onFieldUpdate(leadId, field, editValue);
      }
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleStatusChange = (leadId, newStatus) => {
    onFieldUpdate(leadId, 'status', newStatus);
  };

  const isEditing = (leadId, field) => {
    return editingCell?.leadId === leadId && editingCell?.field === field;
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50 sticky top-0 z-10">
            <tr className="border-b border-slate-700">
              <th className="w-12 p-3">
                <Checkbox
                  checked={selectedLeads.length === leads.length && leads.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </th>
              <th className="text-left p-3 text-sm font-medium text-slate-300 min-w-[200px]">Lead Name</th>
              <th className="text-left p-3 text-sm font-medium text-slate-300 min-w-[180px]">Company</th>
              <th className="text-left p-3 text-sm font-medium text-slate-300 min-w-[140px]">Status</th>
              <th className="text-left p-3 text-sm font-medium text-slate-300 w-24">Score</th>
              <th className="text-left p-3 text-sm font-medium text-slate-300 min-w-[120px]">Source</th>
              <th className="text-left p-3 text-sm font-medium text-slate-300 min-w-[200px]">Email</th>
              <th className="text-left p-3 text-sm font-medium text-slate-300 min-w-[140px]">Phone</th>
              <th className="text-left p-3 text-sm font-medium text-slate-300 min-w-[160px]">Last Touch</th>
              <th className="text-left p-3 text-sm font-medium text-slate-300 min-w-[200px]">Next Step</th>
              <th className="w-12 p-3"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
              <tr
                key={lead.id}
                className={`border-b border-slate-800 hover:bg-slate-800/30 transition-colors group ${
                  index % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-900/40'
                }`}
              >
                <td className="p-3">
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => onSelectLead(lead.id)}
                  />
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onLeadClick(lead)}
                    className="flex items-center space-x-3 text-left hover:text-blue-400 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <span className="text-white font-medium">{lead.name}</span>
                  </button>
                </td>
                <td className="p-3">
                  {isEditing(lead.id, 'company') ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleCellBlur(lead.id, 'company')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCellBlur(lead.id, 'company');
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                      autoFocus
                      className="bg-slate-800 border-slate-700 text-white text-sm h-8"
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(lead.id, 'company', lead.company)}
                      className="text-slate-300 text-sm cursor-pointer hover:bg-slate-800/50 p-1 rounded"
                    >
                      {lead.company || '-'}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <Select value={lead.status} onValueChange={(val) => handleStatusChange(lead.id, val)}>
                    <SelectTrigger className="w-full h-7 bg-transparent border-0 text-xs">
                      <Badge className={`${statusColors[lead.status]} text-xs px-2 py-0.5 min-w-[100px] justify-center`}>
                        {lead.status}
                      </Badge>
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
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-1">
                    <Star className={`w-3.5 h-3.5 ${getScoreColor(lead.score)} fill-current`} />
                    <span className={`text-sm font-medium ${getScoreColor(lead.score)}`}>
                      {lead.score || 0}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  {isEditing(lead.id, 'source') ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleCellBlur(lead.id, 'source')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCellBlur(lead.id, 'source');
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                      autoFocus
                      className="bg-slate-800 border-slate-700 text-white text-sm h-8"
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(lead.id, 'source', lead.source)}
                      className="text-slate-300 text-sm cursor-pointer hover:bg-slate-800/50 p-1 rounded"
                    >
                      {lead.source || '-'}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center space-x-2 text-slate-300 hover:text-blue-400 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{lead.email}</span>
                  </a>
                </td>
                <td className="p-3">
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center space-x-2 text-slate-300 hover:text-blue-400 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{lead.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-600 text-sm">-</span>
                  )}
                </td>
                <td className="p-3">
                  <span className="text-slate-400 text-sm">
                    {lead.last_activity_date
                      ? new Date(lead.last_activity_date).toLocaleDateString()
                      : lead.created_date
                      ? new Date(lead.created_date).toLocaleDateString()
                      : '-'}
                  </span>
                </td>
                <td className="p-3">
                  {isEditing(lead.id, 'next_step') ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleCellBlur(lead.id, 'next_step')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCellBlur(lead.id, 'next_step');
                        if (e.key === 'Escape') setEditingCell(null);
                      }}
                      autoFocus
                      className="bg-slate-800 border-slate-700 text-white text-sm h-8"
                      placeholder="Add next step..."
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(lead.id, 'next_step', lead.next_step)}
                      className="text-slate-300 text-sm cursor-pointer hover:bg-slate-800/50 p-1 rounded"
                    >
                      {lead.next_step || <span className="text-slate-600">Add next step...</span>}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem
                        onClick={() => onLeadClick(lead)}
                        className="text-slate-300 focus:bg-slate-700 focus:text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onAction('qualify', lead)}
                        className="text-slate-300 focus:bg-slate-700 focus:text-white"
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        Qualify with AI
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}