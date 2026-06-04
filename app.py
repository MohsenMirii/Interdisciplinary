# -*- coding: utf-8 -*-
"""
Hydrological Data Management System Backend
Created on Wed Feb 25 19:08:25 2026

@author: Mohsen
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt, verify_jwt_in_request
)
from passlib.context import CryptContext
from datetime import timedelta, datetime
from functools import wraps
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ==================== CORS Configuration ====================
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# ==================== Flask Configuration ====================
app.config['SQLALCHEMY_DATABASE_URI'] = (
    'mssql+pyodbc://@localhost/Interdisciplinary2?'
    'driver=ODBC+Driver+17+for+SQL+Server&'
    'trusted_connection=yes'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# ==================== Models ====================
class User(db.Model):
    """User model for authentication and authorization"""
    __tablename__ = 'Users'
    UserID = db.Column(db.Integer, primary_key=True)
    Username = db.Column(db.String(50), unique=True, nullable=False)
    Email = db.Column(db.String(100), unique=True, nullable=False)
    PasswordHash = db.Column(db.String(255), nullable=False)
    UserType = db.Column(db.String(20), nullable=False, default='Normal')  # 'Admin', 'Manager', 'Normal'
    IsActive = db.Column(db.Boolean, nullable=False, default=True)

class Station(db.Model):
    """Water station model"""
    __tablename__ = 'Stations'
    Id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    StationName = db.Column(db.NVARCHAR(300))
    WaterLevel = db.Column(db.DECIMAL(18, 4))
    NormalPoolLevel = db.Column(db.DECIMAL(18, 4))
    FloodControlLevel = db.Column(db.DECIMAL(18, 4))
    InstalledCapacity = db.Column(db.DECIMAL(18, 4))
    RegulationType = db.Column(db.NVARCHAR(100))
    Province = db.Column(db.NVARCHAR(200))
    ParentOrganization = db.Column(db.NVARCHAR(300))
    LongitudeLatitude = db.Column(db.NVARCHAR(300))
    CreationTime = db.Column(db.DateTime(timezone=True))

class HydrologicalData(db.Model):
    """Hydrological data records model"""
    __tablename__ = 'HydrologicalData'
    Id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    StationId = db.Column(db.BigInteger, db.ForeignKey('Stations.Id'))
    RecordDate = db.Column(db.Date)
    ReservoirWaterLevel = db.Column(db.DECIMAL(18, 4))
    InboundFlow = db.Column(db.DECIMAL(18, 4))
    OutboundFlow = db.Column(db.DECIMAL(18, 4))
    WaterStorageCapacity = db.Column(db.DECIMAL(18, 4))
    CreationTime = db.Column(db.DateTime)
    station = db.relationship('Station', backref='hydrological_data')

# ==================== Helper Functions ====================
def hash_password(password):
    """Hash password using pbkdf2_sha256"""
    return pwd_context.hash(password)

def verify_password(password_hash, password):
    """Verify password against hash"""
    return pwd_context.verify(password, password_hash)

def requires_user_type(*allowed_types):
    """Decorator to enforce role-based access control"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                claims = get_jwt()
                user_type = claims.get('user_type', 'Normal')
                if user_type not in allowed_types:
                    logger.warning(f"Access denied for user type: {user_type}")
                    return jsonify({'msg': 'Access denied: Insufficient privileges.'}), 403
                return f(*args, **kwargs)
            except Exception as e:
                logger.error(f"Authorization error: {str(e)}")
                return jsonify({'msg': 'Unauthorized access'}), 401
        return decorated_function
    return decorator

# ==================== Error Handlers ====================
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'msg': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'msg': 'Internal server error'}), 500

@app.errorhandler(400)
def bad_request(error):
    """Handle 400 errors"""
    return jsonify({'msg': 'Bad request'}), 400

# ==================== Health Check Endpoint ====================
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({'status': 'healthy', 'message': 'Server is running'}), 200

