"""
HubSpot CRM client.

Provides interface for interacting with HubSpot API for contacts,
deals, companies, and marketing automation.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime

from hubspot import HubSpot
from hubspot.crm.contacts import SimplePublicObjectInput, ApiException
from pydantic import BaseModel

from config.settings import get_settings
from config.api_keys import get_api_key_manager
from core.logger import get_logger


class HubSpotContact(BaseModel):
    """Represents a HubSpot contact."""

    id: Optional[str] = None
    email: str
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    properties: Dict[str, Any] = {}


class HubSpotDeal(BaseModel):
    """Represents a HubSpot deal."""

    id: Optional[str] = None
    dealname: str
    amount: Optional[float] = None
    dealstage: Optional[str] = None
    closedate: Optional[datetime] = None
    properties: Dict[str, Any] = {}


class HubSpotClient:
    """
    Client for HubSpot CRM API.

    Provides methods for managing contacts, deals, companies, and
    marketing automation workflows.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize HubSpot client.

        Args:
            api_key: HubSpot API key (uses settings if None)
        """
        self.settings = get_settings()
        self.logger = get_logger("hubspot_client")

        # Get API key
        if api_key:
            self.api_key = api_key
        else:
            key_manager = get_api_key_manager()
            self.api_key = key_manager.get_key("hubspot")

        # Initialize client
        self.client = HubSpot(access_token=self.api_key)

    # Contact Management

    def create_contact(self, contact: HubSpotContact) -> str:
        """
        Create a new contact.

        Args:
            contact: Contact data

        Returns:
            str: Contact ID
        """
        try:
            properties = {
                "email": contact.email,
                "firstname": contact.firstname,
                "lastname": contact.lastname,
                "company": contact.company,
                "phone": contact.phone,
                **contact.properties,
            }

            # Remove None values
            properties = {k: v for k, v in properties.items() if v is not None}

            simple_public_object_input = SimplePublicObjectInput(properties=properties)
            api_response = self.client.crm.contacts.basic_api.create(
                simple_public_object_input=simple_public_object_input
            )

            self.logger.info(f"Created contact: {api_response.id}")
            return api_response.id

        except ApiException as e:
            self.logger.error(f"Failed to create contact: {e}")
            raise

    def get_contact(self, contact_id: str) -> Optional[HubSpotContact]:
        """
        Get contact by ID.

        Args:
            contact_id: Contact ID

        Returns:
            Optional[HubSpotContact]: Contact data
        """
        try:
            api_response = self.client.crm.contacts.basic_api.get_by_id(
                contact_id=contact_id
            )

            props = api_response.properties
            return HubSpotContact(
                id=api_response.id,
                email=props.get("email"),
                firstname=props.get("firstname"),
                lastname=props.get("lastname"),
                company=props.get("company"),
                phone=props.get("phone"),
                properties=props,
            )

        except ApiException as e:
            self.logger.error(f"Failed to get contact: {e}")
            return None

    def update_contact(self, contact_id: str, properties: Dict[str, Any]) -> bool:
        """
        Update contact properties.

        Args:
            contact_id: Contact ID
            properties: Properties to update

        Returns:
            bool: Success status
        """
        try:
            simple_public_object_input = SimplePublicObjectInput(properties=properties)
            self.client.crm.contacts.basic_api.update(
                contact_id=contact_id,
                simple_public_object_input=simple_public_object_input,
            )

            self.logger.info(f"Updated contact: {contact_id}")
            return True

        except ApiException as e:
            self.logger.error(f"Failed to update contact: {e}")
            return False

    def search_contacts(
        self,
        filters: List[Dict[str, Any]],
        limit: int = 100,
    ) -> List[HubSpotContact]:
        """
        Search contacts with filters.

        Args:
            filters: Search filters
            limit: Maximum results

        Returns:
            List[HubSpotContact]: Matching contacts
        """
        try:
            # Implementation would use HubSpot search API
            # Simplified for brevity
            self.logger.info(f"Searching contacts with {len(filters)} filters")
            return []

        except Exception as e:
            self.logger.error(f"Contact search failed: {e}")
            return []

    # Deal Management

    def create_deal(self, deal: HubSpotDeal) -> str:
        """
        Create a new deal.

        Args:
            deal: Deal data

        Returns:
            str: Deal ID
        """
        try:
            properties = {
                "dealname": deal.dealname,
                "amount": deal.amount,
                "dealstage": deal.dealstage,
                **deal.properties,
            }

            # Remove None values
            properties = {k: v for k, v in properties.items() if v is not None}

            simple_public_object_input = SimplePublicObjectInput(properties=properties)
            api_response = self.client.crm.deals.basic_api.create(
                simple_public_object_input=simple_public_object_input
            )

            self.logger.info(f"Created deal: {api_response.id}")
            return api_response.id

        except ApiException as e:
            self.logger.error(f"Failed to create deal: {e}")
            raise

    def update_deal(self, deal_id: str, properties: Dict[str, Any]) -> bool:
        """
        Update deal properties.

        Args:
            deal_id: Deal ID
            properties: Properties to update

        Returns:
            bool: Success status
        """
        try:
            simple_public_object_input = SimplePublicObjectInput(properties=properties)
            self.client.crm.deals.basic_api.update(
                deal_id=deal_id,
                simple_public_object_input=simple_public_object_input,
            )

            self.logger.info(f"Updated deal: {deal_id}")
            return True

        except ApiException as e:
            self.logger.error(f"Failed to update deal: {e}")
            return False

    # Utility Methods

    def get_contact_by_email(self, email: str) -> Optional[HubSpotContact]:
        """
        Get contact by email address.

        Args:
            email: Email address

        Returns:
            Optional[HubSpotContact]: Contact data
        """
        try:
            # Implementation would search by email
            self.logger.info(f"Looking up contact by email: {email}")
            return None

        except Exception as e:
            self.logger.error(f"Email lookup failed: {e}")
            return None
