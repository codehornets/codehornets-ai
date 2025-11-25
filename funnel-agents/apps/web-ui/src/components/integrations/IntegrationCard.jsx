import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Settings, ExternalLink } from 'lucide-react';

export default function IntegrationCard({ integration, onConfigure, delay = 0 }) {
  const { name, description, icon: Icon, connected, category, url } = integration;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="glassmorphism-light border-slate-800/50 p-6 hover:border-blue-500/30 transition-all group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-700/50 transition-colors">
              <Icon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{name}</h3>
              <p className="text-slate-500 text-xs">{category}</p>
            </div>
          </div>
          {connected ? (
            <div className="flex items-center space-x-1 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-slate-500 text-sm">
              <XCircle className="w-4 h-4" />
              <span>Not Connected</span>
            </div>
          )}
        </div>

        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => onConfigure(integration)}
            className={connected 
              ? "flex-1 bg-slate-700 hover:bg-slate-600" 
              : "flex-1 bg-blue-600 hover:bg-blue-700"
            }
          >
            <Settings className="w-4 h-4 mr-2" />
            {connected ? 'Manage' : 'Connect'}
          </Button>
          {url && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(url, '_blank')}
              className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}