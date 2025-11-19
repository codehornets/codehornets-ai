"""
Note Taker Tool

Captures and organizes discovery session notes.
"""

from typing import Dict, Any, List


class NoteTaker:
    """Tool for capturing and organizing discovery notes."""

    def __init__(self):
        self.name = "Note Taker"
        self.notes = []

    def capture_note(self, content: str, category: str) -> Dict[str, Any]:
        """
        Capture a discovery note.

        Args:
            content: Note content
            category: Note category

        Returns:
            Captured note
        """
        note = {
            "content": content,
            "category": category,
            "timestamp": None,
        }
        self.notes.append(note)
        return note

    def organize_notes(self) -> Dict[str, List[str]]:
        """
        Organize notes by category.

        Returns:
            Notes organized by category
        """
        organized = {}
        for note in self.notes:
            category = note["category"]
            if category not in organized:
                organized[category] = []
            organized[category].append(note["content"])
        return organized

    def generate_summary(self) -> str:
        """
        Generate summary from notes.

        Returns:
            Summary text
        """
        return "Discovery session summary"
