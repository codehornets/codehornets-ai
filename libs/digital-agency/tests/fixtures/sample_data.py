"""
Sample data fixtures for testing.
"""

from datetime import datetime


# Sample offer data
SAMPLE_OFFER = {
    'product_name': 'Premium Digital Marketing Package',
    'target_audience': 'Small to medium businesses',
    'value_proposition': 'Grow your online presence by 300%',
    'pricing_tier': 'premium',
    'unique_selling_points': [
        'Full-service solution',
        'Proven track record',
        'Dedicated account manager'
    ],
    'brand_guidelines': {
        'colors': ['#007BFF', '#28A745'],
        'tone': 'professional yet approachable'
    }
}

# Sample campaign data
SAMPLE_CAMPAIGN = {
    'campaign_id': 'camp_test_123',
    'campaign_name': 'Q1 Digital Marketing Launch',
    'leads_generated': [
        {
            'id': 'lead_001',
            'contact_info': {
                'name': 'John Smith',
                'email': 'john@example.com',
                'company': 'Tech Startup Inc'
            },
            'score': 85,
            'engagement_level': 'high',
            'interests': ['SEO', 'content marketing'],
            'pain_points': ['low website traffic', 'poor conversion rates'],
            'budget_indicator': 'medium',
            'urgency': 'high',
            'engagement_history': ['clicked_email', 'downloaded_whitepaper']
        },
        {
            'id': 'lead_002',
            'contact_info': {
                'name': 'Jane Doe',
                'email': 'jane@example.com',
                'company': 'Retail Business LLC'
            },
            'score': 92,
            'engagement_level': 'very_high',
            'interests': ['social media', 'paid advertising'],
            'pain_points': ['brand awareness', 'customer engagement'],
            'budget_indicator': 'high',
            'urgency': 'medium',
            'engagement_history': ['attended_webinar', 'requested_demo']
        }
    ],
    'campaign_metrics': {
        'impressions': 50000,
        'clicks': 2500,
        'ctr': 0.05
    },
    'lead_scores': {},
    'value_proposition': 'Grow your business online'
}

# Sample deal data
SAMPLE_DEAL = {
    'deal_id': 'deal_test_456',
    'client_info': {
        'company_name': 'Tech Startup Inc',
        'primary_contact': {
            'name': 'John Smith',
            'email': 'john@example.com',
            'phone': '+1-555-0123'
        },
        'tier': 'standard'
    },
    'service_package': {
        'type': 'web_development',
        'deliverables': [
            {
                'name': 'Corporate Website',
                'description': 'Modern responsive website',
                'estimated_days': 30,
                'estimated_hours': 120
            },
            {
                'name': 'SEO Optimization',
                'description': 'On-page and technical SEO',
                'estimated_days': 10,
                'estimated_hours': 40
            }
        ],
        'timeline': {
            'start_date': '2025-02-01',
            'end_date': '2025-03-15'
        }
    },
    'contract_terms': {
        'total_value': 15000,
        'payment_schedule': [
            '40% upfront',
            '30% at milestone 1',
            '30% on completion'
        ]
    },
    'payment_status': 'verified',
    'status': 'closed_won',
    'client_expectations': [
        'Modern design',
        'Mobile-friendly',
        'Fast loading times'
    ]
}

# Sample completion data
SAMPLE_COMPLETION = {
    'project_id': 'proj_test_789',
    'work_order_id': 'wo_test_123',
    'project_name': 'Tech Startup Inc - Website Development',
    'project_type': 'web_development',
    'client_info': {
        'company_name': 'Tech Startup Inc',
        'primary_contact': {
            'name': 'John Smith',
            'email': 'john@example.com'
        }
    },
    'deliverables_status': [
        {
            'name': 'Corporate Website',
            'description': 'Modern responsive website',
            'status': 'completed',
            'completed_date': '2025-03-10T10:00:00Z',
            'quality_metrics': {'performance_score': 95},
            'client_approved': True
        },
        {
            'name': 'SEO Optimization',
            'description': 'On-page and technical SEO',
            'status': 'completed',
            'completed_date': '2025-03-14T15:00:00Z',
            'quality_metrics': {'seo_score': 88},
            'client_approved': True
        }
    ],
    'completion_date': '2025-03-15T12:00:00Z',
    'start_date': '2025-02-01T09:00:00Z',
    'contract_value': 15000,
    'milestones_completed': [
        'Project kickoff',
        'Design approval',
        'Development',
        'Testing',
        'Launch'
    ]
}

# Sample feedback data
SAMPLE_FEEDBACK = {
    'feedback_id': 'fb_test_321',
    'project_id': 'proj_test_789',
    'responses': [
        {
            'liked_most': 'Excellent communication and timely delivery',
            'could_improve': 'More frequent progress updates',
            'would_recommend': 'yes',
            'future_services_interest': 'ongoing support and maintenance'
        }
    ],
    'ratings': {
        'overall_satisfaction': [5],
        'communication': [5],
        'timeliness': [4],
        'quality': [5],
        'value_for_money': [4]
    }
}


def get_sample_offer():
    """Get sample offer data."""
    return SAMPLE_OFFER.copy()


def get_sample_campaign():
    """Get sample campaign data."""
    return SAMPLE_CAMPAIGN.copy()


def get_sample_deal():
    """Get sample deal data."""
    return SAMPLE_DEAL.copy()


def get_sample_completion():
    """Get sample completion data."""
    return SAMPLE_COMPLETION.copy()


def get_sample_feedback():
    """Get sample feedback data."""
    return SAMPLE_FEEDBACK.copy()
