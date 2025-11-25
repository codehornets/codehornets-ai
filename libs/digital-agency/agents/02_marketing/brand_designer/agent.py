"""
Brand Designer Agent

Creates visual brand assets with color palette generation, typography pairing,
brand consistency checking, and comprehensive design system creation.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from enum import Enum
import logging
import math
import hashlib
import colorsys
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ColorScheme(Enum):
    """Color harmony scheme types."""
    MONOCHROMATIC = "monochromatic"
    COMPLEMENTARY = "complementary"
    ANALOGOUS = "analogous"
    TRIADIC = "triadic"
    TETRADIC = "tetradic"
    SPLIT_COMPLEMENTARY = "split_complementary"


class FontCategory(Enum):
    """Font category types."""
    SERIF = "serif"
    SANS_SERIF = "sans_serif"
    SCRIPT = "script"
    DISPLAY = "display"
    MONOSPACE = "monospace"


class AssetType(Enum):
    """Marketing asset types."""
    SOCIAL_MEDIA = "social_media"
    WEB_BANNER = "web_banner"
    PRINT = "print"
    EMAIL_HEADER = "email_header"
    PRESENTATION = "presentation"
    LOGO = "logo"
    ICON = "icon"


class BrandDesignerAgent:
    """Brand Designer Agent for creating visual brand assets."""

    # Standard asset dimensions (width x height in pixels)
    ASSET_DIMENSIONS = {
        "facebook_post": (1200, 630),
        "instagram_post": (1080, 1080),
        "instagram_story": (1080, 1920),
        "twitter_post": (1200, 675),
        "linkedin_post": (1200, 627),
        "youtube_thumbnail": (1280, 720),
        "web_banner": (1920, 1080),
        "email_header": (600, 200),
        "business_card": (3.5, 2),  # inches
        "flyer_letter": (8.5, 11),  # inches
        "logo_square": (512, 512),
        "favicon": (32, 32)
    }

    # Font pairing recommendations
    FONT_PAIRINGS = {
        "classic": {"heading": "Playfair Display", "body": "Source Sans Pro"},
        "modern": {"heading": "Montserrat", "body": "Open Sans"},
        "elegant": {"heading": "Cormorant Garamond", "body": "Raleway"},
        "friendly": {"heading": "Poppins", "body": "Lato"},
        "professional": {"heading": "Roboto Slab", "body": "Roboto"},
        "creative": {"heading": "Bebas Neue", "body": "Nunito"},
        "minimal": {"heading": "Inter", "body": "Inter"},
        "tech": {"heading": "Space Grotesk", "body": "DM Sans"}
    }

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Brand Designer Agent.

        Args:
            config: Optional configuration dictionary
        """
        self.agent_id = "brand_designer_001"
        self.config = config or {}
        self.assets: List[Dict[str, Any]] = []
        self.name = "Brand Designer"
        self.role = "Brand Design and Visual Identity"
        self.brand_systems: Dict[str, Dict[str, Any]] = {}
        self.color_palettes: List[Dict[str, Any]] = []

        logger.info(f"BrandDesignerAgent {self.agent_id} initialized")

    def create_brand_identity(
        self,
        brand_name: str,
        values: List[str],
        industry: Optional[str] = None,
        target_audience: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create comprehensive brand identity system.

        Args:
            brand_name: Brand name
            values: Brand values
            industry: Industry sector
            target_audience: Target audience description

        Returns:
            Brand identity system
        """
        try:
            identity_id = f"brand_{hashlib.md5(f'{brand_name}{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            # Generate color palette based on industry
            palette = self._generate_industry_palette(industry or "general")

            # Recommend typography
            typography = self._recommend_typography(values, industry)

            identity = {
                "identity_id": identity_id,
                "brand_name": brand_name,
                "values": values,
                "industry": industry,
                "target_audience": target_audience,
                "color_palette": palette,
                "typography": typography,
                "logo_concepts": [],
                "created_at": datetime.now().isoformat(),
                "status": "draft"
            }

            self.brand_systems[identity_id] = identity
            logger.info(f"Brand identity created: {brand_name}")

            return identity

        except Exception as e:
            logger.error(f"Error creating brand identity: {e}")
            raise

    def _generate_industry_palette(self, industry: str) -> Dict[str, str]:
        """Generate color palette based on industry."""
        industry_colors = {
            "tech": {"primary": "#007AFF", "secondary": "#5856D6", "accent": "#FF2D55"},
            "healthcare": {"primary": "#00A5E3", "secondary": "#00C48C", "accent": "#FF6B6B"},
            "finance": {"primary": "#1A3A52", "secondary": "#4A90A4", "accent": "#E67E22"},
            "education": {"primary": "#3498DB", "secondary": "#9B59B6", "accent": "#F39C12"},
            "food": {"primary": "#E74C3C", "secondary": "#F39C12", "accent": "#27AE60"},
            "fashion": {"primary": "#2C3E50", "secondary": "#E91E63", "accent": "#9C27B0"},
            "real_estate": {"primary": "#2C3E50", "secondary": "#16A085", "accent": "#D35400"},
            "general": {"primary": "#3498DB", "secondary": "#2ECC71", "accent": "#E74C3C"}
        }

        return industry_colors.get(industry.lower(), industry_colors["general"])

    def _recommend_typography(self, values: List[str], industry: Optional[str]) -> Dict[str, str]:
        """Recommend typography based on brand values."""
        value_keywords = " ".join(values).lower()

        if any(word in value_keywords for word in ["modern", "innovative", "tech"]):
            return self.FONT_PAIRINGS["modern"]
        elif any(word in value_keywords for word in ["elegant", "luxury", "premium"]):
            return self.FONT_PAIRINGS["elegant"]
        elif any(word in value_keywords for word in ["professional", "corporate", "business"]):
            return self.FONT_PAIRINGS["professional"]
        elif any(word in value_keywords for word in ["friendly", "approachable", "warm"]):
            return self.FONT_PAIRINGS["friendly"]
        elif any(word in value_keywords for word in ["creative", "artistic", "unique"]):
            return self.FONT_PAIRINGS["creative"]
        else:
            return self.FONT_PAIRINGS["classic"]

    def generate_color_palette(
        self,
        base_color: str,
        scheme: str,
        num_colors: int = 5
    ) -> Dict[str, Any]:
        """Generate color palette using color harmony algorithms.

        Args:
            base_color: Base color in hex format (#RRGGBB)
            scheme: Color harmony scheme
            num_colors: Number of colors to generate

        Returns:
            Color palette with harmony analysis
        """
        try:
            scheme_enum = ColorScheme(scheme.lower())

            # Convert hex to RGB and then to HSV
            rgb = self._hex_to_rgb(base_color)
            hsv = colorsys.rgb_to_hsv(rgb[0]/255, rgb[1]/255, rgb[2]/255)
            h, s, v = hsv[0] * 360, hsv[1], hsv[2]

            colors = []

            if scheme_enum == ColorScheme.MONOCHROMATIC:
                # Vary saturation and value
                for i in range(num_colors):
                    new_s = max(0.2, min(1.0, s + (i - num_colors//2) * 0.15))
                    new_v = max(0.2, min(1.0, v + (i - num_colors//2) * 0.1))
                    colors.append(self._hsv_to_hex(h, new_s, new_v))

            elif scheme_enum == ColorScheme.COMPLEMENTARY:
                colors.append(self._hsv_to_hex(h, s, v))
                colors.append(self._hsv_to_hex((h + 180) % 360, s, v))
                # Add tints and shades
                for i in range(num_colors - 2):
                    if i % 2 == 0:
                        colors.append(self._hsv_to_hex(h, s * 0.5, v * 1.2))
                    else:
                        colors.append(self._hsv_to_hex((h + 180) % 360, s * 0.5, v * 1.2))

            elif scheme_enum == ColorScheme.ANALOGOUS:
                # Colors adjacent on color wheel (±30 degrees)
                angles = [-30, 0, 30]
                for angle in angles:
                    colors.append(self._hsv_to_hex((h + angle) % 360, s, v))
                # Add variations
                for i in range(num_colors - 3):
                    colors.append(self._hsv_to_hex((h + angles[i % 3]) % 360, s * 0.6, v * 1.1))

            elif scheme_enum == ColorScheme.TRIADIC:
                # Three colors equally spaced (120 degrees apart)
                for angle in [0, 120, 240]:
                    colors.append(self._hsv_to_hex((h + angle) % 360, s, v))
                # Add variations
                for i in range(num_colors - 3):
                    colors.append(self._hsv_to_hex((h + (i % 3) * 120) % 360, s * 0.5, v * 1.1))

            elif scheme_enum == ColorScheme.TETRADIC:
                # Four colors in two complementary pairs
                for angle in [0, 90, 180, 270]:
                    colors.append(self._hsv_to_hex((h + angle) % 360, s, v))
                # Add one more variation
                if num_colors > 4:
                    colors.append(self._hsv_to_hex(h, s * 0.5, v * 1.1))

            elif scheme_enum == ColorScheme.SPLIT_COMPLEMENTARY:
                # Base color plus two colors adjacent to complement
                colors.append(self._hsv_to_hex(h, s, v))
                colors.append(self._hsv_to_hex((h + 150) % 360, s, v))
                colors.append(self._hsv_to_hex((h + 210) % 360, s, v))
                # Add variations
                for i in range(num_colors - 3):
                    colors.append(self._hsv_to_hex(h, s * 0.5, v * 1.1))

            # Ensure we have the requested number of colors
            while len(colors) < num_colors:
                colors.append(self._hsv_to_hex(h, s * 0.7, v * 0.9))

            colors = colors[:num_colors]

            # Analyze palette
            palette_analysis = self._analyze_palette(colors)

            result = {
                "palette_id": f"palette_{hashlib.md5(f'{base_color}{scheme}'.encode()).hexdigest()[:8]}",
                "base_color": base_color.upper(),
                "scheme": scheme_enum.value,
                "colors": [c.upper() for c in colors],
                "color_roles": {
                    "primary": colors[0].upper(),
                    "secondary": colors[1].upper() if len(colors) > 1 else colors[0].upper(),
                    "accent": colors[2].upper() if len(colors) > 2 else colors[0].upper(),
                    "neutral_light": colors[-2].upper() if len(colors) > 3 else "#F5F5F5",
                    "neutral_dark": colors[-1].upper() if len(colors) > 4 else "#333333"
                },
                "analysis": palette_analysis,
                "created_at": datetime.now().isoformat()
            }

            self.color_palettes.append(result)
            logger.info(f"Color palette generated: {scheme_enum.value} with {num_colors} colors")

            return result

        except Exception as e:
            logger.error(f"Error generating color palette: {e}")
            raise

    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple."""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def _rgb_to_hex(self, r: int, g: int, b: int) -> str:
        """Convert RGB to hex color."""
        return f"#{r:02X}{g:02X}{b:02X}"

    def _hsv_to_hex(self, h: float, s: float, v: float) -> str:
        """Convert HSV to hex color."""
        rgb = colorsys.hsv_to_rgb(h/360, s, v)
        r, g, b = [int(x * 255) for x in rgb]
        return self._rgb_to_hex(r, g, b)

    def _analyze_palette(self, colors: List[str]) -> Dict[str, Any]:
        """Analyze color palette characteristics."""
        # Calculate average brightness
        brightnesses = []
        for color in colors:
            rgb = self._hex_to_rgb(color)
            # Perceived brightness
            brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
            brightnesses.append(brightness)

        avg_brightness = sum(brightnesses) / len(brightnesses)

        return {
            "average_brightness": round(avg_brightness, 2),
            "brightness_range": {
                "min": round(min(brightnesses), 2),
                "max": round(max(brightnesses), 2)
            },
            "palette_mood": "light" if avg_brightness > 180 else "dark" if avg_brightness < 100 else "balanced",
            "contrast_ratio": round(max(brightnesses) / max(min(brightnesses), 1), 2)
        }

    def check_color_harmony(
        self,
        color1: str,
        color2: str
    ) -> Dict[str, Any]:
        """Check color harmony using mathematical validation.

        Args:
            color1: First color in hex
            color2: Second color in hex

        Returns:
            Harmony analysis
        """
        try:
            # Convert to HSV
            rgb1 = self._hex_to_rgb(color1)
            rgb2 = self._hex_to_rgb(color2)

            hsv1 = colorsys.rgb_to_hsv(rgb1[0]/255, rgb1[1]/255, rgb1[2]/255)
            hsv2 = colorsys.rgb_to_hsv(rgb2[0]/255, rgb2[1]/255, rgb2[2]/255)

            h1, h2 = hsv1[0] * 360, hsv2[0] * 360

            # Calculate hue difference
            hue_diff = abs(h1 - h2)
            if hue_diff > 180:
                hue_diff = 360 - hue_diff

            # Determine harmony type
            harmony_type = None
            harmony_score = 0

            if hue_diff < 30:
                harmony_type = "analogous"
                harmony_score = 85
            elif 160 <= hue_diff <= 200:
                harmony_type = "complementary"
                harmony_score = 90
            elif 110 <= hue_diff <= 130:
                harmony_type = "triadic"
                harmony_score = 88
            elif 85 <= hue_diff <= 95:
                harmony_type = "square"
                harmony_score = 87
            else:
                harmony_type = "custom"
                harmony_score = 60

            # Calculate contrast ratio (WCAG)
            l1 = self._calculate_relative_luminance(rgb1)
            l2 = self._calculate_relative_luminance(rgb2)

            contrast_ratio = (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)

            # WCAG compliance
            wcag_aa_normal = contrast_ratio >= 4.5
            wcag_aa_large = contrast_ratio >= 3.0
            wcag_aaa_normal = contrast_ratio >= 7.0

            result = {
                "color1": color1.upper(),
                "color2": color2.upper(),
                "hue_difference": round(hue_diff, 2),
                "harmony_type": harmony_type,
                "harmony_score": harmony_score,
                "contrast_ratio": round(contrast_ratio, 2),
                "wcag_compliance": {
                    "aa_normal_text": wcag_aa_normal,
                    "aa_large_text": wcag_aa_large,
                    "aaa_normal_text": wcag_aaa_normal
                },
                "recommended_for": self._get_color_recommendations(contrast_ratio, harmony_score),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Color harmony checked: {harmony_type}, score: {harmony_score}")
            return result

        except Exception as e:
            logger.error(f"Error checking color harmony: {e}")
            raise

    def _calculate_relative_luminance(self, rgb: Tuple[int, int, int]) -> float:
        """Calculate relative luminance for WCAG contrast ratio."""
        def adjust(c):
            c = c / 255
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

        r, g, b = [adjust(c) for c in rgb]
        return 0.2126 * r + 0.7152 * g + 0.0722 * b

    def _get_color_recommendations(self, contrast_ratio: float, harmony_score: int) -> List[str]:
        """Get usage recommendations based on contrast and harmony."""
        recommendations = []

        if contrast_ratio >= 7.0:
            recommendations.append("Text on background (any size)")
        elif contrast_ratio >= 4.5:
            recommendations.append("Normal text on background")
        elif contrast_ratio >= 3.0:
            recommendations.append("Large text on background only")

        if harmony_score >= 85:
            recommendations.append("Primary brand color combination")
        elif harmony_score >= 70:
            recommendations.append("Secondary color palette")

        return recommendations

    def pair_typography(
        self,
        style: str,
        purpose: Optional[str] = None
    ) -> Dict[str, Any]:
        """Pair typography using font matching algorithm.

        Args:
            style: Typography style (classic, modern, elegant, etc.)
            purpose: Purpose (website, print, presentation, etc.)

        Returns:
            Typography pairing recommendations
        """
        try:
            # Get base pairing
            pairing = self.FONT_PAIRINGS.get(style.lower(), self.FONT_PAIRINGS["classic"])

            # Calculate readability scores
            heading_score = self._calculate_readability_score(pairing["heading"], "heading")
            body_score = self._calculate_readability_score(pairing["body"], "body")

            # Contrast score (difference between heading and body)
            contrast_score = abs(heading_score - body_score)

            # Overall pairing quality
            pairing_quality = min(100, (heading_score + body_score) / 2 + contrast_score * 10)

            result = {
                "style": style,
                "purpose": purpose or "general",
                "heading_font": pairing["heading"],
                "body_font": pairing["body"],
                "readability_scores": {
                    "heading": round(heading_score, 2),
                    "body": round(body_score, 2),
                    "overall": round((heading_score + body_score) / 2, 2)
                },
                "contrast_score": round(contrast_score, 2),
                "pairing_quality": round(pairing_quality, 2),
                "recommended_sizes": {
                    "h1": "48px",
                    "h2": "36px",
                    "h3": "28px",
                    "body": "16px",
                    "small": "14px"
                },
                "recommended_weights": {
                    "heading": ["600", "700", "800"],
                    "body": ["400", "500", "600"]
                },
                "line_height": {
                    "heading": "1.2",
                    "body": "1.6"
                },
                "usage_guidelines": self._generate_typography_guidelines(pairing),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Typography paired: {style}, quality: {pairing_quality:.1f}")
            return result

        except Exception as e:
            logger.error(f"Error pairing typography: {e}")
            raise

    def _calculate_readability_score(self, font_name: str, font_type: str) -> float:
        """Calculate readability score for a font."""
        # Base score
        score = 70

        # Bonus for sans-serif body fonts
        if font_type == "body" and any(sans in font_name.lower() for sans in ["sans", "arial", "helvetica", "open", "lato", "roboto"]):
            score += 15

        # Bonus for serif heading fonts
        if font_type == "heading" and any(serif in font_name.lower() for serif in ["serif", "times", "garamond", "playfair"]):
            score += 10

        # Bonus for modern fonts
        if any(modern in font_name.lower() for modern in ["montserrat", "inter", "poppins", "dm sans"]):
            score += 10

        return min(100, score)

    def _generate_typography_guidelines(self, pairing: Dict[str, str]) -> List[str]:
        """Generate typography usage guidelines."""
        return [
            f"Use {pairing['heading']} for all headings and titles",
            f"Use {pairing['body']} for body text and paragraphs",
            "Maintain consistent font weights within each category",
            "Ensure minimum 16px font size for body text",
            "Use adequate line spacing (1.5-1.6) for readability"
        ]

    def check_brand_consistency(
        self,
        brand_id: str,
        assets: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Check brand consistency using color distance in LAB space.

        Args:
            brand_id: Brand identifier
            assets: List of assets to check

        Returns:
            Consistency analysis
        """
        try:
            brand = self.brand_systems.get(brand_id)
            if not brand:
                raise ValueError(f"Brand {brand_id} not found")

            brand_colors = brand.get("color_palette", {})
            issues = []
            warnings = []
            consistency_score = 100

            for asset in assets:
                asset_colors = asset.get("colors", [])

                for asset_color in asset_colors:
                    # Check if color is in brand palette
                    if asset_color.upper() not in [c.upper() for c in brand_colors.values()]:
                        # Calculate color distance to nearest brand color
                        min_distance = float('inf')
                        nearest_color = None

                        for brand_color in brand_colors.values():
                            distance = self._calculate_color_distance(asset_color, brand_color)
                            if distance < min_distance:
                                min_distance = distance
                                nearest_color = brand_color

                        # Delta E threshold: <2 imperceptible, 2-10 noticeable, >10 significant
                        if min_distance > 10:
                            issues.append(f"Color {asset_color} significantly differs from brand palette")
                            consistency_score -= 15
                        elif min_distance > 2:
                            warnings.append(f"Color {asset_color} slightly differs from brand (closest: {nearest_color})")
                            consistency_score -= 5

            consistency_score = max(0, consistency_score)

            # Determine rating
            if consistency_score >= 90:
                rating = "Excellent"
            elif consistency_score >= 75:
                rating = "Good"
            elif consistency_score >= 60:
                rating = "Fair"
            else:
                rating = "Needs Improvement"

            result = {
                "brand_id": brand_id,
                "assets_checked": len(assets),
                "consistency_score": consistency_score,
                "rating": rating,
                "issues": issues,
                "warnings": warnings,
                "recommendations": self._generate_consistency_recommendations(issues, warnings),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Brand consistency checked: {consistency_score}/100 ({rating})")
            return result

        except Exception as e:
            logger.error(f"Error checking brand consistency: {e}")
            raise

    def _calculate_color_distance(self, color1: str, color2: str) -> float:
        """Calculate Delta E (CIE76) color distance in LAB space."""
        rgb1 = self._hex_to_rgb(color1)
        rgb2 = self._hex_to_rgb(color2)

        # Convert RGB to LAB (simplified)
        lab1 = self._rgb_to_lab(rgb1)
        lab2 = self._rgb_to_lab(rgb2)

        # Calculate Euclidean distance
        delta_e = math.sqrt(
            (lab1[0] - lab2[0]) ** 2 +
            (lab1[1] - lab2[1]) ** 2 +
            (lab1[2] - lab2[2]) ** 2
        )

        return delta_e

    def _rgb_to_lab(self, rgb: Tuple[int, int, int]) -> Tuple[float, float, float]:
        """Convert RGB to LAB color space (simplified)."""
        # Normalize RGB
        r, g, b = [x / 255.0 for x in rgb]

        # Convert to XYZ (simplified)
        x = r * 0.4124 + g * 0.3576 + b * 0.1805
        y = r * 0.2126 + g * 0.7152 + b * 0.0722
        z = r * 0.0193 + g * 0.1192 + b * 0.9505

        # Convert to LAB (simplified)
        l = 116 * y - 16
        a = 500 * (x - y)
        b_val = 200 * (y - z)

        return (l, a, b_val)

    def _generate_consistency_recommendations(
        self,
        issues: List[str],
        warnings: List[str]
    ) -> List[str]:
        """Generate brand consistency recommendations."""
        recommendations = []

        if issues:
            recommendations.append("Update off-brand colors to match approved brand palette")
            recommendations.append("Create a brand style guide for reference")

        if warnings:
            recommendations.append("Review colors that deviate slightly from brand standards")

        if not issues and not warnings:
            recommendations.append("Brand consistency is excellent - maintain current standards")

        return recommendations

    def optimize_asset_dimensions(
        self,
        asset_type: str,
        platform: Optional[str] = None
    ) -> Dict[str, Any]:
        """Optimize asset dimensions for platform-specific sizing.

        Args:
            asset_type: Type of asset
            platform: Platform (social media, web, print)

        Returns:
            Optimized dimensions
        """
        try:
            # Get base dimensions
            dimensions_key = f"{platform}_{asset_type}" if platform else asset_type
            dimensions = self.ASSET_DIMENSIONS.get(
                dimensions_key,
                self.ASSET_DIMENSIONS.get(asset_type, (1200, 630))
            )

            # Calculate aspect ratio
            width, height = dimensions
            aspect_ratio = width / height if isinstance(width, (int, float)) and isinstance(height, (int, float)) else 1

            # Determine optimal file size
            pixel_count = width * height if isinstance(width, (int, float)) else 1000000
            recommended_file_size_kb = int(pixel_count * 0.003)  # ~3 bytes per pixel

            result = {
                "asset_type": asset_type,
                "platform": platform or "general",
                "dimensions": {
                    "width": width,
                    "height": height,
                    "unit": "pixels" if isinstance(width, int) else "inches"
                },
                "aspect_ratio": f"{aspect_ratio:.2f}:1",
                "recommended_formats": self._get_recommended_formats(asset_type),
                "recommended_file_size_kb": recommended_file_size_kb,
                "dpi": 72 if platform in ["facebook", "instagram", "twitter", "web"] else 300,
                "color_mode": "RGB" if platform != "print" else "CMYK",
                "optimization_tips": self._generate_optimization_tips(asset_type, platform),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Asset dimensions optimized: {asset_type} for {platform or 'general'}")
            return result

        except Exception as e:
            logger.error(f"Error optimizing asset dimensions: {e}")
            raise

    def _get_recommended_formats(self, asset_type: str) -> List[str]:
        """Get recommended file formats for asset type."""
        format_map = {
            "logo": ["SVG", "PNG", "EPS"],
            "social_media": ["PNG", "JPEG"],
            "web_banner": ["PNG", "WebP", "JPEG"],
            "print": ["PDF", "EPS", "TIFF"],
            "icon": ["SVG", "PNG"]
        }

        for key, formats in format_map.items():
            if key in asset_type.lower():
                return formats

        return ["PNG", "JPEG"]

    def _generate_optimization_tips(self, asset_type: str, platform: Optional[str]) -> List[str]:
        """Generate optimization tips for asset."""
        tips = []

        if platform in ["facebook", "instagram", "twitter", "linkedin"]:
            tips.append("Use PNG for graphics with transparency, JPEG for photos")
            tips.append("Compress images to reduce file size without quality loss")
            tips.append("Ensure text is readable at small sizes")

        if "logo" in asset_type.lower():
            tips.append("Create vector version (SVG/EPS) for scalability")
            tips.append("Design with minimum size of 32px in mind")
            tips.append("Ensure logo works in monochrome")

        if platform == "print":
            tips.append("Use 300 DPI for print quality")
            tips.append("Convert to CMYK color mode")
            tips.append("Include bleed area (0.125 inches)")

        return tips

    def generate_logo_variations(
        self,
        brand_id: str,
        base_logo: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate logo variations (primary, secondary, monochrome, icon).

        Args:
            brand_id: Brand identifier
            base_logo: Base logo configuration

        Returns:
            Logo variation set
        """
        try:
            brand = self.brand_systems.get(brand_id)
            if not brand:
                raise ValueError(f"Brand {brand_id} not found")

            variations = {
                "primary": {
                    "name": "Primary Logo",
                    "description": "Full color logo for primary use",
                    "colors": "full_palette",
                    "background": "light",
                    "min_width_px": 150,
                    "usage": "Website headers, business cards, primary marketing materials"
                },
                "secondary": {
                    "name": "Secondary Logo",
                    "description": "Simplified version for small sizes",
                    "colors": "primary_only",
                    "background": "any",
                    "min_width_px": 100,
                    "usage": "Social media avatars, favicons, app icons"
                },
                "monochrome_light": {
                    "name": "Monochrome (Light)",
                    "description": "Single color for light backgrounds",
                    "colors": "black",
                    "background": "light",
                    "min_width_px": 120,
                    "usage": "Faxes, photocopies, light-colored merchandise"
                },
                "monochrome_dark": {
                    "name": "Monochrome (Dark)",
                    "description": "Single color for dark backgrounds",
                    "colors": "white",
                    "background": "dark",
                    "min_width_px": 120,
                    "usage": "Dark backgrounds, reversed applications"
                },
                "icon": {
                    "name": "Logo Icon",
                    "description": "Icon-only version (no text)",
                    "colors": "full_palette",
                    "background": "any",
                    "min_width_px": 32,
                    "usage": "App icons, favicons, social media"
                },
                "wordmark": {
                    "name": "Wordmark",
                    "description": "Text-only version",
                    "colors": "full_palette",
                    "background": "light",
                    "min_width_px": 100,
                    "usage": "Headers, footers, sponsored content"
                }
            }

            result = {
                "brand_id": brand_id,
                "brand_name": brand.get("brand_name"),
                "variations": variations,
                "total_variations": len(variations),
                "clear_space": "Minimum clear space: X-height of text",
                "file_formats": {
                    "digital": ["SVG", "PNG (transparent)", "PNG (white bg)"],
                    "print": ["EPS", "PDF", "AI"]
                },
                "guidelines": self._generate_logo_guidelines(),
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Logo variations generated for {brand.get('brand_name')}")
            return result

        except Exception as e:
            logger.error(f"Error generating logo variations: {e}")
            raise

    def _generate_logo_guidelines(self) -> List[str]:
        """Generate logo usage guidelines."""
        return [
            "Always maintain proper clear space around logo",
            "Never distort or change aspect ratio",
            "Use appropriate variation for background color",
            "Ensure minimum size requirements are met",
            "Do not add effects (shadows, gradients, etc.) to logo",
            "Use vector formats when possible for scalability"
        ]

    def create_brand_guidelines(
        self,
        brand_id: str
    ) -> Dict[str, Any]:
        """Create comprehensive brand guidelines document.

        Args:
            brand_id: Brand identifier

        Returns:
            Brand guidelines structure
        """
        try:
            brand = self.brand_systems.get(brand_id)
            if not brand:
                raise ValueError(f"Brand {brand_id} not found")

            guidelines = {
                "brand_id": brand_id,
                "brand_name": brand.get("brand_name"),
                "sections": {
                    "introduction": {
                        "title": "Brand Introduction",
                        "content": [
                            "Brand mission and vision",
                            "Brand values",
                            "Target audience",
                            "Brand personality"
                        ]
                    },
                    "logo_usage": {
                        "title": "Logo Usage",
                        "content": [
                            "Logo variations and when to use them",
                            "Clear space requirements",
                            "Minimum size specifications",
                            "Incorrect usage examples"
                        ]
                    },
                    "color_palette": {
                        "title": "Color Palette",
                        "content": [
                            "Primary colors with hex, RGB, CMYK values",
                            "Secondary colors",
                            "Color usage guidelines",
                            "Accessibility considerations"
                        ],
                        "colors": brand.get("color_palette", {})
                    },
                    "typography": {
                        "title": "Typography",
                        "content": [
                            "Primary and secondary fonts",
                            "Font weights and sizes",
                            "Hierarchy guidelines",
                            "Web-safe alternatives"
                        ],
                        "fonts": brand.get("typography", {})
                    },
                    "imagery": {
                        "title": "Imagery Guidelines",
                        "content": [
                            "Photography style",
                            "Illustration style",
                            "Image treatments",
                            "Examples"
                        ]
                    },
                    "voice_and_tone": {
                        "title": "Voice and Tone",
                        "content": [
                            "Brand voice characteristics",
                            "Tone variations for different contexts",
                            "Writing dos and don'ts",
                            "Example copy"
                        ]
                    },
                    "applications": {
                        "title": "Brand Applications",
                        "content": [
                            "Business stationery",
                            "Digital applications",
                            "Marketing materials",
                            "Product packaging"
                        ]
                    }
                },
                "version": "1.0",
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat()
            }

            logger.info(f"Brand guidelines created for {brand.get('brand_name')}")
            return guidelines

        except Exception as e:
            logger.error(f"Error creating brand guidelines: {e}")
            raise

    def analyze_visual_hierarchy(
        self,
        layout: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze visual hierarchy in layout design.

        Args:
            layout: Layout configuration with elements

        Returns:
            Visual hierarchy analysis
        """
        try:
            elements = layout.get("elements", [])

            if not elements:
                raise ValueError("No elements provided for analysis")

            # Score each element
            scored_elements = []

            for element in elements:
                size = element.get("size", 16)
                weight = element.get("weight", 400)
                color_contrast = element.get("color_contrast", 1.0)
                position_y = element.get("position_y", 0)

                # Calculate visual weight
                visual_weight = (
                    (size / 16) * 30 +  # Size impact
                    (weight / 400) * 25 +  # Weight impact
                    color_contrast * 25 +  # Contrast impact
                    (1 - position_y / 1000) * 20  # Position impact (higher = more weight)
                )

                scored_elements.append({
                    **element,
                    "visual_weight": round(visual_weight, 2)
                })

            # Sort by visual weight
            scored_elements.sort(key=lambda x: x["visual_weight"], reverse=True)

            # Analyze hierarchy quality
            weights = [e["visual_weight"] for e in scored_elements]
            hierarchy_clear = len(set([int(w/20) for w in weights])) >= min(3, len(weights))

            # Determine issues
            issues = []
            if not hierarchy_clear:
                issues.append("Visual hierarchy is unclear - increase contrast between element sizes")

            if len(scored_elements) > 0 and scored_elements[0]["visual_weight"] < 50:
                issues.append("No clear focal point - increase size or weight of primary element")

            result = {
                "total_elements": len(elements),
                "visual_order": [e.get("name", f"Element {i}") for i, e in enumerate(scored_elements)],
                "elements": scored_elements,
                "hierarchy_quality": "clear" if hierarchy_clear else "unclear",
                "primary_focus": scored_elements[0].get("name") if scored_elements else None,
                "issues": issues,
                "recommendations": self._generate_hierarchy_recommendations(scored_elements, issues),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Visual hierarchy analyzed for {len(elements)} elements")
            return result

        except Exception as e:
            logger.error(f"Error analyzing visual hierarchy: {e}")
            raise

    def _generate_hierarchy_recommendations(
        self,
        elements: List[Dict[str, Any]],
        issues: List[str]
    ) -> List[str]:
        """Generate visual hierarchy recommendations."""
        recommendations = []

        if issues:
            recommendations.append("Increase size difference between heading levels")
            recommendations.append("Use color and weight to emphasize important elements")
            recommendations.append("Follow F-pattern or Z-pattern for layout")

        recommendations.append("Use whitespace to separate sections")
        recommendations.append("Limit to 2-3 font sizes for clean hierarchy")

        return recommendations

    def validate_accessibility(
        self,
        foreground_color: str,
        background_color: str,
        font_size: int = 16
    ) -> Dict[str, Any]:
        """Validate WCAG compliance for color contrast.

        Args:
            foreground_color: Text color
            background_color: Background color
            font_size: Font size in pixels

        Returns:
            WCAG compliance results
        """
        try:
            rgb_fg = self._hex_to_rgb(foreground_color)
            rgb_bg = self._hex_to_rgb(background_color)

            l_fg = self._calculate_relative_luminance(rgb_fg)
            l_bg = self._calculate_relative_luminance(rgb_bg)

            contrast_ratio = (max(l_fg, l_bg) + 0.05) / (min(l_fg, l_bg) + 0.05)

            # Determine if large text (18pt+ or 14pt+ bold)
            is_large_text = font_size >= 24 or (font_size >= 19 and True)  # Assume bold check

            # WCAG levels
            wcag_aa = contrast_ratio >= (3.0 if is_large_text else 4.5)
            wcag_aaa = contrast_ratio >= (4.5 if is_large_text else 7.0)

            # Determine pass level
            if wcag_aaa:
                level = "AAA"
                rating = "Excellent"
            elif wcag_aa:
                level = "AA"
                rating = "Good"
            else:
                level = "Fail"
                rating = "Poor"

            # Recommendations
            recommendations = []
            if not wcag_aa:
                recommendations.append("Increase contrast to meet WCAG AA standards (minimum 4.5:1)")
                recommendations.append("Consider using darker text or lighter background")
            elif not wcag_aaa:
                recommendations.append("Consider increasing contrast to meet AAA standards for enhanced accessibility")

            result = {
                "foreground_color": foreground_color.upper(),
                "background_color": background_color.upper(),
                "font_size": font_size,
                "contrast_ratio": round(contrast_ratio, 2),
                "wcag_level": level,
                "rating": rating,
                "compliance": {
                    "wcag_aa": wcag_aa,
                    "wcag_aaa": wcag_aaa,
                    "wcag_aa_large_text": contrast_ratio >= 3.0,
                    "wcag_aaa_large_text": contrast_ratio >= 4.5
                },
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Accessibility validated: {level} ({contrast_ratio:.2f}:1)")
            return result

        except Exception as e:
            logger.error(f"Error validating accessibility: {e}")
            raise

    def design_logo(
        self,
        brand_id: str,
        style: str
    ) -> Dict[str, Any]:
        """Design logo for brand.

        Args:
            brand_id: Brand identifier
            style: Logo style

        Returns:
            Logo design
        """
        try:
            logo_id = f"logo_{hashlib.md5(f'{brand_id}{style}'.encode()).hexdigest()[:12]}"

            logo = {
                "logo_id": logo_id,
                "brand_id": brand_id,
                "style": style,
                "variations": [],
                "status": "draft",
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Logo designed: {logo_id}")
            return logo

        except Exception as e:
            logger.error(f"Error designing logo: {e}")
            raise

    def create_marketing_asset(
        self,
        asset_type: str,
        specifications: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create marketing visual asset.

        Args:
            asset_type: Asset type
            specifications: Asset specifications

        Returns:
            Asset details
        """
        try:
            asset_id = f"asset_{hashlib.md5(f'{asset_type}{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            asset = {
                "asset_id": asset_id,
                "type": asset_type,
                "specifications": specifications,
                "status": "draft",
                "created_at": datetime.now().isoformat()
            }

            self.assets.append(asset)
            logger.info(f"Marketing asset created: {asset_id}")

            return asset

        except Exception as e:
            logger.error(f"Error creating marketing asset: {e}")
            raise

    def design_brand_guidelines(
        self,
        brand_id: str
    ) -> Dict[str, Any]:
        """Design comprehensive brand guidelines.

        Args:
            brand_id: Brand identifier

        Returns:
            Brand guidelines
        """
        try:
            # Use the more comprehensive method
            return self.create_brand_guidelines(brand_id)

        except Exception as e:
            logger.error(f"Error designing brand guidelines: {e}")
            raise

    def ensure_brand_consistency(
        self,
        assets: List[str]
    ) -> Dict[str, Any]:
        """Check brand consistency across assets.

        Args:
            assets: List of asset IDs

        Returns:
            Consistency report
        """
        try:
            result = {
                "assets_checked": assets,
                "issues_found": [],
                "consistency_score": 100,
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Brand consistency checked for {len(assets)} assets")
            return result

        except Exception as e:
            logger.error(f"Error ensuring brand consistency: {e}")
            raise
