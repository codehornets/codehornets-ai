"""
BANT Scorer Tool

Scores leads using Budget, Authority, Need, Timeline framework.
"""

from typing import Dict, Any


class BANTScorer:
    """Tool for scoring leads using BANT methodology."""

    def __init__(self):
        self.name = "BANT Scorer"
        self.weights = {
            "budget": 0.25,
            "authority": 0.25,
            "need": 0.30,
            "timeline": 0.20,
        }

    def score(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Score a lead using BANT criteria.

        Args:
            lead_data: Lead information

        Returns:
            BANT score breakdown
        """
        budget_score = self._score_budget(lead_data.get("budget"))
        authority_score = self._score_authority(lead_data.get("authority_level"))
        need_score = self._score_need(lead_data.get("pain_points", []))
        timeline_score = self._score_timeline(lead_data.get("timeline"))

        total_score = (
            budget_score * self.weights["budget"] +
            authority_score * self.weights["authority"] +
            need_score * self.weights["need"] +
            timeline_score * self.weights["timeline"]
        ) * 100

        return {
            "total_score": round(total_score, 2),
            "budget_score": budget_score,
            "authority_score": authority_score,
            "need_score": need_score,
            "timeline_score": timeline_score,
            "breakdown": {
                "budget": f"{budget_score * self.weights['budget'] * 100:.1f}",
                "authority": f"{authority_score * self.weights['authority'] * 100:.1f}",
                "need": f"{need_score * self.weights['need'] * 100:.1f}",
                "timeline": f"{timeline_score * self.weights['timeline'] * 100:.1f}"
            }
        }

    def _score_budget(self, budget: Any) -> float:
        """Score budget (0.0-1.0)."""
        if budget is None:
            return 0.0
        if isinstance(budget, (int, float)):
            if budget >= 50000:
                return 1.0
            elif budget >= 10000:
                return 0.7
            elif budget >= 5000:
                return 0.4
            return 0.2
        return 0.0

    def _score_authority(self, authority_level: Any) -> float:
        """Score authority level (0.0-1.0)."""
        if not authority_level:
            return 0.0
        authority_map = {
            "decision_maker": 1.0,
            "influencer": 0.7,
            "champion": 0.8,
            "evaluator": 0.5,
            "end_user": 0.2
        }
        return authority_map.get(str(authority_level).lower(), 0.3)

    def _score_need(self, pain_points: list) -> float:
        """Score need based on pain points (0.0-1.0)."""
        if not pain_points or not isinstance(pain_points, list):
            return 0.0
        count = len(pain_points)
        if count >= 5:
            return 1.0
        elif count >= 3:
            return 0.8
        elif count >= 2:
            return 0.6
        elif count >= 1:
            return 0.4
        return 0.0

    def _score_timeline(self, timeline: Any) -> float:
        """Score timeline urgency (0.0-1.0)."""
        if not timeline:
            return 0.0
        timeline_map = {
            "immediate": 1.0,
            "1_month": 0.9,
            "3_months": 0.7,
            "6_months": 0.5,
            "1_year": 0.3,
            "no_timeline": 0.1
        }
        return timeline_map.get(str(timeline).lower(), 0.2)
