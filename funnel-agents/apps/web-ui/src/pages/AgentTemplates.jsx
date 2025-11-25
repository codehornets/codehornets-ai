import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import TemplateCard from '../components/agent-templates/TemplateCard';
import TemplateDetailSheet from '../components/agent-templates/TemplateDetailSheet';
import CreateAgentFromTemplateModal from '../components/agent-templates/CreateAgentFromTemplateModal';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export default function AgentTemplates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [selectedUseCase, setSelectedUseCase] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [templateToCreate, setTemplateToCreate] = useState(null);

  // Fetch agent templates from database
  const {
    data: templates = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['agent-templates'],
    queryFn: async () => {
      // Try to fetch from AgentTemplate entity
      try {
        const result = await client.entities.AgentTemplate?.list?.('-created_at');
        return result || [];
      } catch (err) {
        // Fallback: fetch via custom function if entity doesn't exist
        console.warn('AgentTemplate entity not available, trying function...');
        const result = await client.functions.invoke('getAgentTemplates', {});
        return result?.data || [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  // Fetch template categories
  const { data: categories = [] } = useQuery({
    queryKey: ['agent-template-categories'],
    queryFn: async () => {
      try {
        const result = await client.entities.AgentTemplateCategory?.list?.() || [];
        return result;
      } catch (err) {
        // Return default categories if entity doesn't exist
        return [
          { id: 'marketing', name: 'Marketing', domain: 'Marketing' },
          { id: 'sales', name: 'Sales', domain: 'Sales' },
          { id: 'operations', name: 'Operations', domain: 'Operations' },
          { id: 'offer', name: 'Offer', domain: 'Offer' },
        ];
      }
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  // Activate template mutation
  const activateTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      try {
        // Try entity-based activation
        return await client.entities.AgentTemplate?.update?.(templateId, {
          is_active: true,
          activation_count: (templates.find(t => t.id === templateId)?.activation_count || 0) + 1,
        });
      } catch (err) {
        // Fallback to function-based activation
        const result = await client.functions.invoke('activateAgentTemplate', {
          template_id: templateId,
        });
        return result?.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-templates'] });
      toast.success('Template activated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to activate template: ${error.message}`);
    },
  });

  // Extract unique domains and use cases from templates
  const domains = React.useMemo(() => {
    const uniqueDomains = [...new Set(templates.map(t => t.domain).filter(Boolean))];
    return uniqueDomains.sort();
  }, [templates]);

  const useCases = React.useMemo(() => {
    const allUseCases = templates.flatMap(t => t.useCase || []);
    const uniqueUseCases = [...new Set(allUseCases)];
    return uniqueUseCases.sort();
  }, [templates]);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = (
      template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesDomain = selectedDomain === 'all' || template.domain === selectedDomain;
    const matchesUseCase = selectedUseCase === 'all' ||
      (template.useCase && template.useCase.includes(selectedUseCase));
    return matchesSearch && matchesDomain && matchesUseCase;
  });

  const handleUseTemplate = (template) => {
    setTemplateToCreate(template);
    setSelectedTemplate(null);
    setCreateModalOpen(true);
    // Track template activation
    activateTemplateMutation.mutate(template.id);
  };

  const handleCreateCustom = () => {
    navigate(createPageUrl('Agents'));
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>

        <div className="glassmorphism-light border-slate-800/50 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Agent Templates</h1>
            <p className="text-slate-400 mt-1">Start from proven setups for common marketing tasks</p>
          </div>
        </div>

        <div className="glassmorphism-light border-red-800/50 p-12 rounded-lg text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Templates</h3>
          <p className="text-slate-400 mb-6">{error?.message || 'An error occurred while loading templates'}</p>
          <div className="flex items-center justify-center space-x-3">
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['agent-templates'] })}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Retry
            </Button>
            <Button
              onClick={handleCreateCustom}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              Create Custom Agent
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl('Agents'))}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Agent Templates</h1>
              <p className="text-slate-400 text-sm mt-1">← Back to Agents</p>
            </div>
          </div>
          <p className="text-slate-400 ml-12">
            {templates.length} templates available • Start from proven setups for common tasks
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleCreateCustom}
          className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Template
        </Button>
      </div>

      {/* Filters */}
      <div className="glassmorphism-light border-slate-800/50 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                All Domains
              </SelectItem>
              {domains.map(domain => (
                <SelectItem
                  key={domain}
                  value={domain}
                  className="text-slate-300 focus:bg-slate-700 focus:text-white"
                >
                  {domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedUseCase} onValueChange={setSelectedUseCase}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="Use Case" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-white">
                All Use Cases
              </SelectItem>
              {useCases.map(useCase => (
                <SelectItem
                  key={useCase}
                  value={useCase}
                  className="text-slate-300 focus:bg-slate-700 focus:text-white"
                >
                  {useCase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-800/50 border-slate-700 w-full sm:w-auto">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white"
          >
            All ({templates.length})
          </TabsTrigger>
          {categories.map(category => {
            const count = templates.filter(t => t.domain === category.domain).length;
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white"
                onClick={() => setSelectedDomain(category.domain)}
              >
                {category.name} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {/* Templates Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onPreview={() => setSelectedTemplate(template)}
                  onUse={() => handleUseTemplate(template)}
                />
              ))}
            </div>
          ) : (
            <div className="glassmorphism-light border-slate-800/50 rounded-lg p-12 text-center">
              <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No templates found</h3>
              <p className="text-slate-400 mb-6">Try adjusting your search or filters</p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDomain('all');
                  setSelectedUseCase('all');
                }}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Detail Sheet */}
      <TemplateDetailSheet
        open={!!selectedTemplate}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
        template={selectedTemplate}
        onUse={handleUseTemplate}
      />

      {/* Create Agent Modal */}
      <CreateAgentFromTemplateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        template={templateToCreate}
      />
    </div>
  );
}
