import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, BookOpen, ExternalLink,
  Target, CheckCircle2, XCircle, Lightbulb, Sparkles, GraduationCap, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import client from '@/api/client';
import { toast } from 'sonner';

const DOMAIN_REQUIRED_SKILLS = {
  'Marketing': {
    required: ['SEO', 'Content Writing', 'Social Media', 'Email Marketing', 'Analytics'],
    recommended: ['PPC Advertising', 'Copywriting', 'Brand Strategy', 'Market Research']
  },
  'Sales': {
    required: ['Lead Generation', 'Sales Outreach', 'CRM', 'Negotiation', 'Cold Calling'],
    recommended: ['Account Management', 'Proposal Writing', 'Data Analysis']
  },
  'Fulfillment': {
    required: ['Project Management', 'Quality Control', 'Client Communication', 'Time Management'],
    recommended: ['Process Optimization', 'Resource Planning', 'Risk Management']
  },
  'Customer Support': {
    required: ['Customer Service', 'Problem Solving', 'Communication', 'Empathy', 'Technical Support'],
    recommended: ['Conflict Resolution', 'Product Knowledge', 'CRM']
  },
  'Operations': {
    required: ['Process Management', 'Data Analysis', 'Planning', 'Coordination'],
    recommended: ['Automation', 'Reporting', 'Budget Management']
  },
  'Offer': {
    required: ['Market Research', 'Competitive Analysis', 'Product Strategy', 'Pricing'],
    recommended: ['Business Model Design', 'Value Proposition', 'Customer Research']
  },
  'Feedback Loop': {
    required: ['Data Analysis', 'Customer Insights', 'Reporting', 'Communication'],
    recommended: ['Survey Design', 'Metrics Tracking', 'Recommendation Systems']
  },
  'Leadership': {
    required: ['Strategic Planning', 'Decision Making', 'Team Management', 'Vision Setting'],
    recommended: ['Change Management', 'Communication', 'Coaching']
  },
  'Innovation': {
    required: ['Creative Thinking', 'Research', 'Trend Analysis', 'Prototyping'],
    recommended: ['Design Thinking', 'Technology Assessment', 'Experimentation']
  },
};

const TRAINING_RESOURCES = {
  'SEO': [
    { title: 'Moz SEO Learning Center', url: 'https://moz.com/learn/seo', type: 'Course' },
    { title: 'Google SEO Starter Guide', url: 'https://developers.google.com/search/docs', type: 'Guide' },
  ],
  'Content Writing': [
    { title: 'Content Marketing Institute', url: 'https://contentmarketinginstitute.com', type: 'Resources' },
    { title: 'Copyblogger Training', url: 'https://copyblogger.com', type: 'Blog' },
  ],
  'Lead Generation': [
    { title: 'HubSpot Lead Gen Guide', url: 'https://academy.hubspot.com', type: 'Course' },
    { title: 'LinkedIn Sales Navigator Training', url: 'https://business.linkedin.com/sales-solutions', type: 'Tool' },
  ],
  'Project Management': [
    { title: 'PMI Certification', url: 'https://www.pmi.org', type: 'Certification' },
    { title: 'Asana Project Management Guide', url: 'https://asana.com/guide', type: 'Guide' },
  ],
  'Data Analysis': [
    { title: 'Google Analytics Academy', url: 'https://analytics.google.com/analytics/academy', type: 'Course' },
    { title: 'Coursera Data Analysis', url: 'https://www.coursera.org', type: 'Course' },
  ],
};

