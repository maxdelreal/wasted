# turns folder into a python package
from flask import Flask
from flask_sqlalchemy import SQLAlchemy


#Creating database w SQLAlchemy // remember to install sqalchemy through pip "pip install flask-sqlalchemy flask-migrate"
db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'wastedkey'

    #db config
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    #DB initialization
    db.init_app(app)
    
    # Import and register routes
    from wasted_app.routes import main
    app.register_blueprint(main)
    
    return app

# For direct import
app = create_app()
