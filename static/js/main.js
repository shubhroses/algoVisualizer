let steps = [];  // To hold the steps from the API
let currentIndex = 0;  // To keep track of the current step being visualized
let initialArray = []; // Add this line

let lengthOfArray = 50;
let framerate = 200;
let isPaused = false;

function setup() {
    let canvas = createCanvas(windowWidth * 0.95, 400);
    canvas.parent('visualization-area');
    frameRate(5); 
    
    initialArray = generateRandomArray(lengthOfArray); // Generate initial random array
    steps = [initialArray]; // Initialize steps with the initial array for initial display
    currentIndex = 0;  // Reset the index
}

function windowResized() {
    resizeCanvas(windowWidth * 0.95, 400);
}  

function draw() {
    if (isPaused) {
        return;
    }
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

function generateRandomArray(length) {
    // Generate an array from 1 to `length`
    const arr = Array.from({ length }, (_, i) => i + 1);
  
    // Shuffle the array to make it random
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function bubbleSortSteps(arr) {
    const steps = [];
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            steps.push([...arr]);  // Use the spread operator to create a copy of the array
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];  // Swap arr[j] and arr[j + 1]
            }
        }
    }
    steps.push([...arr]);  // Capture the final sorted array
    return steps;
}

document.addEventListener("DOMContentLoaded", function() {
    const bubbleSortBtn = document.getElementById("bubble-sort-btn");
    const numElementsInput = document.getElementById("num-elements");
    const visualizationArea = document.getElementById("visualization-area");
    const frameRateSlider = document.getElementById("frame-rate-slider");
    const frameRateDisplay = document.getElementById("frame-rate-display");

    frameRateSlider.addEventListener("input", function() {
        const newFrameRate = Number(frameRateSlider.value);
        frameRate(newFrameRate);
        frameRateDisplay.innerText = newFrameRate;
    });

    numElementsInput.addEventListener("change", function() {
        const numElements = Number(numElementsInput.value || lengthOfArray);
        initialArray = generateRandomArray(numElements);
        // Update steps and currentIndex to visualize new array
        steps = [initialArray];
        currentIndex = 0;
        lengthOfArray = numElements;
    });

    bubbleSortBtn.addEventListener("click", function() {
        // Unpause the animation and update button text
        isPaused = false;
        pauseBtn.innerHTML = "Pause";
        bubbleSortBtn.innerHTML = "Reset";
        
        // Generate the steps using JavaScript implementation of bubble sort
        steps = bubbleSortSteps([...initialArray]);  // Using a copy to keep initialArray unchanged
        currentIndex = 0;  // Reset the index
    
        // Generate a new random array for future use
        initialArray = generateRandomArray(lengthOfArray);
    });

    const pauseBtn = document.getElementById("pause-btn");
    pauseBtn.addEventListener("click", function() {
        isPaused = !isPaused;
        this.innerHTML = isPaused ? "Resume" : "Pause";     
    });
});