# ==================== Authentication Endpoints ====================
@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    """Register a new user"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'msg': 'No JSON data provided'}), 400

        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        user_type = data.get('user_type', 'Normal')

        # Validation
        if user_type not in ['Admin', 'Manager', 'Normal']:
            return jsonify({'msg': 'Invalid user type'}), 400

        if not username or not email or not password:
            return jsonify({'msg': 'Missing required fields: username, email, password'}), 400

        if len(password) < 6:
            return jsonify({'msg': 'Password must be at least 6 characters long'}), 400

        # Check if user exists
        if User.query.filter((User.Username == username) | (User.Email == email)).first():
            return jsonify({'msg': 'User already exists'}), 409

        # Create new user
        hashed_pw = hash_password(password)
        new_user = User(Username=username, Email=email, PasswordHash=hashed_pw, UserType=user_type, IsActive=True)
        db.session.add(new_user)
        db.session.commit()

        logger.info(f"User registered: {username} as {user_type}")
        return jsonify({'msg': f'User registered successfully as {user_type}'}), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'msg': 'Registration failed', 'error': str(e)}), 500

@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    """Authenticate user and return JWT token"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'msg': 'No JSON data provided'}), 400

        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'msg': 'Missing username or password'}), 400

        # Find user
        user = User.query.filter_by(Username=username).first()
        if not user or not verify_password(user.PasswordHash, password):
            logger.warning(f"Failed login attempt for username: {username}")
            return jsonify({'msg': 'Bad username or password'}), 401

        # Check if user is active
        if not user.IsActive:
            logger.warning(f"Inactive user attempted login: {username}")
            return jsonify({'msg': 'Your account has been deactivated.'}), 403

        # Generate JWT token
        additional_claims = {
            'username': user.Username,
            'user_type': user.UserType
        }
        access_token = create_access_token(identity=str(user.UserID), additional_claims=additional_claims)
        
        logger.info(f"User logged in: {username}")
        return jsonify(access_token=access_token, user_type=user.UserType, username=user.Username), 200
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'msg': 'Login failed', 'error': str(e)}), 500

# ==================== Station Endpoints ====================
@app.route('/stations', methods=['GET', 'OPTIONS'])
@requires_user_type('Admin', 'Manager', 'Normal')
def get_stations():
    """Retrieve all stations with optional filtering"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        query = Station.query
        
        # Apply filters
        if request.args.get('Id'):
            query = query.filter(Station.Id == request.args['Id'])
        if request.args.get('StationName'):
            query = query.filter(Station.StationName.contains(request.args['StationName']))
        if request.args.get('WaterLevel'):
            query = query.filter(Station.WaterLevel == request.args['WaterLevel'])
        if request.args.get('InstalledCapacity'):
            query = query.filter(Station.InstalledCapacity == request.args['InstalledCapacity'])

        stations = query.with_entities(Station.Id, Station.StationName).all()
        result = [{'Id': s.Id, 'StationName': s.StationName} for s in stations]
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Error fetching stations: {str(e)}")
        return jsonify({'msg': 'Error fetching stations', 'error': str(e)}), 500

@app.route('/stations/<int:id>', methods=['GET', 'OPTIONS'])
@requires_user_type('Admin', 'Manager', 'Normal')
def get_station_detail(id):
    """Retrieve detailed information for a specific station"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        station = Station.query.get(id)
        if not station:
            return jsonify({'msg': 'Station not found'}), 404

        result = {
            'Id': station.Id,
            'StationName': station.StationName,
            'WaterLevel': float(station.WaterLevel) if station.WaterLevel else None,
            'NormalPoolLevel': float(station.NormalPoolLevel) if station.NormalPoolLevel else None,
            'FloodControlLevel': float(station.FloodControlLevel) if station.FloodControlLevel else None,
            'InstalledCapacity': float(station.InstalledCapacity) if station.InstalledCapacity else None,
            'RegulationType': station.RegulationType,
            'Province': station.Province,
            'ParentOrganization': station.ParentOrganization,
            'LongitudeLatitude': station.LongitudeLatitude,
            'CreationTime': station.CreationTime.isoformat() if station.CreationTime else None
        }
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Error fetching station detail: {str(e)}")
        return jsonify({'msg': 'Error fetching station', 'error': str(e)}), 500

