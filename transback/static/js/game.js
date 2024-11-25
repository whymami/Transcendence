const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const token = getCookie("access_token");
const socket = new WebSocket("ws://127.0.0.1:8000/ws/game/game_room/?token=" + token);

let gameState = null;
let paddleMovement = 0; // Hareket yönünü kontrol eden değişken

let fps = 90; // Hedef FPS
let interval = 1000 / fps; // Her frame'in süresi (ms)
let lastTime = 0;

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
    if (!data || !data.ball || !data.paddle1 || !data.paddle2) {
        console.error("Invalid game state received:", data);
        return;
    }
    gameState = data;
};

// Kullanıcı etkileşimi
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") paddleMovement = -5;
    else if (e.key === "ArrowDown") paddleMovement = 5;
});

document.addEventListener("keyup", () => {
    paddleMovement = 0; // Tuş bırakıldığında hareket durur
});

function updatePaddleMovement() {
    if (paddleMovement !== 0) {
        socket.send(JSON.stringify({ paddle_movement: paddleMovement }));
    }
    requestAnimationFrame(updatePaddleMovement);
}

// Ortada yatay çizgi çizen fonksiyon
function drawCenterLine() {
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);  // Başlangıç noktası (ortadan)
    ctx.lineTo(canvas.width / 2, canvas.height);  // Bitiş noktası (canvas'ın altına kadar)
    ctx.strokeStyle = "white";  // Çizgi rengi beyaz
    ctx.lineWidth = 2;  // Çizgi kalınlığı
    ctx.setLineDash([10, 10]); // Noktalı çizgi efekti
    ctx.stroke();
}

// Oyunu çizme fonksiyonu
function drawGame(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Canvas'ı temizle

    // Ortada çizgi
    drawCenterLine();

    // Topu çiz
    ctx.beginPath();
    ctx.arc(state.ball.x * 8, state.ball.y * 4, 10, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();

    // Raketleri çiz
    ctx.fillStyle = "white";
    ctx.fillRect(10, state.paddle1.y * 4 - 40, 13, 100);
    ctx.fillRect(780, state.paddle2.y * 4 - 40, 13, 100);

    // Skoru çiz
    ctx.font = "20px Arial";
    ctx.fillText(`Player 1: ${state.score.player1}`, 20, 20);
    ctx.fillText(`Player 2: ${state.score.player2}`, 660, 20);
}

// Oyun döngüsü
function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;

    if (deltaTime >= interval) {
        if (gameState) {
            drawGame(gameState);
        } else {
            // Oyun durumu gelmediğinde bekleme mesajı
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "20px Arial";
            ctx.fillText("Waiting for game state...", canvas.width / 3, canvas.height / 2);
        }
        lastTime = currentTime;
    }
    requestAnimationFrame(gameLoop);
}

// Başlat
updatePaddleMovement();
requestAnimationFrame(gameLoop);
