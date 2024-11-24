const canvas = document.getElementById("gameCanvas");

const ctx = canvas.getContext("2d");

// const statusDiv = document.getElementById("status");

const token = getCookie("access_token");
const socket = new WebSocket("ws://127.0.0.1:8000/ws/game/game_room/?token=" + token);

let gameState = null;

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.status === "waiting" || data.status === "start" || data.status === "spectator") {
        // statusDiv.textContent = data.message;
    } else {
        gameState = data;
        if (gameState) {
            drawGame(gameState);
        }
    }
};

document.addEventListener("keydown", (e) => {
    let paddleMovement = 0;

    if (e.key === "ArrowUp") paddleMovement = -5;
    else if (e.key === "ArrowDown") paddleMovement = 5;

    socket.send(JSON.stringify({ paddle_movement: paddleMovement }));
});

function drawGame(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Canvas'ı her frame temizle
    // Draw ball
    ctx.beginPath();
    ctx.arc(state.ball.x * 8, state.ball.y * 4, 10, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    // Draw paddles as rectangles
    ctx.fillStyle = "white";
    ctx.fillRect(10, state.paddle1.y * 4 - 40, 13, 100); // Sol raket
    ctx.fillStyle = "white";
    ctx.fillRect(780, state.paddle2.y * 4 - 40, 13, 100); // Sağ raket
    // Draw score
    ctx.font = "20px Arial";
    ctx.fillText(`Player 1: ${state.score.player1}`, 20, 20);
    ctx.fillText(`Player 2: ${state.score.player2}`, 660, 20);
}

// Kullanıcı etkileşimi
function gameLoop() {
    if (gameState) {
        drawGame(gameState);
    }
    requestAnimationFrame(gameLoop);  // Her frame'de render
}

// Başlangıçta animasyon döngüsünü başlat
gameLoop();