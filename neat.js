/**
 * NEAT.JS - NeuroEvolution of Augmenting Topologies
 * Simplified implementation for training AI dinos
 */

// ============================================================================
// NEURAL NETWORK - Forward propagation brain
// ============================================================================
class NeuralNetwork {
    constructor(inputCount, hiddenCount, outputCount) {
        this.inputCount = inputCount;
        this.hiddenCount = hiddenCount;
        this.outputCount = outputCount;

        // Weights: input->hidden and hidden->output
        this.weightsIH = this.randomMatrix(hiddenCount, inputCount);
        this.weightsHO = this.randomMatrix(outputCount, hiddenCount);

        // Biases
        this.biasH = this.randomMatrix(hiddenCount, 1);
        this.biasO = this.randomMatrix(outputCount, 1);
    }

    /**
     * Create random matrix with values between -1 and 1
     */
    randomMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            matrix[i] = [];
            for (let j = 0; j < cols; j++) {
                matrix[i][j] = Math.random() * 2 - 1; // Range: -1 to 1
            }
        }
        return matrix;
    }

    /**
     * Sigmoid activation function
     */
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    /**
     * Forward propagation - get output from inputs
     * @param {number[]} inputArray - Array of input values
     * @returns {number[]} Output values
     */
    predict(inputArray) {
        // Convert input to matrix
        const inputs = inputArray.map(x => [x]);

        // Calculate hidden layer
        const hidden = this.matrixMultiply(this.weightsIH, inputs);
        this.matrixAdd(hidden, this.biasH);
        this.matrixMap(hidden, this.sigmoid.bind(this));

        // Calculate output layer
        const outputs = this.matrixMultiply(this.weightsHO, hidden);
        this.matrixAdd(outputs, this.biasO);
        this.matrixMap(outputs, this.sigmoid.bind(this));

        // Convert back to array
        return outputs.map(row => row[0]);
    }

    /**
     * Matrix multiplication
     */
    matrixMultiply(a, b) {
        const result = [];
        for (let i = 0; i < a.length; i++) {
            result[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < a[0].length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }

    /**
     * Matrix addition (in-place)
     */
    matrixAdd(a, b) {
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < a[0].length; j++) {
                a[i][j] += b[i][j];
            }
        }
    }

    /**
     * Apply function to all matrix elements (in-place)
     */
    matrixMap(matrix, func) {
        for (let i = 0; i < matrix.length; i++) {
            for (let j = 0; j < matrix[0].length; j++) {
                matrix[i][j] = func(matrix[i][j]);
            }
        }
    }

    /**
     * Create a copy of this network
     */
    copy() {
        const copy = new NeuralNetwork(this.inputCount, this.hiddenCount, this.outputCount);
        copy.weightsIH = this.copyMatrix(this.weightsIH);
        copy.weightsHO = this.copyMatrix(this.weightsHO);
        copy.biasH = this.copyMatrix(this.biasH);
        copy.biasO = this.copyMatrix(this.biasO);
        return copy;
    }

    /**
     * Deep copy a matrix
     */
    copyMatrix(matrix) {
        return matrix.map(row => [...row]);
    }

    /**
     * Mutate weights and biases
     * @param {number} rate - Mutation rate (0-1)
     */
    mutate(rate) {
        this.weightsIH = this.mutateMatrix(this.weightsIH, rate);
        this.weightsHO = this.mutateMatrix(this.weightsHO, rate);
        this.biasH = this.mutateMatrix(this.biasH, rate);
        this.biasO = this.mutateMatrix(this.biasO, rate);
    }

    /**
     * Mutate matrix values
     */
    mutateMatrix(matrix, rate) {
        return matrix.map(row =>
            row.map(val => {
                if (Math.random() < rate) {
                    // Add random noise
                    return val + (Math.random() * 2 - 1) * 0.5;
                }
                return val;
            })
        );
    }

    /**
     * Crossover with another network (mix genes)
     * @param {NeuralNetwork} partner 
     * @returns {NeuralNetwork} Child network
     */
    crossover(partner) {
        const child = new NeuralNetwork(this.inputCount, this.hiddenCount, this.outputCount);

        // Mix weights from both parents
        child.weightsIH = this.crossoverMatrix(this.weightsIH, partner.weightsIH);
        child.weightsHO = this.crossoverMatrix(this.weightsHO, partner.weightsHO);
        child.biasH = this.crossoverMatrix(this.biasH, partner.biasH);
        child.biasO = this.crossoverMatrix(this.biasO, partner.biasO);

        return child;
    }

    /**
     * Mix two matrices (random from each parent)
     */
    crossoverMatrix(a, b) {
        return a.map((row, i) =>
            row.map((val, j) =>
                Math.random() < 0.5 ? val : b[i][j]
            )
        );
    }
}

