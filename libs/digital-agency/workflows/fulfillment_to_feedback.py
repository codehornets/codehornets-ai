"""
Fulfillment to Feedback Domain Handoff Workflow.
Handles the transition from completed projects to feedback collection.
"""

from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class FulfillmentToFeedbackWorkflow:
    """
    Workflow for transitioning from Fulfillment domain to Feedback domain.

    This workflow:
    1. Validates project completion data
    2. Prepares feedback collection materials
    3. Creates feedback request package
    4. Triggers feedback collection process
    """

    def __init__(self):
        self.workflow_id = None
        self.status = "initialized"
        self.handoff_data = {}

    def validate_completion_data(self, completion_data: Dict[str, Any]) -> bool:
        """
        Validate project completion data for feedback handoff.

        Args:
            completion_data: Dictionary containing project completion information

        Returns:
            bool: True if valid, False otherwise
        """
        required_fields = [
            'project_id',
            'work_order_id',
            'client_info',
            'deliverables_status',
            'completion_date'
        ]

        for field in required_fields:
            if field not in completion_data:
                logger.error(f"Missing required field: {field}")
                return False

        # Validate all deliverables are completed
        deliverables = completion_data.get('deliverables_status', [])
        incomplete = [d for d in deliverables if d.get('status') != 'completed']

        if incomplete:
            logger.error(f"Found {len(incomplete)} incomplete deliverables")
            return False

        return True

    def prepare_feedback_context(self, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare context information for feedback collection.

        Args:
            completion_data: Project completion information

        Returns:
            Dict containing feedback context
        """
        context = {
            'project_summary': {
                'project_id': completion_data['project_id'],
                'project_name': completion_data.get('project_name', 'Project'),
                'project_type': completion_data.get('project_type', 'custom'),
                'duration': self._calculate_duration(completion_data),
                'deliverables_count': len(completion_data.get('deliverables_status', []))
            },
            'client_info': completion_data['client_info'],
            'team_info': {
                'project_manager': completion_data.get('project_manager', {}),
                'team_members': completion_data.get('team_members', []),
                'primary_contact': completion_data.get('client_primary_contact', {})
            },
            'key_milestones': completion_data.get('milestones_completed', []),
            'deliverables': self._summarize_deliverables(completion_data),
            'interaction_history': completion_data.get('client_interactions', []),
            'context_created_at': datetime.utcnow().isoformat()
        }

        return context

    def _calculate_duration(self, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate project duration."""
        start_date_str = completion_data.get('start_date')
        completion_date_str = completion_data.get('completion_date')

        if start_date_str and completion_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                completion_date = datetime.fromisoformat(completion_date_str.replace('Z', '+00:00'))
                duration_days = (completion_date - start_date).days

                return {
                    'days': duration_days,
                    'started': start_date_str,
                    'completed': completion_date_str
                }
            except Exception as e:
                logger.warning(f"Error calculating duration: {e}")

        return {
            'days': 0,
            'started': 'unknown',
            'completed': completion_date_str
        }

    def _summarize_deliverables(self, completion_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Summarize completed deliverables."""
        deliverables = completion_data.get('deliverables_status', [])

        summary = []
        for deliverable in deliverables:
            summary.append({
                'name': deliverable.get('name', 'Unnamed deliverable'),
                'description': deliverable.get('description', ''),
                'completed_date': deliverable.get('completed_date', ''),
                'quality_metrics': deliverable.get('quality_metrics', {}),
                'client_approval': deliverable.get('client_approved', False)
            })

        return summary

    def create_feedback_request(self, completion_data: Dict[str, Any],
                                context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create feedback request package.

        Args:
            completion_data: Original completion data
            context: Prepared feedback context

        Returns:
            Dict containing feedback request
        """
        feedback_request = {
            'request_id': f"FR_{completion_data['project_id']}_{int(datetime.utcnow().timestamp())}",
            'project_context': context,
            'feedback_questions': self._generate_feedback_questions(completion_data),
            'rating_categories': [
                {
                    'category': 'Overall Satisfaction',
                    'scale': '1-5',
                    'description': 'How satisfied are you with the project outcome?'
                },
                {
                    'category': 'Communication',
                    'scale': '1-5',
                    'description': 'How would you rate our communication throughout the project?'
                },
                {
                    'category': 'Timeliness',
                    'scale': '1-5',
                    'description': 'How satisfied are you with project timeline and delivery?'
                },
                {
                    'category': 'Quality',
                    'scale': '1-5',
                    'description': 'How would you rate the quality of deliverables?'
                },
                {
                    'category': 'Value for Money',
                    'scale': '1-5',
                    'description': 'How satisfied are you with the value received?'
                }
            ],
            'collection_methods': [
                {
                    'method': 'survey',
                    'priority': 1,
                    'timeline': 'within_7_days'
                },
                {
                    'method': 'follow_up_call',
                    'priority': 2,
                    'timeline': 'within_14_days'
                },
                {
                    'method': 'testimonial_request',
                    'priority': 3,
                    'timeline': 'within_30_days',
                    'conditional': 'if_rating_4_or_higher'
                }
            ],
            'incentives': self._determine_incentives(completion_data),
            'created_at': datetime.utcnow().isoformat(),
            'expires_at': self._calculate_expiry()
        }

        return feedback_request

    def _generate_feedback_questions(self, completion_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate project-specific feedback questions."""
        questions = [
            {
                'question': 'What did you like most about working with our team?',
                'type': 'open_text',
                'required': False
            },
            {
                'question': 'What could we have done better?',
                'type': 'open_text',
                'required': False
            },
            {
                'question': 'Would you recommend our services to others?',
                'type': 'yes_no',
                'required': True,
                'follow_up': 'Why or why not?'
            }
        ]

        # Add deliverable-specific questions
        deliverables = completion_data.get('deliverables_status', [])
        for deliverable in deliverables[:3]:  # Limit to top 3
            questions.append({
                'question': f"How satisfied are you with the {deliverable.get('name', 'deliverable')}?",
                'type': 'rating_1_5',
                'required': False
            })

        questions.append({
            'question': 'Are you interested in future services or ongoing support?',
            'type': 'multiple_choice',
            'options': ['Yes, very interested', 'Maybe, tell me more', 'Not at this time'],
            'required': False
        })

        return questions

    def _determine_incentives(self, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Determine feedback collection incentives."""
        project_value = completion_data.get('contract_value', 0)

        incentives = {
            'offer_discount': False,
            'discount_percentage': 0,
            'offer_consultation': True,
            'other_incentives': []
        }

        if project_value > 10000:
            incentives['offer_discount'] = True
            incentives['discount_percentage'] = 10
            incentives['other_incentives'].append('Priority support for 30 days')

        return incentives

    def _calculate_expiry(self) -> str:
        """Calculate feedback request expiry date."""
        from datetime import timedelta
        expiry = datetime.utcnow() + timedelta(days=30)
        return expiry.isoformat()

    def execute(self, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete fulfillment-to-feedback handoff workflow.

        Args:
            completion_data: Complete project completion data

        Returns:
            Dict containing workflow result and feedback request
        """
        self.workflow_id = f"fulfillment_to_feedback_{datetime.utcnow().timestamp()}"
        logger.info(f"Starting workflow {self.workflow_id}")

        try:
            # Step 1: Validate completion data
            if not self.validate_completion_data(completion_data):
                self.status = "failed"
                return {
                    'success': False,
                    'error': 'Completion data validation failed',
                    'workflow_id': self.workflow_id
                }

            # Step 2: Prepare feedback context
            context = self.prepare_feedback_context(completion_data)

            # Step 3: Create feedback request
            feedback_request = self.create_feedback_request(completion_data, context)

            # Step 4: Prepare handoff data
            self.handoff_data = {
                'workflow_id': self.workflow_id,
                'source_domain': 'fulfillment',
                'target_domain': 'feedback',
                'feedback_request': feedback_request,
                'original_completion': completion_data,
                'handoff_timestamp': datetime.utcnow().isoformat(),
                'handoff_checklist': {
                    'deliverables_verified': True,
                    'client_notified': False,  # To be updated by feedback domain
                    'survey_sent': False,  # To be updated by feedback domain
                    'follow_up_scheduled': False  # To be updated by feedback domain
                }
            }

            self.status = "completed"
            logger.info(f"Workflow {self.workflow_id} completed successfully")

            return {
                'success': True,
                'workflow_id': self.workflow_id,
                'handoff_data': self.handoff_data,
                'request_id': feedback_request['request_id'],
                'next_step': 'feedback_collection'
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
