import http.server
import socketserver
import os
import webbrowser
import subprocess
import tempfile # Added for temporary user data directory
import shutil # Added for cleaning up the temporary directory

PORT = 8000
DIRECTORY = "." # Serve files from the current directory
GAME_FILE = "Solar Frontier 3.html"
# User might have updated this, ensure it's the correct one from their feedback
CHROME_PATH = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
# CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe" # Alternative path

# Global variable to store the temporary user data directory path
temp_user_data_dir = None

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def guess_type(self, path):
        if path.endswith(".js"):
            return "application/javascript"
        return super().guess_type(path)

    def end_headers(self):
        # Add no-cache headers for .js files
        if self.path.endswith(".js"):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()

def open_chrome_with_debugging(url, chrome_path, port=9222):
    """Opens the given URL in Chrome with remote debugging enabled and a temporary user data directory."""
    global temp_user_data_dir
    if not os.path.exists(chrome_path):
        print(f"Chrome not found at {chrome_path}. Please update CHROME_PATH in serve.py.")
        webbrowser.open_new_tab(url)
        return

    temp_user_data_dir = tempfile.mkdtemp(prefix="chrome_dev_profile_")
    print(f"Using temporary Chrome user data directory: {temp_user_data_dir}")

    debugging_url = f"http://localhost:{port}"
    print(f"Attempting to open Chrome with remote debugging on port {port}...")
    print(f"If Chrome doesn't open, ensure it's not already running or try closing all instances.")
    print(f"You may need to manually navigate to: {url}")
    print(f"And connect debugger by opening a new Chrome tab to: {debugging_url}")

    command = [
        chrome_path,
        f"--remote-debugging-port={port}",
        f"--user-data-dir={temp_user_data_dir}",
        "--no-first-run",
        "--no-default-browser-check",
        url
    ]
    try:
        subprocess.Popen(command)
        print(f"Chrome launched with command: {' '.join(command)}")
    except Exception as e:
        print(f"Failed to launch Chrome with debugging: {e}")
        print("Falling back to default browser.")
        webbrowser.open_new_tab(url)
        if temp_user_data_dir and os.path.exists(temp_user_data_dir):
            shutil.rmtree(temp_user_data_dir)

def cleanup_temp_chrome_profile():
    """Removes the temporary Chrome user data directory."""
    global temp_user_data_dir
    if temp_user_data_dir and os.path.exists(temp_user_data_dir):
        try:
            shutil.rmtree(temp_user_data_dir)
            print(f"Cleaned up temporary Chrome profile: {temp_user_data_dir}")
        except Exception as e:
            print(f"Error cleaning up temporary Chrome profile {temp_user_data_dir}: {e}")
    temp_user_data_dir = None


with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd: # Use NoCacheHandler
    server_url = f"http://localhost:{PORT}/{GAME_FILE.replace(' ', '%20')}"
    print(f"Serving files from '{os.path.abspath(DIRECTORY)}' on http://localhost:{PORT}")
    print(f"Game URL: {server_url}")
    print("Press Ctrl+C to stop the server.")

    open_chrome_with_debugging(server_url, CHROME_PATH)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        httpd.shutdown()
        cleanup_temp_chrome_profile()