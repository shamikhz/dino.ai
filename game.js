/**
 * GAME.JS - Core Game Engine
 * Contains Dino class, Obstacle class, and Game management logic
 */

// ============================================================================
// DINO CLASS - The dinosaur character
// ============================================================================
class Dino {
    constructor(brain = null) {
        // Physics properties
        this.x = 100;                    // Fixed X position
        this.y = 0;                      // Y position (0 = ground)
        this.width = 30;
        this.height = 40;
        this.velocity = 0;               // Vertical velocity
        this.gravity = 0.8;              // Gravity strength
        this.jumpStrength = -15;         // Jump power (negative = up)
        
        // State
        this.isJumping = false;
        this.isAlive = true;
        this.score = 0;
        this.fitness = 0;
        
        // AI Brain
        this.brain = brain;              // Neural network (from NEAT)
        
        // Visual
        this.color = '#64748b';          // Default gray
    }
    
    /**
     * Make the dino jump (if on ground)
     */
    jump() {
        if (!this.isJumping && this.isAlive) {
            this.velocity = this.jumpStrength;
            this.isJumping = true;
        }
    }
    
    /**
     * Update physics and position
     * @param {number} gameSpeed - Current game speed multiplier
     */
    update(gameSpeed) {
        if (!this.isAlive) return;
        
        // Apply gravity
        this.velocity += this.gravity;
        this.y += this.velocity;
        
        // Ground collision
        if (this.y >= 0) {
            this.y = 0;
            this.velocity = 0;
            this.isJumping = false;
        }
        
        // Increase score (1 point per frame alive)
        this.score++;
        this.fitness = this.score; // Base fitness on survival time
    }
    
    /**
     * Render the dino on canvas
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} groundY - Y coordinate of ground
     */
    draw(ctx, groundY) {
        if (!this.isAlive) return;
        
        // Visual offset to place dino above the line
        const bottomOffset = 10;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x,
            groundY - this.height - this.y - bottomOffset,
            this.width,
            this.height
        );
        
        // Draw eye
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
            this.x + this.width - 10,
            groundY - this.height - this.y - bottomOffset + 8,
            5,
            5
        );
    }
    
    /**
     * Check if dino collides with an obstacle
     * @param {Obstacle} obstacle 
     * @returns {boolean}
     */
    collidesWith(obstacle) {
        // Simple AABB collision detection
        const dinoLeft = this.x;
        const dinoRight = this.x + this.width;
        const dinoTop = this.y + this.height;
        const dinoBottom = this.y;
        
        const obsLeft = obstacle.x;
        const obsRight = obstacle.x + obstacle.width;
        const obsTop = obstacle.height;
        const obsBottom = 0;
        
        // Check overlap
        return dinoRight > obsLeft &&
               dinoLeft < obsRight &&
               dinoTop > obsBottom &&
               dinoBottom < obsTop;
    }
    
    /**
     * Kill the dino (game over)
     */
    die() {
        this.isAlive = false;
        this.fitness = this.score; // Final fitness = final score
    }
}

// ============================================================================
// OBSTACLE CLASS - Cacti that spawn and move
// ============================================================================
class Obstacle {
    constructor(x, canvasWidth) {
        this.x = x;
        this.canvasWidth = canvasWidth;
        
        // Random obstacle type (different heights)
        const types = [
            { width: 20, height: 40 },      // Tall cactus
            { width: 30, height: 30 },      // Medium cactus
            { width: 15, height: 50 },      // Very tall cactus
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        this.width = type.width;
        this.height = type.height;
        
        this.color = '#ef4444';             // Red obstacle
    }
    
    /**
     * Move obstacle left
     * @param {number} gameSpeed - Current game speed
     */
    update(gameSpeed) {
        this.x -= gameSpeed;
    }
    
    /**
     * Check if obstacle is off-screen (left side)
     * @returns {boolean}
     */
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    /**
     * Render the obstacle
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} groundY - Y coordinate of ground
     */
    draw(ctx, groundY) {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x,
            groundY - this.height,
            this.width,
            this.height
        );
    }
}

