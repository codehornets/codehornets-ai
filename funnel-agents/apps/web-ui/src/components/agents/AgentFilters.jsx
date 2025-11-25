import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Grid, List, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AgentFilters({ 
  searchQuery, 
  setSearchQuery, 
  selectedDomain, 
  setSelectedDomain,
  selectedStatus,
  setSelectedStatus,
  selectedSkill,
  setSelectedSkill,
  availableSkills,
  viewMode,
  setViewMode 
}) {
  const domains = [
    'All Domains',
    'Offer',
    'Marketing',
    'Sales',
    'Fulfillment',
    'Feedback Loop',
    'Operations',
    'Customer Support',
    'Leadership',
    'Innovation',
    'Enablement'
  ];

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center space-x-3 flex-1 w-full md:w-auto">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Domain Filter */}
        <Select value={selectedDomain} onValueChange={setSelectedDomain}>
          <SelectTrigger className="w-48" style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}>
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-medium)'
          }}>
            {domains.map((domain) => (
              <SelectItem 
                key={domain} 
                value={domain}
                className="focus:bg-[var(--bg-surface-hover)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                {domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-36" style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border-medium)'
          }}>
            <SelectItem value="all" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
              All Status
            </SelectItem>
            <SelectItem value="active" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
              Active
            </SelectItem>
            <SelectItem value="inactive" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
              Inactive
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Skills Filter */}
        {availableSkills.length > 0 && (
          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger className="w-48" style={{ 
              backgroundColor: 'var(--bg-surface)', 
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)'
            }}>
              <SelectValue placeholder="All Skills" />
            </SelectTrigger>
            <SelectContent style={{ 
              backgroundColor: 'var(--bg-surface)', 
              border: '1px solid var(--border-medium)'
            }}>
              <SelectItem value="all" className="focus:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-secondary)' }}>
                All Skills
              </SelectItem>
              {availableSkills.map((skill) => (
                <SelectItem 
                  key={skill} 
                  value={skill}
                  className="focus:bg-[var(--bg-surface-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {skill}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex items-center space-x-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="icon"
          onClick={() => setViewMode('grid')}
          className={viewMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-[var(--bg-surface-hover)]'}
          style={viewMode !== 'grid' ? { 
            border: '1px solid var(--border-medium)', 
            color: 'var(--text-muted)' 
          } : {}}
        >
          <Grid className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="icon"
          onClick={() => setViewMode('list')}
          className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-[var(--bg-surface-hover)]'}
          style={viewMode !== 'list' ? { 
            border: '1px solid var(--border-medium)', 
            color: 'var(--text-muted)' 
          } : {}}
        >
          <List className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}