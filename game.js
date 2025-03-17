const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1b5e20',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 0 }
        }
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let ball, hole, startX, startY, animX, animY, preX, preY, isDragging = false, canShoot = false, gameStarted = false, gameFinished = false;

function preload() {
    this.load.image('ball', 'golfBall.png');
    this.load.image('hole', 'hole.png'); // Deliğin resmi
    this.load.image('wall', 'wall.png'); // Engellerin resmi
    this.load.image('buttonImage', 'playButtonn.png')
    this.load.image('background', 'background.png')
}

function create() {
    let menuBackground =  this.matter.add.image(400, 300, 'background').setStatic(true).setSensor(true).setStatic(true).setDepth(2);

    let button = this.add.image(400, 470, 'buttonImage').setInteractive().setDepth(3);
    button.on('pointerover', () => {
        // Butona fare geldiğinde yapılacak işlem (örneğin, renk değişimi)
        button.setTint(0x44ff44);
    });
    button.on('pointerout', () => {
        // Fare buton üzerinden çıkınca renk eski haline dönsün
        button.clearTint();
    });
    button.on('pointerdown', () => {
        // Butona tıklandığında yapılacak işlem
        console.log('Butona tıklandı!');
        button.setVisible(false);
        menuBackground.setVisible(false);
        gameStarted = true;
    });

    ball = this.matter.add.image(100, 100, 'ball');
    ball.setScale(0.5);
    ball.setCircle();
    ball.setFriction(0.02);
    ball.setBounce(0.8);
    ball.setFixedRotation();
    ball.setCollisionCategory(1);
    ball.setCollidesWith(1);
    ball.setDepth(1);

    // Oyun sınırları
    this.matter.world.setBounds(-16, -16, 832, 632, 32, true, true, true, true);

    // Engeller (Duvarlar)
    let wall1 = this.matter.add.image(200, 300, 'wall');
    wall1.setScale(0.2);
    wall1.setBody({ type: 'rectangle', width: 50, height: 50 });
    wall1.setStatic(true);

    let wall2 = this.matter.add.image(600, 440, 'wall');
    wall2.setScale(0.2);
    wall2.setBody({ type: 'rectangle', width: 50, height: 50 });
    wall2.setStatic(true);

    // Delik (hedef)
    hole = this.matter.add.image(700, 500, 'hole');
    hole.setScale(0.7);
    hole.setCircle(7);
    hole.setDepth(0);
    hole.body.isSensor = true;
    hole.setStatic(true);

    // Fare kontrolleri
    this.input.on('pointerdown', (pointer) => {
        if (canShoot && !gameFinished) {
            isDragging = true;
            startX = pointer.x;
            startY = pointer.y;
        }
    });

    this.input.on('pointerup', (pointer) => {
        if (isDragging && !gameFinished) {
            isDragging = false;
            canShoot = false;
            let forceX = (startX - pointer.x) * 0.1;
            let forceY = (startY - pointer.y) * 0.1;
            ball.setVelocity(forceX, forceY);
        }
    });

    this.matter.world.on('collisionstart', (event) => {
        event.pairs.forEach((pair) => {
            let bodyA = pair.bodyA.gameObject;
            let bodyB = pair.bodyB.gameObject;
    
            // Eğer çarpışan nesnelerden biri top ise
            if (bodyA === ball || bodyB === ball) {
                console.log("Top bir şeye çarptı!");
                [preX, preY] = [ball.x, ball.y];
            }
        });
    });
}

function update() {
    ball.setVelocity(ball.body.velocity.x * 0.98, ball.body.velocity.y * 0.98);

    // Top deliğe girerse
    let distanceToHole = Phaser.Math.Distance.Between(ball.x, ball.y, hole.x, hole.y);
    if (distanceToHole < 25 && !gameFinished) {
        gameFinished = true;
        ball.setVelocity(0, 0);
        ball.setPosition(hole.x, hole.y)
        let deltaX = hole.x - preX; // X eksenindeki fark
        let deltaY = hole.y - preY;
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        animX = ball.x - Math.cos(angle * (Math.PI / 180)) * 30;
        animY = ball.y - Math.sin(angle * (Math.PI / 180)) * 30;
        ball.setPosition(animX, animY);
        ball.setVelocity(-(animX-hole.x)*0.1, -(animY-hole.y)*0.1);
        distanceToHole = Phaser.Math.Distance.Between(ball.x, ball.y, hole.x, hole.y);
    }

    if (distanceToHole <= 1) {
        ball.setVelocity(0, 0);
        ball.setPosition(hole.x, hole.y)
    }

    // Top yavaşlayınca tekrar fırlatılabilir hale gelsin
    if (Math.abs(ball.body.velocity.x) < 0.2 && Math.abs(ball.body.velocity.y) < 0.2 && gameStarted) {
        [preX, preY] = [ball.x, ball.y];
        canShoot = true;
        ball.setVelocity(0, 0);
    }
}