// ============================================================================
// GAME CLASS - Manages game state and rendering
// ============================================================================
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.groundY = this.height - 50;     // Ground line Y position
        
        // Game state
        this.obstacles = [];
        this.gameSpeed = 6;                  // Initial speed
        this.baseSpeed = 6;
        this.frameCount = 0;
        this.obstacleSpawnInterval = 90;     // Frames between obstacles
        this.maxGameSpeed = 15;              // Speed cap
        
        // Speed multiplier (for training acceleration)
        this.speedMultiplier = 1;
        
        this.reset();
    }
    
    /**
     * Reset game to initial state
     */
    reset() {
        this.obstacles = [];
        this.gameSpeed = this.baseSpeed;
        this.frameCount = 0;
        
        // Spawn first obstacle
        this.spawnObstacle();
    }
    
    /**
     * Spawn a new obstacle
     */
    spawnObstacle() {
        const x = this.width + 50;
        this.obstacles.push(new Obstacle(x, this.width));
    }
    
    /**
     * Update game state
     */
    update() {
        this.frameCount++;
        
        // Increase speed over time (every 300 frames)
        if (this.frameCount % 300 === 0 && this.gameSpeed < this.maxGameSpeed) {
            this.gameSpeed += 0.5;
        }
        
        // Spawn new obstacles
        if (this.frameCount % this.obstacleSpawnInterval === 0) {
            this.spawnObstacle();
        }
        
        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].update(this.gameSpeed * this.speedMultiplier);
            
            // Remove off-screen obstacles
            if (this.obstacles[i].isOffScreen()) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    /**
     * Draw game elements
     * @param {Dino[]} dinos - Array of dinos to render
     * @param {Dino} bestDino - Best performing dino (highlighted)
     * @param {boolean} highlightBest - Whether to highlight best dino
     */
    draw(dinos, bestDino = null, highlightBest = true) {
        // Clear canvas
        this.ctx.fillStyle = '#1a1f3a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw ground line
        this.ctx.strokeStyle = '#475569';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.width, this.groundY);
        this.ctx.stroke();
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.draw(this.ctx, this.groundY);
        });
        
        // Draw dinos (non-best first, then best on top)
        if (dinos) {
            // Draw regular dinos
            dinos.forEach(dino => {
                if (dino !== bestDino) {
                    dino.draw(this.ctx, this.groundY);
                }
            });
            
            // Draw best dino on top (highlighted)
            if (bestDino && highlightBest) {
                bestDino.color = '#10b981'; // Green highlight
                bestDino.draw(this.ctx, this.groundY);
                
                // Draw crown above best dino
                this.ctx.font = '20px Arial';
                this.ctx.fillText('👑', bestDino.x + 5, this.groundY - bestDino.height - bestDino.y - 15);
            }
        }
        
        // Draw speed indicator
        this.ctx.fillStyle = '#64748b';
        this.ctx.font = '14px Inter';
        this.ctx.fillText(`Speed: ${this.gameSpeed.toFixed(1)}x`, this.width - 100, 30);
    }
    
    /**
     * Get the closest obstacle ahead of a dino
     * @param {Dino} dino 
     * @returns {Obstacle|null}
     */
    getClosestObstacle(dino) {
        for (let obstacle of this.obstacles) {
            // Find first obstacle ahead of dino
            if (obstacle.x + obstacle.width > dino.x) {
                return obstacle;
            }
        }
        return null;
    }
    
    /**
     * Get AI inputs for decision making
     * @param {Dino} dino 
     * @returns {number[]} Array of normalized inputs [0-1]
     */
    getInputs(dino) {
        const obstacle = this.getClosestObstacle(dino);
        
        if (!obstacle) {
            // No obstacle visible, safe inputs
            return [1, 0, 0, 0, this.gameSpeed / this.maxGameSpeed];
        }
        
        // Calculate normalized inputs
        const distance = (obstacle.x - (dino.x + dino.width)) / this.width;
        const obstacleHeight = obstacle.height / 60;  // Normalize to max height
        const obstacleWidth = obstacle.width / 40;    // Normalize to max width
        const dinoY = dino.y / 100;                   // Normalize dino height
        const speed = this.gameSpeed / this.maxGameSpeed;
        
        return [
            Math.max(0, Math.min(1, distance)),        // Distance to obstacle [0-1]
            Math.max(0, Math.min(1, obstacleHeight)),  // Obstacle height [0-1]
            Math.max(0, Math.min(1, obstacleWidth)),   // Obstacle width [0-1]
            Math.max(0, Math.min(1, dinoY)),           // Dino Y position [0-1]
            Math.max(0, Math.min(1, speed))            // Game speed [0-1]
        ];
    }
    
    /**
     * Set speed multiplier for training acceleration
     * @param {number} multiplier 
     */
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
    }
}
