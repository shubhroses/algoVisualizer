let steps = [];  // To hold the steps from the API
let currentIndex = 0;  // To keep track of the current step being visualized
let initialArray = []; // Add this line

let lengthOfArray = 25;
let framerate = 200;
let isPaused = false;
let maxValue; // Add this line near the global variables


function setup() {
    let canvas = createCanvas(windowWidth, 400);
    canvas.parent('visualization-area');
    frameRate(5); 
    
    initialArray = generateRandomArray(lengthOfArray); // Generate initial random array
    
    steps = [{ array: initialArray, colorFlag: -1 }];
    currentIndex = 0;  // Reset the index
}

function windowResized() {
    resizeCanvas(windowWidth, 400);
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

function draw() {
    if (!steps || steps.length === 0) return;
    background("#659DBD");

    const { array: arr, colorFlag } = steps[currentIndex];
    let barWidth = width / arr.length;

    maxValue = Math.max(...arr);

    colorMode(HSL);
    for (let i = 0; i < arr.length; i++) {
        let barHeight = map(arr[i], 0, maxValue, 0, height);
        let hueValue = map(arr[i], 0, maxValue, 0, 360);

        fill(i === colorFlag ? 0 : hueValue, 100, 50);
        rect(i * barWidth, height - barHeight, barWidth, barHeight);
    }
    colorMode(RGB);

    if (currentIndex < steps.length - 1) {
        currentIndex++;
    }
}

function bubbleSortSteps(arr) {
    const steps = [];
    
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            let colorFlag = j;
            
            // Take advantage of the already existing steps array
            steps.push({ array: arr.slice(), colorFlag: colorFlag });
            
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
    return steps;
}

document.addEventListener("DOMContentLoaded", function() {
    const bubbleSortBtn = document.getElementById("bubble-sort-btn");
    const numElementsInput = document.getElementById("num-elements");
    const visualizationArea = document.getElementById("visualization-area");
    const frameRateSlider = document.getElementById("frame-rate-slider");
    const frameRateDisplay = document.getElementById("frame-rate-display");

    const backButton = document.getElementById("back-to-home");
    backButton.addEventListener("click", function() {
        window.location.href = "/";  //TODO Update this
    });
        
    frameRateSlider.addEventListener("input", function() {
        const newFrameRate = Number(frameRateSlider.value);
        frameRate(newFrameRate);
        frameRateDisplay.innerText = newFrameRate;
    });

    numElementsInput.addEventListener("change", function() {
        const numElements = Number(numElementsInput.value || lengthOfArray);
        initialArray = generateRandomArray(numElements);
        const colorFlags = new Array(numElements).fill(0);
        // Update steps and currentIndex to visualize new array
        steps = [{ array: initialArray, colorFlags: colorFlags }];
        currentIndex = 0;
        lengthOfArray = numElements;
    });

    bubbleSortBtn.addEventListener("click", function() {
        // Unpause the animation and update button text
        isPaused = false;
        pauseBtn.innerHTML = "Pause";
        bubbleSortBtn.innerHTML = "Reset";
        
        // Generate the steps using JavaScript implementation of bubble sort
        steps = bubbleSortSteps([...initialArray]);  // Assume bubbleSortSteps returns objects now
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