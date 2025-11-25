import React from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { MoreVertical, Power, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDomainColor } from '@/components/utils/domainColors';

export default function AgentCard({ agent, onClick, onToggleStatus, delay = 0 }) {
  const domainColor = getDomainColor(agent.domain);
  const gradient = domainColor.gradient;
  const [isHovered, setIsHovered] = React.useState(false);

  // Generate initials from agent name
  const getInitials = (name) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return words[0][0] + words[words.length - 1][0];
    }
    return name.substring(0, 2);
  };

  const initials = getInitials(agent.name).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.2s ease'
      }}
    >
      <Card 
        className="cursor-pointer group relative overflow-hidden h-full transition-all"
        onClick={() => onClick(agent)}
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          padding: '18px'
        }}
      >
        <div className="relative">
          {/* Header with Avatar and Actions */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <span className="text-white font-semibold text-sm">{initials}</span>
                </div>
                {agent.status === 'active' && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2" style={{ borderColor: 'var(--bg-card)' }}></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold truncate transition-colors" style={{ 
                    color: 'var(--text-primary)',
                    fontSize: '15px'
                  }}>
                    {agent.name}
                  </h3>
                </div>
                <p className="mt-0.5 line-clamp-1" style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: '12px'
                }}>{agent.role}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-[var(--bg-surface-hover)] opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ 
                backgroundColor: 'var(--bg-surface)', 
                border: '1px solid var(--border-medium)' 
              }}>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(agent);
                  }}
                  className="focus:bg-[var(--bg-surface-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Power className="w-4 h-4 mr-2" />
                  {agent.status === 'active' ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Domain Tag and Skills */}
          <div className="mb-3 space-y-2">
            <span 
              className="inline-flex items-center rounded-full font-medium"
              style={{
                backgroundColor: `${domainColor.solid}1A`,
                color: domainColor.solid,
                border: `1px solid ${domainColor.solid}33`,
                fontSize: '11px',
                padding: '4px 10px'
              }}
            >
              {agent.domain}
            </span>

            {/* Skills Pills */}
            {agent.skills && agent.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {agent.skills.slice(0, 2).map((skill, idx) => {
                  const skillName = typeof skill === 'string' ? skill : skill.name;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full font-medium"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-muted)',
                        fontSize: '10px',
                        padding: '2px 8px'
                      }}
                    >
                      {skillName}
                    </span>
                  );
                })}
                {agent.skills.length > 2 && (
                  <span
                    className="inline-flex items-center rounded-full font-medium"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-muted)',
                      fontSize: '10px',
                      padding: '2px 8px'
                    }}
                  >
                    +{agent.skills.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <div className="mb-0.5" style={{ 
                color: '#9CA3AF',
                fontSize: '11px'
              }}>Success Rate</div>
              <p className="font-medium" style={{ 
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}>{agent.success_rate || 0}%</p>
            </div>
            <div>
              <div className="mb-0.5" style={{ 
                color: '#9CA3AF',
                fontSize: '11px'
              }}>Tasks Done</div>
              <p className="font-medium" style={{ 
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}>{agent.tasks_completed || 0}</p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}