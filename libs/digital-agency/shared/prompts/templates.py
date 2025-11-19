"""
Prompt template management.

Provides template system for creating consistent, reusable prompts
with variable substitution and formatting.
"""

from typing import Any, Dict, Optional
from string import Template

from pydantic import BaseModel

from core.logger import get_logger


class PromptTemplate(BaseModel):
    """Represents a prompt template with variables."""

    name: str
    description: str
    template: str
    variables: list[str] = []
    default_values: Dict[str, Any] = {}
    category: Optional[str] = None
    tags: list[str] = []

    def render(self, **kwargs) -> str:
        """
        Render template with provided variables.

        Args:
            **kwargs: Template variables

        Returns:
            str: Rendered prompt
        """
        # Merge with defaults
        values = {**self.default_values, **kwargs}

        # Use string Template for safe substitution
        template = Template(self.template)

        try:
            return template.safe_substitute(**values)
        except Exception as e:
            logger = get_logger("prompt_template")
            logger.error(f"Failed to render template {self.name}: {e}")
            return self.template


class PromptRegistry:
    """
    Registry for managing prompt templates.

    Provides centralized storage and retrieval of prompt templates
    used across the platform.
    """

    def __init__(self):
        """Initialize prompt registry."""
        self.logger = get_logger("prompt_registry")
        self.templates: Dict[str, PromptTemplate] = {}
        self._initialize_default_templates()

    def _initialize_default_templates(self):
        """Initialize default prompt templates."""

        # Lead Research Template
        self.register(
            PromptTemplate(
                name="lead_researcher",
                description="System prompt for lead research agent",
                template="""You are an expert lead researcher for a digital marketing agency.

Your role is to:
- Research companies and identify potential leads based on ideal customer profile
- Gather firmographic and technographic data
- Assess company fit and potential value
- Provide detailed research reports

Guidelines:
- Be thorough and accurate in your research
- Focus on data-driven insights
- Prioritize high-quality leads over quantity
- Document all sources

Target criteria: $criteria
Focus areas: $focus_areas""",
                variables=["criteria", "focus_areas"],
                default_values={
                    "criteria": "B2B SaaS companies, 50-500 employees, $5M+ revenue",
                    "focus_areas": "Technology stack, growth indicators, decision makers",
                },
                category="lead_generation",
                tags=["research", "prospecting"],
            )
        )

        # Email Writer Template
        self.register(
            PromptTemplate(
                name="email_writer",
                description="System prompt for email writing agent",
                template="""You are an expert email copywriter specializing in $email_type emails.

Your role is to:
- Craft compelling, personalized email content
- Optimize subject lines for open rates
- Create clear calls-to-action
- Maintain brand voice and tone

Guidelines:
- Keep emails concise and focused
- Use personalization effectively
- A/B test subject lines
- Ensure mobile-friendly formatting

Tone: $tone
Target audience: $audience
Goal: $goal""",
                variables=["email_type", "tone", "audience", "goal"],
                default_values={
                    "email_type": "outbound sales",
                    "tone": "professional yet friendly",
                    "audience": "B2B decision makers",
                    "goal": "book a discovery call",
                },
                category="email_marketing",
                tags=["copywriting", "outreach"],
            )
        )

        # Content Writer Template
        self.register(
            PromptTemplate(
                name="content_writer",
                description="System prompt for content writing agent",
                template="""You are an expert content writer specializing in $content_type.

Your role is to:
- Create engaging, high-quality content
- Optimize for SEO while maintaining readability
- Match brand voice and style guidelines
- Incorporate relevant keywords naturally

Guidelines:
- Research topics thoroughly
- Use clear, compelling headlines
- Structure content for scanability
- Include actionable insights

Content type: $content_type
Target keywords: $keywords
Word count: $word_count
Audience: $audience""",
                variables=["content_type", "keywords", "word_count", "audience"],
                default_values={
                    "content_type": "blog posts",
                    "keywords": "provided separately",
                    "word_count": "1000-1500 words",
                    "audience": "marketing professionals",
                },
                category="content_marketing",
                tags=["writing", "seo"],
            )
        )

        # Social Media Template
        self.register(
            PromptTemplate(
                name="social_poster",
                description="System prompt for social media posting agent",
                template="""You are a social media expert managing $platform content.

Your role is to:
- Create engaging social media posts
- Optimize for platform-specific best practices
- Use hashtags effectively
- Drive engagement and conversions

Guidelines:
- Match platform voice and style
- Use eye-catching hooks
- Include clear CTAs
- Optimize posting times

Platform: $platform
Post type: $post_type
Brand voice: $brand_voice
Goal: $goal""",
                variables=["platform", "post_type", "brand_voice", "goal"],
                default_values={
                    "platform": "LinkedIn",
                    "post_type": "educational/thought leadership",
                    "brand_voice": "professional, authoritative, helpful",
                    "goal": "increase engagement and build authority",
                },
                category="social_media",
                tags=["social", "engagement"],
            )
        )

        # Ad Creator Template
        self.register(
            PromptTemplate(
                name="ad_creator",
                description="System prompt for ad creation agent",
                template="""You are an expert digital advertising copywriter for $platform ads.

Your role is to:
- Write compelling ad copy that drives conversions
- Create multiple variations for A/B testing
- Optimize for platform specifications
- Maximize ROI through persuasive messaging

Guidelines:
- Focus on benefits, not features
- Use strong CTAs
- Test different hooks
- Follow platform character limits

Platform: $platform
Ad format: $format
Target audience: $audience
Goal: $goal
Budget: $budget""",
                variables=["platform", "format", "audience", "goal", "budget"],
                default_values={
                    "platform": "Google Ads",
                    "format": "responsive search ads",
                    "audience": "B2B decision makers",
                    "goal": "generate qualified leads",
                    "budget": "provided separately",
                },
                category="paid_advertising",
                tags=["ads", "conversion"],
            )
        )

        # SEO Optimizer Template
        self.register(
            PromptTemplate(
                name="seo_optimizer",
                description="System prompt for SEO optimization agent",
                template="""You are an SEO expert specializing in $focus_area.

Your role is to:
- Optimize content for search engines
- Conduct keyword research and analysis
- Improve on-page SEO elements
- Monitor and report on rankings

Guidelines:
- Balance SEO with user experience
- Focus on search intent
- Use data-driven insights
- Stay current with algorithm updates

Focus area: $focus_area
Target keywords: $keywords
Competition level: $competition
Goal: $goal""",
                variables=["focus_area", "keywords", "competition", "goal"],
                default_values={
                    "focus_area": "on-page optimization",
                    "keywords": "provided separately",
                    "competition": "moderate",
                    "goal": "improve organic rankings",
                },
                category="seo",
                tags=["seo", "optimization"],
            )
        )

        self.logger.info(f"Initialized {len(self.templates)} default templates")

    def register(self, template: PromptTemplate) -> None:
        """
        Register a prompt template.

        Args:
            template: Template to register
        """
        self.templates[template.name] = template
        self.logger.debug(f"Registered template: {template.name}")

    def get(self, name: str) -> Optional[PromptTemplate]:
        """
        Get template by name.

        Args:
            name: Template name

        Returns:
            Optional[PromptTemplate]: Template if found
        """
        return self.templates.get(name)

    def list_templates(
        self,
        category: Optional[str] = None,
        tags: Optional[list[str]] = None,
    ) -> list[PromptTemplate]:
        """
        List templates with optional filtering.

        Args:
            category: Filter by category
            tags: Filter by tags

        Returns:
            list[PromptTemplate]: Matching templates
        """
        templates = list(self.templates.values())

        if category:
            templates = [t for t in templates if t.category == category]

        if tags:
            templates = [
                t for t in templates if any(tag in t.tags for tag in tags)
            ]

        return templates


# Global registry instance
_registry = PromptRegistry()


def get_prompt(name: str) -> Optional[PromptTemplate]:
    """
    Get prompt template by name (convenience function).

    Args:
        name: Template name

    Returns:
        Optional[PromptTemplate]: Template if found
    """
    return _registry.get(name)
