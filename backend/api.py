
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
from zoneinfo import ZoneInfo
import io
import zipfile

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
        openai_api_key = os.getenv("OPENAI_API_KEY")
        openai_key_status = "configured" if openai_api_key and len(openai_api_key) > 20 else "not configured"
        
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
    """
    Endpoint to compare documents using specified criteria or a custom prompt
    
    This is the main comparison endpoint that:
    1. Processes the input documents and criteria
    2. Runs the comparison using the OpenAI API
    3. Generates and stores reports
    """
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Extract comparison parameters from the request
    criteria_data = data.get('criteria', [])
    evaluation_method = data.get('evaluation_method', 'criteria')
    custom_prompt = data.get('custom_prompt', '')
    documents_data = data.get('documents', [])
    report_name = data.get('report_name', '')  # Get report name from request
    
    # Check if documents are provided in the request
    if not documents_data or len(documents_data) < 2:
        # Check if PDFs are uploaded as fallback
        if not os.path.exists(app.config['UPLOAD_FOLDER']) or len(os.listdir(app.config['UPLOAD_FOLDER'])) < 2:
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
        
        print(f"OpenAI API key found (first few chars): {api_key[:5]}...")
        
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
        pdf_contents = {}
        if use_uploaded_pdfs:
            # Load PDFs from upload folder
            pdf_contents = pdf_processor.load_pdfs()
        else:
            # Use the document contents from the request
            for doc in documents_data:
                doc_name = doc['name']
                doc_content = doc['content']
                
                # Check if content is likely base64 encoded PDF
                if doc_content.startswith('data:application/pdf;base64,') or (
                    len(doc_content) > 100 and not doc_content.strip()[:20].isalpha()
                ):
                    # Process as base64 PDF
                    try:
                        extracted_text = pdf_processor.load_base64_pdf(doc_name, doc_content)
                        pdf_contents[doc_name] = extracted_text
                    except Exception as e:
                        print(f"Error processing base64 PDF: {str(e)}")
                        # Fallback to raw content if extraction fails
                        pdf_contents[doc_name] = doc_content
                else:
                    # Use as plain text
                    pdf_contents[doc_name] = doc_content
        
        # Get criteria
        criteria = criteria_manager.criteria
        
        # Initialize comparison engine with the API key
        comparison_engine = ComparisonEngine(
            pdf_contents, 
            criteria, 
            api_key, 
            pdf_processor, 
            use_custom_prompt=(evaluation_method == 'prompt')
        )

        # Initialize report generator
        report_generator = ReportGenerator(app.config['UPLOAD_FOLDER'])

        # Prepare for comparison
        pdf_list = list(pdf_contents.keys())

        # Run comparisons with merge sort
        results = comparison_engine.compare_with_mergesort(pdf_list)

        # Generate report with the provided report name
        folder_name = report_name if report_name else f"csv_reports_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        report_folder_path = report_generator.generate_report(pdf_list, comparison_engine.comparison_results, folder_name=folder_name)

        # Store report metadata and CSV contents in MongoDB
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
                            
                # Verify API key validity before storing in report data
                api_key_status = "Valid API key" if len(api_key) > 20 else "Invalid or missing API key"
                            
                # Store complete document names to ensure they display properly
                report_data = {
                    "timestamp": datetime.now().isoformat(),
                    "documents": pdf_list,  # This contains the actual document names
                    "top_ranked": results[0] if results else None,
                    "csv_files": csv_files,  # Store the CSV contents directly in MongoDB
                    "criteria_count": len(criteria),
                    "evaluation_method": evaluation_method,
                    "custom_prompt": custom_prompt if evaluation_method == 'prompt' else "",
                    "report_name": report_name if report_name else f"Report {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    "api_key_status": api_key_status  # Include API key status in the report data
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
                
        return jsonify({
            "message": "Comparison completed successfully",
            "ranked_documents": results,
            "comparison_details": comparison_engine.comparison_results,
            "report_path": report_folder_path
        })
                
    except Exception as e:
        return jsonify({"error": f"Error during comparison: {str(e)}"}), 500

@app.route('/api/download-report', methods=['GET'])
def download_report():
    """Endpoint to download the generated CSV report bundle as a zip file"""
    try:
        if db is None:
            return jsonify({"error": "Database not connected"}), 500
            
        # Get the most recent report path from the database
        reports_collection = db["reports"]
        latest_report = reports_collection.find_one({}, sort=[("timestamp", -1)])
        
        if not latest_report or "csv_files" not in latest_report:
            return jsonify({"error": "Report not found"}), 404
        
        # Create a zip buffer in memory
        zip_buffer = io.BytesIO()
        
        # Get file data
        file_data = latest_report["csv_files"]
        
        # Create a zip file in memory
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_dict in file_data:
                for filename, content in file_dict.items():
                    # Write each CSV to the zip file
                    zip_file.writestr(filename, content)
        
        # Move to the beginning of the BytesIO buffer
        zip_buffer.seek(0)
        
        # Format timestamp for the filename
        timestamp = datetime.now().astimezone(ZoneInfo("Asia/Singapore"))
        formatted_timestamp = timestamp.strftime("%d%b%Y-%H%M%S")
        
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name=f"document_comparison_report_{formatted_timestamp}.zip",
            mimetype="application/zip"
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
            "report_name": 1,
            "criteria_count": 1,
            "evaluation_method": 1,
            "custom_prompt": 1
        }).sort("timestamp", -1).limit(3))
        
        # Convert ObjectId to string for JSON serialization if needed
        for report in reports:
            # Convert datetime to ISO format string if needed
            timestamp = report.get("timestamp")
            if isinstance(timestamp, datetime):
                # Convert to Asia/Singapore timezone
                timestamp = timestamp.astimezone(ZoneInfo("Asia/Singapore"))
                report["timestamp"] = timestamp.isoformat()
        
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
        
        if not report or "csv_files" not in report:
            return jsonify({"error": "Report not found"}), 404
        
        zip_buffer = io.BytesIO()

        # Parse and format timestamp for the filename
        try:
            # Convert timestamp string to datetime object (handling timezone)
            parsed_timestamp = datetime.fromisoformat(timestamp)
            
            # Convert to Asia/Singapore timezone
            parsed_timestamp = parsed_timestamp.astimezone(ZoneInfo("Asia/Singapore"))
            
            # Format: DD-MMM-YYYY_HHMMSS (e.g., 22-Apr-2025_100000)
            formatted_timestamp = parsed_timestamp.strftime("%d%b%Y-%H%M%S")
        except Exception as e:
            # Fallback if timestamp parsing fails
            print(f"Error parsing timestamp: {e}")
            formatted_timestamp = "report"
                
        # Create a zip file in memory
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_dict in report["csv_files"]:
                for filename, content in file_dict.items():
                    zip_file.writestr(filename, content)

        # Move to the beginning of the BytesIO buffer
        zip_buffer.seek(0)
        
        # Use the custom report name if available
        report_name = report.get("report_name", f"document_comparison_report_{formatted_timestamp}")
        
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name=f"{report_name}.zip",
            mimetype="application/zip"
        )
    
    except Exception as e:
        print(f"Error in download_specific_report: {str(e)}")
        return jsonify({"error": f"Error downloading report: {str(e)}"}), 500

@app.route('/api/update-report-name', methods=['POST'])
def update_report_name():
    """Endpoint to update the name of a report"""
    if db is None:
        return jsonify({"error": "Database not connected"}), 500
    
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    timestamp = data.get('timestamp')
    new_name = data.get('newName')
    
    if not timestamp or not new_name:
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        # Get reports collection
        reports_collection = db["reports"]
        
        # Update the report name
        result = reports_collection.update_one(
            {"timestamp": timestamp},
            {"$set": {"report_name": new_name}}
        )
        
        if result.modified_count > 0:
            return jsonify({
                "success": True,
                "message": "Report name updated successfully"
            })
        else:
            return jsonify({
                "success": False,
                "message": "Report not found or name not changed"
            }), 404
            
    except Exception as e:
        print(f"Error updating report name: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error updating report name: {str(e)}"
        }), 500

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
    print(f"OpenAI API key status: {'Configured' if os.getenv('OPENAI_API_KEY') else 'Not configured'}")
    
    # Use the host 0.0.0.0 to make the server externally visible
    app.run(host='0.0.0.0', port=port, debug=True)
