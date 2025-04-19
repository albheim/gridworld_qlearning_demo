// Initial position of the robot
let position = { x: 0, y: 0 };

// Define the wall position
const wallPosition = { x: 0, y: 1 };

// Define the goal position
const goalPosition = { x: 0, y: 2 };

// Learning rate (initial value)
let alpha = 0.1;

// Epsilon-greedy parameters
let epsilon = 0.1; // Initial exploration rate

// Initial Q-value (default is 0)
let initialQValue = 0;

// Initialize Q-values for each state-action pair
const qValues = {};
resetQValues();

// Update alpha value dynamically
const alphaSlider = document.getElementById('alpha-slider');
const alphaValueDisplay = document.getElementById('alpha-value');

alphaSlider.addEventListener('input', (event) => {
    alpha = parseFloat(event.target.value);
    alphaValueDisplay.textContent = alpha.toFixed(2); // Update displayed value
});

// Mode selection
let mode = 'manual'; // Default mode
const modeSelect = document.getElementById('mode-select');
modeSelect.addEventListener('change', (event) => {
    mode = event.target.value;
    updateEpsAutoplay();
});

// Update epsilon value dynamically
const epsilonSlider = document.getElementById('epsilon-slider');
const epsilonValueDisplay = document.getElementById('epsilon-value');

epsilonSlider.addEventListener('input', (event) => {
    epsilon = parseFloat(event.target.value);
    epsilonValueDisplay.textContent = epsilon.toFixed(2); // Update displayed value
});

// Simulation speed (initial value in milliseconds)
let simulationSpeed = 500;

// Update simulation speed dynamically
const speedSlider = document.getElementById('speed-slider');
const speedValueDisplay = document.getElementById('speed-value');

speedSlider.addEventListener('input', (event) => {
    simulationSpeed = parseInt(event.target.value, 10);
    speedValueDisplay.textContent = simulationSpeed; // Update displayed value
    // Adjust autoplay interval if in epsilon-greedy mode
    updateEpsAutoplay();
});

// Update initial Q-value dynamically
const qInitSlider = document.getElementById('q-init-slider');
const qInitValueDisplay = document.getElementById('q-init-value');

qInitSlider.addEventListener('input', (event) => {
    initialQValue = parseFloat(event.target.value);
    qInitValueDisplay.textContent = initialQValue.toFixed(1); // Update displayed value
});

// Function to start epsilon-greedy autoplay
let autoplayInterval = null; // Store the interval ID globally

function updateEpsAutoplay() {
    // Clear any existing interval
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
    }

    // Start a new interval only if the mode is 'epsilon-greedy'
    if (mode === 'epsilon-greedy') {
        autoplayInterval = setInterval(() => {
            const actions = ['up', 'down', 'left', 'right'];
            const prevState = `${position.y}-${position.x}`;

            // Choose action based on epsilon-greedy strategy
            let action;
            if (Math.random() < epsilon) {
                // Exploration: choose a random action
                action = actions[Math.floor(Math.random() * actions.length)];
            } else {
                // Exploitation: choose the best action, if many actions are equally good, choose randomly
                const qValuesForState = qValues[prevState];
                const bestValue = Math.max(qValuesForState.up, qValuesForState.down, qValuesForState.left, qValuesForState.right);
                const bestActions = actions.filter(a => qValuesForState[a] === bestValue);
                action = bestActions[Math.floor(Math.random() * bestActions.length)];
            }

            processAction(action);
        }, simulationSpeed); // Use simulationSpeed for autoplay interval
    }
}

// Create the robot element
const robot = document.createElement('div');
robot.classList.add('robot');
robot.textContent = '🤖'; // ASCII robot

// Add the robot to the initial cell
document.getElementById(`cell-${position.y}-${position.x}`).appendChild(robot);

// Function to update Q-value display
function updateQValues() {
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            // Skip Q-value updates for the wall and goal cells
            if ((x === wallPosition.x && y === wallPosition.y) || (x === goalPosition.x && y === goalPosition.y)) {
                continue;
            }

            const cell = document.getElementById(`cell-${y}-${x}`);

            // Remove existing Q-value elements to avoid duplication
            cell.querySelectorAll('.q-value').forEach((qValue) => qValue.remove());

            // Add Q-value elements
            const topValue = document.createElement('div');
            topValue.className = 'q-value top';
            topValue.textContent = qValues[`${y}-${x}`].up.toFixed(1);

            const bottomValue = document.createElement('div');
            bottomValue.className = 'q-value bottom';
            bottomValue.textContent = qValues[`${y}-${x}`].down.toFixed(1);

            const leftValue = document.createElement('div');
            leftValue.className = 'q-value left';
            leftValue.textContent = qValues[`${y}-${x}`].left.toFixed(1);

            const rightValue = document.createElement('div');
            rightValue.className = 'q-value right';
            rightValue.textContent = qValues[`${y}-${x}`].right.toFixed(1);

            // Append Q-values to the cell
            cell.appendChild(topValue);
            cell.appendChild(bottomValue);
            cell.appendChild(leftValue);
            cell.appendChild(rightValue);
        }
    }
}

// Function to show an overlay (red cross or green checkmark)
function showOverlay(symbol, color) {
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.textContent = symbol;
    overlay.style.color = color; // Set the color dynamically

    // Get the center cell (1,1)
    const centerCell = document.getElementById('cell-1-1');
    centerCell.style.position = 'relative'; // Ensure the cell is positioned relative for absolute positioning of the overlay
    centerCell.appendChild(overlay);

    // Remove the overlay after simulationSpeed ms
    setTimeout(() => {
        centerCell.removeChild(overlay);
    }, simulationSpeed);
}

