from flask import Flask, jsonify, request, render_template
from sorting_algorithms.bubble_sort import bubble_sort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/bubble_sort', methods=['POST'])
def bubble_sort_api():
    input_data = request.json
    input_array = input_data.get('array', [])

    sorted_array, steps = bubble_sort(input_array)

    return jsonify({
        'sorted_array': sorted_array,
        'steps': steps
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001)
