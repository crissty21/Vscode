# Server-side (Python + Flask)
from flask import Flask, jsonify, render_template
import os

app = Flask(__name__)
@app.route("/")
def index():
    return render_template("index.html")

@app.route('/get-videos', methods=['GET'])
def get_videos():
    video_dir = 'C:\\Users\\crist\\Desktop\\Vscode\\testing\\videos'
    files = os.listdir(video_dir)
    mp4_files = [file for file in files if file.endswith('.mp4')]
    return jsonify(mp4_files)

if __name__ == '__main__':
    app.run(debug=True)
