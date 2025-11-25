import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Save, Zap, Star } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Users } from 'lucide-react';

export default function Notifications() {
  const [settings, setSettings] = useState({
    email: {
      taskCompleted: true,
      taskFailed: true,
      agentOffline: true,
      weeklyReport: true,
      billingUpdates: true,
      securityAlerts: true,
    },
    inApp: {
      taskCompleted: true,
      taskFailed: true,
      agentOffline: true,
      teamInvites: true,
      mentions: true,
    },
    slack: {
      taskCompleted: false,
      taskFailed: true,
      agentOffline: true,
      dailyDigest: false,
    },
  });

  const handleToggle = (category, key) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key],
      },
    }));
  };

  const handleSave = () => {
    toast.success('Notification preferences saved');
  };

  const applyPreset = (preset) => {
    if (preset === 'owner') {
      setSettings({
        email: {
          taskCompleted: false,
          taskFailed: true,
          agentOffline: true,
          weeklyReport: true,
          billingUpdates: true,
          securityAlerts: true,
        },
        inApp: {
          taskCompleted: false,
          taskFailed: true,
          agentOffline: true,
          teamInvites: true,
          mentions: true,
        },
        slack: {
          taskCompleted: false,
          taskFailed: true,
          agentOffline: true,
          dailyDigest: true,
        },
      });
      toast.success('Owner preset applied');
    } else if (preset === 'manager') {
      setSettings({
        email: {
          taskCompleted: true,
          taskFailed: true,
          agentOffline: true,
          weeklyReport: true,
          billingUpdates: false,
          securityAlerts: false,
        },
        inApp: {
          taskCompleted: true,
          taskFailed: true,
          agentOffline: true,
          teamInvites: true,
          mentions: true,
        },
        slack: {
          taskCompleted: false,
          taskFailed: true,
          agentOffline: true,
          dailyDigest: false,
        },
      });
      toast.success('Manager preset applied');
    } else if (preset === 'ic') {
      setSettings({
        email: {
          taskCompleted: true,
          taskFailed: true,
          agentOffline: false,
          weeklyReport: false,
          billingUpdates: false,
          securityAlerts: false,
        },
        inApp: {
          taskCompleted: true,
          taskFailed: true,
          agentOffline: false,
          teamInvites: false,
          mentions: true,
        },
        slack: {
          taskCompleted: false,
          taskFailed: false,
          agentOffline: false,
          dailyDigest: false,
        },
      });
      toast.success('IC preset applied');
    }
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <Card className="glassmorphism-light border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
            <Zap className="w-5 h-5 mr-2 text-blue-400" />
            Quick Presets
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => applyPreset('owner')}
              className="hover:bg-[var(--bg-surface-hover)] h-auto py-4 flex-col items-start"
              style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-red-400" />
                <span className="font-semibold">Owner</span>
              </div>
              <p className="text-xs text-slate-400 text-left">
                Billing, security, weekly reports
              </p>
            </Button>

            <Button
              variant="outline"
              onClick={() => applyPreset('manager')}
              className="hover:bg-[var(--bg-surface-hover)] h-auto py-4 flex-col items-start"
              style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="font-semibold">Manager</span>
              </div>
              <p className="text-xs text-slate-400 text-left">
                Tasks, agents, weekly reports
              </p>
            </Button>

            <Button
              variant="outline"
              onClick={() => applyPreset('ic')}
              className="hover:bg-[var(--bg-surface-hover)] h-auto py-4 flex-col items-start"
              style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Bell className="w-5 h-5 text-green-400" />
                <span className="font-semibold">IC / Contributor</span>
              </div>
              <p className="text-xs text-slate-400 text-left">
                Only tasks they own
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card className="glassmorphism-light border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
            <Mail className="w-5 h-5 mr-2 text-blue-400" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Task Completed</Label>
                <p className="text-sm text-slate-400 mt-1">Get notified when tasks complete successfully</p>
              </div>
              <Switch
                checked={settings.email.taskCompleted}
                onCheckedChange={() => handleToggle('email', 'taskCompleted')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div>
                  <Label className="font-medium flex items-center" style={{ color: 'var(--text-primary)' }}>
                    Task Failed
                    <Star className="w-3 h-3 ml-2 text-amber-400" fill="currentColor" />
                  </Label>
                  <p className="text-sm text-slate-400 mt-1">Receive alerts when tasks fail</p>
                </div>
              </div>
              <Switch
                checked={settings.email.taskFailed}
                onCheckedChange={() => handleToggle('email', 'taskFailed')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Agent Offline</Label>
                <p className="text-sm text-slate-400 mt-1">Alert when an agent goes offline</p>
              </div>
              <Switch
                checked={settings.email.agentOffline}
                onCheckedChange={() => handleToggle('email', 'agentOffline')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Weekly Report</Label>
                <p className="text-sm text-slate-400 mt-1">Receive weekly performance summaries</p>
              </div>
              <Switch
                checked={settings.email.weeklyReport}
                onCheckedChange={() => handleToggle('email', 'weeklyReport')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium flex items-center" style={{ color: 'var(--text-primary)' }}>
                  Billing Updates
                  <Star className="w-3 h-3 ml-2 text-amber-400" fill="currentColor" />
                </Label>
                <p className="text-sm text-slate-400 mt-1">Notifications about billing and invoices</p>
              </div>
              <Switch
                checked={settings.email.billingUpdates}
                onCheckedChange={() => handleToggle('email', 'billingUpdates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium flex items-center" style={{ color: 'var(--text-primary)' }}>
                  Security Alerts
                  <Star className="w-3 h-3 ml-2 text-amber-400" fill="currentColor" />
                </Label>
                <p className="text-sm text-slate-400 mt-1">Important security notifications</p>
              </div>
              <Switch
                checked={settings.email.securityAlerts}
                onCheckedChange={() => handleToggle('email', 'securityAlerts')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card className="glassmorphism-light border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
            <Bell className="w-5 h-5 mr-2 text-blue-400" />
            In-App Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Task Completed</Label>
                <p className="text-sm text-slate-400 mt-1">Show in-app notifications for completed tasks</p>
              </div>
              <Switch
                checked={settings.inApp.taskCompleted}
                onCheckedChange={() => handleToggle('inApp', 'taskCompleted')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Task Failed</Label>
                <p className="text-sm text-slate-400 mt-1">Alert for failed tasks in the dashboard</p>
              </div>
              <Switch
                checked={settings.inApp.taskFailed}
                onCheckedChange={() => handleToggle('inApp', 'taskFailed')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Agent Offline</Label>
                <p className="text-sm text-slate-400 mt-1">Notify when agents go offline</p>
              </div>
              <Switch
                checked={settings.inApp.agentOffline}
                onCheckedChange={() => handleToggle('inApp', 'agentOffline')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Team Invites</Label>
                <p className="text-sm text-slate-400 mt-1">Notifications for team member invites</p>
              </div>
              <Switch
                checked={settings.inApp.teamInvites}
                onCheckedChange={() => handleToggle('inApp', 'teamInvites')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Mentions</Label>
                <p className="text-sm text-slate-400 mt-1">When someone mentions you in comments</p>
              </div>
              <Switch
                checked={settings.inApp.mentions}
                onCheckedChange={() => handleToggle('inApp', 'mentions')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slack Notifications */}
      <Card className="glassmorphism-light border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
            <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
            Slack Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Task Completed</Label>
                <p className="text-sm text-slate-400 mt-1">Post to Slack when tasks complete</p>
              </div>
              <Switch
                checked={settings.slack.taskCompleted}
                onCheckedChange={() => handleToggle('slack', 'taskCompleted')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Task Failed</Label>
                <p className="text-sm text-slate-400 mt-1">Alert team about failed tasks</p>
              </div>
              <Switch
                checked={settings.slack.taskFailed}
                onCheckedChange={() => handleToggle('slack', 'taskFailed')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Agent Offline</Label>
                <p className="text-sm text-slate-400 mt-1">Post when critical agents go offline</p>
              </div>
              <Switch
                checked={settings.slack.agentOffline}
                onCheckedChange={() => handleToggle('slack', 'agentOffline')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium" style={{ color: 'var(--text-primary)' }}>Daily Digest</Label>
                <p className="text-sm text-slate-400 mt-1">Daily summary of activities</p>
              </div>
              <Switch
                checked={settings.slack.dailyDigest}
                onCheckedChange={() => handleToggle('slack', 'dailyDigest')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}