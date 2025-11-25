import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, CheckCircle2, Users, Building2, Target, Zap } from 'lucide-react';
import client from '@/api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    company_name: user?.company_name || '',
    team_size: user?.team_size || '',
    industry: user?.industry || '',
    goals: [],
    use_cases: []
  });
  const [selectedAgents, setSelectedAgents] = useState([]);

  // Note: OnboardingRoute handles authentication and onboarding status checks
  // No need for useEffect to check onboarding status here

  const updateUserMutation = useMutation({
    mutationFn: (data) => client.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: (data) => client.entities.Workspace.create(data),
  });

  const createAgentMutation = useMutation({
    mutationFn: (data) => client.entities.Agent.create(data),
  });

  const agentTemplates = [
    { name: 'Market Researcher', domain: 'Marketing', role: 'Research market trends and competitor analysis', icon: '🔍' },
    { name: 'Content Creator', domain: 'Marketing', role: 'Create engaging content and copy', icon: '✍️' },
    { name: 'SEO Specialist', domain: 'Marketing', role: 'Optimize content for search engines', icon: '📈' },
    { name: 'Lead Qualifier', domain: 'Sales', role: 'Score and qualify incoming leads', icon: '🎯' },
    { name: 'Email Marketer', domain: 'Marketing', role: 'Design and send email campaigns', icon: '📧' },
    { name: 'Social Media Manager', domain: 'Marketing', role: 'Manage social media presence', icon: '📱' }
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    try {
      // Prepare updated user data - only include fields the backend accepts
      // (goals and use_cases are stored locally, not in the user profile)
      const updatedUserData = {
        company_name: userData.company_name,
        team_size: userData.team_size,
        industry: userData.industry,
        onboarding_completed: true
      };

      // Update user profile on server
      const updatedUser = await updateUserMutation.mutateAsync(updatedUserData);

      // Update local auth context with the updated user
      updateUser({
        ...user,
        ...updatedUserData,
        onboarding_completed: true
      });

      // Create default workspace
      try {
        await createWorkspaceMutation.mutateAsync({
          name: userData.company_name || 'My Workspace',
          description: 'Default workspace',
          is_default: true
        });
      } catch (workspaceError) {
        console.warn('Workspace creation failed (may already exist):', workspaceError);
      }

      // Get existing agents
      try {
        const agentsResponse = await client.entities.Agent.list();
        const existingAgents = agentsResponse.data || agentsResponse || [];

        // Create selected agents (only if they don't exist)
        for (const agent of selectedAgents) {
          const exists = existingAgents.find(a => a.name === agent.name);
          if (!exists) {
            await createAgentMutation.mutateAsync({
              name: agent.name,
              domain: agent.domain,
              role: agent.role,
              status: 'active',
              success_rate: 0,
              tasks_completed: 0,
              avg_completion_time: 0,
              tokens_used: 0
            });
          }
        }
      } catch (agentError) {
        console.warn('Agent creation error:', agentError);
      }

      toast.success('Welcome to FunnelAgents!');
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Setup failed. Please try again.');
    }
  };

  const toggleAgent = (agent) => {
    setSelectedAgents(prev => {
      const exists = prev.find(a => a.name === agent.name);
      if (exists) {
        return prev.filter(a => a.name !== agent.name);
      } else {
        return [...prev, agent];
      }
    });
  };

  const canProceed = () => {
    if (step === 1) return userData.company_name && userData.team_size;
    if (step === 2) return userData.industry;
    if (step === 3) return selectedAgents.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f9fafb' }}>
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-12">
          {/* Steps Container */}
          <div className="relative max-w-3xl mx-auto px-8">
            {/* Background Line */}
            <div 
              className="absolute top-6 left-0 right-0 h-0.5"
              style={{ 
                backgroundColor: '#e5e7eb',
                zIndex: 0
              }}
            />
            
            {/* Active Progress Line */}
            <div 
              className="absolute top-6 left-0 h-0.5 transition-all duration-500 ease-out"
              style={{ 
                backgroundColor: '#3b82f6',
                width: `${((step - 1) / 3) * 100}%`,
                zIndex: 1
              }}
            />

            {/* Steps */}
            <div className="relative z-10 flex justify-between">
              {[1, 2, 3, 4].map((s) => {
                const isActive = s === step;
                const isCompleted = s < step;
                const isPending = s > step;
                
                return (
                  <div key={s} className="flex flex-col items-center" style={{ width: '90px' }}>
                    {/* Circle */}
                    <div 
                      className="transition-all duration-300 ease-out"
                      style={{
                        width: isActive ? '56px' : '48px',
                        height: isActive ? '56px' : '48px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isCompleted || isActive ? '#3b82f6' : '#ffffff',
                        border: isPending ? '2px solid #d1d5db' : 'none',
                        boxShadow: isActive 
                          ? '0 0 0 6px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(0, 0, 0, 0.15)' 
                          : isCompleted 
                            ? '0 2px 8px rgba(59, 130, 246, 0.3)' 
                            : '0 2px 4px rgba(0, 0, 0, 0.1)',
                        fontSize: isActive ? '20px' : '18px',
                        fontWeight: '700',
                        color: isCompleted || isActive ? '#ffffff' : '#9ca3af',
                        transform: isActive ? 'scale(1)' : 'scale(1)'
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 
                          style={{ 
                            width: '28px', 
                            height: '28px',
                            strokeWidth: '2.5px'
                          }} 
                        />
                      ) : (
                        s
                      )}
                    </div>

                    {/* Label */}
                    <div 
                      className="mt-3 text-center transition-all duration-200"
                      style={{ 
                        fontSize: '13px',
                        fontWeight: isActive ? '600' : '500',
                        color: isActive ? '#1e40af' : isCompleted ? '#374151' : '#9ca3af',
                        lineHeight: '1.3',
                        maxWidth: '85px'
                      }}
                    >
                      {s === 1 && 'Your Business'}
                      {s === 2 && 'Your Focus'}
                      {s === 3 && 'Choose Agents'}
                      {s === 4 && 'All Set!'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Card */}
        <Card className="p-10" style={{ 
          backgroundColor: '#ffffff',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-10">
                <Building2 className="w-14 h-14 mx-auto mb-4" style={{ color: '#3b82f6' }} />
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#111827' }}>Welcome to FunnelAgents!</h2>
                <p className="text-base" style={{ color: '#6b7280' }}>Tell us about your business</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label 
                    className="text-sm font-semibold mb-2 block"
                    style={{ color: '#374151' }}
                  >
                    Business Name
                  </Label>
                  <Input
                    placeholder="Acme Marketing Agency"
                    value={userData.company_name}
                    onChange={(e) => setUserData({ ...userData, company_name: e.target.value })}
                    className="w-full transition-all duration-200"
                    style={{ 
                      backgroundColor: '#ffffff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '15px',
                      color: '#111827',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                    }}
                  />
                </div>

                <div>
                  <Label 
                    className="text-sm font-semibold mb-2 block"
                    style={{ color: '#374151' }}
                  >
                    Team Size
                  </Label>
                  <div className="relative">
                    <select
                      value={userData.team_size}
                      onChange={(e) => setUserData({ ...userData, team_size: e.target.value })}
                      className="w-full appearance-none cursor-pointer transition-all duration-200"
                      style={{ 
                        backgroundColor: '#ffffff',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '12px 40px 12px 16px',
                        fontSize: '15px',
                        color: userData.team_size ? '#111827' : '#9ca3af',
                        outline: 'none',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <option value="" style={{ color: '#9ca3af' }}>Select team size</option>
                      <option value="1-5" style={{ color: '#111827' }}>1-5 people</option>
                      <option value="6-20" style={{ color: '#111827' }}>6-20 people</option>
                      <option value="21-50" style={{ color: '#111827' }}>21-50 people</option>
                      <option value="51+" style={{ color: '#111827' }}>51+ people</option>
                    </select>
                    {/* Custom Dropdown Arrow */}
                    <div 
                      className="absolute right-4 top-1/2 pointer-events-none"
                      style={{ 
                        transform: 'translateY(-50%)',
                        color: '#6b7280'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-10">
                <Target className="w-14 h-14 mx-auto mb-4" style={{ color: '#3b82f6' }} />
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#111827' }}>Who are you?</h2>
                <p className="text-base" style={{ color: '#6b7280' }}>Help us tailor your experience</p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label 
                    className="text-sm font-semibold mb-2 block"
                    style={{ color: '#374151' }}
                  >
                    I am a...
                  </Label>
                  <div className="relative">
                    <select
                      value={userData.industry}
                      onChange={(e) => setUserData({ ...userData, industry: e.target.value })}
                      className="w-full appearance-none cursor-pointer transition-all duration-200"
                      style={{ 
                        backgroundColor: '#ffffff',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '12px 40px 12px 16px',
                        fontSize: '15px',
                        color: userData.industry ? '#111827' : '#9ca3af',
                        outline: 'none',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <option value="" style={{ color: '#9ca3af' }}>Select your role</option>
                      <option value="marketing_agency" style={{ color: '#111827' }}>Marketing Agency Owner</option>
                      <option value="small_business" style={{ color: '#111827' }}>Small Business Owner (running my own marketing)</option>
                    </select>
                    {/* Custom Dropdown Arrow */}
                    <div 
                      className="absolute right-4 top-1/2 pointer-events-none"
                      style={{ 
                        transform: 'translateY(-50%)',
                        color: '#6b7280'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <Label 
                    className="text-sm font-semibold mb-3 block"
                    style={{ color: '#374151' }}
                  >
                    Main Goals (Select all that apply)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Generate more leads', 'Create content faster', 'Automate campaigns', 'Improve SEO', 'Scale operations', 'Save time'].map((goal) => (
                      <button
                        key={goal}
                        onClick={() => {
                          const goals = userData.goals.includes(goal)
                            ? userData.goals.filter(g => g !== goal)
                            : [...userData.goals, goal];
                          setUserData({ ...userData, goals });
                        }}
                        className="p-4 text-left transition-all duration-200 font-medium"
                        style={{
                          backgroundColor: userData.goals.includes(goal) ? 'rgba(59, 130, 246, 0.08)' : '#ffffff',
                          border: userData.goals.includes(goal) ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                          borderRadius: '10px',
                          color: userData.goals.includes(goal) ? '#1e40af' : '#6b7280',
                          fontSize: '14px',
                          boxShadow: userData.goals.includes(goal) 
                            ? '0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05)' 
                            : '0 1px 2px rgba(0, 0, 0, 0.05)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          if (!userData.goals.includes(goal)) {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!userData.goals.includes(goal)) {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.backgroundColor = '#ffffff';
                          }
                        }}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Choose Agents */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-10">
                <Users className="w-14 h-14 mx-auto mb-4" style={{ color: '#3b82f6' }} />
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#111827' }}>Choose Your AI Agents</h2>
                <p className="text-base" style={{ color: '#6b7280' }}>Select agents to add to your workspace</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agentTemplates.map((agent) => {
                  const isSelected = selectedAgents.find(a => a.name === agent.name);
                  return (
                    <button
                      key={agent.name}
                      onClick={() => toggleAgent(agent)}
                      className="p-5 text-left transition-all duration-200"
                      style={{
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : '#ffffff',
                        border: isSelected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: isSelected 
                          ? '0 0 0 3px rgba(59, 130, 246, 0.1), 0 1px 3px rgba(0, 0, 0, 0.1)' 
                          : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.backgroundColor = '#ffffff';
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-3xl">{agent.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1" style={{ color: '#111827', fontSize: '16px' }}>{agent.name}</h3>
                          <p className="text-sm" style={{ color: '#6b7280', lineHeight: '1.5' }}>{agent.role}</p>
                          <span 
                            className="text-xs mt-2 inline-block px-2 py-1 rounded-full font-medium"
                            style={{ 
                              color: '#3b82f6',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)'
                            }}
                          >
                            {agent.domain}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: '#3b82f6' }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-sm font-medium" style={{ color: '#6b7280' }}>
                {selectedAgents.length} agent{selectedAgents.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="mb-6">
                <Zap className="w-16 h-16 mx-auto mb-4" style={{ color: '#3b82f6' }} />
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#111827' }}>You're All Set!</h2>
                <p className="text-base mb-6" style={{ color: '#6b7280' }}>
                  Your workspace is ready with {selectedAgents.length} AI agent{selectedAgents.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div 
                className="rounded-xl p-6 text-left"
                style={{ 
                  backgroundColor: '#f8fafc',
                  border: '2px solid #e5e7eb'
                }}
              >
                <h3 className="font-semibold mb-4 text-base" style={{ color: '#111827' }}>Next Steps:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#10b981' }} />
                    <span style={{ color: '#374151', fontSize: '15px' }}>Create your first client workspace</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#10b981' }} />
                    <span style={{ color: '#374151', fontSize: '15px' }}>Run your first AI agent task</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#10b981' }} />
                    <span style={{ color: '#374151', fontSize: '15px' }}>Build your first automation workflow</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: '2px solid #f3f4f6' }}>
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="px-6 py-3 font-medium transition-all duration-200"
              style={{ 
                color: step === 1 ? '#d1d5db' : '#6b7280',
                cursor: step === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-3 font-semibold transition-all duration-200"
                style={{
                  backgroundColor: canProceed() ? '#3b82f6' : '#e5e7eb',
                  color: canProceed() ? '#ffffff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '10px',
                  boxShadow: canProceed() ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none',
                  cursor: canProceed() ? 'pointer' : 'not-allowed'
                }}
                onMouseEnter={(e) => {
                  if (canProceed()) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canProceed()) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
                  }
                }}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="px-6 py-3 font-semibold transition-all duration-200"
                style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
                }}
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}