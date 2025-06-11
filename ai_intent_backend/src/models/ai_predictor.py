import json
import random
import math
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from src.utils.cache import cached_prediction, performance_monitor

class IntentPredictor:
    """
    AI-powered intent prediction engine using rule-based algorithms
    and statistical analysis without external ML dependencies.
    """
    
    def __init__(self):
        self.model_version = "v1.0.0"
        self.intent_categories = [
            "Information", "Research", "Purchase", "Learning", 
            "Entertainment", "Navigation", "Support", "Comparison"
        ]
        
        # Behavioral patterns for intent prediction
        self.patterns = {
            "Information": {
                "time_range": (10, 120),  # 10s to 2min
                "click_range": (1, 5),
                "scroll_range": (20, 80),
                "keywords": ["info", "about", "what", "how", "guide"]
            },
            "Research": {
                "time_range": (60, 600),  # 1min to 10min
                "click_range": (3, 15),
                "scroll_range": (40, 100),
                "keywords": ["research", "study", "analysis", "compare", "review"]
            },
            "Purchase": {
                "time_range": (30, 300),  # 30s to 5min
                "click_range": (2, 10),
                "scroll_range": (30, 90),
                "keywords": ["buy", "price", "cart", "checkout", "order"]
            },
            "Learning": {
                "time_range": (120, 1800),  # 2min to 30min
                "click_range": (5, 20),
                "scroll_range": (60, 100),
                "keywords": ["learn", "tutorial", "course", "lesson", "education"]
            },
            "Entertainment": {
                "time_range": (60, 900),  # 1min to 15min
                "click_range": (3, 12),
                "scroll_range": (20, 70),
                "keywords": ["fun", "game", "video", "music", "entertainment"]
            },
            "Navigation": {
                "time_range": (5, 60),  # 5s to 1min
                "click_range": (1, 3),
                "scroll_range": (10, 40),
                "keywords": ["menu", "home", "contact", "about", "navigate"]
            },
            "Support": {
                "time_range": (30, 600),  # 30s to 10min
                "click_range": (2, 8),
                "scroll_range": (30, 80),
                "keywords": ["help", "support", "faq", "contact", "problem"]
            },
            "Comparison": {
                "time_range": (90, 480),  # 1.5min to 8min
                "click_range": (4, 15),
                "scroll_range": (50, 100),
                "keywords": ["vs", "compare", "difference", "better", "alternative"]
            }
        }
    
    @cached_prediction(ttl=300)
    @performance_monitor
    def predict_intent(self, session_data: Dict[str, Any], events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predict user intent based on session data and behavioral events.
        """
        try:
            # Validate input data
            if not isinstance(session_data, dict) or not isinstance(events, list):
                raise ValueError("Invalid input data format")
            
            # Extract features from session and events
            features = self.extract_features(session_data, events)
            
            # Calculate intent scores
            intent_scores = self.calculate_intent_scores(features)
            
            # Get primary and secondary intents
            sorted_intents = sorted(intent_scores.items(), key=lambda x: x[1], reverse=True)
            primary_intent = sorted_intents[0][0]
            primary_confidence = sorted_intents[0][1]
            
            # Get secondary intents (top 3 excluding primary)
            secondary_intents = [
                {"intent": intent, "confidence": round(score, 1)}
                for intent, score in sorted_intents[1:4]
                if score > 30  # Only include if confidence > 30%
            ]
            
            # Generate prediction factors
            factors = self.generate_prediction_factors(features, primary_intent)
            
            # Generate unique prediction ID
            prediction_id = f"pred_{random.randint(100000, 999999):06x}"
            
            return {
                "prediction_id": prediction_id,
                "primary_intent": primary_intent,
                "confidence": round(primary_confidence, 1),
                "secondary_intents": secondary_intents,
                "factors": factors,
                "model_version": self.model_version
            }
            
        except Exception as e:
            return {
                "error": f"Prediction failed: {str(e)}",
                "model_version": self.model_version
            }
    
    def extract_features(self, session_data: Dict[str, Any], events: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Extract numerical features from session data and events.
        """
        features = {}
        
        # Time-based features
        start_time = session_data.get('start_time')
        if start_time:
            if isinstance(start_time, str):
                start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            session_duration = (datetime.utcnow() - start_time.replace(tzinfo=None)).total_seconds()
        else:
            session_duration = 0
        
        features['session_duration'] = session_duration
        features['time_score'] = min(session_duration / 300, 1.0)  # Normalize to 5 minutes
        
        # Event-based features
        features['total_events'] = len(events)
        features['click_count'] = len([e for e in events if e.get('event_type') == 'click'])
        features['scroll_count'] = len([e for e in events if e.get('event_type') == 'scroll'])
        features['page_views'] = len([e for e in events if e.get('event_type') == 'page_view'])
        
        # Calculate scroll depth (average from scroll events)
        scroll_events = [e for e in events if e.get('event_type') == 'scroll']
        if scroll_events:
            scroll_depths = []
            for event in scroll_events:
                event_data = event.get('event_data', {})
                if isinstance(event_data, str):
                    try:
                        event_data = json.loads(event_data)
                    except:
                        event_data = {}
                scroll_depth = event_data.get('scroll_depth', 0)
                if isinstance(scroll_depth, (int, float)):
                    scroll_depths.append(scroll_depth)
            features['avg_scroll_depth'] = sum(scroll_depths) / len(scroll_depths) if scroll_depths else 0
        else:
            features['avg_scroll_depth'] = 0
        
        # Device and context features
        device_info = session_data.get('device_info', {})
        if isinstance(device_info, str):
            try:
                device_info = json.loads(device_info)
            except:
                device_info = {}
        
        # Encode device type
        device_type = device_info.get('device_type', 'desktop')
        if isinstance(device_type, str):
            device_type = device_type.lower()
        features['device_type'] = 1.0 if device_type == 'mobile' else 0.5 if device_type == 'tablet' else 0.0
        
        # Encode referrer type
        referrer = session_data.get('referrer', '') or ''
        if isinstance(referrer, str):
            referrer_lower = referrer.lower()
            if 'google' in referrer_lower or 'search' in referrer_lower:
                features['referrer_type'] = 1.0  # Search engine
            elif 'social' in referrer_lower or 'facebook' in referrer_lower or 'twitter' in referrer_lower:
                features['referrer_type'] = 0.5  # Social media
            else:
                features['referrer_type'] = 0.0  # Direct or other
        else:
            features['referrer_type'] = 0.0
        
        return features
    
    def calculate_intent_scores(self, features: Dict[str, float]) -> Dict[str, float]:
        """
        Calculate confidence scores for each intent category.
        """
        scores = {}
        
        for intent, pattern in self.patterns.items():
            score = 0.0
            
            # Time-based scoring
            time_min, time_max = pattern['time_range']
            session_duration = features.get('session_duration', 0)
            if time_min <= session_duration <= time_max:
                score += 30.0
            elif session_duration > time_max:
                score += 20.0
            else:
                score += 10.0
            
            # Click-based scoring
            click_min, click_max = pattern['click_range']
            click_count = features.get('click_count', 0)
            if click_min <= click_count <= click_max:
                score += 25.0
            elif click_count > click_max:
                score += 15.0
            else:
                score += 5.0
            
            # Scroll-based scoring
            scroll_min, scroll_max = pattern['scroll_range']
            avg_scroll = features.get('avg_scroll_depth', 0)
            if scroll_min <= avg_scroll <= scroll_max:
                score += 25.0
            elif avg_scroll > scroll_max:
                score += 15.0
            else:
                score += 5.0
            
            # Device type bonus
            device_score = features.get('device_type', 0)
            if intent in ['Information', 'Navigation'] and device_score > 0.5:
                score += 10.0  # Mobile users often seek quick info
            elif intent in ['Research', 'Learning'] and device_score == 0.0:
                score += 10.0  # Desktop users often do deep research
            
            # Referrer type bonus
            referrer_score = features.get('referrer_type', 0)
            if intent in ['Information', 'Research'] and referrer_score == 1.0:
                score += 10.0  # Search engine traffic often seeks info
            
            # Add some randomness for realistic variation
            score += random.uniform(-5, 5)
            
            # Ensure score is within reasonable bounds
            scores[intent] = max(0, min(100, score))
        
        return scores
    
    def generate_prediction_factors(self, features: Dict[str, float], primary_intent: str) -> List[Dict[str, str]]:
        """
        Generate human-readable factors that influenced the prediction.
        """
        factors = []
        
        session_duration = features.get('session_duration', 0)
        click_count = features.get('click_count', 0)
        scroll_depth = features.get('avg_scroll_depth', 0)
        
        # Time-based factors
        if session_duration > 120:
            factors.append({
                "factor": "Time Patterns",
                "description": f"Extended session duration ({int(session_duration)}s) indicates {primary_intent.lower()} or learning intent",
                "weight": "High"
            })
        elif session_duration < 30:
            factors.append({
                "factor": "Time Patterns",
                "description": f"Brief session ({int(session_duration)}s) suggests quick information seeking",
                "weight": "Medium"
            })
        
        # Interaction factors
        if click_count > 5:
            factors.append({
                "factor": "Interaction Level",
                "description": f"High interaction count ({click_count} clicks) indicates engaged {primary_intent.lower()} behavior",
                "weight": "High"
            })
        elif click_count == 0:
            factors.append({
                "factor": "Interaction Level",
                "description": "No clicks detected - user may be reading or browsing",
                "weight": "Medium"
            })
        
        # Scroll behavior factors
        if scroll_depth > 70:
            factors.append({
                "factor": "Content Engagement",
                "description": f"Deep scrolling ({scroll_depth:.0f}%) shows strong interest in content",
                "weight": "High"
            })
        elif scroll_depth < 20:
            factors.append({
                "factor": "Content Engagement",
                "description": "Limited scrolling suggests quick scanning or specific target",
                "weight": "Medium"
            })
        
        # Device context
        device_type = features.get('device_type', 0)
        if device_type > 0.5:
            factors.append({
                "factor": "Device Context",
                "description": "Mobile device usage often indicates on-the-go information needs",
                "weight": "Low"
            })
        
        return factors[:3]  # Return top 3 factors

# Create global instance
intent_predictor = IntentPredictor()

