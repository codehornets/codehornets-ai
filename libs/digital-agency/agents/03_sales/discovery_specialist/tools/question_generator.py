"""
Question Generator Tool

Generates contextual discovery questions based on industry and situation.
"""

from typing import Dict, Any, List


class QuestionGenerator:
    """Tool for generating discovery questions."""

    def __init__(self):
        self.name = "Question Generator"

    def generate_questions(
        self, context: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """
        Generate discovery questions based on context.

        Args:
            context: Context information (industry, role, etc.)

        Returns:
            List of contextual questions
        """
        return [
            {
                "category": "current_state",
                "question": "What is your current process?",
            }
        ]

    def get_follow_up_questions(
        self, response: str, category: str
    ) -> List[str]:
        """
        Generate follow-up questions based on response.

        Args:
            response: Previous response
            category: Question category

        Returns:
            List of follow-up questions
        """
        return []
