import client from '@/api/client';

// Agent templates based on industry and goals
const getAgentsForSetup = (industry, goals) => {
  const agents = [];

  // Core agents for all clients
  agents.push({
    name: 'Project Manager',
    domain: 'Operations',
    role: 'Coordinates tasks and ensures project delivery',
    skills: [
      { name: 'Task Management', level: 'expert', years_experience: 5 },
      { name: 'Communication', level: 'expert', years_experience: 5 },
    ],
  });

  // Goal-based agents
  if (goals.includes('Generate more leads') || goals.includes('Email marketing')) {
    agents.push({
      name: 'Lead Generation Specialist',
      domain: 'Sales',
      role: 'Identify and qualify potential leads',
      skills: [
        { name: 'Lead Research', level: 'expert', years_experience: 4 },
        { name: 'Outreach', level: 'expert', years_experience: 4 },
      ],
    });
  }

  if (goals.includes('Content marketing') || goals.includes('Increase brand awareness')) {
    agents.push({
      name: 'Content Strategist',
      domain: 'Marketing',
      role: 'Plan and create engaging content',
      skills: [
        { name: 'Content Writing', level: 'expert', years_experience: 5 },
        { name: 'SEO', level: 'intermediate', years_experience: 3 },
      ],
    });
  }

  if (goals.includes('Social media growth')) {
    agents.push({
      name: 'Social Media Manager',
      domain: 'Marketing',
      role: 'Manage social media presence and engagement',
      skills: [
        { name: 'Social Media', level: 'expert', years_experience: 4 },
        { name: 'Community Management', level: 'intermediate', years_experience: 3 },
      ],
    });
  }

  if (goals.includes('SEO improvement')) {
    agents.push({
      name: 'SEO Specialist',
      domain: 'Marketing',
      role: 'Optimize content and improve search rankings',
      skills: [
        { name: 'SEO', level: 'expert', years_experience: 5 },
        { name: 'Analytics', level: 'expert', years_experience: 4 },
      ],
    });
  }

  if (goals.includes('Launch new product')) {
    agents.push({
      name: 'Product Launch Coordinator',
      domain: 'Marketing',
      role: 'Execute product launches and go-to-market strategy',
      skills: [
        { name: 'Product Marketing', level: 'expert', years_experience: 5 },
        { name: 'Campaign Management', level: 'expert', years_experience: 4 },
      ],
    });
  }

  // Industry-specific agents
  if (industry === 'technology') {
    agents.push({
      name: 'Tech Content Writer',
      domain: 'Marketing',
      role: 'Create technical content and documentation',
      skills: [
        { name: 'Technical Writing', level: 'expert', years_experience: 4 },
        { name: 'Developer Relations', level: 'intermediate', years_experience: 3 },
      ],
    });
  }

  if (industry === 'retail' || industry === 'real_estate') {
    agents.push({
      name: 'Visual Designer',
      domain: 'Marketing',
      role: 'Create visual assets and brand materials',
      skills: [
        { name: 'Graphic Design', level: 'expert', years_experience: 4 },
        { name: 'Branding', level: 'intermediate', years_experience: 3 },
      ],
    });
  }

  return agents;
};

// Campaign templates based on goals
const getCampaignTemplates = (clientId, goals) => {
  const templates = [];

  if (goals.includes('Generate more leads')) {
    templates.push({
      name: 'Lead Generation Campaign',
      description: 'Multi-channel lead generation strategy',
      client_id: clientId,
      status: 'planned',
      priority: 'high',
      goal: 'Generate 100 qualified leads',
    });
  }

  if (goals.includes('Content marketing')) {
    templates.push({
      name: 'Content Marketing Program',
      description: 'Ongoing content creation and distribution',
      client_id: clientId,
      status: 'planned',
      priority: 'medium',
      goal: 'Publish 8 pieces of content per month',
    });
  }

  if (goals.includes('Launch new product')) {
    templates.push({
      name: 'Product Launch Campaign',
      description: 'Coordinated product launch across all channels',
      client_id: clientId,
      status: 'planned',
      priority: 'critical',
      goal: 'Successful product launch',
    });
  }

  if (goals.includes('Social media growth')) {
    templates.push({
      name: 'Social Media Growth Campaign',
      description: 'Increase followers and engagement',
      client_id: clientId,
      status: 'planned',
      priority: 'medium',
      goal: 'Grow social following by 50%',
    });
  }

  return templates;
};

