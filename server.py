from flask import Flask, render_template, send_file, request, jsonify
import os

app = Flask(__name__)

# Global variable to store the path to the video file
video_path = ""

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/video')
def video():    
    return send_file(video_path, mimetype="video/mp4")

# New route to receive the path to the video file from JavaScript
@app.route('/set_video_path', methods=['POST'])
def set_video_path():
    global video_path
    data = request.get_json()
    video_path = data.get('path', '')
    return 'OK'

@app.route('/get-videos', methods=['GET'])
def get_videos():
    video_dir = './videos'
    files = os.listdir(video_dir)
    mp4_files = [file for file in files if file.endswith('.mp4')]
    return jsonify(mp4_files)

if __name__ == '__main__':
    app.run(debug=True)
