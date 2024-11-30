{
    const canvas = document.getElementById('pongCanvas');
    const paddleLeft = document.getElementById('paddleLeft');
    const paddleRight = document.getElementById('paddleRight');
    const ball = document.getElementById('ball');
    const scoreDisplay = document.getElementById('score');
    const startMessage = document.getElementById('startMessage');

    let paddleLeftY = 160;
    let paddleRightY = 160;
    const paddleSpeed = 6;
    const paddleHeight = paddleLeft.offsetHeight;

    let ballPosition = { x: 392.5, y: 192.5 };
    let ballSpeed = { x: 10, y: 10 };
    let ballSpeedIncrement = 0.3;
    const maxBallSpeed = 15;

    let scoreLeft = 0;
    let scoreRight = 0;
    let collisionCount = 0;

    const keysPressed = {};
    let gameRunning = false;

    document.addEventListener('keydown', (event) => {
        keysPressed[event.key] = true;
        if (event.key === ' ' && !gameRunning) {
            restartGame();
        }
    });

    document.addEventListener('keyup', (event) => {
        keysPressed[event.key] = false;
    });

    function restartGame() {
        scoreLeft = 0;
        scoreRight = 0;
        collisionCount = 0;
        updateScore();
        startGame();
    }

    function startGame() {
        startMessage.style.display = 'none';
        ball.style.display = 'block';
        resetBall();
        gameRunning = true;
        gameLoop();
    }

    function resetBall() {
        ballPosition = { x: 392.5, y: 192.5 };
        ballSpeed.x = Math.random() < 0.5 ? 5 : -5;
        ballSpeed.y = Math.random() < 0.5 ? 5 : -5;
    }

    function movePaddles() {
        if (keysPressed['w'] && paddleLeftY > 0) {
            paddleLeftY -= paddleSpeed;
        }
        if (keysPressed['s'] && paddleLeftY < canvas.offsetHeight - paddleHeight) {
            paddleLeftY += paddleSpeed;
        }

        if (keysPressed['ArrowUp'] && paddleRightY > 0) {
            paddleRightY -= paddleSpeed;
        }
        if (keysPressed['ArrowDown'] && paddleRightY < canvas.offsetHeight - paddleHeight) {
            paddleRightY += paddleSpeed;
        }

        paddleLeft.style.top = paddleLeftY + 'px';
        paddleRight.style.top = paddleRightY + 'px';
    }

    function updateAI() {
        let predictedBallY = ballPosition.y + ballSpeed.y * (canvas.offsetWidth - ballPosition.x) / Math.abs(ballSpeed.x);
        predictedBallY = Math.max(0, Math.min(canvas.offsetHeight - paddleHeight, predictedBallY));
        const deadZone = 10;
        const paddleCenter = paddleRightY + paddleHeight / 2;

        if (Math.abs(paddleCenter - predictedBallY) > deadZone) {
            if (paddleCenter < predictedBallY) {
                paddleRightY += paddleSpeed;
            } else {
                paddleRightY -= paddleSpeed;
            }
        }

        paddleRightY = Math.max(0, Math.min(canvas.offsetHeight - paddleHeight, paddleRightY));
        paddleRight.style.top = paddleRightY + 'px';
    }

    function moveBall() {
        ballPosition.x += ballSpeed.x;
        ballPosition.y += ballSpeed.y;

        if (ballPosition.y <= 0 || ballPosition.y >= canvas.offsetHeight - ball.offsetHeight) {
            ballSpeed.y = -ballSpeed.y;
        }

        let ballHit = false;

        if (
            ballPosition.x <= paddleLeft.offsetLeft + paddleLeft.offsetWidth &&
            ballPosition.y + ball.offsetHeight >= paddleLeftY &&
            ballPosition.y <= paddleLeftY + paddleHeight
        ) {
            ballSpeed.x = -ballSpeed.x;
            ballPosition.x = paddleLeft.offsetLeft + paddleLeft.offsetWidth;
            ballHit = true;
        }

        if (
            ballPosition.x + ball.offsetWidth >= paddleRight.offsetLeft &&
            ballPosition.y + ball.offsetHeight >= paddleRightY &&
            ballPosition.y <= paddleRightY + paddleHeight
        ) {
            ballSpeed.x = -ballSpeed.x;
            ballPosition.x = paddleRight.offsetLeft - ball.offsetWidth;
            ballHit = true;
        }

        if (ballHit) {
            collisionCount++;
            if (collisionCount % 5 === 0) {
                ballSpeed.x += ballSpeed.x > 0 ? ballSpeedIncrement : -ballSpeedIncrement;
                ballSpeed.y += ballSpeed.y > 0 ? ballSpeedIncrement : -ballSpeedIncrement;
            }
        }

        ballSpeed.x = Math.max(-maxBallSpeed, Math.min(maxBallSpeed, ballSpeed.x));
        ballSpeed.y = Math.max(-maxBallSpeed, Math.min(maxBallSpeed, ballSpeed.y));

        if (ballPosition.x < 0) {
            scoreRight++;
            resetBall();
        } else if (ballPosition.x > canvas.offsetWidth) {
            scoreLeft++;
            resetBall();
        }

        ball.style.left = ballPosition.x + 'px';
        ball.style.top = ballPosition.y + 'px';

        updateScore();
    }

    function updateScore() {
        scoreDisplay.textContent = `${scoreLeft} : ${scoreRight}`;
        if (scoreLeft === 5 || scoreRight === 5) {
            endGame();
        }
    }

    function endGame() {
        gameRunning = false;
        startMessage.style.display = 'block';
        startMessage.textContent = 'Game Over! Press Space to Restart';
        ball.style.display = 'none';
    }

    function gameLoop() {
        if (gameRunning) {
            movePaddles();
            updateAI();
            moveBall();
            requestAnimationFrame(gameLoop);
        }
    }
}
