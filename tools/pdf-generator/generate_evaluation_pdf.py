#!/usr/bin/env python3
"""
PDF Evaluation Generator for Marie's Dance Evaluations

Converts markdown evaluations to professionally formatted PDFs
matching the APEXX evaluation format.
"""

import re
import sys
import json
from pathlib import Path
from typing import Dict, List, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


def parse_evaluation(markdown_content: str) -> Dict:
    """
    Extract structured data from Marie's markdown evaluation

    Args:
        markdown_content: Markdown text from Marie

    Returns:
        Dictionary with student_name, date, sections, and total_score
    """
    sections = []

    # Extract student name from title
    name_match = re.search(r'^#\s+(.+?)\s+-\s+Évaluation', markdown_content, re.MULTILINE)
    student_name = name_match.group(1).strip() if name_match else "Unknown"

    # Extract date if present
    date_match = re.search(r'Date:\s*(\d{4}-\d{2}-\d{2})', markdown_content)
    date = date_match.group(1) if date_match else "2025-11-13"

    # Extract sections with format: ## Title (score/total)
    section_pattern = r'##\s+(.+?)\s+\((\d+(?:\.\d+)?)/(\d+)\)\s*\n((?:(?!^##).)*)'

    for match in re.finditer(section_pattern, markdown_content, re.MULTILINE | re.DOTALL):
        title = match.group(1).strip()
        score = match.group(2)
        max_score = match.group(3)
        content = match.group(4).strip()

        # Clean up content
        content = content.replace('\n\n', ' ').replace('\n', ' ')
        content = re.sub(r'\s+', ' ', content).strip()

        sections.append({
            'title': title,
            'score': f"{score}/{max_score}",
            'content': content
        })

    # Extract total score
    total_match = re.search(r'Score Total:\s*(\d+)/100', markdown_content, re.IGNORECASE)
    total_score = total_match.group(1) if total_match else "0"

    return {
        'student_name': student_name,
        'date': date,
        'sections': sections,
        'total_score': total_score
    }


def create_evaluation_pdf(
    student_name: str,
    date: str,
    sections: List[Dict],
    total_score: str,
    output_path: str
) -> str:
    """
    Generate professional PDF evaluation

    Args:
        student_name: Student's name
        date: Evaluation date (YYYY-MM-DD)
        sections: List of evaluation sections
        total_score: Total score out of 100
        output_path: Where to save PDF

    Returns:
        Path to created PDF
    """
    # Create PDF document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=1*inch,
        rightMargin=1*inch,
        topMargin=1*inch,
        bottomMargin=1*inch
    )

    # Get base styles
    styles = getSampleStyleSheet()

    # Custom title style (bold, centered, underlined)
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        alignment=TA_CENTER,
        spaceAfter=20,
        underline=True,
        leading=18
    )

    # Section heading style (bold)
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        spaceAfter=6,
        spaceBefore=12,
        leading=14
    )

    # Body text style
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        alignment=TA_LEFT,
        spaceAfter=8
    )

    # Metadata style (smaller, for header info)
    meta_style = ParagraphStyle(
        'Metadata',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=12,
        spaceAfter=4
    )

    # Signature style (italic/oblique for cursive effect)
    signature_style = ParagraphStyle(
        'Signature',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=12,
        alignment=TA_LEFT,
        leading=14
    )

    # Build document story
    story = []

    # Title
    story.append(Paragraph(
        "<b><u>ÉVALUATION HIPHOP – SPORT-ÉTUDES APEXX</u></b>",
        title_style
    ))
    story.append(Spacer(1, 12))

    # Metadata header
    story.append(Paragraph(f"Nom: {student_name}", meta_style))
    story.append(Paragraph(f"Date: {date}", meta_style))
    story.append(Paragraph("Évalué par: Marie-Josée Corriveau", meta_style))
    story.append(Spacer(1, 20))

    # Evaluation sections
    for section in sections:
        # Section heading with score
        heading_text = f"<b>{section['title']} {section['score']} :</b>"
        story.append(Paragraph(heading_text, heading_style))

        # Section content
        story.append(Paragraph(section['content'], body_style))

    # Total score
    story.append(Spacer(1, 16))
    story.append(Paragraph(f"<b>TOTAL: {total_score}/100</b>", heading_style))
    story.append(Spacer(1, 24))

    # Signature line
    signature_text = "<i>Signature: Marie-Josée Corriveau</i>"
    story.append(Paragraph(signature_text, signature_style))

    # Build PDF
    doc.build(story)

    return output_path


def main():
    """
    CLI entry point for PDF generation

    Usage:
        python generate_evaluation_pdf.py input.md output.pdf

    Or with JSON:
        echo '{"markdown_path": "eval.md", "output_path": "eval.pdf"}' | python generate_evaluation_pdf.py
    """
    if len(sys.argv) >= 3:
        # Command line arguments
        markdown_path = sys.argv[1]
        output_path = sys.argv[2]
    else:
        # JSON input from stdin
        input_data = json.load(sys.stdin)
        markdown_path = input_data['markdown_path']
        output_path = input_data.get('output_path')

        if not output_path:
            # Generate output path from markdown path
            md_file = Path(markdown_path)
            output_path = str(md_file.with_suffix('.pdf'))

    # Read markdown
    with open(markdown_path, 'r', encoding='utf-8') as f:
        markdown_content = f.read()

    # Parse evaluation
    evaluation = parse_evaluation(markdown_content)

    # Validate structure
    if len(evaluation['sections']) < 1:
        print(f"Warning: Only found {len(evaluation['sections'])} sections", file=sys.stderr)

    # Generate PDF
    pdf_path = create_evaluation_pdf(
        student_name=evaluation['student_name'],
        date=evaluation['date'],
        sections=evaluation['sections'],
        total_score=evaluation['total_score'],
        output_path=output_path
    )

    # Output result
    result = {
        "status": "success",
        "pdf_path": pdf_path,
        "student_name": evaluation['student_name'],
        "total_score": evaluation['total_score'],
        "sections_count": len(evaluation['sections'])
    }

    print(json.dumps(result, indent=2))

    return 0


if __name__ == "__main__":
    sys.exit(main())
