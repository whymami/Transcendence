{
    const canvas = document.getElementById('pongCanvas');
    const paddleLeft = document.getElementById('paddleLeft');
    const paddleRight = document.getElementById('paddleRight');
    const ball = document.getElementById('ball');
    const scoreDisplay = document.getElementById('score');
    const startMessage = document.getElementById('startMessage');
    const numPlayersInput = document.getElementById('numPlayers');
    const playerNamesDiv = document.getElementById('nameInputs');
    const tournamentSetup = document.getElementById('tournamentSetup');
    const playerNamesSection = document.getElementById('playerNames');
    const roundInfo = document.getElementById('roundInfo');
    const matchupList = document.getElementById('matchupList');
    const matchResult = document.getElementById('matchResult');
    let players = [];
    let matches = [];
    let currentMatchIndex = 0;
    let gameRunning = false;

    let scoreLeft = 0;
    let scoreRight = 0;
    let paddleLeftY = 160;
    let paddleRightY = 160;

    const paddleSpeed = 5;
    const paddleHeight = 80;
    const maxBallSpeed = 10;
    const ballSpeedIncrement = 1;

    let ballPosition = { x: 392.5, y: 192.5 };
    let ballSpeed = { x: 5, y: 5 };
    let collisionCount = 0;

    const keysPressed = {};

    window.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });
    function startTournament() {
        const numPlayers = parseInt(numPlayersInput.value);
        if (numPlayers === 4 || numPlayers === 8) {
            tournamentSetup.style.display = 'none';
            playerNamesSection.style.display = 'block';
            createPlayerInputs(numPlayers);
            showToast('info', 'Please enter the names of the players.');
        } else {
            showToast('warning', 'Please enter a valid number of players (4 or 8).');
        }
    }

    function createPlayerInputs(numPlayers) {
        playerNamesDiv.innerHTML = '';
        for (let i = 0; i < numPlayers; i++) {
            const input = document.createElement('input');
            input.placeholder = `Player ${i + 1}`;
            input.id = `player${i}`;
            playerNamesDiv.appendChild(input);
        }
    }

    function startGame() {
        players = [];
        document.querySelectorAll('#nameInputs input').forEach((input) => {
            const name = input.value.trim();
            if (name) players.push(name);
        });

        if (players.length === parseInt(numPlayersInput.value)) {
            playerNamesSection.style.display = 'none';
            roundInfo.style.display = 'block';
            matches = createMatches(players);
            startNextMatch();
        } else {
            showToast('error', 'Please enter all player names.');
        }
    }

    function createMatches(playerList) {
        const shuffledPlayers = playerList.sort(() => Math.random() - 0.5);
        const pairs = [];
        for (let i = 0; i < shuffledPlayers.length; i += 2) {
            pairs.push([shuffledPlayers[i], shuffledPlayers[i + 1]]);
        }
        return pairs;
    }

    function startNextMatch() {
        if (currentMatchIndex < matches.length) {
            const match = matches[currentMatchIndex];
            showMatchInfo(match);
            resetGame();
        } else {
            const winners = matches.map(([winner]) => winner);
            if (winners.length > 1) {
                currentMatchIndex = 0;
                matches = createMatches(winners);
                startNextMatch();
            } else {
                showWinner(winners[0]);
            }
        }
    }

    function showMatchInfo(match) {
        matchupList.innerHTML = `<div>Match: ${match[0]} vs ${match[1]}</div>`;
    }

    function resetGame() {
        resetBall();
        paddleLeftY = 160;
        paddleRightY = 160;
        scoreLeft = 0;
        scoreRight = 0;
        collisionCount = 0;

        paddleLeft.style.top = paddleLeftY + 'px';
        paddleRight.style.top = paddleRightY + 'px';

        updateScore();
        canvas.style.display = 'block';
        startMessage.style.display = 'block';
        gameRunning = false;
    }


    function updateScore() {
        scoreDisplay.textContent = `${scoreLeft} : ${scoreRight}`;
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

    function moveBall() {
        ballPosition.x += ballSpeed.x;
        ballPosition.y += ballSpeed.y;

        if (ballPosition.y <= 0 || ballPosition.y >= canvas.offsetHeight - ball.offsetHeight) {
            ballSpeed.y = -ballSpeed.y;
        }
        if (
            ballPosition.x <= paddleLeft.offsetLeft + paddleLeft.offsetWidth &&
            ballPosition.x + ball.offsetWidth >= paddleLeft.offsetLeft &&
            ballPosition.y + ball.offsetHeight >= paddleLeftY &&
            ballPosition.y <= paddleLeftY + paddleHeight
        ) {
            ballSpeed.x = Math.abs(ballSpeed.x);
        }

        if (
            ballPosition.x + ball.offsetWidth >= paddleRight.offsetLeft &&
            ballPosition.x <= paddleRight.offsetLeft + paddleRight.offsetWidth &&
            ballPosition.y + ball.offsetHeight >= paddleRightY &&
            ballPosition.y <= paddleRightY + paddleHeight
        ) {
            ballSpeed.x = -Math.abs(ballSpeed.x);
        }
        if (ballPosition.x < 0) {
            scoreRight++;
            checkGameEnd();
        } else if (ballPosition.x > canvas.offsetWidth) {
            scoreLeft++;
            checkGameEnd();
        }

        ball.style.left = ballPosition.x + 'px';
        ball.style.top = ballPosition.y + 'px';

        updateScore();
    }

    function checkGameEnd() {
        if (scoreLeft === 5 || scoreRight === 5) {
            endMatch();
        } else {
            resetBall();
        }
    }

    function resetBall() {
        ballPosition = { x: 392.5, y: 192.5 };
        ballSpeed = { x: 5, y: 5 };
    }

    function endMatch() {
        gameRunning = false;
        const currentMatch = matches[currentMatchIndex];
        const winner = scoreLeft > scoreRight ? currentMatch[0] : currentMatch[1];
        matches[currentMatchIndex] = [winner];
        currentMatchIndex++;
        showToast('success', `${winner} wins the match!`);
        startNextMatch();
    }

    function showWinner(winner) {
        showToast('success', `The tournament winner is ${winner}!`);
    }

    function gameLoop() {
        if (gameRunning) {
            movePaddles();
            moveBall();
            requestAnimationFrame(gameLoop);
        }
    }
    document.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        if (e.key === ' ' && !gameRunning) {
            restartGame();
        }
    });

    document.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });
    function restartTournament() {
        gameRunning = false;
        scoreLeft = 0;
        scoreRight = 0;
        collisionCount = 0;
        currentMatchIndex = 0;
        matches = [];
        players = [];
        showToast('info', "Tournament has been restarted. Reload the page or re-enter player names to start fresh.");
        location.reload();
    }

    function restartGame() {
        resetGame();
        startMessage.style.display = 'none';
        gameRunning = true;
        gameLoop();
    }
}