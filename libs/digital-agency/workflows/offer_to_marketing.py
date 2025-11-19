"""
Offer to Marketing Domain Handoff Workflow.
Handles the transition from product/service definition to marketing campaign creation.
"""

from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class OfferToMarketingWorkflow:
    """
    Workflow for transitioning from Offer domain to Marketing domain.

    This workflow:
    1. Validates offer specifications
    2. Extracts marketing-relevant information
    3. Creates initial marketing brief
    4. Triggers marketing campaign creation
    """

    def __init__(self):
        self.workflow_id = None
        self.status = "initialized"
        self.handoff_data = {}

    def validate_offer(self, offer_data: Dict[str, Any]) -> bool:
        """
        Validate that offer data contains required fields for marketing.

        Args:
            offer_data: Dictionary containing offer specifications

        Returns:
            bool: True if valid, False otherwise
        """
        required_fields = [
            'product_name',
            'target_audience',
            'value_proposition',
            'pricing_tier',
            'unique_selling_points'
        ]

        for field in required_fields:
            if field not in offer_data:
                logger.error(f"Missing required field: {field}")
                return False

        return True

    def extract_marketing_brief(self, offer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract marketing-relevant information from offer data.

        Args:
            offer_data: Validated offer specifications

        Returns:
            Dict containing marketing brief
        """
        marketing_brief = {
            'campaign_name': f"{offer_data['product_name']}_launch",
            'target_audience': offer_data['target_audience'],
            'key_messages': offer_data.get('unique_selling_points', []),
            'value_proposition': offer_data['value_proposition'],
            'pricing_info': offer_data['pricing_tier'],
            'brand_guidelines': offer_data.get('brand_guidelines', {}),
            'campaign_objectives': self._generate_objectives(offer_data),
            'budget_allocation': offer_data.get('marketing_budget', 'TBD'),
            'timeline': offer_data.get('launch_timeline', 'TBD'),
            'created_at': datetime.utcnow().isoformat()
        }

        return marketing_brief

    def _generate_objectives(self, offer_data: Dict[str, Any]) -> List[str]:
        """Generate default marketing objectives based on offer type."""
        objectives = [
            'Build awareness for new offering',
            'Generate qualified leads',
            'Establish brand positioning'
        ]

        if offer_data.get('is_premium', False):
            objectives.append('Target high-value customer segments')

        return objectives

    def execute(self, offer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete offer-to-marketing handoff workflow.

        Args:
            offer_data: Complete offer specifications

        Returns:
            Dict containing workflow result and marketing brief
        """
        self.workflow_id = f"offer_to_marketing_{datetime.utcnow().timestamp()}"
        logger.info(f"Starting workflow {self.workflow_id}")

        try:
            # Step 1: Validate offer
            if not self.validate_offer(offer_data):
                self.status = "failed"
                return {
                    'success': False,
                    'error': 'Offer validation failed',
                    'workflow_id': self.workflow_id
                }

            # Step 2: Extract marketing brief
            marketing_brief = self.extract_marketing_brief(offer_data)

            # Step 3: Prepare handoff data
            self.handoff_data = {
                'workflow_id': self.workflow_id,
                'source_domain': 'offer',
                'target_domain': 'marketing',
                'marketing_brief': marketing_brief,
                'original_offer': offer_data,
                'handoff_timestamp': datetime.utcnow().isoformat()
            }

            self.status = "completed"
            logger.info(f"Workflow {self.workflow_id} completed successfully")

            return {
                'success': True,
                'workflow_id': self.workflow_id,
                'handoff_data': self.handoff_data,
                'next_step': 'marketing_campaign_creation'
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
