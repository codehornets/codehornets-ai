import { Button } from '@/components/ui/button';
import { Code, ExternalLink, ArrowLeft, Copy, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

export default function ApiDocs() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Code snippet copied successfully',
    });
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/agents',
      description: 'List all agents',
      status: 'Available'
    },
    {
      method: 'POST',
      path: '/api/agents',
      description: 'Create a new agent',
      status: 'Available'
    },
    {
      method: 'GET',
      path: '/api/tasks',
      description: 'List all tasks',
      status: 'Available'
    },
    {
      method: 'POST',
      path: '/api/workflows/execute',
      description: 'Execute a workflow',
      status: 'Available'
    }
  ];

  const exampleCode = `// Example: Fetch agents
const response = await fetch('https://api.funnelagents.ai/api/agents', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const agents = await response.json();
console.log(agents);`;

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
              <Code className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              API Documentation
            </h1>
          </div>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Build powerful integrations with the FunnelAgents API
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
            Full API Documentation Coming Soon
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            We're currently building comprehensive API documentation with interactive examples and SDKs.
            The API is functional and available for use - contact support for early access credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Start */}
          <div
            className="p-8 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-medium)'
            }}
          >
            <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
              Quick Start
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Authentication
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  All API requests require authentication using an API key. Generate your key in Settings &gt; API Keys.
                </p>
                <div className="relative">
                  <pre
                    className="p-4 rounded-lg text-sm overflow-x-auto"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <code>Authorization: Bearer YOUR_API_KEY</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Base URL
                </h3>
                <div className="relative">
                  <pre
                    className="p-4 rounded-lg text-sm overflow-x-auto"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <code>https://api.funnelagents.ai</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard('https://api.funnelagents.ai')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Example Code */}
          <div
            className="p-8 rounded-lg border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-medium)'
            }}
          >
            <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
              Example Code
            </h2>
            <div className="relative">
              <pre
                className="p-4 rounded-lg text-sm overflow-x-auto"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  maxHeight: '400px'
                }}
              >
                <code>{exampleCode}</code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(exampleCode)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Endpoints Preview */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            Available Endpoints
          </h2>
          <div
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-medium)'
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Method
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Endpoint
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Description
                    </th>
                    <th className="text-left p-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {endpoints.map((endpoint, index) => (
                    <tr
                      key={index}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td className="p-4">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: endpoint.method === 'GET' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            color: endpoint.method === 'GET' ? '#22c55e' : '#3b82f6'
                          }}
                        >
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="p-4">
                        <code className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {endpoint.path}
                        </code>
                      </td>
                      <td className="p-4" style={{ color: 'var(--text-secondary)' }}>
                        {endpoint.description}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-green-500">
                          {endpoint.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className="mt-8 p-8 rounded-lg border text-center"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-medium)'
          }}
        >
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-2xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Need Help Getting Started?
          </h3>
          <p className="mb-6 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Our team can help you integrate the FunnelAgents API into your application.
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
