# routes/documents.py
import os
from flask import Blueprint, request, jsonify, current_app
from comparisons.pdf_processor import PDFProcessor
from comparisons.criteria_manager import CriteriaManager
from comparisons.comparison_engine import ComparisonEngine
from comparisons.report_generator import ReportGenerator
from utils.db_connection import setup_mongodb_connection
from utils.file_utils import clear_upload_folder
from datetime import datetime

# Initialize blueprint
documents_bp = Blueprint('documents', __name__)

# Get database connection
db = setup_mongodb_connection()

@documents_bp.route('/upload-pdfs', methods=['POST'])
def upload_pdfs():
    """Endpoint to upload PDF files"""
    if 'files[]' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    files = request.files.getlist('files[]')
    
    if not files or files[0].filename == '':
        return jsonify({"error": "No files selected"}), 400
    
    # Clear upload folder before accepting new files
    upload_folder = current_app.config['UPLOAD_FOLDER']
    if not clear_upload_folder(upload_folder):
        return jsonify({"error": "Error clearing upload folder"}), 500
    
    saved_files = []
    for file in files:
        if file.filename.endswith('.pdf'):
            filename = file.filename
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            saved_files.append(filename)
    
    if not saved_files:
        return jsonify({"error": "No PDF files were uploaded"}), 400
    
    return jsonify({
        "message": f"Successfully uploaded {len(saved_files)} PDF files",
        "files": saved_files
    })

@documents_bp.route('/compare-documents', methods=['POST'])
def compare_documents():
    """
    Endpoint to compare documents using specified criteria or a custom prompt
    """
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Extract comparison parameters from the request
    criteria_data = data.get('criteria', [])
    evaluation_method = data.get('evaluation_method', 'criteria')
    custom_prompt = data.get('custom_prompt', '')
    documents_data = data.get('documents', [])
    report_name = data.get('report_name', '')
    
    # Check if documents are provided in the request
    upload_folder = current_app.config['UPLOAD_FOLDER']
    if not documents_data or len(documents_data) < 2:
        # Check if PDFs are uploaded as fallback
        if not os.path.exists(upload_folder) or len(os.listdir(upload_folder)) < 2:
            return jsonify({"error": "Provide at least two documents for comparison"}), 400
        use_uploaded_pdfs = True
    else:
        use_uploaded_pdfs = False
    
    try:
        # Get OpenAI API key from environment variable
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("ERROR: OpenAI API key not found in environment variables")
            return jsonify({"error": "OpenAI API key not configured"}), 401
        
        # Initialize components
        pdf_processor = PDFProcessor(upload_folder)
        criteria_manager = CriteriaManager()
        
        # Configure criteria based on evaluation method
        if evaluation_method == 'criteria':
            criteria_manager.criteria = criteria_data
        else:
            criteria_manager.criteria = [{
                "id": "custom",
                "name": "Custom Evaluation",
                "description": custom_prompt,
                "weight": 100,
                "is_custom_prompt": True
            }]
        
        # Get the document contents
        pdf_contents = {}
        if use_uploaded_pdfs:
            pdf_contents = pdf_processor.load_pdfs()
        else:
            for doc in documents_data:
                doc_name = doc['name']
                doc_content = doc['content']
                
                # Check if content is likely base64 encoded PDF
                if doc_content.startswith('data:application/pdf;base64,') or (
                    len(doc_content) > 100 and not doc_content.strip()[:20].isalpha()
                ):
                    try:
                        extracted_text = pdf_processor.load_base64_pdf(doc_name, doc_content)
                        pdf_contents[doc_name] = extracted_text
                    except Exception as e:
                        print(f"Error processing base64 PDF: {str(e)}")
                        pdf_contents[doc_name] = doc_content
                else:
                    pdf_contents[doc_name] = doc_content
        
        # Initialize comparison engine
        comparison_engine = ComparisonEngine(
            pdf_contents, 
            criteria_manager.criteria, 
            api_key, 
            pdf_processor, 
            use_custom_prompt=(evaluation_method == 'prompt')
        )

        # Initialize report generator
        report_generator = ReportGenerator(upload_folder)

        # Get document list and run comparison
        pdf_list = list(pdf_contents.keys())
        results = comparison_engine.compare_with_mergesort(pdf_list)

        # Generate report
        folder_name = report_name if report_name else f"csv_reports_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        report_folder_path = report_generator.generate_report(
            pdf_list, 
            comparison_engine.comparison_results, 
            folder_name=folder_name
        )

        # Store report in MongoDB if connected
        if db is not None:
            try:
                # Get all CSV files in the report folder
                csv_files = []
                if os.path.exists(report_folder_path):
                    for filename in os.listdir(report_folder_path):
                        if filename.endswith('.csv'):
                            csv_file = {}
                            file_path = os.path.join(report_folder_path, filename)
                            # Read file content
                            with open(file_path, 'r') as file:
                                csv_content = file.read()
                            csv_file[filename] = csv_content
                            csv_files.append(csv_file)
                            
                # Check API key status
                api_key_status = "Valid API key" if len(api_key) > 20 else "Invalid or missing API key"
                            
                # Prepare report data
                report_data = {
                    "timestamp": datetime.now().isoformat(),
                    "documents": pdf_list,
                    "top_ranked": results[0] if results else None,
                    "csv_files": csv_files,
                    "criteria_count": len(criteria_manager.criteria),
                    "evaluation_method": evaluation_method,
                    "custom_prompt": custom_prompt if evaluation_method == 'prompt' else "",
                    "report_name": report_name if report_name else f"Report {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    "api_key_status": api_key_status
                }
                
                # Store report in database
                reports_collection = db["reports"]
                reports_collection.insert_one(report_data)
                
                # Limit to 3 most recent reports
                all_reports = list(reports_collection.find().sort("timestamp", -1))
                if len(all_reports) > 3:
                    reports_to_delete = all_reports[3:]
                    report_ids = [report["_id"] for report in reports_to_delete]
                    reports_collection.delete_many({"_id": {"$in": report_ids}})
                    
            except Exception as e:
                print(f"Error storing report history: {str(e)}")
                
        return jsonify({
            "message": "Comparison completed successfully",
            "ranked_documents": results,
            "comparison_details": comparison_engine.comparison_results,
            "report_path": report_folder_path
        })
                
    except Exception as e:
        return jsonify({"error": f"Error during comparison: {str(e)}"}), 500