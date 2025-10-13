#backend logic and API endpoints (i think)
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from wasted_app import db
from wasted_app.models import User, WasteEntry
from datetime import datetime, date, timedelta

main = Blueprint('main', __name__)

@main.route('/')
@login_required
def index():
    return render_template('index.html')

@main.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validation
        if not username or not password:
            return render_template('register.html', error='Please fill in all fields')
        
        if password != confirm_password:
            return render_template('register.html', error='Passwords do not match')
        
        # Check if username already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return render_template('register.html', error='Username already taken')
        
        # Create new user
        new_user = User(username=username)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        # Log the user in automatically after registration
        login_user(new_user)
        
        return redirect(url_for('main.index'))
    
    return render_template('register.html')

@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Find user
        user = User.query.filter_by(username=username).first()
        
        # Check if user exists and password is correct
        if not user or not user.check_password(password):
            return render_template('login.html', error='Invalid username or password')
        
        # Log the user in
        login_user(user)
        
        return redirect(url_for('main.index'))
    
    return render_template('login.html')

@main.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.login'))

# sep 30
@main.route('/api/waste', methods=['GET'])
@login_required
def get_waste():
    entries = WasteEntry.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': entry.id,
        'item': entry.item_name,
        'date': entry.date_created.strftime('%m/%d/%Y'),
        'timestamp': int(entry.timestamp.timestamp() * 1000)  # JavaScript timestamp
    } for entry in entries])

@main.route('/api/waste', methods=['POST'])
@login_required
def add_waste():
    data = request.get_json()
    item_name = data.get('item', '').strip().upper()
    
    if not item_name:
        return jsonify({'error': 'Item name required'}), 400
    
    new_entry = WasteEntry(
        item_name=item_name,
        user_id=current_user.id
    )
    
    db.session.add(new_entry)
    db.session.commit()
    
    return jsonify({
        'id': new_entry.id,
        'item': new_entry.item_name,
        'date': new_entry.date_created.strftime('%m/%d/%Y'),
        'timestamp': int(new_entry.timestamp.timestamp() * 1000)
    })

@main.route('/api/waste/<int:waste_id>', methods=['DELETE'])
@login_required
def delete_waste(waste_id):
    entry = WasteEntry.query.filter_by(id=waste_id, user_id=current_user.id).first()
    
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    
    db.session.delete(entry)
    db.session.commit()
    
    return jsonify({'message': 'Entry deleted'})

# weekly waste sorting
@main.route('/api/waste/weekly', methods=['GET'])
@login_required
def get_weekly_waste():
    # Get week_offset parameter (default to 0 for current week)
    week_offset = request.args.get('week_offset', 0, type=int)
    
    # Calculate the start of the current week (Monday)
    today = date.today()
    days_since_monday = today.weekday()  # Monday = 0, Sunday = 6
    current_week_start = today - timedelta(days=days_since_monday)
    
    # Apply week offset
    week_start = current_week_start + timedelta(weeks=week_offset)
    week_end = week_start + timedelta(days=6)  # Sunday
    
    # Query entries for this user within the week range
    entries = WasteEntry.query.filter(
        WasteEntry.user_id == current_user.id,
        WasteEntry.date_created >= week_start,
        WasteEntry.date_created <= week_end
    ).order_by(WasteEntry.timestamp.desc()).all()
    
    # Group entries by day of week
    days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    grouped_entries = {day: [] for day in days_of_week}
    
    for entry in entries:
        day_name = days_of_week[entry.date_created.weekday()]
        grouped_entries[day_name].append({
            'id': entry.id,
            'item': entry.item_name,
            'date': entry.date_created.strftime('%m/%d/%Y'),
            'timestamp': int(entry.timestamp.timestamp() * 1000)
        })
    
    return jsonify({
        'week_start': week_start.strftime('%m/%d/%Y'),
        'week_end': week_end.strftime('%m/%d/%Y'),
        'days': grouped_entries
    })