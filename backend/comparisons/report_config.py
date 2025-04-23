
"""Configuration settings for report generation"""

# Excel formatting settings
EXCEL_HEADER_COLOR = "4F81BD"
EXCEL_TEXT_COLOR = "FFFFFF"
EXCEL_HIGHLIGHT_COLOR = "E2EFDA"

# Score color mappings
SCORE_COLORS = {
    "poor": "FFCCCC",     # Light red
    "fair": "FFE5CC",     # Light orange
    "good": "FFFFCC",     # Light yellow
    "very_good": "E5FFCC", # Light yellow-green
    "excellent": "CCFFCC"  # Light green
}

# Excel sheet names
SHEET_NAMES = {
    "overall": "Overall Results",
    "criteria": "Detailed Criterion Analysis",
    "wins": "Win Summary",
    "scores": "Criterion Scores",
    "legend": "Legend"
}

# Score levels for legend
SCORE_LEVELS = [
    ("1 - Poor", SCORE_COLORS["poor"]),
    ("2 - Fair", SCORE_COLORS["fair"]),
    ("3 - Good", SCORE_COLORS["good"]),
    ("4 - Very Good", SCORE_COLORS["very_good"]),
    ("5 - Excellent", SCORE_COLORS["excellent"])
]

# Default column widths
DEFAULT_COLUMN_WIDTH = {
    "min": 10,
    "max": 50,
    "analysis": 60
}

# Score level descriptions
DEFAULT_SCORE_LEVEL_DESCRIPTIONS = {
    1: 'Poor - Does not meet the criterion requirements',
    2: 'Fair - Partially meets some requirements with significant gaps',
    3: 'Good - Meets most requirements with minor gaps',
    4: 'Very Good - Fully meets all requirements',
    5: 'Excellent - Exceeds requirements in meaningful ways'
}
