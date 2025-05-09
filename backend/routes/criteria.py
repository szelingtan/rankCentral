# routes/criteria.py
from flask import Blueprint, jsonify
from comparisons.criteria_manager import CriteriaManager

# Initialize blueprint
criteria_bp = Blueprint('criteria', __name__)

@criteria_bp.route('/criteria/default', methods=['GET'])
def get_default_criteria():
    """Endpoint to get default criteria"""
    criteria_manager = CriteriaManager()
    return jsonify(criteria_manager.default_criteria)