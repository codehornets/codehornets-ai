"""Hashtag Generator Tool"""

from typing import List
from datetime import datetime


class HashtagGeneratorTool:
    def __init__(self):
        self.name = "Hashtag Generator"

    def generate_hashtags(self, topic: str, count: int = 5) -> List[str]:
        return [f"#{topic.lower().replace(' ', '')}"]
