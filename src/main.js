import Phaser from 'phaser';
import { MainMenuScene }    from './scenes/MainMenuScene.js';
import { GameBoardScene }   from './scenes/GameBoardScene.js';
import { AuraShopScene }    from './scenes/AuraShopScene.js';
import { CampaignMapScene } from './scenes/CampaignMapScene.js';
import { CustomizationScene } from './scenes/CustomizationScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#1a0e06',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MainMenuScene, GameBoardScene, AuraShopScene, CampaignMapScene, CustomizationScene]
};

new Phaser.Game(config);
