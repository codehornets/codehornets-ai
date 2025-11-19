"""
Help Desk Agent

Manages general support inquiries, ticket routing, and first-level customer assistance.
"""

from typing import Dict, List, Any, Optional
import yaml
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class HelpDeskAgent:
    """
    Agent responsible for managing help desk operations and customer inquiries.

    Capabilities:
    - Handle customer inquiries
    - Route tickets to appropriate teams
    - Provide first-level support
    - Manage ticket lifecycle
    - Track customer satisfaction
    """

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the Help Desk Agent.

        Args:
            config_path: Path to configuration file
        """
        self.config = self._load_config(config_path)
        self.name = "Help Desk Agent"
        self.role = "help_desk"
        self.ticket_queue = []

    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load agent configuration from YAML file."""
        if config_path is None:
            config_path = Path(__file__).parent / "config.yaml"

        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            'agent_name': 'Help Desk Agent',
            'model': 'gpt-4',
            'temperature': 0.4,
            'max_tokens': 1500,
            'capabilities': [
                'ticket_management',
                'customer_support',
                'routing',
                'status_tracking'
            ]
        }

    async def create_ticket(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new support ticket.

        Args:
            customer_data: Customer information and issue details

        Returns:
            Created ticket details
        """
        try:
            logger.info("Starting ticket creation")

            # Validate inputs
            if not customer_data:
                raise ValueError("customer_data cannot be empty")
            if not isinstance(customer_data, dict):
                raise ValueError("customer_data must be a dictionary")
            if not customer_data.get('name'):
                raise ValueError("customer name is required")
            if not customer_data.get('issue'):
                raise ValueError("issue description is required")

            ticket = {
                'success': True,
                'ticket_id': 'generated_id',
                'customer': customer_data.get('name'),
                'issue': customer_data.get('issue'),
                'priority': 'medium',
                'status': 'open',
                'created_at': 'timestamp'
            }
            self.ticket_queue.append(ticket)

            logger.info(f"Ticket created successfully: {ticket['ticket_id']}")
            return ticket

        except ValueError as e:
            logger.error(f"Validation error in create_ticket: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in create_ticket: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def route_ticket(self, ticket_id: str, target_team: str) -> Dict[str, Any]:
        """
        Route ticket to appropriate team.

        Args:
            ticket_id: Ticket identifier
            target_team: Target team for routing

        Returns:
            Routing confirmation
        """
        try:
            logger.info(f"Starting ticket routing for {ticket_id}")

            # Validate inputs
            if not ticket_id:
                raise ValueError("ticket_id is required")
            if not target_team:
                raise ValueError("target_team is required")

            result = {
                'success': True,
                'ticket_id': ticket_id,
                'routed_to': target_team,
                'status': 'routed'
            }

            logger.info(f"Ticket {ticket_id} routed to {target_team}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in route_ticket: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in route_ticket: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    async def respond_to_inquiry(self, inquiry: str) -> str:
        """
        Provide response to customer inquiry.

        Args:
            inquiry: Customer inquiry text

        Returns:
            Response text
        """
        try:
            logger.info("Starting inquiry response")

            # Validate inputs
            if not inquiry:
                raise ValueError("inquiry cannot be empty")

            response = "Thank you for contacting support. We're here to help."

            logger.info("Inquiry response generated")
            return response

        except ValueError as e:
            logger.error(f"Validation error in respond_to_inquiry: {e}")
            return ""
        except Exception as e:
            logger.error(f"Unexpected error in respond_to_inquiry: {e}", exc_info=True)
            return ""

    async def update_ticket_status(self, ticket_id: str, new_status: str) -> Dict[str, Any]:
        """
        Update ticket status.

        Args:
            ticket_id: Ticket identifier
            new_status: New status value

        Returns:
            Updated ticket details
        """
        try:
            logger.info(f"Starting ticket status update for {ticket_id}")

            # Validate inputs
            if not ticket_id:
                raise ValueError("ticket_id is required")
            if not new_status:
                raise ValueError("new_status is required")

            result = {
                'success': True,
                'ticket_id': ticket_id,
                'status': new_status,
                'updated_at': 'timestamp'
            }

            logger.info(f"Ticket {ticket_id} status updated to {new_status}")
            return result

        except ValueError as e:
            logger.error(f"Validation error in update_ticket_status: {e}")
            return {
                'success': False,
                'error': str(e),
                'error_type': 'validation_error'
            }
        except Exception as e:
            logger.error(f"Unexpected error in update_ticket_status: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'An unexpected error occurred',
                'error_type': 'internal_error'
            }

    def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status."""
        return {
            'agent': self.name,
            'queue_length': len(self.ticket_queue),
            'status': 'active'
        }
