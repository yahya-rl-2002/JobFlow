import os
import sys
import logging

# Add the current directory to sys.path to make imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.cv_parser import CVParser

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def debug_parsing():
    parser = CVParser()
    
    # Path to a known existing file (adjust if needed)
    # Using relative path from nlp-service root to backend/uploads
    # Assuming we run this from nlp-service directory
    
    # Try to find a PDF in the uploads directory
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend', 'uploads')
    
    if not os.path.exists(uploads_dir):
        print(f"Uploads dir not found at: {uploads_dir}")
        return

    files = [f for f in os.listdir(uploads_dir) if f.endswith('.pdf')]
    
    if not files:
        print("No PDF files found in uploads directory")
        return
        
    test_file = os.path.join(uploads_dir, files[0])
    print(f"Testing with file: {test_file}")
    
    try:
        result = parser.parse(test_file)
        print("Parsing successful!")
        print(result.keys())
    except Exception as e:
        print(f"Parsing failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_parsing()
