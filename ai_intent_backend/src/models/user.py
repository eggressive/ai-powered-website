from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }

class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), unique=True, nullable=False, index=True)
    user_id = db.Column(db.String(255), nullable=True)
    start_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)
    device_info = db.Column(db.Text, nullable=True)  # JSON string
    referrer = db.Column(db.String(500), nullable=True)
    consent_status = db.Column(db.Text, nullable=True)  # JSON string
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    
    # Relationship to events
    events = db.relationship('UserEvent', backref='session', lazy=True, cascade='all, delete-orphan')
    predictions = db.relationship('IntentPrediction', backref='session', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<UserSession {self.session_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'device_info': json.loads(self.device_info) if self.device_info else None,
            'referrer': self.referrer,
            'consent_status': json.loads(self.consent_status) if self.consent_status else None,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent
        }

class UserEvent(db.Model):
    __tablename__ = 'user_events'
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(255), unique=True, nullable=False, index=True)
    session_id = db.Column(db.String(255), db.ForeignKey('user_sessions.session_id'), nullable=False)
    event_type = db.Column(db.String(100), nullable=False, index=True)
    event_data = db.Column(db.Text, nullable=True)  # JSON string
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    page_url = db.Column(db.String(500), nullable=True)
    element_id = db.Column(db.String(255), nullable=True)
    element_class = db.Column(db.String(255), nullable=True)
    x_coordinate = db.Column(db.Integer, nullable=True)
    y_coordinate = db.Column(db.Integer, nullable=True)
    
    def __repr__(self):
        return f'<UserEvent {self.event_id}: {self.event_type}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'session_id': self.session_id,
            'event_type': self.event_type,
            'event_data': json.loads(self.event_data) if self.event_data else None,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'page_url': self.page_url,
            'element_id': self.element_id,
            'element_class': self.element_class,
            'x_coordinate': self.x_coordinate,
            'y_coordinate': self.y_coordinate
        }

class IntentPrediction(db.Model):
    __tablename__ = 'intent_predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    prediction_id = db.Column(db.String(255), unique=True, nullable=False, index=True)
    session_id = db.Column(db.String(255), db.ForeignKey('user_sessions.session_id'), nullable=False)
    predicted_intent = db.Column(db.String(100), nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)
    model_version = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    features_used = db.Column(db.Text, nullable=True)  # JSON string
    secondary_intents = db.Column(db.Text, nullable=True)  # JSON string
    
    def __repr__(self):
        return f'<IntentPrediction {self.prediction_id}: {self.predicted_intent}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'prediction_id': self.prediction_id,
            'session_id': self.session_id,
            'predicted_intent': self.predicted_intent,
            'confidence_score': self.confidence_score,
            'model_version': self.model_version,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'features_used': json.loads(self.features_used) if self.features_used else None,
            'secondary_intents': json.loads(self.secondary_intents) if self.secondary_intents else None
        }

class ConsentRecord(db.Model):
    __tablename__ = 'consent_records'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), nullable=False, index=True)
    consent_type = db.Column(db.String(50), nullable=False)  # necessary, analytics, marketing, personalization
    consent_given = db.Column(db.Boolean, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    
    def __repr__(self):
        return f'<ConsentRecord {self.session_id}: {self.consent_type}={self.consent_given}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'consent_type': self.consent_type,
            'consent_given': self.consent_given,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent
        }

class ModelPerformance(db.Model):
    __tablename__ = 'model_performance'
    
    id = db.Column(db.Integer, primary_key=True)
    model_version = db.Column(db.String(50), nullable=False)
    accuracy = db.Column(db.Float, nullable=False)
    precision = db.Column(db.Float, nullable=False)
    recall = db.Column(db.Float, nullable=False)
    f1_score = db.Column(db.Float, nullable=False)
    training_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    test_samples = db.Column(db.Integer, nullable=False)
    
    def __repr__(self):
        return f'<ModelPerformance {self.model_version}: {self.accuracy}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'model_version': self.model_version,
            'accuracy': self.accuracy,
            'precision': self.precision,
            'recall': self.recall,
            'f1_score': self.f1_score,
            'training_date': self.training_date.isoformat() if self.training_date else None,
            'test_samples': self.test_samples
        }

