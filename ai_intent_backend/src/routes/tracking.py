from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from src.models.user import User, UserSession, UserEvent, IntentPrediction, ConsentRecord, ModelPerformance, db
from src.models.ai_predictor import intent_predictor
from datetime import datetime
import json
import uuid
import random

# Enable CORS for all routes
tracking_bp = Blueprint('tracking', __name__)

@tracking_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Session Management Routes
@tracking_bp.route('/session/start', methods=['POST', 'OPTIONS'])
@cross_origin()
def start_session():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json or {}
        
        # Generate unique session ID
        session_id = data.get('session_id') or f"sess_{uuid.uuid4().hex[:12]}"
        
        # Check if session already exists
        existing_session = UserSession.query.filter_by(session_id=session_id).first()
        if existing_session:
            return jsonify(existing_session.to_dict()), 200
        
        # Create new session
        session = UserSession(
            session_id=session_id,
            user_id=data.get('user_id'),
            device_info=json.dumps(data.get('device_info', {})),
            referrer=data.get('referrer'),
            consent_status=json.dumps(data.get('consent_status', {})),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify(session.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/session/<session_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_session(session_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        session = UserSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        return jsonify(session.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/session/<session_id>/end', methods=['POST', 'OPTIONS'])
@cross_origin()
def end_session(session_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        session = UserSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        session.end_time = datetime.utcnow()
        db.session.commit()
        
        return jsonify(session.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Event Tracking Routes
@tracking_bp.route('/track/event', methods=['POST', 'OPTIONS'])
@cross_origin()
def track_event():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['session_id', 'event_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create event
        event = UserEvent(
            event_id=f"evt_{uuid.uuid4().hex[:12]}",
            session_id=data['session_id'],
            event_type=data['event_type'],
            event_data=json.dumps(data.get('event_data', {})),
            page_url=data.get('page_url'),
            element_id=data.get('element_id'),
            element_class=data.get('element_class'),
            x_coordinate=data.get('x_coordinate'),
            y_coordinate=data.get('y_coordinate')
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify(event.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/track/page-view', methods=['POST', 'OPTIONS'])
@cross_origin()
def track_page_view():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Create page view event
        event = UserEvent(
            event_id=f"evt_{uuid.uuid4().hex[:12]}",
            session_id=data['session_id'],
            event_type='page_view',
            event_data=json.dumps({
                'title': data.get('title'),
                'url': data.get('url'),
                'referrer': data.get('referrer')
            }),
            page_url=data.get('url')
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify(event.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/session/<session_id>/events', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_session_events(session_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        events = UserEvent.query.filter_by(session_id=session_id).order_by(UserEvent.timestamp.desc()).all()
        return jsonify([event.to_dict() for event in events]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# AI Prediction Routes
@tracking_bp.route('/predict/intent', methods=['POST', 'OPTIONS'])
@cross_origin()
def predict_intent():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        if not data or 'session_id' not in data:
            return jsonify({'error': 'Session ID required'}), 400
        
        session_id = data['session_id']
        
        # Get session data
        session = UserSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get session events
        events = UserEvent.query.filter_by(session_id=session_id).all()
        
        # Convert to dictionaries for AI predictor
        session_data = session.to_dict()
        events_data = [event.to_dict() for event in events]
        
        # Predict intent
        prediction_result = intent_predictor.predict_intent(session_data, events_data)
        
        if 'error' in prediction_result:
            return jsonify(prediction_result), 500
        
        # Extract prediction data
        primary_intent = prediction_result['primary_intent']
        confidence = prediction_result['confidence']
        secondary_intents = prediction_result['secondary_intents']
        factors = prediction_result['factors']
        prediction_id = prediction_result['prediction_id']
        
        # Save prediction to database
        prediction = IntentPrediction(
            prediction_id=prediction_id,
            session_id=session_id,
            predicted_intent=primary_intent,
            confidence_score=confidence,
            model_version=intent_predictor.model_version,
            features_used=json.dumps({}),  # Features are internal to the predictor now
            secondary_intents=json.dumps(secondary_intents)
        )
        
        db.session.add(prediction)
        db.session.commit()
        
        return jsonify({
            'primary_intent': primary_intent,
            'confidence': confidence,
            'secondary_intents': secondary_intents,
            'factors': factors,
            'prediction_id': prediction_id,
            'model_version': intent_predictor.model_version
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/predict/confidence/<session_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_prediction_confidence(session_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get latest prediction for session
        prediction = IntentPrediction.query.filter_by(session_id=session_id).order_by(IntentPrediction.timestamp.desc()).first()
        
        if not prediction:
            return jsonify({'error': 'No predictions found for session'}), 404
        
        return jsonify({
            'confidence': prediction.confidence_score,
            'intent': prediction.predicted_intent,
            'timestamp': prediction.timestamp.isoformat(),
            'model_version': prediction.model_version
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/session/<session_id>/predictions', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_session_predictions(session_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        predictions = IntentPrediction.query.filter_by(session_id=session_id).order_by(IntentPrediction.timestamp.desc()).all()
        return jsonify([prediction.to_dict() for prediction in predictions]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Analytics Routes
@tracking_bp.route('/analytics/performance', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_model_performance():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get current model performance
        performance = intent_predictor.get_model_performance()
        
        return jsonify(performance), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/analytics/stats', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_analytics_stats():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get real-time statistics
        total_sessions = UserSession.query.count()
        total_events = UserEvent.query.count()
        total_predictions = IntentPrediction.query.count()
        
        # Active sessions (last 24 hours)
        from datetime import timedelta
        yesterday = datetime.utcnow() - timedelta(days=1)
        active_sessions = UserSession.query.filter(UserSession.start_time >= yesterday).count()
        
        # Events per second (approximate)
        recent_events = UserEvent.query.filter(UserEvent.timestamp >= yesterday).count()
        events_per_second = round(recent_events / (24 * 3600), 2) if recent_events > 0 else 0
        
        return jsonify({
            'total_sessions': total_sessions,
            'total_events': total_events,
            'total_predictions': total_predictions,
            'active_sessions': active_sessions,
            'events_per_second': events_per_second,
            'prediction_accuracy': intent_predictor.get_model_performance()['accuracy']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Privacy and Consent Routes
@tracking_bp.route('/privacy/consent', methods=['POST', 'OPTIONS'])
@cross_origin()
def update_consent():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        session_id = data.get('session_id')
        consent_data = data.get('consent', {})
        
        if not session_id:
            return jsonify({'error': 'Session ID required'}), 400
        
        # Update session consent status
        session = UserSession.query.filter_by(session_id=session_id).first()
        if session:
            session.consent_status = json.dumps(consent_data)
            db.session.commit()
        
        # Record individual consent entries
        for consent_type, consent_given in consent_data.items():
            consent_record = ConsentRecord(
                session_id=session_id,
                consent_type=consent_type,
                consent_given=consent_given,
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            db.session.add(consent_record)
        
        db.session.commit()
        
        return jsonify({'message': 'Consent updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/privacy/data/<session_id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_user_data(session_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get all data for the session
        session = UserSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        events = UserEvent.query.filter_by(session_id=session_id).all()
        predictions = IntentPrediction.query.filter_by(session_id=session_id).all()
        consent_records = ConsentRecord.query.filter_by(session_id=session_id).all()
        
        return jsonify({
            'session': session.to_dict(),
            'events': [event.to_dict() for event in events],
            'predictions': [prediction.to_dict() for prediction in predictions],
            'consent_records': [record.to_dict() for record in consent_records]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tracking_bp.route('/privacy/data/<session_id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def delete_user_data(session_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Delete all data for the session
        session = UserSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Delete related records (cascading should handle this, but being explicit)
        UserEvent.query.filter_by(session_id=session_id).delete()
        IntentPrediction.query.filter_by(session_id=session_id).delete()
        ConsentRecord.query.filter_by(session_id=session_id).delete()
        
        # Delete session
        db.session.delete(session)
        db.session.commit()
        
        return jsonify({'message': 'User data deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health Check Route
@tracking_bp.route('/health', methods=['GET', 'OPTIONS'])
@cross_origin()
def health_check():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Check database connection
        from sqlalchemy import text
        db.session.execute(text('SELECT 1'))
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'model_version': intent_predictor.model_version
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

