let steps = [];  // To hold the steps from the API
let currentIndex = 0;  // To keep track of the current step being visualized

function setup() {
    let canvas = createCanvas(windowWidth * 0.8, 400);
    canvas.parent('visualization-area');
    frameRate(5);  // 5 frames per second
}

function draw() {
    background(220);  // Set background color to grey
    if (steps.length > 0) {
        // Keep currentIndex within the bounds of steps array
        currentIndex = min(currentIndex, steps.length - 1);
        
        let arr = steps[currentIndex];
        let barWidth = width / arr.length;
        
        for (let i = 0; i < arr.length; i++) {
            let barHeight = map(arr[i], 0, Math.max(...arr), 0, height);
            rect(i * barWidth, height - barHeight, barWidth, barHeight);
        }
        
        if (currentIndex < steps.length - 1) {
            currentIndex++;
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const arrayInput = document.getElementById("array-input");
    const bubbleSortBtn = document.getElementById("bubble-sort-btn");
    const visualizationArea = document.getElementById("visualization-area");

    bubbleSortBtn.addEventListener("click", function() {
    const array = JSON.parse(arrayInput.value);

    fetch("http://127.0.0.1:5001/bubble_sort", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ array })
    })
    .then(response => response.json())
    .then(data => {
        steps = data.steps;  // Store steps for p5.js to use
        currentIndex = 0;  // Reset the index
    });

    });
});