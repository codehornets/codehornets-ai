"""
CEO Strategy Director Agent

Provides strategic direction, high-level decision making, and company vision alignment.
"""

from typing import Dict, List, Any, Optional, Tuple
import yaml
import logging
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CEOStrategyDirectorAgent:
    """
    Agent responsible for executive strategic direction.

    Capabilities:
    - Strategic planning and vision
    - High-level decision making
    - Organizational alignment
    - Stakeholder management
    - Long-term goal setting
    """

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the CEO Strategy Director Agent."""
        self.config = self._load_config(config_path)
        self.name = "CEO Strategy Director Agent"
        self.role = "ceo_strategy_director"
        self.strategic_initiatives = []
        self.decisions = []
        self.stakeholders = {}
        logger.info(f"{self.name} initialized successfully")

    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load agent configuration from YAML file."""
        if config_path is None:
            config_path = Path(__file__).parent / "config.yaml"
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
                logger.info(f"Configuration loaded from {config_path}")
                return config
        except FileNotFoundError:
            logger.warning(f"Config file not found at {config_path}, using defaults")
            return self._get_default_config()
        except Exception as e:
            logger.error(f"Error loading config: {str(e)}")
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            'agent_name': 'CEO Strategy Director Agent',
            'model': 'gpt-4',
            'temperature': 0.4,
            'capabilities': ['strategic_planning', 'decision_making', 'vision_setting']
        }

    async def develop_strategy(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Develop comprehensive organizational strategy with SWOT analysis.

        Args:
            context: Strategic context including market data, objectives, and constraints

        Returns:
            Complete strategy with SWOT, objectives, initiatives, and timeline
        """
        try:
            logger.info("Developing organizational strategy")

            # Validate input
            if not context:
                raise ValueError("Context cannot be empty")

            # Perform SWOT analysis
            swot = self._perform_swot_analysis(
                context.get('market_data', {}),
                context.get('internal_data', {}),
                context.get('competitor_data', {})
            )

            # Apply strategic frameworks
            porter_analysis = self._analyze_competitive_forces(context.get('industry_data', {}))
            bcg_matrix = self._create_bcg_matrix(context.get('business_units', []))

            # Develop strategic initiatives
            initiatives = self._generate_strategic_initiatives(
                swot,
                context.get('objectives', []),
                context.get('budget', 0)
            )

            # Assess risks
            risk_assessment = self._assess_strategic_risks(initiatives, swot)

            # Create scenario models
            scenarios = self._model_scenarios(initiatives, context.get('assumptions', {}))

            strategy = {
                'id': f"STRAT-{len(self.strategic_initiatives) + 1:05d}",
                'created_at': datetime.now().isoformat(),
                'swot_analysis': swot,
                'porter_five_forces': porter_analysis,
                'bcg_matrix': bcg_matrix,
                'strategic_objectives': context.get('objectives', []),
                'initiatives': initiatives,
                'timeline': context.get('timeline', '12 months'),
                'budget_allocation': self._allocate_strategy_budget(
                    initiatives,
                    context.get('budget', 0)
                ),
                'risk_assessment': risk_assessment,
                'scenarios': scenarios,
                'key_metrics': self._define_strategic_metrics(initiatives),
                'status': 'draft',
                'confidence_score': self._calculate_strategy_confidence(swot, porter_analysis)
            }

            self.strategic_initiatives.append(strategy)
            logger.info(f"Strategy {strategy['id']} developed successfully")

            return strategy

        except Exception as e:
            logger.error(f"Error developing strategy: {str(e)}")
            raise

    def _perform_swot_analysis(
        self,
        market_data: Dict[str, Any],
        internal_data: Dict[str, Any],
        competitor_data: Dict[str, Any]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Perform comprehensive SWOT analysis."""
        try:
            swot = {
                'strengths': [],
                'weaknesses': [],
                'opportunities': [],
                'threats': []
            }

            # Analyze strengths from internal capabilities
            capabilities = internal_data.get('capabilities', [])
            resources = internal_data.get('resources', {})

            for capability in capabilities:
                if capability.get('rating', 0) >= 4:
                    swot['strengths'].append({
                        'factor': capability.get('name', 'Unknown'),
                        'impact': 'high',
                        'evidence': capability.get('description', ''),
                        'score': capability.get('rating', 0)
                    })

            # Analyze weaknesses
            for capability in capabilities:
                if capability.get('rating', 0) <= 2:
                    swot['weaknesses'].append({
                        'factor': capability.get('name', 'Unknown'),
                        'impact': 'medium',
                        'improvement_needed': True,
                        'score': capability.get('rating', 0)
                    })

            # Identify opportunities from market trends
            market_trends = market_data.get('trends', [])
            for trend in market_trends:
                if trend.get('growth_rate', 0) > 10:
                    swot['opportunities'].append({
                        'factor': trend.get('name', 'Market trend'),
                        'potential': 'high',
                        'timeframe': trend.get('timeframe', 'medium-term'),
                        'growth_rate': trend.get('growth_rate', 0)
                    })

            # Identify threats from competition and market
            competitors = competitor_data.get('competitors', [])
            for competitor in competitors:
                if competitor.get('market_share', 0) > 20:
                    swot['threats'].append({
                        'factor': f"Competition from {competitor.get('name', 'Unknown')}",
                        'severity': 'high',
                        'probability': 'medium',
                        'market_share': competitor.get('market_share', 0)
                    })

            logger.info(f"SWOT analysis completed: {len(swot['strengths'])} strengths, "
                       f"{len(swot['weaknesses'])} weaknesses, "
                       f"{len(swot['opportunities'])} opportunities, "
                       f"{len(swot['threats'])} threats")

            return swot

        except Exception as e:
            logger.error(f"Error in SWOT analysis: {str(e)}")
            return {'strengths': [], 'weaknesses': [], 'opportunities': [], 'threats': []}

    def _analyze_competitive_forces(self, industry_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply Porter's Five Forces framework."""
        try:
            forces = {
                'competitive_rivalry': self._assess_force(
                    industry_data.get('competitor_count', 0),
                    industry_data.get('market_growth', 0),
                    'rivalry'
                ),
                'supplier_power': self._assess_force(
                    industry_data.get('supplier_concentration', 0),
                    industry_data.get('switching_costs', 0),
                    'supplier'
                ),
                'buyer_power': self._assess_force(
                    industry_data.get('buyer_concentration', 0),
                    industry_data.get('price_sensitivity', 0),
                    'buyer'
                ),
                'threat_of_substitutes': self._assess_force(
                    industry_data.get('substitute_availability', 0),
                    industry_data.get('relative_price_performance', 0),
                    'substitute'
                ),
                'threat_of_new_entrants': self._assess_force(
                    industry_data.get('entry_barriers', 0),
                    industry_data.get('capital_requirements', 0),
                    'entry'
                ),
                'overall_attractiveness': 'medium'
            }

            # Calculate overall industry attractiveness
            avg_threat = sum([
                forces['competitive_rivalry']['score'],
                forces['supplier_power']['score'],
                forces['buyer_power']['score'],
                forces['threat_of_substitutes']['score'],
                forces['threat_of_new_entrants']['score']
            ]) / 5

            if avg_threat < 3:
                forces['overall_attractiveness'] = 'high'
            elif avg_threat > 4:
                forces['overall_attractiveness'] = 'low'

            return forces

        except Exception as e:
            logger.error(f"Error in Porter's Five Forces analysis: {str(e)}")
            return {}

    def _assess_force(self, metric1: float, metric2: float, force_type: str) -> Dict[str, Any]:
        """Assess individual competitive force."""
        score = (metric1 + metric2) / 2

        intensity_map = {
            (0, 2): 'low',
            (2, 4): 'medium',
            (4, 6): 'high'
        }

        intensity = 'medium'
        for (low, high), level in intensity_map.items():
            if low <= score < high:
                intensity = level
                break

        return {
            'score': score,
            'intensity': intensity,
            'metrics': {'metric1': metric1, 'metric2': metric2}
        }

    def _create_bcg_matrix(self, business_units: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Create BCG Growth-Share Matrix for business units."""
        try:
            matrix = {
                'stars': [],      # High growth, high share
                'cash_cows': [],  # Low growth, high share
                'question_marks': [],  # High growth, low share
                'dogs': []        # Low growth, low share
            }

            if not business_units:
                return matrix

            # Calculate median values for classification
            growth_rates = [bu.get('market_growth', 0) for bu in business_units]
            market_shares = [bu.get('relative_market_share', 0) for bu in business_units]

            median_growth = sorted(growth_rates)[len(growth_rates) // 2] if growth_rates else 10
            median_share = sorted(market_shares)[len(market_shares) // 2] if market_shares else 1

            for unit in business_units:
                growth = unit.get('market_growth', 0)
                share = unit.get('relative_market_share', 0)

                classification = {
                    'name': unit.get('name', 'Unknown'),
                    'growth': growth,
                    'market_share': share,
                    'revenue': unit.get('revenue', 0)
                }

                if growth >= median_growth and share >= median_share:
                    matrix['stars'].append(classification)
                elif growth < median_growth and share >= median_share:
                    matrix['cash_cows'].append(classification)
                elif growth >= median_growth and share < median_share:
                    matrix['question_marks'].append(classification)
                else:
                    matrix['dogs'].append(classification)

            return matrix

        except Exception as e:
            logger.error(f"Error creating BCG matrix: {str(e)}")
            return {'stars': [], 'cash_cows': [], 'question_marks': [], 'dogs': []}

    def _generate_strategic_initiatives(
        self,
        swot: Dict[str, List[Dict[str, Any]]],
        objectives: List[str],
        budget: float
    ) -> List[Dict[str, Any]]:
        """Generate strategic initiatives from SWOT analysis."""
        initiatives = []

        # SO Strategies: Use strengths to exploit opportunities
        for strength in swot.get('strengths', [])[:2]:
            for opportunity in swot.get('opportunities', [])[:2]:
                initiatives.append({
                    'name': f"Leverage {strength['factor']} for {opportunity['factor']}",
                    'type': 'SO_strategy',
                    'priority': 'high',
                    'estimated_cost': budget * 0.25,
                    'expected_impact': 'high',
                    'timeframe': '6-12 months'
                })

        # WO Strategies: Overcome weaknesses to exploit opportunities
        for weakness in swot.get('weaknesses', [])[:1]:
            initiatives.append({
                'name': f"Improve {weakness['factor']} to capture opportunities",
                'type': 'WO_strategy',
                'priority': 'medium',
                'estimated_cost': budget * 0.15,
                'expected_impact': 'medium',
                'timeframe': '12-18 months'
            })

        return initiatives

    def _allocate_strategy_budget(
        self,
        initiatives: List[Dict[str, Any]],
        total_budget: float
    ) -> Dict[str, Any]:
        """Allocate budget across strategic initiatives."""
        allocation = {
            'total_budget': total_budget,
            'allocations': [],
            'reserve': 0
        }

        # Priority-based allocation
        priority_weights = {'high': 0.5, 'medium': 0.3, 'low': 0.2}

        total_weight = sum(
            priority_weights.get(init.get('priority', 'medium'), 0.3)
            for init in initiatives
        )

        allocated = 0
        for initiative in initiatives:
            weight = priority_weights.get(initiative.get('priority', 'medium'), 0.3)
            amount = (weight / total_weight) * total_budget * 0.9  # 90% allocation, 10% reserve

            allocation['allocations'].append({
                'initiative': initiative.get('name', 'Unknown'),
                'amount': round(amount, 2),
                'percentage': round((amount / total_budget) * 100, 2)
            })
            allocated += amount

        allocation['reserve'] = round(total_budget - allocated, 2)

        return allocation

    def _assess_strategic_risks(
        self,
        initiatives: List[Dict[str, Any]],
        swot: Dict[str, List[Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """Assess risks associated with strategic initiatives."""
        risks = {
            'execution_risks': [],
            'market_risks': [],
            'financial_risks': [],
            'overall_risk_level': 'medium'
        }

        # Execution risks from weaknesses
        for weakness in swot.get('weaknesses', []):
            risks['execution_risks'].append({
                'risk': f"Capability gap in {weakness['factor']}",
                'probability': 'medium',
                'impact': 'high',
                'mitigation': 'Invest in capability building'
            })

        # Market risks from threats
        for threat in swot.get('threats', []):
            risks['market_risks'].append({
                'risk': threat['factor'],
                'probability': threat.get('probability', 'medium'),
                'impact': threat.get('severity', 'medium'),
                'mitigation': 'Continuous monitoring and adaptation'
            })

        # Financial risks
        total_cost = sum(init.get('estimated_cost', 0) for init in initiatives)
        if total_cost > 0:
            risks['financial_risks'].append({
                'risk': 'Budget overrun',
                'probability': 'low',
                'impact': 'high',
                'mitigation': 'Phased implementation with checkpoints'
            })

        # Calculate overall risk
        high_risk_count = sum(
            1 for category in [risks['execution_risks'], risks['market_risks'], risks['financial_risks']]
            for risk in category if risk.get('impact') == 'high'
        )

        if high_risk_count > 3:
            risks['overall_risk_level'] = 'high'
        elif high_risk_count < 2:
            risks['overall_risk_level'] = 'low'

        return risks

    def _model_scenarios(
        self,
        initiatives: List[Dict[str, Any]],
        assumptions: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Model different strategic scenarios."""
        base_growth = assumptions.get('base_growth_rate', 5)

        scenarios = {
            'optimistic': {
                'description': 'All initiatives succeed, favorable market conditions',
                'growth_rate': base_growth * 1.5,
                'success_probability': 0.3,
                'key_assumptions': ['Strong market growth', 'Successful execution', 'No major disruptions']
            },
            'realistic': {
                'description': 'Most initiatives succeed, normal market conditions',
                'growth_rate': base_growth,
                'success_probability': 0.5,
                'key_assumptions': ['Moderate market growth', 'Standard execution', 'Minor challenges']
            },
            'pessimistic': {
                'description': 'Some initiatives fail, challenging market conditions',
                'growth_rate': base_growth * 0.5,
                'success_probability': 0.2,
                'key_assumptions': ['Slow market growth', 'Execution challenges', 'Significant obstacles']
            }
        }

        return scenarios

    def _define_strategic_metrics(self, initiatives: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Define metrics to track strategic success."""
        metrics = [
            {
                'name': 'Strategy Execution Rate',
                'description': 'Percentage of initiatives completed on time',
                'target': 80,
                'unit': 'percentage'
            },
            {
                'name': 'Strategic Goal Achievement',
                'description': 'Percentage of strategic objectives achieved',
                'target': 75,
                'unit': 'percentage'
            },
            {
                'name': 'ROI on Strategic Initiatives',
                'description': 'Return on investment for strategic projects',
                'target': 25,
                'unit': 'percentage'
            }
        ]

        return metrics

    def _calculate_strategy_confidence(
        self,
        swot: Dict[str, List[Dict[str, Any]]],
        porter: Dict[str, Any]
    ) -> float:
        """Calculate confidence score for strategy."""
        try:
            # More strengths = higher confidence
            strength_score = min(len(swot.get('strengths', [])) * 10, 40)

            # Fewer threats = higher confidence
            threat_penalty = len(swot.get('threats', [])) * 5

            # Better industry attractiveness = higher confidence
            attractiveness_map = {'high': 30, 'medium': 20, 'low': 10}
            industry_score = attractiveness_map.get(
                porter.get('overall_attractiveness', 'medium'),
                20
            )

            confidence = max(min(strength_score - threat_penalty + industry_score, 100), 0)

            return round(confidence, 2)

        except Exception as e:
            logger.error(f"Error calculating confidence: {str(e)}")
            return 50.0

    async def make_decision(self, decision_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make strategic decision using multi-criteria decision matrix.

        Args:
            decision_data: Decision context with question, options, and criteria

        Returns:
            Decision with recommendation, scores, and rationale
        """
        try:
            logger.info("Making strategic decision")

            if not decision_data.get('question'):
                raise ValueError("Decision question is required")

            options = decision_data.get('options', [])
            criteria = decision_data.get('criteria', self._get_default_criteria())

            # Apply decision matrix
            decision_matrix = self._build_decision_matrix(options, criteria)

            # Calculate weighted scores
            scores = self._calculate_decision_scores(decision_matrix, criteria)

            # Select best option
            best_option = max(scores.items(), key=lambda x: x[1]['total_score'])

            decision = {
                'id': f"DEC-{len(self.decisions) + 1:05d}",
                'timestamp': datetime.now().isoformat(),
                'question': decision_data.get('question'),
                'options_evaluated': len(options),
                'decision_matrix': decision_matrix,
                'scores': scores,
                'recommendation': best_option[0],
                'confidence': best_option[1]['confidence'],
                'rationale': self._generate_decision_rationale(
                    best_option[0],
                    best_option[1],
                    criteria
                ),
                'risks': self._identify_decision_risks(best_option[0], options),
                'implementation_plan': self._create_implementation_plan(best_option[0])
            }

            self.decisions.append(decision)
            logger.info(f"Decision {decision['id']} made: {decision['recommendation']}")

            return decision

        except Exception as e:
            logger.error(f"Error making decision: {str(e)}")
            raise

    def _get_default_criteria(self) -> List[Dict[str, Any]]:
        """Get default decision criteria."""
        return [
            {'name': 'Strategic Alignment', 'weight': 0.3},
            {'name': 'Financial Impact', 'weight': 0.25},
            {'name': 'Risk Level', 'weight': 0.20},
            {'name': 'Implementation Feasibility', 'weight': 0.15},
            {'name': 'Time to Value', 'weight': 0.10}
        ]

    def _build_decision_matrix(
        self,
        options: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, float]]:
        """Build multi-criteria decision matrix."""
        matrix = {}

        for option in options:
            option_name = option.get('name', 'Unknown')
            matrix[option_name] = {}

            for criterion in criteria:
                criterion_name = criterion.get('name')
                # Score from option data or default to moderate score
                score = option.get('scores', {}).get(criterion_name, 5)
                matrix[option_name][criterion_name] = score

        return matrix

    def _calculate_decision_scores(
        self,
        matrix: Dict[str, Dict[str, float]],
        criteria: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """Calculate weighted scores for each option."""
        scores = {}

        for option_name, option_scores in matrix.items():
            total_score = 0
            breakdown = {}

            for criterion in criteria:
                criterion_name = criterion.get('name')
                weight = criterion.get('weight', 0)
                score = option_scores.get(criterion_name, 0)
                weighted = score * weight

                breakdown[criterion_name] = {
                    'raw_score': score,
                    'weighted_score': weighted
                }
                total_score += weighted

            scores[option_name] = {
                'total_score': round(total_score, 2),
                'breakdown': breakdown,
                'confidence': self._calculate_decision_confidence(breakdown)
            }

        return scores

    def _calculate_decision_confidence(self, breakdown: Dict[str, Dict[str, float]]) -> float:
        """Calculate confidence level for decision."""
        scores = [item['raw_score'] for item in breakdown.values()]

        if not scores:
            return 50.0

        # Higher average and lower variance = higher confidence
        avg = sum(scores) / len(scores)
        variance = sum((s - avg) ** 2 for s in scores) / len(scores)

        confidence = (avg / 10) * 100 * (1 - variance / 25)

        return round(max(min(confidence, 100), 0), 2)

    def _generate_decision_rationale(
        self,
        option: str,
        scores: Dict[str, Any],
        criteria: List[Dict[str, Any]]
    ) -> str:
        """Generate rationale for decision."""
        top_criteria = sorted(
            scores['breakdown'].items(),
            key=lambda x: x[1]['weighted_score'],
            reverse=True
        )[:2]

        rationale_parts = [
            f"Recommended option '{option}' with total score of {scores['total_score']}.",
            f"Key strengths: {top_criteria[0][0]} (score: {top_criteria[0][1]['raw_score']})",
            f"and {top_criteria[1][0]} (score: {top_criteria[1][1]['raw_score']})."
        ]

        return " ".join(rationale_parts)

    def _identify_decision_risks(
        self,
        chosen_option: str,
        all_options: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """Identify risks with chosen decision."""
        risks = []

        chosen = next((opt for opt in all_options if opt.get('name') == chosen_option), {})

        if chosen.get('complexity', 'low') == 'high':
            risks.append({
                'risk': 'Implementation complexity',
                'mitigation': 'Phased rollout with expert team'
            })

        if chosen.get('cost', 0) > 100000:
            risks.append({
                'risk': 'High financial commitment',
                'mitigation': 'Staged investment with milestones'
            })

        return risks

    def _create_implementation_plan(self, option: str) -> Dict[str, Any]:
        """Create high-level implementation plan."""
        return {
            'phases': [
                {'phase': 'Planning', 'duration': '2 weeks'},
                {'phase': 'Execution', 'duration': '8 weeks'},
                {'phase': 'Review', 'duration': '2 weeks'}
            ],
            'key_milestones': [
                'Stakeholder approval',
                'Resource allocation',
                'Implementation start',
                'Mid-point review',
                'Completion'
            ],
            'success_criteria': [
                'On-time delivery',
                'Within budget',
                'Stakeholder satisfaction > 80%'
            ]
        }

    async def align_vision(self, department_goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Align departmental goals with company vision using stakeholder analysis.

        Args:
            department_goals: List of department goals with objectives and metrics

        Returns:
            Alignment analysis with scores and recommendations
        """
        try:
            logger.info("Aligning departmental goals with vision")

            if not department_goals:
                raise ValueError("Department goals cannot be empty")

            # Perform alignment analysis
            alignment_scores = self._calculate_alignment_scores(department_goals)

            # Identify gaps
            gaps = self._identify_alignment_gaps(alignment_scores)

            # Generate recommendations
            recommendations = self._generate_alignment_recommendations(gaps)

            # Stakeholder impact analysis
            stakeholder_impact = self._analyze_stakeholder_impact(department_goals)

            result = {
                'timestamp': datetime.now().isoformat(),
                'departments_analyzed': len(department_goals),
                'alignment_scores': alignment_scores,
                'overall_alignment': self._calculate_overall_alignment(alignment_scores),
                'gaps': gaps,
                'recommendations': recommendations,
                'stakeholder_impact': stakeholder_impact,
                'action_items': self._create_alignment_action_items(gaps)
            }

            logger.info(f"Vision alignment completed: {result['overall_alignment']}% alignment")

            return result

        except Exception as e:
            logger.error(f"Error aligning vision: {str(e)}")
            raise

    def _calculate_alignment_scores(
        self,
        department_goals: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """Calculate alignment scores for each department."""
        scores = {}

        for dept in department_goals:
            dept_name = dept.get('department', 'Unknown')
            objectives = dept.get('objectives', [])

            # Score based on strategic alignment
            strategic_score = self._score_strategic_alignment(objectives)
            metric_score = self._score_metric_quality(dept.get('metrics', []))
            resource_score = self._score_resource_alignment(dept.get('resources', {}))

            overall = (strategic_score + metric_score + resource_score) / 3

            scores[dept_name] = {
                'overall_score': round(overall, 2),
                'strategic_alignment': strategic_score,
                'metric_quality': metric_score,
                'resource_alignment': resource_score,
                'status': 'aligned' if overall >= 75 else 'needs_improvement'
            }

        return scores

    def _score_strategic_alignment(self, objectives: List[str]) -> float:
        """Score how well objectives align with strategy."""
        if not objectives:
            return 0.0

        # Simplified scoring based on objective count and quality
        base_score = min(len(objectives) * 15, 60)
        quality_bonus = 25  # Assumed quality bonus

        return min(base_score + quality_bonus, 100)

    def _score_metric_quality(self, metrics: List[Dict[str, Any]]) -> float:
        """Score quality of metrics (SMART criteria)."""
        if not metrics:
            return 50.0

        total_score = 0
        for metric in metrics:
            score = 0
            if metric.get('specific'): score += 20
            if metric.get('measurable'): score += 20
            if metric.get('achievable'): score += 20
            if metric.get('relevant'): score += 20
            if metric.get('time_bound'): score += 20
            total_score += score

        return total_score / len(metrics)

    def _score_resource_alignment(self, resources: Dict[str, Any]) -> float:
        """Score resource allocation alignment."""
        allocated = resources.get('allocated', 0)
        required = resources.get('required', 1)

        if required == 0:
            return 100.0

        alignment = (allocated / required) * 100
        return min(alignment, 100)

    def _calculate_overall_alignment(self, scores: Dict[str, Dict[str, Any]]) -> float:
        """Calculate overall alignment percentage."""
        if not scores:
            return 0.0

        total = sum(dept['overall_score'] for dept in scores.values())
        return round(total / len(scores), 2)

    def _identify_alignment_gaps(
        self,
        alignment_scores: Dict[str, Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify alignment gaps."""
        gaps = []

        for dept_name, scores in alignment_scores.items():
            if scores['overall_score'] < 75:
                gaps.append({
                    'department': dept_name,
                    'gap_size': round(100 - scores['overall_score'], 2),
                    'primary_issue': self._identify_primary_issue(scores),
                    'priority': 'high' if scores['overall_score'] < 50 else 'medium'
                })

        return gaps

    def _identify_primary_issue(self, scores: Dict[str, Any]) -> str:
        """Identify primary alignment issue."""
        score_items = [
            ('strategic_alignment', scores.get('strategic_alignment', 0)),
            ('metric_quality', scores.get('metric_quality', 0)),
            ('resource_alignment', scores.get('resource_alignment', 0))
        ]

        lowest = min(score_items, key=lambda x: x[1])
        return lowest[0]

    def _generate_alignment_recommendations(
        self,
        gaps: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """Generate recommendations to improve alignment."""
        recommendations = []

        for gap in gaps:
            issue = gap['primary_issue']

            if issue == 'strategic_alignment':
                recommendations.append({
                    'department': gap['department'],
                    'recommendation': 'Revise objectives to align with strategic priorities',
                    'action': 'Schedule strategy workshop with department leadership'
                })
            elif issue == 'metric_quality':
                recommendations.append({
                    'department': gap['department'],
                    'recommendation': 'Improve metric definition using SMART criteria',
                    'action': 'Implement metric review and refinement process'
                })
            else:
                recommendations.append({
                    'department': gap['department'],
                    'recommendation': 'Adjust resource allocation to match strategic importance',
                    'action': 'Conduct resource reallocation review'
                })

        return recommendations

    def _analyze_stakeholder_impact(
        self,
        department_goals: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze stakeholder impact of alignment."""
        stakeholders = defaultdict(list)

        for dept in department_goals:
            affected = dept.get('stakeholders', [])
            for stakeholder in affected:
                stakeholders[stakeholder].append(dept.get('department', 'Unknown'))

        return {
            'stakeholder_count': len(stakeholders),
            'stakeholder_map': dict(stakeholders),
            'high_impact_stakeholders': [
                stakeholder for stakeholder, depts in stakeholders.items()
                if len(depts) >= 3
            ]
        }

    def _create_alignment_action_items(
        self,
        gaps: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Create action items to address gaps."""
        actions = []

        for gap in gaps:
            actions.append({
                'action': f"Address {gap['primary_issue']} gap in {gap['department']}",
                'priority': gap['priority'],
                'due_date': (datetime.now() + timedelta(days=30)).isoformat(),
                'owner': 'Department Head',
                'status': 'pending'
            })

        return actions

    def get_status(self) -> Dict[str, Any]:
        """Get current agent status."""
        return {
            'agent': self.name,
            'active_initiatives': len(self.strategic_initiatives),
            'decisions_made': len(self.decisions),
            'stakeholders_managed': len(self.stakeholders),
            'status': 'active',
            'last_updated': datetime.now().isoformat()
        }
