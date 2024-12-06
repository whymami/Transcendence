{
    const tournament_canvas = document.getElementById('tournament_pongCanvas');
    const tournament_paddleLeft = document.getElementById('tournament_paddleLeft');
    const tournament_paddleRight = document.getElementById('tournament_paddleRight');
    const tournament_ball = document.getElementById('tournament_ball');
    const tournament_scoreDisplay = document.getElementById('tournament_score');
    const tournament_startMessage = document.getElementById('tournament_startMessage');
    let tournament_numPlayersInput = 0;
    const tournament_playerNamesDiv = document.getElementById('tournament_nameInputs');
    const tournament_tournamentSetup = document.getElementById('tournament_tournamentSetup');
    const tournament_playerNamesSection = document.getElementById('tournament_playerNames');
    const tournament_roundInfo = document.getElementById('tournament_roundInfo');
    const tournament_matchupList = document.getElementById('tournament_matchupList');
    const tournament_matchResult = document.getElementById('tournament_matchResult');

    let tournament_players = [];
    let tournament_matches = [];
    let tournament_currentMatchIndex = 0;
    let tournament_gameRunning = false;

    let tournament_scoreLeft = 0;
    let tournament_scoreRight = 0;
    let tournament_paddleLeftY = 160;
    let tournament_paddleRightY = 160;

    const tournament_paddleSpeed = 5;
    const tournament_paddleHeight = 80;
    const tournament_maxBallSpeed = 10;
    const tournament_ballSpeedIncrement = 1;

    let tournament_ballPosition = { x: 392.5, y: 192.5 };
    let tournament_ballSpeed = { x: 5, y: 5 };
    let tournament_collisionCount = 0;

    const tournament_keysPressed = {};

    window.addEventListener('keydown', (e) => {
        tournament_keysPressed[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
        tournament_keysPressed[e.key] = false;
    });

    function tournament_startTournament(numPlayers) {
        if (numPlayers === 4 || numPlayers === 8) {
            tournament_numPlayersInput = numPlayers;
            tournament_tournamentSetup.style.display = 'none';
            tournament_playerNamesSection.style.display = 'block';
            tournament_createPlayerInputs(numPlayers);
            showToast('info', gettext('Please enter player names.'));
        } else {
            showToast('warning', gettext('Please enter a valid number of players (4 or 8).'));
        }
    }

    function tournament_createPlayerInputs(numPlayers) {
        tournament_playerNamesDiv.innerHTML = '';
        for (let i = 0; i < numPlayers; i++) {
            const input = document.createElement('input');
            input.placeholder = gettext('Player') + ` ${i + 1}`;
            input.id = `player${i}`;
            tournament_playerNamesDiv.appendChild(input);
        }
    }

    function tournament_startGame() {
        tournament_players = [];
        const usedNames = new Set();
        let duplicateName = false;

        document.querySelectorAll('#tournament_nameInputs input').forEach((input) => {
            const name = input.value.trim();
            if (name) {
                if (usedNames.has(name)) {
                    duplicateName = true;
                    return;
                }
                usedNames.add(name);
                tournament_players.push(name);
            }
        });

        if (duplicateName) {
            showToast('error', gettext('Each player name must be unique.'));
            return;
        }

        if (tournament_players.length === tournament_numPlayersInput) {
            tournament_playerNamesSection.style.display = 'none';
            tournament_roundInfo.style.display = 'flex';
            tournament_matches = tournament_createMatches(tournament_players);
            tournament_startNextMatch();
        } else {
            showToast('error', gettext('Please enter all player names.'));
        }
    }

    function tournament_createMatches(playerList) {
        const shuffledPlayers = playerList.sort(() => Math.random() - 0.5);
        const pairs = [];
        for (let i = 0; i < shuffledPlayers.length; i += 2) {
            pairs.push([shuffledPlayers[i], shuffledPlayers[i + 1]]);
        }
        return pairs;
    }

    function tournament_startNextMatch() {
        if (tournament_currentMatchIndex < tournament_matches.length) {
            const match = tournament_matches[tournament_currentMatchIndex];
            tournament_showMatchInfo(match);
            tournament_resetGame();
        } else {
            const winners = tournament_matches.map(([winner]) => winner);
            if (winners.length > 1) {
                tournament_currentMatchIndex = 0;
                tournament_matches = tournament_createMatches(winners);
                tournament_startNextMatch();
            } else {
                tournament_showWinner(winners[0]);
            }
        }
    }

    function tournament_showMatchInfo(match) {
        tournament_matchupList.innerHTML = `<div>${gettext('Match')}: ${match[0]} vs ${match[1]}</div>`;
    }

    function tournament_resetGame() {
        tournament_resetBall();
        tournament_paddleLeftY = 160;
        tournament_paddleRightY = 160;
        tournament_scoreLeft = 0;
        tournament_scoreRight = 0;
        tournament_collisionCount = 0;

        tournament_paddleLeft.style.top = tournament_paddleLeftY + 'px';
        tournament_paddleRight.style.top = tournament_paddleRightY + 'px';

        tournament_updateScore();
        tournament_canvas.style.display = 'block';
        tournament_startMessage.style.display = 'block';
        tournament_gameRunning = false;
    }

    function tournament_updateScore() {
        tournament_scoreDisplay.textContent = `${tournament_scoreLeft} : ${tournament_scoreRight}`;
    }

    function tournament_movePaddles() {
        if (tournament_keysPressed['w'] && tournament_paddleLeftY > 0) {
            tournament_paddleLeftY -= tournament_paddleSpeed;
        }
        if (tournament_keysPressed['s'] && tournament_paddleLeftY < tournament_canvas.offsetHeight - tournament_paddleHeight) {
            tournament_paddleLeftY += tournament_paddleSpeed;
        }

        if (tournament_keysPressed['ArrowUp'] && tournament_paddleRightY > 0) {
            tournament_paddleRightY -= tournament_paddleSpeed;
        }
        if (tournament_keysPressed['ArrowDown'] && tournament_paddleRightY < tournament_canvas.offsetHeight - tournament_paddleHeight) {
            tournament_paddleRightY += tournament_paddleSpeed;
        }

        tournament_paddleLeft.style.top = tournament_paddleLeftY + 'px';
        tournament_paddleRight.style.top = tournament_paddleRightY + 'px';
    }

    function tournament_moveBall() {
        tournament_ballPosition.x += tournament_ballSpeed.x;
        tournament_ballPosition.y += tournament_ballSpeed.y;

        if (tournament_ballPosition.y <= 0 || tournament_ballPosition.y >= tournament_canvas.offsetHeight - tournament_ball.offsetHeight) {
            tournament_ballSpeed.y = -tournament_ballSpeed.y;
        }
        if (
            tournament_ballPosition.x <= tournament_paddleLeft.offsetLeft + tournament_paddleLeft.offsetWidth &&
            tournament_ballPosition.x + tournament_ball.offsetWidth >= tournament_paddleLeft.offsetLeft &&
            tournament_ballPosition.y + tournament_ball.offsetHeight >= tournament_paddleLeftY &&
            tournament_ballPosition.y <= tournament_paddleLeftY + tournament_paddleHeight
        ) {
            tournament_ballSpeed.x = Math.abs(tournament_ballSpeed.x);
        }

        if (
            tournament_ballPosition.x + tournament_ball.offsetWidth >= tournament_paddleRight.offsetLeft &&
            tournament_ballPosition.x <= tournament_paddleRight.offsetLeft + tournament_paddleRight.offsetWidth &&
            tournament_ballPosition.y + tournament_ball.offsetHeight >= tournament_paddleRightY &&
            tournament_ballPosition.y <= tournament_paddleRightY + tournament_paddleHeight
        ) {
            tournament_ballSpeed.x = -Math.abs(tournament_ballSpeed.x);
        }
        if (tournament_ballPosition.x < 0) {
            tournament_scoreRight++;
            tournament_checkGameEnd();
        } else if (tournament_ballPosition.x > tournament_canvas.offsetWidth) {
            tournament_scoreLeft++;
            tournament_checkGameEnd();
        }

        tournament_ball.style.left = tournament_ballPosition.x + 'px';
        tournament_ball.style.top = tournament_ballPosition.y + 'px';

        tournament_updateScore();
    }

    function tournament_checkGameEnd() {
        if (tournament_scoreLeft === 5 || tournament_scoreRight === 5) {
            tournament_endMatch();
        } else {
            tournament_resetBall();
        }
    }

    function tournament_resetBall() {
        tournament_ballPosition = { x: 392.5, y: 192.5 };
        tournament_ballSpeed = { x: 5, y: 5 };
    }

    function tournament_endMatch() {
        tournament_gameRunning = false;
        const currentMatch = tournament_matches[tournament_currentMatchIndex];
        const winner = tournament_scoreLeft > tournament_scoreRight ? currentMatch[0] : currentMatch[1];
        tournament_matches[tournament_currentMatchIndex] = [winner];
        tournament_currentMatchIndex++;
        showToast('success', gettext(`${winner} won the match!`));
        tournament_startNextMatch();
    }

    function tournament_showWinner(winner) {
        showToast('success', gettext(`Tournament winner: ${winner}!`));
    }

    function tournament_gameLoop() {
        if (tournament_gameRunning) {
            tournament_movePaddles();
            tournament_moveBall();
            requestAnimationFrame(tournament_gameLoop);
        }
    }

    document.addEventListener('keydown', (e) => {
        tournament_keysPressed[e.key] = true;
        if (e.key === ' ' && !tournament_gameRunning) {
            tournament_restartGame();
        }
    });

    document.addEventListener('keyup', (e) => {
        tournament_keysPressed[e.key] = false;
    });

    function tournament_restartTournament() {
        tournament_gameRunning = false;
        tournament_scoreLeft = 0;
        tournament_scoreRight = 0;
        tournament_collisionCount = 0;
        tournament_currentMatchIndex = 0;
        tournament_matches = [];
        tournament_players = [];
        showToast('info', gettext("Tournament restarted. Refresh the page or re-enter player names to start a new tournament."));
        location.reload();
    }

    function tournament_restartGame() {
        tournament_resetGame();
        tournament_startMessage.style.display = 'none';
        tournament_gameRunning = true;
        tournament_gameLoop();
    }
}