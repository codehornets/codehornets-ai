"""
Pytest configuration and shared fixtures.
"""

import pytest
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


@pytest.fixture
def sample_offer_data():
    """Provide sample offer data for testing."""
    return {
        'product_name': 'Test Product',
        'target_audience': 'Test Audience',
        'value_proposition': 'Test Value Proposition',
        'pricing_tier': 'standard',
        'unique_selling_points': ['Feature 1', 'Feature 2']
    }


@pytest.fixture
def sample_campaign_data():
    """Provide sample campaign data for testing."""
    return {
        'campaign_id': 'test_campaign_123',
        'campaign_name': 'Test Campaign',
        'leads_generated': [
            {
                'id': 'lead_1',
                'score': 80,
                'engagement_level': 'high',
                'contact_info': {'email': 'test@example.com'}
            }
        ],
        'campaign_metrics': {},
        'lead_scores': {}
    }


@pytest.fixture
def sample_deal_data():
    """Provide sample deal data for testing."""
    return {
        'deal_id': 'test_deal_123',
        'client_info': {'name': 'Test Client'},
        'service_package': {'type': 'test'},
        'contract_terms': {'total_value': 10000},
        'payment_status': 'verified',
        'status': 'closed_won'
    }


@pytest.fixture
def sample_completion_data():
    """Provide sample completion data for testing."""
    from datetime import datetime
    return {
        'project_id': 'test_proj_123',
        'work_order_id': 'test_wo_123',
        'client_info': {'name': 'Test Client'},
        'deliverables_status': [
            {'name': 'Deliverable 1', 'status': 'completed'}
        ],
        'completion_date': datetime.utcnow().isoformat()
    }


@pytest.fixture
def sample_feedback_data():
    """Provide sample feedback data for testing."""
    return {
        'feedback_id': 'test_fb_123',
        'project_id': 'test_proj_123',
        'responses': [
            {'liked_most': 'Great work', 'could_improve': 'Nothing'}
        ],
        'ratings': {'overall': [5, 4, 5]}
    }
