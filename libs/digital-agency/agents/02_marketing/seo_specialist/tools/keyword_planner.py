"""Keyword Planner Tool"""

from typing import Dict, Any, List
from datetime import datetime


class KeywordPlannerTool:
    def __init__(self):
        self.name = "Keyword Planner"

    def get_keyword_ideas(self, seed_keyword: str) -> List[str]:
        return [seed_keyword]

    def get_search_volume(self, keyword: str) -> int:
        return 1000