# ==================== Hydrological Data Endpoints ====================
@app.route('/hydrological', methods=['GET', 'OPTIONS'])
@requires_user_type('Admin', 'Manager', 'Normal')
def get_hydrological_list():
    """Retrieve all hydrological data with optional filtering"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        query = HydrologicalData.query
        
        # Apply filters
        if request.args.get('Id'):
            query = query.filter(HydrologicalData.Id == request.args['Id'])
        if request.args.get('StationId'):
            query = query.filter(HydrologicalData.StationId == request.args['StationId'])
        if request.args.get('RecordDate'):
            query = query.filter(HydrologicalData.RecordDate == request.args['RecordDate'])

        query = query.order_by(HydrologicalData.RecordDate.desc())
        records = query.with_entities(
            HydrologicalData.Id,
            HydrologicalData.StationId,
            HydrologicalData.RecordDate,
            HydrologicalData.ReservoirWaterLevel
        ).all()

        result = [{
            'Id': r.Id,
            'StationId': r.StationId,
            'RecordDate': r.RecordDate.isoformat() if r.RecordDate else None,
            'ReservoirWaterLevel': float(r.ReservoirWaterLevel) if r.ReservoirWaterLevel else None
        } for r in records]
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Error fetching hydrological data: {str(e)}")
        return jsonify({'msg': 'Error fetching hydrological data', 'error': str(e)}), 500

@app.route('/hydrological/<int:id>', methods=['GET', 'OPTIONS'])
@requires_user_type('Admin', 'Manager', 'Normal')
def get_hydrological_detail(id):
    """Retrieve detailed information for a specific hydrological record"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        record = HydrologicalData.query.get(id)
        if not record:
            return jsonify({'msg': 'Hydrological record not found'}), 404

        result = {
            'Id': record.Id,
            'StationId': record.StationId,
            'RecordDate': record.RecordDate.isoformat() if record.RecordDate else None,
            'ReservoirWaterLevel': float(record.ReservoirWaterLevel) if record.ReservoirWaterLevel else None,
            'InboundFlow': float(record.InboundFlow) if record.InboundFlow else None,
            'OutboundFlow': float(record.OutboundFlow) if record.OutboundFlow else None,
            'WaterStorageCapacity': float(record.WaterStorageCapacity) if record.WaterStorageCapacity else None,
            'CreationTime': record.CreationTime.isoformat() if record.CreationTime else None
        }
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Error fetching hydrological detail: {str(e)}")
        return jsonify({'msg': 'Error fetching hydrological record', 'error': str(e)}), 500

@app.route('/hydrological/station/<int:stationId>', methods=['GET', 'OPTIONS'])
@requires_user_type('Admin', 'Manager', 'Normal')
def get_hydrological_by_station(stationId):
    """Retrieve all hydrological records for a specific station"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        records = HydrologicalData.query.filter_by(StationId=stationId).all()
        result = [{
            'Id': r.Id,
            'StationId': r.StationId,
            'RecordDate': r.RecordDate.isoformat() if r.RecordDate else None,
            'ReservoirWaterLevel': float(r.ReservoirWaterLevel) if r.ReservoirWaterLevel else None,
            'InboundFlow': float(r.InboundFlow) if r.InboundFlow else None,
            'OutboundFlow': float(r.OutboundFlow) if r.OutboundFlow else None,
            'WaterStorageCapacity': float(r.WaterStorageCapacity) if r.WaterStorageCapacity else None,
            'CreationTime': r.CreationTime.isoformat() if r.CreationTime else None
        } for r in records]
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Error fetching hydrological by station: {str(e)}")
        return jsonify({'msg': 'Error fetching hydrological records', 'error': str(e)}), 500

# ==================== Admin: Bulk Upload Endpoints ====================
@app.route('/admin/stations/bulk', methods=['POST', 'OPTIONS'])
@requires_user_type('Admin')
def bulk_add_stations():
    """Bulk upload stations data"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not isinstance(data, list):
            return jsonify({'msg': 'Invalid format. Expected a JSON array of stations.'}), 400

        new_stations = []
        for index, item in enumerate(data):
            station_name = item.get('StationName')
            if not station_name:
                return jsonify({'msg': f'Missing StationName at index {index}'}), 400

            creation_time_str = item.get('CreationTime')
            creation_time = None
            if creation_time_str:
                try:
                    creation_time = datetime.fromisoformat(creation_time_str)
                except ValueError:
                    return jsonify({'msg': f'Invalid CreationTime format at index {index}. Use ISO format.'}), 400

            station = Station(
                StationName=station_name,
                WaterLevel=item.get('WaterLevel'),
                NormalPoolLevel=item.get('NormalPoolLevel'),
                FloodControlLevel=item.get('FloodControlLevel'),
                InstalledCapacity=item.get('InstalledCapacity'),
                RegulationType=item.get('RegulationType'),
                Province=item.get('Province'),
                ParentOrganization=item.get('ParentOrganization'),
                LongitudeLatitude=item.get('LongitudeLatitude'),
                CreationTime=creation_time if creation_time else datetime.utcnow()
            )
            new_stations.append(station)

        db.session.add_all(new_stations)
        db.session.commit()
        logger.info(f"Bulk uploaded {len(new_stations)} stations")
        return jsonify({'msg': f'{len(new_stations)} stations added successfully.'}), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Bulk station upload error: {str(e)}")
        return jsonify({'msg': 'Database operation failed', 'error': str(e)}), 500

