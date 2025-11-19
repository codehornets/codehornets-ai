"""
Email Marketer Agent

Designs and executes email campaigns with deliverability scoring, A/B testing,
RFM segmentation, personalization, and automation workflow building.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import re
import math
import hashlib
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailType(Enum):
    """Email campaign type enumeration."""
    NEWSLETTER = "newsletter"
    PROMOTIONAL = "promotional"
    TRANSACTIONAL = "transactional"
    WELCOME = "welcome"
    ABANDONED_CART = "abandoned_cart"
    RE_ENGAGEMENT = "re_engagement"
    ANNOUNCEMENT = "announcement"
    EDUCATIONAL = "educational"


class AutomationTrigger(Enum):
    """Email automation trigger types."""
    SIGNUP = "signup"
    PURCHASE = "purchase"
    ABANDONED_CART = "abandoned_cart"
    BIRTHDAY = "birthday"
    ANNIVERSARY = "anniversary"
    INACTIVITY = "inactivity"
    MILESTONE = "milestone"
    CUSTOM_EVENT = "custom_event"


class RFMSegment(Enum):
    """RFM segment classification."""
    CHAMPIONS = "champions"
    LOYAL_CUSTOMERS = "loyal_customers"
    POTENTIAL_LOYALISTS = "potential_loyalists"
    NEW_CUSTOMERS = "new_customers"
    PROMISING = "promising"
    NEED_ATTENTION = "need_attention"
    ABOUT_TO_SLEEP = "about_to_sleep"
    AT_RISK = "at_risk"
    CANT_LOSE_THEM = "cant_lose_them"
    HIBERNATING = "hibernating"
    LOST = "lost"


class EmailMarketerAgent:
    """Email Marketer Agent for email marketing and automation."""

    # Spam trigger words
    SPAM_TRIGGERS = {
        "high_risk": ["free", "winner", "cash", "prize", "urgent", "limited time",
                      "act now", "click here", "buy now", "order now", "viagra",
                      "cialis", "weight loss", "guarantee", "no credit check"],
        "medium_risk": ["discount", "save", "deal", "offer", "promotion", "sale",
                       "cheap", "affordable", "bonus", "gift", "subscribe"],
        "low_risk": ["newsletter", "update", "announcement", "new", "join"]
    }

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Email Marketer Agent.

        Args:
            config: Optional configuration dictionary
        """
        self.agent_id = "email_marketer_001"
        self.config = config or {}
        self.campaigns: List[Dict[str, Any]] = []
        self.name = "Email Marketer"
        self.role = "Email Marketing and Automation"
        self.automation_workflows: List[Dict[str, Any]] = []
        self.segments: Dict[str, Dict[str, Any]] = {}
        self.templates: Dict[str, Dict[str, Any]] = {}

        logger.info(f"EmailMarketerAgent {self.agent_id} initialized")

    def create_email_campaign(
        self,
        campaign_name: str,
        email_type: str,
        target_list: str,
        subject_line: str,
        send_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create email campaign.

        Args:
            campaign_name: Campaign name
            email_type: Type of email campaign
            target_list: Target audience list
            subject_line: Email subject line
            send_time: Scheduled send time

        Returns:
            Campaign details
        """
        try:
            email_type_enum = EmailType(email_type.lower())

            campaign_id = f"email_{hashlib.md5(f'{campaign_name}{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            campaign = {
                "campaign_id": campaign_id,
                "name": campaign_name,
                "type": email_type_enum.value,
                "target_list": target_list,
                "subject_line": subject_line,
                "send_time": send_time or datetime.now().isoformat(),
                "emails": [],
                "status": "draft",
                "created_at": datetime.now().isoformat(),
                "metrics": {
                    "sent": 0,
                    "delivered": 0,
                    "opened": 0,
                    "clicked": 0,
                    "converted": 0,
                    "bounced": 0,
                    "unsubscribed": 0
                }
            }

            self.campaigns.append(campaign)
            logger.info(f"Email campaign created: {campaign_name}")

            return campaign

        except ValueError as e:
            logger.error(f"Invalid email type: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating email campaign: {e}")
            raise

    def score_deliverability(
        self,
        subject_line: str,
        content: str,
        sender_email: str,
        has_dkim: bool = True,
        has_spf: bool = True,
        has_dmarc: bool = False
    ) -> Dict[str, Any]:
        """Score email deliverability with multi-factor analysis.

        Args:
            subject_line: Email subject line
            content: Email content
            sender_email: Sender email address
            has_dkim: DKIM authentication enabled
            has_spf: SPF authentication enabled
            has_dmarc: DMARC policy enabled

        Returns:
            Deliverability score (0-100) with detailed analysis
        """
        try:
            score = 100
            issues = []
            warnings = []

            # Check authentication (30 points)
            auth_score = 0
            if has_dkim:
                auth_score += 12
            else:
                issues.append("DKIM authentication not configured")

            if has_spf:
                auth_score += 10
            else:
                issues.append("SPF record not configured")

            if has_dmarc:
                auth_score += 8
            else:
                warnings.append("DMARC policy not configured (recommended)")

            score = auth_score

            # Check subject line (25 points)
            subject_score = 25
            subject_lower = subject_line.lower()

            # Spam trigger analysis
            high_risk_count = sum(1 for word in self.SPAM_TRIGGERS["high_risk"] if word in subject_lower)
            medium_risk_count = sum(1 for word in self.SPAM_TRIGGERS["medium_risk"] if word in subject_lower)

            if high_risk_count > 0:
                subject_score -= high_risk_count * 8
                issues.append(f"Subject contains {high_risk_count} high-risk spam trigger(s)")

            if medium_risk_count > 2:
                subject_score -= (medium_risk_count - 2) * 3
                warnings.append(f"Subject contains {medium_risk_count} medium-risk words")

            # Subject length check
            if len(subject_line) > 60:
                subject_score -= 5
                warnings.append("Subject line too long (>60 characters)")
            elif len(subject_line) < 20:
                subject_score -= 3
                warnings.append("Subject line too short (<20 characters)")

            # All caps check
            if subject_line.isupper() and len(subject_line) > 5:
                subject_score -= 10
                issues.append("Subject line is all caps")

            # Excessive punctuation
            if subject_line.count('!') > 1 or subject_line.count('?') > 1:
                subject_score -= 5
                warnings.append("Excessive punctuation in subject")

            score += max(0, subject_score)

            # Check content (25 points)
            content_score = 25
            content_lower = content.lower()

            # Spam triggers in content
            content_high_risk = sum(1 for word in self.SPAM_TRIGGERS["high_risk"] if word in content_lower)
            if content_high_risk > 2:
                content_score -= content_high_risk * 3
                issues.append(f"Content contains {content_high_risk} high-risk spam triggers")

            # HTML/Text ratio
            html_tags = len(re.findall(r'<[^>]+>', content))
            text_length = len(re.sub(r'<[^>]+>', '', content))

            if html_tags > 0 and text_length < 200:
                content_score -= 5
                warnings.append("Low text-to-HTML ratio")

            # Image/Text balance
            img_count = len(re.findall(r'<img[^>]+>', content))
            if img_count > 5 and text_length < 500:
                content_score -= 8
                issues.append("Too many images relative to text")

            # Check for links
            link_count = len(re.findall(r'https?://', content))
            if link_count > 15:
                content_score -= 5
                warnings.append("Too many links in email")

            # Unsubscribe link check
            if 'unsubscribe' not in content_lower:
                content_score -= 10
                issues.append("Missing unsubscribe link (required by CAN-SPAM)")

            score += max(0, content_score)

            # Sender reputation (20 points)
            reputation_score = 20

            # Check sender domain
            if sender_email.endswith(('.gmail.com', '.yahoo.com', '.hotmail.com')):
                reputation_score -= 8
                warnings.append("Using free email provider (not recommended for business)")

            # Valid email format
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', sender_email):
                reputation_score -= 12
                issues.append("Invalid sender email format")

            score += max(0, reputation_score)

            # Final score clamping
            score = max(0, min(100, score))

            # Determine rating
            if score >= 80:
                rating = "Excellent"
                likelihood = "Very High"
            elif score >= 60:
                rating = "Good"
                likelihood = "High"
            elif score >= 40:
                rating = "Fair"
                likelihood = "Medium"
            elif score >= 20:
                rating = "Poor"
                likelihood = "Low"
            else:
                rating = "Very Poor"
                likelihood = "Very Low"

            result = {
                "deliverability_score": score,
                "rating": rating,
                "delivery_likelihood": likelihood,
                "authentication": {
                    "dkim": has_dkim,
                    "spf": has_spf,
                    "dmarc": has_dmarc,
                    "score": auth_score
                },
                "subject_analysis": {
                    "length": len(subject_line),
                    "high_risk_triggers": high_risk_count,
                    "medium_risk_triggers": medium_risk_count,
                    "score": max(0, subject_score)
                },
                "content_analysis": {
                    "text_length": text_length,
                    "html_tags": html_tags,
                    "images": img_count,
                    "links": link_count,
                    "has_unsubscribe": 'unsubscribe' in content_lower,
                    "score": max(0, content_score)
                },
                "issues": issues,
                "warnings": warnings,
                "recommendations": self._generate_deliverability_recommendations(issues, warnings),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Deliverability scored: {score}/100 ({rating})")
            return result

        except Exception as e:
            logger.error(f"Error scoring deliverability: {e}")
            raise

    def _generate_deliverability_recommendations(
        self,
        issues: List[str],
        warnings: List[str]
    ) -> List[str]:
        """Generate deliverability improvement recommendations."""
        recommendations = []

        if any("DKIM" in issue for issue in issues):
            recommendations.append("Configure DKIM authentication for your sending domain")
        if any("SPF" in issue for issue in issues):
            recommendations.append("Set up SPF record for your domain")
        if any("unsubscribe" in issue.lower() for issue in issues):
            recommendations.append("Add clear unsubscribe link to comply with CAN-SPAM Act")
        if any("all caps" in issue.lower() for issue in issues):
            recommendations.append("Use proper capitalization in subject line")
        if any("spam trigger" in issue.lower() for issue in issues):
            recommendations.append("Remove or replace high-risk spam trigger words")
        if any("free email provider" in warning.lower() for warning in warnings):
            recommendations.append("Use professional business domain for sender email")

        if not recommendations:
            recommendations.append("Deliverability looks good - maintain current practices")

        return recommendations

    def test_subject_lines(
        self,
        subject_lines: List[str],
        sample_size_per_variant: int = 1000,
        test_duration_hours: int = 4
    ) -> Dict[str, Any]:
        """Design A/B test for subject lines.

        Args:
            subject_lines: List of subject line variants to test
            sample_size_per_variant: Sample size for each variant
            test_duration_hours: Test duration in hours

        Returns:
            Subject line test design
        """
        try:
            if len(subject_lines) < 2:
                raise ValueError("At least 2 subject line variants required")

            test_id = f"subtest_{hashlib.md5(f'{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            # Analyze each subject line
            variants = []
            for i, subject in enumerate(subject_lines):
                variants.append({
                    "variant_id": f"variant_{chr(65 + i)}",  # A, B, C, etc.
                    "subject_line": subject,
                    "length": len(subject),
                    "word_count": len(subject.split()),
                    "has_emoji": bool(re.search(r'[\U00010000-\U0010ffff]', subject)),
                    "has_personalization": '{{' in subject or '{' in subject,
                    "sample_size": sample_size_per_variant
                })

            total_sample = sample_size_per_variant * len(subject_lines)

            result = {
                "test_id": test_id,
                "variants": variants,
                "num_variants": len(subject_lines),
                "total_sample_size": total_sample,
                "sample_per_variant": sample_size_per_variant,
                "test_duration_hours": test_duration_hours,
                "start_time": datetime.now().isoformat(),
                "end_time": (datetime.now() + timedelta(hours=test_duration_hours)).isoformat(),
                "traffic_split": {v["variant_id"]: round(100 / len(variants), 2) for v in variants},
                "success_metric": "open_rate",
                "status": "planned",
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Subject line test created with {len(subject_lines)} variants")
            return result

        except Exception as e:
            logger.error(f"Error creating subject line test: {e}")
            raise

    def segment_by_rfm(
        self,
        customers: List[Dict[str, Any]],
        recency_days: int = 365,
        frequency_threshold: int = 5,
        monetary_threshold: float = 500.0
    ) -> Dict[str, Any]:
        """Segment customers using RFM analysis.

        Args:
            customers: List of customer data with purchase history
            recency_days: Days to consider for recency (default 365)
            frequency_threshold: Purchase frequency threshold
            monetary_threshold: Monetary value threshold

        Returns:
            RFM segmentation results
        """
        try:
            if not customers:
                raise ValueError("No customers provided for RFM segmentation")

            rfm_data = []
            now = datetime.now()

            for customer in customers:
                customer_id = customer.get("customer_id", "unknown")

                # Calculate Recency (days since last purchase)
                last_purchase = customer.get("last_purchase_date")
                if last_purchase:
                    last_purchase_dt = datetime.fromisoformat(last_purchase) if isinstance(last_purchase, str) else last_purchase
                    recency = (now - last_purchase_dt).days
                else:
                    recency = recency_days + 1  # Maximum recency

                # Frequency (number of purchases)
                frequency = customer.get("purchase_count", 0)

                # Monetary (total spend)
                monetary = customer.get("total_spend", 0.0)

                rfm_data.append({
                    "customer_id": customer_id,
                    "recency": recency,
                    "frequency": frequency,
                    "monetary": monetary
                })

            # Calculate quintiles for R, F, M
            recency_values = sorted([c["recency"] for c in rfm_data])
            frequency_values = sorted([c["frequency"] for c in rfm_data], reverse=True)
            monetary_values = sorted([c["monetary"] for c in rfm_data], reverse=True)

            def calculate_quintile(value: float, sorted_values: List[float], reverse: bool = False) -> int:
                """Calculate quintile (1-5) for a value."""
                if not sorted_values:
                    return 3

                n = len(sorted_values)
                if reverse:  # For recency (lower is better)
                    sorted_values = sorted_values[::-1]

                for i, quintile_value in enumerate([
                    sorted_values[int(n * 0.2)],
                    sorted_values[int(n * 0.4)],
                    sorted_values[int(n * 0.6)],
                    sorted_values[int(n * 0.8)]
                ]):
                    if value <= quintile_value:
                        return i + 1 if not reverse else 5 - i

                return 5 if not reverse else 1

            # Assign RFM scores and segments
            segmented_customers = []
            segment_counts = defaultdict(int)

            for customer in rfm_data:
                r_score = calculate_quintile(customer["recency"], recency_values, reverse=True)
                f_score = calculate_quintile(customer["frequency"], frequency_values)
                m_score = calculate_quintile(customer["monetary"], monetary_values)

                rfm_score = f"{r_score}{f_score}{m_score}"

                # Determine segment
                segment = self._determine_rfm_segment(r_score, f_score, m_score)

                segmented_customer = {
                    **customer,
                    "r_score": r_score,
                    "f_score": f_score,
                    "m_score": m_score,
                    "rfm_score": rfm_score,
                    "segment": segment.value
                }

                segmented_customers.append(segmented_customer)
                segment_counts[segment.value] += 1

            # Calculate segment statistics
            segment_stats = []
            for segment_name, count in segment_counts.items():
                segment_customers = [c for c in segmented_customers if c["segment"] == segment_name]

                avg_recency = sum(c["recency"] for c in segment_customers) / len(segment_customers)
                avg_frequency = sum(c["frequency"] for c in segment_customers) / len(segment_customers)
                avg_monetary = sum(c["monetary"] for c in segment_customers) / len(segment_customers)

                segment_stats.append({
                    "segment": segment_name,
                    "count": count,
                    "percentage": round(count / len(customers) * 100, 2),
                    "avg_recency_days": round(avg_recency, 1),
                    "avg_frequency": round(avg_frequency, 1),
                    "avg_monetary": round(avg_monetary, 2),
                    "total_value": round(sum(c["monetary"] for c in segment_customers), 2)
                })

            result = {
                "total_customers": len(customers),
                "segments": sorted(segment_stats, key=lambda x: x["total_value"], reverse=True),
                "customers": segmented_customers,
                "recommendations": self._generate_rfm_recommendations(segment_stats),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"RFM segmentation completed for {len(customers)} customers")
            return result

        except Exception as e:
            logger.error(f"Error in RFM segmentation: {e}")
            raise

    def _determine_rfm_segment(self, r: int, f: int, m: int) -> RFMSegment:
        """Determine RFM segment based on R, F, M scores."""
        # Champions: High R, F, M
        if r >= 4 and f >= 4 and m >= 4:
            return RFMSegment.CHAMPIONS

        # Loyal Customers: High F and M, moderate R
        if f >= 4 and m >= 4:
            return RFMSegment.LOYAL_CUSTOMERS

        # Potential Loyalists: High R and M, moderate F
        if r >= 4 and m >= 3 and f >= 2:
            return RFMSegment.POTENTIAL_LOYALISTS

        # New Customers: High R, low F and M
        if r >= 4 and f <= 2:
            return RFMSegment.NEW_CUSTOMERS

        # Promising: Moderate R, F, M
        if r >= 3 and f >= 2 and m >= 2:
            return RFMSegment.PROMISING

        # Need Attention: Moderate R, declining F or M
        if r >= 2 and r <= 3:
            return RFMSegment.NEED_ATTENTION

        # About to Sleep: Low R, moderate F and M
        if r <= 2 and f >= 2 and m >= 2:
            return RFMSegment.ABOUT_TO_SLEEP

        # At Risk: Low R, high F and M
        if r <= 2 and f >= 4:
            return RFMSegment.AT_RISK

        # Can't Lose Them: Very low R, very high F and M
        if r == 1 and f >= 4 and m >= 4:
            return RFMSegment.CANT_LOSE_THEM

        # Hibernating: Low R, F, M
        if r <= 2 and f <= 2:
            return RFMSegment.HIBERNATING

        # Lost: Very low R
        if r == 1:
            return RFMSegment.LOST

        # Default
        return RFMSegment.NEED_ATTENTION

    def _generate_rfm_recommendations(self, segment_stats: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Generate marketing recommendations for each RFM segment."""
        recommendations = {}

        segment_map = {seg["segment"]: seg for seg in segment_stats}

        if "champions" in segment_map:
            recommendations["champions"] = [
                "Send exclusive VIP offers and early access to new products",
                "Request reviews and referrals",
                "Engage with loyalty program benefits"
            ]

        if "loyal_customers" in segment_map:
            recommendations["loyal_customers"] = [
                "Upsell higher-value products",
                "Request testimonials and case studies",
                "Offer loyalty rewards"
            ]

        if "potential_loyalists" in segment_map:
            recommendations["potential_loyalists"] = [
                "Offer membership or loyalty program",
                "Recommend complementary products",
                "Send personalized product suggestions"
            ]

        if "new_customers" in segment_map:
            recommendations["new_customers"] = [
                "Send welcome series and onboarding emails",
                "Offer educational content",
                "Provide discount on second purchase"
            ]

        if "at_risk" in segment_map or "cant_lose_them" in segment_map:
            recommendations["at_risk"] = [
                "Send win-back campaign with special offers",
                "Request feedback on their experience",
                "Offer personalized incentives to return"
            ]

        if "lost" in segment_map or "hibernating" in segment_map:
            recommendations["lost"] = [
                "Send re-engagement campaign",
                "Offer significant discount or promotion",
                "Consider removing from active lists if no response"
            ]

        return recommendations

    def personalize_content(
        self,
        template: str,
        customer_data: Dict[str, Any],
        default_values: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Personalize email content with dynamic token replacement.

        Args:
            template: Email template with personalization tokens
            customer_data: Customer data for personalization
            default_values: Default values for missing tokens

        Returns:
            Personalized content
        """
        try:
            default_values = default_values or {}
            personalized = template
            tokens_used = []
            tokens_missing = []

            # Find all tokens in format {{token}} or {token}
            tokens = re.findall(r'\{\{([^}]+)\}\}|\{([^}]+)\}', template)

            for token_match in tokens:
                token = token_match[0] or token_match[1]
                token = token.strip()

                # Check customer data
                if token in customer_data:
                    value = str(customer_data[token])
                    tokens_used.append(token)
                elif token in default_values:
                    value = default_values[token]
                    tokens_used.append(f"{token} (default)")
                else:
                    value = f"[{token}]"
                    tokens_missing.append(token)

                # Replace token
                personalized = personalized.replace(f"{{{{{token}}}}}", value)
                personalized = personalized.replace(f"{{{token}}}", value)

            result = {
                "original_template": template,
                "personalized_content": personalized,
                "tokens_used": tokens_used,
                "tokens_missing": tokens_missing,
                "personalization_rate": round(
                    len(tokens_used) / (len(tokens_used) + len(tokens_missing)) * 100, 2
                ) if (tokens_used or tokens_missing) else 100,
                "customer_id": customer_data.get("customer_id", "unknown"),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Content personalized with {len(tokens_used)} tokens")
            return result

        except Exception as e:
            logger.error(f"Error personalizing content: {e}")
            raise

    def optimize_send_time(
        self,
        customer_timezone: str,
        engagement_history: Optional[List[Dict[str, Any]]] = None,
        industry: str = "general"
    ) -> Dict[str, Any]:
        """Optimize email send time based on timezone and behavioral patterns.

        Args:
            customer_timezone: Customer timezone (e.g., 'America/New_York')
            engagement_history: Historical engagement data
            industry: Industry type for baseline recommendations

        Returns:
            Optimal send time recommendation
        """
        try:
            # Industry-specific best times (in 24-hour format)
            industry_baselines = {
                "general": {"hour": 10, "day": "Tuesday"},
                "b2b": {"hour": 10, "day": "Tuesday"},
                "ecommerce": {"hour": 20, "day": "Thursday"},
                "media": {"hour": 8, "day": "Monday"},
                "education": {"hour": 15, "day": "Wednesday"},
                "finance": {"hour": 9, "day": "Tuesday"},
                "healthcare": {"hour": 11, "day": "Wednesday"}
            }

            baseline = industry_baselines.get(industry.lower(), industry_baselines["general"])

            # If engagement history provided, analyze patterns
            if engagement_history:
                hour_engagement = defaultdict(list)
                day_engagement = defaultdict(list)

                for event in engagement_history:
                    if "opened_at" in event:
                        opened_dt = datetime.fromisoformat(event["opened_at"])
                        hour_engagement[opened_dt.hour].append(1)
                        day_engagement[opened_dt.strftime("%A")].append(1)

                # Find best hour
                if hour_engagement:
                    best_hour = max(hour_engagement.items(), key=lambda x: len(x[1]))[0]
                else:
                    best_hour = baseline["hour"]

                # Find best day
                if day_engagement:
                    best_day = max(day_engagement.items(), key=lambda x: len(x[1]))[0]
                else:
                    best_day = baseline["day"]
            else:
                best_hour = baseline["hour"]
                best_day = baseline["day"]

            # Calculate next optimal send time
            now = datetime.now()
            days_ahead = (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].index(best_day) - now.weekday()) % 7
            if days_ahead == 0 and now.hour >= best_hour:
                days_ahead = 7

            optimal_datetime = now + timedelta(days=days_ahead)
            optimal_datetime = optimal_datetime.replace(hour=best_hour, minute=0, second=0, microsecond=0)

            result = {
                "customer_timezone": customer_timezone,
                "industry": industry,
                "recommended_day": best_day,
                "recommended_hour": best_hour,
                "recommended_time_24h": f"{best_hour:02d}:00",
                "recommended_time_12h": f"{best_hour % 12 or 12}:00 {'AM' if best_hour < 12 else 'PM'}",
                "next_optimal_send": optimal_datetime.isoformat(),
                "based_on": "engagement_history" if engagement_history else "industry_baseline",
                "confidence": "high" if engagement_history and len(engagement_history) > 10 else "medium",
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Optimal send time: {best_day} at {best_hour:02d}:00")
            return result

        except Exception as e:
            logger.error(f"Error optimizing send time: {e}")
            raise

    def validate_template(
        self,
        html_template: str,
        test_widths: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """Validate email template for responsive design.

        Args:
            html_template: HTML email template
            test_widths: Screen widths to test (default: [320, 768, 1024])

        Returns:
            Template validation results
        """
        try:
            test_widths = test_widths or [320, 768, 1024]  # Mobile, Tablet, Desktop

            issues = []
            warnings = []
            score = 100

            # Check for responsive meta tag
            if 'viewport' not in html_template.lower():
                issues.append("Missing viewport meta tag")
                score -= 15

            # Check for media queries
            media_query_count = len(re.findall(r'@media', html_template))
            if media_query_count == 0:
                warnings.append("No media queries found - template may not be responsive")
                score -= 10

            # Check for fixed widths
            fixed_widths = re.findall(r'width:\s*(\d+)px', html_template)
            if len(fixed_widths) > 5:
                warnings.append(f"Found {len(fixed_widths)} fixed pixel widths - consider using percentages")
                score -= 5

            # Check for table-based layout (common in email)
            table_count = len(re.findall(r'<table', html_template, re.IGNORECASE))
            if table_count == 0:
                warnings.append("No tables found - ensure layout is email-client compatible")

            # Check image handling
            images = re.findall(r'<img[^>]+>', html_template, re.IGNORECASE)
            images_without_alt = len([img for img in images if 'alt=' not in img.lower()])
            if images_without_alt > 0:
                issues.append(f"{images_without_alt} images missing alt text")
                score -= images_without_alt * 2

            # Check for inline CSS (required for email)
            inline_styles = len(re.findall(r'style="[^"]+"', html_template))
            external_styles = len(re.findall(r'<link[^>]+stylesheet', html_template))

            if external_styles > 0:
                issues.append("External stylesheets detected - use inline styles for email")
                score -= 20

            if inline_styles < 5 and external_styles == 0:
                warnings.append("Limited styling detected")

            # Check width constraints
            max_width_set = 'max-width' in html_template.lower()
            if not max_width_set:
                warnings.append("Consider setting max-width for better desktop display")
                score -= 5

            # Dark mode support check
            has_dark_mode = '@media (prefers-color-scheme: dark)' in html_template
            if not has_dark_mode:
                warnings.append("No dark mode support detected")

            score = max(0, score)

            # Determine rating
            if score >= 90:
                rating = "Excellent"
            elif score >= 75:
                rating = "Good"
            elif score >= 60:
                rating = "Fair"
            else:
                rating = "Needs Improvement"

            result = {
                "validation_score": score,
                "rating": rating,
                "responsive_design": {
                    "has_viewport_meta": 'viewport' in html_template.lower(),
                    "media_queries_count": media_query_count,
                    "has_max_width": max_width_set,
                    "has_dark_mode": has_dark_mode
                },
                "compatibility": {
                    "table_count": table_count,
                    "inline_styles_count": inline_styles,
                    "external_styles_count": external_styles,
                    "total_images": len(images),
                    "images_with_alt": len(images) - images_without_alt
                },
                "tested_widths": test_widths,
                "issues": issues,
                "warnings": warnings,
                "recommendations": self._generate_template_recommendations(issues, warnings),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Template validated: {score}/100 ({rating})")
            return result

        except Exception as e:
            logger.error(f"Error validating template: {e}")
            raise

    def _generate_template_recommendations(
        self,
        issues: List[str],
        warnings: List[str]
    ) -> List[str]:
        """Generate template improvement recommendations."""
        recommendations = []

        if any("viewport" in issue.lower() for issue in issues):
            recommendations.append("Add viewport meta tag: <meta name='viewport' content='width=device-width, initial-scale=1.0'>")

        if any("alt text" in issue.lower() for issue in issues):
            recommendations.append("Add descriptive alt text to all images for accessibility")

        if any("external stylesheet" in issue.lower() for issue in issues):
            recommendations.append("Convert external CSS to inline styles for better email client support")

        if any("media queries" in warning.lower() for warning in warnings):
            recommendations.append("Add media queries to optimize for different screen sizes")

        if any("max-width" in warning.lower() for warning in warnings):
            recommendations.append("Set max-width (600px recommended) for better desktop display")

        if not recommendations:
            recommendations.append("Template looks good - test across different email clients")

        return recommendations

    def predict_unsubscribe_rate(
        self,
        email_frequency_per_month: int,
        content_relevance_score: float,
        segment_engagement_rate: float,
        historical_unsubscribe_rate: Optional[float] = None
    ) -> Dict[str, Any]:
        """Predict unsubscribe rate based on multiple factors.

        Args:
            email_frequency_per_month: Number of emails sent per month
            content_relevance_score: Content relevance score (0-100)
            segment_engagement_rate: Segment engagement rate (0-1)
            historical_unsubscribe_rate: Historical unsubscribe rate if available

        Returns:
            Predicted unsubscribe rate with risk assessment
        """
        try:
            # Base unsubscribe rate (industry average: 0.5%)
            base_rate = 0.005

            # Frequency impact (exponential increase with frequency)
            # Optimal frequency: 4-8 emails/month
            if email_frequency_per_month <= 8:
                frequency_factor = 1.0
            else:
                frequency_factor = 1.0 + (email_frequency_per_month - 8) * 0.15

            # Relevance impact (inverse relationship)
            relevance_factor = 1.0 + (1.0 - content_relevance_score / 100) * 0.8

            # Engagement impact (inverse relationship)
            engagement_factor = 1.0 + (1.0 - segment_engagement_rate) * 0.6

            # Calculate predicted rate
            predicted_rate = base_rate * frequency_factor * relevance_factor * engagement_factor

            # Apply historical data if available (weighted average)
            if historical_unsubscribe_rate is not None:
                predicted_rate = 0.6 * predicted_rate + 0.4 * historical_unsubscribe_rate

            # Ensure rate is within reasonable bounds
            predicted_rate = max(0.001, min(0.10, predicted_rate))

            # Risk assessment
            if predicted_rate < 0.005:
                risk_level = "Low"
                risk_color = "green"
            elif predicted_rate < 0.015:
                risk_level = "Medium"
                risk_color = "yellow"
            else:
                risk_level = "High"
                risk_color = "red"

            # Generate recommendations
            recommendations = []
            if email_frequency_per_month > 12:
                recommendations.append("Reduce email frequency to decrease unsubscribe risk")
            if content_relevance_score < 60:
                recommendations.append("Improve content relevance and personalization")
            if segment_engagement_rate < 0.2:
                recommendations.append("Review segment targeting - consider re-engagement campaign")

            result = {
                "predicted_unsubscribe_rate": round(predicted_rate, 5),
                "predicted_percentage": round(predicted_rate * 100, 3),
                "risk_level": risk_level,
                "risk_color": risk_color,
                "factors": {
                    "email_frequency": email_frequency_per_month,
                    "frequency_factor": round(frequency_factor, 3),
                    "content_relevance_score": content_relevance_score,
                    "relevance_factor": round(relevance_factor, 3),
                    "engagement_rate": segment_engagement_rate,
                    "engagement_factor": round(engagement_factor, 3)
                },
                "base_rate": base_rate,
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Predicted unsubscribe rate: {predicted_rate:.3%} ({risk_level} risk)")
            return result

        except Exception as e:
            logger.error(f"Error predicting unsubscribe rate: {e}")
            raise

    def build_automation_workflow(
        self,
        workflow_name: str,
        trigger: str,
        steps: List[Dict[str, Any]],
        goal: str
    ) -> Dict[str, Any]:
        """Build email automation workflow (drip campaign).

        Args:
            workflow_name: Workflow name
            trigger: Trigger event for automation
            steps: List of workflow steps
            goal: Campaign goal

        Returns:
            Automation workflow configuration
        """
        try:
            trigger_enum = AutomationTrigger(trigger.lower())

            workflow_id = f"workflow_{hashlib.md5(f'{workflow_name}{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            # Validate and enrich steps
            enriched_steps = []
            total_duration_hours = 0

            for i, step in enumerate(steps):
                step_id = f"step_{i + 1}"
                delay_hours = step.get("delay_hours", 0)
                total_duration_hours += delay_hours

                enriched_step = {
                    "step_id": step_id,
                    "step_number": i + 1,
                    "email_type": step.get("email_type", "follow_up"),
                    "subject_line": step.get("subject_line", ""),
                    "template_id": step.get("template_id", ""),
                    "delay_hours": delay_hours,
                    "delay_description": self._format_delay(delay_hours),
                    "conditions": step.get("conditions", []),
                    "send_time_optimization": step.get("send_time_optimization", True)
                }

                enriched_steps.append(enriched_step)

            workflow = {
                "workflow_id": workflow_id,
                "name": workflow_name,
                "trigger": trigger_enum.value,
                "goal": goal,
                "steps": enriched_steps,
                "total_steps": len(enriched_steps),
                "total_duration_hours": total_duration_hours,
                "total_duration_description": self._format_delay(total_duration_hours),
                "status": "draft",
                "created_at": datetime.now().isoformat(),
                "metrics": {
                    "subscribers": 0,
                    "completed": 0,
                    "conversion_rate": 0.0
                }
            }

            self.automation_workflows.append(workflow)
            logger.info(f"Automation workflow created: {workflow_name} with {len(enriched_steps)} steps")

            return workflow

        except ValueError as e:
            logger.error(f"Invalid trigger type: {e}")
            raise
        except Exception as e:
            logger.error(f"Error building automation workflow: {e}")
            raise

    def _format_delay(self, hours: int) -> str:
        """Format delay hours into human-readable description."""
        if hours < 24:
            return f"{hours} hour{'s' if hours != 1 else ''}"
        elif hours < 168:  # Less than a week
            days = hours // 24
            return f"{days} day{'s' if days != 1 else ''}"
        else:
            weeks = hours // 168
            return f"{weeks} week{'s' if weeks != 1 else ''}"

    def track_engagement(
        self,
        campaign_id: str,
        metrics: Dict[str, int]
    ) -> Dict[str, Any]:
        """Track email campaign engagement metrics.

        Args:
            campaign_id: Campaign identifier
            metrics: Engagement metrics

        Returns:
            Engagement analysis
        """
        try:
            sent = metrics.get("sent", 0)
            delivered = metrics.get("delivered", 0)
            opened = metrics.get("opened", 0)
            clicked = metrics.get("clicked", 0)
            converted = metrics.get("converted", 0)
            bounced = metrics.get("bounced", 0)
            unsubscribed = metrics.get("unsubscribed", 0)

            # Calculate rates
            delivery_rate = delivered / sent if sent > 0 else 0
            open_rate = opened / delivered if delivered > 0 else 0
            click_rate = clicked / delivered if delivered > 0 else 0
            click_to_open_rate = clicked / opened if opened > 0 else 0
            conversion_rate = converted / delivered if delivered > 0 else 0
            bounce_rate = bounced / sent if sent > 0 else 0
            unsubscribe_rate = unsubscribed / delivered if delivered > 0 else 0

            # Industry benchmarks (average)
            benchmarks = {
                "open_rate": 0.21,  # 21%
                "click_rate": 0.026,  # 2.6%
                "click_to_open_rate": 0.14,  # 14%
                "bounce_rate": 0.01,  # 1%
                "unsubscribe_rate": 0.002  # 0.2%
            }

            # Performance vs benchmarks
            performance = {
                "open_rate": "above" if open_rate > benchmarks["open_rate"] else "below",
                "click_rate": "above" if click_rate > benchmarks["click_rate"] else "below",
                "bounce_rate": "above" if bounce_rate > benchmarks["bounce_rate"] else "below",
                "unsubscribe_rate": "above" if unsubscribe_rate > benchmarks["unsubscribe_rate"] else "below"
            }

            # Overall health score
            health_score = (
                (min(1, open_rate / benchmarks["open_rate"]) * 30) +
                (min(1, click_rate / benchmarks["click_rate"]) * 30) +
                (min(1, benchmarks["bounce_rate"] / max(0.001, bounce_rate)) * 20) +
                (min(1, benchmarks["unsubscribe_rate"] / max(0.0001, unsubscribe_rate)) * 20)
            )

            # Generate insights
            insights = []
            if open_rate < benchmarks["open_rate"] * 0.7:
                insights.append("Low open rate - review subject lines and sender name")
            if click_rate < benchmarks["click_rate"] * 0.7:
                insights.append("Low click rate - improve call-to-action and content relevance")
            if bounce_rate > benchmarks["bounce_rate"] * 2:
                insights.append("High bounce rate - clean email list and verify addresses")
            if unsubscribe_rate > benchmarks["unsubscribe_rate"] * 3:
                insights.append("High unsubscribe rate - review content relevance and frequency")

            if not insights:
                insights.append("Campaign performance is healthy - maintain current strategy")

            result = {
                "campaign_id": campaign_id,
                "metrics": {
                    "sent": sent,
                    "delivered": delivered,
                    "opened": opened,
                    "clicked": clicked,
                    "converted": converted,
                    "bounced": bounced,
                    "unsubscribed": unsubscribed
                },
                "rates": {
                    "delivery_rate": round(delivery_rate, 4),
                    "open_rate": round(open_rate, 4),
                    "click_rate": round(click_rate, 4),
                    "click_to_open_rate": round(click_to_open_rate, 4),
                    "conversion_rate": round(conversion_rate, 4),
                    "bounce_rate": round(bounce_rate, 4),
                    "unsubscribe_rate": round(unsubscribe_rate, 4)
                },
                "benchmarks": benchmarks,
                "performance_vs_benchmark": performance,
                "health_score": round(health_score, 2),
                "insights": insights,
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Engagement tracked for campaign {campaign_id}, health score: {health_score:.1f}")
            return result

        except Exception as e:
            logger.error(f"Error tracking engagement: {e}")
            raise

    def design_email(
        self,
        template_type: str,
        content: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Design email template.

        Args:
            template_type: Type of email template
            content: Email content

        Returns:
            Email design details
        """
        try:
            email_id = f"email_{hashlib.md5(f'{template_type}{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            email = {
                "email_id": email_id,
                "template_type": template_type,
                "content": content,
                "status": "draft",
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Email designed: {email_id}")
            return email

        except Exception as e:
            logger.error(f"Error designing email: {e}")
            raise

    def segment_audience(
        self,
        criteria: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Segment email audience.

        Args:
            criteria: Segmentation criteria

        Returns:
            Segment details
        """
        try:
            segment_id = f"segment_{hashlib.md5(f'{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            segment = {
                "segment_id": segment_id,
                "criteria": criteria,
                "estimated_size": 0,
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Audience segment created: {segment_id}")
            return segment

        except Exception as e:
            logger.error(f"Error segmenting audience: {e}")
            raise

    def setup_automation(
        self,
        trigger: str,
        workflow: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Setup email automation workflow.

        Args:
            trigger: Automation trigger
            workflow: Workflow steps

        Returns:
            Automation configuration
        """
        try:
            automation_id = f"automation_{hashlib.md5(f'{trigger}{datetime.now().timestamp()}'.encode()).hexdigest()[:12]}"

            automation = {
                "automation_id": automation_id,
                "trigger": trigger,
                "workflow": workflow,
                "status": "active",
                "created_at": datetime.now().isoformat()
            }

            logger.info(f"Automation setup: {automation_id}")
            return automation

        except Exception as e:
            logger.error(f"Error setting up automation: {e}")
            raise

    def analyze_campaign(
        self,
        campaign_id: str
    ) -> Dict[str, Any]:
        """Analyze email campaign performance.

        Args:
            campaign_id: Campaign identifier

        Returns:
            Campaign analysis
        """
        try:
            campaign = next((c for c in self.campaigns if c["campaign_id"] == campaign_id), None)
            if not campaign:
                raise ValueError(f"Campaign {campaign_id} not found")

            metrics = campaign.get("metrics", {})

            result = {
                "campaign_id": campaign_id,
                "open_rate": metrics.get("opened", 0) / max(1, metrics.get("delivered", 1)),
                "click_rate": metrics.get("clicked", 0) / max(1, metrics.get("delivered", 1)),
                "conversion_rate": metrics.get("converted", 0) / max(1, metrics.get("delivered", 1)),
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Campaign analyzed: {campaign_id}")
            return result

        except Exception as e:
            logger.error(f"Error analyzing campaign: {e}")
            raise
