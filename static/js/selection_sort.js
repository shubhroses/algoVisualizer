let steps = [];  // To hold the steps from the API
let currentIndex = 0;  // To keep track of the current step being visualized
let initialArray = []; // Add this line
let lengthOfArray = 25;
let framerate = 200;
let isPaused = false;

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight * 0.8);
    canvas.parent('visualization-area');
    frameRate(5); 

    initialArray = generateRandomArray(lengthOfArray); // Generate initial random array
    
    steps = [{ array: initialArray, colorFlags: -1 }];
    currentIndex = 0;  // Reset the index
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight*0.8);
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

function drawBar(i, barWidth, barHeight, hueValue, colorFlag) {
    if (i === colorFlag) {
        fill(0);
    } else {
        fill(hueValue, 100, 50);
    }
    rect(i * barWidth, height - barHeight, barWidth, barHeight);
}

function drawGradient(startY, topColor, bottomColor) {
    for (let y = startY; y <= height; y++) {
        let inter = map(y, startY, height, 0, 1);
        let c = lerpColor(topColor, bottomColor, inter);
        stroke(c);
        line(0, y, width, y);
    }
}

function draw() {
    if (!steps || steps.length === 0) return;
    background("white");

    const { array: arr, colorFlag } = steps[currentIndex];
    let barWidth = width / arr.length;

    colorMode(HSL);
    for (let i = 0; i < arr.length; i++) {
        let barHeight = map(arr[i], 0, lengthOfArray, 0, height);
        let hueValue = map(arr[i], 0, lengthOfArray, 0, 360);
        drawBar(i, barWidth, barHeight, hueValue, colorFlag);
    }
    colorMode(RGB);

    // Gradient Overlay
    let startY = height * 0.8;
    let topColor = color(255, 255, 255, 0);
    let bottomColor = color(255, 255, 255);
    drawGradient(startY, topColor, bottomColor);

    if (currentIndex < steps.length - 1) {
        currentIndex = Math.min(currentIndex + Math.ceil(0.01 * steps.length), steps.length - 1);
    }
}

function sortSteps(arr) {
    const steps = [];
    
    for (let i = 0; i < arr.length; i++) {
        let minIndex = i;  // Start with the first element in the unsorted portion
        
        for (let j = i + 1; j < arr.length; j++) {
            // Save this step before checking for minimum
            steps.push({ array: arr.slice(), colorFlag: minIndex });
            
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }
        
        // Swap the minimum element found with the first unsorted element
        if (minIndex !== i) {
            [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
        }
        
        // Save the final state of this iteration
        steps.push({ array: arr.slice(), colorFlag: minIndex });
    }
    return steps;
}


document.addEventListener("DOMContentLoaded", function() {
    const bubbleSortBtn = document.getElementById("bubble-sort-btn");
    const numElementsInput = document.getElementById("element-slider");
    const frameRateSlider = document.getElementById("frame-rate-slider");
    const frameRateDisplay = document.getElementById("frame-rate-display");
    const elementDisplay = document.getElementById("elements-display");
    const backButton = document.getElementById("back-to-home");

    backButton.addEventListener("click", function() {
        window.location.href = "/";
    });

    frameRateSlider.addEventListener("input", function() {
        const newFrameRate = Number(frameRateSlider.value);
        framerate = newFrameRate;
        frameRateDisplay.innerText = newFrameRate;
    });

    numElementsInput.addEventListener("input", function() {
        const numElements = Number(numElementsInput.value);
        initialArray = generateRandomArray(numElements);
        steps = [{ array: initialArray, colorFlags: -1 }];
        currentIndex = 0;
        lengthOfArray = numElements;
        elementDisplay.innerText = numElements;
    });

    bubbleSortBtn.addEventListener("click", function() {
        isPaused = false;
        document.getElementById("pause-btn").innerHTML = "Pause";
        bubbleSortBtn.innerHTML = "Reset";

        steps = sortSteps([...initialArray]);
        currentIndex = 0;

        initialArray = generateRandomArray(lengthOfArray);
    });

    const pauseBtn = document.getElementById("pause-btn");
    pauseBtn.addEventListener("click", function() {
        isPaused = !isPaused;
        this.innerHTML = isPaused ? "Resume" : "Pause";
    });
});