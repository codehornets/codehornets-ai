"""Creative Producer Agent - Creative workflow management"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
import uuid


class CreativeProducerAgent:
    """Agent responsible for managing creative production workflows."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Creative Producer Agent."""
        self.config = config or {}
        self.name = "Creative Producer"
        self.role = "Creative Production Manager"
        self.goal = "Deliver high-quality creative work on time and on brand"
        self.logger = logging.getLogger(__name__)

        # Initialize internal state
        self.briefs: Dict[str, Dict[str, Any]] = {}
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.assets: Dict[str, Dict[str, Any]] = {}
        self.team_workloads: Dict[str, List[str]] = {}

    def create_creative_brief(self, project_id: str, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create creative brief from project requirements with template generation.

        Args:
            project_id: Unique identifier for the project
            requirements: Dict containing creative requirements and specifications

        Returns:
            Dict containing brief details and generated content
        """
        try:
            self.logger.info(f"Creating creative brief for project: {project_id}")

            # Validate inputs
            if not project_id or not requirements:
                raise ValueError("Invalid project_id or requirements provided")

            # Generate brief ID
            brief_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()

            # Extract requirement details
            deliverable_type = requirements.get('deliverable_type', 'general')
            target_audience = requirements.get('target_audience', 'general audience')
            brand_guidelines = requirements.get('brand_guidelines', {})
            objectives = requirements.get('objectives', [])
            deadline = requirements.get('deadline', (datetime.now() + timedelta(days=14)).isoformat())

            # Generate brief template based on deliverable type
            template = self._generate_brief_template(deliverable_type)

            # Populate template with requirements
            populated_brief = self._populate_brief_template(
                template, requirements, target_audience, objectives
            )

            # Extract key creative parameters
            creative_parameters = self._extract_creative_parameters(requirements)

            # Generate creative direction
            creative_direction = self._generate_creative_direction(
                deliverable_type, brand_guidelines, objectives
            )

            # Define success criteria
            success_criteria = self._define_success_criteria(deliverable_type, objectives)

            # Identify required resources
            required_resources = self._identify_required_resources(deliverable_type, requirements)

            # Estimate timeline
            timeline = self._estimate_creative_timeline(deliverable_type, requirements)

            # Create brief record
            brief_record = {
                "brief_id": brief_id,
                "project_id": project_id,
                "timestamp": timestamp,
                "deliverable_type": deliverable_type,
                "target_audience": target_audience,
                "objectives": objectives,
                "brand_guidelines": brand_guidelines,
                "creative_parameters": creative_parameters,
                "creative_direction": creative_direction,
                "success_criteria": success_criteria,
                "required_resources": required_resources,
                "timeline": timeline,
                "deadline": deadline,
                "status": "draft",
                "content": populated_brief
            }

            # Store brief
            self.briefs[brief_id] = brief_record

            self.logger.info(f"Creative brief {brief_id} created successfully for project {project_id}")

            return {
                "brief_id": brief_id,
                "project_id": project_id,
                "timestamp": timestamp,
                "created": True,
                "deliverable_type": deliverable_type,
                "content": populated_brief,
                "creative_direction": creative_direction,
                "success_criteria": success_criteria,
                "timeline": timeline,
                "required_resources": required_resources,
                "status": "draft"
            }

        except Exception as e:
            self.logger.error(f"Error creating creative brief for {project_id}: {str(e)}")
            return {
                "error": str(e),
                "brief_id": "",
                "created": False
            }

    def assign_creative_tasks(self, brief_id: str, team: List[str]) -> Dict[str, Any]:
        """
        Assign creative tasks to team members with workload balancing.

        Args:
            brief_id: Unique identifier for the creative brief
            team: List of team member identifiers

        Returns:
            Dict containing task assignments and workload distribution
        """
        try:
            self.logger.info(f"Assigning creative tasks for brief: {brief_id}")

            # Validate inputs
            if not brief_id or not team:
                raise ValueError("Invalid brief_id or team provided")

            # Retrieve brief
            brief = self.briefs.get(brief_id)
            if not brief:
                raise ValueError(f"Brief {brief_id} not found")

            timestamp = datetime.now().isoformat()

            # Break down brief into tasks
            task_breakdown = self._break_down_creative_tasks(brief)

            # Initialize team workloads if needed
            for member in team:
                if member not in self.team_workloads:
                    self.team_workloads[member] = []

            # Calculate current workload for each team member
            workload_scores = self._calculate_team_workloads(team)

            # Assign tasks with workload balancing
            assignments = self._assign_tasks_with_balancing(
                task_breakdown, team, workload_scores
            )

            # Estimate task durations
            for assignment in assignments:
                assignment['estimated_duration'] = self._estimate_task_duration(
                    assignment['task_type'], assignment['complexity']
                )
                assignment['deadline'] = self._calculate_task_deadline(
                    assignment['estimated_duration'], brief['deadline']
                )

            # Identify dependencies between tasks
            self._identify_task_dependencies(assignments)

            # Store task assignments
            for assignment in assignments:
                task_id = assignment['task_id']
                self.tasks[task_id] = assignment
                # Update team member workload
                assigned_to = assignment['assigned_to']
                if assigned_to in self.team_workloads:
                    self.team_workloads[assigned_to].append(task_id)

            # Generate task schedule
            schedule = self._generate_task_schedule(assignments, brief['deadline'])

            # Identify potential bottlenecks
            bottlenecks = self._identify_bottlenecks(assignments, workload_scores)

            self.logger.info(f"Assigned {len(assignments)} tasks for brief {brief_id}")

            return {
                "brief_id": brief_id,
                "timestamp": timestamp,
                "assigned": True,
                "tasks": assignments,
                "task_count": len(assignments),
                "team_assignments": self._group_tasks_by_team_member(assignments),
                "schedule": schedule,
                "workload_distribution": workload_scores,
                "bottlenecks": bottlenecks,
                "estimated_completion": schedule['completion_date']
            }

        except Exception as e:
            self.logger.error(f"Error assigning tasks for brief {brief_id}: {str(e)}")
            return {
                "error": str(e),
                "assigned": False,
                "tasks": []
            }

    def manage_revisions(self, asset_id: str, feedback: Dict[str, Any]) -> Dict[str, Any]:
        """
        Manage creative revisions based on feedback with version tracking.

        Args:
            asset_id: Unique identifier for the creative asset
            feedback: Dict containing feedback details and requested changes

        Returns:
            Dict containing revision details and tracking information
        """
        try:
            self.logger.info(f"Managing revision for asset: {asset_id}")

            # Validate inputs
            if not asset_id or not feedback:
                raise ValueError("Invalid asset_id or feedback provided")

            # Retrieve or create asset record
            asset = self.assets.get(asset_id, {
                "asset_id": asset_id,
                "versions": [],
                "current_version": 0
            })

            timestamp = datetime.now().isoformat()

            # Parse feedback
            feedback_items = self._parse_feedback(feedback)

            # Categorize feedback by type
            categorized_feedback = self._categorize_feedback(feedback_items)

            # Calculate revision complexity
            revision_complexity = self._calculate_revision_complexity(feedback_items)

            # Determine if major or minor revision
            revision_type = self._determine_revision_type(
                revision_complexity, categorized_feedback
            )

            # Increment version number
            current_version = asset.get('current_version', 0)
            if revision_type == 'major':
                new_version = current_version + 1.0
            else:
                new_version = current_version + 0.1

            # Create revision record
            revision_record = {
                "version": round(new_version, 1),
                "timestamp": timestamp,
                "revision_type": revision_type,
                "complexity": revision_complexity,
                "feedback": feedback_items,
                "categorized_feedback": categorized_feedback,
                "status": "pending",
                "requested_by": feedback.get('requester', 'unknown'),
                "priority": feedback.get('priority', 'normal')
            }

            # Estimate revision time
            revision_estimate = self._estimate_revision_time(
                revision_complexity, revision_type, categorized_feedback
            )
            revision_record['estimated_completion'] = revision_estimate['completion_date']

            # Add revision to asset versions
            if 'versions' not in asset:
                asset['versions'] = []
            asset['versions'].append(revision_record)
            asset['current_version'] = new_version
            asset['status'] = 'in_revision'

            # Store updated asset
            self.assets[asset_id] = asset

            # Generate revision instructions
            revision_instructions = self._generate_revision_instructions(
                feedback_items, categorized_feedback
            )

            # Determine if requires re-approval
            requires_reapproval = revision_type == 'major' or revision_complexity > 7

            self.logger.info(f"Revision {new_version} created for asset {asset_id}")

            return {
                "asset_id": asset_id,
                "timestamp": timestamp,
                "revision_number": round(new_version, 1),
                "previous_version": current_version,
                "revision_type": revision_type,
                "complexity": revision_complexity,
                "status": "pending",
                "feedback_items": feedback_items,
                "categorized_feedback": categorized_feedback,
                "revision_instructions": revision_instructions,
                "estimated_completion": revision_estimate['completion_date'],
                "estimated_hours": revision_estimate['hours'],
                "requires_reapproval": requires_reapproval,
                "version_history": [v['version'] for v in asset['versions']]
            }

        except Exception as e:
            self.logger.error(f"Error managing revision for asset {asset_id}: {str(e)}")
            return {
                "error": str(e),
                "revision_number": 0,
                "status": "error"
            }

    def approve_creative(self, asset_id: str) -> Dict[str, Any]:
        """
        Approve final creative assets with quality checklist.

        Args:
            asset_id: Unique identifier for the creative asset

        Returns:
            Dict containing approval status and checklist results
        """
        try:
            self.logger.info(f"Approving creative asset: {asset_id}")

            # Validate input
            if not asset_id:
                raise ValueError("Invalid asset_id provided")

            # Retrieve asset
            asset = self.assets.get(asset_id)
            if not asset:
                raise ValueError(f"Asset {asset_id} not found")

            timestamp = datetime.now().isoformat()

            # Generate approval checklist based on asset type
            asset_type = asset.get('type', 'general')
            checklist = self._generate_approval_checklist(asset_type)

            # Perform quality checks
            quality_results = self._perform_quality_checks(asset, checklist)

            # Calculate overall quality score
            quality_score = self._calculate_quality_score(quality_results)

            # Check brand compliance
            brand_compliance = self._check_brand_compliance(asset)

            # Verify technical specifications
            technical_verification = self._verify_technical_specs(asset)

            # Determine if asset meets approval threshold
            approval_threshold = self.config.get('approval_threshold', 85)
            meets_standards = quality_score >= approval_threshold

            # Compile issues found
            issues = self._compile_quality_issues(quality_results)

            # Make approval decision
            if meets_standards and len(issues) == 0:
                approval_status = "approved"
                asset['status'] = 'approved'
                asset['approved_at'] = timestamp
            elif quality_score >= 70 and len([i for i in issues if i['severity'] == 'critical']) == 0:
                approval_status = "approved_with_notes"
                asset['status'] = 'approved_with_notes'
                asset['approved_at'] = timestamp
            else:
                approval_status = "rejected"
                asset['status'] = 'requires_revisions'

            # Store updated asset
            self.assets[asset_id] = asset

            # Generate approval report
            approval_report = self._generate_approval_report(
                quality_results, brand_compliance, technical_verification, issues
            )

            # Generate next steps
            next_steps = self._determine_approval_next_steps(
                approval_status, issues, asset
            )

            self.logger.info(f"Asset {asset_id} {approval_status} with quality score: {quality_score}")

            return {
                "asset_id": asset_id,
                "timestamp": timestamp,
                "approved": approval_status in ["approved", "approved_with_notes"],
                "approval_status": approval_status,
                "quality_score": quality_score,
                "checklist_results": quality_results,
                "brand_compliance": brand_compliance,
                "technical_verification": technical_verification,
                "issues": issues,
                "approval_report": approval_report,
                "next_steps": next_steps,
                "current_version": asset.get('current_version', 1.0)
            }

        except Exception as e:
            self.logger.error(f"Error approving asset {asset_id}: {str(e)}")
            return {
                "error": str(e),
                "approved": False,
                "asset_id": asset_id
            }

    # Helper methods

    def _generate_brief_template(self, deliverable_type: str) -> Dict[str, List[str]]:
        """Generate brief template based on deliverable type."""
        templates = {
            "social_media": {
                "sections": ["Overview", "Target Audience", "Key Messages", "Visual Style",
                           "Tone of Voice", "Platform Specifications", "Deliverables"],
                "required_elements": ["brand_colors", "fonts", "image_dimensions", "hashtags"]
            },
            "video": {
                "sections": ["Concept", "Script Overview", "Visual Treatment", "Audio/Music",
                           "Duration", "Format Specifications", "Deliverables"],
                "required_elements": ["resolution", "aspect_ratio", "file_format", "frame_rate"]
            },
            "website": {
                "sections": ["Purpose", "User Journey", "Design Direction", "Content Strategy",
                           "Technical Requirements", "Responsive Behavior", "Deliverables"],
                "required_elements": ["pages", "breakpoints", "browser_support", "accessibility"]
            },
            "general": {
                "sections": ["Overview", "Objectives", "Target Audience", "Creative Direction",
                           "Specifications", "Deliverables"],
                "required_elements": ["format", "dimensions", "file_type"]
            }
        }
        return templates.get(deliverable_type, templates["general"])

    def _populate_brief_template(self, template: Dict[str, Any], requirements: Dict[str, Any],
                                 target_audience: str, objectives: List[str]) -> Dict[str, str]:
        """Populate brief template with requirements."""
        populated = {}

        populated["Overview"] = requirements.get('description', 'Creative project requiring production')
        populated["Target Audience"] = target_audience
        populated["Objectives"] = "\n".join(f"- {obj}" for obj in objectives)
        populated["Creative Direction"] = requirements.get('creative_direction', 'To be defined')
        populated["Specifications"] = str(requirements.get('specifications', {}))
        populated["Deliverables"] = requirements.get('deliverables', 'Final assets as specified')

        return populated

    def _extract_creative_parameters(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Extract key creative parameters from requirements."""
        return {
            "color_palette": requirements.get('brand_guidelines', {}).get('colors', []),
            "typography": requirements.get('brand_guidelines', {}).get('fonts', []),
            "imagery_style": requirements.get('imagery_style', 'modern'),
            "tone": requirements.get('tone', 'professional'),
            "dimensions": requirements.get('dimensions', {}),
            "file_format": requirements.get('file_format', 'png')
        }

    def _generate_creative_direction(self, deliverable_type: str, brand_guidelines: Dict[str, Any],
                                    objectives: List[str]) -> List[str]:
        """Generate creative direction statements."""
        directions = []

        if deliverable_type == "social_media":
            directions.append("Create eye-catching visuals optimized for social engagement")
            directions.append("Maintain brand consistency across all platforms")
        elif deliverable_type == "video":
            directions.append("Develop compelling narrative that captures attention in first 3 seconds")
            directions.append("Incorporate dynamic motion and brand elements")
        else:
            directions.append("Design should align with brand identity and objectives")
            directions.append("Prioritize clarity and visual impact")

        if brand_guidelines.get('style') == 'minimalist':
            directions.append("Use clean, minimalist aesthetic with ample whitespace")

        return directions

    def _define_success_criteria(self, deliverable_type: str, objectives: List[str]) -> List[str]:
        """Define success criteria for the creative."""
        criteria = [
            "Aligns with brand guidelines and identity",
            "Meets technical specifications and quality standards",
            "Achieves stated objectives",
            "Resonates with target audience"
        ]

        if deliverable_type == "social_media":
            criteria.append("Optimized for platform-specific engagement")
        elif deliverable_type == "video":
            criteria.append("Maintains viewer attention throughout duration")

        return criteria

    def _identify_required_resources(self, deliverable_type: str,
                                    requirements: Dict[str, Any]) -> Dict[str, List[str]]:
        """Identify required resources for creative production."""
        resources = {
            "team": [],
            "tools": [],
            "assets": []
        }

        if deliverable_type == "social_media":
            resources["team"] = ["Graphic Designer", "Copywriter"]
            resources["tools"] = ["Adobe Photoshop", "Canva"]
            resources["assets"] = ["Brand logos", "Stock photos", "Font files"]
        elif deliverable_type == "video":
            resources["team"] = ["Video Editor", "Motion Designer", "Sound Designer"]
            resources["tools"] = ["Adobe Premiere", "After Effects", "Audio editing software"]
            resources["assets"] = ["Video footage", "Music tracks", "Brand assets"]
        else:
            resources["team"] = ["Designer", "Creative Director"]
            resources["tools"] = ["Design software"]
            resources["assets"] = ["Brand assets"]

        return resources

    def _estimate_creative_timeline(self, deliverable_type: str,
                                   requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Estimate timeline for creative production."""
        base_hours = {
            "social_media": 8,
            "video": 40,
            "website": 80,
            "general": 16
        }

        hours = base_hours.get(deliverable_type, 16)
        complexity_multiplier = requirements.get('complexity', 1.0)
        total_hours = hours * complexity_multiplier

        start_date = datetime.now()
        completion_date = start_date + timedelta(hours=total_hours)

        return {
            "estimated_hours": total_hours,
            "start_date": start_date.isoformat(),
            "estimated_completion": completion_date.isoformat(),
            "milestones": [
                {"name": "Concept development", "percentage": 20},
                {"name": "First draft", "percentage": 50},
                {"name": "Revisions", "percentage": 80},
                {"name": "Final approval", "percentage": 100}
            ]
        }

    def _break_down_creative_tasks(self, brief: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Break down brief into specific tasks."""
        deliverable_type = brief['deliverable_type']
        tasks = []

        # Common tasks
        tasks.append({
            "task_id": str(uuid.uuid4()),
            "name": "Review creative brief",
            "task_type": "planning",
            "complexity": 2,
            "priority": "high"
        })

        tasks.append({
            "task_id": str(uuid.uuid4()),
            "name": "Develop initial concepts",
            "task_type": "concept",
            "complexity": 5,
            "priority": "high"
        })

        if deliverable_type == "social_media":
            tasks.extend([
                {
                    "task_id": str(uuid.uuid4()),
                    "name": "Design social media graphics",
                    "task_type": "design",
                    "complexity": 4,
                    "priority": "high"
                },
                {
                    "task_id": str(uuid.uuid4()),
                    "name": "Write post copy",
                    "task_type": "copywriting",
                    "complexity": 3,
                    "priority": "medium"
                }
            ])
        elif deliverable_type == "video":
            tasks.extend([
                {
                    "task_id": str(uuid.uuid4()),
                    "name": "Create storyboard",
                    "task_type": "planning",
                    "complexity": 4,
                    "priority": "high"
                },
                {
                    "task_id": str(uuid.uuid4()),
                    "name": "Edit video footage",
                    "task_type": "production",
                    "complexity": 7,
                    "priority": "high"
                }
            ])

        tasks.append({
            "task_id": str(uuid.uuid4()),
            "name": "Quality review and refinement",
            "task_type": "review",
            "complexity": 3,
            "priority": "medium"
        })

        return tasks

    def _calculate_team_workloads(self, team: List[str]) -> Dict[str, float]:
        """Calculate current workload score for each team member."""
        workloads = {}

        for member in team:
            assigned_tasks = self.team_workloads.get(member, [])
            # Calculate workload score (number of tasks * average complexity)
            task_count = len(assigned_tasks)
            workloads[member] = task_count * 5  # Simplified workload calculation

        return workloads

    def _assign_tasks_with_balancing(self, tasks: List[Dict[str, Any]], team: List[str],
                                    workloads: Dict[str, float]) -> List[Dict[str, Any]]:
        """Assign tasks to team members with workload balancing."""
        assignments = []

        # Sort team by current workload (ascending)
        sorted_team = sorted(team, key=lambda m: workloads.get(m, 0))

        # Round-robin assignment with preference for specialized skills
        team_index = 0
        for task in tasks:
            # Simple assignment strategy - in production would match skills
            assigned_member = sorted_team[team_index % len(sorted_team)]

            task['assigned_to'] = assigned_member
            task['status'] = 'assigned'
            task['assigned_at'] = datetime.now().isoformat()

            assignments.append(task)

            # Update workload
            workloads[assigned_member] = workloads.get(assigned_member, 0) + task['complexity']

            team_index += 1

        return assignments

    def _estimate_task_duration(self, task_type: str, complexity: int) -> float:
        """Estimate task duration in hours."""
        base_hours = {
            "planning": 2,
            "concept": 4,
            "design": 6,
            "copywriting": 3,
            "production": 8,
            "review": 2
        }

        return base_hours.get(task_type, 4) * (complexity / 5)

    def _calculate_task_deadline(self, duration_hours: float, project_deadline: str) -> str:
        """Calculate task deadline based on duration and project deadline."""
        deadline_dt = datetime.fromisoformat(project_deadline.replace('Z', '+00:00'))
        # Task should complete with buffer before project deadline
        task_deadline = deadline_dt - timedelta(days=2)
        return task_deadline.isoformat()

    def _identify_task_dependencies(self, assignments: List[Dict[str, Any]]) -> None:
        """Identify dependencies between tasks."""
        # Simple dependency logic - planning before execution
        planning_tasks = [t for t in assignments if t['task_type'] == 'planning']
        execution_tasks = [t for t in assignments if t['task_type'] not in ['planning', 'review']]
        review_tasks = [t for t in assignments if t['task_type'] == 'review']

        # Execution depends on planning
        for task in execution_tasks:
            task['depends_on'] = [t['task_id'] for t in planning_tasks]

        # Review depends on execution
        for task in review_tasks:
            task['depends_on'] = [t['task_id'] for t in execution_tasks]

    def _generate_task_schedule(self, assignments: List[Dict[str, Any]],
                               deadline: str) -> Dict[str, Any]:
        """Generate task schedule."""
        total_hours = sum(a.get('estimated_duration', 4) for a in assignments)
        start_date = datetime.now()
        completion_date = datetime.fromisoformat(deadline.replace('Z', '+00:00'))

        return {
            "start_date": start_date.isoformat(),
            "completion_date": completion_date.isoformat(),
            "total_estimated_hours": round(total_hours, 1),
            "working_days": (completion_date - start_date).days,
            "tasks_count": len(assignments)
        }

    def _identify_bottlenecks(self, assignments: List[Dict[str, Any]],
                            workloads: Dict[str, float]) -> List[str]:
        """Identify potential bottlenecks."""
        bottlenecks = []

        # Check for overloaded team members
        avg_workload = sum(workloads.values()) / len(workloads) if workloads else 0
        for member, workload in workloads.items():
            if workload > avg_workload * 1.5:
                bottlenecks.append(f"{member} is overloaded (workload: {workload:.1f})")

        # Check for dependency chains
        dependent_tasks = [t for t in assignments if 'depends_on' in t and t['depends_on']]
        if len(dependent_tasks) > len(assignments) * 0.7:
            bottlenecks.append("High task dependency may cause delays")

        return bottlenecks

    def _group_tasks_by_team_member(self, assignments: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Group tasks by assigned team member."""
        grouped = {}
        for assignment in assignments:
            member = assignment['assigned_to']
            if member not in grouped:
                grouped[member] = []
            grouped[member].append(assignment['name'])
        return grouped

    def _parse_feedback(self, feedback: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse feedback into structured items."""
        items = []

        feedback_text = feedback.get('comments', '')
        changes_requested = feedback.get('changes', [])

        # Parse structured changes
        for change in changes_requested:
            items.append({
                "type": change.get('type', 'general'),
                "description": change.get('description', ''),
                "severity": change.get('severity', 'minor'),
                "element": change.get('element', 'overall')
            })

        # Parse free-form feedback (simplified)
        if feedback_text and not changes_requested:
            items.append({
                "type": "general",
                "description": feedback_text,
                "severity": "minor",
                "element": "overall"
            })

        return items

    def _categorize_feedback(self, feedback_items: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Categorize feedback by type."""
        categories = {
            "design": [],
            "content": [],
            "technical": [],
            "brand": [],
            "general": []
        }

        for item in feedback_items:
            item_type = item['type']
            if item_type in categories:
                categories[item_type].append(item['description'])
            else:
                categories['general'].append(item['description'])

        return {k: v for k, v in categories.items() if v}  # Remove empty categories

    def _calculate_revision_complexity(self, feedback_items: List[Dict[str, Any]]) -> int:
        """Calculate revision complexity score (1-10)."""
        if not feedback_items:
            return 1

        severity_scores = {'minor': 1, 'moderate': 3, 'major': 5, 'critical': 8}
        total_score = sum(severity_scores.get(item['severity'], 1) for item in feedback_items)

        # Normalize to 1-10 scale
        normalized = min(total_score, 10)
        return normalized

    def _determine_revision_type(self, complexity: int,
                                 categorized_feedback: Dict[str, List[str]]) -> str:
        """Determine if revision is major or minor."""
        if complexity >= 7:
            return "major"
        elif 'brand' in categorized_feedback or 'design' in categorized_feedback:
            return "major"
        else:
            return "minor"

    def _estimate_revision_time(self, complexity: int, revision_type: str,
                               categorized_feedback: Dict[str, List[str]]) -> Dict[str, Any]:
        """Estimate time required for revision."""
        base_hours = 4 if revision_type == "minor" else 12
        complexity_multiplier = complexity / 5
        total_hours = base_hours * complexity_multiplier

        completion_date = datetime.now() + timedelta(hours=total_hours)

        return {
            "hours": round(total_hours, 1),
            "completion_date": completion_date.isoformat(),
            "revision_type": revision_type
        }

    def _generate_revision_instructions(self, feedback_items: List[Dict[str, Any]],
                                       categorized_feedback: Dict[str, List[str]]) -> List[str]:
        """Generate clear revision instructions."""
        instructions = []

        for category, items in categorized_feedback.items():
            instructions.append(f"{category.upper()} changes:")
            for item in items:
                instructions.append(f"  - {item}")

        return instructions

    def _generate_approval_checklist(self, asset_type: str) -> List[Dict[str, str]]:
        """Generate approval checklist for asset type."""
        common_checks = [
            {"item": "Brand compliance", "category": "brand"},
            {"item": "Visual quality", "category": "quality"},
            {"item": "Technical specifications met", "category": "technical"},
            {"item": "Objectives achieved", "category": "effectiveness"}
        ]

        type_specific = {
            "social_media": [
                {"item": "Platform dimensions correct", "category": "technical"},
                {"item": "Text readability on mobile", "category": "quality"},
                {"item": "Hashtags appropriate", "category": "content"}
            ],
            "video": [
                {"item": "Audio quality acceptable", "category": "quality"},
                {"item": "Video length within specs", "category": "technical"},
                {"item": "Transitions smooth", "category": "quality"}
            ]
        }

        checklist = common_checks + type_specific.get(asset_type, [])
        return checklist

    def _perform_quality_checks(self, asset: Dict[str, Any],
                               checklist: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Perform quality checks against checklist."""
        results = []

        for check in checklist:
            # Simulate check result (in production, would perform actual checks)
            import random
            passed = random.choice([True, True, True, False])  # 75% pass rate

            results.append({
                "item": check['item'],
                "category": check['category'],
                "passed": passed,
                "notes": "" if passed else "Requires attention"
            })

        return results

    def _calculate_quality_score(self, quality_results: List[Dict[str, Any]]) -> float:
        """Calculate overall quality score from check results."""
        if not quality_results:
            return 0

        passed_count = sum(1 for r in quality_results if r['passed'])
        total_count = len(quality_results)

        score = (passed_count / total_count) * 100
        return round(score, 1)

    def _check_brand_compliance(self, asset: Dict[str, Any]) -> Dict[str, Any]:
        """Check brand compliance."""
        # Simplified brand compliance check
        return {
            "compliant": True,
            "issues": [],
            "score": 95
        }

    def _verify_technical_specs(self, asset: Dict[str, Any]) -> Dict[str, Any]:
        """Verify technical specifications."""
        # Simplified technical verification
        return {
            "verified": True,
            "issues": [],
            "specs_met": ["format", "dimensions", "resolution"]
        }

    def _compile_quality_issues(self, quality_results: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Compile quality issues from check results."""
        issues = []

        for result in quality_results:
            if not result['passed']:
                issues.append({
                    "item": result['item'],
                    "category": result['category'],
                    "severity": "minor",
                    "notes": result.get('notes', '')
                })

        return issues

    def _generate_approval_report(self, quality_results: List[Dict[str, Any]],
                                 brand_compliance: Dict[str, Any],
                                 technical_verification: Dict[str, Any],
                                 issues: List[Dict[str, str]]) -> Dict[str, Any]:
        """Generate comprehensive approval report."""
        passed_checks = sum(1 for r in quality_results if r['passed'])
        total_checks = len(quality_results)

        return {
            "summary": f"Passed {passed_checks} of {total_checks} quality checks",
            "brand_compliance": brand_compliance['compliant'],
            "technical_compliance": technical_verification['verified'],
            "total_issues": len(issues),
            "critical_issues": len([i for i in issues if i.get('severity') == 'critical'])
        }

    def _determine_approval_next_steps(self, approval_status: str,
                                      issues: List[Dict[str, str]],
                                      asset: Dict[str, Any]) -> List[str]:
        """Determine next steps based on approval status."""
        if approval_status == "approved":
            return [
                "Asset ready for delivery",
                "Proceed with client presentation",
                "Archive final version"
            ]
        elif approval_status == "approved_with_notes":
            return [
                "Document minor notes for future reference",
                "Proceed with delivery",
                "Monitor for client feedback"
            ]
        else:
            return [
                f"Address {len(issues)} identified issues",
                "Submit for re-approval",
                "Communicate timeline to stakeholders"
            ]