// Function to reset the episode
function resetEpisode() {
    position = { x: 0, y: 0 }; // Reset position to start
    document.getElementById(`cell-${position.y}-${position.x}`).appendChild(robot);
}

// Function to reset Q-values
function resetQValues() {
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            let val = initialQValue;
            if ((x === wallPosition.x && y === wallPosition.y) || (x === goalPosition.x && y === goalPosition.y)) {
                val = 0; // Set Q-value to 0 for wall and goal cells
            }
            qValues[`${y}-${x}`] = {up: val, down: val, left: val, right: val};
        }
    }
}

// Reset button functionality
const resetButton = document.getElementById('reset-button');
resetButton.addEventListener('click', () => {
    resetQValues();
    resetEpisode();
    updateQValues();
});

// Initial Q-value display
updateQValues();

// Handle arrow key movements
document.addEventListener('keydown', (event) => {
    if (mode !== 'manual') {
        return; // Ignore key events if not in manual mode
    }

    const { key } = event;
    let action = null;

    if (key === 'ArrowUp') {
        action = 'up';
    }
    if (key === 'ArrowDown') {
        action = 'down';
    }
    if (key === 'ArrowLeft') {
        action = 'left';
    }
    if (key === 'ArrowRight') {
        action = 'right';
    }

    if (action) {
        processAction(action);
    }
});

// Function to process an action
function processAction(action) {
    const prevState = `${position.y}-${position.x}`;
    let newX = position.x;
    let newY = position.y;
    let reward = -1; // Default reward for each step

    // Determine new position based on action
    if (action === 'up') newY--;
    if (action === 'down') newY++;
    if (action === 'left') newX--;
    if (action === 'right') newX++;

    let maxNextQ = 0;
    let isOutsideGrid = false;
    let resetPosition = false;
    if (newX === wallPosition.x && newY === wallPosition.y) {
        resetPosition = true; // Reset to previous position
        maxNextQ = Math.max(
            qValues[prevState].up,
            qValues[prevState].down,
            qValues[prevState].left,
            qValues[prevState].right
        );
    } else if (newX >= 0 && newX < 3 && newY >= 0 && newY < 3) {
        // Calculate Q-value update
        const nextState = `${newY}-${newX}`;
        maxNextQ = Math.max(
            qValues[nextState].up,
            qValues[nextState].down,
            qValues[nextState].left,
            qValues[nextState].right
        );
    } else {
        isOutsideGrid = true; // Mark as outside grid
        resetPosition = true; // Reset to previous position
    }
    if (newX === goalPosition.x && newY === goalPosition.y) {
        reward += 100; // Reward for reaching the goal
    }

    qValues[prevState][action] += alpha * (reward + maxNextQ - qValues[prevState][action]);

    // Add a blinking arrow from the center of the current cell to the center of the next cell
    const arrow = document.createElement('div');
    arrow.className = `arrow`;
    arrow.textContent = getArrowSymbol(action);

    const prevCell = document.getElementById(`cell-${position.y}-${position.x}`);
    const grid = document.getElementById('grid');
    const prevCellRect = prevCell.getBoundingClientRect();

    let nextCenterX, nextCenterY;

    if (isOutsideGrid) {
        // Calculate a virtual position just outside the grid
        const gridRect = grid.getBoundingClientRect();
        nextCenterX = prevCellRect.left + prevCellRect.width / 2;
        nextCenterY = prevCellRect.top + prevCellRect.height / 2;

        if (action === 'up') nextCenterY = gridRect.top - prevCellRect.height / 2;
        if (action === 'down') nextCenterY = gridRect.bottom + prevCellRect.height / 2;
        if (action === 'left') nextCenterX = gridRect.left - prevCellRect.width / 2;
        if (action === 'right') nextCenterX = gridRect.right + prevCellRect.width / 2;
    } else {
        const nextCell = document.getElementById(`cell-${newY}-${newX}`);
        const nextCellRect = nextCell.getBoundingClientRect();
        nextCenterX = nextCellRect.left + nextCellRect.width / 2;
        nextCenterY = nextCellRect.top + nextCellRect.height / 2;
    }

    const prevCenterX = prevCellRect.left + prevCellRect.width / 2;
    const prevCenterY = prevCellRect.top + prevCellRect.height / 2;

    // Position the midpoint of the arrow at the midpoint between the two centers
    arrow.style.position = 'absolute';
    arrow.style.left = `${(prevCenterX + nextCenterX) / 2}px`;
    arrow.style.top = `${(prevCenterY + nextCenterY) / 2}px`;
    arrow.style.zIndex = '10';

    grid.appendChild(arrow);

    // Remove the arrow after simulationSpeed ms
    setTimeout(() => {
        grid.removeChild(arrow);
    }, 0.5 * simulationSpeed);

    // Update position visually if changed
    if (!resetPosition) {
        position.x = newX;
        position.y = newY;
        document.getElementById(`cell-${newY}-${newX}`).appendChild(robot);
    }

    // Show overlay if necessary
    if (newX === goalPosition.x && newY === goalPosition.y) {
        // Log maxnextq
        showOverlay('✅', 'green');
        resetEpisode();
    } else if (isOutsideGrid) {
        showOverlay('❌', 'red');
        resetEpisode();
    }

    updateQValues();
}

// Helper function to get the arrow symbol for a given action
function getArrowSymbol(action) {
    switch (action) {
        case 'up': return '↑';
        case 'down': return '↓';
        case 'left': return '←';
        case 'right': return '→';
        default: return '';
    }
}
