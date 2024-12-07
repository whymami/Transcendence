{
    const ai_canvas = document.getElementById('ai_pongCanvas');
    const ai_paddleLeft = document.getElementById('ai_paddleLeft');
    const ai_paddleRight = document.getElementById('ai_paddleRight');
    const ai_ball = document.getElementById('ai_ball');
    const ai_scoreDisplay = document.getElementById('ai_score');
    const ai_startMessage = document.getElementById('ai_startMessage');

    let ai_paddleLeftY = 160;
    let ai_paddleRightY = 160;
    const ai_paddleSpeed = 6;
    const ai_paddleHeight = ai_paddleLeft.offsetHeight;

    let ai_ballPosition = { x: 392.5, y: 192.5 };
    let ai_ballSpeed = { x: 10, y: 10 };
    let ai_ballSpeedIncrement = 0.3;
    const ai_maxBallSpeed = 15;

    let ai_scoreLeft = 0;
    let ai_scoreRight = 0;
    let ai_collisionCount = 0;

    const ai_keysPressed = {};
    let ai_gameRunning = false;

    document.addEventListener('keydown', (event) => {
        ai_keysPressed[event.key] = true;
        if (event.key === ' ' && !ai_gameRunning) {
            ai_restartGame();
        }
    });

    document.addEventListener('keyup', (event) => {
        ai_keysPressed[event.key] = false;
    });

    function ai_restartGame() {
        ai_scoreLeft = 0;
        ai_scoreRight = 0;
        ai_collisionCount = 0;
        ai_updateScore();
        ai_startGame();
    }

    function ai_startGame() {
        ai_startMessage.style.display = 'none';
        ai_ball.style.display = 'block';
        ai_resetBall();
        ai_gameRunning = true;
        ai_gameLoop();
        setInterval(ai_updateAI, 1000);
    }

    function ai_resetBall() {
        ai_ballPosition = { x: 392.5, y: 192.5 };
        ai_ballSpeed.x = Math.random() < 0.5 ? 5 : -5;
        ai_ballSpeed.y = Math.random() < 0.5 ? 5 : -5;
    }

    function ai_movePaddles() {
        if (ai_keysPressed['w'] && ai_paddleLeftY > 0) {
            ai_paddleLeftY -= ai_paddleSpeed;
        }
        if (ai_keysPressed['s'] && ai_paddleLeftY < ai_canvas.offsetHeight - ai_paddleHeight) {
            ai_paddleLeftY += ai_paddleSpeed;
        }

        if (ai_keysPressed['ArrowUp'] && ai_paddleRightY > 0) {
            ai_paddleRightY -= ai_paddleSpeed;
        }
        if (ai_keysPressed['ArrowDown'] && ai_paddleRightY < ai_canvas.offsetHeight - ai_paddleHeight) {
            ai_paddleRightY += ai_paddleSpeed;
        }

        ai_paddleLeft.style.top = ai_paddleLeftY + 'px';
        ai_paddleRight.style.top = ai_paddleRightY + 'px';
    }

    function ai_simulateKeyPress(key) {
        ai_keysPressed[key] = true;
        setTimeout(() => (ai_keysPressed[key] = false), 100);
    }

    function ai_updateAI() {
        let ai_predictedBallY = ai_ballPosition.y + ai_ballSpeed.y * 
            (ai_canvas.offsetWidth - ai_ballPosition.x) / Math.abs(ai_ballSpeed.x);
        ai_predictedBallY = Math.max(0, Math.min(ai_canvas.offsetHeight - ai_paddleHeight, ai_predictedBallY));

        const ai_paddleCenter = ai_paddleRightY + ai_paddleHeight / 2;
        if (ai_paddleCenter < ai_predictedBallY) {
            ai_simulateKeyPress('ArrowDown');
        } else if (ai_paddleCenter > ai_predictedBallY) {
            ai_simulateKeyPress('ArrowUp');
        }
    }

    function ai_moveBall() {
        ai_ballPosition.x += ai_ballSpeed.x;
        ai_ballPosition.y += ai_ballSpeed.y;
    
        if (ai_ballPosition.y <= 0 || ai_ballPosition.y >= ai_canvas.offsetHeight - ai_ball.offsetHeight) {
            ai_ballSpeed.y = -ai_ballSpeed.y;
        }
    
        let ai_ballHit = false;
    
        if (
            ai_ballPosition.x <= ai_paddleLeft.offsetLeft + ai_paddleLeft.offsetWidth &&
            ai_ballPosition.y + ai_ball.offsetHeight >= ai_paddleLeftY &&
            ai_ballPosition.y <= ai_paddleLeftY + ai_paddleHeight
        ) {
            ai_ballSpeed.x = Math.abs(ai_ballSpeed.x);
            ai_ballPosition.x = ai_paddleLeft.offsetLeft + ai_paddleLeft.offsetWidth;
            ai_ballHit = true;
        }
    
        if (
            ai_ballPosition.x + ai_ball.offsetWidth >= ai_paddleRight.offsetLeft &&
            ai_ballPosition.y + ai_ball.offsetHeight >= ai_paddleRightY &&
            ai_ballPosition.y <= ai_paddleRightY + ai_paddleHeight
        ) {
            ai_ballSpeed.x = -Math.abs(ai_ballSpeed.x);
            ai_ballPosition.x = ai_paddleRight.offsetLeft - ai_ball.offsetWidth;
            ai_ballHit = true;
        }
    
        if (ai_ballHit) {
            const randomAngle = (Math.random() - 0.5) * Math.PI / 12;
            const speed = Math.hypot(ai_ballSpeed.x, ai_ballSpeed.y);
    
            const angle = Math.atan2(ai_ballSpeed.y, ai_ballSpeed.x) + randomAngle;
            ai_ballSpeed.x = Math.cos(angle) * speed;
            ai_ballSpeed.y = Math.sin(angle) * speed;
    
            ai_collisionCount++;
            if (ai_collisionCount % 5 === 0) {
                ai_ballSpeed.x += ai_ballSpeed.x > 0 ? ai_ballSpeedIncrement : -ai_ballSpeedIncrement;
                ai_ballSpeed.y += ai_ballSpeed.y > 0 ? ai_ballSpeedIncrement : -ai_ballSpeedIncrement;
            }
        }
    
        ai_ballSpeed.x = Math.max(-ai_maxBallSpeed, Math.min(ai_maxBallSpeed, ai_ballSpeed.x));
        ai_ballSpeed.y = Math.max(-ai_maxBallSpeed, Math.min(ai_maxBallSpeed, ai_ballSpeed.y));
    
        if (ai_ballPosition.x < 0) {
            ai_scoreRight++;
            ai_resetBall();
        } else if (ai_ballPosition.x > ai_canvas.offsetWidth) {
            ai_scoreLeft++;
            ai_resetBall();
        }
    
        ai_ball.style.left = ai_ballPosition.x + 'px';
        ai_ball.style.top = ai_ballPosition.y + 'px';
    
        ai_updateScore();
    }
    

    function ai_updateScore() {
        ai_scoreDisplay.textContent = `${ai_scoreLeft} : ${ai_scoreRight}`;
        if (ai_scoreLeft === 5 || ai_scoreRight === 5) {
            ai_endGame();
        }
    }

    function ai_endGame() {
        ai_gameRunning = false;
        ai_startMessage.style.display = 'block';
        ai_startMessage.textContent = 'Game Over! Press Space to Restart';
        ai_ball.style.display = 'none';
    }

    function ai_gameLoop() {
        if (ai_gameRunning) {
            ai_movePaddles();
            ai_moveBall();
            requestAnimationFrame(ai_gameLoop);
        }
    }
}
