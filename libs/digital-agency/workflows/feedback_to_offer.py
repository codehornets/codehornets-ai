"""
Feedback to Offer Domain Handoff Workflow.
Handles the transition from feedback analysis to offer refinement.
"""

from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class FeedbackToOfferWorkflow:
    """
    Workflow for transitioning from Feedback domain back to Offer domain.

    This workflow:
    1. Validates feedback collection results
    2. Analyzes feedback for insights
    3. Generates offer improvement recommendations
    4. Triggers offer refinement process
    """

    def __init__(self):
        self.workflow_id = None
        self.status = "initialized"
        self.handoff_data = {}

    def validate_feedback_data(self, feedback_data: Dict[str, Any]) -> bool:
        """
        Validate feedback data for offer handoff.

        Args:
            feedback_data: Dictionary containing collected feedback

        Returns:
            bool: True if valid, False otherwise
        """
        required_fields = [
            'feedback_id',
            'project_id',
            'responses',
            'ratings'
        ]

        for field in required_fields:
            if field not in feedback_data:
                logger.error(f"Missing required field: {field}")
                return False

        # Ensure we have actual feedback responses
        if not feedback_data.get('responses'):
            logger.error("No feedback responses found")
            return False

        return True

    def analyze_feedback(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze feedback data for insights and patterns.

        Args:
            feedback_data: Collected feedback information

        Returns:
            Dict containing feedback analysis
        """
        responses = feedback_data.get('responses', [])
        ratings = feedback_data.get('ratings', {})

        analysis = {
            'overall_sentiment': self._calculate_sentiment(ratings),
            'rating_averages': self._calculate_rating_averages(ratings),
            'key_strengths': self._identify_strengths(responses, ratings),
            'improvement_areas': self._identify_improvements(responses, ratings),
            'common_themes': self._extract_themes(responses),
            'client_satisfaction_score': self._calculate_satisfaction_score(ratings),
            'recommendation_likelihood': self._calculate_nps(responses),
            'response_count': len(responses),
            'analyzed_at': datetime.utcnow().isoformat()
        }

        return analysis

    def _calculate_sentiment(self, ratings: Dict[str, Any]) -> str:
        """Calculate overall sentiment from ratings."""
        avg_rating = self._calculate_rating_averages(ratings).get('overall_average', 0)

        if avg_rating >= 4.5:
            return 'very_positive'
        elif avg_rating >= 4.0:
            return 'positive'
        elif avg_rating >= 3.0:
            return 'neutral'
        elif avg_rating >= 2.0:
            return 'negative'
        else:
            return 'very_negative'

    def _calculate_rating_averages(self, ratings: Dict[str, Any]) -> Dict[str, float]:
        """Calculate average ratings for each category."""
        averages = {}

        for category, rating_list in ratings.items():
            if isinstance(rating_list, list) and rating_list:
                averages[category] = sum(rating_list) / len(rating_list)
            elif isinstance(rating_list, (int, float)):
                averages[category] = rating_list

        # Calculate overall average
        if averages:
            averages['overall_average'] = sum(averages.values()) / len(averages)
        else:
            averages['overall_average'] = 0

        return averages

    def _identify_strengths(self, responses: List[Dict[str, Any]],
                           ratings: Dict[str, Any]) -> List[str]:
        """Identify key strengths from feedback."""
        strengths = []
        rating_averages = self._calculate_rating_averages(ratings)

        # Identify high-rated categories
        for category, avg in rating_averages.items():
            if avg >= 4.5 and category != 'overall_average':
                strengths.append(f"Excellent {category.replace('_', ' ')}")

        # Extract positive mentions from open text
        for response in responses:
            positive_text = response.get('liked_most', '').lower()
            if 'communication' in positive_text:
                strengths.append('Strong communication')
            if 'quality' in positive_text or 'excellent' in positive_text:
                strengths.append('High quality deliverables')
            if 'professional' in positive_text:
                strengths.append('Professional service')
            if 'timely' in positive_text or 'on time' in positive_text:
                strengths.append('Timely delivery')

        return list(set(strengths))[:5]  # Top 5 unique strengths

    def _identify_improvements(self, responses: List[Dict[str, Any]],
                               ratings: Dict[str, Any]) -> List[str]:
        """Identify areas for improvement from feedback."""
        improvements = []
        rating_averages = self._calculate_rating_averages(ratings)

        # Identify low-rated categories
        for category, avg in rating_averages.items():
            if avg < 3.5 and category != 'overall_average':
                improvements.append(f"Improve {category.replace('_', ' ')}")

        # Extract improvement suggestions from open text
        for response in responses:
            improvement_text = response.get('could_improve', '').lower()
            if 'communication' in improvement_text:
                improvements.append('Enhance communication frequency')
            if 'timeline' in improvement_text or 'faster' in improvement_text:
                improvements.append('Optimize delivery timelines')
            if 'price' in improvement_text or 'cost' in improvement_text:
                improvements.append('Review pricing structure')
            if 'process' in improvement_text:
                improvements.append('Streamline processes')

        return list(set(improvements))[:5]  # Top 5 unique improvements

    def _extract_themes(self, responses: List[Dict[str, Any]]) -> List[str]:
        """Extract common themes from feedback responses."""
        themes = []
        theme_keywords = {
            'customer_service': ['support', 'service', 'responsive', 'helpful'],
            'technical_quality': ['quality', 'technical', 'expertise', 'skill'],
            'project_management': ['timeline', 'organization', 'planning', 'schedule'],
            'value': ['price', 'value', 'worth', 'cost'],
            'innovation': ['creative', 'innovative', 'unique', 'modern']
        }

        all_text = ' '.join([
            str(r.get('liked_most', '')) + ' ' +
            str(r.get('could_improve', ''))
            for r in responses
        ]).lower()

        for theme, keywords in theme_keywords.items():
            if any(keyword in all_text for keyword in keywords):
                themes.append(theme)

        return themes

    def _calculate_satisfaction_score(self, ratings: Dict[str, Any]) -> float:
        """Calculate overall client satisfaction score (0-100)."""
        rating_averages = self._calculate_rating_averages(ratings)
        overall_avg = rating_averages.get('overall_average', 0)

        # Convert 1-5 scale to 0-100
        satisfaction_score = (overall_avg / 5.0) * 100

        return round(satisfaction_score, 2)

    def _calculate_nps(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate Net Promoter Score."""
        recommendations = [
            r.get('would_recommend', '')
            for r in responses
            if r.get('would_recommend')
        ]

        if not recommendations:
            return {'score': 0, 'category': 'insufficient_data'}

        yes_count = sum(1 for r in recommendations if str(r).lower() in ['yes', 'true', '1'])
        total = len(recommendations)

        likelihood = (yes_count / total) * 100 if total > 0 else 0

        if likelihood >= 80:
            category = 'promoters'
        elif likelihood >= 50:
            category = 'passives'
        else:
            category = 'detractors'

        return {
            'score': round(likelihood, 2),
            'category': category,
            'sample_size': total
        }

    def generate_offer_recommendations(self, feedback_data: Dict[str, Any],
                                      analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate recommendations for offer refinement.

        Args:
            feedback_data: Original feedback data
            analysis: Feedback analysis results

        Returns:
            Dict containing offer improvement recommendations
        """
        recommendations = {
            'recommendation_id': f"REC_{feedback_data['project_id']}_{int(datetime.utcnow().timestamp())}",
            'service_adjustments': self._recommend_service_adjustments(analysis),
            'pricing_adjustments': self._recommend_pricing_adjustments(analysis, feedback_data),
            'process_improvements': self._recommend_process_improvements(analysis),
            'new_service_opportunities': self._identify_service_opportunities(feedback_data),
            'marketing_messages': self._extract_marketing_messages(analysis),
            'priority_actions': self._prioritize_actions(analysis),
            'estimated_impact': self._estimate_impact(analysis),
            'created_at': datetime.utcnow().isoformat()
        }

        return recommendations

    def _recommend_service_adjustments(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Recommend service package adjustments."""
        adjustments = []

        strengths = analysis.get('key_strengths', [])
        improvements = analysis.get('improvement_areas', [])

        # Enhance strengths
        for strength in strengths:
            adjustments.append({
                'type': 'enhance',
                'area': strength,
                'recommendation': f"Emphasize and expand {strength.lower()} in service packages",
                'priority': 'medium'
            })

        # Address improvements
        for improvement in improvements:
            adjustments.append({
                'type': 'improve',
                'area': improvement,
                'recommendation': f"Address feedback on {improvement.lower()}",
                'priority': 'high'
            })

        return adjustments

    def _recommend_pricing_adjustments(self, analysis: Dict[str, Any],
                                      feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """Recommend pricing adjustments based on value perception."""
        value_rating = analysis.get('rating_averages', {}).get('value_for_money', 0)
        satisfaction = analysis.get('client_satisfaction_score', 0)

        if value_rating >= 4.5 and satisfaction >= 90:
            return {
                'action': 'consider_premium_pricing',
                'rationale': 'High satisfaction and value perception support premium positioning',
                'suggested_adjustment': '+10-15%'
            }
        elif value_rating < 3.0:
            return {
                'action': 'review_value_proposition',
                'rationale': 'Low value perception requires better communication or pricing review',
                'suggested_adjustment': 'enhance_inclusions'
            }
        else:
            return {
                'action': 'maintain_current_pricing',
                'rationale': 'Pricing aligned with perceived value',
                'suggested_adjustment': 'none'
            }

    def _recommend_process_improvements(self, analysis: Dict[str, Any]) -> List[str]:
        """Recommend process improvements."""
        improvements = []

        if 'communication' in str(analysis.get('improvement_areas', [])).lower():
            improvements.append('Implement weekly client status updates')
            improvements.append('Create client communication dashboard')

        if 'timeline' in str(analysis.get('improvement_areas', [])).lower():
            improvements.append('Improve project timeline estimation')
            improvements.append('Add buffer time to milestone planning')

        if analysis.get('client_satisfaction_score', 0) < 80:
            improvements.append('Conduct mid-project check-ins')
            improvements.append('Implement quality assurance checkpoints')

        return improvements

    def _identify_service_opportunities(self, feedback_data: Dict[str, Any]) -> List[str]:
        """Identify new service opportunities from feedback."""
        opportunities = []

        responses = feedback_data.get('responses', [])
        for response in responses:
            future_interest = response.get('future_services_interest', '').lower()

            if 'ongoing' in future_interest or 'support' in future_interest:
                opportunities.append('Ongoing support and maintenance packages')

            if 'training' in future_interest:
                opportunities.append('Client training programs')

            if 'consulting' in future_interest:
                opportunities.append('Strategic consulting services')

        return list(set(opportunities))

    def _extract_marketing_messages(self, analysis: Dict[str, Any]) -> List[str]:
        """Extract potential marketing messages from feedback."""
        messages = []

        for strength in analysis.get('key_strengths', []):
            messages.append(f"Clients love our {strength.lower()}")

        satisfaction = analysis.get('client_satisfaction_score', 0)
        if satisfaction >= 90:
            messages.append(f"{int(satisfaction)}% client satisfaction rate")

        nps = analysis.get('recommendation_likelihood', {})
        if nps.get('score', 0) >= 80:
            messages.append('Highly recommended by our clients')

        return messages

    def _prioritize_actions(self, analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Prioritize recommended actions."""
        actions = []

        satisfaction = analysis.get('client_satisfaction_score', 0)

        if satisfaction < 70:
            actions.append({
                'priority': 1,
                'action': 'Address critical satisfaction issues',
                'timeline': 'immediate'
            })

        for improvement in analysis.get('improvement_areas', [])[:3]:
            actions.append({
                'priority': 2,
                'action': f"Implement improvements for {improvement}",
                'timeline': '30_days'
            })

        return actions

    def _estimate_impact(self, analysis: Dict[str, Any]) -> Dict[str, str]:
        """Estimate impact of implementing recommendations."""
        current_satisfaction = analysis.get('client_satisfaction_score', 0)

        if current_satisfaction >= 90:
            return {
                'potential_improvement': 'incremental',
                'estimated_satisfaction_increase': '2-5%',
                'business_impact': 'Enhanced brand reputation and referrals'
            }
        elif current_satisfaction >= 70:
            return {
                'potential_improvement': 'moderate',
                'estimated_satisfaction_increase': '10-15%',
                'business_impact': 'Improved retention and testimonials'
            }
        else:
            return {
                'potential_improvement': 'significant',
                'estimated_satisfaction_increase': '20-30%',
                'business_impact': 'Critical for business sustainability'
            }

    def execute(self, feedback_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete feedback-to-offer handoff workflow.

        Args:
            feedback_data: Complete feedback collection data

        Returns:
            Dict containing workflow result and recommendations
        """
        self.workflow_id = f"feedback_to_offer_{datetime.utcnow().timestamp()}"
        logger.info(f"Starting workflow {self.workflow_id}")

        try:
            # Step 1: Validate feedback data
            if not self.validate_feedback_data(feedback_data):
                self.status = "failed"
                return {
                    'success': False,
                    'error': 'Feedback data validation failed',
                    'workflow_id': self.workflow_id
                }

            # Step 2: Analyze feedback
            analysis = self.analyze_feedback(feedback_data)

            # Step 3: Generate recommendations
            recommendations = self.generate_offer_recommendations(feedback_data, analysis)

            # Step 4: Prepare handoff data
            self.handoff_data = {
                'workflow_id': self.workflow_id,
                'source_domain': 'feedback',
                'target_domain': 'offer',
                'feedback_analysis': analysis,
                'recommendations': recommendations,
                'original_feedback': feedback_data,
                'handoff_timestamp': datetime.utcnow().isoformat(),
                'action_required': analysis.get('client_satisfaction_score', 0) < 70
            }

            self.status = "completed"
            logger.info(f"Workflow {self.workflow_id} completed successfully")

            return {
                'success': True,
                'workflow_id': self.workflow_id,
                'handoff_data': self.handoff_data,
                'satisfaction_score': analysis.get('client_satisfaction_score', 0),
                'next_step': 'offer_refinement'
            }

        except Exception as e:
            self.status = "error"
            logger.error(f"Workflow {self.workflow_id} failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'workflow_id': self.workflow_id
            }

    def get_status(self) -> Dict[str, Any]:
        """Get current workflow status."""
        return {
            'workflow_id': self.workflow_id,
            'status': self.status,
            'has_handoff_data': bool(self.handoff_data)
        }
