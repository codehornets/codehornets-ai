"""
Learning Analyst Agent

Analyzes learning effectiveness through completion rates, time-to-competency metrics,
engagement scoring, Kirkpatrick/Phillips ROI, predictive analytics, and benchmarking.
"""

from typing import Dict, List, Any, Optional, Set, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import json
import hashlib
import statistics
from dataclasses import dataclass, field, asdict
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AnalysisMetric(Enum):
    COMPLETION_RATE = "completion_rate"
    TIME_TO_COMPETENCY = "time_to_competency"
    ENGAGEMENT = "engagement"
    EFFECTIVENESS = "effectiveness"
    ROI = "roi"

class KirkpatrickLevel(Enum):
    REACTION = "reaction"
    LEARNING = "learning"
    BEHAVIOR = "behavior"
    RESULTS = "results"

class EngagementIndicator(Enum):
    LOGIN_FREQUENCY = "login_frequency"
    CONTENT_CONSUMPTION = "content_consumption"
    ACTIVITY_PARTICIPATION = "activity_participation"
    SOCIAL_INTERACTION = "social_interaction"

class PredictionModel(Enum):
    DROPOUT_RISK = "dropout_risk"
    SUCCESS_LIKELIHOOD = "success_likelihood"
    COMPLETION_TIME = "completion_time"
    PERFORMANCE_FORECAST = "performance_forecast"

@dataclass
class LearnerActivity:
    learner_id: str
    course_id: str
    activity_type: str
    timestamp: str
    duration_minutes: int = 0
    completed: bool = False
    score: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class CourseEnrollment:
    enrollment_id: str
    learner_id: str
    course_id: str
    cohort: str
    start_date: str
    end_date: Optional[str] = None
    status: str = "active"
    completion_percentage: float = 0.0
    final_score: Optional[float] = None
    time_spent_hours: float = 0.0
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

@dataclass
class CompetencyAssessment:
    assessment_id: str
    learner_id: str
    competency_id: str
    pre_score: float
    post_score: float
    assessment_date: str
    time_to_proficiency_days: int
    behavior_change_observed: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class BusinessImpactData:
    metric_id: str
    course_id: str
    metric_name: str
    baseline_value: float
    post_training_value: float
    measurement_period_months: int
    monetary_benefit: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

@dataclass
class LearningCost:
    cost_id: str
    course_id: str
    development_cost: float
    delivery_cost: float
    technology_cost: float
    participant_time_cost: float
    total_cost: float = 0.0

@dataclass
class EngagementMetrics:
    learner_id: str
    course_id: str
    login_count: int
    content_views: int
    activities_completed: int
    discussions_participated: int
    avg_session_duration_minutes: float
    last_active_date: str
    engagement_score: float = 0.0

@dataclass
class PredictiveModelData:
    model_id: str
    model_type: PredictionModel
    features: List[str]
    accuracy: float
    predictions: List[Dict[str, Any]] = field(default_factory=list)
    trained_at: str = field(default_factory=lambda: datetime.now().isoformat())

class LearningAnalystAgent:
    """Learning Analyst Agent for comprehensive learning analytics"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.agent_id = "learning_analyst_001"
        self.config = config or {}
        self.history: List[Dict[str, Any]] = []
        self.name = "Learning Analyst"
        self.role = "Learning Analytics and Effectiveness Measurement"
        
        self.enrollments: Dict[str, CourseEnrollment] = {}
        self.activities: List[LearnerActivity] = []
        self.competency_assessments: List[CompetencyAssessment] = []
        self.business_impacts: List[BusinessImpactData] = []
        self.learning_costs: Dict[str, LearningCost] = {}
        self.engagement_data: Dict[str, EngagementMetrics] = {}
        self.completion_rates: Dict[str, float] = {}
        self.predictive_models: Dict[str, PredictiveModelData] = {}
        self.benchmarks: Dict[str, Dict[str, float]] = {}
        
        logger.info(f"Initialized {self.name} agent: {self.agent_id}")
