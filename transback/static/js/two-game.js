{
    const two_canvas = document.getElementById('two_pongCanvas');
    const two_paddleLeft = document.getElementById('two_paddleLeft');
    const two_paddleRight = document.getElementById('two_paddleRight');
    const two_ball = document.getElementById('two_ball');
    const two_scoreDisplay = document.getElementById('two_score');
    const two_startMessage = document.getElementById('two_startMessage');

    let two_paddleLeftY = 160;
    let two_paddleRightY = 160;
    const two_paddleSpeed = 6;
    const two_paddleHeight = two_paddleLeft.offsetHeight;

    let two_ballPosition = { x: 392.5, y: 192.5 };
    let two_ballSpeed = { x: 5, y: 5 };
    let two_ballSpeedIncrement = 0.2;
    const two_maxBallSpeed = 12;

    let two_scoreLeft = 0;
    let two_scoreRight = 0;
    let two_collisionCount = 0;

    const two_keysPressed = {};
    let two_gameRunning = false;

    document.addEventListener('keydown', (event) => {
        two_keysPressed[event.key] = true;
        if (event.key === ' ' && !two_gameRunning) {
            two_restartGame();
        }
    });

    document.addEventListener('keyup', (event) => {
        two_keysPressed[event.key] = false;
    });

    function two_restartGame() {
        two_scoreLeft = 0;
        two_scoreRight = 0;
        two_collisionCount = 0;
        two_updateScore();
        two_startGame();
    }

    function two_startGame() {
        two_startMessage.style.display = 'none';
        two_ball.style.display = 'block';
        two_resetBall();
        two_gameRunning = true;
        two_gameLoop();
    }

    function two_resetBall() {
        two_ballPosition = { x: 392.5, y: 192.5 };
        two_ballSpeed.x = Math.random() < 0.5 ? 5 : -5;
        two_ballSpeed.y = Math.random() < 0.5 ? 5 : -5;
    }

    function two_movePaddles() {
        if (two_keysPressed['w'] && two_paddleLeftY > 0) {
            two_paddleLeftY -= two_paddleSpeed;
        }
        if (two_keysPressed['s'] && two_paddleLeftY < two_canvas.offsetHeight - two_paddleHeight) {
            two_paddleLeftY += two_paddleSpeed;
        }

        if (two_keysPressed['ArrowUp'] && two_paddleRightY > 0) {
            two_paddleRightY -= two_paddleSpeed;
        }
        if (two_keysPressed['ArrowDown'] && two_paddleRightY < two_canvas.offsetHeight - two_paddleHeight) {
            two_paddleRightY += two_paddleSpeed;
        }

        two_paddleLeft.style.top = two_paddleLeftY + 'px';
        two_paddleRight.style.top = two_paddleRightY + 'px';
    }

    function two_moveBall() {
        two_ballPosition.x += two_ballSpeed.x;
        two_ballPosition.y += two_ballSpeed.y;

        if (two_ballPosition.y <= 0 || two_ballPosition.y >= two_canvas.offsetHeight - two_ball.offsetHeight) {
            two_ballSpeed.y = -two_ballSpeed.y;
        }

        let two_ballHit = false;

        if (
            two_ballPosition.x <= two_paddleLeft.offsetLeft + two_paddleLeft.offsetWidth &&
            two_ballPosition.y + two_ball.offsetHeight >= two_paddleLeftY &&
            two_ballPosition.y <= two_paddleLeftY + two_paddleHeight
        ) {
            two_ballSpeed.x = -two_ballSpeed.x;
            two_ballPosition.x = two_paddleLeft.offsetLeft + two_paddleLeft.offsetWidth;
            two_ballHit = true;
        }

        if (
            two_ballPosition.x + two_ball.offsetWidth >= two_paddleRight.offsetLeft &&
            two_ballPosition.y + two_ball.offsetHeight >= two_paddleRightY &&
            two_ballPosition.y <= two_paddleRightY + two_paddleHeight
        ) {
            two_ballSpeed.x = -two_ballSpeed.x;
            two_ballPosition.x = two_paddleRight.offsetLeft - two_ball.offsetWidth;
            two_ballHit = true;
        }

        if (two_ballHit) {
            two_collisionCount++;
            if (two_collisionCount % 5 === 0) {
                two_ballSpeed.x += two_ballSpeed.x > 0 ? two_ballSpeedIncrement : -two_ballSpeedIncrement;
                two_ballSpeed.y += two_ballSpeed.y > 0 ? two_ballSpeedIncrement : -two_ballSpeedIncrement;
            }
        }

        two_ballSpeed.x = Math.max(-two_maxBallSpeed, Math.min(two_maxBallSpeed, two_ballSpeed.x));
        two_ballSpeed.y = Math.max(-two_maxBallSpeed, Math.min(two_maxBallSpeed, two_ballSpeed.y));

        if (two_ballPosition.x < 0) {
            two_scoreRight++;
            two_resetBall();
        } else if (two_ballPosition.x > two_canvas.offsetWidth) {
            two_scoreLeft++;
            two_resetBall();
        }

        two_ball.style.left = two_ballPosition.x + 'px';
        two_ball.style.top = two_ballPosition.y + 'px';

        two_updateScore();
    }

    function two_updateScore() {
        two_scoreDisplay.textContent = `${two_scoreLeft} : ${two_scoreRight}`;
        if (two_scoreLeft === 5 || two_scoreRight === 5) {
            two_endGame();
        }
    }

    function two_endGame() {
        two_gameRunning = false;
        two_startMessage.style.display = 'block';
        two_startMessage.textContent = 'Game Over! Press Space to Restart';
        two_ball.style.display = 'none';
    }

    function two_gameLoop() {
        if (two_gameRunning) {
            two_movePaddles();
            two_moveBall();
            requestAnimationFrame(two_gameLoop);
        }
    }
}
