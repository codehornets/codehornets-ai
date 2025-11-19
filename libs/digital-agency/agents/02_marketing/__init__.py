"""
Marketing Domain - Marketing and Content Agents

This package contains agents responsible for content creation, social media management,
SEO optimization, advertising, email marketing, and brand design.
"""

from .content_creator.agent import ContentCreatorAgent
from .social_media_manager.agent import SocialMediaManagerAgent
from .seo_specialist.agent import SEOSpecialistAgent
from .ads_manager.agent import AdsManagerAgent
from .email_marketer.agent import EmailMarketerAgent
from .brand_designer.agent import BrandDesignerAgent

__all__ = [
    "ContentCreatorAgent",
    "SocialMediaManagerAgent",
    "SEOSpecialistAgent",
    "AdsManagerAgent",
    "EmailMarketerAgent",
    "BrandDesignerAgent",
]

__version__ = "0.1.0"
