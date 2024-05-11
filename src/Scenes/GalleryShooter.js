class GalleryShooter extends Phaser.Scene {

    constructor() {
        super("GalleryShooterScene");
        this.gridMove = true;
        this.missileFired = false;
        this.motorcycleMove = true;
        this.enemyFire = true;


        this.globalData = GlobalVars.getInstance();
        this.score = 0;
        this.enemiesOnField = 1;
  
        
    }
    

    preload() {
        this.load.setPath("./assets/");
        this.load.image("player", "car_black_1.png");
        this.load.image("missile", "cone_down.png");
    
        this.load.image("carMissile", "tires_red_alt.png");
        this.load.image("motoMissile", "tires_white_alt.png");

        // Car enemy images
        this.load.image("car_blue", "car_blue_1.png");
        this.load.image("car_green", "car_green_1.png");
        this.load.image("car_red", "car_red_1.png");
        this.load.image("car_yellow", "car_yellow_1.png");
    
        // Motorcycle enemy images
        this.load.image("motorcycle_blue", "motorcycle_blue.png");
        this.load.image("motorcycle_green", "motorcycle_green.png");
        this.load.image("motorcycle_red", "motorcycle_red.png");

        this.load.image("motorcycle_yellow", "motorcycle_yellow.png");
    
        // Barrel images
        this.load.image("barrel_blue_down", "barrel_blue_down.png");
        this.load.image("barrel_red_down", "barrel_red_down.png");
        this.load.image("barrel_blue", "barrel_blue.png");
        this.load.image("barrel_red", "barrel_red.png");

        //background
        this.load.image("bg", "bg.png");

        var newFont = new FontFace('CustomFont', 'url(./assets/customfont.ttf)');
        newFont.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
            console.log('Font loaded');
        }).catch((error) => {
            console.error('Failed to load font:', error);
        });
    }

    create() {

        //player create
        this.player = new Player(this, 550, 690, "player");
        this.physics.add.existing(this.player);
        this.missileFired = false;

        //controls
        this.setupControls();


        this.setupGame();


        // Create a status bar container at the bottom
        this.statusBar = this.add.container(0, game.config.height - 50);
        this.statusBar.setDepth(10); // Ensure it's on top of other game elements

        // Background for the status bar for better readability
        let background = this.add.rectangle(game.config.width / 2, 25, game.config.width, 50, 0xf4f1df, 1);
        this.statusBar.add(background);

        // Score display
        this.scoreText = this.add.text(10, 15, 'Score: 0', { // Adjusted y-position relative to the background
            fontFamily: 'CustomFont',
            fontSize: '28px',
            color: '#000000'
        });
        this.statusBar.add(this.scoreText);

        // Health display
        this.healthText = this.add.text(game.config.width - 150, 15, 'Health: 5', { // Adjusted y-position
            fontFamily: 'CustomFont',
            fontSize: '28px',
            color: '#000000'
        });
        this.statusBar.add(this.healthText);

        // Ensure the status bar is fixed and does not move with the camera
        this.statusBar.setScrollFactor(0);




        this.keys.reset.on('down', () => {
            this.gameReset();
        });

    }



    gameReset() {
        this.gridMove = true;
        this.missileFired = false;
        this.motorcycleMove = true;
        this.enemyFire = true;
        this.enemiesOnField = 0;  // Ensure enemies on field is reset to 0
        let globalData = GlobalVars.getInstance();
        globalData.score = 0;  // Reset global score
        this.score = 0;  // Reset local score
        this.scene.restart();
    }

    setupGame() {



        //enemy grid
        this.createEnemiesGrid();

        //player missile stuffs
        this.missiles = this.physics.add.group({
            classType: PlayerMissile,
            runChildUpdate: true
        });

        //enemy missile stuffs
        this.eMissiles = this.physics.add.group({
            classType: EnemyMissile,
            runChildUpdate: true
        })


        //colliders
        this.physics.add.collider(this.missiles, this.enemies, this.pMissileEnemyCollision, null, this);
        this.physics.add.collider(this.player, this.enemies, this.PlayerEnemyCollision, null, this);
        this.physics.add.collider(this.eMissiles, this.player, this.eMissilePlayerCollision, null, this);



        //enemy move
        this.time.addEvent({
            delay: 10000,
            callback: this.moveEnemiesDown,
            callbackScope: this,
            loop: true
        });

        //cars missile fire
        this.time.addEvent({
            delay: 1500,
            callback: this.fireFromExposedCars,
            callbackScope: this,
            loop: true
        });
        //cars missile fire
        this.time.addEvent({
            delay: 1500,
            callback: () => {
                for (let i = 0; i < 3; i++) {
                    this.time.delayedCall(i * 500, this.fireFromExposedBikes, [], this);
                }
            },
            callbackScope: this,
            loop: true
        });


    }


    setupControls() {
        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            reset: Phaser.Input.Keyboard.KeyCodes.R,
            slow: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });
    
        this.keys.space.on('up', () => {
            this.missileFired = false;
        }, this);
    }

    update() {
        this.player.update();
        this.handleInput();

        this.scoreText.setText('Score: ' + this.globalData.score);
        this.healthText.setText('Health: ' + this.player.hp);

        if (this.enemiesOnField == 0) {
            this.globalData.highScore = this.score;
            console.log("level clear");
            this.enemiesOnField = 0;
            this.scene.start('WinEndScreen');
        }
    }

    handleInput() {
        const moveSpeed = this.keys.slow.isDown ? 2.5: 5;

        if (this.keys.left.isDown) {
            console.log("Left down");
            this.player.x -= moveSpeed;
            this.player.x = Math.max(this.player.width / 2, this.player.x);
        }
        if (this.keys.right.isDown) {
            console.log("Right down");
            this.player.x += moveSpeed;
            this.player.x = Math.min(this.game.config.width - this.player.width / 2, this.player.x);
        }
    
        if (this.keys.space.isDown && !this.missileFired) {
            console.log("space down, can fire");
            this.firePlayerMissile();
            this.missileFired = true;
        } else if (this.keys.space.isUp) {

            this.missileFired = false;
        }
    }





    firePlayerMissile() {
        console.log("Attempting to fire a missile, Grid Move:", this.gridMove);
        if (this.gridMove) {
            const missile = new PlayerMissile(this, this.player.x, this.player.y - 20, "missile");
            this.missiles.add(missile);
            console.log("Missile fired");
        } else {
            console.log("Missile fire blocked by gridMove flag");
        }
    }

    createEnemiesGrid() {
        this.enemiesOnField = 0;

        const rows = 5;
        const cols = 7;
        const paddingX = 50;
        const paddingY = 50;
        const spacingX = 83;
        const spacingY = 85;
    
        const cars = ["car_blue", "car_green", "car_red", "car_yellow"];
        const motorcycles = ["motorcycle_blue", "motorcycle_green", "motorcycle_red", "motorcycle_yellow"];
        const barrels = ["barrel_blue_down", "barrel_red_down", "barrel_blue", "barrel_red"];
    
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });
    
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = paddingX + col * spacingX;
                const y = paddingY + row * spacingY;
    
                // Randomly select the type of enemy to create
                const typeChoice = Phaser.Math.Between(0, 2);
                let selectedType;
                if (typeChoice === 0) {
                    selectedType = cars[Phaser.Math.Between(0, cars.length - 1)];
                    const opp = new Car(this, x, y, selectedType);
                    this.enemies.add(opp);
                    this.physics.add.existing(opp);
                } else if (typeChoice === 1) {
                    selectedType = motorcycles[Phaser.Math.Between(0, motorcycles.length - 1)];
                    const opp = new Motorcycle(this, x, y, selectedType);
                    this.enemies.add(opp);
                    this.physics.add.existing(opp);
                } else {
                    selectedType = barrels[Phaser.Math.Between(0, barrels.length - 1)];
                    const opp = new Barrel(this, x, y, selectedType);
                    this.enemies.add(opp);
                    this.physics.add.existing(opp);
                }


                this.enemiesOnField++;
    
                
            }
        }

    }
    

    fireFromExposedCars() {
        const columnThreshold = 71; // Adjust this based on the exact width of your sprites if needed
        const columns = {};
    
        // Organize enemies by columns based on a threshold to handle slight position variations
        this.enemies.children.iterate((enemy) => {
            const columnKey = Math.round(enemy.x / columnThreshold) * columnThreshold;
            if (!columns[columnKey]) {
                columns[columnKey] = [];
            }
            columns[columnKey].push(enemy);
        });
    
        // For each column, determine the lowest enemy
        Object.keys(columns).forEach((key) => {
            const enemiesInColumn = columns[key];
            if (enemiesInColumn.length) {
                const mostExposedEnemy = enemiesInColumn.reduce((lowest, current) => {
                    return (current.y > lowest.y) ? current : lowest;
                });
    
                // Make sure no other enemies are directly below the most exposed one
                const exposed = enemiesInColumn.every(e => {
                    return (e === mostExposedEnemy || e.y < mostExposedEnemy.y - e.displayHeight);
                });
    
                if (this.enemyFire && exposed && (mostExposedEnemy instanceof Car)) {
                    mostExposedEnemy.fire();
                }
            }
        });
    }

    fireFromExposedBikes() {
        const columnThreshold = 71; // Adjust this based on the exact width of your sprites if needed
        const columns = {};
    
        // Organize enemies by columns based on a threshold to handle slight position variations
        this.enemies.children.iterate((enemy) => {
            const columnKey = Math.round(enemy.x / columnThreshold) * columnThreshold;
            if (!columns[columnKey]) {
                columns[columnKey] = [];
            }
            columns[columnKey].push(enemy);
        });
    
        // For each column, determine the lowest enemy
        Object.keys(columns).forEach((key) => {
            const enemiesInColumn = columns[key];
            if (enemiesInColumn.length) {
                const mostExposedEnemy = enemiesInColumn.reduce((lowest, current) => {
                    return (current.y > lowest.y) ? current : lowest;
                });
    
                // Make sure no other enemies are directly below the most exposed one
                const exposed = enemiesInColumn.every(e => {
                    return (e === mostExposedEnemy || e.y < mostExposedEnemy.y - e.displayHeight);
                });
    
                if (this.enemyFire && exposed && (mostExposedEnemy instanceof Motorcycle)) {
                    mostExposedEnemy.fire();
                }
            }
        });
    
    }
    

    moveEnemiesDown() {
        if (this.gridMove) {
            this.enemies.children.iterate((enemy) => {
                enemy.y += 50;
            });
        }
    }

    pMissileEnemyCollision(missile, enemy) {
        console.log('Collision detected');
        missile.destroy();
        if (enemy instanceof Barrel) {
            enemy.hp--;
            if (enemy.hp <= 0) {
                this.globalData.score++;
                console.log("+1pts, total score: ", this.globalData.score);
                enemy.destroy();
                this.enemiesOnField--;
                this.score = 0;
            }
        } else {
            if (enemy instanceof Car) {
                this.globalData.score += 2;
                console.log("+2pts, total score: ", this.globalData.score);
                enemy.destroy();
                this.enemiesOnField--;
            }
            else if (enemy instanceof Motorcycle) {
                this.globalData.score += 3;
                console.log("+3pts, total score: ", this.globalData.score);
                enemy.destroy();
                this.enemiesOnField--;
                this.score = 0;
            }
            
        }
        console.log("players on field: ", this.enemiesOnField);

    }

    eMissilePlayerCollision(player, missile) {
        console.log(player);
        console.log(missile);
        console.log('An enemy missile has collided with the player');
        missile.destroy();
        if (missile instanceof EnemyMissile) {
            player.hp--;
        }

        if ((player instanceof Player)) {
            console.log("hp: ", player.hp);
            if (player.hp <= 0) {
                player.destroy();
                this.scene.start('PlayerDead');
        }
        }
        
        
    }
    
    PlayerEnemyCollision(player) {
        console.log("An Enemy has collided with the player!");
        player.destroy();
        this.scene.start('PlayerDead');
    }

    
}