// Initial tasks for new client
const getInitialTasks = (clientId, clientName, agentId) => {
  return [
    {
      title: `Kickoff Meeting with ${clientName}`,
      description: 'Initial discovery call to understand client needs and objectives',
      client_id: clientId,
      agent_id: agentId,
      priority: 'high',
      status: 'pending',
      task_type: 'general',
    },
    {
      title: 'Client Onboarding Checklist',
      description: 'Complete all onboarding steps and gather necessary information',
      client_id: clientId,
      agent_id: agentId,
      priority: 'high',
      status: 'pending',
      task_type: 'general',
    },
    {
      title: 'Initial Strategy Document',
      description: 'Create strategic plan based on client goals',
      client_id: clientId,
      agent_id: agentId,
      priority: 'medium',
      status: 'pending',
      task_type: 'report',
    },
  ];
};

// Main automation function
export async function runClientOnboarding(workspaceData) {
  const results = {
    workspace: null,
    agents: [],
    campaigns: [],
    tasks: [],
    errors: [],
  };

  try {
    // 1. Create workspace
    const workspace = await client.entities.Workspace.create({
      ...workspaceData,
      onboarding_completed: true,
      onboarding_date: new Date().toISOString(),
    });
    results.workspace = workspace;

    // Use AI-recommended agents if available
    const agentTemplates = workspaceData.analysis?.recommended_agents?.length > 0
      ? workspaceData.analysis.recommended_agents.map(a => ({
          name: a.name,
          domain: a.domain,
          role: a.role,
          skills: []
        }))
      : getAgentsForSetup(workspaceData.industry, workspaceData.goals);

    // Use AI-recommended campaigns if available
    const campaignTemplates = workspaceData.analysis?.campaign_strategies?.length > 0
      ? workspaceData.analysis.campaign_strategies.map(c => ({
          name: c.name,
          description: c.description,
          client_id: workspace.id,
          status: 'planned',
          priority: c.priority === 'high' ? 'high' : 'medium',
          goal: c.objective,
        }))
      : getCampaignTemplates(workspace.id, workspaceData.goals);

    // 2. Create agents
    for (const agentTemplate of agentTemplates) {
      try {
        const agent = await client.entities.Agent.create({
          ...agentTemplate,
          status: 'active',
          success_rate: 0,
          tasks_completed: 0,
          avg_completion_time: 0,
          tokens_used: 0,
        });
        results.agents.push(agent);
      } catch (error) {
        results.errors.push(`Failed to create agent ${agentTemplate.name}: ${error.message}`);
      }
    }

    // 3. Create campaigns
    for (const template of campaignTemplates) {
      try {
        const campaign = await client.entities.Campaign.create(template);
        results.campaigns.push(campaign);
      } catch (error) {
        results.errors.push(`Failed to create campaign ${template.name}: ${error.message}`);
      }
    }

    // 4. Create initial tasks (if we have a project manager agent)
    const projectManager = results.agents.find(a => a.name === 'Project Manager');
    if (projectManager) {
      const initialTasks = getInitialTasks(workspace.id, workspaceData.name, projectManager.id);
      
      for (const taskData of initialTasks) {
        try {
          const task = await client.entities.Task.create({
            ...taskData,
            agent_name: projectManager.name,
            agent_role: projectManager.role,
          });
          results.tasks.push(task);
        } catch (error) {
          results.errors.push(`Failed to create task ${taskData.title}: ${error.message}`);
        }
      }
    }

    return results;
  } catch (error) {
    results.errors.push(`Onboarding failed: ${error.message}`);
    return results;
  }
}