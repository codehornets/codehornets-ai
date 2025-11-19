"""
Operations & Administration Domain

This domain handles finance, legal, HR, IT support, office management,
and compliance functions for the digital agency.
"""

from .finance_manager.agent import FinanceManagerAgent
from .legal_coordinator.agent import LegalCoordinatorAgent
from .hr_specialist.agent import HRSpecialistAgent
from .it_support.agent import ITSupportAgent
from .office_manager.agent import OfficeManagerAgent
from .compliance_officer.agent import ComplianceOfficerAgent

__all__ = [
    "FinanceManagerAgent",
    "LegalCoordinatorAgent",
    "HRSpecialistAgent",
    "ITSupportAgent",
    "OfficeManagerAgent",
    "ComplianceOfficerAgent",
]
