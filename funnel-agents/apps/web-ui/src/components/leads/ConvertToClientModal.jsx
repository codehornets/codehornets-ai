import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, CheckCircle2 } from 'lucide-react';

export default function ConvertToClientModal({ open, onOpenChange, lead, onConvert }) {
  const [formData, setFormData] = useState({
    name: lead?.company || lead?.name || '',
    description: `Client converted from lead: ${lead?.name}`,
    color: 'blue',
    primary_contact: lead?.name || '',
    createCampaign: true,
    campaignName: 'Onboarding',
    createAutomation: true,
  });

  const [converting, setConverting] = useState(false);

  const handleConvert = async () => {
    setConverting(true);
    await onConvert({
      clientData: {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        primary_contact: formData.primary_contact,
      },
      createCampaign: formData.createCampaign,
      campaignName: formData.campaignName,
      createAutomation: formData.createAutomation,
    });
    setConverting(false);
  };

  const colorOptions = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500',
    yellow: 'from-yellow-500 to-amber-500',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span>Convert Lead to Client</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new client workspace from this qualified lead
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Lead Info Summary */}
          <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
            <p className="text-white font-medium">{lead?.name}</p>
            <p className="text-slate-400 text-sm">{lead?.email}</p>
            {lead?.company && <p className="text-slate-400 text-sm">{lead?.company}</p>}
          </div>

          {/* Client Details */}
          <div className="space-y-2">
            <Label>Client Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800/50 border-slate-700 text-white"
              placeholder="e.g., Acme Corp"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800/50 border-slate-700 text-white h-20"
            />
          </div>

          <div className="space-y-2">
            <Label>Primary Contact</Label>
            <Input
              value={formData.primary_contact}
              onChange={(e) => setFormData({ ...formData, primary_contact: e.target.value })}
              className="bg-slate-800/50 border-slate-700 text-white"
              placeholder="Contact person name"
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center space-x-2">
              {Object.keys(colorOptions).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`relative w-10 h-10 rounded-lg bg-gradient-to-br ${colorOptions[color]} transition-all ${
                    formData.color === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                  }`}
                >
                  {formData.color === color && (
                    <CheckCircle2 className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Setup */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <p className="text-white font-medium text-sm">Additional Setup</p>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-campaign"
                checked={formData.createCampaign}
                onCheckedChange={(checked) => setFormData({ ...formData, createCampaign: checked })}
              />
              <div className="flex-1">
                <label htmlFor="create-campaign" className="text-slate-300 text-sm cursor-pointer">
                  Create default campaign
                </label>
                {formData.createCampaign && (
                  <Input
                    value={formData.campaignName}
                    onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white text-sm h-8 mt-2"
                    placeholder="Campaign name"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-automation"
                checked={formData.createAutomation}
                onCheckedChange={(checked) => setFormData({ ...formData, createAutomation: checked })}
              />
              <label htmlFor="create-automation" className="text-slate-300 text-sm cursor-pointer">
                Create onboarding automation
              </label>
            </div>
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
            onClick={handleConvert}
            disabled={!formData.name || converting}
            className="bg-green-600 hover:bg-green-700"
          >
            {converting ? 'Converting...' : 'Convert to Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}