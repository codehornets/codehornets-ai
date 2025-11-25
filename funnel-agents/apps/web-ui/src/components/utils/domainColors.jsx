/**
 * Domain Color Design Tokens
 * 
 * Consistent color system for all 11 business domains across the app.
 * Used in: Domain Health cards, donut charts, legends, badges, filters.
 * 
 * Color Mapping (WCAG-compliant on dark backgrounds):
 * - Offer: Green (growth, opportunity)
 * - Marketing: Orange (energy, creativity)
 * - Sales: Blue (trust, conversion)
 * - Fulfillment: Teal (delivery, execution)
 * - Feedback Loop: Yellow (attention, iteration)
 * - Operations: Purple (systems, infrastructure)
 * - Customer Support: Cyan (care, communication)
 * - Leadership: Magenta (vision, strategy)
 * - Innovation: Pink (experimentation, R&D)
 * - Enablement: Lime (empowerment, training)
 * - Business Development: Indigo (partnerships, expansion)
 */
export const domainColors = {
  'Offer': {
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
    solid: '#22c55e', // green-500 for charts
    hover: 'hover:bg-green-500/20'
  },
  'Marketing': {
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    solid: '#f97316', // orange-500
    hover: 'hover:bg-orange-500/20'
  },
  'Sales': {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    solid: '#3b82f6', // blue-500
    hover: 'hover:bg-blue-500/20'
  },
  'Fulfillment': {
    gradient: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    text: 'text-teal-400',
    solid: '#14b8a6', // teal-500
    hover: 'hover:bg-teal-500/20'
  },
  'Feedback Loop': {
    gradient: 'from-yellow-500 to-yellow-600',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    text: 'text-yellow-400',
    solid: '#eab308', // yellow-500
    hover: 'hover:bg-yellow-500/20'
  },
  'Operations': {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    solid: '#a855f7', // purple-500
    hover: 'hover:bg-purple-500/20'
  },
  'Customer Support': {
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    solid: '#06b6d4', // cyan-500
    hover: 'hover:bg-cyan-500/20'
  },
  'Leadership': {
    gradient: 'from-fuchsia-500 to-fuchsia-600',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/20',
    text: 'text-fuchsia-400',
    solid: '#d946ef', // fuchsia-500 (magenta)
    hover: 'hover:bg-fuchsia-500/20'
  },
  'Innovation': {
    gradient: 'from-pink-500 to-pink-600',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    text: 'text-pink-400',
    solid: '#ec4899', // pink-500
    hover: 'hover:bg-pink-500/20'
  },
  'Enablement': {
    gradient: 'from-lime-500 to-lime-600',
    bg: 'bg-lime-500/10',
    border: 'border-lime-500/20',
    text: 'text-lime-400',
    solid: '#84cc16', // lime-500
    hover: 'hover:bg-lime-500/20'
  },
  'Business Development': {
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    solid: '#6366f1', // indigo-500
    hover: 'hover:bg-indigo-500/20'
  },
};

export const getDomainColor = (domain) => {
  return domainColors[domain] || domainColors['Offer'];
};