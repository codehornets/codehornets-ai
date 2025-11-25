import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '@/api/client';
import { toast } from 'sonner';

/**
 * Hook to fetch all agent templates
 */
export function useAgentTemplates(options = {}) {
  return useQuery({
    queryKey: ['agent-templates'],
    queryFn: async () => {
      try {
        const result = await client.entities.AgentTemplate?.list?.('-created_at');
        return result || [];
      } catch (err) {
        console.warn('AgentTemplate entity not available, trying function...');
        const result = await client.functions.invoke('getAgentTemplates', {});
        return result?.data || [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
    ...options,
  });
}

/**
 * Hook to fetch a single agent template by ID
 */
export function useAgentTemplate(templateId, options = {}) {
  return useQuery({
    queryKey: ['agent-template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      try {
        return await client.entities.AgentTemplate?.get?.(templateId);
      } catch (err) {
        const result = await client.functions.invoke('getAgentTemplate', {
          template_id: templateId,
        });
        return result?.data;
      }
    },
    enabled: !!templateId,
    ...options,
  });
}

/**
 * Hook to fetch agent template categories
 */
export function useAgentTemplateCategories(options = {}) {
  return useQuery({
    queryKey: ['agent-template-categories'],
    queryFn: async () => {
      try {
        const result = await client.entities.AgentTemplateCategory?.list?.() || [];
        return result;
      } catch (err) {
        // Return default categories if entity doesn't exist
        return [
          { id: 'marketing', name: 'Marketing', domain: 'Marketing', icon: 'TrendingUp' },
          { id: 'sales', name: 'Sales', domain: 'Sales', icon: 'Users' },
          { id: 'operations', name: 'Operations', domain: 'Operations', icon: 'Settings' },
          { id: 'offer', name: 'Offer', domain: 'Offer', icon: 'Package' },
        ];
      }
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    ...options,
  });
}

/**
 * Hook to activate an agent template
 */
export function useActivateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId) => {
      try {
        // Try entity-based activation
        const templates = queryClient.getQueryData(['agent-templates']) || [];
        const template = templates.find(t => t.id === templateId);

        return await client.entities.AgentTemplate?.update?.(templateId, {
          is_active: true,
          activation_count: (template?.activation_count || 0) + 1,
          last_activated_at: new Date().toISOString(),
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
}

/**
 * Hook to create an agent from a template
 */
export function useCreateAgentFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ template, customizations = {} }) => {
      const agentData = {
        name: customizations.name || template.name,
        description: customizations.description || template.description,
        domain: template.domain,
        role: template.persona?.title || 'Agent',
        persona: {
          ...template.persona,
          ...customizations.persona,
        },
        config: {
          ...template.defaultConfig,
          ...customizations.config,
        },
        template_id: template.id,
        status: 'active',
      };

      try {
        const agent = await client.entities.Agent?.create?.(agentData);

        // Update template usage count
        await client.entities.AgentTemplate?.update?.(template.id, {
          usage_count: (template.usage_count || 0) + 1,
        });

        return agent;
      } catch (err) {
        const result = await client.functions.invoke('createAgentFromTemplate', {
          template_id: template.id,
          customizations,
        });
        return result?.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent-templates'] });
      toast.success('Agent created from template');
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  });
}

/**
 * Hook to create a custom agent template
 */
export function useCreateAgentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData) => {
      try {
        return await client.entities.AgentTemplate?.create?.(templateData);
      } catch (err) {
        const result = await client.functions.invoke('createAgentTemplate', {
          template: templateData,
        });
        return result?.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

/**
 * Hook to update an agent template
 */
export function useUpdateAgentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      try {
        return await client.entities.AgentTemplate?.update?.(id, data);
      } catch (err) {
        const result = await client.functions.invoke('updateAgentTemplate', {
          template_id: id,
          updates: data,
        });
        return result?.data;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-templates'] });
      queryClient.invalidateQueries({ queryKey: ['agent-template', variables.id] });
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

/**
 * Hook to delete an agent template
 */
export function useDeleteAgentTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      try {
        return await client.entities.AgentTemplate?.delete?.(id);
      } catch (err) {
        const result = await client.functions.invoke('deleteAgentTemplate', {
          template_id: id,
        });
        return result?.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

/**
 * Hook to search and filter agent templates
 */
export function useFilteredAgentTemplates(filters = {}) {
  const { data: templates = [], ...queryResult } = useAgentTemplates();

  const filteredTemplates = React.useMemo(() => {
    return templates.filter(template => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch = (
          template.name?.toLowerCase().includes(query) ||
          template.description?.toLowerCase().includes(query)
        );
        if (!matchesSearch) return false;
      }

      // Domain filter
      if (filters.domain && filters.domain !== 'all') {
        if (template.domain !== filters.domain) return false;
      }

      // Use case filter
      if (filters.useCase && filters.useCase !== 'all') {
        if (!template.useCase?.includes(filters.useCase)) return false;
      }

      // Status filter
      if (filters.status) {
        if (template.status !== filters.status) return false;
      }

      return true;
    });
  }, [templates, filters]);

  return {
    ...queryResult,
    data: filteredTemplates,
    unfilteredData: templates,
  };
}