export default function SkillGapAnalysis({ agents, tasks }) {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [trainingSuggestions, setTrainingSuggestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const analyzeSkillGaps = (agent) => {
    const domainRequirements = DOMAIN_REQUIRED_SKILLS[agent.domain] || { required: [], recommended: [] };
    const currentSkills = agent.skills || [];
    const currentSkillNames = currentSkills.map(s => s.name.toLowerCase());

    const missingRequired = domainRequirements.required.filter(
      req => !currentSkillNames.some(skill => skill.includes(req.toLowerCase()) || req.toLowerCase().includes(skill))
    );

    const missingRecommended = domainRequirements.recommended.filter(
      rec => !currentSkillNames.some(skill => skill.includes(rec.toLowerCase()) || rec.toLowerCase().includes(skill))
    );

    const matchingSkills = currentSkills.filter(skill =>
      domainRequirements.required.some(req => 
        skill.name.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(skill.name.toLowerCase())
      )
    );

    const underperformingSkills = matchingSkills.filter(s => s.level === 'beginner');
    const proficientSkills = matchingSkills.filter(s => s.level === 'expert' || s.level === 'intermediate');

    const skillCoverageScore = domainRequirements.required.length > 0
      ? ((domainRequirements.required.length - missingRequired.length) / domainRequirements.required.length) * 100
      : 100;

    return {
      missingRequired,
      missingRecommended,
      underperformingSkills,
      proficientSkills,
      skillCoverageScore,
      totalRequired: domainRequirements.required.length,
    };
  };

  const agentsWithGaps = agents.map(agent => ({
    ...agent,
    gapAnalysis: analyzeSkillGaps(agent),
  })).filter(a => 
    a.gapAnalysis.missingRequired.length > 0 || 
    a.gapAnalysis.underperformingSkills.length > 0
  );

  const getTrainingRecommendations = (skillName) => {
    const exactMatch = TRAINING_RESOURCES[skillName];
    if (exactMatch) return exactMatch;

    const partialMatch = Object.keys(TRAINING_RESOURCES).find(key =>
      key.toLowerCase().includes(skillName.toLowerCase()) || skillName.toLowerCase().includes(key.toLowerCase())
    );

    return partialMatch ? TRAINING_RESOURCES[partialMatch] : [];
  };

  const handleGenerateAITraining = async (agent) => {
    setIsGenerating(true);
    const skillGaps = [
      ...agent.gapAnalysis.missingRequired.map(skill => ({
        skill,
        current_level: 'none',
        required_level: 'intermediate'
      })),
      ...agent.gapAnalysis.underperformingSkills.map(skill => ({
        skill: skill.name,
        current_level: skill.level,
        required_level: 'expert'
      }))
    ];

    try {
      const response = await client.functions.invoke('generateTrainingSuggestions', {
        agent_id: agent.id,
        skill_gaps: skillGaps,
        agent_role: agent.role,
        agent_domain: agent.domain
      });
      setTrainingSuggestions(response.data);
      toast.success('AI training plan generated');
    } catch (error) {
      toast.error('Failed to generate training plan');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderAgentCard = (agent) => {
    const { gapAnalysis } = agent;
    const criticalGaps = gapAnalysis.missingRequired.length;
    const needsImprovement = gapAnalysis.underperformingSkills.length;

    return (
      <Card
        key={agent.id}
        className="p-4 hover:shadow-lg transition-all cursor-pointer"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
        onClick={() => setSelectedAgent(agent)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {agent.name}
            </h4>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {agent.role} • {agent.domain}
            </p>
          </div>
          {criticalGaps > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              {criticalGaps} critical
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--text-muted)' }}>Skill Coverage</span>
              <span className={gapAnalysis.skillCoverageScore >= 80 ? 'text-green-400' : 'text-orange-400'}>
                {gapAnalysis.skillCoverageScore.toFixed(0)}%
              </span>
            </div>
            <Progress value={gapAnalysis.skillCoverageScore} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-xs pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span className="flex items-center text-red-400">
              <XCircle className="w-3 h-3 mr-1" />
              {criticalGaps} missing
            </span>
            <span className="flex items-center text-orange-400">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {needsImprovement} needs work
            </span>
            <span className="flex items-center text-green-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {gapAnalysis.proficientSkills.length} proficient
            </span>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Agents with Skill Gaps</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{agentsWithGaps.length}</p>
        </Card>

        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-orange-400" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Critical Gaps</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">
            {agentsWithGaps.reduce((sum, a) => sum + a.gapAnalysis.missingRequired.length, 0)}
          </p>
        </Card>

        <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center space-x-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Training Opportunities</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {agentsWithGaps.reduce((sum, a) => 
              sum + a.gapAnalysis.missingRequired.length + a.gapAnalysis.underperformingSkills.length, 0
            )}
          </p>
        </Card>
      </div>

      {/* Agent List or Detail View */}
      {!selectedAgent ? (
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Agents Requiring Skill Development
          </h3>
          {agentsWithGaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agentsWithGaps.map(renderAgentCard)}
            </div>
          ) : (
            <Card className="p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                All Agents Fully Skilled! 🎉
              </h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                No critical skill gaps detected across your agent team
              </p>
            </Card>
          )}
        </div>
      ) : (
        // Detailed View for Selected Agent
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedAgent(null);
              setTrainingSuggestions(null);
            }}
            style={{ color: 'var(--text-secondary)' }}
          >
            ← Back to Overview
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => handleGenerateAITraining(selectedAgent)}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'AI Training Plan'}
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('AgentDetail') + `?id=${selectedAgent.id}&tab=settings`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Skills
            </Button>
          </div>
        </div>

          <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {selectedAgent.name}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {selectedAgent.role} • {selectedAgent.domain}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Skill Coverage</p>
                <p className="text-2xl font-bold text-blue-400">
                  {selectedAgent.gapAnalysis.skillCoverageScore.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Critical Missing Skills */}
            {selectedAgent.gapAnalysis.missingRequired.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Critical Missing Skills
                  </h4>
                </div>
                <div className="space-y-3">
                  {selectedAgent.gapAnalysis.missingRequired.map((skill, idx) => {
                    const resources = getTrainingRecommendations(skill);
                    return (
                      <Card key={idx} className="p-4 bg-red-500/5 border-red-500/20">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-red-400">{skill}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                              Required for {selectedAgent.domain} domain
                            </p>
                          </div>
                          <Badge className="bg-red-500/20 text-red-400">Critical</Badge>
                        </div>
                        {resources.length > 0 && (
                          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                              Recommended Training:
                            </p>
                            <div className="space-y-2">
                              {resources.map((resource, rIdx) => (
                                <a
                                  key={rIdx}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 rounded hover:bg-slate-700/30 transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    <BookOpen className="w-3 h-3 text-blue-400" />
                                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                                      {resource.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                                      {resource.type}
                                    </Badge>
                                    <ExternalLink className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Skills Needing Improvement */}
            {selectedAgent.gapAnalysis.underperformingSkills.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Skills to Improve
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedAgent.gapAnalysis.underperformingSkills.map((skill, idx) => (
                    <Card key={idx} className="p-3 bg-orange-500/5 border-orange-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {skill.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Current: Beginner → Target: Expert
                          </p>
                        </div>
                        <Badge className="bg-orange-500/20 text-orange-400">Improve</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Skills */}
            {selectedAgent.gapAnalysis.missingRecommended.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Recommended Skills
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.gapAnalysis.missingRecommended.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  These skills would enhance performance but are not critical
                </p>
              </div>
            )}
          </Card>

          {/* AI Training Plan */}
          {trainingSuggestions && (
            <Card className="p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center space-x-2 mb-6">
                <GraduationCap className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  AI-Generated Training Plan
                </h3>
              </div>

              {/* Training Plan Overview */}
              {trainingSuggestions.training_suggestions.training_plan && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Estimated Duration
                      </span>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {trainingSuggestions.training_suggestions.training_plan.estimated_duration}
                    </Badge>
                  </div>
                  {trainingSuggestions.training_suggestions.learning_path && (
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {trainingSuggestions.training_suggestions.learning_path}
                    </p>
                  )}
                </div>
              )}

              {/* Training Modules by Skill */}
              <div className="space-y-6">
                {trainingSuggestions.training_suggestions.recommendations?.map((rec, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-purple-400" />
                        <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {rec.skill}
                        </h4>
                      </div>
                      <Badge className={`text-xs ${
                        rec.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                        rec.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {rec.priority} priority
                      </Badge>
                    </div>

                    {/* Training Modules */}
                    {rec.training_modules?.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {rec.training_modules.map((module, mIdx) => (
                          <Card key={mIdx} className="p-4 hover:shadow-md transition-all" style={{ 
                            backgroundColor: 'var(--bg-surface)', 
                            border: '1px solid var(--border-subtle)' 
                          }}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <BookOpen className="w-4 h-4 text-blue-400" />
                                  <h5 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {module.title}
                                  </h5>
                                </div>
                                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                                  {module.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                                  {module.provider}
                                </Badge>
                                <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                                  {module.type}
                                </Badge>
                                <Badge className={`text-xs ${
                                  module.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                                  module.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {module.difficulty}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                <Clock className="w-3 h-3" />
                                <span>{module.duration}</span>
                                <span>•</span>
                                <span className={module.cost === 'free' ? 'text-green-400' : 'text-blue-400'}>
                                  {module.cost}
                                </span>
                                {module.url && (
                                  <a 
                                    href={module.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-400 hover:text-blue-300"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Practical Exercises */}
                    {rec.practical_exercises?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Practical Exercises:
                        </p>
                        <ul className="space-y-1">
                          {rec.practical_exercises.map((exercise, eIdx) => (
                            <li key={eIdx} className="flex items-start space-x-2 text-xs">
                              <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                              <span style={{ color: 'var(--text-secondary)' }}>{exercise}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Milestones */}
                    {rec.milestones?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                          Success Milestones:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {rec.milestones.map((milestone, mIdx) => (
                            <Badge key={mIdx} variant="outline" className="text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                              {milestone}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {idx < trainingSuggestions.training_suggestions.recommendations.length - 1 && (
                      <div className="mt-6 mb-6" style={{ borderTop: '1px solid var(--border-subtle)' }} />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}