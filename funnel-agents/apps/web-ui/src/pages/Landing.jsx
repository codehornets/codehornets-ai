import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Users, Clock, Play } from 'lucide-react';
import client from '@/api/client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    try {
      const isAuth = await client.auth.isAuthenticated();
      if (isAuth) {
        try {
          const user = await client.auth.me();
          if (user && user.onboarding_completed) {
            navigate(createPageUrl('Dashboard'));
          } else {
            navigate(createPageUrl('Onboarding'));
          }
        } catch (error) {
          // If we can't get user info, redirect to onboarding
          navigate(createPageUrl('Onboarding'));
        }
      } else {
        // Not authenticated, go to login
        navigate('/login', { state: { returnUrl: createPageUrl('Onboarding') } });
      }
    } catch (error) {
      // On error, go to login
      navigate('/login', { state: { returnUrl: createPageUrl('Onboarding') } });
    }
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleWatchDemo = () => {
    // TODO: Implement demo video modal or link
    console.log('Watch demo clicked');
  };

  const capabilities = [
    'Market research and competitor analysis',
    'Content creation and copywriting',
    'SEO optimization and keyword research',
    'Lead qualification and scoring',
    'Email campaign management',
    'Campaign performance reporting'
  ];

  const stats = [
    { value: '40+ hours', label: 'Saved per week on average' },
    { value: '95%', label: 'Task completion rate' },
    { value: '10x', label: 'Faster than manual execution' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-bold text-sm">F</span>
            </div>
            <span className="text-white font-semibold text-lg">FunnelAgents</span>
          </div>
          <Button onClick={handleSignIn} variant="ghost" className="text-white hover:bg-white/5">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center pt-32 pb-20">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
            Marketing operations<br />that run themselves
          </h1>
          
          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Deploy specialized agents to handle research, content creation, and lead management. 
            Build once, automate forever.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Button onClick={handleGetStarted} size="lg" className="bg-white text-black hover:bg-white/90 h-12 px-8 font-medium">
              Get started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button onClick={handleWatchDemo} size="lg" variant="ghost" className="text-white hover:bg-white/5 h-12 px-8 font-medium">
              <Play className="w-4 h-4 mr-2" />
              Watch demo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-32 pb-32 border-b border-white/5">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-5xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
            {/* Left Column */}
            <div>
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-6">
                What it does
              </h2>
              <h3 className="text-4xl font-bold text-white mb-6 leading-tight">
                Agents that handle the work you'd rather not
              </h3>
              <p className="text-lg text-white/60 mb-8 leading-relaxed">
                Deploy pre-configured agents for the most time-consuming parts of marketing operations. 
                They execute tasks autonomously, report results, and improve over time.
              </p>
              <div className="space-y-4">
                {capabilities.map((capability, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                    <span className="text-white/80">{capability}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Simple Preview */}
            <div>
              <div className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-white/20"></div>
                  <div className="w-3 h-3 rounded-full bg-white/20"></div>
                  <div className="w-3 h-3 rounded-full bg-white/20"></div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white/60" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">Sarah Chen</div>
                        <div className="text-white/40 text-xs">Market Researcher</div>
                      </div>
                    </div>
                    <div className="text-xs text-white/40">Running</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white/60" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">Marcus Rivera</div>
                        <div className="text-white/40 text-xs">Content Creator</div>
                      </div>
                    </div>
                    <div className="text-xs text-white/40">Completed</div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white/60" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">David Kim</div>
                        <div className="text-white/40 text-xs">Lead Qualifier</div>
                      </div>
                    </div>
                    <div className="text-xs text-white/40">Queued</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Section */}
        <div className="max-w-6xl mx-auto py-32 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <div className="bg-white/[0.02] rounded-lg border border-white/5 p-8">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold text-white mb-2">12</div>
                  <div className="text-sm text-white/40">Active agents</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-2">156</div>
                  <div className="text-sm text-white/40">Tasks this week</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-2">95%</div>
                  <div className="text-sm text-white/40">Success rate</div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="h-32 flex items-end gap-2">
                  {[40, 65, 55, 80, 70, 90, 100].map((height, i) => (
                    <div key={i} className="flex-1 bg-white/10 rounded-t" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-6">
                Monitoring
              </h2>
              <h3 className="text-4xl font-bold text-white mb-6 leading-tight">
                Full visibility into every task
              </h3>
              <p className="text-lg text-white/60 leading-relaxed">
                Track completion rates, execution time, and output quality. Review agent work before 
                it goes to clients. Set approval workflows for high-stakes deliverables.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center py-32 border-t border-white/5">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Start with one agent.<br />Scale to a full team.
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Deploy your first marketing agent in under 10 minutes. No credit card required.
          </p>
          <Button onClick={handleGetStarted} size="lg" className="bg-white text-black hover:bg-white/90 h-12 px-8 font-medium">
            Get started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-32">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center">
                <span className="text-black font-bold text-xs">F</span>
              </div>
              <span className="text-white/60 text-sm">© 2025 FunnelAgents</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/40">
              <Link
                to="/Documentation"
                className="hover:text-white/60 transition-colors"
              >
                Documentation
              </Link>
              <Link
                to="/ApiDocs"
                className="hover:text-white/60 transition-colors"
              >
                API
              </Link>
              <Link
                to="/Support"
                className="hover:text-white/60 transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}