@app.route('/admin/hydrological/bulk', methods=['POST', 'OPTIONS'])
@requires_user_type('Admin')
def bulk_add_hydrological_data():
    """Bulk upload hydrological data"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not isinstance(data, list):
            return jsonify({'msg': 'Invalid format. Expected a JSON array of records.'}), 400

        new_records = []
        verified_stations = set()

        for index, item in enumerate(data):
            station_id = item.get('StationId')
            record_date_str = item.get('RecordDate')

            if not station_id or not record_date_str:
                return jsonify({'msg': f'Missing StationId or RecordDate at index {index}'}), 400

            if station_id not in verified_stations:
                if not Station.query.get(station_id):
                    return jsonify({'msg': f'StationId {station_id} at index {index} does not exist.'}), 400
                verified_stations.add(station_id)

            try:
                record_date = datetime.fromisoformat(record_date_str).date()
            except ValueError:
                return jsonify({'msg': f'Invalid RecordDate format at index {index}. Use YYYY-MM-DD.'}), 400

            creation_time_str = item.get('CreationTime')
            creation_time = None
            if creation_time_str:
                try:
                    creation_time = datetime.fromisoformat(creation_time_str)
                except ValueError:
                    return jsonify({'msg': f'Invalid CreationTime format at index {index}.'}), 400

            record = HydrologicalData(
                StationId=station_id,
                RecordDate=record_date,
                ReservoirWaterLevel=item.get('ReservoirWaterLevel'),
                InboundFlow=item.get('InboundFlow'),
                OutboundFlow=item.get('OutboundFlow'),
                WaterStorageCapacity=item.get('WaterStorageCapacity'),
                CreationTime=creation_time if creation_time else datetime.utcnow()
            )
            new_records.append(record)

        db.session.add_all(new_records)
        db.session.commit()
        logger.info(f"Bulk uploaded {len(new_records)} hydrological records")
        return jsonify({'msg': f'{len(new_records)} hydrological records added successfully.'}), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Bulk hydrological upload error: {str(e)}")
        return jsonify({'msg': 'Database operation failed', 'error': str(e)}), 500

# ==================== Manager & Admin: User Management ====================
@app.route('/manager/users/<int:user_id>/status', methods=['PUT', 'OPTIONS'])
@requires_user_type('Admin', 'Manager')
def toggle_user_status(user_id):
    """Update user active/inactive status"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        current_user_claims = get_jwt()
        current_user_type = current_user_claims.get('user_type')

        user = User.query.get(user_id)
        if not user:
            return jsonify({'msg': 'User not found'}), 404

        # Protection: Prevent Managers from changing an Admin's status
        if current_user_type == 'Manager' and user.UserType == 'Admin':
            logger.warning(f"Manager attempted to modify Admin user {user_id}")
            return jsonify({'msg': 'Managers cannot modify Admin users.'}), 403

        data = request.get_json()
        is_active = data.get('is_active')

        if is_active is None or not isinstance(is_active, bool):
            return jsonify({'msg': "Missing or invalid 'is_active' boolean flag."}), 400

        user.IsActive = is_active
        db.session.commit()

        status_str = "enabled" if is_active else "disabled"
        logger.info(f"User {user.Username} status changed to {status_str}")
        return jsonify({'msg': f'User status successfully changed to {status_str}.'}), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating user status: {str(e)}")
        return jsonify({'msg': 'Error updating user status', 'error': str(e)}), 500

@app.route('/manager/users', methods=['GET', 'OPTIONS'])
@requires_user_type('Admin', 'Manager')
def list_users_summary():
    """List all users (utility endpoint for Managers/Admins)"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        users = User.query.all()
        result = [{
            'UserID': u.UserID,
            'Username': u.Username,
            'Email': u.Email,
            'UserType': u.UserType,
            'IsActive': u.IsActive
        } for u in users]
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        return jsonify({'msg': 'Error fetching users', 'error': str(e)}), 500

# ==================== Application Entry Point ====================
if __name__ == '__main__':
    logger.info("Starting Hydrological Data Management System")
    app.run(debug=True, host='0.0.0.0', port=5000)
