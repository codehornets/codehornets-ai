"""
Operations Director Agent

Oversees operational efficiency, resource allocation, and cross-functional coordination.
"""

from typing import Dict, List, Any, Optional, Tuple
import yaml
import logging
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OperationsDirectorAgent:
    """Agent responsible for operational excellence and efficiency."""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the Operations Director Agent."""
        self.config = self._load_config(config_path)
        self.name = "Operations Director Agent"
        self.role = "operations_director"
        self.resource_allocations = []
        self.optimization_history = []
        self.performance_metrics = {}
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
            return {'agent_name': self.name, 'model': 'gpt-4', 'temperature': 0.3}
        except Exception as e:
            logger.error(f"Error loading config: {str(e)}")
            return {'agent_name': self.name, 'model': 'gpt-4', 'temperature': 0.3}

    async def optimize_operations(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize operational processes with efficiency calculations.

        Args:
            context: Operational context with processes, metrics, and constraints

        Returns:
            Optimization results with efficiency gains and recommendations
        """
        try:
            logger.info("Optimizing operational processes")

            if not context:
                raise ValueError("Context cannot be empty")

            # Analyze current processes
            current_state = self._analyze_current_state(context.get('processes', []))

            # Calculate efficiency metrics
            efficiency_metrics = self._calculate_efficiency_metrics(
                context.get('processes', []),
                context.get('metrics', {})
            )

            # Identify optimization opportunities
            opportunities = self._identify_optimization_opportunities(
                current_state,
                efficiency_metrics
            )

            # Generate workflow improvements
            workflow_improvements = self._generate_workflow_improvements(opportunities)

            # Calculate projected gains
            projected_gains = self._calculate_projected_gains(
                current_state,
                workflow_improvements
            )

            # Create implementation plan
            implementation_plan = self._create_optimization_plan(workflow_improvements)

            optimization = {
                'id': f"OPT-{len(self.optimization_history) + 1:05d}",
                'timestamp': datetime.now().isoformat(),
                'current_state': current_state,
                'efficiency_metrics': efficiency_metrics,
                'opportunities': opportunities,
                'workflow_improvements': workflow_improvements,
                'projected_gains': projected_gains,
                'implementation_plan': implementation_plan,
                'roi_analysis': self._calculate_optimization_roi(
                    projected_gains,
                    context.get('budget', 0)
                ),
                'status': 'planned'
            }

            self.optimization_history.append(optimization)
            logger.info(f"Optimization {optimization['id']} completed: "
                       f"{projected_gains['efficiency_gain']}% efficiency gain projected")

            return optimization

        except Exception as e:
            logger.error(f"Error optimizing operations: {str(e)}")
            raise

    def _analyze_current_state(self, processes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze current operational state."""
        try:
            total_time = sum(p.get('duration', 0) for p in processes)
            total_cost = sum(p.get('cost', 0) for p in processes)

            utilization_rates = [p.get('utilization', 0) for p in processes if 'utilization' in p]
            avg_utilization = statistics.mean(utilization_rates) if utilization_rates else 0

            return {
                'total_processes': len(processes),
                'total_cycle_time': total_time,
                'total_cost': total_cost,
                'average_utilization': round(avg_utilization, 2),
                'process_breakdown': self._categorize_processes(processes)
            }

        except Exception as e:
            logger.error(f"Error analyzing current state: {str(e)}")
            return {}

    def _categorize_processes(self, processes: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Categorize processes by type and efficiency."""
        categories = {
            'high_efficiency': [],
            'medium_efficiency': [],
            'low_efficiency': []
        }

        for process in processes:
            name = process.get('name', 'Unknown')
            efficiency = process.get('efficiency', 50)

            if efficiency >= 80:
                categories['high_efficiency'].append(name)
            elif efficiency >= 60:
                categories['medium_efficiency'].append(name)
            else:
                categories['low_efficiency'].append(name)

        return categories

    def _calculate_efficiency_metrics(
        self,
        processes: List[Dict[str, Any]],
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate operational efficiency metrics."""
        try:
            # Overall Equipment Effectiveness (OEE)
            oee = self._calculate_oee(metrics)

            # Cycle time efficiency
            cycle_time_efficiency = self._calculate_cycle_time_efficiency(processes)

            # Resource utilization
            resource_utilization = self._calculate_resource_utilization(processes)

            # Throughput
            throughput = metrics.get('units_produced', 0) / max(metrics.get('time_period', 1), 1)

            return {
                'oee': oee,
                'cycle_time_efficiency': cycle_time_efficiency,
                'resource_utilization': resource_utilization,
                'throughput': round(throughput, 2),
                'first_pass_yield': metrics.get('first_pass_yield', 95),
                'defect_rate': metrics.get('defect_rate', 2)
            }

        except Exception as e:
            logger.error(f"Error calculating efficiency metrics: {str(e)}")
            return {}

    def _calculate_oee(self, metrics: Dict[str, Any]) -> float:
        """Calculate Overall Equipment Effectiveness."""
        availability = metrics.get('availability', 90) / 100
        performance = metrics.get('performance', 85) / 100
        quality = metrics.get('quality', 95) / 100

        oee = availability * performance * quality * 100

        return round(oee, 2)

    def _calculate_cycle_time_efficiency(self, processes: List[Dict[str, Any]]) -> float:
        """Calculate cycle time efficiency."""
        if not processes:
            return 0.0

        total_value_added = sum(p.get('value_added_time', 0) for p in processes)
        total_cycle_time = sum(p.get('duration', 1) for p in processes)

        if total_cycle_time == 0:
            return 0.0

        efficiency = (total_value_added / total_cycle_time) * 100

        return round(efficiency, 2)

    def _calculate_resource_utilization(self, processes: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate resource utilization by type."""
        resource_usage = defaultdict(list)

        for process in processes:
            resources = process.get('resources', {})
            for resource_type, utilization in resources.items():
                resource_usage[resource_type].append(utilization)

        utilization = {}
        for resource_type, values in resource_usage.items():
            utilization[resource_type] = round(statistics.mean(values), 2) if values else 0

        return utilization

    def _identify_optimization_opportunities(
        self,
        current_state: Dict[str, Any],
        efficiency_metrics: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Identify optimization opportunities."""
        opportunities = []

        # Low utilization opportunity
        if current_state.get('average_utilization', 0) < 70:
            opportunities.append({
                'type': 'utilization_improvement',
                'current_value': current_state.get('average_utilization', 0),
                'target_value': 85,
                'potential_gain': 15,
                'priority': 'high'
            })

        # Cycle time reduction
        if efficiency_metrics.get('cycle_time_efficiency', 0) < 70:
            opportunities.append({
                'type': 'cycle_time_reduction',
                'current_value': efficiency_metrics.get('cycle_time_efficiency', 0),
                'target_value': 80,
                'potential_gain': 10,
                'priority': 'high'
            })

        # Quality improvement
        defect_rate = efficiency_metrics.get('defect_rate', 0)
        if defect_rate > 3:
            opportunities.append({
                'type': 'quality_improvement',
                'current_value': defect_rate,
                'target_value': 2,
                'potential_gain': 5,
                'priority': 'medium'
            })

        # OEE improvement
        oee = efficiency_metrics.get('oee', 0)
        if oee < 85:
            opportunities.append({
                'type': 'oee_improvement',
                'current_value': oee,
                'target_value': 85,
                'potential_gain': 85 - oee,
                'priority': 'high'
            })

        return opportunities

    def _generate_workflow_improvements(
        self,
        opportunities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate workflow improvement recommendations."""
        improvements = []

        for opp in opportunities:
            opp_type = opp.get('type')

            if opp_type == 'utilization_improvement':
                improvements.append({
                    'improvement': 'Implement resource pooling and load balancing',
                    'expected_impact': f"{opp.get('potential_gain', 0)}% utilization increase",
                    'implementation_effort': 'medium',
                    'timeframe': '4-6 weeks'
                })

            elif opp_type == 'cycle_time_reduction':
                improvements.append({
                    'improvement': 'Eliminate non-value-added activities and streamline handoffs',
                    'expected_impact': f"{opp.get('potential_gain', 0)}% cycle time reduction",
                    'implementation_effort': 'high',
                    'timeframe': '8-12 weeks'
                })

            elif opp_type == 'quality_improvement':
                improvements.append({
                    'improvement': 'Implement automated quality checks and error-proofing',
                    'expected_impact': f"{opp.get('potential_gain', 0)}% defect reduction",
                    'implementation_effort': 'medium',
                    'timeframe': '6-8 weeks'
                })

            elif opp_type == 'oee_improvement':
                improvements.append({
                    'improvement': 'Optimize maintenance schedules and reduce changeover time',
                    'expected_impact': f"{opp.get('potential_gain', 0)}% OEE improvement",
                    'implementation_effort': 'high',
                    'timeframe': '12-16 weeks'
                })

        return improvements

    def _calculate_projected_gains(
        self,
        current_state: Dict[str, Any],
        improvements: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate projected gains from improvements."""
        total_time_savings = 0
        total_cost_savings = 0

        current_cycle_time = current_state.get('total_cycle_time', 0)
        current_cost = current_state.get('total_cost', 0)

        # Estimate savings (simplified)
        for improvement in improvements:
            if 'cycle time' in improvement.get('improvement', '').lower():
                total_time_savings += current_cycle_time * 0.1  # 10% reduction

            if 'quality' in improvement.get('improvement', '').lower():
                total_cost_savings += current_cost * 0.05  # 5% cost reduction

        efficiency_gain = (total_time_savings / max(current_cycle_time, 1)) * 100

        return {
            'efficiency_gain': round(efficiency_gain, 2),
            'time_savings': round(total_time_savings, 2),
            'cost_savings': round(total_cost_savings, 2),
            'productivity_increase': round(efficiency_gain * 0.8, 2)
        }

    def _create_optimization_plan(
        self,
        improvements: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create implementation plan for optimizations."""
        phases = []

        # Sort by priority and effort
        sorted_improvements = sorted(
            improvements,
            key=lambda x: (
                0 if x.get('implementation_effort') == 'low' else
                1 if x.get('implementation_effort') == 'medium' else 2
            )
        )

        for i, improvement in enumerate(sorted_improvements, 1):
            phases.append({
                'phase': i,
                'improvement': improvement.get('improvement'),
                'duration': improvement.get('timeframe'),
                'effort': improvement.get('implementation_effort'),
                'dependencies': [] if i == 1 else [i - 1]
            })

        return {
            'phases': phases,
            'total_duration': self._estimate_total_duration(phases),
            'resource_requirements': self._estimate_resource_requirements(improvements),
            'risk_assessment': 'medium'
        }

    def _estimate_total_duration(self, phases: List[Dict[str, Any]]) -> str:
        """Estimate total implementation duration."""
        # Simplified estimation
        phase_count = len(phases)

        if phase_count <= 2:
            return '2-3 months'
        elif phase_count <= 4:
            return '3-6 months'
        else:
            return '6-12 months'

    def _estimate_resource_requirements(
        self,
        improvements: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """Estimate resource requirements."""
        effort_map = {'low': 1, 'medium': 2, 'high': 3}

        total_effort = sum(
            effort_map.get(imp.get('implementation_effort', 'medium'), 2)
            for imp in improvements
        )

        return {
            'team_members': min(total_effort * 2, 10),
            'budget_units': total_effort * 50000,
            'tools_required': ['Process mapping software', 'Analytics platform', 'Automation tools']
        }

    def _calculate_optimization_roi(
        self,
        projected_gains: Dict[str, Any],
        budget: float
    ) -> Dict[str, Any]:
        """Calculate ROI for optimization."""
        cost_savings = projected_gains.get('cost_savings', 0)

        if budget == 0:
            budget = 100000  # Default budget assumption

        roi = ((cost_savings - budget) / budget) * 100 if budget > 0 else 0
        payback_months = (budget / (cost_savings / 12)) if cost_savings > 0 else 0

        return {
            'investment': budget,
            'annual_savings': cost_savings,
            'roi_percentage': round(roi, 2),
            'payback_period_months': round(payback_months, 1),
            'break_even_date': (datetime.now() + timedelta(days=payback_months * 30)).isoformat()
        }

    async def allocate_resources(self, requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Allocate resources across departments with capacity planning.

        Args:
            requirements: Resource requirements from departments

        Returns:
            Allocation plan with capacity analysis
        """
        try:
            logger.info("Allocating resources across departments")

            if not requirements:
                raise ValueError("Requirements cannot be empty")

            # Perform capacity analysis
            capacity_analysis = self._analyze_capacity(requirements)

            # Calculate resource availability
            available_resources = self._calculate_available_resources(requirements)

            # Optimize allocation
            allocation_plan = self._optimize_resource_allocation(
                requirements,
                available_resources,
                capacity_analysis
            )

            # Identify conflicts
            conflicts = self._identify_allocation_conflicts(allocation_plan)

            # Generate recommendations
            recommendations = self._generate_allocation_recommendations(
                conflicts,
                capacity_analysis
            )

            allocation = {
                'id': f"ALLOC-{len(self.resource_allocations) + 1:05d}",
                'timestamp': datetime.now().isoformat(),
                'total_requests': len(requirements),
                'capacity_analysis': capacity_analysis,
                'available_resources': available_resources,
                'allocation_plan': allocation_plan,
                'conflicts': conflicts,
                'recommendations': recommendations,
                'utilization_forecast': self._forecast_utilization(allocation_plan),
                'status': 'pending_approval'
            }

            self.resource_allocations.append(allocation)
            logger.info(f"Resource allocation {allocation['id']} completed")

            return allocation

        except Exception as e:
            logger.error(f"Error allocating resources: {str(e)}")
            raise

    def _analyze_capacity(self, requirements: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze capacity requirements."""
        try:
            resource_demand = defaultdict(float)

            for req in requirements:
                resources = req.get('resources', {})
                for resource_type, amount in resources.items():
                    resource_demand[resource_type] += amount

            return {
                'total_demand': dict(resource_demand),
                'peak_demand_periods': self._identify_peak_periods(requirements),
                'capacity_gaps': self._identify_capacity_gaps(resource_demand)
            }

        except Exception as e:
            logger.error(f"Error analyzing capacity: {str(e)}")
            return {}

    def _identify_peak_periods(self, requirements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify peak demand periods."""
        periods = []

        # Group by timeframe
        timeframe_demand = defaultdict(int)

        for req in requirements:
            timeframe = req.get('timeframe', 'unknown')
            priority = 1 if req.get('priority') == 'high' else 0.5
            timeframe_demand[timeframe] += priority

        # Identify peaks
        avg_demand = statistics.mean(timeframe_demand.values()) if timeframe_demand else 0

        for timeframe, demand in timeframe_demand.items():
            if demand > avg_demand * 1.2:
                periods.append({
                    'period': timeframe,
                    'demand_level': round(demand, 2),
                    'status': 'high'
                })

        return periods

    def _identify_capacity_gaps(self, resource_demand: Dict[str, float]) -> List[Dict[str, Any]]:
        """Identify capacity gaps."""
        gaps = []

        # Assumed capacity (would come from config in real scenario)
        assumed_capacity = {
            'staff': 100,
            'budget': 1000000,
            'equipment': 50,
            'space': 1000
        }

        for resource_type, demand in resource_demand.items():
            capacity = assumed_capacity.get(resource_type, demand * 1.2)

            if demand > capacity:
                gaps.append({
                    'resource': resource_type,
                    'demand': demand,
                    'capacity': capacity,
                    'gap': demand - capacity,
                    'severity': 'high' if (demand - capacity) / capacity > 0.2 else 'medium'
                })

        return gaps

    def _calculate_available_resources(
        self,
        requirements: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calculate available resources."""
        # This would integrate with actual resource management system
        return {
            'staff': 100,
            'budget': 1000000,
            'equipment': 50,
            'space': 1000,
            'availability_percentage': 85
        }

    def _optimize_resource_allocation(
        self,
        requirements: List[Dict[str, Any]],
        available: Dict[str, float],
        capacity: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Optimize resource allocation using priority-based algorithm."""
        allocation = []

        # Sort by priority
        sorted_reqs = sorted(
            requirements,
            key=lambda x: (
                0 if x.get('priority') == 'high' else
                1 if x.get('priority') == 'medium' else 2,
                x.get('urgency', 5)
            )
        )

        remaining = available.copy()

        for req in sorted_reqs:
            dept = req.get('department', 'Unknown')
            requested = req.get('resources', {})

            allocated_resources = {}
            allocation_percentage = 100

            for resource_type, amount in requested.items():
                available_amount = remaining.get(resource_type, 0)

                if available_amount >= amount:
                    allocated_resources[resource_type] = amount
                    remaining[resource_type] = available_amount - amount
                else:
                    allocated_resources[resource_type] = available_amount
                    remaining[resource_type] = 0
                    allocation_percentage = min(
                        allocation_percentage,
                        (available_amount / amount * 100) if amount > 0 else 0
                    )

            allocation.append({
                'department': dept,
                'requested': requested,
                'allocated': allocated_resources,
                'allocation_percentage': round(allocation_percentage, 2),
                'priority': req.get('priority', 'medium'),
                'status': 'fully_allocated' if allocation_percentage == 100 else 'partial'
            })

        return allocation

    def _identify_allocation_conflicts(
        self,
        allocation_plan: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify resource allocation conflicts."""
        conflicts = []

        for alloc in allocation_plan:
            if alloc.get('allocation_percentage', 0) < 100:
                conflicts.append({
                    'department': alloc.get('department'),
                    'shortfall_percentage': round(100 - alloc.get('allocation_percentage', 0), 2),
                    'priority': alloc.get('priority'),
                    'resolution_needed': True
                })

        return conflicts

    def _generate_allocation_recommendations(
        self,
        conflicts: List[Dict[str, Any]],
        capacity: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Generate recommendations for allocation issues."""
        recommendations = []

        if conflicts:
            recommendations.append({
                'issue': 'Resource shortfalls detected',
                'recommendation': 'Consider phased allocation or additional resource acquisition',
                'priority': 'high'
            })

        gaps = capacity.get('capacity_gaps', [])
        if gaps:
            recommendations.append({
                'issue': 'Capacity gaps identified',
                'recommendation': 'Increase capacity or adjust demand through prioritization',
                'priority': 'medium'
            })

        return recommendations

    def _forecast_utilization(self, allocation_plan: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Forecast resource utilization."""
        total_allocated = defaultdict(float)
        total_available = {'staff': 100, 'budget': 1000000, 'equipment': 50, 'space': 1000}

        for alloc in allocation_plan:
            allocated = alloc.get('allocated', {})
            for resource_type, amount in allocated.items():
                total_allocated[resource_type] += amount

        utilization = {}
        for resource_type, available in total_available.items():
            allocated = total_allocated.get(resource_type, 0)
            utilization[resource_type] = round((allocated / available * 100), 2) if available > 0 else 0

        avg_utilization = statistics.mean(utilization.values()) if utilization else 0

        return {
            'by_resource': utilization,
            'average_utilization': round(avg_utilization, 2),
            'status': 'optimal' if 70 <= avg_utilization <= 90 else 'suboptimal'
        }

    async def monitor_performance(self, metrics_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Monitor operational performance with KPI tracking.

        Args:
            metrics_data: Current performance metrics

        Returns:
            Performance analysis with trends and alerts
        """
        try:
            logger.info("Monitoring operational performance")

            if not metrics_data:
                raise ValueError("Metrics data cannot be empty")

            # Track KPIs
            kpi_analysis = self._track_kpis(metrics_data.get('kpis', {}))

            # Analyze trends
            trend_analysis = self._analyze_performance_trends(
                metrics_data.get('historical', []),
                kpi_analysis
            )

            # Identify bottlenecks
            bottlenecks = await self.identify_bottlenecks(metrics_data.get('processes', []))

            # Generate alerts
            alerts = self._generate_performance_alerts(kpi_analysis, trend_analysis)

            # Calculate overall health
            health_score = self._calculate_operational_health(kpi_analysis)

            performance = {
                'timestamp': datetime.now().isoformat(),
                'kpi_analysis': kpi_analysis,
                'trend_analysis': trend_analysis,
                'bottlenecks': bottlenecks,
                'alerts': alerts,
                'health_score': health_score,
                'recommendations': self._generate_performance_recommendations(
                    kpi_analysis,
                    bottlenecks
                )
            }

            self.performance_metrics = performance
            logger.info(f"Performance monitoring completed: Health score {health_score}")

            return performance

        except Exception as e:
            logger.error(f"Error monitoring performance: {str(e)}")
            raise

    def _track_kpis(self, kpis: Dict[str, Any]) -> Dict[str, Any]:
        """Track key performance indicators."""
        kpi_analysis = {}

        for kpi_name, kpi_data in kpis.items():
            actual = kpi_data.get('actual', 0)
            target = kpi_data.get('target', 0)

            variance = ((actual - target) / target * 100) if target > 0 else 0

            kpi_analysis[kpi_name] = {
                'actual': actual,
                'target': target,
                'variance': round(variance, 2),
                'status': 'on_track' if abs(variance) <= 10 else 'off_track',
                'trend': kpi_data.get('trend', 'stable')
            }

        return kpi_analysis

    def _analyze_performance_trends(
        self,
        historical: List[Dict[str, Any]],
        current_kpis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze performance trends."""
        if not historical:
            return {'status': 'insufficient_data'}

        trends = {}

        for kpi_name, current_data in current_kpis.items():
            historical_values = [
                h.get(kpi_name, {}).get('actual', 0)
                for h in historical
                if kpi_name in h
            ]

            if len(historical_values) >= 2:
                trend_direction = self._calculate_trend_direction(historical_values)
                trends[kpi_name] = {
                    'direction': trend_direction,
                    'volatility': self._calculate_volatility(historical_values)
                }

        return trends

    def _calculate_trend_direction(self, values: List[float]) -> str:
        """Calculate trend direction."""
        if len(values) < 2:
            return 'stable'

        recent_avg = statistics.mean(values[-3:]) if len(values) >= 3 else values[-1]
        older_avg = statistics.mean(values[:3]) if len(values) >= 3 else values[0]

        if recent_avg > older_avg * 1.1:
            return 'improving'
        elif recent_avg < older_avg * 0.9:
            return 'declining'
        else:
            return 'stable'

    def _calculate_volatility(self, values: List[float]) -> str:
        """Calculate metric volatility."""
        if len(values) < 2:
            return 'low'

        std_dev = statistics.stdev(values)
        mean = statistics.mean(values)

        coefficient_of_variation = (std_dev / mean) if mean > 0 else 0

        if coefficient_of_variation > 0.3:
            return 'high'
        elif coefficient_of_variation > 0.15:
            return 'medium'
        else:
            return 'low'

    async def identify_bottlenecks(self, processes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Identify operational bottlenecks with process analysis.

        Args:
            processes: Process data for analysis

        Returns:
            Bottleneck analysis with root causes
        """
        try:
            logger.info("Identifying operational bottlenecks")

            bottlenecks = []

            for process in processes:
                # Check cycle time
                actual_time = process.get('actual_cycle_time', 0)
                expected_time = process.get('expected_cycle_time', 0)

                if expected_time > 0 and actual_time > expected_time * 1.2:
                    bottlenecks.append({
                        'process': process.get('name', 'Unknown'),
                        'type': 'cycle_time',
                        'severity': 'high',
                        'actual': actual_time,
                        'expected': expected_time,
                        'impact': round((actual_time - expected_time) / expected_time * 100, 2)
                    })

                # Check resource constraints
                utilization = process.get('resource_utilization', 0)
                if utilization > 95:
                    bottlenecks.append({
                        'process': process.get('name', 'Unknown'),
                        'type': 'resource_constraint',
                        'severity': 'medium',
                        'utilization': utilization,
                        'impact': 'High wait times'
                    })

            # Analyze root causes
            root_causes = self._analyze_bottleneck_root_causes(bottlenecks)

            return {
                'bottlenecks_identified': len(bottlenecks),
                'bottlenecks': bottlenecks,
                'root_causes': root_causes,
                'critical_path': self._identify_critical_path(processes),
                'resolution_priority': self._prioritize_bottlenecks(bottlenecks)
            }

        except Exception as e:
            logger.error(f"Error identifying bottlenecks: {str(e)}")
            raise

    def _analyze_bottleneck_root_causes(
        self,
        bottlenecks: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """Analyze root causes of bottlenecks."""
        root_causes = []

        bottleneck_types = defaultdict(int)
        for bottleneck in bottlenecks:
            bottleneck_types[bottleneck.get('type')] += 1

        for bottleneck_type, count in bottleneck_types.items():
            if bottleneck_type == 'cycle_time':
                root_causes.append({
                    'cause': 'Process inefficiency',
                    'frequency': count,
                    'recommendation': 'Process reengineering and automation'
                })
            elif bottleneck_type == 'resource_constraint':
                root_causes.append({
                    'cause': 'Insufficient capacity',
                    'frequency': count,
                    'recommendation': 'Capacity expansion or load balancing'
                })

        return root_causes

    def _identify_critical_path(self, processes: List[Dict[str, Any]]) -> List[str]:
        """Identify critical path in process flow."""
        # Simplified critical path identification
        sorted_processes = sorted(
            processes,
            key=lambda x: x.get('actual_cycle_time', 0),
            reverse=True
        )

        return [p.get('name', 'Unknown') for p in sorted_processes[:3]]

    def _prioritize_bottlenecks(
        self,
        bottlenecks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Prioritize bottlenecks for resolution."""
        severity_map = {'high': 3, 'medium': 2, 'low': 1}

        prioritized = sorted(
            bottlenecks,
            key=lambda x: (
                severity_map.get(x.get('severity', 'low'), 1),
                x.get('impact', 0)
            ),
            reverse=True
        )

        return [
            {
                'rank': i + 1,
                'process': b.get('process'),
                'priority': 'immediate' if i < 2 else 'scheduled'
            }
            for i, b in enumerate(prioritized)
        ]

    def _generate_performance_alerts(
        self,
        kpi_analysis: Dict[str, Any],
        trend_analysis: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Generate performance alerts."""
        alerts = []

        for kpi_name, kpi_data in kpi_analysis.items():
            if kpi_data.get('status') == 'off_track':
                alerts.append({
                    'severity': 'high',
                    'metric': kpi_name,
                    'message': f"{kpi_name} is off track by {abs(kpi_data.get('variance', 0))}%",
                    'action_required': 'Review and adjust operations'
                })

        for kpi_name, trend_data in trend_analysis.items():
            if trend_data.get('direction') == 'declining':
                alerts.append({
                    'severity': 'medium',
                    'metric': kpi_name,
                    'message': f"{kpi_name} shows declining trend",
                    'action_required': 'Investigate root cause'
                })

        return alerts

    def _calculate_operational_health(self, kpi_analysis: Dict[str, Any]) -> float:
        """Calculate overall operational health score."""
        if not kpi_analysis:
            return 0.0

        on_track_count = sum(1 for kpi in kpi_analysis.values() if kpi.get('status') == 'on_track')
        total_kpis = len(kpi_analysis)

        health_score = (on_track_count / total_kpis * 100) if total_kpis > 0 else 0

        return round(health_score, 2)

    def _generate_performance_recommendations(
        self,
        kpi_analysis: Dict[str, Any],
        bottlenecks: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Generate performance improvement recommendations."""
        recommendations = []

        off_track_kpis = [
            name for name, data in kpi_analysis.items()
            if data.get('status') == 'off_track'
        ]

        if off_track_kpis:
            recommendations.append({
                'area': 'KPI Performance',
                'recommendation': f"Focus on improving {', '.join(off_track_kpis[:2])}",
                'priority': 'high'
            })

        if bottlenecks.get('bottlenecks_identified', 0) > 0:
            recommendations.append({
                'area': 'Process Optimization',
                'recommendation': 'Address identified bottlenecks starting with critical path',
                'priority': 'high'
            })

        return recommendations

    def get_status(self) -> Dict[str, Any]:
        """Get current agent status."""
        return {
            'agent': self.name,
            'active_allocations': len(self.resource_allocations),
            'optimizations_completed': len(self.optimization_history),
            'current_health_score': self.performance_metrics.get('health_score', 0),
            'status': 'active',
            'last_updated': datetime.now().isoformat()
        }
