{
    let socket = null;

    function connectToGameRoom(room_id) {
        const token = getCookie("access_token"); // Token'ı burada al
        console.log(room_id);
        socket = new WebSocket(`wss://${window.location.hostname}/ws/game/${room_id}/?token=${token}`);
        initGame();
    }

    function startMatchmaking() {
        const token = getCookie("access_token");
        if (!token) {
            console.error(
                "Access token not found in cookies. Make sure you are authenticated."
            );
            alert("Authentication token is missing. Please log in.");
            return;
        }

        // Connect to the matchmaking WebSocket
        const matchmakingSocket = new WebSocket(
            `wss://${window.location.hostname}/ws/matchmaking/?token=${token}`
        );

        matchmakingSocket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            console.log(event);
            if (data.room_id) {
                connectToGameRoom(data.room_id);
            }
            console.log("Received room id");
        };

        // Send a request to join a game
        matchmakingSocket.onopen = () => {
            matchmakingSocket.send(JSON.stringify({ action: "join_game" }));
            console.log("Sent join game request");
        };

    }

    startMatchmaking();
    function initGame() {
        const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");

        // Call startMatchmaking to initiate the process
        // Retrieve the token from cookies
        const token = getCookie("access_token");
        if (!token) {
            console.error("Access token not found in cookies. Make sure you are authenticated.");
            alert("Authentication token is missing. Please log in.");
        }

        // WebSocket connection to the game server

        let gameState = null;
        let paddleMovement = 0; // Movement control variable
        const paddleSpeed = 4; // Adjustable paddle speed
        const paddleHeight = 0.2; // Proportional paddle height
        const paddleWidth = 13; // Fixed paddle width
        const maxPaddleSpeed = 4; // Max speed limit for paddles

        let fps = 60; // Target FPS
        let interval = 1000 / fps; // Each frame's duration (ms)
        let lastTime = 0;

        const scoreSound = new Audio('/static/assets/retro-video-game-coin-pickup-38299.mp3');
        scoreSound.volume = 0.05;


        const victorySound = new Audio('/static/assets/success-fanfare-trumpets-6185.mp3'); // Replace with your file path
        victorySound.volume = 0.2; // Optional: Set the volume of the victory sound


        // Flashing effect variables
        let flashState = { player1: false, player2: false }; // Track if score should be flashing
        let flashTimer = { player1: 0, player2: 0 }; // Timer for the flash effect
        let flashDuration = 200; // Duration of the flashing effect in ms
        let flashInterval = 500; // Interval for alternating the color in the flash effect

        // Ensure the canvas resizes dynamically
        function resizeCanvas() {
            canvas.width = window.innerWidth * 0.8; // Adjust width
            canvas.height = window.innerHeight * 0.8; // Adjust height
        }
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // WebSocket connection handling
        socket.onopen = () => {
            console.log("WebSocket connection established.");
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed.");
        };

        // WebSocket onmessage handling
        let previousScore = { player1: 0, player2: 0 }; // Track previous scores

        // WebSocket onmessage handling
        socket.onmessage = function (event) {
            const data = JSON.parse(event.data);

            if (!data || !data.ball || !data.paddle1 || !data.paddle2) {
                console.error("Invalid game state received:", data);
                return;
            }

            gameState = data;

            // Update scores and trigger flashing effect when score changes
            if (data.score) {
                if (data.score.player1 !== previousScore.player1) {
                    previousScore.player1 = data.score.player1;
                    flashState.player1 = true;
                    flashTimer.player1 = Date.now(); // Reset the flash timer
                    scoreSound.play(); // Play score sound
                } else if (data.score.player2 !== previousScore.player2) {
                    previousScore.player2 = data.score.player2;
                    flashState.player2 = true;
                    flashTimer.player2 = Date.now(); // Reset the flash timer
                    scoreSound.play(); // Play score sound
                }

                // Check for winner (assuming the score threshold is 10)
                if (data.score.player1 >= 10) {
                    showWinner(data.player1_name || "Player 1");
                    return; // Stop further game updates
                } else if (data.score.player2 >= 10) {
                    showWinner(data.player2_name || "Player 2");
                    return; // Stop further game updates
                }
            }
        };

        // Prevent default browser behavior for ArrowUp and ArrowDown keys
        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();  // Prevent default scroll behavior
            }
        });

        // Existing keydown and keyup event listeners for W and S keys
        document.addEventListener("keydown", (e) => {
            if (e.key === "w" || e.key === "W") paddleMovement = -paddleSpeed;  // Move paddle up
            else if (e.key === "s" || e.key === "S") paddleMovement = paddleSpeed; // Move paddle down
        });

        document.addEventListener("keyup", (e) => {
            if (e.key === "w" || e.key === "W" || e.key === "s" || e.key === "S") {
                paddleMovement = 0; // Stop movement when key is released
            }
        });

        function updatePaddleMovement() {
            if (paddleMovement !== 0) {
                socket.send(JSON.stringify({ paddle_movement: paddleMovement }));
            }
            requestAnimationFrame(updatePaddleMovement);
        }

        // Draw the dashed center line
        function drawCenterLine() {
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.stroke();
        }

        // Ball trail effect
        const ballTrail = [];
        function drawBallTrail() {
            ballTrail.forEach((trail, index) => {
                ctx.globalAlpha = (1 - index / ballTrail.length) * 0.7; // Gradual fading
                ctx.beginPath();
                ctx.arc(trail.x, trail.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = "white";
                ctx.fill();
            });
            ctx.globalAlpha = 1; // Reset transparency
        }

        // Add new position to ball trail
        function updateBallTrail(ball) {
            ballTrail.unshift({ x: ball.x * canvas.width / 100, y: ball.y * canvas.height / 100 });
            if (ballTrail.length > 15) ballTrail.pop(); // Limit trail length to make it look smoother
        }

        // Function to draw the scores with flashing effect
        function drawScores(state) {
            const now = Date.now();

            // Define the two colors for flashing: purple and blue
            const flashColor1 = "#6b46c1"; // Purple color
            const flashColor2 = "#4299e1"; // Blue color

            // Draw Player 1 score
            ctx.fillStyle = flashState.player1 && (now - flashTimer.player1) < flashDuration * 2 ?
                (Math.floor((now - flashTimer.player1) / flashInterval) % 2 === 0 ? flashColor1 : flashColor2) :
                "white";
            ctx.font = `${canvas.height * 0.04}px Arial`;
            ctx.fillText(`${state.player1_name || "Player 1"}: ${state.score.player1}`, 20, 30);

            // Draw Player 2 score
            ctx.fillStyle = flashState.player2 && (now - flashTimer.player2) < flashDuration * 2 ?
                (Math.floor((now - flashTimer.player2) / flashInterval) % 2 === 0 ? flashColor1 : flashColor2) :
                "white";
            ctx.fillText(`${state.player2_name || "Player 2"}: ${state.score.player2}`, canvas.width - 200, 30);

            // Reset flash state after duration
            if (now - flashTimer.player1 > flashDuration * 2) {
                flashState.player1 = false;
            }
            if (now - flashTimer.player2 > flashDuration * 2) {
                flashState.player2 = false;
            }
        }

        // Draw the entire game state
        function drawGame(state) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw center line
            drawCenterLine();

            // Draw ball with smooth motion
            updateBallTrail(state.ball);
            drawBallTrail();
            ctx.beginPath();
            ctx.arc(state.ball.x * canvas.width / 100, state.ball.y * canvas.height / 100, 10, 0, Math.PI * 2);
            ctx.fillStyle = "white";
            ctx.fill();

            // Draw paddles
            const paddleHeightPx = canvas.height * paddleHeight;
            const player1Y = Math.max(0, Math.min(state.paddle1.y * canvas.height / 100 - paddleHeightPx / 2, canvas.height - paddleHeightPx));
            const player2Y = Math.max(0, Math.min(state.paddle2.y * canvas.height / 100 - paddleHeightPx / 2, canvas.height - paddleHeightPx));

            ctx.fillStyle = "white";
            ctx.fillRect(10, player1Y, paddleWidth, paddleHeightPx);
            ctx.fillRect(canvas.width - paddleWidth - 10, player2Y, paddleWidth, paddleHeightPx);

            // Draw scores with flashing effect
            drawScores(state);
        }

        // Function to show winner
        let gameOver = false;  // New flag to track if the game is over

        // Function to show winner
        function showWinner(winner) {
            if (gameOver) return;  // Avoid showing winner screen more than once
            socket.close();
            gameOver = true;  // Set game over flag to true

            // Stop background music before playing victory sound

            // Play victory sound immediately
            victorySound.play();

            // Draw winner message immediately
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "black";
            ctx.globalAlpha = 0.8;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;

            // Countdown before disconnecting
            let countdown = 5;
            const countdownInterval = setInterval(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "black";
                ctx.globalAlpha = 0.8;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 1;

                ctx.fillStyle = "white";
                ctx.font = `${canvas.height * 0.06}px Arial`;
                ctx.textAlign = "center";
                ctx.fillText(`${winner} wins! Returning to the home screen in ${countdown}s`, canvas.width / 2, canvas.height / 2);

                countdown--;

                if (countdown < 0) {
                    clearInterval(countdownInterval);  // Stop countdown

                    // Close WebSocket and redirect after countdown
                    socket.close();
                    history.pushState({}, "", "/");
                    urlLocationHandler();
                }
            }, 1000);  // Update every second
        }


        // Main game loop remains the same
        function gameLoop(currentTime) {
            const deltaTime = currentTime - lastTime;

            if (deltaTime >= interval) {
                if (gameState) {
                    drawGame(gameState);
                } else {
                    // Waiting for game state
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "white";
                    ctx.font = `${canvas.height * 0.04}px Arial`;
                    ctx.fillText("Waiting for game state...", canvas.width / 3, canvas.height / 2);
                }
                lastTime = currentTime;
            }

            // Ensure the game loop stops if the game is over
            if (!gameOver) {
                requestAnimationFrame(gameLoop);  // Keep the game loop running if the game is not over
            }
        }

        // Start paddle movement updates and game loop
        updatePaddleMovement();
        requestAnimationFrame(gameLoop);
    }
}