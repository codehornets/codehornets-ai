"""
Workflows module for digital agency automation.
Contains domain handoff workflows between different departments.
"""

from .offer_to_marketing import OfferToMarketingWorkflow
from .marketing_to_sales import MarketingToSalesWorkflow
from .sales_to_fulfillment import SalesToFulfillmentWorkflow
from .fulfillment_to_feedback import FulfillmentToFeedbackWorkflow
from .feedback_to_offer import FeedbackToOfferWorkflow

__all__ = [
    'OfferToMarketingWorkflow',
    'MarketingToSalesWorkflow',
    'SalesToFulfillmentWorkflow',
    'FulfillmentToFeedbackWorkflow',
    'FeedbackToOfferWorkflow',
]
