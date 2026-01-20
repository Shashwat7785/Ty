from flask import Flask, request, jsonify, render_template, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
CORS(app)
app.secret_key = 'yourycjytty' # Unified secret key at the top

basedir = os.path.abspath(os.path.dirname(__file__))

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    mbti_type = db.Column(db.String(4), nullable=True)
    gender = db.Column(db.String(20))
    bio = db.Column(db.Text)
    interests = db.Column(db.String(200))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Personality Match Map
COMPATIBILITY_MAP = {
    "ENFJ": ["INFP", "ISFP"], "INTP": ["ENTJ", "ESTJ"], "INFP": ["ENFJ", "ENTJ"],
    "ENTP": ["INFJ", "INTJ"], "ENFP": ["INTJ", "INFJ"], "ISTJ": ["ESFJ", "ISFJ"],
    "ISFJ": ["ESFP", "ESTP"], "ESTJ": ["ISFP", "ISTP"], "ESFJ": ["ISFP", "ISTP"],
    "ISTP": ["ESTJ", "ENTJ"], "ISFP": ["ESFJ", "ESTJ"], "ESTP": ["ISFJ", "ESFJ"],
    "ESFP": ["ISFJ", "ESFJ"], "INFJ": ["ENTP", "ENFP"], "INTJ": ["ENFP", "ENTP"],
    "ENTJ": ["INTP", "ISTP"]
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        print(f"DEBUG: Data received from frontend: {data}") # See what JS is sending

        # 1. Clean and validate email
        email_raw = data.get('email')
        if not email_raw:
            return jsonify({"message": "Email is required"}), 400
            
        email_clean = email_raw.strip().lower()
        if not email_clean.endswith("@mnit.ac.in"):
            return jsonify({"message": "Access Denied: Please use an @mnit.ac.in email address."}), 403
        # 2. Check for existing user
        if User.query.filter_by(email=email_clean).first():
            print(f"DEBUG: Registration failed. {email_clean} already exists.")
            return jsonify({"message": "Email already exists"}), 400

        # 3. Create and Save User
        new_user = User(
            username=data.get('username'),
            email=email_clean,
            gender=data.get('gender'),
            bio=data.get('bio'),
            interests=data.get('interests')
        )
        new_user.set_password(data.get('password'))
        
        db.session.add(new_user)
        db.session.commit()
        
        print(f"SUCCESS: User {email_clean} registered successfully.") # <--- THIS MUST APPEAR
        return jsonify({"message": "Registered successfully!"}), 201

    except Exception as e:
        db.session.rollback()
        print(f"PYTHON ERROR: {str(e)}") # This will tell you if a column is missing
        return jsonify({"message": "Server error", "error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email_clean = data.get('email', '').strip().lower()
    password = data.get('password')
    
    user = User.query.filter_by(email=email_clean).first()
    
    if user and user.check_password(password):
        session['user_id'] = user.id
        print(f"User {email_clean} logged in.")
        return jsonify({
            "message": "Login successful",
            "username": user.username,
            "mbti_type": user.mbti_type
        }), 200
    
    print(f"Login failed for: {email_clean}")
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/save_type', methods=['POST'])
def save_type():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"message": "Please login first"}), 401
    
    user = User.query.get(user_id)
    user.mbti_type = request.json.get('mbti_type')
    db.session.commit()
    return jsonify({"message": "Personality saved to your profile!"})

@app.route('/get_matches/<user_type>', methods=['GET'])
def get_matches(user_type):
    target_types = COMPATIBILITY_MAP.get(user_type, [])
    matches = User.query.filter(User.mbti_type.in_(target_types)).all()
    results = [
        {"username": m.username, "type": m.mbti_type, "email": m.email, "gender": m.gender, "bio": m.bio, "interests": m.interests} 
        for m in matches
    ]
    return jsonify(results)

@app.route('/logout')
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Database initialized and tables created.")
    app.run(debug=True, port=5000)
