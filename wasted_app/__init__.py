# turns folder into a python package
from flask import Flask

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your-secret-key-here'
    
    # Import and register routes
    from wasted_app.routes import main
    app.register_blueprint(main)
    
    return app

# For direct import
app = create_app()