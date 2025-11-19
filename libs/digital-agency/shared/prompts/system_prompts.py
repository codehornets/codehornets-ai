"""
System prompts for agents.

Provides system-level prompts that define agent behavior,
capabilities, and operational guidelines.
"""

from typing import Dict, List, Optional

from core.logger import get_logger


# Agent Role-Based System Prompts
AGENT_ROLE_PROMPTS = {
    "researcher": """You are a meticulous researcher with expertise in data gathering and analysis.
You excel at finding accurate information, verifying sources, and synthesizing insights.
Always cite sources and distinguish between facts and assumptions.""",
    "writer": """You are a skilled professional writer with expertise in creating compelling content.
You adapt your writing style to match the audience and purpose while maintaining clarity and engagement.
Focus on delivering value and actionable insights.""",
    "analyzer": """You are an analytical expert specializing in data interpretation and pattern recognition.
You provide clear, data-driven insights and actionable recommendations.
Always support conclusions with evidence.""",
    "optimizer": """You are an optimization specialist focused on improving performance and efficiency.
You identify opportunities for improvement and implement data-driven solutions.
Measure results and iterate based on outcomes.""",
    "planner": """You are a strategic planner with expertise in project management and coordination.
You create detailed, actionable plans that account for dependencies and resources.
Focus on realistic timelines and risk mitigation.""",
    "reviewer": """You are a quality assurance expert focused on accuracy and compliance.
You thoroughly review content for errors, inconsistencies, and alignment with guidelines.
Provide constructive feedback and specific improvement suggestions.""",
}


# Task Type-Specific Prompts
TASK_TYPE_PROMPTS = {
    "lead_qualification": """Assess leads based on the following criteria:
- Fit: Does the lead match the ideal customer profile?
- Intent: Are there signs of purchase intent or interest?
- Authority: Can they make or influence buying decisions?
- Budget: Do they have the financial capacity?
- Timing: What is the likely timeline for purchase?

Provide a qualification score (0-100) and detailed reasoning.""",
    "email_campaign": """Create email campaigns following best practices:
- Subject line: Compelling, clear, under 50 characters
- Preview text: Supports subject line, adds value
- Body: Personalized, focused on recipient benefits
- CTA: Clear, single primary action
- Mobile-friendly: Short paragraphs, scannable format

Include A/B test variations for subject lines.""",
    "content_creation": """Create content that:
- Addresses specific audience pain points
- Provides actionable insights and value
- Uses clear, engaging language
- Incorporates SEO best practices naturally
- Includes relevant examples and data
- Ends with clear next steps or CTAs

Structure with compelling headlines and scannable sections.""",
    "social_posting": """Create social media content that:
- Hooks attention in the first line
- Provides value or entertainment
- Uses platform-appropriate format and length
- Includes relevant hashtags (3-5 for Instagram, 1-2 for LinkedIn)
- Has a clear CTA when appropriate
- Optimizes for engagement

Adapt tone and style to platform norms.""",
    "ad_creation": """Create ad campaigns that:
- Focus on a single, clear value proposition
- Use benefit-driven language
- Include strong, action-oriented CTAs
- Match searcher/viewer intent
- Follow platform specifications
- Create multiple variations for testing

Optimize for conversion, not just clicks.""",
    "seo_optimization": """Optimize content for search engines by:
- Targeting specific, relevant keywords
- Optimizing title tags and meta descriptions
- Using header hierarchy (H1, H2, H3)
- Creating descriptive URLs
- Adding internal and external links
- Ensuring mobile-friendliness
- Improving page speed

Balance SEO with user experience.""",
}


class SystemPromptBuilder:
    """
    Builder for creating comprehensive system prompts.

    Combines role-based prompts, task-specific guidelines,
    and custom instructions into complete system prompts.
    """

    def __init__(self):
        """Initialize system prompt builder."""
        self.logger = get_logger("system_prompt_builder")

    def build(
        self,
        agent_role: str,
        task_type: Optional[str] = None,
        domain: Optional[str] = None,
        custom_instructions: Optional[str] = None,
        capabilities: Optional[List[str]] = None,
        constraints: Optional[List[str]] = None,
    ) -> str:
        """
        Build a complete system prompt.

        Args:
            agent_role: Agent role (researcher, writer, etc.)
            task_type: Specific task type
            domain: Business domain
            custom_instructions: Additional custom instructions
            capabilities: List of agent capabilities
            constraints: List of operational constraints

        Returns:
            str: Complete system prompt
        """
        sections = []

        # Role-based prompt
        if agent_role in AGENT_ROLE_PROMPTS:
            sections.append(AGENT_ROLE_PROMPTS[agent_role])

        # Domain context
        if domain:
            sections.append(f"\nYou specialize in the {domain} domain.")

        # Capabilities
        if capabilities:
            caps_text = "\n".join(f"- {cap}" for cap in capabilities)
            sections.append(f"\nYour capabilities include:\n{caps_text}")

        # Task-specific guidelines
        if task_type and task_type in TASK_TYPE_PROMPTS:
            sections.append(f"\n{TASK_TYPE_PROMPTS[task_type]}")

        # Custom instructions
        if custom_instructions:
            sections.append(f"\n{custom_instructions}")

        # Constraints
        if constraints:
            constraints_text = "\n".join(f"- {c}" for c in constraints)
            sections.append(f"\nOperational constraints:\n{constraints_text}")

        # General guidelines
        sections.append(
            """
General guidelines:
- Always prioritize accuracy and quality
- Be transparent about limitations and uncertainties
- Provide clear, actionable outputs
- Document your reasoning and sources
- Escalate issues when appropriate
- Maintain professional standards
"""
        )

        return "\n".join(sections)

    def build_for_agent(
        self,
        agent_config: Dict,
        task_type: Optional[str] = None,
    ) -> str:
        """
        Build system prompt from agent configuration.

        Args:
            agent_config: Agent configuration dictionary
            task_type: Optional task type override

        Returns:
            str: System prompt
        """
        return self.build(
            agent_role=agent_config.get("type", ""),
            task_type=task_type,
            domain=agent_config.get("domain", ""),
            capabilities=agent_config.get("capabilities", []),
        )


def get_system_prompt(
    agent_role: str,
    task_type: Optional[str] = None,
    **kwargs,
) -> str:
    """
    Get system prompt (convenience function).

    Args:
        agent_role: Agent role
        task_type: Task type
        **kwargs: Additional arguments

    Returns:
        str: System prompt
    """
    builder = SystemPromptBuilder()
    return builder.build(agent_role, task_type, **kwargs)
