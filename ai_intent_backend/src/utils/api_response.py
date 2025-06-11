from flask import jsonify
from datetime import datetime
from typing import Any, Dict, List, Optional

class APIResponse:
    """Standardized API response format"""
    
    @staticmethod
    def success(data: Any = None, message: str = "Success", status_code: int = 200) -> tuple:
        """Return successful response"""
        response = {
            "success": True,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        return jsonify(response), status_code
    
    @staticmethod
    def error(message: str, status_code: int = 400, details: Optional[Dict] = None) -> tuple:
        """Return error response"""
        response = {
            "success": False,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "error": {
                "code": status_code,
                "details": details
            }
        }
        return jsonify(response), status_code
    
    @staticmethod
    def paginated(data: List[Any], page: int, per_page: int, total: int, message: str = "Success") -> tuple:
        """Return paginated response"""
        response = {
            "success": True,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        }
        return jsonify(response), 200

def get_pagination_params():
    """Extract pagination parameters from request"""
    from flask import request
    
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 10)), 100)  # Max 100 items
        return page, per_page
    except ValueError:
        return 1, 10
