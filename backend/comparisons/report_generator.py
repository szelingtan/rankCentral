
import os
import pandas as pd
from typing import List, Dict
import time
import re

from .data_processor import ComparisonDataProcessor
from .report_config import SHEET_NAMES

class ReportGenerator:
    """
    Generates detailed reports from comparison results.
    
    This class coordinates the data processing and report formatting by:
    1. Processing raw comparison data into structured formats
    2. Generating CSV files for different aspects of the comparison
    3. Managing file and folder creation for reports
    """
    
    def __init__(self, output_dir: str):
        """
        Initialize the report generator with an output directory.
        
        Args:
            output_dir: Directory where reports will be saved
        """
        self.output_dir = output_dir
    
    def generate_report(self, pdf_list: List[str], comparison_results: List[Dict], folder_name: str = "csv_reports") -> str:
        """
        Generate a detailed evaluation report of all comparisons with full reasoning.
        
        Args:
            pdf_list: List of all PDFs that were compared
            comparison_results: Results of all pairwise comparisons
            folder_name: Custom name for the CSV reports folder
            
        Returns:
            Path to the generated report
        """
        print(f"Generating report with folder name: '{folder_name}'")
        start_time = time.time()
        
        # Process data for different report sections
        report_data = ComparisonDataProcessor.prepare_report_data(pdf_list, comparison_results)
        criterion_data = ComparisonDataProcessor.prepare_criterion_data(comparison_results)
        win_counts = ComparisonDataProcessor.calculate_win_counts(pdf_list, comparison_results)
        criterion_summary = ComparisonDataProcessor.prepare_criterion_summary(pdf_list, comparison_results)
        
        # Ensure folder_name is sanitized for file system use
        sanitized_folder_name = self._sanitize_folder_name(folder_name)
        
        # Save report to CSV
        report_path = self._create_csv_report(
            report_data, criterion_data, win_counts, criterion_summary, sanitized_folder_name
        )
        
        end_time = time.time()
        print(f"Report generation completed in {end_time - start_time:.2f} seconds")
        
        return report_path
    
    def _sanitize_folder_name(self, folder_name: str) -> str:
        """
        Sanitize folder name to ensure it's valid for file systems.
        
        Args:
            folder_name: Original folder name
            
        Returns:
            Sanitized folder name
        """
        if not folder_name or folder_name.strip() == '':
            return f"csv_reports_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Remove invalid characters
        sanitized = re.sub(r'[^\w\s-]', '_', folder_name)
        
        # Replace spaces with underscores if desired
        # sanitized = sanitized.replace(' ', '_')
        
        # Ensure the name doesn't start with a dash
        sanitized = sanitized.lstrip('-')
        
        # Limit length
        if len(sanitized) > 50:
            sanitized = sanitized[:47] + '...'
        
        return sanitized
    
    def _create_csv_report(self, report_data, criterion_data, win_counts, criterion_summary, folder_name="csv_reports"):
        """
        Create the report as separate CSVs within a folder
        
        Args:
            report_data: Overall comparison results
            criterion_data: Detailed criterion-by-criterion analysis
            win_counts: Count of wins per document
            criterion_summary: Summary of scores per criterion
            folder_name: Name for the folder containing CSV files
            
        Returns:
            Path to the created folder
        """
        try:
            # Ensure folder name exists and is sanitized
            folder_name = self._sanitize_folder_name(folder_name)
                
            csv_folder = os.path.join(self.output_dir, folder_name)
            
            # Create the folder if it doesn't exist
            if not os.path.exists(csv_folder):
                os.makedirs(csv_folder)
            
            csv_files = []
            
            # Add API key validation message to report data
            # This helps users identify API key issues
            api_key_status_included = False
            
            # Main comparisons sheet
            if report_data:
                df_main = pd.DataFrame(report_data)
                main_file = os.path.join(csv_folder, f"{SHEET_NAMES['overall']}.csv")
                df_main.to_csv(main_file, index=False)
                csv_files.append(main_file)
            
            # Criterion details sheet
            if criterion_data:
                df_criteria = pd.DataFrame(criterion_data)
                criteria_file = os.path.join(csv_folder, f"{SHEET_NAMES['criteria']}.csv")
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
                wins_file = os.path.join(csv_folder, f"{SHEET_NAMES['wins']}.csv")
                df_summary.to_csv(wins_file, index=False)
                csv_files.append(wins_file)
            
            # Criterion-specific scores
            if criterion_summary:
                df_criterion = pd.DataFrame(criterion_summary)
                df_criterion = df_criterion.sort_values(by='Win Count', ascending=False)
                scores_file = os.path.join(csv_folder, f"{SHEET_NAMES['scores']}.csv")
                df_criterion.to_csv(scores_file, index=False)
                csv_files.append(scores_file)
            
            print(f"\nDetailed comparison reports saved to folder: {folder_name}")
            print(f"Created {len(csv_files)} CSV files")
            
            return csv_folder
            
        except Exception as e:
            print(f"Error generating CSV reports: {e}")
            return ""
