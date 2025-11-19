"""
Sales to Fulfillment Domain Handoff Workflow.
Handles the transition from closed deals to project fulfillment.
"""

from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SalesToFulfillmentWorkflow:
    """
    Workflow for transitioning from Sales domain to Fulfillment domain.

    This workflow:
    1. Validates sales deal closure data
    2. Extracts project requirements
    3. Creates fulfillment work orders
    4. Triggers project initiation
    """

    def __init__(self):
        self.workflow_id = None
        self.status = "initialized"
        self.handoff_data = {}

    def validate_deal_data(self, deal_data: Dict[str, Any]) -> bool:
        """
        Validate sales deal data for fulfillment handoff.

        Args:
            deal_data: Dictionary containing closed deal information

        Returns:
            bool: True if valid, False otherwise
        """
        required_fields = [
            'deal_id',
            'client_info',
            'service_package',
            'contract_terms',
            'payment_status'
        ]

        for field in required_fields:
            if field not in deal_data:
                logger.error(f"Missing required field: {field}")
                return False

        # Validate deal is actually closed
        if deal_data.get('status') != 'closed_won':
            logger.error("Deal is not in closed_won status")
            return False

        return True

    def extract_project_requirements(self, deal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract project requirements from sales deal data.

        Args:
            deal_data: Closed deal information

        Returns:
            Dict containing project requirements
        """
        service_package = deal_data.get('service_package', {})

        requirements = {
            'project_type': service_package.get('type', 'custom'),
            'deliverables': service_package.get('deliverables', []),
            'timeline': service_package.get('timeline', {}),
            'budget': deal_data.get('contract_terms', {}).get('total_value', 0),
            'milestones': self._generate_milestones(service_package),
            'resource_requirements': self._determine_resources(service_package),
            'client_expectations': deal_data.get('client_expectations', []),
            'special_requirements': deal_data.get('special_requirements', []),
            'compliance_needs': deal_data.get('compliance_needs', []),
            'extracted_at': datetime.utcnow().isoformat()
        }

        return requirements

    def _generate_milestones(self, service_package: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate project milestones based on service package."""
        deliverables = service_package.get('deliverables', [])
        timeline = service_package.get('timeline', {})

        milestones = [
            {
                'name': 'Project Kickoff',
                'description': 'Initial client meeting and project setup',
                'duration_days': 2,
                'dependencies': []
            },
            {
                'name': 'Requirements Gathering',
                'description': 'Detailed requirements and discovery phase',
                'duration_days': 5,
                'dependencies': ['Project Kickoff']
            }
        ]

        # Add milestones for each major deliverable
        for idx, deliverable in enumerate(deliverables):
            milestones.append({
                'name': f"Deliverable: {deliverable.get('name', f'Item {idx+1}')}",
                'description': deliverable.get('description', ''),
                'duration_days': deliverable.get('estimated_days', 10),
                'dependencies': ['Requirements Gathering']
            })

        milestones.append({
            'name': 'Client Review & Feedback',
            'description': 'Client review and revision cycle',
            'duration_days': 3,
            'dependencies': [m['name'] for m in milestones if 'Deliverable' in m['name']]
        })

        milestones.append({
            'name': 'Final Delivery',
            'description': 'Final delivery and client handoff',
            'duration_days': 2,
            'dependencies': ['Client Review & Feedback']
        })

        return milestones

    def _determine_resources(self, service_package: Dict[str, Any]) -> Dict[str, Any]:
        """Determine required resources for project fulfillment."""
        package_type = service_package.get('type', 'custom')
        deliverables = service_package.get('deliverables', [])

        resources = {
            'team_size': max(2, len(deliverables)),
            'required_roles': [],
            'estimated_hours': 0,
            'tools_needed': []
        }

        # Determine roles based on package type
        if 'web' in package_type.lower() or 'website' in package_type.lower():
            resources['required_roles'].extend(['web_developer', 'designer', 'project_manager'])
            resources['tools_needed'].extend(['development_environment', 'design_tools'])

        if 'marketing' in package_type.lower():
            resources['required_roles'].extend(['content_creator', 'marketing_specialist'])
            resources['tools_needed'].extend(['marketing_automation', 'analytics_tools'])

        if 'branding' in package_type.lower():
            resources['required_roles'].extend(['brand_strategist', 'graphic_designer'])
            resources['tools_needed'].extend(['design_suite', 'brand_guidelines_template'])

        # Estimate hours
        for deliverable in deliverables:
            resources['estimated_hours'] += deliverable.get('estimated_hours', 20)

        return resources

    def create_work_order(self, deal_data: Dict[str, Any],
                          requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create fulfillment work order.

        Args:
            deal_data: Original deal data
            requirements: Extracted project requirements

        Returns:
            Dict containing work order
        """
        work_order = {
            'work_order_id': f"WO_{deal_data['deal_id']}_{int(datetime.utcnow().timestamp())}",
            'client_info': deal_data['client_info'],
            'project_name': f"{deal_data['client_info'].get('company_name', 'Client')} - {requirements['project_type']}",
            'requirements': requirements,
            'contract_reference': deal_data['deal_id'],
            'payment_terms': deal_data.get('contract_terms', {}).get('payment_schedule', []),
            'priority': self._determine_priority(deal_data),
            'assigned_team': None,  # To be assigned by fulfillment
            'status': 'pending_assignment',
            'created_at': datetime.utcnow().isoformat(),
            'target_start_date': self._calculate_start_date(requirements),
            'target_completion_date': self._calculate_completion_date(requirements),
            'communication_plan': {
                'primary_contact': deal_data['client_info'].get('primary_contact', {}),
                'update_frequency': 'weekly',
                'preferred_channels': deal_data.get('preferred_communication', ['email'])
            }
        }

        return work_order

    def _determine_priority(self, deal_data: Dict[str, Any]) -> str:
        """Determine work order priority."""
        deal_value = deal_data.get('contract_terms', {}).get('total_value', 0)
        client_tier = deal_data.get('client_info', {}).get('tier', 'standard')

        if client_tier == 'enterprise' or deal_value > 50000:
            return 'high'
        elif deal_value > 20000:
            return 'medium'
        else:
            return 'standard'

    def _calculate_start_date(self, requirements: Dict[str, Any]) -> str:
        """Calculate target start date."""
        # Default to 3 days from now for onboarding
        from datetime import timedelta
        start_date = datetime.utcnow() + timedelta(days=3)
        return start_date.isoformat()

    def _calculate_completion_date(self, requirements: Dict[str, Any]) -> str:
        """Calculate target completion date based on milestones."""
        from datetime import timedelta

        total_days = sum(m.get('duration_days', 0) for m in requirements.get('milestones', []))
        completion_date = datetime.utcnow() + timedelta(days=total_days + 3)  # +3 for buffer

        return completion_date.isoformat()

    def execute(self, deal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete sales-to-fulfillment handoff workflow.

        Args:
            deal_data: Complete closed deal data

        Returns:
            Dict containing workflow result and work order
        """
        self.workflow_id = f"sales_to_fulfillment_{datetime.utcnow().timestamp()}"
        logger.info(f"Starting workflow {self.workflow_id}")

        try:
            # Step 1: Validate deal data
            if not self.validate_deal_data(deal_data):
                self.status = "failed"
                return {
                    'success': False,
                    'error': 'Deal data validation failed',
                    'workflow_id': self.workflow_id
                }

            # Step 2: Extract project requirements
            requirements = self.extract_project_requirements(deal_data)

            # Step 3: Create work order
            work_order = self.create_work_order(deal_data, requirements)

            # Step 4: Prepare handoff data
            self.handoff_data = {
                'workflow_id': self.workflow_id,
                'source_domain': 'sales',
                'target_domain': 'fulfillment',
                'work_order': work_order,
                'original_deal': deal_data,
                'handoff_timestamp': datetime.utcnow().isoformat(),
                'handoff_checklist': {
                    'contract_signed': True,
                    'payment_verified': deal_data.get('payment_status') == 'verified',
                    'requirements_extracted': True,
                    'team_notified': False,  # To be updated by fulfillment
                    'kickoff_scheduled': False  # To be updated by fulfillment
                }
            }

            self.status = "completed"
            logger.info(f"Workflow {self.workflow_id} completed successfully")

            return {
                'success': True,
                'workflow_id': self.workflow_id,
                'handoff_data': self.handoff_data,
                'work_order_id': work_order['work_order_id'],
                'next_step': 'project_initiation'
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
