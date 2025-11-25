"""
Generic CRM client.

Provides abstracted interface for various CRM platforms including
HubSpot, Salesforce, Pipedrive, and Zoho.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from abc import ABC, abstractmethod

from pydantic import BaseModel

from core.logger import get_logger
from .hubspot_client import HubSpotClient


class CRMProvider(str, Enum):
    """Supported CRM providers."""

    HUBSPOT = "hubspot"
    SALESFORCE = "salesforce"
    PIPEDRIVE = "pipedrive"
    ZOHO = "zoho"


class CRMContact(BaseModel):
    """Generic CRM contact model."""

    id: Optional[str] = None
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    properties: Dict[str, Any] = {}


class CRMDeal(BaseModel):
    """Generic CRM deal model."""

    id: Optional[str] = None
    name: str
    amount: Optional[float] = None
    stage: Optional[str] = None
    close_date: Optional[str] = None
    contact_id: Optional[str] = None
    properties: Dict[str, Any] = {}


class BaseCRMClient(ABC):
    """Base class for CRM clients."""

    @abstractmethod
    def create_contact(self, contact: CRMContact) -> str:
        """Create a contact."""
        pass

    @abstractmethod
    def get_contact(self, contact_id: str) -> Optional[CRMContact]:
        """Get a contact by ID."""
        pass

    @abstractmethod
    def update_contact(self, contact_id: str, properties: Dict[str, Any]) -> bool:
        """Update contact properties."""
        pass

    @abstractmethod
    def create_deal(self, deal: CRMDeal) -> str:
        """Create a deal."""
        pass

    @abstractmethod
    def update_deal(self, deal_id: str, properties: Dict[str, Any]) -> bool:
        """Update deal properties."""
        pass


class CRMClient:
    """
    Unified CRM client supporting multiple platforms.

    Provides a consistent interface across different CRM systems
    with automatic provider detection and routing.
    """

    def __init__(
        self,
        provider: CRMProvider = CRMProvider.HUBSPOT,
        api_key: Optional[str] = None,
    ):
        """
        Initialize CRM client.

        Args:
            provider: CRM provider
            api_key: API key for the provider
        """
        self.logger = get_logger("crm_client")
        self.provider = provider

        # Initialize provider-specific client
        if provider == CRMProvider.HUBSPOT:
            self.client = HubSpotClient(api_key=api_key)
        elif provider == CRMProvider.SALESFORCE:
            # Initialize Salesforce client
            self.logger.warning("Salesforce client not yet implemented")
            self.client = None
        elif provider == CRMProvider.PIPEDRIVE:
            # Initialize Pipedrive client
            self.logger.warning("Pipedrive client not yet implemented")
            self.client = None
        elif provider == CRMProvider.ZOHO:
            # Initialize Zoho client
            self.logger.warning("Zoho client not yet implemented")
            self.client = None
        else:
            raise ValueError(f"Unsupported CRM provider: {provider}")

    def create_contact(self, contact: CRMContact) -> Optional[str]:
        """
        Create a contact in the CRM.

        Args:
            contact: Contact data

        Returns:
            Optional[str]: Contact ID
        """
        try:
            if self.provider == CRMProvider.HUBSPOT:
                from .hubspot_client import HubSpotContact

                hs_contact = HubSpotContact(
                    email=contact.email,
                    firstname=contact.first_name,
                    lastname=contact.last_name,
                    company=contact.company,
                    phone=contact.phone,
                    properties=contact.properties,
                )
                return self.client.create_contact(hs_contact)

            # Add other providers here

        except Exception as e:
            self.logger.error(f"Failed to create contact: {e}")
            return None

    def get_contact(self, contact_id: str) -> Optional[CRMContact]:
        """
        Get contact by ID.

        Args:
            contact_id: Contact ID

        Returns:
            Optional[CRMContact]: Contact data
        """
        try:
            if self.provider == CRMProvider.HUBSPOT:
                hs_contact = self.client.get_contact(contact_id)
                if hs_contact:
                    return CRMContact(
                        id=hs_contact.id,
                        email=hs_contact.email,
                        first_name=hs_contact.firstname,
                        last_name=hs_contact.lastname,
                        company=hs_contact.company,
                        phone=hs_contact.phone,
                        properties=hs_contact.properties,
                    )

            # Add other providers here

        except Exception as e:
            self.logger.error(f"Failed to get contact: {e}")
            return None

    def update_contact(
        self,
        contact_id: str,
        properties: Dict[str, Any],
    ) -> bool:
        """
        Update contact properties.

        Args:
            contact_id: Contact ID
            properties: Properties to update

        Returns:
            bool: Success status
        """
        try:
            if self.provider == CRMProvider.HUBSPOT:
                return self.client.update_contact(contact_id, properties)

            # Add other providers here

        except Exception as e:
            self.logger.error(f"Failed to update contact: {e}")
            return False

    def create_deal(self, deal: CRMDeal) -> Optional[str]:
        """
        Create a deal in the CRM.

        Args:
            deal: Deal data

        Returns:
            Optional[str]: Deal ID
        """
        try:
            if self.provider == CRMProvider.HUBSPOT:
                from .hubspot_client import HubSpotDeal

                hs_deal = HubSpotDeal(
                    dealname=deal.name,
                    amount=deal.amount,
                    dealstage=deal.stage,
                    properties=deal.properties,
                )
                return self.client.create_deal(hs_deal)

            # Add other providers here

        except Exception as e:
            self.logger.error(f"Failed to create deal: {e}")
            return None

    def search_contacts(
        self,
        query: str,
        limit: int = 100,
    ) -> List[CRMContact]:
        """
        Search contacts.

        Args:
            query: Search query
            limit: Maximum results

        Returns:
            List[CRMContact]: Matching contacts
        """
        try:
            if self.provider == CRMProvider.HUBSPOT:
                # Implement HubSpot search
                self.logger.info(f"Searching contacts: {query}")
                return []

            # Add other providers here

        except Exception as e:
            self.logger.error(f"Contact search failed: {e}")
            return []
