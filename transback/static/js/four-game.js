{
    const canvas = document.getElementById("pong");
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const paddleWidth = 10,
        paddleHeight = 60;
    const ballSize = 10;
    let ballX = width / 2,
        ballY = height / 2;
    let ballDX = 3,
        ballDY = 3;
    let team1Score = 0;
    let team2Score = 0;
    let paddles = [
        {
            x: 10,
            y: height / 4 - paddleHeight / 2,
            dy: 0,
            upKey: 87,
            downKey: 83,
            section: "top",
        },
        {
            x: width - paddleWidth - 10,
            y: height / 4 - paddleHeight / 2,
            dy: 0,
            upKey: 38,
            downKey: 40,
            section: "top",
        },
        {
            x: 10,
            y: (height * 3) / 4 - paddleHeight / 2,
            dy: 0,
            upKey: 65,
            downKey: 90,
            section: "bottom",
        },
        {
            x: width - paddleWidth - 10,
            y: (height * 3) / 4 - paddleHeight / 2,
            dy: 0,
            upKey: 74,
            downKey: 75,
            section: "bottom",
        },
    ];
    let gameRunning = true;
    function drawPaddle(x, y) {
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.roundRect(x, y, paddleWidth, paddleHeight, 5);
        ctx.closePath();
        ctx.fill();
    }
    function drawBall(x, y) {
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(x, y, ballSize, 0, Math.PI * 2, false);
        ctx.fill();
    }
    function drawCenterLine() {
        ctx.fillStyle = "#FFF";
        const lineWidth = 5;
        const lineHeight = 10;
        const gapHeight = 10;
        const totalHeight = canvas.height;
        for (let i = 0; i < totalHeight; i += lineHeight + gapHeight) {
            ctx.fillRect(
                canvas.width / 2 - lineWidth / 2,
                i,
                lineWidth,
                lineHeight
            );
        }
    }
    let showHorizontalLine = false;
    function drawHorizontalLine() {
        if (showHorizontalLine) {
            ctx.fillStyle = "#FFF";
            const lineWidth = 20;
            const lineHeight = 5;
            const gapWidth = 15;
            const totalWidth = canvas.width;
            for (let i = 0; i < totalWidth; i += lineWidth + gapWidth) {
                ctx.fillRect(i, height / 2 - lineHeight / 2, lineWidth, lineHeight);
            }
        }
    }
    function drawNet() {
        ctx.fillStyle = "#FFF";
        const lineHeight = 10;
        const spaceHeight = 20;
        for (let i = 0; i < height; i += spaceHeight) {
            ctx.fillRect(width / 2 - 1, i, 2, lineHeight);
        }
    }
    function movePaddles() {
        paddles.forEach((paddle) => {
            if (paddle.section === "top") {
                if (paddle.dy > 0 && paddle.y < height / 2 - paddleHeight) {
                    paddle.y += paddle.dy;
                } else if (paddle.dy < 0 && paddle.y > 0) {
                    paddle.y += paddle.dy;
                }
            }
            if (paddle.section === "bottom") {
                if (paddle.dy > 0 && paddle.y < height - paddleHeight) {
                    paddle.y += paddle.dy;
                } else if (paddle.dy < 0 && paddle.y > height / 2) {
                    paddle.y += paddle.dy;
                }
            }
        });
    }
    
    function updateScore() {
        const team1ScoreElement = document.getElementById("team1-score");
        const team2ScoreElement = document.getElementById("team2-score");
        team1ScoreElement.innerText = team1Score;
        team2ScoreElement.innerText = team2Score;
    }

    function moveBall() {
        ballX += ballDX;
        ballY += ballDY;
        if (ballY <= 0 || ballY >= height) {
            ballDY *= -1.1;
        }
        paddles.forEach((paddle) => {
            if (
                ballX <= paddle.x + paddleWidth &&
                ballX >= paddle.x &&
                ballY >= paddle.y &&
                ballY <= paddle.y + paddleHeight
            ) {
                ballDX *= -1.1;
                if (Math.abs(ballDX) > 15) ballDX = 15 * Math.sign(ballDX);
                if (Math.abs(ballDY) > 15) ballDY = 15 * Math.sign(ballDY);
            }
        });
        if (ballX <= 0) {
            team2Score += 1;
            updateScore();
            resetBall();
        }
        if (ballX >= width) {
            team1Score += 1;
            updateScore();
            resetBall();
        }
        if (team1Score === 10 || team2Score === 10) {
            gameOver();
        }
    }
    function resetBall() {
        ballX = width / 2;
        ballY = height / 2;
        const angle = Math.random() * 90 - 45;
        const speed = 6 + Math.random() * 3;
        const radian = angle * Math.PI / 180;
        ballDX = Math.cos(radian) * speed * (Math.random() < 0.5 ? 1 : -1);
        ballDY = Math.sin(radian) * speed;
    }
    function gameOver() {
        let winner = team1Score === 10 ? "Team 1" : "Team 2";
        gameRunning = false;
        const messageDiv = document.createElement('div');
        messageDiv.id = 'startMessage';
        messageDiv.style.position = 'absolute';
        messageDiv.style.top = '50%';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translate(-50%, -50%)';
        messageDiv.style.color = 'white';
        messageDiv.style.fontSize = '24px';
        messageDiv.textContent = 'Press Space to Restart';
        canvas.parentElement.appendChild(messageDiv);
    }
    function resetGame() {
        team1Score = 0;
        team2Score = 0;
        updateScore();
        resetBall();
        gameRunning = true;
        const messageDiv = document.getElementById('startMessage');
        if (messageDiv) {
            messageDiv.remove();
        }
        gameLoop();
    }
    function gameLoop() {
        if (gameRunning) {
            ctx.clearRect(0, 0, width, height);
            drawBall(ballX, ballY);
            paddles.forEach((paddle) => drawPaddle(paddle.x, paddle.y));
            drawCenterLine();
            drawHorizontalLine();
            drawNet();
            movePaddles();
            moveBall();
            requestAnimationFrame(gameLoop);
        }
    }
    document.addEventListener("keydown", function (event) {
        if (event.code === 'Space' && !gameRunning) {
            resetGame();
        }
        if (event.keyCode === 38 || event.keyCode === 40) {
            event.preventDefault();
        }
        paddles.forEach((paddle) => {
            if (event.keyCode === paddle.upKey) {
                paddle.dy = -5;
            }
            if (event.keyCode === paddle.downKey) {
                paddle.dy = 5;
            }
        });
    });
    document.addEventListener("keyup", function (event) {
        paddles.forEach((paddle) => {
            if (
                event.keyCode === paddle.upKey ||
                event.keyCode === paddle.downKey
            ) {
                paddle.dy = 0;
            }
        });
    });
    gameLoop();
}