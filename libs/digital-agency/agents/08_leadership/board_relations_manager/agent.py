"""Board Relations Manager Agent - Manages board communications."""

from typing import Dict, List, Any, Optional
import yaml
import logging
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BoardRelationsManagerAgent:
    """Agent responsible for board relations and stakeholder management."""

    def __init__(self, config_path: Optional[str] = None):
        self.config = self._load_config(config_path)
        self.name = "Board Relations Manager Agent"
        self.role = "board_relations_manager"
        self.reports = []
        self.meetings = []
        self.stakeholders = {}
        self.action_items = []
        logger.info(f"{self.name} initialized successfully")

    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        if config_path is None:
            config_path = Path(__file__).parent / "config.yaml"
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
                logger.info(f"Configuration loaded from {config_path}")
                return config
        except FileNotFoundError:
            logger.warning(f"Config file not found at {config_path}, using defaults")
            return {'agent_name': self.name, 'model': 'gpt-4', 'temperature': 0.3}
        except Exception as e:
            logger.error(f"Error loading config: {str(e)}")
            return {'agent_name': self.name, 'model': 'gpt-4', 'temperature': 0.3}

    async def prepare_board_report(self, period: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Prepare comprehensive board report with executive summary.

        Args:
            period: Reporting period (e.g., 'Q1 2024', 'January 2024')
            data: Performance and operational data

        Returns:
            Complete board report with executive summary and key metrics
        """
        try:
            logger.info(f"Preparing board report for {period}")

            if not period:
                raise ValueError("Reporting period is required")

            if data is None:
                data = {}

            # Generate executive summary
            executive_summary = self._generate_executive_summary(data, period)

            # Compile financial metrics
            financial_section = self._compile_financial_metrics(data.get('financial', {}))

            # Compile operational highlights
            operational_section = self._compile_operational_highlights(data.get('operational', {}))

            # Analyze strategic initiatives
            strategic_section = self._analyze_strategic_progress(data.get('strategic', {}))

            # Identify risks and opportunities
            risk_section = self._compile_risk_assessment(data.get('risks', []))

            # Prepare recommendations
            recommendations = self._prepare_board_recommendations(
                financial_section,
                operational_section,
                strategic_section
            )

            # Create appendices
            appendices = self._create_appendices(data)

            report = {
                'id': f"BOARD-RPT-{len(self.reports) + 1:05d}",
                'period': period,
                'generated_at': datetime.now().isoformat(),
                'executive_summary': executive_summary,
                'sections': {
                    'financial': financial_section,
                    'operational': operational_section,
                    'strategic': strategic_section,
                    'risks': risk_section
                },
                'recommendations': recommendations,
                'appendices': appendices,
                'next_steps': self._define_next_steps(recommendations),
                'status': 'prepared'
            }

            self.reports.append(report)
            logger.info(f"Board report {report['id']} prepared successfully")

            return report

        except Exception as e:
            logger.error(f"Error preparing board report: {str(e)}")
            raise

    def _generate_executive_summary(self, data: Dict[str, Any], period: str) -> Dict[str, Any]:
        """Generate executive summary for board report."""
        financial = data.get('financial', {})
        operational = data.get('operational', {})

        # Calculate key highlights
        revenue = financial.get('revenue', 0)
        revenue_growth = financial.get('revenue_growth', 0)
        profit_margin = financial.get('profit_margin', 0)

        highlights = []

        if revenue_growth > 10:
            highlights.append(f"Strong revenue growth of {revenue_growth}% in {period}")

        if profit_margin > 20:
            highlights.append(f"Healthy profit margin maintained at {profit_margin}%")

        customer_growth = operational.get('customer_growth', 0)
        if customer_growth > 15:
            highlights.append(f"Customer base expanded by {customer_growth}%")

        # Identify challenges
        challenges = []
        if revenue_growth < 5:
            challenges.append("Revenue growth below target")

        if operational.get('employee_turnover', 0) > 15:
            challenges.append("Employee retention needs attention")

        return {
            'period': period,
            'key_highlights': highlights,
            'challenges': challenges,
            'overall_status': 'strong' if len(highlights) > len(challenges) else 'needs_attention',
            'board_actions_required': len(challenges) > 2
        }

    def _compile_financial_metrics(self, financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """Compile financial metrics section."""
        try:
            revenue = financial_data.get('revenue', 0)
            expenses = financial_data.get('expenses', 0)
            profit = revenue - expenses

            return {
                'revenue': {
                    'amount': revenue,
                    'growth_rate': financial_data.get('revenue_growth', 0),
                    'vs_target': self._calculate_variance(revenue, financial_data.get('revenue_target', revenue))
                },
                'expenses': {
                    'amount': expenses,
                    'as_percentage_of_revenue': round((expenses / revenue * 100), 2) if revenue > 0 else 0
                },
                'profitability': {
                    'gross_profit': profit,
                    'profit_margin': round((profit / revenue * 100), 2) if revenue > 0 else 0,
                    'ebitda': financial_data.get('ebitda', profit * 1.2)
                },
                'cash_flow': {
                    'operating_cash_flow': financial_data.get('operating_cash_flow', profit * 0.9),
                    'free_cash_flow': financial_data.get('free_cash_flow', profit * 0.7),
                    'cash_position': financial_data.get('cash_position', revenue * 0.3)
                },
                'key_ratios': {
                    'roe': financial_data.get('roe', 15),
                    'roa': financial_data.get('roa', 10),
                    'current_ratio': financial_data.get('current_ratio', 2.0)
                }
            }

        except Exception as e:
            logger.error(f"Error compiling financial metrics: {str(e)}")
            return {}

    def _calculate_variance(self, actual: float, target: float) -> Dict[str, Any]:
        """Calculate variance between actual and target."""
        if target == 0:
            return {'amount': 0, 'percentage': 0, 'status': 'no_target'}

        variance_amount = actual - target
        variance_percentage = (variance_amount / target) * 100

        return {
            'amount': round(variance_amount, 2),
            'percentage': round(variance_percentage, 2),
            'status': 'favorable' if variance_amount >= 0 else 'unfavorable'
        }

    def _compile_operational_highlights(self, operational_data: Dict[str, Any]) -> Dict[str, Any]:
        """Compile operational highlights section."""
        return {
            'customer_metrics': {
                'total_customers': operational_data.get('total_customers', 0),
                'customer_growth': operational_data.get('customer_growth', 0),
                'customer_satisfaction': operational_data.get('customer_satisfaction', 85),
                'nps_score': operational_data.get('nps_score', 45)
            },
            'team_metrics': {
                'headcount': operational_data.get('headcount', 0),
                'employee_satisfaction': operational_data.get('employee_satisfaction', 80),
                'turnover_rate': operational_data.get('employee_turnover', 10),
                'productivity_index': operational_data.get('productivity_index', 100)
            },
            'operational_efficiency': {
                'process_efficiency': operational_data.get('process_efficiency', 85),
                'on_time_delivery': operational_data.get('on_time_delivery', 95),
                'quality_score': operational_data.get('quality_score', 90)
            },
            'key_achievements': operational_data.get('achievements', []),
            'areas_for_improvement': operational_data.get('improvements_needed', [])
        }

    def _analyze_strategic_progress(self, strategic_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze strategic initiative progress."""
        initiatives = strategic_data.get('initiatives', [])

        completed = [i for i in initiatives if i.get('status') == 'completed']
        in_progress = [i for i in initiatives if i.get('status') == 'in_progress']
        delayed = [i for i in initiatives if i.get('status') == 'delayed']

        return {
            'total_initiatives': len(initiatives),
            'completed': len(completed),
            'in_progress': len(in_progress),
            'delayed': len(delayed),
            'completion_rate': round((len(completed) / len(initiatives) * 100), 2) if initiatives else 0,
            'initiative_details': [
                {
                    'name': i.get('name'),
                    'status': i.get('status'),
                    'progress': i.get('progress', 0),
                    'impact': i.get('expected_impact', 'medium')
                }
                for i in initiatives[:5]  # Top 5 initiatives
            ],
            'strategic_priorities': strategic_data.get('priorities', [])
        }

    def _compile_risk_assessment(self, risks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compile risk assessment section."""
        high_risks = [r for r in risks if r.get('severity') == 'high']
        medium_risks = [r for r in risks if r.get('severity') == 'medium']
        low_risks = [r for r in risks if r.get('severity') == 'low']

        return {
            'total_risks': len(risks),
            'high_severity': len(high_risks),
            'medium_severity': len(medium_risks),
            'low_severity': len(low_risks),
            'top_risks': [
                {
                    'risk': r.get('description'),
                    'severity': r.get('severity'),
                    'probability': r.get('probability'),
                    'mitigation': r.get('mitigation_plan')
                }
                for r in high_risks[:3]
            ],
            'risk_trend': 'increasing' if len(high_risks) > 3 else 'stable',
            'mitigation_status': 'active'
        }

    def _prepare_board_recommendations(
        self,
        financial: Dict[str, Any],
        operational: Dict[str, Any],
        strategic: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Prepare recommendations for board consideration."""
        recommendations = []

        # Financial recommendations
        profit_margin = financial.get('profitability', {}).get('profit_margin', 0)
        if profit_margin < 15:
            recommendations.append({
                'area': 'Financial',
                'recommendation': 'Implement cost optimization initiatives to improve profit margin',
                'priority': 'high',
                'expected_impact': 'Improve margin by 3-5 percentage points'
            })

        # Operational recommendations
        turnover = operational.get('team_metrics', {}).get('turnover_rate', 0)
        if turnover > 15:
            recommendations.append({
                'area': 'Human Resources',
                'recommendation': 'Enhance employee retention programs and benefits',
                'priority': 'medium',
                'expected_impact': 'Reduce turnover to below 10%'
            })

        # Strategic recommendations
        delayed_initiatives = strategic.get('delayed', 0)
        if delayed_initiatives > 2:
            recommendations.append({
                'area': 'Strategic Execution',
                'recommendation': 'Review and reallocate resources to delayed strategic initiatives',
                'priority': 'high',
                'expected_impact': 'Accelerate strategic goal achievement'
            })

        return recommendations

    def _create_appendices(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create appendices with detailed data."""
        return [
            {
                'title': 'Detailed Financial Statements',
                'content_type': 'financial_tables',
                'pages': 3
            },
            {
                'title': 'Organizational Chart',
                'content_type': 'diagram',
                'pages': 1
            },
            {
                'title': 'Market Analysis',
                'content_type': 'report',
                'pages': 5
            }
        ]

    def _define_next_steps(self, recommendations: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Define next steps based on recommendations."""
        next_steps = []

        high_priority = [r for r in recommendations if r.get('priority') == 'high']

        for i, rec in enumerate(high_priority[:3], 1):
            next_steps.append({
                'step': i,
                'action': f"Address {rec.get('area')} recommendation",
                'owner': 'Executive Team',
                'due_date': (datetime.now() + timedelta(days=30)).isoformat()
            })

        return next_steps

    async def schedule_meeting(self, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Schedule board meeting with agenda creation.

        Args:
            meeting_data: Meeting details including date, attendees, topics

        Returns:
            Meeting details with generated agenda
        """
        try:
            logger.info("Scheduling board meeting")

            if not meeting_data:
                raise ValueError("Meeting data is required")

            # Generate meeting agenda
            agenda = self._generate_meeting_agenda(meeting_data.get('topics', []))

            # Identify required attendees
            attendees = self._identify_attendees(meeting_data.get('topics', []))

            # Prepare pre-read materials
            pre_read = self._prepare_pre_read_materials(meeting_data.get('topics', []))

            # Calculate meeting duration
            duration = self._estimate_meeting_duration(agenda)

            meeting = {
                'id': f"MTG-{len(self.meetings) + 1:05d}",
                'scheduled_at': datetime.now().isoformat(),
                'meeting_date': meeting_data.get('date', (datetime.now() + timedelta(days=14)).isoformat()),
                'duration_minutes': duration,
                'type': meeting_data.get('type', 'regular'),
                'agenda': agenda,
                'attendees': attendees,
                'pre_read_materials': pre_read,
                'logistics': {
                    'location': meeting_data.get('location', 'Board Room'),
                    'virtual_link': meeting_data.get('virtual_link', 'https://meet.company.com/board'),
                    'catering': meeting_data.get('catering', True)
                },
                'status': 'scheduled'
            }

            self.meetings.append(meeting)
            logger.info(f"Meeting {meeting['id']} scheduled successfully")

            return meeting

        except Exception as e:
            logger.error(f"Error scheduling meeting: {str(e)}")
            raise

    def _generate_meeting_agenda(self, topics: List[str]) -> List[Dict[str, Any]]:
        """Generate structured meeting agenda."""
        agenda = [
            {
                'item': 1,
                'topic': 'Call to Order & Welcome',
                'duration_minutes': 5,
                'presenter': 'Board Chair',
                'type': 'administrative'
            },
            {
                'item': 2,
                'topic': 'Approval of Previous Minutes',
                'duration_minutes': 5,
                'presenter': 'Board Secretary',
                'type': 'administrative'
            }
        ]

        # Add custom topics
        for i, topic in enumerate(topics, 3):
            agenda.append({
                'item': i,
                'topic': topic,
                'duration_minutes': 20,
                'presenter': 'CEO',
                'type': 'discussion'
            })

        # Add standard closing items
        agenda.append({
            'item': len(agenda) + 1,
            'topic': 'Executive Session (if needed)',
            'duration_minutes': 15,
            'presenter': 'Board Chair',
            'type': 'closed_session'
        })

        agenda.append({
            'item': len(agenda) + 1,
            'topic': 'Adjournment',
            'duration_minutes': 5,
            'presenter': 'Board Chair',
            'type': 'administrative'
        })

        return agenda

    def _identify_attendees(self, topics: List[str]) -> List[Dict[str, str]]:
        """Identify required meeting attendees."""
        # Standard attendees
        attendees = [
            {'name': 'Board Chair', 'role': 'Chair', 'required': True},
            {'name': 'CEO', 'role': 'Executive', 'required': True},
            {'name': 'CFO', 'role': 'Executive', 'required': True},
            {'name': 'Board Secretary', 'role': 'Secretary', 'required': True}
        ]

        # Add topic-specific attendees
        if any('strategic' in t.lower() for t in topics):
            attendees.append({'name': 'Chief Strategy Officer', 'role': 'Executive', 'required': False})

        if any('financial' in t.lower() or 'audit' in t.lower() for t in topics):
            attendees.append({'name': 'External Auditor', 'role': 'Advisor', 'required': False})

        return attendees

    def _prepare_pre_read_materials(self, topics: List[str]) -> List[Dict[str, str]]:
        """Prepare pre-read materials for meeting."""
        materials = [
            {
                'title': 'Board Package',
                'description': 'Comprehensive board report and financial statements',
                'pages': 25,
                'distribution_date': (datetime.now() + timedelta(days=7)).isoformat()
            }
        ]

        # Add topic-specific materials
        for topic in topics:
            materials.append({
                'title': f"Background: {topic}",
                'description': f"Supporting documentation for {topic}",
                'pages': 5,
                'distribution_date': (datetime.now() + timedelta(days=7)).isoformat()
            })

        return materials

    def _estimate_meeting_duration(self, agenda: List[Dict[str, Any]]) -> int:
        """Estimate total meeting duration."""
        return sum(item.get('duration_minutes', 0) for item in agenda)

    async def manage_stakeholders(self, stakeholder_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Manage stakeholder relationships and communication tracking.

        Args:
            stakeholder_data: Stakeholder information and interaction history

        Returns:
            Stakeholder management analysis and communication plan
        """
        try:
            logger.info("Managing stakeholder relationships")

            if not stakeholder_data:
                raise ValueError("Stakeholder data is required")

            # Analyze stakeholder engagement
            engagement_analysis = self._analyze_stakeholder_engagement(
                stakeholder_data.get('stakeholders', [])
            )

            # Create communication plan
            communication_plan = self._create_communication_plan(
                stakeholder_data.get('stakeholders', [])
            )

            # Track interactions
            interaction_summary = self._summarize_interactions(
                stakeholder_data.get('interactions', [])
            )

            # Identify stakeholder concerns
            concerns = self._identify_stakeholder_concerns(
                stakeholder_data.get('feedback', [])
            )

            # Generate engagement recommendations
            recommendations = self._generate_engagement_recommendations(
                engagement_analysis,
                concerns
            )

            result = {
                'timestamp': datetime.now().isoformat(),
                'total_stakeholders': len(stakeholder_data.get('stakeholders', [])),
                'engagement_analysis': engagement_analysis,
                'communication_plan': communication_plan,
                'interaction_summary': interaction_summary,
                'concerns': concerns,
                'recommendations': recommendations
            }

            # Store stakeholder data
            for stakeholder in stakeholder_data.get('stakeholders', []):
                self.stakeholders[stakeholder.get('name')] = stakeholder

            logger.info("Stakeholder management completed")

            return result

        except Exception as e:
            logger.error(f"Error managing stakeholders: {str(e)}")
            raise

    def _analyze_stakeholder_engagement(self, stakeholders: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze stakeholder engagement levels."""
        engagement_levels = defaultdict(int)

        for stakeholder in stakeholders:
            level = stakeholder.get('engagement_level', 'medium')
            engagement_levels[level] += 1

        return {
            'by_level': dict(engagement_levels),
            'high_engagement': engagement_levels['high'],
            'medium_engagement': engagement_levels['medium'],
            'low_engagement': engagement_levels['low'],
            'overall_engagement_score': self._calculate_engagement_score(engagement_levels)
        }

    def _calculate_engagement_score(self, levels: Dict[str, int]) -> float:
        """Calculate overall engagement score."""
        weights = {'high': 3, 'medium': 2, 'low': 1}

        total_score = sum(levels.get(level, 0) * weight for level, weight in weights.items())
        total_stakeholders = sum(levels.values())

        return round((total_score / (total_stakeholders * 3) * 100), 2) if total_stakeholders > 0 else 0

    def _create_communication_plan(self, stakeholders: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Create stakeholder communication plan."""
        plan = []

        for stakeholder in stakeholders:
            frequency = self._determine_communication_frequency(stakeholder)
            channels = self._determine_communication_channels(stakeholder)

            plan.append({
                'stakeholder': stakeholder.get('name'),
                'frequency': frequency,
                'channels': ', '.join(channels),
                'next_touchpoint': (datetime.now() + timedelta(days=30)).isoformat()
            })

        return plan

    def _determine_communication_frequency(self, stakeholder: Dict[str, Any]) -> str:
        """Determine appropriate communication frequency."""
        importance = stakeholder.get('importance', 'medium')

        if importance == 'high':
            return 'monthly'
        elif importance == 'medium':
            return 'quarterly'
        else:
            return 'annually'

    def _determine_communication_channels(self, stakeholder: Dict[str, Any]) -> List[str]:
        """Determine appropriate communication channels."""
        preferences = stakeholder.get('communication_preferences', [])

        if preferences:
            return preferences

        # Default channels
        return ['email', 'board_reports']

    def _summarize_interactions(self, interactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize stakeholder interactions."""
        if not interactions:
            return {'total': 0, 'by_type': {}, 'recent': []}

        by_type = defaultdict(int)
        for interaction in interactions:
            by_type[interaction.get('type', 'other')] += 1

        return {
            'total': len(interactions),
            'by_type': dict(by_type),
            'recent': interactions[-5:] if len(interactions) > 5 else interactions
        }

    def _identify_stakeholder_concerns(self, feedback: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Identify stakeholder concerns from feedback."""
        concerns = []

        for item in feedback:
            if item.get('sentiment') == 'negative' or item.get('requires_action'):
                concerns.append({
                    'concern': item.get('content'),
                    'stakeholder': item.get('stakeholder'),
                    'severity': item.get('severity', 'medium'),
                    'action_required': True
                })

        return concerns

    def _generate_engagement_recommendations(
        self,
        engagement: Dict[str, Any],
        concerns: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        """Generate stakeholder engagement recommendations."""
        recommendations = []

        if engagement.get('low_engagement', 0) > 0:
            recommendations.append({
                'area': 'Stakeholder Engagement',
                'recommendation': 'Increase outreach to low-engagement stakeholders',
                'priority': 'medium'
            })

        if len(concerns) > 3:
            recommendations.append({
                'area': 'Issue Resolution',
                'recommendation': 'Address stakeholder concerns through targeted action plan',
                'priority': 'high'
            })

        return recommendations

    async def prepare_materials(self, materials_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare board meeting materials and documentation.

        Args:
            materials_request: Request details for materials preparation

        Returns:
            Prepared materials with metadata
        """
        try:
            logger.info("Preparing board materials")

            material_type = materials_request.get('type', 'board_package')
            meeting_id = materials_request.get('meeting_id')

            # Generate materials based on type
            if material_type == 'board_package':
                materials = self._generate_board_package(materials_request)
            elif material_type == 'presentation':
                materials = self._generate_presentation(materials_request)
            elif material_type == 'financial_report':
                materials = self._generate_financial_report(materials_request)
            else:
                materials = {'content': 'Standard materials', 'pages': 10}

            result = {
                'id': f"MAT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'type': material_type,
                'meeting_id': meeting_id,
                'materials': materials,
                'prepared_at': datetime.now().isoformat(),
                'status': 'ready',
                'distribution_list': self._create_distribution_list(materials_request)
            }

            logger.info(f"Materials {result['id']} prepared successfully")

            return result

        except Exception as e:
            logger.error(f"Error preparing materials: {str(e)}")
            raise

    def _generate_board_package(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive board package."""
        return {
            'sections': [
                'Executive Summary',
                'Financial Performance',
                'Operational Metrics',
                'Strategic Updates',
                'Risk Management',
                'Appendices'
            ],
            'total_pages': 30,
            'format': 'PDF',
            'confidentiality': 'Board Confidential'
        }

    def _generate_presentation(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Generate board presentation."""
        return {
            'slides': 15,
            'format': 'PowerPoint',
            'sections': request.get('topics', ['Overview', 'Performance', 'Strategy', 'Q&A'])
        }

    def _generate_financial_report(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Generate financial report."""
        return {
            'statements': ['Income Statement', 'Balance Sheet', 'Cash Flow Statement'],
            'pages': 12,
            'format': 'Excel + PDF',
            'period': request.get('period', 'Q1 2024')
        }

    def _create_distribution_list(self, request: Dict[str, Any]) -> List[str]:
        """Create distribution list for materials."""
        return [
            'Board Members',
            'CEO',
            'CFO',
            'Board Secretary',
            'External Auditor (if applicable)'
        ]

    async def track_action_items(self, action_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Track board meeting action items with follow-up system.

        Args:
            action_data: New action items or update requests

        Returns:
            Action item tracking summary and status
        """
        try:
            logger.info("Tracking board action items")

            if action_data and action_data.get('new_items'):
                # Add new action items
                for item in action_data.get('new_items', []):
                    self.action_items.append({
                        'id': f"ACT-{len(self.action_items) + 1:05d}",
                        'action': item.get('action'),
                        'owner': item.get('owner'),
                        'due_date': item.get('due_date'),
                        'priority': item.get('priority', 'medium'),
                        'status': 'pending',
                        'created_at': datetime.now().isoformat()
                    })

            # Analyze action item status
            analysis = self._analyze_action_items()

            # Identify overdue items
            overdue = self._identify_overdue_items()

            # Generate follow-up plan
            follow_up = self._create_follow_up_plan(overdue)

            result = {
                'timestamp': datetime.now().isoformat(),
                'total_action_items': len(self.action_items),
                'analysis': analysis,
                'overdue_items': overdue,
                'follow_up_plan': follow_up,
                'status_summary': self._create_status_summary(analysis)
            }

            logger.info("Action item tracking completed")

            return result

        except Exception as e:
            logger.error(f"Error tracking action items: {str(e)}")
            raise

    def _analyze_action_items(self) -> Dict[str, Any]:
        """Analyze action items by status."""
        status_counts = defaultdict(int)

        for item in self.action_items:
            status_counts[item.get('status', 'pending')] += 1

        return {
            'by_status': dict(status_counts),
            'completion_rate': round(
                (status_counts['completed'] / len(self.action_items) * 100), 2
            ) if self.action_items else 0
        }

    def _identify_overdue_items(self) -> List[Dict[str, Any]]:
        """Identify overdue action items."""
        overdue = []
        now = datetime.now()

        for item in self.action_items:
            if item.get('status') != 'completed':
                due_date_str = item.get('due_date')
                if due_date_str:
                    try:
                        due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                        if due_date < now:
                            overdue.append({
                                'id': item.get('id'),
                                'action': item.get('action'),
                                'owner': item.get('owner'),
                                'days_overdue': (now - due_date).days
                            })
                    except:
                        pass

        return overdue

    def _create_follow_up_plan(self, overdue: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Create follow-up plan for overdue items."""
        plan = []

        for item in overdue[:5]:  # Top 5 overdue items
            plan.append({
                'item_id': item.get('id'),
                'action': f"Follow up on: {item.get('action')}",
                'contact': item.get('owner'),
                'method': 'email_and_call',
                'deadline': (datetime.now() + timedelta(days=3)).isoformat()
            })

        return plan

    def _create_status_summary(self, analysis: Dict[str, Any]) -> str:
        """Create status summary text."""
        completion_rate = analysis.get('completion_rate', 0)

        if completion_rate >= 80:
            return 'On track - majority of action items completed'
        elif completion_rate >= 60:
            return 'Moderate progress - some items need attention'
        else:
            return 'Attention required - many items pending or overdue'

    def get_status(self) -> Dict[str, Any]:
        """Get current agent status."""
        return {
            'agent': self.name,
            'reports_generated': len(self.reports),
            'meetings_scheduled': len(self.meetings),
            'stakeholders_managed': len(self.stakeholders),
            'pending_action_items': len([a for a in self.action_items if a.get('status') == 'pending']),
            'status': 'active',
            'last_updated': datetime.now().isoformat()
        }
