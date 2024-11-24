const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const token = getCookie("access_token");
const socket = new WebSocket("ws://127.0.0.1:8000/ws/game/game_room/?token=" + token);

let gameState = null;

// WebSocket bağlantı hatası kontrolü
socket.onopen = () => {
    console.log("WebSocket connection established.");
};

socket.onerror = (error) => {
    console.error("WebSocket error:", error);
};

socket.onclose = () => {
    console.log("WebSocket connection closed.");
};

socket.onmessage = function (event) {
    const data = JSON.parse(event.data);
  
    // Check for essential game state properties
    if (!data || !data.ball || !data.paddle1 || !data.paddle2) {
      console.error("Invalid game state received:", data);
      // Handle error, e.g., display an error message to the user
      return;
    }

    // Ensure paddle1 and paddle2 have valid y positions
    // if (typeof data.paddle1.y === 'undefined' || typeof data.paddle2.y === 'undefined') {
    //   console.error("Invalid paddle positions:", data.paddle1, data.paddle2);
    //   // Set default values or handle the error appropriately
    //   data.paddle1.y = 50;
    //   data.paddle2.y = 50;
    // }
  
    gameState = data;
    drawGame(gameState);
  };

// Kullanıcı etkileşimi (klavye ile raket hareketi)
document.addEventListener("keydown", (e) => {
    let paddleMovement = 0;

    if (e.key === "ArrowUp") paddleMovement = -5;
    else if (e.key === "ArrowDown") paddleMovement = 5;

    socket.send(JSON.stringify({ paddle_movement: paddleMovement }));
});

function drawGame(state) {
    if (!state || !state.ball || typeof state.ball.x === 'undefined' || typeof state.ball.y === 'undefined') {
        console.error("Invalid game state or ball data", state);

        // Ball için varsayılan değerler
        state.ball = { x: 50, y: 50 };
    }

    if (!state.paddle1 || typeof state.paddle1.y === 'undefined') {
        console.error("Invalid paddle1 data", state);

        // paddle1 için varsayılan değer
        state.paddle1 = { y: 50 }; // Varsayılan değer
    }

    if (!state.paddle2 || typeof state.paddle2.y === 'undefined') {
        console.error("Invalid paddle2 data", state);

        // paddle2 için varsayılan değer
        state.paddle2 = { y: 50 }; // Varsayılan değer
    }

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

// Kullanıcı etkileşimi ve animasyon döngüsü
function gameLoop() {
    if (gameState) {
        drawGame(gameState);
    } else {
        // Oyun durumu gelmediği zaman bir bekleme mesajı göster
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Waiting for game state...", canvas.width / 3, canvas.height / 2);
    }
    requestAnimationFrame(gameLoop);  // Her frame'de render
}

// Başlangıçta animasyon döngüsünü başlat
gameLoop();
