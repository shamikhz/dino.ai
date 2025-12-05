/**
 * MAIN.JS - Integration and Training Loop
 * Connects Game, AI, and UI
 */

// ============================================================================
// GLOBAL STATE
// ============================================================================
let game;
let population;
let dinos = [];
let isTraining = false;
let isPaused = false;
let animationFrameId = null;

// Configuration
const POPULATION_SIZE = 15;          // Number of dinos per generation
const INPUT_COUNT = 5;               // Neural network inputs
const HIDDEN_COUNT = 6;              // Hidden layer neurons
const OUTPUT_COUNT = 1;              // Neural network outputs

// Statistics
let bestScore = 0;
let currentBestDino = null;
let showBestHighlight = true;

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Get canvas and create game
    const canvas = document.getElementById('gameCanvas');
    game = new Game(canvas);

    // Create AI population
    population = new Population(POPULATION_SIZE, INPUT_COUNT, HIDDEN_COUNT, OUTPUT_COUNT);

    // Setup UI event listeners
    setupUI();

    // Initial render
    game.draw([]);
    updateStats();
});

// ============================================================================
// UI SETUP
// ============================================================================
function setupUI() {
    // Start button
    document.getElementById('startBtn').addEventListener('click', () => {
        if (!isTraining) {
            startTraining();
        }
    });

    // Pause button
    document.getElementById('pauseBtn').addEventListener('click', () => {
        togglePause();
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        resetTraining();
    });

    // Show best checkbox
    document.getElementById('showBestCheckbox').addEventListener('change', (e) => {
        showBestHighlight = e.target.checked;
    });

    // Speed control
    document.getElementById('speedSelect').addEventListener('change', (e) => {
        const speed = parseInt(e.target.value);
        game.setSpeedMultiplier(speed);
    });
}

// ============================================================================
// TRAINING CONTROL
// ============================================================================
function startTraining() {
    isTraining = true;
    isPaused = false;

    // Update UI
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;

    // Initialize dinos with AI brains
    initializeGeneration();

    // Start game loop
    gameLoop();
}

function togglePause() {
    isPaused = !isPaused;

    const pauseBtn = document.getElementById('pauseBtn');
    if (isPaused) {
        pauseBtn.innerHTML = '<span class="btn-icon">▶</span> Resume';
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    } else {
        pauseBtn.innerHTML = '<span class="btn-icon">⏸</span> Pause';
        gameLoop();
    }
}

function resetTraining() {
    // Stop training
    isTraining = false;
    isPaused = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    // Reset everything
    population.reset();
    game.reset();
    dinos = [];
    bestScore = 0;
    currentBestDino = null;

    // Update UI
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('pauseBtn').innerHTML = '<span class="btn-icon">⏸</span> Pause';

    // Clear canvas
    game.draw([]);
    updateStats();
}

// ============================================================================
// GENERATION MANAGEMENT
// ============================================================================
function initializeGeneration() {
    // Reset game state
    game.reset();

    // Create dinos with AI brains
    dinos = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
        const brain = population.getNetwork(i);
        const dino = new Dino(brain);
        dinos.push(dino);
    }

    currentBestDino = dinos[0]; // Initially, assume first is best
}

function evolveToNextGeneration() {
    // Collect fitness scores
    const fitnessScores = dinos.map(dino => dino.fitness);

    // Update best score
    const genBestScore = Math.max(...dinos.map(d => d.score));
    if (genBestScore > bestScore) {
        bestScore = genBestScore;
    }

    // Evolve population
    population.evolve(fitnessScores);

    // Start new generation
    initializeGeneration();
}

// ============================================================================
// GAME LOOP
// ============================================================================
function gameLoop() {
    if (!isTraining || isPaused) return;

    // Update game
    game.update();

    // Update all alive dinos
    let aliveCount = 0;
    let bestFitnessThisFrame = 0;

    for (let dino of dinos) {
        if (!dino.isAlive) continue;

        aliveCount++;

        // Get AI inputs
        const inputs = game.getInputs(dino);

        // AI decides: should jump?
        const outputs = dino.brain.predict(inputs);
        const shouldJump = outputs[0] > 0.5; // Jump if output > 0.5

        if (shouldJump) {
            dino.jump();
        }

        // Update dino physics
        dino.update(game.gameSpeed);

        // Check collision
        const closestObstacle = game.getClosestObstacle(dino);
        if (closestObstacle && dino.collidesWith(closestObstacle)) {
            dino.die();
        }

        // Track best dino
        if (dino.fitness > bestFitnessThisFrame) {
            bestFitnessThisFrame = dino.fitness;
            currentBestDino = dino;
        }
    }

    // Check if all dinos are dead
    if (aliveCount === 0) {
        // Evolve to next generation
        evolveToNextGeneration();
    }

    // Render
    game.draw(dinos, currentBestDino, showBestHighlight);

    // Update stats
    updateStats();

    // Continue loop
    animationFrameId = requestAnimationFrame(gameLoop);
}

// ============================================================================
// UI UPDATES
// ============================================================================
function updateStats() {
    // Generation
    document.getElementById('generationStat').textContent = population.generation;

    // Alive count
    const aliveCount = dinos.filter(d => d.isAlive).length;
    document.getElementById('aliveStat').textContent = aliveCount;

    // Best score (all-time)
    document.getElementById('bestScoreStat').textContent = bestScore;

    // Best fitness (current generation)
    const bestFitness = Math.floor(population.bestFitness);
    document.getElementById('bestFitnessStat').textContent = bestFitness;

    // Average fitness
    const avgFitness = Math.floor(population.avgFitness);
    document.getElementById('avgFitnessStat').textContent = avgFitness;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize a value to 0-1 range
 */
function normalize(value, min, max) {
    return (value - min) / (max - min);
}

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// ============================================================================
// CONSOLE HELPERS (for debugging)
// ============================================================================
window.getStats = function () {
    return {
        generation: population.generation,
        bestFitness: population.bestFitness,
        avgFitness: population.avgFitness,
        bestScore: bestScore,
        aliveCount: dinos.filter(d => d.isAlive).length,
        totalDinos: dinos.length
    };
};

window.getCurrentBest = function () {
    return currentBestDino;
};

console.log('%c🦖 AI Dino Runner Loaded! %c', 'background: #6366f1; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;', '');
console.log('Type getStats() to see current statistics');
console.log('Type getCurrentBest() to inspect the best dino');
