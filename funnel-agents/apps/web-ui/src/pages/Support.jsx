import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  HelpCircle,
  Mail,
  MessageSquare,
  FileText,
  ExternalLink,
  ArrowLeft,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export default function Support() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement actual support ticket submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Support request submitted',
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const supportOptions = [
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      action: 'Coming soon',
      available: false
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email at support@funnelagents.ai',
      action: 'support@funnelagents.ai',
      link: 'mailto:support@funnelagents.ai',
      available: true
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Browse our knowledge base and guides',
      action: 'View docs',
      link: '/Documentation',
      available: true
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Support
            </h1>
          </div>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            We're here to help you succeed with FunnelAgents
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div
            className="p-8 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-medium)'
            }}
          >
            <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
              Send us a message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" style={{ color: 'var(--text-primary)' }}>
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="mt-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <Label htmlFor="email" style={{ color: 'var(--text-primary)' }}>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  className="mt-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <Label htmlFor="subject" style={{ color: 'var(--text-primary)' }}>
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  required
                  className="mt-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <Label htmlFor="message" style={{ color: 'var(--text-primary)' }}>
                  Message
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  required
                  rows={6}
                  className="mt-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Sending...' : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Support Options */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
                Other ways to get help
              </h2>
              <div className="space-y-4">
                {supportOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div
                      key={option.title}
                      className="p-6 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-subtle)',
                        opacity: option.available ? 1 : 0.6
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                            {option.title}
                          </h3>
                          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                            {option.description}
                          </p>
                          {option.available && option.link ? (
                            option.link.startsWith('mailto:') ? (
                              <a
                                href={option.link}
                                className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                              >
                                {option.action}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(option.link)}
                                className="text-blue-500 hover:text-blue-600 p-0 h-auto"
                              >
                                {option.action}
                              </Button>
                            )
                          ) : (
                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                              {option.action}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FAQ Preview */}
            <div
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-medium)'
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Common Questions
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                    How do I create my first agent?
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Navigate to the Agents page and click "Create Agent" to get started with templates.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                    Can I integrate with my existing tools?
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Yes! Check the Integrations page for available connections.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                    What's included in the free plan?
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Visit Settings &gt; Billing to see plan details and features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
