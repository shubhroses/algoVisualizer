let steps = [];  // To hold the steps from the API
let currentIndex = 0;  // To keep track of the current step being visualized
let initialArray = []; // Add this line
let lengthOfArray = 25;
let framerate = 200;
let isPaused = false;

function setup() {
    let canvas = createCanvas(windowWidth, 500);
    canvas.parent('visualization-area');
    frameRate(5); 

    initialArray = generateRandomArray(lengthOfArray); // Generate initial random array
    const colorFlags = new Array(lengthOfArray).fill(0);  // 0 for white, 1 for red
    steps = [{ array: initialArray, colorFlags: colorFlags }];
    currentIndex = 0;  // Reset the index
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}  

function draw() {
    if (isPaused) {
        return;
    }
    background("#659DBD");  // Set background color to grey
    if (steps.length > 0) {
        currentIndex = min(currentIndex, steps.length - 1);
        
        const { array: arr, colorFlags } = steps[currentIndex];
        let barWidth = width / arr.length;

        for (let i = 0; i < arr.length; i++) {
            let barHeight = map(arr[i], 0, Math.max(...arr), 0, height);

            // Calculate hue based on the value of the bar
            let hueValue = map(arr[i], 0, Math.max(...arr), 0, 360);

            if (colorFlags[i] === 1) {
                fill("#E83100");  // Red for swapping
            } else {
                colorMode(HSL); // switch to HSL color mode
                fill(hueValue, 100, 50); // HSL representation
                colorMode(RGB); // switch back to RGB color mode
            }

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

function sortSteps(arr) {
    const steps = [];
    const n = arr.length;
    let colorFlags = new Array(n).fill(0); // Initialize colorFlags with 0s

    for (let i = 0; i < n - 1; i++) {
        let minIndex = i;

        // Unmark all red columns before searching for the minimum
        colorFlags.fill(0, i, n);
        
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }

        // Mark as red before the swap
        colorFlags[minIndex] = 1;
        steps.push({ array: [...arr], colorFlags: [...colorFlags] });

        if (minIndex !== i) {
            // If the minimum element is not already at the beginning, swap
            [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];

            // Unmark the swapped column
            colorFlags[minIndex] = 0;
        } else {
            // If the minimum element is already at the beginning, mark as green
            colorFlags[i] = 2;
        }
        
        // Always mark the sorted column as green
        colorFlags[i] = 2;
        steps.push({ array: [...arr], colorFlags: [...colorFlags] });
    }

    // Mark the last column as green since it's also sorted
    colorFlags[n - 1] = 2;
    steps.push({ array: [...arr], colorFlags: [...colorFlags] });  // Capture the final sorted array

    return steps;
}



document.addEventListener("DOMContentLoaded", function() {
    const sortBtn = document.getElementById("sort-btn");
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

    sortBtn.addEventListener("click", function() {
        // Unpause the animation and update button text
        isPaused = false;
        pauseBtn.innerHTML = "Pause";
        sortBtn.innerHTML = "Reset";
        
        steps = sortSteps([...initialArray]);
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