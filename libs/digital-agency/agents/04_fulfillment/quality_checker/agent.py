"""Quality Checker Agent - Quality assurance"""

from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import uuid


class QualityCheckerAgent:
    """Agent responsible for quality assurance and testing."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Quality Checker Agent."""
        self.config = config or {}
        self.name = "Quality Checker"
        self.role = "Quality Assurance Specialist"
        self.goal = "Ensure all deliverables meet quality standards"
        self.logger = logging.getLogger(__name__)

        # Initialize internal state
        self.checklists: Dict[str, List[Dict[str, Any]]] = {}
        self.qa_reports: Dict[str, Dict[str, Any]] = {}
        self.test_results: Dict[str, Dict[str, Any]] = {}

    def create_qa_checklist(self, deliverable_type: str) -> List[Dict[str, Any]]:
        """
        Create QA checklist for deliverable type.

        Args:
            deliverable_type: Type of deliverable being checked

        Returns:
            List of checklist items with criteria and weights
        """
        try:
            self.logger.info(f"Creating QA checklist for deliverable type: {deliverable_type}")

            # Validate input
            if not deliverable_type:
                raise ValueError("Invalid deliverable_type provided")

            # Generate checklist based on deliverable type
            checklist = self._generate_type_specific_checklist(deliverable_type)

            # Add common quality criteria
            common_criteria = self._get_common_quality_criteria()
            checklist.extend(common_criteria)

            # Assign weights and priorities
            for item in checklist:
                item['weight'] = self._calculate_item_weight(item)
                item['id'] = str(uuid.uuid4())

            # Store checklist
            checklist_id = str(uuid.uuid4())
            self.checklists[checklist_id] = checklist

            self.logger.info(f"Created QA checklist with {len(checklist)} items for {deliverable_type}")

            return checklist

        except Exception as e:
            self.logger.error(f"Error creating QA checklist for {deliverable_type}: {str(e)}")
            return []

    def perform_qa_review(self, deliverable_id: str) -> Dict[str, Any]:
        """
        Perform quality review of deliverable with scoring system.

        Args:
            deliverable_id: Unique identifier for the deliverable

        Returns:
            Dict containing review results, scores, and identified issues
        """
        try:
            self.logger.info(f"Performing QA review for deliverable: {deliverable_id}")

            # Validate input
            if not deliverable_id:
                raise ValueError("Invalid deliverable_id provided")

            timestamp = datetime.now().isoformat()
            review_id = str(uuid.uuid4())

            # Retrieve or generate checklist for this deliverable
            checklist = self._get_or_create_checklist_for_deliverable(deliverable_id)

            # Perform each check
            check_results = []
            total_score = 0
            max_possible_score = 0

            for item in checklist:
                result = self._perform_quality_check(item, deliverable_id)
                check_results.append(result)

                # Calculate weighted score
                item_score = result['score'] * item['weight']
                max_score = 100 * item['weight']

                total_score += item_score
                max_possible_score += max_score

            # Calculate overall quality score (0-100)
            overall_score = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0

            # Identify issues
            issues = self._identify_issues(check_results)

            # Categorize issues by severity
            critical_issues = [i for i in issues if i['severity'] == 'critical']
            major_issues = [i for i in issues if i['severity'] == 'major']
            minor_issues = [i for i in issues if i['severity'] == 'minor']

            # Determine pass/fail status
            passed = self._determine_pass_status(
                overall_score, critical_issues, major_issues
            )

            # Generate recommendations
            recommendations = self._generate_qa_recommendations(
                check_results, issues, overall_score
            )

            # Calculate compliance metrics
            compliance_metrics = self._calculate_compliance_metrics(check_results)

            # Create review record
            review_record = {
                "review_id": review_id,
                "deliverable_id": deliverable_id,
                "timestamp": timestamp,
                "overall_score": round(overall_score, 1),
                "passed": passed,
                "check_results": check_results,
                "issues": issues,
                "critical_count": len(critical_issues),
                "major_count": len(major_issues),
                "minor_count": len(minor_issues),
                "recommendations": recommendations,
                "compliance_metrics": compliance_metrics
            }

            # Store review
            self.qa_reports[review_id] = review_record

            self.logger.info(
                f"QA review completed for {deliverable_id}: "
                f"Score={overall_score:.1f}, Passed={passed}"
            )

            return review_record

        except Exception as e:
            self.logger.error(f"Error performing QA review for {deliverable_id}: {str(e)}")
            return {
                "error": str(e),
                "deliverable_id": deliverable_id,
                "passed": False,
                "issues": []
            }

    def test_deliverable(self, deliverable_id: str, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Execute test cases on deliverable with automated checks.

        Args:
            deliverable_id: Unique identifier for the deliverable
            test_cases: List of test case specifications

        Returns:
            Dict containing test execution results and statistics
        """
        try:
            self.logger.info(f"Testing deliverable: {deliverable_id} with {len(test_cases)} test cases")

            # Validate inputs
            if not deliverable_id or not test_cases:
                raise ValueError("Invalid deliverable_id or test_cases provided")

            timestamp = datetime.now().isoformat()
            test_run_id = str(uuid.uuid4())

            # Initialize test execution
            test_results = []
            tests_passed = 0
            tests_failed = 0
            tests_skipped = 0

            # Execute each test case
            for test_case in test_cases:
                test_result = self._execute_test_case(test_case, deliverable_id)
                test_results.append(test_result)

                # Update counters
                if test_result['status'] == 'passed':
                    tests_passed += 1
                elif test_result['status'] == 'failed':
                    tests_failed += 1
                elif test_result['status'] == 'skipped':
                    tests_skipped += 1

            # Calculate test metrics
            total_tests = len(test_cases)
            pass_rate = (tests_passed / total_tests * 100) if total_tests > 0 else 0

            # Categorize failures
            failure_categories = self._categorize_test_failures(
                [r for r in test_results if r['status'] == 'failed']
            )

            # Generate test summary
            test_summary = self._generate_test_summary(
                test_results, tests_passed, tests_failed, tests_skipped
            )

            # Identify blockers
            blockers = self._identify_test_blockers(test_results)

            # Create test report
            test_report = {
                "test_run_id": test_run_id,
                "deliverable_id": deliverable_id,
                "timestamp": timestamp,
                "tests_passed": tests_passed,
                "tests_failed": tests_failed,
                "tests_skipped": tests_skipped,
                "total_tests": total_tests,
                "pass_rate": round(pass_rate, 1),
                "details": test_results,
                "failure_categories": failure_categories,
                "summary": test_summary,
                "blockers": blockers,
                "all_tests_passed": tests_failed == 0
            }

            # Store test results
            self.test_results[test_run_id] = test_report

            self.logger.info(
                f"Test execution completed for {deliverable_id}: "
                f"{tests_passed}/{total_tests} passed ({pass_rate:.1f}%)"
            )

            return test_report

        except Exception as e:
            self.logger.error(f"Error testing deliverable {deliverable_id}: {str(e)}")
            return {
                "error": str(e),
                "tests_passed": 0,
                "tests_failed": 0,
                "details": []
            }

    def approve_quality(self, deliverable_id: str) -> Dict[str, Any]:
        """
        Approve deliverable quality with pass/fail criteria.

        Args:
            deliverable_id: Unique identifier for the deliverable

        Returns:
            Dict containing approval decision and supporting evidence
        """
        try:
            self.logger.info(f"Evaluating quality approval for deliverable: {deliverable_id}")

            # Validate input
            if not deliverable_id:
                raise ValueError("Invalid deliverable_id provided")

            timestamp = datetime.now().isoformat()

            # Retrieve recent QA review if exists
            qa_review = self._get_latest_qa_review(deliverable_id)

            # Retrieve recent test results if exists
            test_results = self._get_latest_test_results(deliverable_id)

            # Define approval criteria
            criteria_results = self._evaluate_approval_criteria(
                deliverable_id, qa_review, test_results
            )

            # Calculate overall approval score
            approval_score = self._calculate_approval_score(criteria_results)

            # Determine approval threshold
            approval_threshold = self.config.get('approval_threshold', 85)

            # Make approval decision
            approved = all(c['met'] for c in criteria_results if c['required']) and \
                      approval_score >= approval_threshold

            # Identify any blocking issues
            blocking_issues = self._identify_blocking_issues(qa_review, test_results)

            # Generate approval rationale
            rationale = self._generate_approval_rationale(
                approved, criteria_results, approval_score, blocking_issues
            )

            # Compile approval conditions
            conditions = self._compile_approval_conditions(
                approved, criteria_results, blocking_issues
            )

            # Generate sign-off checklist
            sign_off_checklist = self._generate_sign_off_checklist(deliverable_id)

            # Create approval record
            approval_record = {
                "deliverable_id": deliverable_id,
                "timestamp": timestamp,
                "approved": approved,
                "approval_score": round(approval_score, 1),
                "approval_threshold": approval_threshold,
                "criteria_results": criteria_results,
                "qa_review_score": qa_review.get('overall_score', 0) if qa_review else 0,
                "test_pass_rate": test_results.get('pass_rate', 0) if test_results else 0,
                "blocking_issues": blocking_issues,
                "rationale": rationale,
                "conditions": conditions,
                "sign_off_checklist": sign_off_checklist,
                "next_steps": self._determine_approval_next_steps(approved, blocking_issues)
            }

            self.logger.info(
                f"Quality approval decision for {deliverable_id}: "
                f"{'APPROVED' if approved else 'NOT APPROVED'} (score: {approval_score:.1f})"
            )

            return approval_record

        except Exception as e:
            self.logger.error(f"Error approving quality for {deliverable_id}: {str(e)}")
            return {
                "error": str(e),
                "approved": False,
                "deliverable_id": deliverable_id
            }

    # Helper methods

    def _generate_type_specific_checklist(self, deliverable_type: str) -> List[Dict[str, Any]]:
        """Generate type-specific QA checklist items."""
        checklists = {
            "website": [
                {"category": "functionality", "criterion": "All links functional", "priority": "critical"},
                {"category": "functionality", "criterion": "Forms submit correctly", "priority": "critical"},
                {"category": "design", "criterion": "Responsive across devices", "priority": "high"},
                {"category": "performance", "criterion": "Page load time < 3s", "priority": "high"},
                {"category": "accessibility", "criterion": "WCAG 2.1 AA compliance", "priority": "high"},
                {"category": "seo", "criterion": "Meta tags present", "priority": "medium"},
            ],
            "social_media": [
                {"category": "design", "criterion": "Correct dimensions for platform", "priority": "critical"},
                {"category": "brand", "criterion": "Brand guidelines followed", "priority": "critical"},
                {"category": "content", "criterion": "Copy is error-free", "priority": "high"},
                {"category": "content", "criterion": "Hashtags appropriate", "priority": "medium"},
            ],
            "video": [
                {"category": "technical", "criterion": "Correct resolution and format", "priority": "critical"},
                {"category": "audio", "criterion": "Audio levels consistent", "priority": "critical"},
                {"category": "content", "criterion": "No spelling errors in text", "priority": "high"},
                {"category": "brand", "criterion": "Brand logo visible", "priority": "high"},
            ],
            "general": [
                {"category": "quality", "criterion": "Meets specifications", "priority": "critical"},
                {"category": "brand", "criterion": "Brand compliant", "priority": "high"},
                {"category": "content", "criterion": "Error-free content", "priority": "high"},
            ]
        }

        return checklists.get(deliverable_type, checklists["general"])

    def _get_common_quality_criteria(self) -> List[Dict[str, Any]]:
        """Get common quality criteria applicable to all deliverables."""
        return [
            {"category": "quality", "criterion": "Professional quality standards met", "priority": "high"},
            {"category": "requirements", "criterion": "All requirements satisfied", "priority": "critical"},
            {"category": "documentation", "criterion": "Documentation complete", "priority": "medium"},
        ]

    def _calculate_item_weight(self, item: Dict[str, Any]) -> float:
        """Calculate weight for checklist item based on priority."""
        priority_weights = {
            "critical": 2.0,
            "high": 1.5,
            "medium": 1.0,
            "low": 0.5
        }
        return priority_weights.get(item['priority'], 1.0)

    def _get_or_create_checklist_for_deliverable(self, deliverable_id: str) -> List[Dict[str, Any]]:
        """Get or create checklist for specific deliverable."""
        # Simplified: generate a general checklist
        return self.create_qa_checklist("general")

    def _perform_quality_check(self, item: Dict[str, Any], deliverable_id: str) -> Dict[str, Any]:
        """Perform individual quality check."""
        # Simulate quality check (in production, would perform actual checks)
        import random

        # Higher priority items have stricter pass rates
        if item['priority'] == 'critical':
            passed = random.random() > 0.1  # 90% pass rate
        elif item['priority'] == 'high':
            passed = random.random() > 0.15  # 85% pass rate
        else:
            passed = random.random() > 0.2  # 80% pass rate

        score = 100 if passed else random.randint(40, 70)

        return {
            "item_id": item['id'],
            "category": item['category'],
            "criterion": item['criterion'],
            "priority": item['priority'],
            "passed": passed,
            "score": score,
            "notes": "" if passed else f"{item['criterion']} needs attention"
        }

    def _identify_issues(self, check_results: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Identify issues from check results."""
        issues = []

        for result in check_results:
            if not result['passed']:
                severity_map = {
                    "critical": "critical",
                    "high": "major",
                    "medium": "minor",
                    "low": "minor"
                }

                issues.append({
                    "issue": result['criterion'],
                    "category": result['category'],
                    "severity": severity_map.get(result['priority'], 'minor'),
                    "notes": result.get('notes', '')
                })

        return issues

    def _determine_pass_status(self, overall_score: float,
                              critical_issues: List[Dict],
                              major_issues: List[Dict]) -> bool:
        """Determine if deliverable passes QA."""
        # Fail if any critical issues
        if critical_issues:
            return False

        # Fail if score too low
        if overall_score < 70:
            return False

        # Fail if too many major issues
        if len(major_issues) > 3:
            return False

        return True

    def _generate_qa_recommendations(self, check_results: List[Dict[str, Any]],
                                    issues: List[Dict[str, str]],
                                    overall_score: float) -> List[str]:
        """Generate QA recommendations."""
        recommendations = []

        if overall_score < 70:
            recommendations.append("Major quality improvements required before approval")
        elif overall_score < 85:
            recommendations.append("Address identified issues to improve quality score")
        else:
            recommendations.append("Quality standards met, minor refinements suggested")

        # Category-specific recommendations
        categories_with_issues = set(i['category'] for i in issues)
        for category in categories_with_issues:
            category_issues = [i for i in issues if i['category'] == category]
            recommendations.append(
                f"Focus on {category} improvements ({len(category_issues)} issues)"
            )

        return recommendations

    def _calculate_compliance_metrics(self, check_results: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate compliance metrics by category."""
        categories = set(r['category'] for r in check_results)
        metrics = {}

        for category in categories:
            category_results = [r for r in check_results if r['category'] == category]
            passed_count = sum(1 for r in category_results if r['passed'])
            total_count = len(category_results)

            compliance_rate = (passed_count / total_count * 100) if total_count > 0 else 0
            metrics[category] = round(compliance_rate, 1)

        return metrics

    def _execute_test_case(self, test_case: Dict[str, Any], deliverable_id: str) -> Dict[str, Any]:
        """Execute individual test case."""
        import random

        test_id = test_case.get('id', str(uuid.uuid4()))
        test_name = test_case.get('name', 'Unnamed test')
        test_type = test_case.get('type', 'functional')

        # Simulate test execution
        if test_case.get('skip', False):
            status = 'skipped'
            passed = None
            error = None
        else:
            passed = random.random() > 0.15  # 85% pass rate
            status = 'passed' if passed else 'failed'
            error = None if passed else f"Test failed: {test_name}"

        return {
            "test_id": test_id,
            "name": test_name,
            "type": test_type,
            "status": status,
            "passed": passed,
            "error": error,
            "duration_ms": random.randint(100, 2000),
            "timestamp": datetime.now().isoformat()
        }

    def _categorize_test_failures(self, failed_tests: List[Dict[str, Any]]) -> Dict[str, int]:
        """Categorize test failures by type."""
        categories = {}

        for test in failed_tests:
            test_type = test.get('type', 'unknown')
            categories[test_type] = categories.get(test_type, 0) + 1

        return categories

    def _generate_test_summary(self, test_results: List[Dict[str, Any]],
                              passed: int, failed: int, skipped: int) -> str:
        """Generate test summary."""
        total = len(test_results)
        pass_rate = (passed / total * 100) if total > 0 else 0

        return (
            f"Executed {total} tests: {passed} passed, {failed} failed, {skipped} skipped. "
            f"Pass rate: {pass_rate:.1f}%"
        )

    def _identify_test_blockers(self, test_results: List[Dict[str, Any]]) -> List[str]:
        """Identify blocking test failures."""
        blockers = []

        for test in test_results:
            if test['status'] == 'failed' and test.get('blocking', False):
                blockers.append(f"BLOCKER: {test['name']} - {test.get('error', 'Unknown error')}")

        return blockers

    def _get_latest_qa_review(self, deliverable_id: str) -> Optional[Dict[str, Any]]:
        """Get latest QA review for deliverable."""
        # Simplified: return most recent review
        reviews = [r for r in self.qa_reports.values() if r.get('deliverable_id') == deliverable_id]
        if reviews:
            return sorted(reviews, key=lambda x: x['timestamp'], reverse=True)[0]
        return None

    def _get_latest_test_results(self, deliverable_id: str) -> Optional[Dict[str, Any]]:
        """Get latest test results for deliverable."""
        # Simplified: return most recent test results
        results = [r for r in self.test_results.values() if r.get('deliverable_id') == deliverable_id]
        if results:
            return sorted(results, key=lambda x: x['timestamp'], reverse=True)[0]
        return None

    def _evaluate_approval_criteria(self, deliverable_id: str,
                                   qa_review: Optional[Dict],
                                   test_results: Optional[Dict]) -> List[Dict[str, Any]]:
        """Evaluate approval criteria."""
        criteria = [
            {
                "name": "QA Review Passed",
                "required": True,
                "met": qa_review.get('passed', False) if qa_review else False,
                "score": qa_review.get('overall_score', 0) if qa_review else 0
            },
            {
                "name": "Test Cases Passed",
                "required": True,
                "met": test_results.get('all_tests_passed', False) if test_results else False,
                "score": test_results.get('pass_rate', 0) if test_results else 0
            },
            {
                "name": "No Critical Issues",
                "required": True,
                "met": qa_review.get('critical_count', 0) == 0 if qa_review else False,
                "score": 100 if (qa_review and qa_review.get('critical_count', 0) == 0) else 0
            },
            {
                "name": "Documentation Complete",
                "required": False,
                "met": True,  # Simplified
                "score": 100
            }
        ]

        return criteria

    def _calculate_approval_score(self, criteria_results: List[Dict[str, Any]]) -> float:
        """Calculate overall approval score."""
        if not criteria_results:
            return 0

        total_score = sum(c['score'] for c in criteria_results)
        avg_score = total_score / len(criteria_results)

        return avg_score

    def _identify_blocking_issues(self, qa_review: Optional[Dict],
                                  test_results: Optional[Dict]) -> List[str]:
        """Identify blocking issues."""
        blockers = []

        if qa_review and qa_review.get('critical_count', 0) > 0:
            blockers.append(f"{qa_review['critical_count']} critical QA issues found")

        if test_results and test_results.get('blockers'):
            blockers.extend(test_results['blockers'])

        return blockers

    def _generate_approval_rationale(self, approved: bool,
                                    criteria_results: List[Dict[str, Any]],
                                    approval_score: float,
                                    blocking_issues: List[str]) -> str:
        """Generate approval rationale."""
        if approved:
            return (
                f"Deliverable meets all required quality criteria with an approval score of "
                f"{approval_score:.1f}. All quality checks and tests have passed successfully."
            )
        else:
            unmet_criteria = [c['name'] for c in criteria_results if c['required'] and not c['met']]
            reasons = []

            if unmet_criteria:
                reasons.append(f"Required criteria not met: {', '.join(unmet_criteria)}")

            if blocking_issues:
                reasons.append(f"{len(blocking_issues)} blocking issues present")

            if approval_score < 85:
                reasons.append(f"Approval score ({approval_score:.1f}) below threshold")

            return "Deliverable not approved. " + "; ".join(reasons)

    def _compile_approval_conditions(self, approved: bool,
                                     criteria_results: List[Dict[str, Any]],
                                     blocking_issues: List[str]) -> List[str]:
        """Compile approval conditions."""
        if approved:
            return [
                "Maintain quality standards in future updates",
                "Document any changes made post-approval"
            ]
        else:
            conditions = []

            for criterion in criteria_results:
                if criterion['required'] and not criterion['met']:
                    conditions.append(f"Must satisfy: {criterion['name']}")

            if blocking_issues:
                conditions.append("Must resolve all blocking issues")

            return conditions

    def _generate_sign_off_checklist(self, deliverable_id: str) -> List[Dict[str, bool]]:
        """Generate sign-off checklist."""
        return [
            {"item": "QA review completed", "checked": True},
            {"item": "All tests passed", "checked": True},
            {"item": "Documentation reviewed", "checked": True},
            {"item": "Client requirements met", "checked": True},
            {"item": "Final approval granted", "checked": False}
        ]

    def _determine_approval_next_steps(self, approved: bool,
                                      blocking_issues: List[str]) -> List[str]:
        """Determine next steps based on approval decision."""
        if approved:
            return [
                "Proceed to delivery preparation",
                "Notify stakeholders of approval",
                "Archive quality documentation"
            ]
        else:
            steps = [
                "Address identified quality issues",
                "Re-run failed tests after fixes",
                "Submit for re-approval"
            ]

            if blocking_issues:
                steps.insert(0, "URGENT: Resolve blocking issues immediately")

            return steps
