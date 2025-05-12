
# routes/reports.py
from flask import Blueprint, jsonify, send_file, request
from utils.db_connection import setup_mongodb_connection
from utils.report_utils import create_zip_from_report_data, format_timestamp
from datetime import datetime
from zoneinfo import ZoneInfo
import pandas as pd
import json
import os

# Initialize blueprint
reports_bp = Blueprint('reports', __name__)

# Get database connection
db = setup_mongodb_connection()

@reports_bp.route('/download-report', methods=['GET'])
def download_report():
    """Endpoint to download the latest report"""
    try:
        if db is None:
            return jsonify({"error": "Database not connected"}), 500
            
        # Get the most recent report from the database
        reports_collection = db["reports"]
        latest_report = reports_collection.find_one({}, sort=[("timestamp", -1)])
        
        if not latest_report or "csv_files" not in latest_report:
            return jsonify({"error": "Report not found"}), 404
        
        # Create zip file in memory
        zip_buffer = create_zip_from_report_data(latest_report)
        if not zip_buffer:
            return jsonify({"error": "Error creating report zip file"}), 500
        
        # Format timestamp for filename
        timestamp = datetime.now().astimezone(ZoneInfo("Asia/Singapore"))
        formatted_timestamp = timestamp.strftime("%d%b%Y-%H%M%S")
        
        # Get report name
        report_name = latest_report.get("report_name", f"document_comparison_report_{formatted_timestamp}")
        
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name=f"{report_name}.zip",
            mimetype="application/zip"
        )

    except Exception as e:
        print(f"Error in download_report: {str(e)}")
        return jsonify({"error": f"Error downloading report: {str(e)}"}), 500

@reports_bp.route('/report-history', methods=['GET'])
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
        
        # Format timestamps
        for report in reports:
            timestamp = report.get("timestamp")
            if isinstance(timestamp, datetime):
                # Convert to Asia/Singapore timezone
                timestamp = timestamp.astimezone(ZoneInfo("Asia/Singapore"))
                report["timestamp"] = timestamp.isoformat()
        
        return jsonify(reports)
    except Exception as e:
        return jsonify({"error": f"Error retrieving report history: {str(e)}"}), 500

@reports_bp.route('/report-data/<timestamp>', methods=['GET'])
def get_report_data(timestamp):
    """Endpoint to get visualization data for a specific report"""
    try:
        if db is None:
            return jsonify({"error": "Database not connected"}), 500
        
        # Get reports collection
        reports_collection = db["reports"]
        
        # Find the report with the matching timestamp
        report = reports_collection.find_one({"timestamp": timestamp})
        
        if not report:
            return jsonify({"error": "Report not found"}), 404
        
        # Get path to CSV files
        csv_folder = report.get("csv_files")
        if not csv_folder or not os.path.exists(csv_folder):
            return jsonify({"error": "CSV files not found"}), 404
        
        # Check for wins summary CSV which has the most important data
        wins_csv = os.path.join(csv_folder, "document_wins.csv")
        if os.path.exists(wins_csv):
            try:
                df = pd.read_csv(wins_csv)
                # Format for visualization
                data = [{
                    "name": row["Document"].split("/")[-1] if "/" in row["Document"] else row["Document"],
                    "score": int(row["Win Count"])
                } for _, row in df.iterrows()]
                return jsonify(data)
            except Exception as e:
                print(f"Error reading wins CSV: {str(e)}")
        
        # Fallback: return basic document list with random scores
        docs = report.get("documents", [])
        data = [{
            "name": doc.split("/")[-1] if "/" in doc else doc,
            "score": 0  # Default score
        } for doc in docs]
        
        return jsonify(data)
    
    except Exception as e:
        print(f"Error getting report data: {str(e)}")
        return jsonify({"error": f"Error retrieving report data: {str(e)}"}), 500

@reports_bp.route('/pairwise-data/<timestamp>', methods=['GET'])
def get_pairwise_data(timestamp):
    """Endpoint to get pairwise comparison data for a specific report"""
    try:
        if db is None:
            return jsonify({"error": "Database not connected"}), 500
        
        # Get reports collection
        reports_collection = db["reports"]
        
        # Find the report with the matching timestamp
        report = reports_collection.find_one({"timestamp": timestamp})
        
        if not report:
            return jsonify({"error": "Report not found"}), 404
        
        # Get path to CSV files
        csv_folder = report.get("csv_files")
        if not csv_folder or not os.path.exists(csv_folder):
            return jsonify({"error": "CSV files not found"}), 404
        
        # Check for comparisons CSV which has the detailed comparison data
        comparisons_csv = os.path.join(csv_folder, "comparisons.csv")
        if os.path.exists(comparisons_csv):
            try:
                df = pd.read_csv(comparisons_csv)
                # Format for frontend display
                data = []
                for _, row in df.iterrows():
                    doc1 = row.get("Document A", "").split("/")[-1] if "/" in row.get("Document A", "") else row.get("Document A", "")
                    doc2 = row.get("Document B", "").split("/")[-1] if "/" in row.get("Document B", "") else row.get("Document B", "")
                    winner = row.get("Winner", "").split("/")[-1] if "/" in row.get("Winner", "") else row.get("Winner", "")
                    reasoning = row.get("Reasoning", "No reasoning provided")
                    
                    data.append({
                        "doc1": doc1,
                        "doc2": doc2,
                        "winner": winner,
                        "reasoning": reasoning
                    })
                return jsonify(data)
            except Exception as e:
                print(f"Error reading comparisons CSV: {str(e)}")
                return jsonify([])  # Return empty list if error
        else:
            # If no comparisons file exists, return empty array
            print(f"Comparisons CSV not found at {comparisons_csv}")
            return jsonify([])
    
    except Exception as e:
        print(f"Error getting pairwise data: {str(e)}")
        return jsonify({"error": f"Error retrieving pairwise data: {str(e)}"}), 500

@reports_bp.route('/download-report/<timestamp>', methods=['GET'])
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
        
        # Create zip file in memory
        zip_buffer = create_zip_from_report_data(report)
        if not zip_buffer:
            return jsonify({"error": "Error creating report zip file"}), 500
        
        # Format timestamp for filename
        formatted_timestamp = format_timestamp(timestamp)
        
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

@reports_bp.route('/update-report-name', methods=['POST'])
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
