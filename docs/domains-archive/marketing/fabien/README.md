# Fabien - Marketing Assistant

Fabien is a specialized marketing assistant focused on content strategy, brand messaging, and growth marketing, built on Claude Code using the CLAUDE.md customization approach.

## Quick Start

```bash
# Launch Fabien
make fabien
```

## Directory Structure

```
fabien/
├── templates/
│   └── FABIEN.md      # Fabien's behavior configuration (THE KEY FILE)
├── launchers/
│   └── fabien.sh      # Launch script
├── docs/             # Documentation
└── tests/            # Test suite
```

## How It Works

Fabien uses the **CLAUDE.md approach** - the official, supported way to customize Claude Code:

1. **FABIEN.md** - Defines Fabien's marketing expertise and personality
2. **fabien.sh** - Ensures FABIEN.md is copied to workspace as CLAUDE.md
3. **Claude Code** - Reads CLAUDE.md and becomes Fabien

**No CLI modification needed!** This approach:
- ✅ Works perfectly with authentication
- ✅ Survives Claude Code updates
- ✅ Uses official customization method
- ✅ No risk of breaking changes

## Features

### Content Strategy & Creation
- Compelling copywriting for all channels
- Blog posts, social media content, email campaigns
- Content calendars and editorial planning
- SEO-optimized content

### Social Media Marketing
- Platform-specific strategies (LinkedIn, Instagram, Twitter/X, Facebook, TikTok)
- Content planning and scheduling
- Engagement strategies
- Community building

### Brand Development
- Brand messaging and positioning
- Voice and tone guidelines
- Value proposition development
- Differentiation strategy

### Email Marketing
- Campaign creation and automation
- Segmentation strategies
- A/B testing and optimization
- Performance analysis

### SEO & Content Marketing
- Keyword research and strategy
- On-page and technical SEO
- Content optimization
- Link building strategies

### Campaign Management
- Campaign planning and execution
- Multi-channel strategies
- Budget allocation
- Performance tracking

### Analytics & Optimization
- Performance metrics and KPIs
- A/B testing strategies
- Conversion optimization
- ROI analysis

### Growth Marketing
- Acquisition strategies (organic and paid)
- Retention and loyalty programs
- Referral programs
- Viral marketing tactics

## Marketing Channels

Fabien understands:
- **Organic**: SEO, content marketing, social media
- **Paid**: Google Ads, Facebook Ads, LinkedIn Ads, display
- **Email**: Newsletters, automation, lifecycle marketing
- **Social**: All major platforms and strategies
- **PR**: Media relations, thought leadership
- **Partnerships**: Co-marketing, affiliates, referrals

## Tools & Platforms

Familiar with:
- Marketing automation (HubSpot, Mailchimp, ActiveCampaign)
- SEO tools (SEMrush, Ahrefs, Moz)
- Social media management (Hootsuite, Buffer, Sprout Social)
- Analytics (Google Analytics, social insights)
- Design (Canva, Adobe Creative Suite basics)

## Usage

### Launch Fabien
```bash
make fabien
```

### Create New Workspace
```bash
make create-workspace domain=marketing project=campaign-2024
cd workspaces/marketing/campaign-2024
../../../domains/marketing/fabien/launchers/fabien.sh
```

### Fabien introduces himself
```
═══════════════════════════════════════════════
  📈🎯📈   Fabien v1.0
  ✨🚀✨   Marketing Assistant
           Powered by Claude Code
═══════════════════════════════════════════════

Hi! I'm Fabien, your marketing assistant! 📈
I'm here to help you with:
- Content strategy and copywriting
- Social media planning and management
- Brand messaging and positioning
- Marketing campaigns and funnels
- SEO and content marketing
- Email marketing and automation
- Analytics and performance tracking
- Customer personas and journey mapping
- A/B testing and optimization
- Growth marketing strategies

What marketing challenge are you working on?
```

## Example Interactions

### Content Creation
```
You: I need social media posts for a product launch

Fabien: Let's create a launch campaign! 📈

[Provides:]
- Platform-specific content strategy
- Sample posts for each channel
- Optimal posting schedule
- Hashtag recommendations
- Engagement tactics
```

### Campaign Strategy
```
You: We want to increase email signups

Fabien: Let's build a lead generation campaign! 🎯

[Discusses:]
- Lead magnet ideas
- Landing page optimization
- Ad creative and targeting
- Email welcome series
- Conversion tracking
```

### SEO Optimization
```
You: How do I rank for "best project management software"?

Fabien: Let's build an SEO strategy! 🔍

[Analyzes:]
- Keyword difficulty and opportunity
- Content structure recommendations
- On-page optimization checklist
- Link building strategies
- Content calendar for supporting posts
```

## Technical Details

### The CLAUDE.md Approach

Fabien doesn't modify the Claude Code CLI. Instead, he uses CLAUDE.md:

```markdown
# In workspace/CLAUDE.md:
You are Claude Code, Anthropic's official CLI for Claude.

**Primary Role**: Introduce yourself as Fabien, a marketing assistant...
```

This is the **official, recommended way** to customize Claude Code behavior.

## Workspace Structure

When you launch Fabien, your workspace looks like:

```
workspaces/marketing/campaign-2024/
├── CLAUDE.md              # Fabien's configuration (from FABIEN.md)
├── content/               # Content drafts and assets
├── campaigns/             # Campaign plans and briefs
├── analytics/             # Performance reports
├── brand/                 # Brand guidelines and assets
└── README.md              # Campaign overview
```

## Marketing Philosophy

Fabien follows these principles:

1. **Audience-first** - Always create for your audience, not yourself
2. **Data-driven decisions** - Let metrics guide strategy
3. **Provide value** - 80% helpful content, 20% promotional
4. **Test and optimize** - Always be testing
5. **Authenticity matters** - Be genuine and transparent
6. **Mobile-first** - Most content is consumed on mobile
7. **Quality over quantity** - Better to excel on few channels
8. **Story sells** - Facts tell, stories sell

## Content 80/20 Rule

- 80% valuable, educational, entertaining content
- 20% promotional content

Mix content types:
- Educational posts
- Entertaining content
- Inspiring stories
- Behind-the-scenes
- User-generated content
- Product highlights

## Metrics That Matter

### Awareness
- Website traffic, reach, impressions, brand mentions

### Engagement
- Time on site, social engagement, email opens/clicks

### Conversion
- Conversion rate, CPA, ROAS, lead quality

### Retention
- CLV, churn rate, repeat purchase rate, NPS

## See Also

- [CLAUDE.md specification](https://docs.anthropic.com/claude-code)
- [Workspace system](../../../workspaces/README.md)
- [Domain guidelines](../../README.md)
