# turns folder into a python package
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import 

#Creating database w SQLAlchemy // remember to install sqalchemy through pip "pip install flask-sqlalchemy flask-migrate"
db = SQLAlchemy()
login_manager = LoginManager()


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'wastedkey'

    #db config
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    #DB initialization
    db.init_app(app)

    # Initialize login manager
    login_manager.init_app(app)
    login_manager.login_view = 'main.login' # directs user here if not logged in
    
    # Import and register routes
    from wasted_app.routes import main
    app.register_blueprint(main)
    
    return app

# Load user function 
@login_manager.user_loader
def load_user(user_id):
    from wasted_app.models import User
    return User.query.get(int(user_id))

# For direct import
app = create_app()
