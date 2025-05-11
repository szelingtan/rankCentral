import os
import tempfile

def setup_upload_folder():
    """Setup folder for temporary file uploads"""
    UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'pdf_comparison_uploads')
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    return UPLOAD_FOLDER

def clear_upload_folder(folder_path):
    """Clear all files from upload folder"""
    try:
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path):
                os.unlink(file_path)
        return True
    except Exception as e:
        print(f"Error clearing upload folder: {str(e)}")
        return False