class Player extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, imageKey) {
        super(scene, x, y, imageKey);
        scene.add.existing(this);
        this.setScale(0.4, .4);
        
        this.hp = 5;
        console.log("Player created with hp: ", this.hp); 
        
    }

    update() {
        console.log("Current hp: ", this.hp);
    }
}

class PlayerMissile extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, imageKey) {
        super(scene, x, y, imageKey);
        this.setScale(.4, .9);
        this.setOrigin(0.5, 1);
        scene.add.existing(this);
    }

    update() {
        this.y -= 10;
        if (this.y < 0) {
            this.destroy();
        }
    }
}

class EnemyMissile extends Phaser.GameObjects.Sprite  {
    constructor(scene, x, y, imageKey, angle = 0) {
        super(scene, x, y, imageKey);
        this.setScale(.5);
        this.flipX;
        this.setOrigin(.5, 1);
        scene.add.existing(this);
    }

    update() {
        const rad = Phaser.Math.DegToRad(this.angle);
        this.x += Math.sin(rad) * 5;
        this.y += Math.cos(rad) * 5;
    
        if (this.y > game.config.height) {
            this.destroy();
        }
    }
}

class Enemy extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, imageKey) {
        super(scene, x, y, imageKey);
        this.setScale();
        this.setOrigin(0.5, 0.5);
        scene.add.existing(this);
    }

    update() {}
    fire() {}
}

