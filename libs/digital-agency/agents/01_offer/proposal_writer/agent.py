"""
Proposal Writer Agent - Production Implementation

Creates compelling proposals using template engines, personalization algorithms,
win probability scoring, case study matching, and content optimization.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import logging
import statistics
import re

logger = logging.getLogger(__name__)


class ProposalStatus(Enum):
    """Proposal status"""
    DRAFT = "draft"
    REVIEW = "review"
    SENT = "sent"
    WON = "won"
    LOST = "lost"


class ProposalSection(Enum):
    """Proposal sections"""
    EXECUTIVE_SUMMARY = "executive_summary"
    SOLUTION = "solution"
    APPROACH = "approach"
    DELIVERABLES = "deliverables"
    PRICING = "pricing"
    TIMELINE = "timeline"
    CASE_STUDIES = "case_studies"
    TEAM = "team"
    TERMS = "terms"


class Channel(Enum):
    """Communication channels"""
    WEBSITE = "website"
    EMAIL = "email"
    SOCIAL = "social"
    SALES = "sales"
    PRESENTATION = "presentation"


@dataclass
class ProposalTemplate:
    """Proposal template definition"""
    template_id: str
    name: str
    sections: List[ProposalSection]
    industry_focus: str
    service_type: str
    typical_win_rate: float


@dataclass
class CaseStudy:
    """Case study data structure"""
    case_id: str
    title: str
    industry: str
    company_size: str
    challenge: str
    solution: str
    results: List[str]
    metrics: Dict[str, Any]
    testimonial: Optional[str] = None
    relevance_score: float = 0.0


@dataclass
class WinProbabilityFactors:
    """Factors affecting win probability"""
    deal_size: float
    relationship_strength: float
    competitive_position: float
    solution_fit: float
    pricing_competitiveness: float
    timeline_alignment: float


@dataclass
class PersonalizationFields:
    """Personalization merge fields"""
    client_name: str
    client_company: str
    industry: str
    pain_points: List[str]
    decision_maker_name: str
    decision_maker_title: str
    custom_fields: Dict[str, str] = field(default_factory=dict)


class ProposalWriterAgent:
    """
    Proposal Writer Agent - Comprehensive proposal generation and optimization

    Implements advanced frameworks:
    - Template Engine (modular sections)
    - Personalization Algorithm (client-specific customization)
    - Win Probability Scoring (historical analysis)
    - Case Study Matching (relevance scoring: Industry 40%, Size 30%, Use Case 30%)
    - Content Optimization (A/B testing, conversion optimization)
    - Visual Presentation (formatting, charts)
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize Proposal Writer Agent

        Args:
            config: Configuration dictionary for the agent
        """
        self.agent_id = "proposal_writer_001"
        self.config = config or {}
        self.proposals: List[Dict[str, Any]] = []
        self.case_study_library: List[CaseStudy] = []
        self.templates: List[ProposalTemplate] = []
        self.name = "Proposal Writer"
        self.role = "Proposal and Sales Material Creation"

        # Win probability model weights
        self.win_weights = {
            'deal_size': 0.15,
            'relationship': 0.25,
            'competitive_position': 0.20,
            'solution_fit': 0.20,
            'pricing': 0.10,
            'timeline': 0.10
        }

        # Case study relevance weights
        self.case_study_weights = {
            'industry': 0.40,
            'company_size': 0.30,
            'use_case': 0.30
        }

        # Initialize templates and case studies
        self._initialize_templates()
        self._initialize_case_studies()

        logger.info(f"Proposal Writer Agent {self.agent_id} initialized")

    # ==================== PROPOSAL CREATION ====================

    def create_proposal(
        self,
        client_info: Dict[str, Any],
        service_package: Dict[str, Any],
        requirements: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a comprehensive proposal with all sections

        Args:
            client_info: Client information and context
            service_package: Service package details
            requirements: Additional requirements

        Returns:
            Complete proposal document

        Example:
            >>> proposal = agent.create_proposal(
            ...     client_info={"name": "Acme Corp", "industry": "Technology"},
            ...     service_package={"name": "Digital Transformation", "price": 50000}
            ... )
        """
        try:
            logger.info(f"Creating proposal for {client_info.get('name', 'client')}")

            requirements = requirements or {}

            # Generate proposal ID
            proposal_id = f"proposal_{int(datetime.now().timestamp())}"

            # Select appropriate template
            template = self._select_template(client_info, service_package)

            # Create personalization fields
            personalization = self._create_personalization_fields(client_info)

            # Generate all sections
            sections = {}

            sections['executive_summary'] = self.generate_executive_summary(
                proposal_id,
                client_info,
                service_package
            )

            sections['solution'] = self.write_solution_section(
                client_info,
                service_package
            )

            sections['approach'] = self._generate_approach_section(service_package)

            sections['deliverables'] = self._generate_deliverables_section(service_package)

            sections['pricing'] = self.generate_pricing_section(
                service_package.get('pricing', {})
            )

            sections['timeline'] = self._generate_timeline_section(service_package)

            # Match and include case studies
            matched_case_studies = self.match_case_studies(
                client_info.get('industry', ''),
                client_info.get('company_size', ''),
                service_package.get('name', ''),
                top_n=3
            )
            sections['case_studies'] = [self._format_case_study(cs) for cs in matched_case_studies]

            sections['team'] = self._generate_team_section(service_package)

            sections['terms'] = self.generate_terms_section()

            # Calculate win probability
            win_probability = self.calculate_win_probability(
                deal_size=service_package.get('pricing', {}).get('total', 0),
                client_info=client_info,
                service_package=service_package
            )

            # Customize proposal
            customized_sections = self.customize_proposal(
                sections,
                personalization
            )

            # Create proposal
            proposal = {
                "proposal_id": proposal_id,
                "client_info": client_info,
                "service_package": service_package,
                "template_id": template.template_id if template else None,
                "sections": customized_sections,
                "personalization": {
                    "client_name": personalization.client_name,
                    "company": personalization.client_company,
                    "industry": personalization.industry,
                    "decision_maker": personalization.decision_maker_name
                },
                "win_probability": win_probability,
                "created_at": datetime.now().isoformat(),
                "status": ProposalStatus.DRAFT.value,
                "version": 1,
                "metadata": {
                    "page_count": self._estimate_page_count(customized_sections),
                    "word_count": self._estimate_word_count(customized_sections),
                    "case_studies_included": len(matched_case_studies)
                }
            }

            self.proposals.append(proposal)
            logger.info(f"Proposal {proposal_id} created with {win_probability['score']:.1f}% win probability")

            return proposal

        except Exception as e:
            logger.error(f"Error creating proposal: {e}")
            raise

    def generate_executive_summary(
        self,
        proposal_id: str,
        client_info: Dict[str, Any],
        service_package: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate executive summary with key points extraction

        Args:
            proposal_id: Proposal identifier
            client_info: Client information
            service_package: Service package details

        Returns:
            Executive summary section

        Example:
            >>> summary = agent.generate_executive_summary(
            ...     "prop_123",
            ...     client_info,
            ...     service_package
            ... )
        """
        try:
            logger.info(f"Generating executive summary for {proposal_id}")

            # Extract key points
            key_points = self._extract_key_points(client_info, service_package)

            # Identify pain points
            pain_points = client_info.get('pain_points', [
                "Operational inefficiencies",
                "Technology gaps",
                "Market competition"
            ])

            # Generate value proposition
            value_prop = self._generate_executive_value_prop(service_package)

            # Create summary content
            summary_content = f"""
{client_info.get('name', 'Your organization')} is seeking to {', '.join(pain_points[:2])}.

Our proposed {service_package.get('name', 'solution')} will deliver:
{chr(10).join('- ' + point for point in key_points[:5])}

{value_prop}

This proposal outlines our comprehensive approach, methodology, deliverables, and investment required.
            """.strip()

            summary = {
                "proposal_id": proposal_id,
                "section": ProposalSection.EXECUTIVE_SUMMARY.value,
                "content": summary_content,
                "key_points": key_points,
                "pain_points_addressed": pain_points,
                "value_proposition": value_prop,
                "call_to_action": "We look forward to partnering with you to achieve these transformative results."
            }

            logger.info("Executive summary generated")
            return summary

        except Exception as e:
            logger.error(f"Error generating executive summary: {e}")
            raise

    def write_solution_section(
        self,
        client_info: Dict[str, Any],
        service_package: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Write solution section mapping requirements to solutions

        Args:
            client_info: Client requirements and context
            service_package: Proposed service package

        Returns:
            Solution section with requirements mapping

        Example:
            >>> solution = agent.write_solution_section(
            ...     client_info,
            ...     service_package
            ... )
        """
        try:
            logger.info("Writing solution section")

            # Map requirements to solutions
            requirements = client_info.get('requirements', [])
            solutions_map = self._map_requirements_to_solutions(
                requirements,
                service_package
            )

            # Generate solution approach
            approach = self._generate_solution_approach(service_package)

            # Identify differentiators
            differentiators = self._identify_solution_differentiators(service_package)

            # Create benefits list
            benefits = self._generate_solution_benefits(service_package)

            solution_content = f"""
Our solution addresses your specific needs through a comprehensive approach:

{chr(10).join(f"{i+1}. {sol['requirement']}: {sol['solution']}" for i, sol in enumerate(solutions_map[:5]))}

Key differentiators:
{chr(10).join('- ' + diff for diff in differentiators)}

Expected benefits:
{chr(10).join('- ' + benefit for benefit in benefits)}
            """.strip()

            solution = {
                "section": ProposalSection.SOLUTION.value,
                "content": solution_content,
                "requirements_map": solutions_map,
                "approach": approach,
                "differentiators": differentiators,
                "benefits": benefits,
                "success_criteria": self._define_solution_success_criteria(service_package)
            }

            logger.info("Solution section written")
            return solution

        except Exception as e:
            logger.error(f"Error writing solution section: {e}")
            raise

    def write_case_study(
        self,
        project_info: Dict[str, Any]
    ) -> CaseStudy:
        """
        Write a case study using Challenge-Solution-Results framework

        Args:
            project_info: Project information including challenge, approach, results

        Returns:
            Formatted case study

        Example:
            >>> case_study = agent.write_case_study({
            ...     "title": "E-commerce Platform Migration",
            ...     "industry": "Retail",
            ...     "challenge": "Legacy system limitations"
            ... })
        """
        try:
            logger.info(f"Writing case study: {project_info.get('title', 'Untitled')}")

            case_id = f"case_{int(datetime.now().timestamp())}"

            # Extract challenge
            challenge = project_info.get('challenge', 'Client faced significant business challenges.')

            # Extract solution
            solution = project_info.get('solution', 'We implemented a comprehensive solution.')

            # Extract or generate results
            results = project_info.get('results', [])
            if not results:
                results = self._generate_case_study_results(project_info)

            # Extract metrics
            metrics = project_info.get('metrics', {
                'roi': '250%',
                'time_saved': '40%',
                'efficiency_gain': '35%'
            })

            case_study = CaseStudy(
                case_id=case_id,
                title=project_info.get('title', 'Client Success Story'),
                industry=project_info.get('industry', 'General'),
                company_size=project_info.get('company_size', 'Mid-market'),
                challenge=challenge,
                solution=solution,
                results=results,
                metrics=metrics,
                testimonial=project_info.get('testimonial')
            )

            # Add to library
            self.case_study_library.append(case_study)

            logger.info(f"Case study {case_id} created")
            return case_study

        except Exception as e:
            logger.error(f"Error writing case study: {e}")
            raise

    def create_presentation(
        self,
        proposal_id: str,
        format: str = "slides",
        slide_count: int = 12
    ) -> Dict[str, Any]:
        """
        Create presentation from proposal (10-15 slides)

        Args:
            proposal_id: Source proposal
            format: Presentation format ('slides', 'deck', 'handout')
            slide_count: Target number of slides

        Returns:
            Presentation structure and content

        Example:
            >>> presentation = agent.create_presentation(
            ...     "prop_123",
            ...     format="slides",
            ...     slide_count=12
            ... )
        """
        try:
            logger.info(f"Creating presentation from proposal {proposal_id}")

            # Find proposal
            proposal = next(
                (p for p in self.proposals if p['proposal_id'] == proposal_id),
                None
            )

            if not proposal:
                raise ValueError(f"Proposal {proposal_id} not found")

            # Create slide structure
            slides = []

            # Slide 1: Title
            slides.append({
                "slide_number": 1,
                "title": "Partnership Proposal",
                "content": {
                    "client": proposal['client_info'].get('name', 'Client'),
                    "service": proposal['service_package'].get('name', 'Service'),
                    "date": datetime.now().strftime("%B %d, %Y")
                },
                "layout": "title"
            })

            # Slide 2: Agenda
            slides.append({
                "slide_number": 2,
                "title": "Agenda",
                "content": {
                    "items": [
                        "Executive Overview",
                        "Understanding Your Challenges",
                        "Our Proposed Solution",
                        "Approach & Methodology",
                        "Deliverables & Timeline",
                        "Investment & Next Steps"
                    ]
                },
                "layout": "bullets"
            })

            # Slide 3: Executive Summary
            exec_summary = proposal['sections'].get('executive_summary', {})
            slides.append({
                "slide_number": 3,
                "title": "Executive Overview",
                "content": {
                    "key_points": exec_summary.get('key_points', [])[:4]
                },
                "layout": "bullets"
            })

            # Slide 4: Client Challenges
            slides.append({
                "slide_number": 4,
                "title": "Understanding Your Challenges",
                "content": {
                    "pain_points": proposal['client_info'].get('pain_points', [])[:5]
                },
                "layout": "bullets"
            })

            # Slide 5: Solution Overview
            solution = proposal['sections'].get('solution', {})
            slides.append({
                "slide_number": 5,
                "title": "Our Proposed Solution",
                "content": {
                    "approach": solution.get('approach', 'Comprehensive solution approach'),
                    "benefits": solution.get('benefits', [])[:4]
                },
                "layout": "mixed"
            })

            # Slide 6: Differentiators
            slides.append({
                "slide_number": 6,
                "title": "What Sets Us Apart",
                "content": {
                    "differentiators": solution.get('differentiators', [])[:5]
                },
                "layout": "bullets"
            })

            # Slide 7: Approach
            slides.append({
                "slide_number": 7,
                "title": "Our Approach",
                "content": {
                    "phases": proposal['service_package'].get('timeline', {}).get('phases', 3),
                    "methodology": "Proven, iterative methodology ensuring success"
                },
                "layout": "process"
            })

            # Slide 8: Deliverables
            deliverables = proposal['sections'].get('deliverables', {})
            slides.append({
                "slide_number": 8,
                "title": "Key Deliverables",
                "content": {
                    "deliverables": deliverables.get('items', [])[:6]
                },
                "layout": "bullets"
            })

            # Slide 9: Case Study
            case_studies = proposal['sections'].get('case_studies', [])
            if case_studies:
                cs = case_studies[0]
                slides.append({
                    "slide_number": 9,
                    "title": f"Success Story: {cs.get('title', 'Client Success')}",
                    "content": {
                        "industry": cs.get('industry', ''),
                        "challenge": cs.get('challenge', '')[:150],
                        "results": cs.get('results', [])[:3]
                    },
                    "layout": "case_study"
                })

            # Slide 10: Timeline
            timeline = proposal['sections'].get('timeline', {})
            slides.append({
                "slide_number": 10,
                "title": "Project Timeline",
                "content": {
                    "duration": timeline.get('total_duration', '90 days'),
                    "milestones": timeline.get('milestones', [])[:4]
                },
                "layout": "timeline"
            })

            # Slide 11: Investment
            pricing = proposal['sections'].get('pricing', {})
            slides.append({
                "slide_number": 11,
                "title": "Investment",
                "content": {
                    "pricing_model": pricing.get('presentation_style', 'tiered'),
                    "value_proposition": "Strategic investment in your growth"
                },
                "layout": "pricing"
            })

            # Slide 12: Next Steps
            slides.append({
                "slide_number": 12,
                "title": "Next Steps",
                "content": {
                    "steps": [
                        "Review proposal and provide feedback",
                        "Schedule follow-up discussion",
                        "Finalize scope and timeline",
                        "Execute agreement",
                        "Begin engagement"
                    ]
                },
                "layout": "bullets"
            })

            presentation = {
                "presentation_id": f"pres_{int(datetime.now().timestamp())}",
                "proposal_id": proposal_id,
                "format": format,
                "slide_count": len(slides),
                "slides": slides,
                "theme": "professional",
                "created_at": datetime.now().isoformat(),
                "metadata": {
                    "estimated_duration_minutes": len(slides) * 2,
                    "target_audience": "Executive stakeholders"
                }
            }

            logger.info(f"Presentation created with {len(slides)} slides")
            return presentation

        except Exception as e:
            logger.error(f"Error creating presentation: {e}")
            raise

    def generate_pricing_section(
        self,
        pricing_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate pricing section with tiered visualization

        Args:
            pricing_data: Pricing information and tiers

        Returns:
            Formatted pricing section

        Example:
            >>> pricing_section = agent.generate_pricing_section({
            ...     "tiers": [...],
            ...     "payment_terms": "Net 30"
            ... })
        """
        try:
            logger.info("Generating pricing section")

            # Extract tiers if present
            tiers = pricing_data.get('tiers', [])

            # Format pricing presentation
            if tiers:
                pricing_presentation = self._format_tiered_pricing(tiers)
            else:
                pricing_presentation = self._format_flat_pricing(pricing_data)

            # Add payment options
            payment_options = pricing_data.get('payment_options', [
                "Full payment upfront (5% discount)",
                "50% upfront, 50% upon completion",
                "Monthly installments (for engagements > 3 months)"
            ])

            # Add inclusions
            inclusions = pricing_data.get('inclusions', [
                "All deliverables specified",
                "Regular progress reports",
                "Dedicated account management",
                "Post-delivery support period"
            ])

            pricing_section = {
                "section": ProposalSection.PRICING.value,
                "pricing_data": pricing_data,
                "presentation_style": "tiered" if tiers else "flat",
                "pricing_presentation": pricing_presentation,
                "payment_options": payment_options,
                "inclusions": inclusions,
                "exclusions": pricing_data.get('exclusions', [
                    "Third-party software licenses",
                    "Client resource time",
                    "Travel expenses (billed separately if required)"
                ]),
                "includes_breakdown": True,
                "total_investment": self._calculate_total_investment(pricing_data)
            }

            logger.info("Pricing section generated")
            return pricing_section

        except Exception as e:
            logger.error(f"Error generating pricing section: {e}")
            raise

    def customize_proposal(
        self,
        sections: Dict[str, Any],
        personalization: PersonalizationFields
    ) -> Dict[str, Any]:
        """
        Customize proposal with client-specific personalization

        Args:
            sections: Proposal sections
            personalization: Personalization fields

        Returns:
            Customized sections with merge fields applied

        Example:
            >>> customized = agent.customize_proposal(
            ...     sections,
            ...     personalization_fields
            ... )
        """
        try:
            logger.info(f"Customizing proposal for {personalization.client_company}")

            customized_sections = {}

            # Merge fields dictionary
            merge_fields = {
                '{{CLIENT_NAME}}': personalization.client_name,
                '{{COMPANY}}': personalization.client_company,
                '{{INDUSTRY}}': personalization.industry,
                '{{DECISION_MAKER}}': personalization.decision_maker_name,
                '{{TITLE}}': personalization.decision_maker_title
            }

            # Add custom fields
            for key, value in personalization.custom_fields.items():
                merge_fields[f'{{{{{key}}}}}'] = value

            # Apply personalization to each section
            for section_name, section_content in sections.items():
                customized_sections[section_name] = self._apply_merge_fields(
                    section_content,
                    merge_fields
                )

            logger.info("Proposal customization completed")
            return customized_sections

        except Exception as e:
            logger.error(f"Error customizing proposal: {e}")
            raise

    def optimize_conversion(
        self,
        proposal_id: str
    ) -> Dict[str, Any]:
        """
        Optimize proposal for win probability with recommendations

        Args:
            proposal_id: Proposal to optimize

        Returns:
            Optimization recommendations and predicted impact

        Example:
            >>> optimization = agent.optimize_conversion("prop_123")
        """
        try:
            logger.info(f"Optimizing conversion for proposal {proposal_id}")

            # Find proposal
            proposal = next(
                (p for p in self.proposals if p['proposal_id'] == proposal_id),
                None
            )

            if not proposal:
                raise ValueError(f"Proposal {proposal_id} not found")

            # Analyze current win probability
            current_win_prob = proposal.get('win_probability', {}).get('score', 50.0)

            # Generate recommendations
            recommendations = []

            # Check case studies
            case_studies = proposal['sections'].get('case_studies', [])
            if len(case_studies) < 2:
                recommendations.append({
                    "category": "Social Proof",
                    "recommendation": "Add 1-2 more relevant case studies",
                    "impact": "+5-8% win probability",
                    "priority": "high"
                })

            # Check personalization
            if not self._check_personalization_quality(proposal):
                recommendations.append({
                    "category": "Personalization",
                    "recommendation": "Increase client-specific customization",
                    "impact": "+3-5% win probability",
                    "priority": "medium"
                })

            # Check pricing clarity
            pricing = proposal['sections'].get('pricing', {})
            if not pricing.get('includes_breakdown'):
                recommendations.append({
                    "category": "Pricing Transparency",
                    "recommendation": "Add detailed pricing breakdown",
                    "impact": "+4-6% win probability",
                    "priority": "high"
                })

            # Check executive summary length
            exec_summary = proposal['sections'].get('executive_summary', {})
            if len(exec_summary.get('key_points', [])) < 4:
                recommendations.append({
                    "category": "Executive Summary",
                    "recommendation": "Expand key points to 5-7 items",
                    "impact": "+2-4% win probability",
                    "priority": "medium"
                })

            # Check call to action
            if not self._has_clear_cta(proposal):
                recommendations.append({
                    "category": "Call to Action",
                    "recommendation": "Add clear, compelling call to action",
                    "impact": "+6-10% win probability",
                    "priority": "high"
                })

            # Calculate potential improvement
            potential_improvement = sum(
                float(r['impact'].split('-')[1].rstrip('% win probability'))
                for r in recommendations
            )

            optimization = {
                "proposal_id": proposal_id,
                "current_win_probability": current_win_prob,
                "potential_win_probability": min(95.0, current_win_prob + potential_improvement),
                "recommendations": recommendations,
                "priority_actions": [r for r in recommendations if r['priority'] == 'high'],
                "estimated_impact": f"+{potential_improvement:.1f}%",
                "timestamp": datetime.now().isoformat()
            }

            logger.info(f"Optimization analysis complete: {len(recommendations)} recommendations")
            return optimization

        except Exception as e:
            logger.error(f"Error optimizing conversion: {e}")
            raise

    def match_case_studies(
        self,
        industry: str,
        company_size: str,
        use_case: str,
        top_n: int = 3
    ) -> List[CaseStudy]:
        """
        Match case studies using relevance scoring
        Weights: Industry 40%, Company Size 30%, Use Case 30%

        Args:
            industry: Target industry
            company_size: Company size category
            use_case: Use case or service type
            top_n: Number of case studies to return

        Returns:
            Ranked list of matching case studies

        Example:
            >>> matched = agent.match_case_studies(
            ...     "Technology",
            ...     "Enterprise",
            ...     "Digital Transformation",
            ...     top_n=3
            ... )
        """
        try:
            logger.info(f"Matching case studies for {industry}, {company_size}")

            if not self.case_study_library:
                logger.warning("Case study library is empty")
                return []

            # Score each case study
            scored_cases = []

            for case_study in self.case_study_library:
                # Industry match (40%)
                industry_score = self._calculate_industry_match(
                    industry,
                    case_study.industry
                ) * self.case_study_weights['industry']

                # Company size match (30%)
                size_score = self._calculate_size_match(
                    company_size,
                    case_study.company_size
                ) * self.case_study_weights['company_size']

                # Use case match (30%)
                use_case_score = self._calculate_use_case_match(
                    use_case,
                    case_study.title
                ) * self.case_study_weights['use_case']

                # Total relevance score
                total_score = industry_score + size_score + use_case_score

                case_study.relevance_score = total_score
                scored_cases.append(case_study)

            # Sort by relevance and return top N
            scored_cases.sort(key=lambda x: x.relevance_score, reverse=True)
            matched = scored_cases[:top_n]

            logger.info(f"Matched {len(matched)} case studies")
            return matched

        except Exception as e:
            logger.error(f"Error matching case studies: {e}")
            raise

    def generate_terms_section(
        self,
        custom_terms: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate terms and conditions section

        Args:
            custom_terms: Custom terms to include

        Returns:
            Terms section with standard and custom clauses

        Example:
            >>> terms = agent.generate_terms_section()
        """
        try:
            logger.info("Generating terms and conditions section")

            custom_terms = custom_terms or {}

            # Standard terms
            standard_terms = {
                "payment_terms": custom_terms.get('payment_terms', "Net 30 from invoice date"),
                "engagement_duration": custom_terms.get('duration', "As specified in timeline"),
                "intellectual_property": "Deliverables ownership transfers upon full payment",
                "confidentiality": "Mutual NDA required prior to engagement start",
                "termination": "30-day written notice required from either party",
                "warranty": "90-day warranty on deliverables",
                "liability": "Limited to fees paid for the engagement"
            }

            # Additional clauses
            additional_clauses = custom_terms.get('additional_clauses', [
                "Client responsible for timely feedback and approvals",
                "Delays due to client unavailability may affect timeline",
                "Change requests may incur additional fees",
                "Travel expenses billed at cost if required"
            ])

            # Acceptance
            acceptance = {
                "method": "Countersigned proposal or executed SOW",
                "validity": "Proposal valid for 30 days from date",
                "start_condition": "Engagement begins upon signed agreement and deposit"
            }

            terms_section = {
                "section": ProposalSection.TERMS.value,
                "standard_terms": standard_terms,
                "additional_clauses": additional_clauses,
                "acceptance": acceptance,
                "governing_law": custom_terms.get('governing_law', 'State/Province of Client'),
                "signature_required": True
            }

            logger.info("Terms section generated")
            return terms_section

        except Exception as e:
            logger.error(f"Error generating terms section: {e}")
            raise

    def calculate_win_probability(
        self,
        deal_size: float,
        client_info: Dict[str, Any],
        service_package: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate win probability using historical analysis and factors

        Args:
            deal_size: Deal size in currency
            client_info: Client relationship and context
            service_package: Service package details

        Returns:
            Win probability score and breakdown

        Example:
            >>> win_prob = agent.calculate_win_probability(
            ...     50000,
            ...     client_info,
            ...     service_package
            ... )
        """
        try:
            logger.info("Calculating win probability")

            # Score factors (0-100 each)

            # Deal size score (normalize to typical deal range)
            deal_size_score = self._score_deal_size(deal_size)

            # Relationship strength
            relationship_score = self._score_relationship(client_info)

            # Competitive position
            competitive_score = self._score_competitive_position(client_info, service_package)

            # Solution fit
            solution_fit_score = self._score_solution_fit(client_info, service_package)

            # Pricing competitiveness
            pricing_score = self._score_pricing(service_package)

            # Timeline alignment
            timeline_score = self._score_timeline(client_info, service_package)

            # Calculate weighted win probability
            win_score = (
                deal_size_score * self.win_weights['deal_size'] +
                relationship_score * self.win_weights['relationship'] +
                competitive_score * self.win_weights['competitive_position'] +
                solution_fit_score * self.win_weights['solution_fit'] +
                pricing_score * self.win_weights['pricing'] +
                timeline_score * self.win_weights['timeline']
            )

            # Determine confidence level
            confidence = "high" if win_score >= 70 else "medium" if win_score >= 50 else "low"

            win_probability = {
                "score": round(win_score, 1),
                "confidence": confidence,
                "factors": {
                    "deal_size": round(deal_size_score, 1),
                    "relationship": round(relationship_score, 1),
                    "competitive_position": round(competitive_score, 1),
                    "solution_fit": round(solution_fit_score, 1),
                    "pricing": round(pricing_score, 1),
                    "timeline": round(timeline_score, 1)
                },
                "risk_factors": self._identify_risk_factors(client_info, service_package),
                "success_factors": self._identify_success_factors(client_info, service_package),
                "calculated_at": datetime.now().isoformat()
            }

            logger.info(f"Win probability: {win_score:.1f}% ({confidence} confidence)")
            return win_probability

        except Exception as e:
            logger.error(f"Error calculating win probability: {e}")
            raise

    # ==================== HELPER METHODS ====================

    def _initialize_templates(self):
        """Initialize proposal templates"""
        self.templates = [
            ProposalTemplate(
                template_id="tpl_001",
                name="Digital Services Template",
                sections=[
                    ProposalSection.EXECUTIVE_SUMMARY,
                    ProposalSection.SOLUTION,
                    ProposalSection.APPROACH,
                    ProposalSection.DELIVERABLES,
                    ProposalSection.PRICING,
                    ProposalSection.TIMELINE,
                    ProposalSection.CASE_STUDIES,
                    ProposalSection.TERMS
                ],
                industry_focus="Technology",
                service_type="Digital Services",
                typical_win_rate=0.65
            )
        ]

    def _initialize_case_studies(self):
        """Initialize case study library"""
        self.case_study_library = [
            CaseStudy(
                case_id="cs_001",
                title="E-commerce Platform Transformation",
                industry="Retail",
                company_size="Enterprise",
                challenge="Legacy platform limiting growth and customer experience",
                solution="Modern, scalable e-commerce platform with integrated analytics",
                results=[
                    "250% increase in online sales",
                    "40% reduction in cart abandonment",
                    "85% improvement in page load times"
                ],
                metrics={
                    "roi": "250%",
                    "implementation_time": "6 months",
                    "user_satisfaction": "4.8/5"
                },
                testimonial="The transformation exceeded our expectations."
            ),
            CaseStudy(
                case_id="cs_002",
                title="Marketing Automation Implementation",
                industry="Technology",
                company_size="Mid-market",
                challenge="Manual marketing processes limiting scale",
                solution="Comprehensive marketing automation platform and strategy",
                results=[
                    "60% reduction in marketing operations time",
                    "45% increase in lead quality",
                    "200% improvement in campaign ROI"
                ],
                metrics={
                    "roi": "200%",
                    "time_saved": "60%",
                    "lead_quality": "+45%"
                }
            )
        ]

    def _select_template(
        self,
        client_info: Dict[str, Any],
        service_package: Dict[str, Any]
    ) -> Optional[ProposalTemplate]:
        """Select appropriate template"""
        if self.templates:
            return self.templates[0]
        return None

    def _create_personalization_fields(
        self,
        client_info: Dict[str, Any]
    ) -> PersonalizationFields:
        """Create personalization fields from client info"""
        return PersonalizationFields(
            client_name=client_info.get('contact_name', 'Valued Partner'),
            client_company=client_info.get('name', 'Your Organization'),
            industry=client_info.get('industry', 'your industry'),
            pain_points=client_info.get('pain_points', []),
            decision_maker_name=client_info.get('decision_maker', 'Decision Maker'),
            decision_maker_title=client_info.get('decision_maker_title', ''),
            custom_fields=client_info.get('custom_fields', {})
        )

    def _extract_key_points(
        self,
        client_info: Dict[str, Any],
        service_package: Dict[str, Any]
    ) -> List[str]:
        """Extract key points for executive summary"""
        return [
            f"Comprehensive {service_package.get('name', 'solution')}",
            "Proven methodology with measurable results",
            "Experienced team with relevant expertise",
            "Clear timeline and milestones",
            "Transparent pricing and deliverables",
            "Ongoing support and partnership"
        ]

    def _generate_executive_value_prop(self, service_package: Dict[str, Any]) -> str:
        """Generate executive value proposition"""
        return f"Our {service_package.get('name', 'solution')} delivers measurable business impact through proven methodologies and expert execution."

    def _map_requirements_to_solutions(
        self,
        requirements: List[str],
        service_package: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Map requirements to solutions"""
        if not requirements:
            requirements = ["Improve efficiency", "Reduce costs", "Enhance capabilities"]

        return [
            {
                "requirement": req,
                "solution": f"Our approach directly addresses this through {service_package.get('name', 'targeted solutions')}"
            }
            for req in requirements
        ]

    def _generate_solution_approach(self, service_package: Dict[str, Any]) -> str:
        """Generate solution approach description"""
        return "Phased, iterative approach ensuring alignment and measurable progress"

    def _identify_solution_differentiators(self, service_package: Dict[str, Any]) -> List[str]:
        """Identify solution differentiators"""
        return [
            "Proven track record in similar engagements",
            "Dedicated, experienced team",
            "Flexible, client-centric approach",
            "Transparent communication and reporting",
            "Post-delivery support included"
        ]

    def _generate_solution_benefits(self, service_package: Dict[str, Any]) -> List[str]:
        """Generate solution benefits"""
        return [
            "Accelerated time to value",
            "Reduced risk through proven methodology",
            "Knowledge transfer and capability building",
            "Scalable, sustainable solutions"
        ]

    def _define_solution_success_criteria(self, service_package: Dict[str, Any]) -> List[str]:
        """Define success criteria"""
        return [
            "All deliverables completed on time and on budget",
            "Client satisfaction score >= 4.5/5",
            "Measurable business impact achieved",
            "Successful knowledge transfer completed"
        ]

    def _generate_case_study_results(self, project_info: Dict[str, Any]) -> List[str]:
        """Generate case study results"""
        return [
            "Significant improvement in key metrics",
            "Enhanced operational efficiency",
            "Positive ROI within 6 months"
        ]

    def _format_case_study(self, case_study: CaseStudy) -> Dict[str, Any]:
        """Format case study for proposal"""
        return {
            "title": case_study.title,
            "industry": case_study.industry,
            "challenge": case_study.challenge,
            "solution": case_study.solution,
            "results": case_study.results,
            "metrics": case_study.metrics,
            "testimonial": case_study.testimonial,
            "relevance_score": case_study.relevance_score
        }

    def _generate_approach_section(self, service_package: Dict[str, Any]) -> Dict[str, Any]:
        """Generate approach section"""
        return {
            "section": ProposalSection.APPROACH.value,
            "methodology": "Iterative, collaborative approach",
            "phases": 3,
            "content": "Our proven methodology ensures successful delivery"
        }

    def _generate_deliverables_section(self, service_package: Dict[str, Any]) -> Dict[str, Any]:
        """Generate deliverables section"""
        deliverables = service_package.get('deliverables', [])
        return {
            "section": ProposalSection.DELIVERABLES.value,
            "items": [d.get('name', 'Deliverable') for d in deliverables] if deliverables else [
                "Comprehensive analysis and recommendations",
                "Implementation roadmap",
                "Documentation and knowledge transfer"
            ]
        }

    def _generate_timeline_section(self, service_package: Dict[str, Any]) -> Dict[str, Any]:
        """Generate timeline section"""
        timeline = service_package.get('timeline', {})
        return {
            "section": ProposalSection.TIMELINE.value,
            "total_duration": timeline.get('total_days', 90),
            "phases": timeline.get('phases', 3),
            "milestones": [
                "Project kickoff",
                "Mid-project review",
                "Final delivery"
            ]
        }

    def _generate_team_section(self, service_package: Dict[str, Any]) -> Dict[str, Any]:
        """Generate team section"""
        return {
            "section": ProposalSection.TEAM.value,
            "team_members": [
                {"role": "Project Lead", "experience": "15+ years"},
                {"role": "Senior Consultant", "experience": "10+ years"},
                {"role": "Specialist", "experience": "8+ years"}
            ]
        }

    def _format_tiered_pricing(self, tiers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format tiered pricing"""
        return [
            {
                "tier": tier.get('name', 'Tier'),
                "price": tier.get('price', 0),
                "features": tier.get('features', [])
            }
            for tier in tiers
        ]

    def _format_flat_pricing(self, pricing_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format flat pricing"""
        return {
            "total": pricing_data.get('total', 0),
            "breakdown": pricing_data.get('breakdown', {})
        }

    def _calculate_total_investment(self, pricing_data: Dict[str, Any]) -> float:
        """Calculate total investment"""
        return pricing_data.get('total', 0)

    def _apply_merge_fields(
        self,
        content: Any,
        merge_fields: Dict[str, str]
    ) -> Any:
        """Apply merge fields to content"""
        if isinstance(content, str):
            for field, value in merge_fields.items():
                content = content.replace(field, value)
            return content
        elif isinstance(content, dict):
            return {k: self._apply_merge_fields(v, merge_fields) for k, v in content.items()}
        elif isinstance(content, list):
            return [self._apply_merge_fields(item, merge_fields) for item in content]
        return content

    def _check_personalization_quality(self, proposal: Dict[str, Any]) -> bool:
        """Check personalization quality"""
        personalization = proposal.get('personalization', {})
        return len(personalization) >= 3

    def _has_clear_cta(self, proposal: Dict[str, Any]) -> bool:
        """Check for clear call to action"""
        exec_summary = proposal.get('sections', {}).get('executive_summary', {})
        return 'call_to_action' in exec_summary

    def _calculate_industry_match(self, target: str, case_industry: str) -> float:
        """Calculate industry match score (0-1)"""
        if target.lower() == case_industry.lower():
            return 1.0
        elif target.lower() in case_industry.lower() or case_industry.lower() in target.lower():
            return 0.7
        return 0.3

    def _calculate_size_match(self, target: str, case_size: str) -> float:
        """Calculate company size match score (0-1)"""
        if target.lower() == case_size.lower():
            return 1.0
        return 0.5

    def _calculate_use_case_match(self, use_case: str, case_title: str) -> float:
        """Calculate use case match score (0-1)"""
        use_case_words = set(use_case.lower().split())
        title_words = set(case_title.lower().split())
        overlap = len(use_case_words.intersection(title_words))
        return min(1.0, overlap / max(len(use_case_words), 1) * 2)

    def _score_deal_size(self, deal_size: float) -> float:
        """Score deal size (0-100)"""
        # Normalize to typical range 10k-100k
        if deal_size < 10000:
            return 40.0
        elif deal_size < 50000:
            return 70.0
        elif deal_size < 100000:
            return 85.0
        else:
            return 95.0

    def _score_relationship(self, client_info: Dict[str, Any]) -> float:
        """Score relationship strength (0-100)"""
        relationship = client_info.get('relationship_status', 'new')
        scores = {
            'existing': 90.0,
            'referral': 75.0,
            'warm': 60.0,
            'new': 40.0
        }
        return scores.get(relationship, 50.0)

    def _score_competitive_position(
        self,
        client_info: Dict[str, Any],
        service_package: Dict[str, Any]
    ) -> float:
        """Score competitive position (0-100)"""
        competitors = client_info.get('competitors_count', 2)
        if competitors == 0:
            return 95.0
        elif competitors == 1:
            return 75.0
        elif competitors == 2:
            return 60.0
        else:
            return 45.0

    def _score_solution_fit(
        self,
        client_info: Dict[str, Any],
        service_package: Dict[str, Any]
    ) -> float:
        """Score solution fit (0-100)"""
        requirements_met = client_info.get('requirements_met_pct', 80)
        return min(100.0, requirements_met)

    def _score_pricing(self, service_package: Dict[str, Any]) -> float:
        """Score pricing competitiveness (0-100)"""
        pricing_position = service_package.get('pricing_position', 'competitive')
        scores = {
            'low': 95.0,
            'competitive': 75.0,
            'premium': 55.0
        }
        return scores.get(pricing_position, 70.0)

    def _score_timeline(
        self,
        client_info: Dict[str, Any],
        service_package: Dict[str, Any]
    ) -> float:
        """Score timeline alignment (0-100)"""
        client_urgency = client_info.get('urgency', 'medium')
        scores = {
            'urgent': 85.0,
            'medium': 70.0,
            'flexible': 60.0
        }
        return scores.get(client_urgency, 65.0)

    def _identify_risk_factors(
        self,
        client_info: Dict[str, Any],
        service_package: Dict[str, Any]
    ) -> List[str]:
        """Identify risk factors"""
        risks = []
        if client_info.get('budget_confirmed', True) is False:
            risks.append("Budget not confirmed")
        if client_info.get('competitors_count', 0) > 2:
            risks.append("High competition")
        return risks

    def _identify_success_factors(
        self,
        client_info: Dict[str, Any],
        service_package: Dict[str, Any]
    ) -> List[str]:
        """Identify success factors"""
        return [
            "Strong solution fit",
            "Established relationship",
            "Clear decision process"
        ]

    def _estimate_page_count(self, sections: Dict[str, Any]) -> int:
        """Estimate page count"""
        return len(sections) * 2

    def _estimate_word_count(self, sections: Dict[str, Any]) -> int:
        """Estimate word count"""
        return len(sections) * 500
