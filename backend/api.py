
import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from comparisons.pdf_processor import PDFProcessor
from comparisons.criteria_manager import CriteriaManager
from comparisons.comparison_engine import ComparisonEngine
from comparisons.report_generator import ReportGenerator
from utils.db_connection import setup_mongodb_connection
import tempfile
from datetime import datetime
import json

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
# Allow CORS for all routes to ensure frontend can communicate with backend
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Use a temporary directory for PDF storage
UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'pdf_comparison_uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# MongoDB setup
db = setup_mongodb_connection()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify backend is running properly"""
    try:
        # Test MongoDB connection if available
        db_status = "connected" if db is not None else "not connected"
        
        # Check if PDF upload folder is accessible
        folder_status = "accessible" if os.access(app.config['UPLOAD_FOLDER'], os.W_OK) else "not accessible"
        
        # Check OpenAI API key
        openai_key_status = "configured" if os.getenv("OPENAI_API_KEY") else "not configured"
        
        return jsonify({
            "status": "healthy", 
            "message": "PDF Comparison API is running",
            "version": "1.0.0",
            "timestamp": datetime.now().isoformat(),
            "diagnostics": {
                "mongodb": db_status,
                "upload_folder": folder_status,
                "upload_path": app.config['UPLOAD_FOLDER'],
                "openai_api": openai_key_status
            }
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "message": f"Health check failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/upload-pdfs', methods=['POST'])
def upload_pdfs():
    """Endpoint to upload PDF files"""
    if 'files[]' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    files = request.files.getlist('files[]')
    
    if not files or files[0].filename == '':
        return jsonify({"error": "No files selected"}), 400
    
    # Clear upload folder before accepting new files
    try:
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.isfile(file_path):
                os.unlink(file_path)
    except Exception as e:
        return jsonify({"error": f"Error clearing upload folder: {str(e)}"}), 500
    
    saved_files = []
    for file in files:
        if file.filename.endswith('.pdf'):
            filename = file.filename
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            saved_files.append(filename)
    
    if not saved_files:
        return jsonify({"error": "No PDF files were uploaded"}), 400
    
    return jsonify({
        "message": f"Successfully uploaded {len(saved_files)} PDF files",
        "files": saved_files
    })

@app.route('/api/compare-documents', methods=['POST'])
def compare_documents():
    """Endpoint to compare documents using specified criteria or a custom prompt"""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    criteria_data = data.get('criteria', [])
    comparison_method = data.get('compare_method', 'mergesort')
    evaluation_method = data.get('evaluation_method', 'criteria')
    custom_prompt = data.get('custom_prompt', '')
    documents_data = data.get('documents', [])
    
    # Check if documents are provided
    if not documents_data or len(documents_data) < 2:
        # Check if PDFs are uploaded as fallback
        if not os.path.exists(app.config['UPLOAD_FOLDER']) or len(os.listdir(app.config['UPLOAD_FOLDER'])) < 2:
            return jsonify({"error": "Provide at least two documents for comparison"}), 400
        use_uploaded_pdfs = True
    else:
        use_uploaded_pdfs = False
    
    try:
        # Get the API key from environment
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        # Initialize components
        pdf_processor = PDFProcessor(app.config['UPLOAD_FOLDER'])
        criteria_manager = CriteriaManager()
        
        # If using criteria-based evaluation, set the criteria
        if evaluation_method == 'criteria':
            # Override criteria from the manager with the ones from the request
            criteria_manager.criteria = criteria_data
        else:
            # For prompt-based evaluation, create a single criterion with the custom prompt
            criteria_manager.criteria = [{
                "id": "custom",
                "name": "Custom Evaluation",
                "description": custom_prompt,
                "weight": 100,
                "is_custom_prompt": True
            }]
        
        # Get the document contents
        if use_uploaded_pdfs:
            # Load PDFs from upload folder
            pdf_contents = pdf_processor.load_pdfs()
        else:
            # Use the document contents from the request
            pdf_contents = {}
            for doc in documents_data:
                pdf_contents[doc['name']] = doc['content']
        
        # Get criteria
        criteria = criteria_manager.criteria
        
        # Initialize comparison engine
        comparison_engine = ComparisonEngine(pdf_contents, criteria, api_key, pdf_processor, 
                                            use_custom_prompt=(evaluation_method == 'prompt'))
        
        # Initialize report generator
        report_generator = ReportGenerator(app.config['UPLOAD_FOLDER'])
        
        # Prepare for comparison
        pdf_list = list(pdf_contents.keys())
        
        # Run comparisons with merge sort
        results = comparison_engine.compare_with_mergesort(pdf_list)
        
        # Generate report
        report_path = report_generator.generate_report(pdf_list, comparison_engine.comparison_results)
        
        # Store report metadata in MongoDB
        if db is not None:
            try:
                # Store only metadata about the report
                report_data = {
                    "timestamp": datetime.now().isoformat(),
                    "documents": pdf_list,
                    "top_ranked": results[0] if results else None,
                    "report_path": report_path,
                    "criteria_count": len(criteria),
                    "evaluation_method": evaluation_method,
                    "custom_prompt": custom_prompt if evaluation_method == 'prompt' else ""
                }
                
                # Get reports collection
                reports_collection = db["reports"]
                
                # Insert new report metadata
                reports_collection.insert_one(report_data)
                
                # Limit to 3 most recent reports (remove older ones)
                # Find all reports sorted by timestamp
                all_reports = list(reports_collection.find().sort("timestamp", -1))
                
                # Delete any reports beyond the most recent 3
                if len(all_reports) > 3:
                    # Get IDs of reports to delete
                    reports_to_delete = all_reports[3:]
                    report_ids = [report["_id"] for report in reports_to_delete]
                    
                    # Delete older reports
                    reports_collection.delete_many({"_id": {"$in": report_ids}})
            except Exception as e:
                print(f"Error storing report history: {str(e)}")
                # Continue even if history storage fails
        
        return jsonify({
            "message": "Comparison completed successfully",
            "ranked_documents": results,
            "comparison_details": comparison_engine.comparison_results,
            "report_path": report_path
        })
    
    except Exception as e:
        return jsonify({"error": f"Error during comparison: {str(e)}"}), 500

# ... keep existing code (from @app.route('/api/download-report', methods=['GET']) through the end)
@app.route('/api/download-report', methods=['GET'])
def download_report():
    """Endpoint to download the generated Excel report"""
    try:
        if not db:
            return jsonify({"error": "Database not connected"}), 500
            
        # Get the most recent report path from the database
        reports_collection = db["reports"]
        latest_report = reports_collection.find_one({}, sort=[("timestamp", -1)])
        
        if not latest_report or "report_path" not in latest_report:
            # Fall back to the default path if not found in database
            report_path = os.path.join(app.config['UPLOAD_FOLDER'], 'document_comparison_report.xlsx')
        else:
            report_path = latest_report["report_path"]
        
        if not os.path.exists(report_path):
            return jsonify({
                "error": f"Report file not found at path: {report_path}", 
                "details": "The report may have been deleted or moved."
            }), 404
        
        # Add debugging information to logs
        print(f"Attempting to send file from: {report_path}")
        
        # Set appropriate MIME type for Excel files
        return send_file(
            report_path, 
            as_attachment=True,
            download_name="document_comparison_report.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        print(f"Error in download_report: {str(e)}")
        return jsonify({"error": f"Error downloading report: {str(e)}"}), 500

@app.route('/api/report-history', methods=['GET'])
def get_report_history():
    """Endpoint to get the history of past reports (up to 3)"""
    try:
        if db is None:
            return jsonify({"error": "Database not connected"}), 500

        # Get reports collection
        reports_collection = db["reports"]
        
        # Get the 3 most recent reports, sorted by timestamp
        reports = list(reports_collection.find({}, {
            "_id": 0,  # Exclude MongoDB ID
            "timestamp": 1,
            "documents": 1,
            "top_ranked": 1,
            "report_path": 1,
            "criteria_count": 1,
            "evaluation_method": 1,
            "custom_prompt": 1
        }).sort("timestamp", -1).limit(3))
        
        # Convert ObjectId to string for JSON serialization if needed
        for report in reports:
            # Convert datetime to ISO format string if needed
            if isinstance(report.get("timestamp"), datetime):
                report["timestamp"] = report["timestamp"].isoformat()
        
        return jsonify(reports)
    except Exception as e:
        return jsonify({"error": f"Error retrieving report history: {str(e)}"}), 500

@app.route('/api/download-report/<timestamp>', methods=['GET'])
def download_specific_report(timestamp):
    """Endpoint to download a specific report by timestamp"""
    try:
        if db is None:
            return jsonify({"error": "Database not connected"}), 500
        
        # Get reports collection
        reports_collection = db["reports"]
        
        # Find the report with the matching timestamp
        report = reports_collection.find_one({"timestamp": timestamp})
        
        if not report or "report_path" not in report:
            return jsonify({"error": "Report not found"}), 404
        
        report_path = report["report_path"]
        
        if not os.path.exists(report_path):
            return jsonify({"error": "Report file not found"}), 404
        
        # Set appropriate MIME type for Excel files
        return send_file(
            report_path, 
            as_attachment=True,
            download_name="document_comparison_report.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        print(f"Error in download_specific_report: {str(e)}")
        return jsonify({"error": f"Error downloading report: {str(e)}"}), 500

@app.route('/api/criteria/default', methods=['GET'])
def get_default_criteria():
    """Endpoint to get default criteria"""
    criteria_manager = CriteriaManager()
    return jsonify(criteria_manager.default_criteria)

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5003))
    
    print(f"Starting backend server on port {port}...")
    print(f"API will be available at: http://localhost:{port}/api/health")
    print(f"Temporary uploads directory: {UPLOAD_FOLDER}")
    
    # Use the host 0.0.0.0 to make the server externally visible
    app.run(host='0.0.0.0', port=port, debug=True)
