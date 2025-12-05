# 🦖 AI Dino Runner

A browser-based implementation of an infinite runner game where an AI learns to play automatically using the **NEAT (NeuroEvolution of Augmenting Topologies)** algorithm.

Watch as generation after generation of dinosaurs evolve, learn to jump over obstacles, and master the game in real-time!

![AI Dino Runner](https://via.placeholder.com/800x400?text=AI+Dino+Runner+Gameplay)
*(Replace this image link with a screenshot of your actual game)*

## ✨ Features

- **Custom NEAT Implementation**: A lightweight neural network and evolution engine built from scratch in JavaScript.
- **Real-time Evolution**: Watch the training process live as dinos improve with every generation.
- **Accelerated Training**: Speed up the game simulation (up to 10x) to train faster.
- **Visual Statistics**: Monitor generation count, alive population, best scores, and fitness trends.
- **Best Dino Highlight**: Automatically highlights and tracks the best-performing dinosaur of the current generation.

## 🧠 How It Works

The AI uses a neural network to make decisions. Each dinosaur has its own unique "brain" (neural network) that processes game data to decide when to jump.

### Neural Network Inputs
The AI observes the environment through 5 inputs:
1. **Distance to Obstacle**: How far away the next cactus is.
2. **Obstacle Height**: How tall the incoming cactus is.
3. **Obstacle Width**: How wide the incoming cactus is.
4. **Dino Y Position**: The dinosaur's current vertical position.
5. **Game Speed**: The current speed of the game.

### The Evolutionary Process
1. **Generation 1**: A population of dinos is created with random neural weights. They will act randomly and likely fail quickly.
2. **Selection**: Dinos that survive longer and score higher are considered "fitter".
3. **Crossover & Mutation**: The fittest dinos are selected to be parents. Their "genes" (neural weights) are combined and slightly mutated to create the next generation.
4. **Repeat**: This process repeats indefinitely. Over time, the population evolves optimal strategies for timing jumps and avoiding collisions.

## 🚀 Getting Started

### Prerequisites
You only need a modern web browser (Chrome, Firefox, Edge, Safari) to run this project. No installation or server is required.

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/ai-dino-runner.git
   ```
2. Navigate to the project folder:
   ```bash
   cd ai-dino-runner
   ```
3. Open `index.html` in your web browser.

## 🎮 Controls

- **Start Training**: Begins the evolutionary training loop.
- **Pause**: Pauses the game simulation.
- **Reset**: Clears the current population and starts over from Generation 1.
- **Speed**: Adjust the simulation speed (1x, 2x, 5x, 10x) to train the AI faster.
- **Highlight Best**: Toggles the visual highlight/crown on the leading dinosaur.

## 📂 Project Structure

- `index.html`: Main entry point and UI layout.
- `main.js`: Manages the training loop, UI interactions, and connects the Game to the AI.
- `game.js`: Contains the game logic (`Game`, `Dino`, `Obstacle` classes) and physics.
- `neat.js`: The core AI logic, including `NeuralNetwork` and `Population` classes for evolution.
- `style.css`: Styling for the game interface.

## 🛠️ Technologies Used

- **HTML5 Canvas**: For high-performance game rendering.
- **Vanilla JavaScript (ES6+)**: Core logic for both the game and the AI.
- **CSS3**: Modern, responsive UI styling.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
