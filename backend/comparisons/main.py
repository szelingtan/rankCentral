import os
import argparse
from dotenv import load_dotenv
from .pdf_processor import PDFProcessor
from .criteria_manager import CriteriaManager
from .comparison_engine import ComparisonEngine
from .report_generator import ReportGenerator

def main():
    # Load environment variables
    load_dotenv()
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='PDF Comparison System using Section-Based Hybrid Approach')
    parser.add_argument('--pdf_folder', required=True, help='Path to folder containing PDFs to compare')
    parser.add_argument('--compare_method', choices=['all_pairs', 'mergesort'], default='mergesort', 
                       help='Method for organizing comparisons: all possible pairs or mergesort structure')
    
    args = parser.parse_args()
    
    # Use the API key from the .env file
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("Error: No OpenAI API key provided. Set it in .env file.")
        return
    
    # Initialize components
    pdf_processor = PDFProcessor(args.pdf_folder)
    criteria_manager = CriteriaManager()
    
    # Start the process
    print("Starting PDF comparison system with section-based hybrid evaluation approach...")
    print("This system will:")
    print("1. Extract criteria-specific sections from documents")
    print("2. Evaluate documents against rubrics for each criterion")
    print("3. Directly compare documents using only relevant sections")
    
    # Load PDFs
    pdf_contents = pdf_processor.load_pdfs()
    
    # Extract criteria sections from PDFs
    print("\nExtracting criterion-specific sections from PDFs...")
    pdf_processor.extract_criteria_sections()
    
    # Gather criteria from user
    criteria = criteria_manager.gather_criteria_from_user()
    
    # Initialize comparison engine with PDF processor for section-based analysis
    comparison_engine = ComparisonEngine(pdf_contents, criteria, api_key, pdf_processor)
    
    # Initialize report generator
    report_generator = ReportGenerator(args.pdf_folder)
    
    # Prepare for comparison
    pdf_list = list(pdf_contents.keys())
    print(f"\nFound {len(pdf_list)} PDFs to compare")
    
    # Run comparisons based on selected method
    print("\nStarting section-based comparisons using hybrid evaluation approach...")

    # Run comparisons with merge sort 
    print("Using merge sort structure for comparisons...")
    results = comparison_engine.compare_with_mergesort(pdf_list)

    # Display top-ranked documents
    print("\nDocument Ranking (based on criterion-specific sections):")
    for i, doc in enumerate(results):
        print(f"{i+1}. {doc}")
    
    # Generate report
    report_generator.generate_report(pdf_list, comparison_engine.comparison_results)
    
    print("\nEvaluation complete! See the generated Excel report for detailed results.")

if __name__ == "__main__":
    main()
