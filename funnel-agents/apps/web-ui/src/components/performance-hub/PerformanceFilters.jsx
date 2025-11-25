import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, ArrowUpDown } from 'lucide-react';

export default function PerformanceFilters({ filters, onFilterChange }) {
  const domains = [
    'all',
    'Offer',
    'Marketing',
    'Sales',
    'Fulfillment',
    'Feedback Loop',
    'Operations',
    'Customer Support',
    'Leadership',
    'Innovation',
  ];

  const updateFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <Card className="p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Filters:</span>
        </div>

        {/* Domain Filter */}
        <Select value={filters.domain} onValueChange={(value) => updateFilter('domain', value)}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {domains.map(domain => (
              <SelectItem 
                key={domain} 
                value={domain}
                className="text-slate-300 focus:bg-slate-700 focus:text-white"
              >
                {domain === 'all' ? 'All Domains' : domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              All Status
            </SelectItem>
            <SelectItem value="active" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Active
            </SelectItem>
            <SelectItem value="inactive" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Inactive
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Performance Filter */}
        <Select value={filters.performance} onValueChange={(value) => updateFilter('performance', value)}>
          <SelectTrigger className="w-44 bg-slate-800/50 border-slate-700 text-white">
            <SelectValue placeholder="Performance" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              All Performance
            </SelectItem>
            <SelectItem value="excellent" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Excellent
            </SelectItem>
            <SelectItem value="good" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Good
            </SelectItem>
            <SelectItem value="average" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Average
            </SelectItem>
            <SelectItem value="needs_improvement" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Needs Improvement
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="h-6 w-px bg-slate-700" />

        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sort by:</span>
        </div>

        {/* Sort By */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="success_rate" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Success Rate
            </SelectItem>
            <SelectItem value="tasks" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Total Tasks
            </SelectItem>
            <SelectItem value="feedback" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Feedback Rating
            </SelectItem>
            <SelectItem value="recent" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Recent Performance
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order */}
        <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value)}>
          <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="desc" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              High to Low
            </SelectItem>
            <SelectItem value="asc" className="text-slate-300 focus:bg-slate-700 focus:text-white">
              Low to High
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onFilterChange({
            domain: 'all',
            status: 'all',
            performance: 'all',
            sortBy: 'success_rate',
            sortOrder: 'desc',
          })}
          className="ml-auto border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          Reset
        </Button>
      </div>
    </Card>
  );
}