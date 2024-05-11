// Nathan Shturm
// Created: 4/24/2024
// Phaser: 3.70.0
//
// 1-D Movement
//
// 
// Art assets from Kenny Assets:

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: {y: 0}
        }
    },
    width: 600,
    height: 800,
    parent: 'gameContainer',
    backgroundColor: "#2c2f33",
    scene: [GalleryShooter, WinEndScreen, PlayerDead, EnemyBoundEnd]
}

// Global variable to hold sprites
var my = {sprite: {}};

const game = new Phaser.Game(config);