// ============================================================================
// POPULATION - Manages evolution of neural networks
// ============================================================================
class Population {
    constructor(size, inputCount, hiddenCount, outputCount) {
        this.size = size;
        this.inputCount = inputCount;
        this.hiddenCount = hiddenCount;
        this.outputCount = outputCount;

        this.generation = 1;
        this.networks = [];
        this.bestFitness = 0;
        this.bestNetwork = null;
        this.avgFitness = 0;

        // Evolution parameters
        this.mutationRate = 0.1;        // 10% chance per weight
        this.elitismCount = 2;          // Keep top 2 unchanged

        // Initialize population
        this.initialize();
    }

    /**
     * Create initial random population
     */
    initialize() {
        this.networks = [];
        for (let i = 0; i < this.size; i++) {
            this.networks.push(new NeuralNetwork(
                this.inputCount,
                this.hiddenCount,
                this.outputCount
            ));
        }
    }

    /**
     * Evolve to next generation based on fitness
     * @param {number[]} fitnessScores - Fitness score for each network
     */
    evolve(fitnessScores) {
        // Sort networks by fitness (best first)
        const indexed = this.networks.map((network, i) => ({
            network,
            fitness: fitnessScores[i]
        }));

        indexed.sort((a, b) => b.fitness - a.fitness);

        // Track statistics
        this.bestFitness = indexed[0].fitness;
        this.bestNetwork = indexed[0].network.copy();
        this.avgFitness = fitnessScores.reduce((a, b) => a + b, 0) / fitnessScores.length;

        // Create next generation
        const newNetworks = [];

        // Elitism: keep best performers unchanged
        for (let i = 0; i < this.elitismCount; i++) {
            newNetworks.push(indexed[i].network.copy());
        }

        // Fill rest with offspring
        while (newNetworks.length < this.size) {
            // Select parents (weighted by fitness)
            const parent1 = this.selectParent(indexed);
            const parent2 = this.selectParent(indexed);

            // Crossover
            let child = parent1.crossover(parent2);

            // Mutate
            child.mutate(this.mutationRate);

            newNetworks.push(child);
        }

        this.networks = newNetworks;
        this.generation++;
    }

    /**
     * Select a parent using tournament selection
     * @param {Object[]} indexed - Sorted array of {network, fitness}
     * @returns {NeuralNetwork}
     */
    selectParent(indexed) {
        // Tournament selection: pick best of 3 random candidates
        const tournamentSize = 3;
        let best = null;
        let bestFitness = -Infinity;

        for (let i = 0; i < tournamentSize; i++) {
            const candidate = indexed[Math.floor(Math.random() * indexed.length)];
            if (candidate.fitness > bestFitness) {
                best = candidate.network;
                bestFitness = candidate.fitness;
            }
        }

        return best;
    }

    /**
     * Get a network by index
     */
    getNetwork(index) {
        return this.networks[index];
    }

    /**
     * Get all networks
     */
    getAllNetworks() {
        return this.networks;
    }

    /**
     * Reset to generation 1
     */
    reset() {
        this.generation = 1;
        this.bestFitness = 0;
        this.bestNetwork = null;
        this.avgFitness = 0;
        this.initialize();
    }
}
