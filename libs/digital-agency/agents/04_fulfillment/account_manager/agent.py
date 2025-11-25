"""Account Manager Agent - Client relationship management"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import uuid


class AccountManagerAgent:
    """Agent responsible for maintaining client relationships and satisfaction."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Account Manager Agent."""
        self.config = config or {}
        self.name = "Account Manager"
        self.role = "Client Relationship Manager"
        self.goal = "Ensure client satisfaction and identify growth opportunities"
        self.logger = logging.getLogger(__name__)

        # Initialize internal state
        self.client_history: Dict[str, List[Dict[str, Any]]] = {}
        self.escalations: Dict[str, Dict[str, Any]] = {}
        self.satisfaction_data: Dict[str, Dict[str, Any]] = {}

    def check_in_with_client(self, client_id: str) -> Dict[str, Any]:
        """
        Conduct regular client check-ins with CSAT survey logic.

        Args:
            client_id: Unique identifier for the client

        Returns:
            Dict containing check-in results, satisfaction score, and concerns
        """
        try:
            self.logger.info(f"Starting check-in with client: {client_id}")

            # Validate input
            if not client_id or not isinstance(client_id, str):
                raise ValueError("Invalid client_id provided")

            # Generate check-in ID
            check_in_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()

            # Retrieve client history for context
            history = self.client_history.get(client_id, [])
            recent_interactions = history[-5:] if history else []

            # Calculate baseline satisfaction from history
            baseline_score = self._calculate_baseline_satisfaction(recent_interactions)

            # Prepare CSAT survey questions
            survey_questions = self._generate_csat_questions(client_id)

            # Simulate survey responses (in production, would wait for actual responses)
            csat_responses = self._simulate_csat_responses(survey_questions)

            # Calculate CSAT score (1-5 scale)
            csat_score = sum(r['score'] for r in csat_responses) / len(csat_responses)

            # Identify concerns from responses
            concerns = self._identify_concerns_from_csat(csat_responses)

            # Determine sentiment trend
            sentiment_trend = self._calculate_sentiment_trend(baseline_score, csat_score)

            # Generate recommendations
            recommendations = self._generate_recommendations(csat_score, concerns)

            # Record check-in in history
            check_in_record = {
                "check_in_id": check_in_id,
                "timestamp": timestamp,
                "csat_score": round(csat_score, 2),
                "concerns": concerns,
                "sentiment_trend": sentiment_trend
            }

            if client_id not in self.client_history:
                self.client_history[client_id] = []
            self.client_history[client_id].append(check_in_record)

            self.logger.info(f"Check-in completed for client {client_id} with score: {csat_score:.2f}")

            return {
                "check_in_id": check_in_id,
                "client_id": client_id,
                "timestamp": timestamp,
                "satisfaction_score": round(csat_score, 2),
                "baseline_score": round(baseline_score, 2),
                "sentiment_trend": sentiment_trend,
                "concerns": concerns,
                "recommendations": recommendations,
                "survey_responses": csat_responses,
                "follow_up_required": csat_score < 3.5 or len(concerns) > 0
            }

        except Exception as e:
            self.logger.error(f"Error during client check-in for {client_id}: {str(e)}")
            return {
                "error": str(e),
                "client_id": client_id,
                "satisfaction_score": 0,
                "concerns": ["Error occurred during check-in"]
            }

    def handle_escalation(self, issue: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle client escalations with priority routing.

        Args:
            issue: Dict containing issue details (client_id, description, severity, etc.)

        Returns:
            Dict with escalation handling results and resolution path
        """
        try:
            self.logger.warning(f"Handling escalation: {issue.get('description', 'No description')}")

            # Validate issue data
            required_fields = ['client_id', 'description', 'severity']
            for field in required_fields:
                if field not in issue:
                    raise ValueError(f"Missing required field: {field}")

            # Generate escalation ID
            issue_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()

            # Extract issue details
            client_id = issue['client_id']
            description = issue['description']
            severity = issue.get('severity', 'medium')  # low, medium, high, critical
            category = issue.get('category', 'general')

            # Calculate priority score (0-100)
            priority_score = self._calculate_priority_score(issue, client_id)

            # Determine routing based on priority and category
            routing = self._determine_escalation_routing(priority_score, severity, category)

            # Estimate resolution time
            estimated_resolution = self._estimate_resolution_time(severity, category)

            # Generate resolution plan
            resolution_plan = self._create_resolution_plan(issue, routing)

            # Assign owner
            assigned_to = routing['primary_handler']

            # Create escalation record
            escalation_record = {
                "issue_id": issue_id,
                "client_id": client_id,
                "timestamp": timestamp,
                "description": description,
                "severity": severity,
                "category": category,
                "priority_score": priority_score,
                "status": "escalated",
                "routing": routing,
                "assigned_to": assigned_to,
                "resolution_plan": resolution_plan,
                "estimated_resolution": estimated_resolution,
                "resolved": False
            }

            # Store escalation
            self.escalations[issue_id] = escalation_record

            # Trigger notifications
            notifications = self._trigger_escalation_notifications(escalation_record)

            self.logger.info(f"Escalation {issue_id} created with priority {priority_score} and routed to {assigned_to}")

            return {
                "issue_id": issue_id,
                "client_id": client_id,
                "timestamp": timestamp,
                "resolved": False,
                "status": "escalated",
                "priority_score": priority_score,
                "severity": severity,
                "routing": routing,
                "assigned_to": assigned_to,
                "estimated_resolution": estimated_resolution,
                "resolution_plan": resolution_plan,
                "notifications_sent": notifications,
                "sla_deadline": self._calculate_sla_deadline(severity)
            }

        except Exception as e:
            self.logger.error(f"Error handling escalation: {str(e)}")
            return {
                "error": str(e),
                "issue_id": "",
                "resolved": False,
                "resolution": "Error occurred during escalation handling"
            }

    def identify_upsell_opportunities(self, client_id: str) -> List[Dict[str, Any]]:
        """
        Identify upsell and cross-sell opportunities with scoring algorithm.

        Args:
            client_id: Unique identifier for the client

        Returns:
            List of opportunity dicts with scores and recommendations
        """
        try:
            self.logger.info(f"Identifying upsell opportunities for client: {client_id}")

            # Validate input
            if not client_id:
                raise ValueError("Invalid client_id provided")

            # Gather client data
            client_satisfaction = self.satisfaction_data.get(client_id, {})
            client_history = self.client_history.get(client_id, [])

            # Calculate client health score (0-100)
            health_score = self._calculate_client_health_score(client_id)

            # Only pursue upsells for healthy client relationships
            if health_score < 60:
                self.logger.info(f"Client {client_id} health score too low ({health_score}) for upsell")
                return []

            opportunities = []

            # Identify service expansion opportunities
            service_expansion = self._identify_service_expansion(client_id, client_history)
            if service_expansion:
                opportunities.extend(service_expansion)

            # Identify volume increase opportunities
            volume_opportunities = self._identify_volume_opportunities(client_id, client_history)
            if volume_opportunities:
                opportunities.extend(volume_opportunities)

            # Identify premium tier upgrade opportunities
            tier_upgrade = self._identify_tier_upgrade_opportunity(client_id, health_score)
            if tier_upgrade:
                opportunities.append(tier_upgrade)

            # Score each opportunity
            for opp in opportunities:
                opp['score'] = self._calculate_opportunity_score(opp, health_score)
                opp['recommended_timing'] = self._determine_opportunity_timing(opp, client_history)
                opp['talking_points'] = self._generate_talking_points(opp, client_id)

            # Sort by score descending
            opportunities.sort(key=lambda x: x['score'], reverse=True)

            self.logger.info(f"Identified {len(opportunities)} upsell opportunities for {client_id}")

            return opportunities

        except Exception as e:
            self.logger.error(f"Error identifying upsell opportunities for {client_id}: {str(e)}")
            return []

    def measure_satisfaction(self, client_id: str) -> Dict[str, Any]:
        """
        Measure client satisfaction with NPS calculation.

        Args:
            client_id: Unique identifier for the client

        Returns:
            Dict containing CSAT score, NPS score, and feedback analysis
        """
        try:
            self.logger.info(f"Measuring satisfaction for client: {client_id}")

            # Validate input
            if not client_id:
                raise ValueError("Invalid client_id provided")

            timestamp = datetime.now().isoformat()

            # Gather historical satisfaction data
            history = self.client_history.get(client_id, [])

            # Calculate CSAT (Customer Satisfaction Score) - 1-5 scale
            csat_scores = [h.get('csat_score', 0) for h in history if 'csat_score' in h]
            csat_score = sum(csat_scores) / len(csat_scores) if csat_scores else 0

            # Conduct NPS survey (0-10 scale: "How likely are you to recommend us?")
            nps_response = self._conduct_nps_survey(client_id)
            nps_score = nps_response['score']

            # Calculate NPS category
            nps_category = self._categorize_nps_score(nps_score)

            # Gather qualitative feedback
            feedback = self._gather_client_feedback(client_id, history)

            # Perform sentiment analysis on feedback
            sentiment_analysis = self._analyze_feedback_sentiment(feedback)

            # Identify key themes
            themes = self._extract_feedback_themes(feedback)

            # Calculate trend over time
            trend = self._calculate_satisfaction_trend(history)

            # Generate insights
            insights = self._generate_satisfaction_insights(
                csat_score, nps_score, sentiment_analysis, themes
            )

            # Determine action items
            action_items = self._generate_action_items(csat_score, nps_score, themes)

            # Store satisfaction data
            satisfaction_record = {
                "client_id": client_id,
                "timestamp": timestamp,
                "csat_score": round(csat_score, 2),
                "nps_score": nps_score,
                "nps_category": nps_category,
                "sentiment": sentiment_analysis['overall_sentiment'],
                "themes": themes
            }

            self.satisfaction_data[client_id] = satisfaction_record

            self.logger.info(f"Satisfaction measured for {client_id}: CSAT={csat_score:.2f}, NPS={nps_score}")

            return {
                "client_id": client_id,
                "timestamp": timestamp,
                "csat_score": round(csat_score, 2),
                "nps_score": nps_score,
                "nps_category": nps_category,
                "feedback": feedback,
                "sentiment_analysis": sentiment_analysis,
                "themes": themes,
                "trend": trend,
                "insights": insights,
                "action_items": action_items,
                "measurement_count": len(history)
            }

        except Exception as e:
            self.logger.error(f"Error measuring satisfaction for {client_id}: {str(e)}")
            return {
                "error": str(e),
                "client_id": client_id,
                "csat_score": 0,
                "nps_score": 0,
                "feedback": []
            }

    # Helper methods

    def _calculate_baseline_satisfaction(self, interactions: List[Dict[str, Any]]) -> float:
        """Calculate baseline satisfaction from historical interactions."""
        if not interactions:
            return 3.5  # Neutral baseline

        scores = [i.get('csat_score', 3.5) for i in interactions]
        return sum(scores) / len(scores)

    def _generate_csat_questions(self, client_id: str) -> List[Dict[str, str]]:
        """Generate CSAT survey questions."""
        return [
            {"id": "q1", "question": "How satisfied are you with our communication?", "category": "communication"},
            {"id": "q2", "question": "How satisfied are you with the quality of deliverables?", "category": "quality"},
            {"id": "q3", "question": "How satisfied are you with meeting deadlines?", "category": "timeliness"},
            {"id": "q4", "question": "How satisfied are you with our responsiveness?", "category": "responsiveness"},
            {"id": "q5", "question": "How satisfied are you overall with our service?", "category": "overall"}
        ]

    def _simulate_csat_responses(self, questions: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Simulate CSAT responses (in production, would collect real responses)."""
        import random
        responses = []
        for q in questions:
            score = random.uniform(3.0, 5.0)  # Simulate positive responses
            responses.append({
                "question_id": q['id'],
                "category": q['category'],
                "score": score,
                "comment": "" if score >= 4.0 else "Could be improved"
            })
        return responses

    def _identify_concerns_from_csat(self, responses: List[Dict[str, Any]]) -> List[str]:
        """Identify concerns from low CSAT scores."""
        concerns = []
        for r in responses:
            if r['score'] < 3.5:
                concerns.append(f"Low satisfaction in {r['category']} (score: {r['score']:.1f})")
        return concerns

    def _calculate_sentiment_trend(self, baseline: float, current: float) -> str:
        """Calculate sentiment trend."""
        diff = current - baseline
        if diff > 0.3:
            return "improving"
        elif diff < -0.3:
            return "declining"
        else:
            return "stable"

    def _generate_recommendations(self, csat_score: float, concerns: List[str]) -> List[str]:
        """Generate recommendations based on CSAT results."""
        recommendations = []

        if csat_score < 3.0:
            recommendations.append("Schedule immediate intervention meeting")
            recommendations.append("Escalate to senior account management")
        elif csat_score < 4.0:
            recommendations.append("Address specific concerns in next check-in")
            recommendations.append("Increase communication frequency")
        else:
            recommendations.append("Maintain current service level")
            recommendations.append("Explore upsell opportunities")

        if concerns:
            recommendations.append(f"Address {len(concerns)} specific concern(s)")

        return recommendations

    def _calculate_priority_score(self, issue: Dict[str, Any], client_id: str) -> int:
        """Calculate priority score for escalation (0-100)."""
        score = 0

        # Severity contribution (0-40 points)
        severity_map = {'low': 10, 'medium': 20, 'high': 30, 'critical': 40}
        score += severity_map.get(issue.get('severity', 'medium'), 20)

        # Client value contribution (0-30 points)
        client_health = self._calculate_client_health_score(client_id)
        score += int(client_health * 0.3)

        # Impact contribution (0-20 points)
        impact = issue.get('impact', 'single_user')
        impact_map = {'single_user': 5, 'team': 10, 'organization': 15, 'multiple_orgs': 20}
        score += impact_map.get(impact, 10)

        # Urgency contribution (0-10 points)
        if issue.get('blocking', False):
            score += 10

        return min(score, 100)

    def _determine_escalation_routing(self, priority: int, severity: str, category: str) -> Dict[str, Any]:
        """Determine routing for escalation based on priority."""
        if priority >= 80:
            return {
                "tier": "executive",
                "primary_handler": "VP of Client Success",
                "cc": ["Account Manager", "Technical Lead", "CEO"],
                "response_time_minutes": 15
            }
        elif priority >= 60:
            return {
                "tier": "senior",
                "primary_handler": "Senior Account Manager",
                "cc": ["Account Manager", "Technical Lead"],
                "response_time_minutes": 60
            }
        else:
            return {
                "tier": "standard",
                "primary_handler": "Account Manager",
                "cc": ["Technical Support"],
                "response_time_minutes": 240
            }

    def _estimate_resolution_time(self, severity: str, category: str) -> Dict[str, Any]:
        """Estimate resolution time based on severity and category."""
        time_map = {
            'critical': {'hours': 4, 'business_days': 0.5},
            'high': {'hours': 24, 'business_days': 1},
            'medium': {'hours': 72, 'business_days': 3},
            'low': {'hours': 120, 'business_days': 5}
        }

        estimate = time_map.get(severity, time_map['medium'])
        deadline = datetime.now() + timedelta(hours=estimate['hours'])

        return {
            "estimated_hours": estimate['hours'],
            "estimated_business_days": estimate['business_days'],
            "target_deadline": deadline.isoformat()
        }

    def _create_resolution_plan(self, issue: Dict[str, Any], routing: Dict[str, Any]) -> List[str]:
        """Create resolution plan steps."""
        return [
            f"Acknowledge issue within {routing['response_time_minutes']} minutes",
            "Investigate root cause",
            "Develop solution approach",
            "Implement fix or workaround",
            "Verify resolution with client",
            "Document lessons learned"
        ]

    def _trigger_escalation_notifications(self, escalation: Dict[str, Any]) -> List[str]:
        """Trigger notifications for escalation (returns list of notification IDs)."""
        notifications = []

        # Notify primary handler
        notifications.append(f"email_to_{escalation['assigned_to']}")

        # Notify CC'd parties
        for cc in escalation['routing']['cc']:
            notifications.append(f"email_to_{cc}")

        # Create Slack notification for critical issues
        if escalation['severity'] == 'critical':
            notifications.append("slack_alert_critical_channel")

        return notifications

    def _calculate_sla_deadline(self, severity: str) -> str:
        """Calculate SLA deadline based on severity."""
        hours_map = {'critical': 4, 'high': 24, 'medium': 72, 'low': 120}
        hours = hours_map.get(severity, 72)
        deadline = datetime.now() + timedelta(hours=hours)
        return deadline.isoformat()

    def _calculate_client_health_score(self, client_id: str) -> float:
        """Calculate overall client health score (0-100)."""
        satisfaction = self.satisfaction_data.get(client_id, {})
        history = self.client_history.get(client_id, [])

        # CSAT contribution (40%)
        csat_score = satisfaction.get('csat_score', 3.5)
        csat_contribution = (csat_score / 5.0) * 40

        # NPS contribution (30%)
        nps_score = satisfaction.get('nps_score', 7)
        nps_contribution = (nps_score / 10.0) * 30

        # Engagement contribution (20%)
        engagement_score = min(len(history) / 10.0, 1.0) * 20

        # Issue history contribution (10%)
        escalations_count = len([e for e in self.escalations.values() if e['client_id'] == client_id])
        issue_penalty = min(escalations_count * 2, 10)

        health_score = csat_contribution + nps_contribution + engagement_score + (10 - issue_penalty)
        return round(health_score, 1)

    def _identify_service_expansion(self, client_id: str, history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify service expansion opportunities."""
        opportunities = []

        # Example: if client uses only social media, suggest content marketing
        opportunities.append({
            "type": "service_expansion",
            "service": "Content Marketing",
            "description": "Expand from social media to full content strategy",
            "estimated_value": 5000,
            "probability": 0.65
        })

        return opportunities

    def _identify_volume_opportunities(self, client_id: str, history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify volume increase opportunities."""
        opportunities = []

        # Example: increase monthly post volume
        opportunities.append({
            "type": "volume_increase",
            "service": "Social Media Management",
            "description": "Increase from 12 to 20 posts per month",
            "estimated_value": 2000,
            "probability": 0.75
        })

        return opportunities

    def _identify_tier_upgrade_opportunity(self, client_id: str, health_score: float) -> Optional[Dict[str, Any]]:
        """Identify tier upgrade opportunity."""
        if health_score > 80:
            return {
                "type": "tier_upgrade",
                "service": "Premium Support Package",
                "description": "Upgrade to premium tier with dedicated strategist",
                "estimated_value": 10000,
                "probability": 0.50
            }
        return None

    def _calculate_opportunity_score(self, opportunity: Dict[str, Any], health_score: float) -> float:
        """Calculate opportunity score (0-100)."""
        base_score = opportunity['probability'] * 50
        value_score = min(opportunity['estimated_value'] / 200, 30)
        health_bonus = (health_score / 100) * 20

        return round(base_score + value_score + health_bonus, 1)

    def _determine_opportunity_timing(self, opportunity: Dict[str, Any], history: List[Dict[str, Any]]) -> str:
        """Determine best timing for opportunity."""
        if opportunity['probability'] > 0.7:
            return "immediate"
        elif opportunity['probability'] > 0.5:
            return "this_quarter"
        else:
            return "next_quarter"

    def _generate_talking_points(self, opportunity: Dict[str, Any], client_id: str) -> List[str]:
        """Generate talking points for opportunity."""
        return [
            f"Highlight success with current {opportunity.get('service', 'service')}",
            "Present case study from similar client",
            f"Show projected ROI of ${opportunity['estimated_value']}",
            "Offer trial period or pilot program"
        ]

    def _conduct_nps_survey(self, client_id: str) -> Dict[str, Any]:
        """Conduct NPS survey (simulate response)."""
        import random
        score = random.randint(7, 10)  # Simulate positive NPS
        return {
            "score": score,
            "question": "How likely are you to recommend our services to a colleague?",
            "timestamp": datetime.now().isoformat()
        }

    def _categorize_nps_score(self, score: int) -> str:
        """Categorize NPS score."""
        if score >= 9:
            return "promoter"
        elif score >= 7:
            return "passive"
        else:
            return "detractor"

    def _gather_client_feedback(self, client_id: str, history: List[Dict[str, Any]]) -> List[str]:
        """Gather qualitative feedback from client."""
        feedback = []
        for interaction in history[-3:]:  # Last 3 interactions
            if 'concerns' in interaction:
                feedback.extend(interaction['concerns'])

        # Add simulated feedback
        feedback.append("Great communication and responsiveness")
        feedback.append("Would like more proactive strategic recommendations")

        return feedback

    def _analyze_feedback_sentiment(self, feedback: List[str]) -> Dict[str, Any]:
        """Analyze sentiment of feedback."""
        # Simple sentiment analysis (in production, use NLP)
        positive_words = ['great', 'excellent', 'amazing', 'love', 'fantastic']
        negative_words = ['poor', 'slow', 'disappointing', 'issue', 'problem']

        positive_count = sum(1 for f in feedback for word in positive_words if word in f.lower())
        negative_count = sum(1 for f in feedback for word in negative_words if word in f.lower())

        total = positive_count + negative_count
        if total == 0:
            sentiment = "neutral"
        elif positive_count > negative_count:
            sentiment = "positive"
        else:
            sentiment = "negative"

        return {
            "overall_sentiment": sentiment,
            "positive_mentions": positive_count,
            "negative_mentions": negative_count,
            "confidence": round((max(positive_count, negative_count) / max(total, 1)), 2)
        }

    def _extract_feedback_themes(self, feedback: List[str]) -> List[Dict[str, Any]]:
        """Extract key themes from feedback."""
        themes = []

        # Simple keyword-based theme extraction
        theme_keywords = {
            "communication": ["communication", "responsive", "updates"],
            "quality": ["quality", "deliverable", "work"],
            "strategy": ["strategic", "proactive", "planning"],
            "timeliness": ["deadline", "timing", "schedule"]
        }

        for theme_name, keywords in theme_keywords.items():
            mentions = sum(1 for f in feedback for kw in keywords if kw in f.lower())
            if mentions > 0:
                themes.append({
                    "theme": theme_name,
                    "mentions": mentions,
                    "sentiment": "positive" if any(p in ' '.join(feedback).lower() for p in ['great', 'excellent'])
                                else "needs_improvement"
                })

        return themes

    def _calculate_satisfaction_trend(self, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate satisfaction trend over time."""
        if len(history) < 2:
            return {"trend": "insufficient_data", "change": 0}

        recent_scores = [h.get('csat_score', 0) for h in history[-3:]]
        older_scores = [h.get('csat_score', 0) for h in history[-6:-3]] if len(history) >= 6 else [3.5]

        recent_avg = sum(recent_scores) / len(recent_scores)
        older_avg = sum(older_scores) / len(older_scores)

        change = recent_avg - older_avg

        if change > 0.3:
            trend = "improving"
        elif change < -0.3:
            trend = "declining"
        else:
            trend = "stable"

        return {
            "trend": trend,
            "change": round(change, 2),
            "recent_average": round(recent_avg, 2),
            "previous_average": round(older_avg, 2)
        }

    def _generate_satisfaction_insights(self, csat: float, nps: int, sentiment: Dict[str, Any],
                                       themes: List[Dict[str, Any]]) -> List[str]:
        """Generate insights from satisfaction data."""
        insights = []

        if csat >= 4.5:
            insights.append("Client is highly satisfied - ideal for case study or referral request")
        elif csat < 3.0:
            insights.append("Client satisfaction is low - immediate intervention required")

        if nps >= 9:
            insights.append("Client is a promoter - request testimonial or referral")
        elif nps <= 6:
            insights.append("Client is a detractor - risk of churn")

        if sentiment['overall_sentiment'] == 'positive':
            insights.append("Overall sentiment is positive despite some areas for improvement")

        for theme in themes:
            if theme['sentiment'] == 'needs_improvement':
                insights.append(f"Focus on improving {theme['theme']} (mentioned {theme['mentions']} times)")

        return insights

    def _generate_action_items(self, csat: float, nps: int, themes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate action items based on satisfaction metrics."""
        actions = []

        if csat < 3.5:
            actions.append({
                "priority": "high",
                "action": "Schedule recovery meeting with client",
                "owner": "Account Manager",
                "deadline": (datetime.now() + timedelta(days=2)).isoformat()
            })

        if nps <= 6:
            actions.append({
                "priority": "high",
                "action": "Conduct detailed feedback session to understand concerns",
                "owner": "Senior Account Manager",
                "deadline": (datetime.now() + timedelta(days=3)).isoformat()
            })

        for theme in themes:
            if theme['sentiment'] == 'needs_improvement':
                actions.append({
                    "priority": "medium",
                    "action": f"Develop improvement plan for {theme['theme']}",
                    "owner": "Account Manager",
                    "deadline": (datetime.now() + timedelta(days=7)).isoformat()
                })

        if csat >= 4.5 and nps >= 9:
            actions.append({
                "priority": "low",
                "action": "Request testimonial and referral",
                "owner": "Account Manager",
                "deadline": (datetime.now() + timedelta(days=14)).isoformat()
            })

        return actions
