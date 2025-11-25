import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, ArrowLeft, Code, FileText, Video, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Documentation() {
  const navigate = useNavigate();

  const documentationSections = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of FunnelAgents and set up your first agent',
      icon: BookOpen,
      link: 'https://docs.funnelagents.ai/getting-started',
      available: false
    },
    {
      title: 'Agent Configuration',
      description: 'Detailed guide on configuring and customizing your agents',
      icon: FileText,
      link: 'https://docs.funnelagents.ai/agent-configuration',
      available: false
    },
    {
      title: 'API Reference',
      description: 'Complete API documentation for developers',
      icon: Code,
      link: 'https://docs.funnelagents.ai/api-reference',
      available: false
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides for common workflows',
      icon: Video,
      link: 'https://docs.funnelagents.ai/tutorials',
      available: false
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
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Documentation
            </h1>
          </div>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Everything you need to know about FunnelAgents
          </p>
        </div>

        {/* Coming Soon Notice */}
        <div
          className="mb-12 p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-medium)'
          }}
        >
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Documentation Coming Soon
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            We're currently building comprehensive documentation to help you get the most out of FunnelAgents.
            In the meantime, feel free to explore the platform or contact our support team for assistance.
          </p>
        </div>

        {/* Documentation Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {documentationSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="p-6 rounded-lg border transition-all"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                  opacity: section.available ? 1 : 0.6
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {section.title}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {section.description}
                    </p>
                    {section.available ? (
                      <a
                        href={section.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        View documentation
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Help */}
        <div
          className="p-8 rounded-lg border text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-medium)'
          }}
        >
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-2xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Need Help Now?
          </h3>
          <p className="mb-6 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Our support team is here to help you get started and answer any questions you may have.
          </p>
          <Button
            onClick={() => navigate('/Support')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
