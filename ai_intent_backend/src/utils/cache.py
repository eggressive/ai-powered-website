from functools import wraps
from flask import request, current_app
import time
import json
import hashlib

class SimpleCache:
    """Simple in-memory cache for development"""
    def __init__(self):
        self._cache = {}
        self._timestamps = {}
    
    def get(self, key):
        """Get value from cache"""
        if key in self._cache:
            timestamp = self._timestamps.get(key, 0)
            ttl = current_app.config.get('PREDICTION_CACHE_TTL', 300)
            if time.time() - timestamp < ttl:
                return self._cache[key]
            else:
                # Expired, remove from cache
                self._cache.pop(key, None)
                self._timestamps.pop(key, None)
        return None
    
    def set(self, key, value):
        """Set value in cache"""
        self._cache[key] = value
        self._timestamps[key] = time.time()
    
    def delete(self, key):
        """Delete value from cache"""
        self._cache.pop(key, None)
        self._timestamps.pop(key, None)
    
    def clear(self):
        """Clear all cache"""
        self._cache.clear()
        self._timestamps.clear()

# Global cache instance
cache = SimpleCache()

def cache_key(*args, **kwargs):
    """Generate cache key from arguments"""
    key_data = str(args) + str(sorted(kwargs.items()))
    return hashlib.md5(key_data.encode()).hexdigest()

def cached_prediction(ttl=300):
    """Decorator to cache AI predictions"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from session data
            key = cache_key(*args, **kwargs)
            
            # Try to get from cache first
            cached_result = cache.get(key)
            if cached_result:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(key, result)
            return result
        return wrapper
    return decorator

def performance_monitor(func):
    """Decorator to monitor function performance"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # Log slow operations (> 1 second)
            if execution_time > 1.0:
                current_app.logger.warning(
                    f"Slow operation: {func.__name__} took {execution_time:.2f}s"
                )
            
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            current_app.logger.error(
                f"Error in {func.__name__} after {execution_time:.2f}s: {str(e)}"
            )
            raise
    return wrapper
