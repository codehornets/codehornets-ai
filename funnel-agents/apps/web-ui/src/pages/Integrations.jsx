import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IntegrationCard from '../components/integrations/IntegrationCard';
import IntegrationConfigModal from '../components/integrations/IntegrationConfigModal';
import { 
  Database, Mail, MessageSquare, CreditCard, 
  Users, Video, FileText, Calendar, Link, 
  Globe, Code, Zap, Search, Filter, CheckCircle2
} from 'lucide-react';

export default function Integrations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [integrations, setIntegrations] = useState([

    {
      id: 1,
      name: 'HubSpot CRM',
      description: 'Sync contacts, deals, and activities with HubSpot CRM for seamless sales operations.',
      icon: Database,
      category: 'CRM',
      connected: true,
      url: 'https://hubspot.com',
    },
    {
      id: 2,
      name: 'Google Workspace',
      description: 'Connect Gmail, Calendar, Drive, and other Google services to your workflow.',
      icon: Mail,
      category: 'Productivity',
      connected: true,
      url: 'https://workspace.google.com',
    },
    {
      id: 3,
      name: 'Slack',
      description: 'Send notifications and updates directly to your Slack channels.',
      icon: MessageSquare,
      category: 'Communication',
      connected: false,
      url: 'https://slack.com',
    },
    {
      id: 4,
      name: 'Stripe',
      description: 'Process payments and manage subscriptions with Stripe integration.',
      icon: CreditCard,
      category: 'Payment',
      connected: true,
      url: 'https://stripe.com',
    },
    {
      id: 5,
      name: 'Mailchimp',
      description: 'Sync contacts and automate email marketing campaigns.',
      icon: Mail,
      category: 'Marketing',
      connected: false,
      url: 'https://mailchimp.com',
    },
    {
      id: 6,
      name: 'Salesforce',
      description: 'Connect with Salesforce to manage customer relationships and sales data.',
      icon: Users,
      category: 'CRM',
      connected: false,
      url: 'https://salesforce.com',
    },
    {
      id: 7,
      name: 'Zoom',
      description: 'Schedule and manage video meetings directly from your dashboard.',
      icon: Video,
      category: 'Communication',
      connected: false,
      url: 'https://zoom.us',
    },
    {
      id: 8,
      name: 'Notion',
      description: 'Sync data and documentation with your Notion workspace.',
      icon: FileText,
      category: 'Productivity',
      connected: false,
      url: 'https://notion.so',
    },
    {
      id: 9,
      name: 'Calendly',
      description: 'Automate scheduling and sync appointments with your calendar.',
      icon: Calendar,
      category: 'Productivity',
      connected: false,
      url: 'https://calendly.com',
    },
    {
      id: 10,
      name: 'LinkedIn',
      description: 'Publish content and track engagement on LinkedIn.',
      icon: Link,
      category: 'Social Media',
      connected: true,
      url: 'https://linkedin.com',
    },
    {
      id: 11,
      name: 'Meta (Facebook)',
      description: 'Manage Facebook and Instagram business accounts.',
      icon: Globe,
      category: 'Social Media',
      connected: false,
      url: 'https://business.facebook.com',
    },
    {
      id: 12,
      name: 'Twitter/X',
      description: 'Schedule tweets and monitor engagement on Twitter/X.',
      icon: MessageSquare,
      category: 'Social Media',
      connected: false,
      url: 'https://twitter.com',
    },
    {
      id: 13,
      name: 'Zapier',
      description: 'Connect to 5000+ apps through Zapier automation.',
      icon: Zap,
      category: 'Automation',
      connected: false,
      url: 'https://zapier.com',
    },
    {
      id: 14,
      name: 'GitHub',
      description: 'Integrate with GitHub for code management and deployment tracking.',
      icon: Code,
      category: 'Developer',
      connected: false,
      url: 'https://github.com',
    },
  ]);

  const categories = ['all', 'CRM', 'Productivity', 'Communication', 'Marketing', 'Payment', 'Social Media', 'Automation', 'Developer'];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || integration.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleConfigure = (integration) => {
    setSelectedIntegration(integration);
    setConfigModalOpen(true);
  };

  const handleConnect = (integration) => {
    setIntegrations(prev => prev.map(i => 
      i.id === integration.id ? { ...i, connected: true } : i
    ));
  };

  const handleDisconnect = (integration) => {
    setIntegrations(prev => prev.map(i => 
      i.id === integration.id ? { ...i, connected: false } : i
    ));
  };

  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Integrations Hub</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
            {connectedCount} of {integrations.length} integrations connected
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-3">
        {/* Search */}
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700/50 text-white">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {categories.map((category) => (
              <SelectItem 
                key={category} 
                value={category}
                className="text-slate-300 focus:bg-slate-700 focus:text-white"
              >
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glassmorphism-light border-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Connected</p>
              <p className="text-white text-2xl font-bold mt-1">{connectedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="glassmorphism-light border-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Available</p>
              <p className="text-white text-2xl font-bold mt-1">{integrations.length - connectedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="glassmorphism-light border-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Categories</p>
              <p className="text-white text-2xl font-bold mt-1">{categories.length - 1}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Filter className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration, index) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConfigure={handleConfigure}
            delay={index * 0.05}
          />
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="glassmorphism-light border-slate-800/50 rounded-lg p-12 text-center">
          <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No integrations found</h3>
          <p className="text-slate-400">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Configuration Modal */}
      <IntegrationConfigModal
        integration={selectedIntegration}
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
}