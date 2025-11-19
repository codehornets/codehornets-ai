"""
Unit tests for workflow modules.
"""

import pytest
from datetime import datetime
from workflows.offer_to_marketing import OfferToMarketingWorkflow
from workflows.marketing_to_sales import MarketingToSalesWorkflow
from workflows.sales_to_fulfillment import SalesToFulfillmentWorkflow
from workflows.fulfillment_to_feedback import FulfillmentToFeedbackWorkflow
from workflows.feedback_to_offer import FeedbackToOfferWorkflow


class TestOfferToMarketingWorkflow:
    """Test cases for OfferToMarketingWorkflow."""

    def test_workflow_initialization(self):
        """Test workflow can be initialized."""
        workflow = OfferToMarketingWorkflow()
        assert workflow.status == "initialized"
        assert workflow.workflow_id is None

    def test_validate_offer_success(self):
        """Test offer validation with valid data."""
        workflow = OfferToMarketingWorkflow()
        offer_data = {
            'product_name': 'Test Product',
            'target_audience': 'Tech professionals',
            'value_proposition': 'Best solution',
            'pricing_tier': 'premium',
            'unique_selling_points': ['Fast', 'Reliable']
        }
        assert workflow.validate_offer(offer_data) is True

    def test_validate_offer_missing_fields(self):
        """Test offer validation with missing fields."""
        workflow = OfferToMarketingWorkflow()
        offer_data = {'product_name': 'Test Product'}
        assert workflow.validate_offer(offer_data) is False

    def test_workflow_execution(self):
        """Test complete workflow execution."""
        workflow = OfferToMarketingWorkflow()
        offer_data = {
            'product_name': 'Test Product',
            'target_audience': 'Tech professionals',
            'value_proposition': 'Best solution',
            'pricing_tier': 'premium',
            'unique_selling_points': ['Fast', 'Reliable']
        }
        result = workflow.execute(offer_data)
        assert result['success'] is True
        assert 'workflow_id' in result
        assert 'handoff_data' in result


class TestMarketingToSalesWorkflow:
    """Test cases for MarketingToSalesWorkflow."""

    def test_workflow_initialization(self):
        """Test workflow can be initialized."""
        workflow = MarketingToSalesWorkflow()
        assert workflow.status == "initialized"

    def test_qualify_leads(self):
        """Test lead qualification."""
        workflow = MarketingToSalesWorkflow()
        campaign_data = {
            'campaign_id': 'camp_123',
            'leads_generated': [
                {'id': 'lead_1', 'score': 80, 'engagement_level': 'high'},
                {'id': 'lead_2', 'score': 50, 'engagement_level': 'low'},
            ]
        }
        qualified = workflow.qualify_leads(campaign_data)
        assert len(qualified) == 1
        assert qualified[0]['lead_id'] == 'lead_1'


class TestSalesToFulfillmentWorkflow:
    """Test cases for SalesToFulfillmentWorkflow."""

    def test_workflow_initialization(self):
        """Test workflow can be initialized."""
        workflow = SalesToFulfillmentWorkflow()
        assert workflow.status == "initialized"

    def test_validate_deal_data(self):
        """Test deal data validation."""
        workflow = SalesToFulfillmentWorkflow()
        deal_data = {
            'deal_id': 'deal_123',
            'client_info': {'name': 'Test Client'},
            'service_package': {'type': 'web'},
            'contract_terms': {'total_value': 10000},
            'payment_status': 'verified',
            'status': 'closed_won'
        }
        assert workflow.validate_deal_data(deal_data) is True


class TestFulfillmentToFeedbackWorkflow:
    """Test cases for FulfillmentToFeedbackWorkflow."""

    def test_workflow_initialization(self):
        """Test workflow can be initialized."""
        workflow = FulfillmentToFeedbackWorkflow()
        assert workflow.status == "initialized"

    def test_validate_completion_data(self):
        """Test completion data validation."""
        workflow = FulfillmentToFeedbackWorkflow()
        completion_data = {
            'project_id': 'proj_123',
            'work_order_id': 'wo_123',
            'client_info': {'name': 'Test Client'},
            'deliverables_status': [
                {'name': 'Website', 'status': 'completed'}
            ],
            'completion_date': datetime.utcnow().isoformat()
        }
        assert workflow.validate_completion_data(completion_data) is True


class TestFeedbackToOfferWorkflow:
    """Test cases for FeedbackToOfferWorkflow."""

    def test_workflow_initialization(self):
        """Test workflow can be initialized."""
        workflow = FeedbackToOfferWorkflow()
        assert workflow.status == "initialized"

    def test_validate_feedback_data(self):
        """Test feedback data validation."""
        workflow = FeedbackToOfferWorkflow()
        feedback_data = {
            'feedback_id': 'fb_123',
            'project_id': 'proj_123',
            'responses': [
                {'liked_most': 'Great service', 'could_improve': 'Communication'}
            ],
            'ratings': {'overall': [5, 4, 5]}
        }
        assert workflow.validate_feedback_data(feedback_data) is True

    def test_calculate_satisfaction_score(self):
        """Test satisfaction score calculation."""
        workflow = FeedbackToOfferWorkflow()
        ratings = {'overall': [5, 4, 5], 'quality': [5, 5, 4]}
        score = workflow._calculate_satisfaction_score(ratings)
        assert 0 <= score <= 100
        assert isinstance(score, float)