class Barrel extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, imageKey) {
        super(scene, x, y, imageKey);
        scene.add.existing(this);
        this.setScale(.7);
        this.hp = 3;
    }

    update() {}
}

class Car extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, imageKey) {
        super(scene, x, y, imageKey);
        scene.add.existing(this);
        this.setScale(0.6);
    }

    update() {}

    fire() {
        const angles = [0];
        angles.forEach(angle => {
            const missile = new EnemyMissile(this.scene, this.x, this.y + 20, "carMissile");
            this.scene.eMissiles.add(missile);
        });
    }
}

class Motorcycle extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, imageKey) {
        super(scene, x, y, imageKey);
        this.startX = x + Math.random() * 6 * (Math.random() < 0.5 ? -1 : 1);
        this.x = x;
        scene.add.existing(this);
        this.setScale(0.7);
        this.movementRange = 25;
        this.moveDirection = Math.random() < 0.5 ? -1 : 1;
    }

    update() {

        if (this.x >= this.startX + this.movementRange) {
            this.moveDirection = -1;
        } else if (this.x <= this.startX - this.movementRange) {
            this.moveDirection = 1;
        }

        this.x += this.moveDirection;
    }

    fire() {
        const missile = new EnemyMissile(this.scene, this.x, this.y, "motoMissile");
        this.scene.eMissiles.add(missile);
    }
}


