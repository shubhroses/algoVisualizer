from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/bubble_sort')
def bubble_sort():
    # your logic here
    return render_template('bubble_sort.html')

@app.route('/selection_sort')
def selection_sort():
    # your logic here
    return render_template('selection_sort.html')

@app.route('/merge_sort')
def merge_sort():
    # your logic here
    return render_template('merge_sort.html')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001)
