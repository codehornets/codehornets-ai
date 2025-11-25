import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Paperclip } from 'lucide-react';

export default function RunAgentModal({ open, onOpenChange, agent, workspaces, projects, onRun }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    workspace_id: '',
    project_id: '',
    channel: '',
    task_type: 'quick',
    template: '',
    brief: '',
    attachments: [],
    outputs: {
      inbox: true,
      campaign: false,
      client_email: false,
    }
  });

  const templates = {
    'Market Researcher': ['Audience research', 'Competitor scan', 'Offer insight report'],
    'Content Creator': ['Blog post', 'Social media copy', 'Email sequence'],
    'SEO Specialist': ['Keyword analysis', 'On-page optimization', 'Content audit'],
  };

  const agentTemplates = templates[agent?.name] || ['Quick task', 'Analysis', 'Report'];

  const _selectedWorkspace = workspaces.find(w => w.id === formData.workspace_id);
  const filteredProjects = projects.filter(p => p.workspace_id === formData.workspace_id);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    onRun(formData);
    setStep(1);
    setFormData({
      workspace_id: '',
      project_id: '',
      channel: '',
      task_type: 'quick',
      template: '',
      brief: '',
      attachments: [],
      outputs: { inbox: true, campaign: false, client_email: false }
    });
    onOpenChange(false);
  };

  const canProceed = () => {
    if (step === 1) return formData.workspace_id && formData.project_id;
    if (step === 2) return formData.task_type;
    if (step === 3) return formData.brief.trim();
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Run {agent?.name}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Step {step} of 4
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Step 1: Context */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Where should this agent work?</h3>
              
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={formData.workspace_id} onValueChange={(v) => setFormData({ ...formData, workspace_id: v, project_id: '' })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {workspaces.map(ws => (
                      <SelectItem key={ws.id} value={ws.id} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Campaign *</Label>
                <Select 
                  value={formData.project_id} 
                  onValueChange={(v) => setFormData({ ...formData, project_id: v })}
                  disabled={!formData.workspace_id}
                >
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder={formData.workspace_id ? "Select a campaign" : "Select client first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {filteredProjects.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Channel (Optional)</Label>
                <Select value={formData.channel} onValueChange={(v) => setFormData({ ...formData, channel: v })}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="email" className="text-slate-300 focus:bg-slate-700 focus:text-white">Email</SelectItem>
                    <SelectItem value="blog" className="text-slate-300 focus:bg-slate-700 focus:text-white">Blog</SelectItem>
                    <SelectItem value="linkedin" className="text-slate-300 focus:bg-slate-700 focus:text-white">LinkedIn</SelectItem>
                    <SelectItem value="ads" className="text-slate-300 focus:bg-slate-700 focus:text-white">Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Task Type */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">What type of task?</h3>
              
              <RadioGroup value={formData.task_type} onValueChange={(v) => setFormData({ ...formData, task_type: v })}>
                <div className="flex items-center space-x-2 p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors">
                  <RadioGroupItem value="quick" id="quick" />
                  <Label htmlFor="quick" className="flex-1 cursor-pointer">
                    <div className="font-medium text-white">Quick task (one-off)</div>
                    <div className="text-sm text-slate-400">Run a single task with custom instructions</div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-4 bg-slate-800/30 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors">
                  <RadioGroupItem value="template" id="template" />
                  <Label htmlFor="template" className="flex-1 cursor-pointer">
                    <div className="font-medium text-white">Use template</div>
                    <div className="text-sm text-slate-400">Start with a pre-configured task template</div>
                  </Label>
                </div>
              </RadioGroup>

              {formData.task_type === 'template' && (
                <div className="space-y-2 mt-4">
                  <Label>Select Template</Label>
                  <Select value={formData.template} onValueChange={(v) => setFormData({ ...formData, template: v })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {agentTemplates.map((t, idx) => (
                        <SelectItem key={idx} value={t} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Brief */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">What should the agent do?</h3>
              
              <div className="space-y-2">
                <Label>Task Brief *</Label>
                <Textarea
                  placeholder="Example: Research the top 5 competitors in the fitness app space, analyze their pricing models, and identify gaps we can exploit..."
                  value={formData.brief}
                  onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                  className="bg-slate-800/50 border-slate-700 text-white h-32"
                />
                <p className="text-xs text-slate-500">Be specific about what you want. The more detail, the better the result.</p>
              </div>

              <div className="space-y-2">
                <Label>Attachments (Optional)</Label>
                <Button variant="outline" className="w-full border-slate-700 text-slate-400 hover:bg-slate-800/50 hover:text-white">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Attach URL, PDF, or Doc
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Output Destination */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Where should the results go?</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-4 bg-slate-800/30 rounded-lg">
                  <Checkbox 
                    id="inbox"
                    checked={formData.outputs.inbox}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      outputs: { ...formData.outputs, inbox: checked }
                    })}
                  />
                  <Label htmlFor="inbox" className="flex-1 cursor-pointer">
                    <div className="font-medium text-white">Send result to Inbox</div>
                    <div className="text-sm text-slate-400">You'll get notified when the task completes</div>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-slate-800/30 rounded-lg">
                  <Checkbox 
                    id="campaign"
                    checked={formData.outputs.campaign}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      outputs: { ...formData.outputs, campaign: checked }
                    })}
                  />
                  <Label htmlFor="campaign" className="flex-1 cursor-pointer">
                    <div className="font-medium text-white">Attach to campaign as asset</div>
                    <div className="text-sm text-slate-400">Save output directly to campaign files</div>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 bg-slate-800/30 rounded-lg">
                  <Checkbox 
                    id="client"
                    checked={formData.outputs.client_email}
                    onCheckedChange={(checked) => setFormData({ 
                      ...formData, 
                      outputs: { ...formData.outputs, client_email: checked }
                    })}
                  />
                  <Label htmlFor="client" className="flex-1 cursor-pointer">
                    <div className="font-medium text-white">Draft email to client for approval</div>
                    <div className="text-sm text-slate-400">Prepare a client-ready email (you review before sending)</div>
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={handleBack} className="text-slate-400 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
              Cancel
            </Button>
            {step < 4 ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="bg-blue-600 hover:bg-blue-700 text-white">
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed()} className="bg-blue-600 hover:bg-blue-700 text-white">
                Run Agent
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}