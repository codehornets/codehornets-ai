"""Performance Manager Agent - Monitors organizational performance."""

from typing import Dict, List, Any, Optional
import yaml
import logging
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PerformanceManagerAgent:
    """Agent responsible for performance monitoring and KPI management."""

    def __init__(self, config_path: Optional[str] = None):
        self.config = self._load_config(config_path)
        self.name = "Performance Manager Agent"
        self.role = "performance_manager"
        self.kpi_data = {}
        self.performance_reports = []
        self.goals = []
        self.reviews = []
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
            return {'agent_name': self.name, 'model': 'gpt-4', 'temperature': 0.2}
        except Exception as e:
            logger.error(f"Error loading config: {str(e)}")
            return {'agent_name': self.name, 'model': 'gpt-4', 'temperature': 0.2}

    async def track_kpis(self, kpi_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Track KPIs with actual metric calculations.

        Args:
            kpi_data: KPI definitions and current values

        Returns:
            Tracked KPIs with calculations, status, and alerts
        """
        try:
            logger.info("Tracking KPIs")

            if not kpi_data:
                raise ValueError("KPI data is required")

            kpis = kpi_data.get('kpis', [])

            # Calculate KPI metrics
            kpi_metrics = self._calculate_kpi_metrics(kpis)

            # Analyze KPI health
            health_analysis = self._analyze_kpi_health(kpi_metrics)

            # Identify trends
            trends = self._identify_kpi_trends(kpis, kpi_data.get('historical', {}))

            # Generate alerts
            alerts = self._generate_kpi_alerts(kpi_metrics, health_analysis)

            # Create dashboard summary
            dashboard = self._create_kpi_dashboard(kpi_metrics, health_analysis)

            result = {
                'timestamp': datetime.now().isoformat(),
                'period': kpi_data.get('period', 'current'),
                'total_kpis': len(kpis),
                'kpi_metrics': kpi_metrics,
                'health_analysis': health_analysis,
                'trends': trends,
                'alerts': alerts,
                'dashboard': dashboard,
                'recommendations': self._generate_kpi_recommendations(kpi_metrics, health_analysis)
            }

            # Store KPI data
            self.kpi_data[datetime.now().isoformat()] = result

            logger.info(f"KPI tracking completed: {health_analysis['overall_health']}% health score")

            return result

        except Exception as e:
            logger.error(f"Error tracking KPIs: {str(e)}")
            raise

    def _calculate_kpi_metrics(self, kpis: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Calculate metrics for each KPI."""
        kpi_metrics = {}

        for kpi in kpis:
            name = kpi.get('name', 'Unknown')
            actual = kpi.get('actual', 0)
            target = kpi.get('target', 0)
            unit = kpi.get('unit', 'number')

            # Calculate variance
            variance = self._calculate_variance(actual, target)

            # Determine status
            status = self._determine_kpi_status(variance, kpi.get('threshold', 10))

            # Calculate performance score
            performance_score = self._calculate_performance_score(actual, target, kpi.get('direction', 'higher_is_better'))

            kpi_metrics[name] = {
                'actual': actual,
                'target': target,
                'unit': unit,
                'variance': variance,
                'status': status,
                'performance_score': performance_score,
                'direction': kpi.get('direction', 'higher_is_better'),
                'category': kpi.get('category', 'general')
            }

        return kpi_metrics

    def _calculate_variance(self, actual: float, target: float) -> Dict[str, Any]:
        """Calculate variance between actual and target."""
        if target == 0:
            return {'absolute': 0, 'percentage': 0}

        absolute_variance = actual - target
        percentage_variance = (absolute_variance / target) * 100

        return {
            'absolute': round(absolute_variance, 2),
            'percentage': round(percentage_variance, 2)
        }

    def _determine_kpi_status(self, variance: Dict[str, Any], threshold: float) -> str:
        """Determine KPI status based on variance."""
        variance_pct = abs(variance.get('percentage', 0))

        if variance_pct <= threshold:
            return 'on_target'
        elif variance_pct <= threshold * 2:
            return 'needs_attention'
        else:
            return 'critical'

    def _calculate_performance_score(self, actual: float, target: float, direction: str) -> float:
        """Calculate performance score (0-100)."""
        if target == 0:
            return 50.0

        ratio = actual / target

        if direction == 'higher_is_better':
            score = min(ratio * 100, 150)  # Cap at 150%
        elif direction == 'lower_is_better':
            score = max((2 - ratio) * 100, 0) if ratio <= 2 else 0
        else:  # target_is_best
            score = max(100 - abs((ratio - 1) * 100), 0)

        return round(min(score, 100), 2)

    def _analyze_kpi_health(self, kpi_metrics: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze overall KPI health."""
        if not kpi_metrics:
            return {'overall_health': 0, 'by_status': {}, 'by_category': {}}

        # Count by status
        status_counts = defaultdict(int)
        for kpi in kpi_metrics.values():
            status_counts[kpi['status']] += 1

        # Calculate by category
        category_scores = defaultdict(list)
        for kpi in kpi_metrics.values():
            category_scores[kpi['category']].append(kpi['performance_score'])

        category_health = {}
        for category, scores in category_scores.items():
            category_health[category] = round(statistics.mean(scores), 2)

        # Calculate overall health
        all_scores = [kpi['performance_score'] for kpi in kpi_metrics.values()]
        overall_health = round(statistics.mean(all_scores), 2) if all_scores else 0

        return {
            'overall_health': overall_health,
            'by_status': dict(status_counts),
            'by_category': category_health,
            'health_grade': self._assign_health_grade(overall_health)
        }

    def _assign_health_grade(self, score: float) -> str:
        """Assign letter grade to health score."""
        if score >= 90:
            return 'A'
        elif score >= 80:
            return 'B'
        elif score >= 70:
            return 'C'
        elif score >= 60:
            return 'D'
        else:
            return 'F'

    def _identify_kpi_trends(self, kpis: List[Dict[str, Any]], historical: Dict[str, Any]) -> Dict[str, Any]:
        """Identify trends in KPI performance."""
        trends = {}

        for kpi in kpis:
            name = kpi.get('name')
            if name in historical:
                historical_values = historical[name]

                if len(historical_values) >= 3:
                    trend_direction = self._calculate_trend_direction(historical_values)
                    trend_strength = self._calculate_trend_strength(historical_values)

                    trends[name] = {
                        'direction': trend_direction,
                        'strength': trend_strength,
                        'recent_change': round(historical_values[-1] - historical_values[-2], 2) if len(historical_values) >= 2 else 0
                    }

        return trends

    def _calculate_trend_direction(self, values: List[float]) -> str:
        """Calculate trend direction from historical values."""
        if len(values) < 2:
            return 'stable'

        recent_avg = statistics.mean(values[-3:])
        older_avg = statistics.mean(values[:-3]) if len(values) > 3 else values[0]

        if recent_avg > older_avg * 1.05:
            return 'improving'
        elif recent_avg < older_avg * 0.95:
            return 'declining'
        else:
            return 'stable'

    def _calculate_trend_strength(self, values: List[float]) -> str:
        """Calculate strength of trend."""
        if len(values) < 2:
            return 'weak'

        # Calculate coefficient of variation
        mean = statistics.mean(values)
        if mean == 0:
            return 'weak'

        std_dev = statistics.stdev(values)
        cv = std_dev / mean

        if cv < 0.1:
            return 'strong'
        elif cv < 0.3:
            return 'moderate'
        else:
            return 'weak'

    def _generate_kpi_alerts(self, kpi_metrics: Dict[str, Dict[str, Any]], health: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate alerts for KPI issues."""
        alerts = []

        for name, metrics in kpi_metrics.items():
            if metrics['status'] == 'critical':
                alerts.append({
                    'severity': 'high',
                    'kpi': name,
                    'message': f"{name} is significantly off target ({metrics['variance']['percentage']}% variance)",
                    'action': 'Immediate review required'
                })
            elif metrics['status'] == 'needs_attention':
                alerts.append({
                    'severity': 'medium',
                    'kpi': name,
                    'message': f"{name} requires attention ({metrics['variance']['percentage']}% variance)",
                    'action': 'Schedule review'
                })

        # Overall health alert
        if health['overall_health'] < 70:
            alerts.append({
                'severity': 'high',
                'kpi': 'Overall Performance',
                'message': f"Overall KPI health is below acceptable threshold ({health['overall_health']}%)",
                'action': 'Comprehensive performance review needed'
            })

        return alerts

    def _create_kpi_dashboard(self, kpi_metrics: Dict[str, Dict[str, Any]], health: Dict[str, Any]) -> Dict[str, Any]:
        """Create KPI dashboard summary."""
        return {
            'summary': {
                'total_kpis': len(kpi_metrics),
                'on_target': health['by_status'].get('on_target', 0),
                'needs_attention': health['by_status'].get('needs_attention', 0),
                'critical': health['by_status'].get('critical', 0)
            },
            'top_performers': self._identify_top_kpis(kpi_metrics, 'best'),
            'bottom_performers': self._identify_top_kpis(kpi_metrics, 'worst'),
            'category_breakdown': health['by_category']
        }

    def _identify_top_kpis(self, kpi_metrics: Dict[str, Dict[str, Any]], mode: str) -> List[Dict[str, Any]]:
        """Identify top or bottom performing KPIs."""
        sorted_kpis = sorted(
            kpi_metrics.items(),
            key=lambda x: x[1]['performance_score'],
            reverse=(mode == 'best')
        )

        return [
            {
                'name': name,
                'score': metrics['performance_score'],
                'status': metrics['status']
            }
            for name, metrics in sorted_kpis[:3]
        ]

    def _generate_kpi_recommendations(self, kpi_metrics: Dict[str, Dict[str, Any]], health: Dict[str, Any]) -> List[Dict[str, str]]:
        """Generate recommendations for KPI improvement."""
        recommendations = []

        critical_kpis = [name for name, metrics in kpi_metrics.items() if metrics['status'] == 'critical']

        if critical_kpis:
            recommendations.append({
                'area': 'Critical KPIs',
                'recommendation': f"Prioritize improvement of: {', '.join(critical_kpis[:2])}",
                'priority': 'high'
            })

        if health['overall_health'] < 80:
            recommendations.append({
                'area': 'Overall Performance',
                'recommendation': 'Implement comprehensive performance improvement plan',
                'priority': 'high'
            })

        return recommendations

    async def generate_performance_report(self, period: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate comprehensive performance report with trend analysis.

        Args:
            period: Reporting period
            data: Performance data including KPIs, metrics, and historical data

        Returns:
            Detailed performance report with analysis and insights
        """
        try:
            logger.info(f"Generating performance report for {period}")

            if not period:
                raise ValueError("Reporting period is required")

            if data is None:
                data = {}

            # Executive summary
            executive_summary = self._create_executive_summary(data, period)

            # KPI performance
            kpi_performance = self._analyze_kpi_performance(data.get('kpis', []))

            # Trend analysis
            trend_analysis = self._perform_trend_analysis(
                data.get('current', {}),
                data.get('historical', {})
            )

            # Department performance
            department_analysis = self._analyze_department_performance(
                data.get('departments', [])
            )

            # Comparative analysis
            comparative_analysis = self._perform_comparative_analysis(
                data.get('current', {}),
                data.get('previous_period', {}),
                data.get('year_ago', {})
            )

            # Insights and findings
            insights = self._generate_insights(
                kpi_performance,
                trend_analysis,
                comparative_analysis
            )

            # Action items
            action_items = self._identify_action_items(insights)

            report = {
                'id': f"PERF-RPT-{len(self.performance_reports) + 1:05d}",
                'period': period,
                'generated_at': datetime.now().isoformat(),
                'executive_summary': executive_summary,
                'kpi_performance': kpi_performance,
                'trend_analysis': trend_analysis,
                'department_analysis': department_analysis,
                'comparative_analysis': comparative_analysis,
                'insights': insights,
                'action_items': action_items,
                'recommendations': self._generate_report_recommendations(insights)
            }

            self.performance_reports.append(report)
            logger.info(f"Performance report {report['id']} generated successfully")

            return report

        except Exception as e:
            logger.error(f"Error generating performance report: {str(e)}")
            raise

    def _create_executive_summary(self, data: Dict[str, Any], period: str) -> Dict[str, Any]:
        """Create executive summary for performance report."""
        current = data.get('current', {})
        previous = data.get('previous_period', {})

        revenue = current.get('revenue', 0)
        prev_revenue = previous.get('revenue', revenue)
        revenue_growth = ((revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0

        return {
            'period': period,
            'overall_performance': 'strong' if revenue_growth > 10 else 'moderate',
            'key_metrics': {
                'revenue_growth': round(revenue_growth, 2),
                'customer_count': current.get('customers', 0),
                'employee_count': current.get('employees', 0)
            },
            'highlights': self._extract_highlights(data),
            'challenges': self._extract_challenges(data)
        }

    def _extract_highlights(self, data: Dict[str, Any]) -> List[str]:
        """Extract performance highlights."""
        highlights = []

        current = data.get('current', {})

        if current.get('revenue_growth', 0) > 15:
            highlights.append("Exceptional revenue growth")

        if current.get('customer_satisfaction', 0) > 90:
            highlights.append("Outstanding customer satisfaction")

        if current.get('employee_engagement', 0) > 85:
            highlights.append("High employee engagement")

        return highlights

    def _extract_challenges(self, data: Dict[str, Any]) -> List[str]:
        """Extract performance challenges."""
        challenges = []

        current = data.get('current', {})

        if current.get('churn_rate', 0) > 10:
            challenges.append("Customer churn above acceptable levels")

        if current.get('cost_overrun', 0) > 5:
            challenges.append("Budget overruns in multiple departments")

        return challenges

    def _analyze_kpi_performance(self, kpis: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze KPI performance for report."""
        if not kpis:
            return {'status': 'no_data'}

        on_target = sum(1 for kpi in kpis if kpi.get('status') == 'on_target')
        total = len(kpis)

        return {
            'total_kpis': total,
            'on_target_count': on_target,
            'on_target_percentage': round((on_target / total * 100), 2),
            'detailed_performance': [
                {
                    'name': kpi.get('name'),
                    'actual': kpi.get('actual'),
                    'target': kpi.get('target'),
                    'status': kpi.get('status')
                }
                for kpi in kpis
            ]
        }

    def _perform_trend_analysis(self, current: Dict[str, Any], historical: Dict[str, List[float]]) -> Dict[str, Any]:
        """Perform trend analysis on metrics."""
        trends = {}

        for metric_name, values in historical.items():
            if len(values) >= 3:
                # Calculate moving average
                moving_avg = statistics.mean(values[-3:])

                # Predict next value (simple linear trend)
                next_prediction = self._predict_next_value(values)

                trends[metric_name] = {
                    'current': current.get(metric_name, 0),
                    'moving_average': round(moving_avg, 2),
                    'prediction': round(next_prediction, 2),
                    'trend': self._calculate_trend_direction(values)
                }

        return trends

    def _predict_next_value(self, values: List[float]) -> float:
        """Simple linear prediction of next value."""
        if len(values) < 2:
            return values[0] if values else 0

        # Simple linear regression
        n = len(values)
        x_values = list(range(n))

        x_mean = statistics.mean(x_values)
        y_mean = statistics.mean(values)

        numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, values))
        denominator = sum((x - x_mean) ** 2 for x in x_values)

        if denominator == 0:
            return values[-1]

        slope = numerator / denominator
        intercept = y_mean - slope * x_mean

        # Predict next value
        next_x = n
        return slope * next_x + intercept

    def _analyze_department_performance(self, departments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze performance by department."""
        analysis = []

        for dept in departments:
            dept_metrics = dept.get('metrics', {})

            performance_score = self._calculate_department_score(dept_metrics)

            analysis.append({
                'department': dept.get('name', 'Unknown'),
                'performance_score': performance_score,
                'key_metrics': dept_metrics,
                'status': 'exceeding' if performance_score > 85 else 'meeting' if performance_score > 70 else 'below',
                'trend': dept.get('trend', 'stable')
            })

        # Sort by performance
        analysis.sort(key=lambda x: x['performance_score'], reverse=True)

        return analysis

    def _calculate_department_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate overall department performance score."""
        if not metrics:
            return 0.0

        # Weight different metrics
        weights = {
            'productivity': 0.3,
            'quality': 0.25,
            'efficiency': 0.25,
            'satisfaction': 0.2
        }

        score = 0
        for metric, weight in weights.items():
            score += metrics.get(metric, 0) * weight

        return round(score, 2)

    def _perform_comparative_analysis(
        self,
        current: Dict[str, Any],
        previous: Dict[str, Any],
        year_ago: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Perform comparative analysis across periods."""
        comparisons = {}

        for metric in current.keys():
            current_val = current.get(metric, 0)
            prev_val = previous.get(metric, 0)
            yoy_val = year_ago.get(metric, 0)

            comparisons[metric] = {
                'current': current_val,
                'vs_previous_period': self._calculate_change(current_val, prev_val),
                'vs_year_ago': self._calculate_change(current_val, yoy_val)
            }

        return comparisons

    def _calculate_change(self, current: float, previous: float) -> Dict[str, Any]:
        """Calculate change between two values."""
        if previous == 0:
            return {'absolute': 0, 'percentage': 0, 'direction': 'stable'}

        absolute_change = current - previous
        percentage_change = (absolute_change / previous) * 100

        direction = 'increase' if absolute_change > 0 else 'decrease' if absolute_change < 0 else 'stable'

        return {
            'absolute': round(absolute_change, 2),
            'percentage': round(percentage_change, 2),
            'direction': direction
        }

    def _generate_insights(
        self,
        kpi_performance: Dict[str, Any],
        trends: Dict[str, Any],
        comparative: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Generate insights from performance data."""
        insights = []

        # KPI insights
        if kpi_performance.get('on_target_percentage', 0) < 70:
            insights.append({
                'category': 'KPI Performance',
                'insight': 'Less than 70% of KPIs are on target, indicating systemic performance issues',
                'severity': 'high'
            })

        # Trend insights
        declining_trends = [name for name, trend in trends.items() if trend.get('trend') == 'declining']
        if len(declining_trends) > 2:
            insights.append({
                'category': 'Trends',
                'insight': f"Multiple metrics showing declining trends: {', '.join(declining_trends[:2])}",
                'severity': 'medium'
            })

        # Comparative insights
        for metric, comparison in comparative.items():
            yoy_change = comparison.get('vs_year_ago', {}).get('percentage', 0)
            if abs(yoy_change) > 20:
                insights.append({
                    'category': 'Year-over-Year',
                    'insight': f"{metric} has changed by {yoy_change}% compared to last year",
                    'severity': 'medium'
                })

        return insights

    def _identify_action_items(self, insights: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Identify action items from insights."""
        actions = []

        high_severity = [i for i in insights if i.get('severity') == 'high']

        for insight in high_severity[:3]:
            actions.append({
                'action': f"Address: {insight.get('insight')}",
                'priority': 'high',
                'owner': 'Department Head',
                'due_date': (datetime.now() + timedelta(days=14)).isoformat()
            })

        return actions

    def _generate_report_recommendations(self, insights: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Generate recommendations for performance report."""
        recommendations = []

        if any(i.get('severity') == 'high' for i in insights):
            recommendations.append({
                'area': 'Immediate Action',
                'recommendation': 'Address high-severity performance issues within 2 weeks',
                'priority': 'high'
            })

        if any('declining' in i.get('insight', '').lower() for i in insights):
            recommendations.append({
                'area': 'Trend Reversal',
                'recommendation': 'Implement initiatives to reverse declining metrics',
                'priority': 'medium'
            })

        return recommendations

    async def set_goals(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Set organizational goals using SMART framework.

        Args:
            goal_data: Goal definitions and parameters

        Returns:
            Structured goals with SMART criteria validation
        """
        try:
            logger.info("Setting organizational goals")

            if not goal_data:
                raise ValueError("Goal data is required")

            goals = goal_data.get('goals', [])

            # Validate SMART criteria
            validated_goals = self._validate_smart_goals(goals)

            # Create goal hierarchy
            goal_hierarchy = self._create_goal_hierarchy(validated_goals)

            # Define metrics
            goal_metrics = self._define_goal_metrics(validated_goals)

            # Create tracking plan
            tracking_plan = self._create_goal_tracking_plan(validated_goals)

            result = {
                'id': f"GOAL-SET-{len(self.goals) + 1:05d}",
                'created_at': datetime.now().isoformat(),
                'period': goal_data.get('period', 'Annual'),
                'total_goals': len(validated_goals),
                'goals': validated_goals,
                'goal_hierarchy': goal_hierarchy,
                'metrics': goal_metrics,
                'tracking_plan': tracking_plan,
                'status': 'active'
            }

            self.goals.append(result)
            logger.info(f"Goals {result['id']} set successfully")

            return result

        except Exception as e:
            logger.error(f"Error setting goals: {str(e)}")
            raise

    def _validate_smart_goals(self, goals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate goals against SMART criteria."""
        validated = []

        for goal in goals:
            smart_check = {
                'specific': bool(goal.get('description') and len(goal.get('description', '')) > 20),
                'measurable': bool(goal.get('metric') and goal.get('target')),
                'achievable': bool(goal.get('target', 0) <= goal.get('stretch_target', float('inf'))),
                'relevant': bool(goal.get('category') and goal.get('strategic_alignment')),
                'time_bound': bool(goal.get('deadline'))
            }

            smart_score = sum(smart_check.values()) / len(smart_check) * 100

            validated.append({
                **goal,
                'smart_check': smart_check,
                'smart_score': round(smart_score, 2),
                'smart_validated': smart_score >= 80
            })

        return validated

    def _create_goal_hierarchy(self, goals: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Create hierarchical structure of goals."""
        hierarchy = defaultdict(list)

        for goal in goals:
            category = goal.get('category', 'general')
            hierarchy[category].append(goal.get('description', 'Unknown goal'))

        return dict(hierarchy)

    def _define_goal_metrics(self, goals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Define metrics for tracking goals."""
        metrics = []

        for goal in goals:
            metrics.append({
                'goal': goal.get('description'),
                'metric': goal.get('metric'),
                'baseline': goal.get('baseline', 0),
                'target': goal.get('target'),
                'measurement_frequency': goal.get('frequency', 'monthly'),
                'data_source': goal.get('data_source', 'internal_systems')
            })

        return metrics

    def _create_goal_tracking_plan(self, goals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create plan for tracking goal progress."""
        return {
            'review_frequency': 'monthly',
            'review_meetings': [
                (datetime.now() + timedelta(days=30 * i)).isoformat()
                for i in range(1, 13)
            ],
            'reporting_format': 'dashboard_and_detailed_report',
            'accountability': 'Department heads responsible for their goals'
        }

    async def conduct_reviews(self, review_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Conduct performance reviews with scoring system.

        Args:
            review_data: Review subjects and evaluation criteria

        Returns:
            Review results with scores and feedback
        """
        try:
            logger.info("Conducting performance reviews")

            if not review_data:
                raise ValueError("Review data is required")

            reviews = review_data.get('reviews', [])

            # Conduct evaluations
            evaluations = self._conduct_evaluations(reviews)

            # Calculate scores
            scores = self._calculate_review_scores(evaluations)

            # Generate ratings
            ratings = self._generate_ratings(scores)

            # Identify development needs
            development_needs = self._identify_development_needs(evaluations)

            # Create action plans
            action_plans = self._create_review_action_plans(development_needs)

            result = {
                'id': f"REV-{len(self.reviews) + 1:05d}",
                'conducted_at': datetime.now().isoformat(),
                'review_period': review_data.get('period', 'Annual'),
                'total_reviews': len(reviews),
                'evaluations': evaluations,
                'scores': scores,
                'ratings': ratings,
                'development_needs': development_needs,
                'action_plans': action_plans,
                'summary': self._create_review_summary(scores)
            }

            self.reviews.append(result)
            logger.info(f"Performance review {result['id']} completed")

            return result

        except Exception as e:
            logger.error(f"Error conducting reviews: {str(e)}")
            raise

    def _conduct_evaluations(self, reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Conduct evaluations for each review."""
        evaluations = []

        for review in reviews:
            subject = review.get('subject', 'Unknown')
            criteria = review.get('criteria', {})

            evaluation = {
                'subject': subject,
                'role': review.get('role', 'Employee'),
                'criteria_scores': self._score_criteria(criteria),
                'strengths': review.get('strengths', []),
                'areas_for_improvement': review.get('improvements', []),
                'goals_achievement': review.get('goals_met', 0)
            }

            evaluations.append(evaluation)

        return evaluations

    def _score_criteria(self, criteria: Dict[str, Any]) -> Dict[str, float]:
        """Score individual criteria."""
        scores = {}

        for criterion, rating in criteria.items():
            # Convert rating to score (assuming 1-5 scale)
            score = (rating / 5) * 100 if rating else 0
            scores[criterion] = round(score, 2)

        return scores

    def _calculate_review_scores(self, evaluations: List[Dict[str, Any]]) -> Dict[str, Dict[str, float]]:
        """Calculate overall scores for reviews."""
        scores = {}

        for eval in evaluations:
            criteria_scores = eval.get('criteria_scores', {})

            if criteria_scores:
                overall_score = statistics.mean(criteria_scores.values())
            else:
                overall_score = 0

            scores[eval.get('subject')] = {
                'overall_score': round(overall_score, 2),
                'criteria_breakdown': criteria_scores,
                'goals_achievement_score': eval.get('goals_achievement', 0)
            }

        return scores

    def _generate_ratings(self, scores: Dict[str, Dict[str, float]]) -> Dict[str, str]:
        """Generate performance ratings."""
        ratings = {}

        for subject, score_data in scores.items():
            overall = score_data.get('overall_score', 0)

            if overall >= 90:
                rating = 'Outstanding'
            elif overall >= 80:
                rating = 'Exceeds Expectations'
            elif overall >= 70:
                rating = 'Meets Expectations'
            elif overall >= 60:
                rating = 'Needs Improvement'
            else:
                rating = 'Unsatisfactory'

            ratings[subject] = rating

        return ratings

    def _identify_development_needs(self, evaluations: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Identify development needs from evaluations."""
        needs = []

        for eval in evaluations:
            improvements = eval.get('areas_for_improvement', [])

            for improvement in improvements:
                needs.append({
                    'subject': eval.get('subject'),
                    'area': improvement,
                    'priority': 'high',
                    'development_type': 'training'
                })

        return needs

    def _create_review_action_plans(self, needs: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Create action plans from development needs."""
        plans = []

        for need in needs[:5]:  # Top 5 needs
            plans.append({
                'subject': need.get('subject'),
                'action': f"Develop skills in {need.get('area')}",
                'method': 'Training program',
                'timeline': '3 months',
                'success_criteria': 'Demonstrated improvement in area'
            })

        return plans

    def _create_review_summary(self, scores: Dict[str, Dict[str, float]]) -> Dict[str, Any]:
        """Create summary of review results."""
        all_scores = [data.get('overall_score', 0) for data in scores.values()]

        if not all_scores:
            return {'average_score': 0, 'distribution': {}}

        return {
            'total_reviewed': len(scores),
            'average_score': round(statistics.mean(all_scores), 2),
            'highest_score': max(all_scores),
            'lowest_score': min(all_scores),
            'distribution': self._calculate_score_distribution(all_scores)
        }

    def _calculate_score_distribution(self, scores: List[float]) -> Dict[str, int]:
        """Calculate distribution of scores."""
        distribution = {
            '90-100': 0,
            '80-89': 0,
            '70-79': 0,
            '60-69': 0,
            'Below 60': 0
        }

        for score in scores:
            if score >= 90:
                distribution['90-100'] += 1
            elif score >= 80:
                distribution['80-89'] += 1
            elif score >= 70:
                distribution['70-79'] += 1
            elif score >= 60:
                distribution['60-69'] += 1
            else:
                distribution['Below 60'] += 1

        return distribution

    async def identify_improvements(self, performance_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Identify performance improvement opportunities with gap analysis.

        Args:
            performance_data: Current performance data and targets

        Returns:
            Gap analysis with improvement opportunities and priorities
        """
        try:
            logger.info("Identifying performance improvements")

            if not performance_data:
                raise ValueError("Performance data is required")

            # Perform gap analysis
            gap_analysis = self._perform_gap_analysis(
                performance_data.get('current', {}),
                performance_data.get('targets', {})
            )

            # Prioritize gaps
            prioritized_gaps = self._prioritize_gaps(gap_analysis)

            # Generate improvement initiatives
            initiatives = self._generate_improvement_initiatives(prioritized_gaps)

            # Estimate impact
            impact_assessment = self._assess_improvement_impact(initiatives)

            # Create implementation roadmap
            roadmap = self._create_improvement_roadmap(initiatives)

            result = {
                'timestamp': datetime.now().isoformat(),
                'gap_analysis': gap_analysis,
                'prioritized_gaps': prioritized_gaps,
                'improvement_initiatives': initiatives,
                'impact_assessment': impact_assessment,
                'implementation_roadmap': roadmap,
                'expected_outcomes': self._define_expected_outcomes(initiatives)
            }

            logger.info("Performance improvement identification completed")

            return result

        except Exception as e:
            logger.error(f"Error identifying improvements: {str(e)}")
            raise

    def _perform_gap_analysis(self, current: Dict[str, Any], targets: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Perform gap analysis between current and target performance."""
        gaps = []

        for metric, target in targets.items():
            actual = current.get(metric, 0)

            gap_size = target - actual
            gap_percentage = (gap_size / target * 100) if target > 0 else 0

            if abs(gap_percentage) > 5:  # Only report significant gaps
                gaps.append({
                    'metric': metric,
                    'current': actual,
                    'target': target,
                    'gap': gap_size,
                    'gap_percentage': round(gap_percentage, 2),
                    'severity': 'high' if abs(gap_percentage) > 20 else 'medium'
                })

        return gaps

    def _prioritize_gaps(self, gaps: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prioritize gaps by severity and impact."""
        return sorted(
            gaps,
            key=lambda x: (
                0 if x.get('severity') == 'high' else 1,
                -abs(x.get('gap_percentage', 0))
            )
        )

    def _generate_improvement_initiatives(self, gaps: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Generate initiatives to close gaps."""
        initiatives = []

        for gap in gaps[:5]:  # Top 5 gaps
            initiatives.append({
                'initiative': f"Improve {gap.get('metric')}",
                'target_metric': gap.get('metric'),
                'current_value': gap.get('current'),
                'target_value': gap.get('target'),
                'approach': 'Process optimization and capability building',
                'timeline': '6 months',
                'resources_required': 'Medium'
            })

        return initiatives

    def _assess_improvement_impact(self, initiatives: List[Dict[str, str]]) -> Dict[str, Any]:
        """Assess potential impact of improvements."""
        return {
            'total_initiatives': len(initiatives),
            'estimated_timeline': '6-12 months',
            'resource_investment': 'Medium-High',
            'expected_improvement': '15-25% across targeted metrics',
            'risk_level': 'Low-Medium'
        }

    def _create_improvement_roadmap(self, initiatives: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Create implementation roadmap for improvements."""
        roadmap = []

        for i, initiative in enumerate(initiatives, 1):
            roadmap.append({
                'phase': i,
                'initiative': initiative.get('initiative'),
                'start_date': (datetime.now() + timedelta(days=30 * (i - 1))).isoformat(),
                'end_date': (datetime.now() + timedelta(days=30 * i + 150)).isoformat(),
                'milestones': [
                    'Planning complete',
                    'Implementation 50%',
                    'Implementation complete',
                    'Results validated'
                ]
            })

        return roadmap

    def _define_expected_outcomes(self, initiatives: List[Dict[str, str]]) -> List[str]:
        """Define expected outcomes from improvements."""
        return [
            'Achievement of performance targets',
            'Improved operational efficiency',
            'Enhanced customer satisfaction',
            'Stronger competitive position',
            'Better resource utilization'
        ]

    def get_status(self) -> Dict[str, Any]:
        """Get current agent status."""
        return {
            'agent': self.name,
            'kpis_tracked': len(self.kpi_data),
            'reports_generated': len(self.performance_reports),
            'active_goals': len(self.goals),
            'reviews_conducted': len(self.reviews),
            'status': 'active',
            'last_updated': datetime.now().isoformat()
        }
