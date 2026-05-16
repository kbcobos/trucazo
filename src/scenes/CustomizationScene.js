import Phaser from 'phaser';

const W = 960;
const H = 540;

export class CustomizationScene extends Phaser.Scene {
  constructor() { super('Customization'); }

  init(data) {
    this.powerupsActivos   = data.powerupsActivos   ?? [];
    this.aura              = data.aura              ?? 0;
    this.provinciasDesbloq = data.provinciasDesbloq ?? ['tierra_del_fuego'];
    this.provinciaActual   = data.provinciaActual   ?? 'tierra_del_fuego';
    
    this.iconoJugador      = data.iconoJugador      ?? 'icono_gaucho';
    this.marcoJugador      = data.marcoJugador      ?? 'marco_basico';
  }

  preload() {
    this.load.image('marco_gaucho', 'assets/ui/banners/marco_gaucho.png');
    this.load.image('marco_pampa', 'assets/ui/banners/marco_pampa.png');
    this.load.image('marco_dorado', 'assets/ui/banners/marco_dorado.png');
    this.load.image('marco_perfecto', 'assets/ui/banners/marco_perfecto.png');
    this.load.image('marco_basico', 'assets/ui/banners/marco_basico.png');
    
    this.load.image('icono_gaucho', 'assets/ui/banners/icono_gaucho.png');
    this.load.image('icono_gaucho_dorado', 'assets/ui/banners/icono_gaucho_dorado.png');
    this.load.image('icono_gaucho_rojo', 'assets/ui/banners/icono_gaucho_rojo.png');
    this.load.image('icono_gaucho_negro', 'assets/ui/banners/icono_gaucho_negro.png');
  }

  create() {
    this.add.rectangle(0, 0, W, H, 0x0a0502).setOrigin(0);
    
    this.add.text(W / 2, 40, 'CONFIGURACIÓN DE AVATAR', {
      fontSize: '22px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace", letterSpacing: 2
    }).setOrigin(0.5);

    this.previewContainer = this.add.container(W / 2 + 280, H / 2 - 20);
    this._actualizarPreview();

    this.add.text(100, 110, 'ELEGÍ TU MARCO:', {
      fontSize: '14px', color: '#7a5030', fontStyle: 'bold', fontFamily: "'Chakra Petch'"
    }).setOrigin(0, 0.5);

    const listaMarcos = ['marco_basico', 'marco_pampa', 'marco_gaucho', 'marco_perfecto', 'marco_dorado'];
    listaMarcos.forEach((mKey, idx) => {
      const x = 140 + idx * 95;
      const y = 180;
      
      const slot = this.add.rectangle(x, y, 80, 80, 0x140b05).setStrokeStyle(1, 0x444444).setInteractive({ useHandCursor: true });
      this.add.image(x, y, mKey).setDisplaySize(74, 64);
      
      slot.on('pointerdown', () => {
        this.marcoJugador = mKey;
        this._actualizarPreview();
      });
    });

    this.add.text(100, 270, 'ELEGÍ TU ICONO:', {
      fontSize: '14px', color: '#7a5030', fontStyle: 'bold', fontFamily: "'Chakra Petch'"
    }).setOrigin(0, 0.5);

    const listaIconos = ['icono_gaucho', 'icono_gaucho_rojo', 'icono_gaucho_negro', 'icono_gaucho_dorado'];
    listaIconos.forEach((iKey, idx) => {
      const x = 140 + idx * 95;
      const y = 340;
      
      const slot = this.add.rectangle(x, y, 80, 80, 0x140b05).setStrokeStyle(1, 0x444444).setInteractive({ useHandCursor: true });
      this.add.image(x, y, iKey).setDisplaySize(64, 64);
      
      slot.on('pointerdown', () => {
        this.iconoJugador = iKey;
        this._actualizarPreview();
      });
    });

    const btnBg = this.add.rectangle(140, H - 60, 200, 40, 0x2a1608).setOrigin(0, 0.5).setStrokeStyle(1.5, 0xEF9F27).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(240, H - 60, 'GUARDAR Y VOLVER', {
      fontSize: '13px', color: '#EF9F27', fontStyle: 'bold', fontFamily: "'Chakra Petch'"
    }).setOrigin(0.5);

    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu', {
          powerupsActivos:   this.powerupsActivos,
          aura:              this.aura,
          provinciasDesbloq: this.provinciasDesbloq,
          provinciaActual:   this.provinciaActual,
          iconoJugador:      this.iconoJugador,
          marcoJugador:      this.marcoJugador
        });
      });
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  _actualizarPreview() {
    this.previewContainer.removeAll(true);

    const fondoPreview = this.add.rectangle(0, 0, 220, 240, 0x110904).setStrokeStyle(1, 0xc09060, 0.3);
    this.previewContainer.add(fondoPreview);

    if (this.textures.exists(this.marcoJugador)) {
      const m = this.add.image(0, -15, this.marcoJugador).setDisplaySize(160, 120);
      this.previewContainer.add(m);
    }

    if (this.textures.exists(this.iconoJugador)) {
      const ico = this.add.image(0, -15, this.iconoJugador).setDisplaySize(90, 90);
      this.previewContainer.add(ico);
    }
    
    const lbl = this.add.text(0, 80, 'ASÍ TE VES EN MESA', {
      fontSize: '12px', color: '#e8c88a', fontFamily: "'Chakra Petch'", fontStyle: 'bold', letterSpacing: 1
    }).setOrigin(0.5);
    this.previewContainer.add(lbl);
  }
}