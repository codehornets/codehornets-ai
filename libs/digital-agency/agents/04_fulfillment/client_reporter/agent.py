"""Client Reporter Agent - Reporting and analytics"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import uuid


class ClientReporterAgent:
    """Agent responsible for creating and delivering client reports."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Client Reporter Agent."""
        self.config = config or {}
        self.name = "Client Reporter"
        self.role = "Reporting & Analytics Specialist"
        self.goal = "Deliver insightful reports that demonstrate value"
        self.logger = logging.getLogger(__name__)

        # Initialize internal state
        self.reports: Dict[str, Dict[str, Any]] = {}
        self.dashboards: Dict[str, Dict[str, Any]] = {}
        self.metrics_cache: Dict[str, Dict[str, Any]] = {}

    def generate_progress_report(self, project_id: str) -> Dict[str, Any]:
        """
        Generate project progress report with metrics extraction.

        Args:
            project_id: Unique identifier for the project

        Returns:
            Dict containing comprehensive progress report
        """
        try:
            self.logger.info(f"Generating progress report for project: {project_id}")

            # Validate input
            if not project_id:
                raise ValueError("Invalid project_id provided")

            report_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()

            # Extract project metrics
            project_metrics = self._extract_project_metrics(project_id)

            # Calculate completion percentage
            completion_percentage = self._calculate_completion_percentage(project_metrics)

            # Identify completed milestones
            completed_milestones = self._identify_completed_milestones(project_metrics)

            # Calculate timeline metrics
            timeline_metrics = self._calculate_timeline_metrics(project_id, project_metrics)

            # Analyze budget performance
            budget_analysis = self._analyze_budget_performance(project_metrics)

            # Extract deliverables status
            deliverables_status = self._extract_deliverables_status(project_metrics)

            # Identify risks and blockers
            risks_and_blockers = self._identify_risks_and_blockers(project_metrics)

            # Generate key achievements
            key_achievements = self._generate_key_achievements(
                completed_milestones, deliverables_status
            )

            # Create executive summary
            executive_summary = self._create_executive_summary(
                completion_percentage, timeline_metrics, budget_analysis, key_achievements
            )

            # Generate recommendations
            recommendations = self._generate_progress_recommendations(
                timeline_metrics, budget_analysis, risks_and_blockers
            )

            # Compile progress report
            progress_report = {
                "report_id": report_id,
                "project_id": project_id,
                "timestamp": timestamp,
                "generated": True,
                "executive_summary": executive_summary,
                "completion_percentage": round(completion_percentage, 1),
                "timeline_metrics": timeline_metrics,
                "budget_analysis": budget_analysis,
                "completed_milestones": completed_milestones,
                "deliverables_status": deliverables_status,
                "key_achievements": key_achievements,
                "risks_and_blockers": risks_and_blockers,
                "recommendations": recommendations,
                "next_milestones": self._get_next_milestones(project_metrics)
            }

            # Store report
            self.reports[report_id] = progress_report

            self.logger.info(
                f"Progress report {report_id} generated for project {project_id}: "
                f"{completion_percentage:.1f}% complete"
            )

            return progress_report

        except Exception as e:
            self.logger.error(f"Error generating progress report for {project_id}: {str(e)}")
            return {
                "error": str(e),
                "report_id": "",
                "generated": False
            }

    def create_dashboard(self, project_id: str, metrics: List[str]) -> Dict[str, Any]:
        """
        Create performance dashboard with visualization data.

        Args:
            project_id: Unique identifier for the project
            metrics: List of metric identifiers to include

        Returns:
            Dict containing dashboard configuration and data
        """
        try:
            self.logger.info(f"Creating dashboard for project: {project_id} with {len(metrics)} metrics")

            # Validate inputs
            if not project_id or not metrics:
                raise ValueError("Invalid project_id or metrics provided")

            dashboard_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()

            # Compile metric data for each requested metric
            metric_data = []
            for metric_key in metrics:
                data = self._compile_metric_data(project_id, metric_key)
                if data:
                    metric_data.append(data)

            # Create visualization configurations
            visualizations = self._create_visualizations(metric_data)

            # Generate dashboard layout
            layout = self._generate_dashboard_layout(visualizations)

            # Calculate summary statistics
            summary_stats = self._calculate_summary_statistics(metric_data)

            # Identify trends
            trends = self._identify_metric_trends(metric_data)

            # Generate insights
            insights = self._generate_dashboard_insights(metric_data, trends)

            # Create dashboard configuration
            dashboard_config = {
                "dashboard_id": dashboard_id,
                "project_id": project_id,
                "timestamp": timestamp,
                "metrics": metrics,
                "metric_data": metric_data,
                "visualizations": visualizations,
                "layout": layout,
                "summary_stats": summary_stats,
                "trends": trends,
                "insights": insights,
                "refresh_interval": 300,  # 5 minutes
                "last_updated": timestamp
            }

            # Store dashboard
            self.dashboards[dashboard_id] = dashboard_config

            self.logger.info(
                f"Dashboard {dashboard_id} created for project {project_id} "
                f"with {len(visualizations)} visualizations"
            )

            return dashboard_config

        except Exception as e:
            self.logger.error(f"Error creating dashboard for {project_id}: {str(e)}")
            return {
                "error": str(e),
                "dashboard_id": "",
                "metrics": metrics
            }

    def compile_metrics(self, project_id: str) -> Dict[str, Any]:
        """
        Compile project metrics and analytics with KPI calculations.

        Args:
            project_id: Unique identifier for the project

        Returns:
            Dict containing compiled metrics and calculated KPIs
        """
        try:
            self.logger.info(f"Compiling metrics for project: {project_id}")

            # Validate input
            if not project_id:
                raise ValueError("Invalid project_id provided")

            timestamp = datetime.now().isoformat()

            # Calculate performance KPIs
            performance_kpis = self._calculate_performance_kpis(project_id)

            # Calculate quality KPIs
            quality_kpis = self._calculate_quality_kpis(project_id)

            # Calculate efficiency KPIs
            efficiency_kpis = self._calculate_efficiency_kpis(project_id)

            # Calculate client satisfaction metrics
            satisfaction_metrics = self._calculate_satisfaction_metrics(project_id)

            # Calculate ROI metrics
            roi_metrics = self._calculate_roi_metrics(project_id)

            # Generate time-series data
            time_series = self._generate_time_series_data(project_id)

            # Calculate comparative metrics
            comparative_metrics = self._calculate_comparative_metrics(project_id)

            # Generate insights from metrics
            metric_insights = self._generate_metric_insights(
                performance_kpis, quality_kpis, efficiency_kpis, satisfaction_metrics
            )

            # Identify areas of concern
            areas_of_concern = self._identify_areas_of_concern(
                performance_kpis, quality_kpis, efficiency_kpis
            )

            # Compile all metrics
            compiled_metrics = {
                "project_id": project_id,
                "timestamp": timestamp,
                "metrics": {
                    "performance": performance_kpis,
                    "quality": quality_kpis,
                    "efficiency": efficiency_kpis,
                    "satisfaction": satisfaction_metrics,
                    "roi": roi_metrics
                },
                "time_series": time_series,
                "comparative": comparative_metrics,
                "insights": metric_insights,
                "areas_of_concern": areas_of_concern,
                "overall_health_score": self._calculate_overall_health_score(
                    performance_kpis, quality_kpis, efficiency_kpis, satisfaction_metrics
                )
            }

            # Cache metrics
            self.metrics_cache[project_id] = compiled_metrics

            self.logger.info(f"Metrics compiled for project {project_id}")

            return compiled_metrics

        except Exception as e:
            self.logger.error(f"Error compiling metrics for {project_id}: {str(e)}")
            return {
                "error": str(e),
                "metrics": {},
                "insights": []
            }

    def prepare_presentation(self, report_id: str) -> Dict[str, Any]:
        """
        Prepare client presentation with slide generation.

        Args:
            report_id: Unique identifier for the report

        Returns:
            Dict containing presentation structure and content
        """
        try:
            self.logger.info(f"Preparing presentation for report: {report_id}")

            # Validate input
            if not report_id:
                raise ValueError("Invalid report_id provided")

            # Retrieve report
            report = self.reports.get(report_id)
            if not report:
                raise ValueError(f"Report {report_id} not found")

            presentation_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()

            # Generate slide deck structure
            slides = []

            # Slide 1: Title slide
            slides.append(self._create_title_slide(report))

            # Slide 2: Executive summary
            slides.append(self._create_executive_summary_slide(report))

            # Slide 3: Progress overview
            slides.append(self._create_progress_overview_slide(report))

            # Slide 4: Key achievements
            slides.append(self._create_achievements_slide(report))

            # Slide 5: Metrics dashboard
            slides.append(self._create_metrics_slide(report))

            # Slide 6: Timeline and milestones
            slides.append(self._create_timeline_slide(report))

            # Slide 7: Budget analysis
            slides.append(self._create_budget_slide(report))

            # Slide 8: Risks and mitigations
            if report.get('risks_and_blockers'):
                slides.append(self._create_risks_slide(report))

            # Slide 9: Next steps
            slides.append(self._create_next_steps_slide(report))

            # Slide 10: Q&A
            slides.append(self._create_qa_slide())

            # Generate speaker notes for each slide
            for slide in slides:
                slide['speaker_notes'] = self._generate_speaker_notes(slide, report)

            # Create presentation metadata
            presentation = {
                "presentation_id": presentation_id,
                "report_id": report_id,
                "timestamp": timestamp,
                "ready": True,
                "slides": slides,
                "slide_count": len(slides),
                "format": "pptx",
                "theme": self.config.get('presentation_theme', 'professional'),
                "estimated_duration_minutes": len(slides) * 2,  # 2 min per slide
                "export_options": ["pdf", "pptx", "html"]
            }

            self.logger.info(
                f"Presentation {presentation_id} prepared with {len(slides)} slides"
            )

            return presentation

        except Exception as e:
            self.logger.error(f"Error preparing presentation for {report_id}: {str(e)}")
            return {
                "error": str(e),
                "presentation_id": "",
                "ready": False
            }

    # Helper methods

    def _extract_project_metrics(self, project_id: str) -> Dict[str, Any]:
        """Extract comprehensive project metrics."""
        # Simulated metrics (in production, would query actual project data)
        import random

        return {
            "total_tasks": 50,
            "completed_tasks": random.randint(30, 45),
            "in_progress_tasks": random.randint(3, 10),
            "blocked_tasks": random.randint(0, 3),
            "total_milestones": 8,
            "completed_milestones": random.randint(4, 7),
            "budget_allocated": 100000,
            "budget_spent": random.randint(60000, 85000),
            "start_date": (datetime.now() - timedelta(days=60)).isoformat(),
            "planned_end_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "deliverables_count": 12,
            "deliverables_completed": random.randint(7, 11),
            "team_size": 8,
            "total_hours_logged": random.randint(800, 1200)
        }

    def _calculate_completion_percentage(self, metrics: Dict[str, Any]) -> float:
        """Calculate overall project completion percentage."""
        task_weight = 0.4
        milestone_weight = 0.3
        deliverable_weight = 0.3

        task_completion = (metrics['completed_tasks'] / metrics['total_tasks']) * 100 * task_weight
        milestone_completion = (metrics['completed_milestones'] / metrics['total_milestones']) * 100 * milestone_weight
        deliverable_completion = (metrics['deliverables_completed'] / metrics['deliverables_count']) * 100 * deliverable_weight

        total_completion = task_completion + milestone_completion + deliverable_completion
        return total_completion

    def _identify_completed_milestones(self, metrics: Dict[str, Any]) -> List[Dict[str, str]]:
        """Identify completed milestones."""
        milestones = [
            {"name": "Project Kickoff", "date": "2024-01-15", "status": "completed"},
            {"name": "Requirements Finalized", "date": "2024-01-30", "status": "completed"},
            {"name": "Design Approval", "date": "2024-02-20", "status": "completed"},
            {"name": "Development Phase 1", "date": "2024-03-15", "status": "completed"},
        ]
        return milestones[:metrics['completed_milestones']]

    def _calculate_timeline_metrics(self, project_id: str, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate timeline-related metrics."""
        start = datetime.fromisoformat(metrics['start_date'])
        planned_end = datetime.fromisoformat(metrics['planned_end_date'])
        now = datetime.now()

        total_duration = (planned_end - start).days
        elapsed_days = (now - start).days
        remaining_days = (planned_end - now).days

        time_progress = (elapsed_days / total_duration * 100) if total_duration > 0 else 0
        completion = self._calculate_completion_percentage(metrics)

        # Calculate if on track
        on_track = completion >= time_progress - 5  # 5% tolerance

        return {
            "elapsed_days": elapsed_days,
            "remaining_days": remaining_days,
            "total_duration_days": total_duration,
            "time_progress_percentage": round(time_progress, 1),
            "completion_vs_time": round(completion - time_progress, 1),
            "on_track": on_track,
            "status": "on_track" if on_track else "behind_schedule"
        }

    def _analyze_budget_performance(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze budget performance."""
        allocated = metrics['budget_allocated']
        spent = metrics['budget_spent']
        remaining = allocated - spent
        burn_rate = spent / allocated * 100 if allocated > 0 else 0

        completion = self._calculate_completion_percentage(metrics)
        expected_spend = allocated * (completion / 100)
        variance = spent - expected_spend

        return {
            "allocated": allocated,
            "spent": spent,
            "remaining": remaining,
            "burn_rate_percentage": round(burn_rate, 1),
            "expected_spend": round(expected_spend, 2),
            "variance": round(variance, 2),
            "variance_percentage": round((variance / expected_spend * 100) if expected_spend > 0 else 0, 1),
            "on_budget": abs(variance) < (allocated * 0.1),  # Within 10%
            "status": "under_budget" if variance < 0 else "over_budget" if variance > (allocated * 0.1) else "on_budget"
        }

    def _extract_deliverables_status(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Extract deliverables status."""
        total = metrics['deliverables_count']
        completed = metrics['deliverables_completed']
        in_progress = total - completed

        return {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "completion_rate": round((completed / total * 100) if total > 0 else 0, 1)
        }

    def _identify_risks_and_blockers(self, metrics: Dict[str, Any]) -> List[Dict[str, str]]:
        """Identify project risks and blockers."""
        risks = []

        if metrics['blocked_tasks'] > 0:
            risks.append({
                "type": "blocker",
                "severity": "high",
                "description": f"{metrics['blocked_tasks']} tasks are currently blocked",
                "mitigation": "Prioritize resolution of blocking issues"
            })

        timeline = self._calculate_timeline_metrics("", metrics)
        if not timeline['on_track']:
            risks.append({
                "type": "timeline",
                "severity": "medium",
                "description": "Project is behind schedule",
                "mitigation": "Increase resources or adjust scope"
            })

        budget = self._analyze_budget_performance(metrics)
        if budget['status'] == 'over_budget':
            risks.append({
                "type": "budget",
                "severity": "high",
                "description": "Project is over budget",
                "mitigation": "Review and optimize resource allocation"
            })

        return risks

    def _generate_key_achievements(self, milestones: List[Dict], deliverables: Dict[str, Any]) -> List[str]:
        """Generate list of key achievements."""
        achievements = []

        achievements.append(f"Completed {len(milestones)} major project milestones")
        achievements.append(f"Delivered {deliverables['completed']} of {deliverables['total']} deliverables")

        if deliverables['completion_rate'] > 80:
            achievements.append("Project execution exceeds expectations")

        return achievements

    def _create_executive_summary(self, completion: float, timeline: Dict,
                                  budget: Dict, achievements: List[str]) -> str:
        """Create executive summary text."""
        status = "on track" if timeline['on_track'] and budget['on_budget'] else "needs attention"

        summary = (
            f"Project is {completion:.1f}% complete and {status}. "
            f"Timeline: {timeline['status'].replace('_', ' ')}. "
            f"Budget: {budget['status'].replace('_', ' ')}. "
            f"Key achievements include {len(achievements)} major milestones."
        )

        return summary

    def _generate_progress_recommendations(self, timeline: Dict, budget: Dict,
                                          risks: List[Dict]) -> List[str]:
        """Generate recommendations based on progress."""
        recommendations = []

        if not timeline['on_track']:
            recommendations.append("Consider resource reallocation to accelerate delivery")

        if budget['status'] == 'over_budget':
            recommendations.append("Implement cost control measures")

        if len(risks) > 2:
            recommendations.append("Schedule risk mitigation planning session")

        if timeline['on_track'] and budget['on_budget']:
            recommendations.append("Maintain current pace and resource allocation")

        return recommendations

    def _get_next_milestones(self, metrics: Dict[str, Any]) -> List[Dict[str, str]]:
        """Get upcoming milestones."""
        return [
            {"name": "Beta Testing Complete", "target_date": "2024-04-15"},
            {"name": "Final QA Approval", "target_date": "2024-04-25"},
            {"name": "Client Training", "target_date": "2024-05-01"},
            {"name": "Go Live", "target_date": "2024-05-10"}
        ]

    def _compile_metric_data(self, project_id: str, metric_key: str) -> Optional[Dict[str, Any]]:
        """Compile data for specific metric."""
        import random

        metric_definitions = {
            "completion_rate": {
                "name": "Completion Rate",
                "value": random.randint(70, 95),
                "unit": "%",
                "trend": "up"
            },
            "budget_utilization": {
                "name": "Budget Utilization",
                "value": random.randint(65, 85),
                "unit": "%",
                "trend": "stable"
            },
            "quality_score": {
                "name": "Quality Score",
                "value": random.randint(85, 98),
                "unit": "points",
                "trend": "up"
            },
            "client_satisfaction": {
                "name": "Client Satisfaction",
                "value": random.uniform(4.2, 4.9),
                "unit": "/5",
                "trend": "up"
            }
        }

        return metric_definitions.get(metric_key)

    def _create_visualizations(self, metric_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create visualization configurations."""
        visualizations = []

        for metric in metric_data:
            viz = {
                "id": str(uuid.uuid4()),
                "type": "gauge" if "percentage" in metric.get('unit', '').lower() else "line_chart",
                "title": metric['name'],
                "data": metric,
                "config": {
                    "show_trend": True,
                    "color_scheme": "blue"
                }
            }
            visualizations.append(viz)

        return visualizations

    def _generate_dashboard_layout(self, visualizations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate dashboard layout configuration."""
        return {
            "rows": 2,
            "columns": 2,
            "widgets": [
                {"viz_id": viz['id'], "row": i // 2, "col": i % 2}
                for i, viz in enumerate(visualizations)
            ]
        }

    def _calculate_summary_statistics(self, metric_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate summary statistics across metrics."""
        values = [m['value'] for m in metric_data if isinstance(m['value'], (int, float))]

        return {
            "average": round(sum(values) / len(values), 2) if values else 0,
            "max": max(values) if values else 0,
            "min": min(values) if values else 0,
            "count": len(metric_data)
        }

    def _identify_metric_trends(self, metric_data: List[Dict[str, Any]]) -> Dict[str, int]:
        """Identify trends across metrics."""
        trends = {"up": 0, "down": 0, "stable": 0}

        for metric in metric_data:
            trend = metric.get('trend', 'stable')
            trends[trend] = trends.get(trend, 0) + 1

        return trends

    def _generate_dashboard_insights(self, metric_data: List[Dict[str, Any]],
                                    trends: Dict[str, int]) -> List[str]:
        """Generate insights from dashboard data."""
        insights = []

        if trends['up'] > trends['down']:
            insights.append("Overall positive trend across key metrics")

        high_performers = [m for m in metric_data if isinstance(m.get('value'), (int, float)) and m['value'] > 90]
        if high_performers:
            insights.append(f"{len(high_performers)} metrics performing excellently")

        return insights

    def _calculate_performance_kpis(self, project_id: str) -> Dict[str, float]:
        """Calculate performance KPIs."""
        import random
        return {
            "on_time_delivery_rate": round(random.uniform(85, 98), 1),
            "sprint_velocity": round(random.uniform(25, 35), 1),
            "resource_utilization": round(random.uniform(75, 90), 1)
        }

    def _calculate_quality_kpis(self, project_id: str) -> Dict[str, float]:
        """Calculate quality KPIs."""
        import random
        return {
            "defect_rate": round(random.uniform(1, 5), 2),
            "code_quality_score": round(random.uniform(85, 95), 1),
            "test_coverage": round(random.uniform(80, 95), 1)
        }

    def _calculate_efficiency_kpis(self, project_id: str) -> Dict[str, float]:
        """Calculate efficiency KPIs."""
        import random
        return {
            "cost_per_deliverable": round(random.uniform(5000, 8000), 2),
            "time_to_completion": round(random.uniform(85, 100), 1),
            "resource_efficiency": round(random.uniform(80, 95), 1)
        }

    def _calculate_satisfaction_metrics(self, project_id: str) -> Dict[str, float]:
        """Calculate client satisfaction metrics."""
        import random
        return {
            "csat_score": round(random.uniform(4.2, 4.8), 1),
            "nps_score": random.randint(8, 10),
            "communication_rating": round(random.uniform(4.3, 4.9), 1)
        }

    def _calculate_roi_metrics(self, project_id: str) -> Dict[str, Any]:
        """Calculate ROI metrics."""
        import random
        investment = random.randint(80000, 100000)
        return_value = random.randint(120000, 180000)

        return {
            "total_investment": investment,
            "projected_return": return_value,
            "roi_percentage": round(((return_value - investment) / investment * 100), 1),
            "payback_period_months": random.randint(12, 18)
        }

    def _generate_time_series_data(self, project_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """Generate time-series data for metrics."""
        import random

        dates = [(datetime.now() - timedelta(days=i*7)).isoformat() for i in range(12, -1, -1)]

        return {
            "completion": [{"date": d, "value": random.randint(i*7, i*8)} for i, d in enumerate(dates)],
            "budget_spent": [{"date": d, "value": random.randint(i*6000, i*7000)} for i, d in enumerate(dates)]
        }

    def _calculate_comparative_metrics(self, project_id: str) -> Dict[str, Any]:
        """Calculate metrics compared to benchmarks."""
        import random
        return {
            "vs_similar_projects": {
                "completion_rate": "+5%",
                "budget_efficiency": "+8%",
                "quality_score": "+3%"
            },
            "vs_industry_average": {
                "delivery_time": "-10%",
                "cost": "-5%"
            }
        }

    def _generate_metric_insights(self, performance: Dict, quality: Dict,
                                  efficiency: Dict, satisfaction: Dict) -> List[str]:
        """Generate insights from compiled metrics."""
        insights = []

        if performance['on_time_delivery_rate'] > 90:
            insights.append("Excellent on-time delivery performance")

        if quality['test_coverage'] > 90:
            insights.append("High test coverage ensures quality")

        if satisfaction['csat_score'] > 4.5:
            insights.append("Client satisfaction exceeds industry standards")

        return insights

    def _identify_areas_of_concern(self, performance: Dict, quality: Dict,
                                   efficiency: Dict) -> List[str]:
        """Identify areas requiring attention."""
        concerns = []

        if quality['defect_rate'] > 4:
            concerns.append("Defect rate is elevated")

        if efficiency['resource_efficiency'] < 85:
            concerns.append("Resource efficiency below target")

        return concerns

    def _calculate_overall_health_score(self, performance: Dict, quality: Dict,
                                       efficiency: Dict, satisfaction: Dict) -> float:
        """Calculate overall project health score."""
        scores = [
            performance['on_time_delivery_rate'],
            quality['code_quality_score'],
            efficiency['resource_efficiency'],
            satisfaction['csat_score'] * 20  # Convert to 100 scale
        ]

        return round(sum(scores) / len(scores), 1)

    def _create_title_slide(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Create title slide."""
        return {
            "number": 1,
            "type": "title",
            "title": "Project Progress Report",
            "subtitle": f"Project ID: {report['project_id']}",
            "date": datetime.now().strftime("%B %d, %Y")
        }

    def _create_executive_summary_slide(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Create executive summary slide."""
        return {
            "number": 2,
            "type": "content",
            "title": "Executive Summary",
            "content": report['executive_summary'],
            "bullets": report.get('key_achievements', [])
        }

    def _create_progress_overview_slide(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Create progress overview slide."""
        return {
            "number": 3,
            "type": "chart",
            "title": "Progress Overview",
            "completion_percentage": report['completion_percentage'],
            "chart_type": "progress_bar"
        }

    def _create_achievements_slide(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Create achievements slide."""
        return {
            "number": 4,
            "type": "bullets",
            "title": "Key Achievements",
            "bullets": report.get('key_achievements', [])
        }

    def _create_metrics_slide(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Create metrics dashboard slide."""
        return {
            "number": 5,
            "type": "dashboard",
            "title": "Performance Metrics",
            "metrics": report.get('deliverables_status', {})
        }

    def _create_timeline_slide(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Create timeline slide."""
        return {
            "number": 6,
            "type": "timeline",
            "title": "Timeline & Milestones",
            "completed": report.get('completed_milestones', []),
            "upcoming": report.get('next_milestones', [])
        }

    def _create_budget_slide(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Create budget analysis slide."""
        return {
            "number": 7,
            "type": "chart",
            "title": "Budget Analysis",
            "budget_data": report.get('budget_analysis', {})
        }

    def _create_risks_slide(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Create risks and mitigations slide."""
        return {
            "number": 8,
            "type": "table",
            "title": "Risks & Mitigations",
            "risks": report.get('risks_and_blockers', [])
        }

    def _create_next_steps_slide(self, report: Dict[str, Any]) -> Dict[str, Any]:
        """Create next steps slide."""
        return {
            "number": 9,
            "type": "bullets",
            "title": "Next Steps",
            "bullets": report.get('recommendations', [])
        }

    def _create_qa_slide(self) -> Dict[str, Any]:
        """Create Q&A slide."""
        return {
            "number": 10,
            "type": "qa",
            "title": "Questions & Discussion",
            "content": "Thank you for your attention"
        }

    def _generate_speaker_notes(self, slide: Dict[str, Any], report: Dict[str, Any]) -> str:
        """Generate speaker notes for slide."""
        notes_templates = {
            "title": "Welcome everyone to the project progress review.",
            "executive summary": "Highlight overall project status and key achievements.",
            "progress": f"Project is {report.get('completion_percentage', 0):.1f}% complete.",
            "metrics": "Review key performance indicators and trends."
        }

        slide_title = slide.get('title', '').lower()
        for key, template in notes_templates.items():
            if key in slide_title:
                return template

        return "Present slide content and invite questions."
