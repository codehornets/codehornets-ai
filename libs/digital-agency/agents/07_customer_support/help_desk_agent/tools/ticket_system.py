"""Ticket management system tool."""

from typing import Dict, Any, List


class TicketSystem:
    """Tool for managing support tickets."""

    def __init__(self):
        self.name = "Ticket System"
        self.tickets = {}

    def create(self, ticket_data: Dict[str, Any]) -> str:
        """Create a new ticket."""
        ticket_id = f"TKT-{len(self.tickets) + 1:05d}"
        self.tickets[ticket_id] = {
            **ticket_data,
            'id': ticket_id,
            'status': 'open',
            'created_at': 'timestamp'
        }
        return ticket_id

    def get(self, ticket_id: str) -> Dict[str, Any]:
        """Retrieve ticket by ID."""
        return self.tickets.get(ticket_id, {})

    def update(self, ticket_id: str, updates: Dict[str, Any]) -> bool:
        """Update ticket information."""
        if ticket_id in self.tickets:
            self.tickets[ticket_id].update(updates)
            return True
        return False

    def list_open_tickets(self) -> List[Dict[str, Any]]:
        """List all open tickets."""
        return [t for t in self.tickets.values() if t.get('status') == 'open']
