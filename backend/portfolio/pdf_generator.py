"""
PDF Resume Generator for DevSync Portfolio.

This module generates professional PDF resumes from user portfolio data.
"""

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class ResumeGenerator:
    """Generate professional PDF resumes."""

    def __init__(self, user_data: dict):
        self.user = user_data
        self.buffer = BytesIO()
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Setup custom paragraph styles."""
        # Name style
        self.styles.add(
            ParagraphStyle(
                name="Name",
                parent=self.styles["Heading1"],
                fontSize=24,
                textColor=colors.HexColor("#1a1a2e"),
                spaceAfter=6,
                alignment=TA_CENTER,
            )
        )

        # Custom Title style (use different name to avoid conflict)
        self.styles.add(
            ParagraphStyle(
                name="ResumeTitle",
                parent=self.styles["Normal"],
                fontSize=14,
                textColor=colors.HexColor("#6b21a8"),
                spaceAfter=12,
                alignment=TA_CENTER,
            )
        )

        # Section header
        self.styles.add(
            ParagraphStyle(
                name="SectionHeader",
                parent=self.styles["Heading2"],
                fontSize=14,
                textColor=colors.HexColor("#1a1a2e"),
                spaceBefore=16,
                spaceAfter=8,
                borderPadding=(0, 0, 4, 0),
            )
        )

        # Job title
        self.styles.add(
            ParagraphStyle(
                name="JobTitle",
                parent=self.styles["Normal"],
                fontSize=12,
                textColor=colors.HexColor("#1a1a2e"),
                fontName="Helvetica-Bold",
            )
        )

        # Company/Institution
        self.styles.add(
            ParagraphStyle(
                name="Company",
                parent=self.styles["Normal"],
                fontSize=11,
                textColor=colors.HexColor("#6b21a8"),
            )
        )

        # Date range
        self.styles.add(
            ParagraphStyle(
                name="DateRange",
                parent=self.styles["Normal"],
                fontSize=10,
                textColor=colors.HexColor("#666666"),
            )
        )

        # Custom Body text (renamed to avoid conflict)
        self.styles.add(
            ParagraphStyle(
                name="ResumeBodyText",
                parent=self.styles["Normal"],
                fontSize=10,
                textColor=colors.HexColor("#333333"),
                alignment=TA_JUSTIFY,
                spaceAfter=8,
            )
        )

        # Contact info
        self.styles.add(
            ParagraphStyle(
                name="Contact",
                parent=self.styles["Normal"],
                fontSize=10,
                textColor=colors.HexColor("#333333"),
                alignment=TA_CENTER,
            )
        )

        # Skill tag
        self.styles.add(
            ParagraphStyle(
                name="Skill",
                parent=self.styles["Normal"],
                fontSize=10,
                textColor=colors.HexColor("#1a1a2e"),
            )
        )

    def _add_header(self, elements):
        """Add header with name and contact info."""
        # Full name
        full_name = f"{self.user.get('first_name', '')} {self.user.get('last_name', '')}".strip()
        if not full_name:
            full_name = self.user.get("email", "").split("@")[0]
        elements.append(Paragraph(full_name, self.styles["Name"]))

        # Professional title
        if self.user.get("title"):
            elements.append(Paragraph(self.user["title"], self.styles["ResumeTitle"]))

        # Contact info line
        contact_parts = []
        if self.user.get("email"):
            contact_parts.append(self.user["email"])
        if self.user.get("github_username"):
            contact_parts.append(f"github.com/{self.user['github_username']}")
        if self.user.get("linkedin_url"):
            contact_parts.append("LinkedIn")
        if self.user.get("portfolio_url"):
            contact_parts.append(self.user["portfolio_url"])

        if contact_parts:
            elements.append(
                Paragraph(" | ".join(contact_parts), self.styles["Contact"])
            )

        elements.append(Spacer(1, 12))
        elements.append(
            HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e0e0e0"))
        )

    def _add_summary(self, elements):
        """Add professional summary/bio."""
        if self.user.get("bio"):
            elements.append(
                Paragraph("PROFESSIONAL SUMMARY", self.styles["SectionHeader"])
            )
            elements.append(
                HRFlowable(
                    width="100%", thickness=0.5, color=colors.HexColor("#6b21a8")
                )
            )
            elements.append(Spacer(1, 6))
            elements.append(Paragraph(self.user["bio"], self.styles["ResumeBodyText"]))

    def _add_experience(self, elements):
        """Add work experience section."""
        experiences = self.user.get("experiences", [])
        if not experiences:
            return

        elements.append(Paragraph("WORK EXPERIENCE", self.styles["SectionHeader"]))
        elements.append(
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#6b21a8"))
        )
        elements.append(Spacer(1, 6))

        for exp in experiences:
            # Position and company
            elements.append(Paragraph(exp.get("position", ""), self.styles["JobTitle"]))
            elements.append(Paragraph(exp.get("company", ""), self.styles["Company"]))

            # Date range
            start = exp.get("start_date", "")[:7] if exp.get("start_date") else ""
            end = (
                "Present"
                if exp.get("is_current")
                else (exp.get("end_date", "")[:7] if exp.get("end_date") else "")
            )
            if start:
                date_str = f"{start} - {end}"
                if exp.get("location"):
                    date_str += f" | {exp['location']}"
                elements.append(Paragraph(date_str, self.styles["DateRange"]))

            # Description
            if exp.get("description"):
                elements.append(Spacer(1, 4))
                elements.append(
                    Paragraph(exp["description"], self.styles["ResumeBodyText"])
                )

            elements.append(Spacer(1, 8))

    def _add_education(self, elements):
        """Add education section."""
        education = self.user.get("education", [])
        if not education:
            return

        elements.append(Paragraph("EDUCATION", self.styles["SectionHeader"]))
        elements.append(
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#6b21a8"))
        )
        elements.append(Spacer(1, 6))

        for edu in education:
            elements.append(Paragraph(edu.get("degree", ""), self.styles["JobTitle"]))
            elements.append(
                Paragraph(
                    f"{edu.get('institution', '')} - {edu.get('field_of_study', '')}",
                    self.styles["Company"],
                )
            )

            # Date range
            start = edu.get("start_date", "")[:7] if edu.get("start_date") else ""
            end = (
                "Present"
                if edu.get("is_current")
                else (edu.get("end_date", "")[:7] if edu.get("end_date") else "")
            )
            date_str = f"{start} - {end}" if start else ""
            if edu.get("grade"):
                date_str += f" | Grade: {edu['grade']}"
            if date_str:
                elements.append(Paragraph(date_str, self.styles["DateRange"]))

            if edu.get("description"):
                elements.append(Spacer(1, 4))
                elements.append(
                    Paragraph(edu["description"], self.styles["ResumeBodyText"])
                )

            elements.append(Spacer(1, 8))

    def _add_skills(self, elements):
        """Add skills section."""
        skills = self.user.get("skills", [])
        if not skills:
            return

        elements.append(Paragraph("TECHNICAL SKILLS", self.styles["SectionHeader"]))
        elements.append(
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#6b21a8"))
        )
        elements.append(Spacer(1, 6))

        # Group skills by category
        categories = {}
        for skill in skills:
            cat = skill.get("category_display", skill.get("category", "Other"))
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(skill.get("name", ""))

        for category, skill_names in categories.items():
            skill_text = f"<b>{category}:</b> {', '.join(skill_names)}"
            elements.append(Paragraph(skill_text, self.styles["ResumeBodyText"]))

    def _add_projects(self, elements):
        """Add notable projects section."""
        projects = self.user.get("projects", [])
        if not projects:
            return

        # Only show featured or first 3 projects
        featured = [p for p in projects if p.get("is_featured")]
        if not featured:
            featured = projects[:3]

        elements.append(Paragraph("NOTABLE PROJECTS", self.styles["SectionHeader"]))
        elements.append(
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#6b21a8"))
        )
        elements.append(Spacer(1, 6))

        for project in featured:
            elements.append(
                Paragraph(project.get("title", ""), self.styles["JobTitle"])
            )

            # Technologies
            tech = project.get("technologies", [])
            if tech:
                elements.append(Paragraph(", ".join(tech), self.styles["DateRange"]))

            # Description
            desc = project.get("short_description") or project.get("description", "")
            if desc:
                elements.append(Spacer(1, 4))
                # Truncate if too long
                if len(desc) > 200:
                    desc = desc[:200] + "..."
                elements.append(Paragraph(desc, self.styles["ResumeBodyText"]))

            # Links
            links = []
            if project.get("github_url"):
                links.append(f"GitHub: {project['github_url']}")
            if project.get("live_url"):
                links.append(f"Live: {project['live_url']}")
            if links:
                elements.append(Paragraph(" | ".join(links), self.styles["DateRange"]))

            elements.append(Spacer(1, 8))

    def _add_certifications(self, elements):
        """Add certifications section."""
        certifications = self.user.get("certifications", [])
        if not certifications:
            return

        elements.append(Paragraph("CERTIFICATIONS", self.styles["SectionHeader"]))
        elements.append(
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#6b21a8"))
        )
        elements.append(Spacer(1, 6))

        for cert in certifications:
            cert_text = f"<b>{cert.get('name', '')}</b> - {cert.get('issuing_organization', '')}"
            if cert.get("issue_date"):
                cert_text += f" ({cert['issue_date'][:7]})"
            elements.append(Paragraph(cert_text, self.styles["ResumeBodyText"]))

    def generate(self) -> bytes:
        """Generate the PDF resume."""
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch,
        )

        elements = []

        # Add sections
        self._add_header(elements)
        self._add_summary(elements)
        self._add_experience(elements)
        self._add_education(elements)
        self._add_skills(elements)
        self._add_projects(elements)
        self._add_certifications(elements)

        # Build PDF
        doc.build(elements)

        # Get PDF bytes
        pdf_bytes = self.buffer.getvalue()
        self.buffer.close()

        return pdf_bytes


def generate_resume_pdf(user_data: dict) -> bytes:
    """
    Generate a PDF resume from user portfolio data.

    Args:
        user_data: Dictionary containing user profile, skills, experience, etc.

    Returns:
        PDF file as bytes
    """
    generator = ResumeGenerator(user_data)
    return generator.generate()
