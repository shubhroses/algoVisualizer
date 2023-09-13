let steps = [];  // To hold the steps from the API
let currentIndex = 0;  // To keep track of the current step being visualized
let initialArray = []; // Add this line
let lengthOfArray = 25;
let framerate = 5;
let isPaused = false;

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight * 0.70);
    canvas.parent('visualization-area');
    frameRate(framerate); 

    initialArray = generateRandomArray(lengthOfArray); // Generate initial random array
    
    steps = [{ array: initialArray, colorFlags: -1 }];
    currentIndex = 0;  // Reset the index
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight*0.70);
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

function drawFrame() {
    if (!steps || steps.length === 0) return;
    background("white");
  
    const { array: arr, colorFlag } = steps[currentIndex];
    let barWidth = windowWidth / arr.length;
  
    colorMode(HSL);
    noStroke();  // Disable stroke
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
}
  
function draw() {
    if (isPaused) return;
    
    drawFrame();

    if (currentIndex < steps.length - 1) {
        currentIndex = Math.min(currentIndex + Math.ceil(0.04 * lengthOfArray), steps.length - 1);
    }
}

// The main sortSteps function that initializes the Quick Sort
function sortSteps(arr) {
    steps = []; // Clear previous steps
    steps.push({ array: [...arr], colorFlag: -1 });
    quickSortSteps(arr, 0, arr.length - 1);
    steps.push({ array: [...arr], colorFlag: -1 });  // Final sorted array
    return steps;
}

// The actual Quick Sort function, modified to record steps
function quickSortSteps(arr, low, high) {
    if (low < high) {
        let pivotIndex = partition(arr, low, high);
        
        // Recursively sort the elements before and after partition
        quickSortSteps(arr, low, pivotIndex - 1);
        quickSortSteps(arr, pivotIndex + 1, high);
    }
}

// Modified partition function
function partition(arr, low, high) {
    let pivot = arr[high];
    let i = low - 1;

    for (let j = low; j <= high - 1; j++) {
        // Record the array state before any swaps
        steps.push({ array: [...arr], colorFlag: j });

        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // Swap the pivot element with the element at i + 1 to put it in the right position
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    steps.push({ array: [...arr], colorFlag: i + 1 });  // Record the array state after the final swap

    return i + 1;
}


document.addEventListener("DOMContentLoaded", function() {
    const startPauseBtn = document.getElementById("start-pause");
    const numElementsInput = document.getElementById("element-slider");
    const fpsButtonGroup = document.getElementById("fps-button-group");
    const elementDisplay = document.getElementById("elements-display");
    const resetBtn = document.getElementById("reset-btn");
    const backButton = document.getElementById("back-to-home");

    backButton.addEventListener("click", function() {
        window.location.href = "/dev/";
    });

    fpsButtonGroup.addEventListener("click", function(event) {
        const target = event.target;
        if (target.tagName === 'BUTTON') {
          // Remove the active class from all buttons
          document.querySelectorAll('#fps-button-group .btn').forEach(btn => btn.classList.remove('active'));
    
          // Add the active class to the clicked button
          target.classList.add('active');
    
          // Change the frame rate
          const newFrameRate = parseInt(target.getAttribute('data-fps'), 10);
          frameRate(newFrameRate);
        }
    });

    numElementsInput.addEventListener("input", function() {
        const numElements = Number(numElementsInput.value);
        initialArray = generateRandomArray(numElements);
        steps = [{ array: initialArray, colorFlags: -1 }];
        currentIndex = 0;
        lengthOfArray = numElements;
        elementDisplay.innerText = numElements;

        // Reset the Start/Pause button label to "Start"
        startPauseBtn.innerHTML = "Start";
        isPaused = true;
        drawFrame();
    });

    // Start/Pause button logic
    startPauseBtn.addEventListener("click", function() {
        if (startPauseBtn.innerHTML === "Start") {
            // Set to Pause and start the sorting
            startPauseBtn.innerHTML = "Pause";
            isPaused = false;

            // If not yet started, initialize sorting
            if (currentIndex === 0) {
                steps = sortSteps([...initialArray]);
            }

        } else if (startPauseBtn.innerHTML === "Pause") {
            // Set to Start and pause the sorting
            startPauseBtn.innerHTML = "Start";
            isPaused = true;
        }
    });

    // Reset button logic
    resetBtn.addEventListener("click", function() {
        // Reset everything
        startPauseBtn.innerHTML = "Start";
        isPaused = true;

        initialArray = generateRandomArray(lengthOfArray); // Moved up
        steps = [{ array: [...initialArray], colorFlags: -1 }]; // Now uses the new initialArray
        currentIndex = 0;
        drawFrame();
    });
});