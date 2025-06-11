from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import Schema, fields, ValidationError, validate
from datetime import datetime
from functools import wraps
from flask import request, jsonify
import re

# Rate limiter setup
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per hour", "20 per minute"],
    headers_enabled=True
)

# Custom validators
def validate_session_id(value):
    """Validate session ID format"""
    if not re.match(r'^sess_[a-zA-Z0-9]{12}$', value):
        raise ValidationError('Invalid session ID format')

def validate_event_type(value):
    """Validate event type"""
    allowed_types = ['click', 'scroll', 'page_view', 'form_submit', 'hover', 'focus', 'blur']
    if value not in allowed_types:
        raise ValidationError(f'Event type must be one of: {", ".join(allowed_types)}')

def validate_url(value):
    """Validate URL format"""
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    if value and not url_pattern.match(value):
        raise ValidationError('Invalid URL format')

# Validation schemas
class SessionStartSchema(Schema):
    session_id = fields.Str(required=False, validate=validate_session_id)
    user_id = fields.Str(required=False, validate=validate.Length(max=255))
    device_info = fields.Dict(required=False)
    referrer = fields.Str(required=False, allow_none=True, validate=validate_url)
    consent_status = fields.Dict(required=False)

class EventTrackingSchema(Schema):
    session_id = fields.Str(required=True, validate=validate_session_id)
    event_type = fields.Str(required=True, validate=validate_event_type)
    event_data = fields.Dict(required=False)
    page_url = fields.Str(required=False, validate=validate_url)
    element_id = fields.Str(required=False, validate=validate.Length(max=255))
    element_class = fields.Str(required=False, validate=validate.Length(max=255))
    x_coordinate = fields.Int(required=False, validate=validate.Range(min=0, max=10000))
    y_coordinate = fields.Int(required=False, validate=validate.Range(min=0, max=10000))

class ConsentSchema(Schema):
    session_id = fields.Str(required=True, validate=validate_session_id)
    consent = fields.Dict(required=True)
    
    class Meta:
        unknown = 'EXCLUDE'  # Ignore unknown fields

def validate_schema(schema_class):
    """Schema validation decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            schema = schema_class()
            try:
                data = request.get_json()
                validated_data = schema.load(data)
                request.validated_data = validated_data
                return f(*args, **kwargs)
            except ValidationError as err:
                return jsonify({'error': 'Validation failed', 'details': err.messages}), 400
        return decorated_function
    return decorator

# Security headers
def add_security_headers(response):
    """Add security headers to responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response
