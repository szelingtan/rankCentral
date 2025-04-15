
import os
import pandas as pd
from typing import List, Dict

from .report_formatter import ExcelReportFormatter
from .data_processor import ComparisonDataProcessor
from .report_config import DEFAULT_REPORT_FILENAME, SHEET_NAMES

class ReportGenerator:
    """
    Generates detailed reports from comparison results.
    This class coordinates the data processing and report formatting.
    """
    
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
    
    def generate_report(self, pdf_list: List[str], comparison_results: List[Dict], original_names: List[str] = None) -> str:
        """
        Generate a detailed evaluation report of all comparisons with full reasoning.
        
        Args:
            pdf_list: List of all PDFs that were compared
            comparison_results: Results of all pairwise comparisons
            original_names: Original names of the documents (preserves display names)
            
        Returns:
            Path to the generated report
        """
        # Use original document names if provided, otherwise use pdf_list
        display_names = original_names if original_names else pdf_list
        
        # Process data for different report sections
        report_data = ComparisonDataProcessor.prepare_report_data(pdf_list, comparison_results, display_names)
        criterion_data = ComparisonDataProcessor.prepare_criterion_data(comparison_results)
        win_counts = ComparisonDataProcessor.calculate_win_counts(pdf_list, comparison_results, display_names)
        criterion_summary = ComparisonDataProcessor.prepare_criterion_summary(pdf_list, comparison_results, display_names)
        
        # Save report to Excel
        return self._create_excel_report(
            report_data, criterion_data, win_counts, criterion_summary
        )
    
    def _create_excel_report(self, report_data, criterion_data, win_counts, criterion_summary):
        """Create the Excel report with all data sheets"""
        try:
            # Create file path
            report_path = os.path.join(self.output_dir, DEFAULT_REPORT_FILENAME)
            
            with pd.ExcelWriter(report_path, engine='openpyxl') as writer:
                # Main comparisons sheet
                if report_data:
                    df_main = pd.DataFrame(report_data)
                    df_main.to_excel(writer, sheet_name=SHEET_NAMES["overall"], index=False)
                                
                # Criterion details sheet
                if criterion_data:
                    df_criteria = pd.DataFrame(criterion_data)
                    df_criteria.to_excel(writer, sheet_name=SHEET_NAMES["criteria"], index=False)
                
                # Document win count summary
                if win_counts:
                    summary_data = [{
                        'Document': doc,
                        'Win Count': count
                    } for doc, count in win_counts.items()]
                    
                    df_summary = pd.DataFrame(summary_data)
                    df_summary = df_summary.sort_values(by='Win Count', ascending=False)
                    df_summary.to_excel(writer, sheet_name=SHEET_NAMES["wins"], index=False)
                
                # Criterion-specific scores
                if criterion_summary:
                    df_criterion = pd.DataFrame(criterion_summary)
                    df_criterion = df_criterion.sort_values(by='Win Count', ascending=False)
                    df_criterion.to_excel(writer, sheet_name=SHEET_NAMES["scores"], index=False)
            
            # Apply formatting to the Excel file
            ExcelReportFormatter.apply_formatting(report_path)
            
            print(f"\nDetailed comparison report saved to: {report_path}")
            return report_path
            
        except Exception as e:
            print(f"Error generating report: {e}")
            return ""
