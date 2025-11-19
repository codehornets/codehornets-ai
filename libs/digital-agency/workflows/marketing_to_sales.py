"""
Marketing to Sales Domain Handoff Workflow.
Handles the transition from marketing campaigns to sales qualification.
"""

from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class MarketingToSalesWorkflow:
    """
    Workflow for transitioning from Marketing domain to Sales domain.

    This workflow:
    1. Validates marketing campaign results
    2. Qualifies leads for sales handoff
    3. Creates sales prospect briefs
    4. Triggers sales engagement process
    """

    def __init__(self):
        self.workflow_id = None
        self.status = "initialized"
        self.handoff_data = {}

    def validate_campaign_data(self, campaign_data: Dict[str, Any]) -> bool:
        """
        Validate marketing campaign data for sales handoff.

        Args:
            campaign_data: Dictionary containing campaign results

        Returns:
            bool: True if valid, False otherwise
        """
        required_fields = [
            'campaign_id',
            'leads_generated',
            'campaign_metrics',
            'lead_scores'
        ]

        for field in required_fields:
            if field not in campaign_data:
                logger.error(f"Missing required field: {field}")
                return False

        return True

    def qualify_leads(self, campaign_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Qualify leads based on marketing scores and engagement.

        Args:
            campaign_data: Campaign results with lead information

        Returns:
            List of qualified leads for sales
        """
        leads = campaign_data.get('leads_generated', [])
        qualified_leads = []

        for lead in leads:
            lead_score = lead.get('score', 0)
            engagement_level = lead.get('engagement_level', 'low')

            # Qualification criteria
            if lead_score >= 70 or engagement_level in ['high', 'very_high']:
                qualified_lead = {
                    'lead_id': lead.get('id'),
                    'contact_info': lead.get('contact_info', {}),
                    'qualification_score': lead_score,
                    'engagement_history': lead.get('engagement_history', []),
                    'interests': lead.get('interests', []),
                    'pain_points': lead.get('pain_points', []),
                    'budget_indicator': lead.get('budget_indicator', 'unknown'),
                    'urgency': lead.get('urgency', 'medium'),
                    'qualified_at': datetime.utcnow().isoformat()
                }
                qualified_leads.append(qualified_lead)

        logger.info(f"Qualified {len(qualified_leads)} out of {len(leads)} leads")
        return qualified_leads

    def create_sales_briefs(self, qualified_leads: List[Dict[str, Any]],
                           campaign_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Create sales prospect briefs for qualified leads.

        Args:
            qualified_leads: List of qualified lead data
            campaign_data: Original campaign data for context

        Returns:
            List of sales prospect briefs
        """
        sales_briefs = []

        for lead in qualified_leads:
            brief = {
                'prospect_id': lead['lead_id'],
                'contact_info': lead['contact_info'],
                'qualification_score': lead['qualification_score'],
                'recommended_approach': self._determine_approach(lead),
                'key_talking_points': self._generate_talking_points(lead, campaign_data),
                'next_actions': self._suggest_next_actions(lead),
                'campaign_context': {
                    'campaign_id': campaign_data.get('campaign_id'),
                    'campaign_name': campaign_data.get('campaign_name'),
                    'engagement_touchpoints': lead.get('engagement_history', [])
                },
                'created_at': datetime.utcnow().isoformat()
            }
            sales_briefs.append(brief)

        return sales_briefs

    def _determine_approach(self, lead: Dict[str, Any]) -> str:
        """Determine recommended sales approach based on lead data."""
        urgency = lead.get('urgency', 'medium')
        score = lead.get('qualification_score', 0)

        if urgency == 'high' and score >= 85:
            return 'immediate_outreach_high_priority'
        elif score >= 80:
            return 'personalized_consultation_offer'
        elif score >= 70:
            return 'nurture_with_value_content'
        else:
            return 'standard_follow_up'

    def _generate_talking_points(self, lead: Dict[str, Any],
                                 campaign_data: Dict[str, Any]) -> List[str]:
        """Generate key talking points for sales conversations."""
        talking_points = []

        # Add interest-based points
        for interest in lead.get('interests', []):
            talking_points.append(f"Expressed interest in: {interest}")

        # Add pain point solutions
        for pain_point in lead.get('pain_points', []):
            talking_points.append(f"Address pain point: {pain_point}")

        # Add campaign context
        campaign_value_prop = campaign_data.get('value_proposition', '')
        if campaign_value_prop:
            talking_points.append(f"Campaign focus: {campaign_value_prop}")

        return talking_points

    def _suggest_next_actions(self, lead: Dict[str, Any]) -> List[str]:
        """Suggest next actions for sales team."""
        actions = ['Review lead engagement history']

        if lead.get('urgency') == 'high':
            actions.append('Schedule call within 24 hours')
        else:
            actions.append('Send personalized email within 48 hours')

        if lead.get('budget_indicator') == 'high':
            actions.append('Prepare premium offering presentation')

        actions.append('Log all interactions in CRM')

        return actions

    def execute(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete marketing-to-sales handoff workflow.

        Args:
            campaign_data: Complete campaign results

        Returns:
            Dict containing workflow result and sales briefs
        """
        self.workflow_id = f"marketing_to_sales_{datetime.utcnow().timestamp()}"
        logger.info(f"Starting workflow {self.workflow_id}")

        try:
            # Step 1: Validate campaign data
            if not self.validate_campaign_data(campaign_data):
                self.status = "failed"
                return {
                    'success': False,
                    'error': 'Campaign data validation failed',
                    'workflow_id': self.workflow_id
                }

            # Step 2: Qualify leads
            qualified_leads = self.qualify_leads(campaign_data)

            if not qualified_leads:
                logger.warning(f"No qualified leads found in workflow {self.workflow_id}")
                self.status = "completed_no_leads"
                return {
                    'success': True,
                    'workflow_id': self.workflow_id,
                    'message': 'No leads met qualification criteria',
                    'qualified_count': 0
                }

            # Step 3: Create sales briefs
            sales_briefs = self.create_sales_briefs(qualified_leads, campaign_data)

            # Step 4: Prepare handoff data
            self.handoff_data = {
                'workflow_id': self.workflow_id,
                'source_domain': 'marketing',
                'target_domain': 'sales',
                'sales_briefs': sales_briefs,
                'qualified_leads_count': len(qualified_leads),
                'campaign_summary': {
                    'campaign_id': campaign_data.get('campaign_id'),
                    'total_leads': len(campaign_data.get('leads_generated', [])),
                    'qualified_leads': len(qualified_leads),
                    'conversion_rate': len(qualified_leads) / max(len(campaign_data.get('leads_generated', [])), 1)
                },
                'handoff_timestamp': datetime.utcnow().isoformat()
            }

            self.status = "completed"
            logger.info(f"Workflow {self.workflow_id} completed with {len(qualified_leads)} qualified leads")

            return {
                'success': True,
                'workflow_id': self.workflow_id,
                'handoff_data': self.handoff_data,
                'qualified_count': len(qualified_leads),
                'next_step': 'sales_engagement'
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