class GlobalVars {
    constructor() {
        this.score = 0;
        this.highScore = this.readHighScore();
    }

    static getInstance() {
        if (!GlobalVars.instance) {
            GlobalVars.instance = new GlobalVars();
        }
        return GlobalVars.instance;
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            console.log("New high score: " + this.highScore);
        }
    }

    saveHighScore() {
        localStorage.setItem('highScore', this.highScore);
        console.log("High score saved: " + this.highScore);
    }

    readHighScore() {
        let savedScore = localStorage.getItem('highScore');
        return savedScore ? parseInt(savedScore) : 0; // If there's a saved score, parse it to an integer, otherwise return 0
    }

    resetScore() {
        this.score = 0;
    }
}


//Win End Screen
class WinEndScreen extends Phaser.Scene {
    constructor() {
        super("WinEndScreen");
        let globalData = GlobalVars.getInstance();
        this.score = globalData.score;


        if (this.score > globalData.highScore) {
            globalData.highScore = this.score;
        }

    }

    create() {
        GlobalVars.getInstance().updateHighScore();

        // Background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5).setOrigin(0);

        // Title
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 5, 'Congratulations!', {
            fontFamily: 'CustomFont',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        //  Score
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 2 / 5, ('Score: ' + GlobalVars.getInstance().score), {
            fontFamily: 'CustomFont',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

         // High Score
         this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 3 / 5, ('High Score: ' + GlobalVars.getInstance().highScore), {
            fontFamily: 'CustomFont',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5); 

        // Instructions
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 4 / 5, 'Press <Q> to restart and beat your high score!', {
            fontFamily: 'CustomFont',
            fontSize: '28px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Input listener to return to the game when any key is pressed
        this.input.keyboard.once('keydown-Q', () => {
            this.scene.start('GalleryShooterScene');
            this.gameRestart();

        });
    }

    gameRestart() {
        let globalData = GlobalVars.getInstance();
        globalData.score = 0;  // Reset score
        this.scene.start('GalleryShooterScene');  // Start the main game scene
    }
}


//Player dedw
class PlayerDead extends Phaser.Scene {
    constructor() {
        super("PlayerDead");
        let globalData = GlobalVars.getInstance();
        this.score = globalData.score;

    }

    create() {
        GlobalVars.getInstance().updateHighScore();

        // Background
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5).setOrigin(0);

        // Title
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 5, 'YOU DIED!', {
            fontFamily: 'CustomFont',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        //  Score
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 2 / 5, ('Score: ' + GlobalVars.getInstance().score), {
            fontFamily: 'CustomFont',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

         // High Score
         this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 3 / 5, ('High Score: ' + GlobalVars.getInstance().highScore), {
            fontFamily: 'CustomFont',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5); 

        // Instructions
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height * 4 / 5, 'Press <Q> to try again', {
            fontFamily: 'CustomFont',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Input listener to return to the game when any key is pressed
        this.input.keyboard.once('keydown-Q', () => {
            this.gameRestart();
            this.scene.start('GalleryShooterScene');
        });


        
    }

    gameRestart() {
        let globalData = GlobalVars.getInstance();
        globalData.score = 0;  // Reset score
        this.scene.start('GalleryShooterScene');  // Start the main game scene
    }
}
