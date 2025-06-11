from flask import Blueprint, jsonify
from src.models.user import db
from src.utils.api_response import APIResponse
from datetime import datetime
import os

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Check database connection
        db.session.execute('SELECT 1')
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Check disk space
    try:
        disk_usage = os.statvfs('/')
        free_space = (disk_usage.f_bavail * disk_usage.f_frsize) / (1024 * 1024 * 1024)  # GB
        disk_status = "healthy" if free_space > 1 else f"low_space: {free_space:.2f}GB"
    except:
        disk_status = "unknown"
    
    health_data = {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": os.environ.get('MODEL_VERSION', 'v1.0.0'),
        "checks": {
            "database": db_status,
            "disk_space": disk_status
        }
    }
    
    status_code = 200 if health_data["status"] == "healthy" else 503
    return APIResponse.success(health_data, status_code=status_code)

@health_bp.route('/metrics', methods=['GET'])
def metrics():
    """Basic metrics endpoint"""
    try:
        from src.models.user import UserSession, UserEvent, IntentPrediction
        
        # Get basic statistics
        total_sessions = UserSession.query.count()
        total_events = UserEvent.query.count()
        total_predictions = IntentPrediction.query.count()
        
        # Get recent activity (last 24 hours)
        from datetime import timedelta
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_sessions = UserSession.query.filter(UserSession.start_time >= yesterday).count()
        recent_events = UserEvent.query.filter(UserEvent.timestamp >= yesterday).count()
        
        metrics_data = {
            "totals": {
                "sessions": total_sessions,
                "events": total_events,
                "predictions": total_predictions
            },
            "recent_24h": {
                "sessions": recent_sessions,
                "events": recent_events
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return APIResponse.success(metrics_data)
        
    except Exception as e:
        return APIResponse.error(f"Metrics error: {str(e)}", 500)
