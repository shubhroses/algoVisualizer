from flask import Flask, jsonify, request, render_template
from sorting_algorithms.bubble_sort import bubble_sort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001)
