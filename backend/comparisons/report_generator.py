
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
    
    def generate_report(self, pdf_list: List[str], comparison_results: List[Dict]) -> str:
        """
        Generate a detailed evaluation report of all comparisons with full reasoning.
        
        Args:
            pdf_list: List of all PDFs that were compared
            comparison_results: Results of all pairwise comparisons
            
        Returns:
            Path to the generated report
        """
        # Process data for different report sections
        report_data = ComparisonDataProcessor.prepare_report_data(pdf_list, comparison_results)
        criterion_data = ComparisonDataProcessor.prepare_criterion_data(comparison_results)
        win_counts = ComparisonDataProcessor.calculate_win_counts(pdf_list, comparison_results)
        criterion_summary = ComparisonDataProcessor.prepare_criterion_summary(pdf_list, comparison_results)
        
        # Save report to Excel
        return self._create_csv_report(
            report_data, criterion_data, win_counts, criterion_summary
        )
    
    def _create_csv_report(self, report_data, criterion_data, win_counts, criterion_summary):
        """Create the report as separate CSVs within a folder"""
        try:
            # Create a folder for the CSVs using the report name without extension
            base_name = os.path.splitext(DEFAULT_REPORT_FILENAME)[0]
            csv_folder = os.path.join(self.output_dir, f"{base_name}_csv_reports")
            
            # Create the folder if it doesn't exist
            if not os.path.exists(csv_folder):
                os.makedirs(csv_folder)
            
            csv_files = []
            
            # Main comparisons sheet
            if report_data:
                df_main = pd.DataFrame(report_data)
                main_file = os.path.join(csv_folder, f"{base_name}_{SHEET_NAMES['overall']}.csv")
                df_main.to_csv(main_file, index=False)
                csv_files.append(main_file)
            
            # Criterion details sheet
            if criterion_data:
                df_criteria = pd.DataFrame(criterion_data)
                criteria_file = os.path.join(csv_folder, f"{base_name}_{SHEET_NAMES['criteria']}.csv")
                df_criteria.to_csv(criteria_file, index=False)
                csv_files.append(criteria_file)
            
            # Document win count summary
            if win_counts:
                summary_data = [{
                    'Document': doc,
                    'Win Count': count
                } for doc, count in win_counts.items()]
                
                df_summary = pd.DataFrame(summary_data)
                df_summary = df_summary.sort_values(by='Win Count', ascending=False)
                wins_file = os.path.join(csv_folder, f"{base_name}_{SHEET_NAMES['wins']}.csv")
                df_summary.to_csv(wins_file, index=False)
                csv_files.append(wins_file)
            
            # Criterion-specific scores
            if criterion_summary:
                df_criterion = pd.DataFrame(criterion_summary)
                df_criterion = df_criterion.sort_values(by='Win Count', ascending=False)
                scores_file = os.path.join(csv_folder, f"{base_name}_{SHEET_NAMES['scores']}.csv")
                df_criterion.to_csv(scores_file, index=False)
                csv_files.append(scores_file)
            
            print(f"\nDetailed comparison reports saved to database")
            print(f"Created {len(csv_files)} CSV files")
            
            return csv_folder
            
        except Exception as e:
            print(f"Error generating CSV reports: {e}")
            return ""