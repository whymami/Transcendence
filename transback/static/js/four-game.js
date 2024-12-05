const canvas = document.getElementById("pong");
const ctx = canvas.getContext("2d");

// Oyun ayarları
const width = canvas.width;
const height = canvas.height;
const paddleWidth = 10,
    paddleHeight = 100;
const ballSize = 10;
let ballX = width / 2,
    ballY = height / 2;
let ballDX = 3,
    ballDY = 3;

// Skorlar
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
    }, // Sol oyuncu 1 (üst yarı)
    {
        x: width - paddleWidth - 10,
        y: height / 4 - paddleHeight / 2,
        dy: 0,
        upKey: 38,
        downKey: 40,
        section: "top",
    }, // Sağ oyuncu 1 (üst yarı)
    {
        x: 10,
        y: (height * 3) / 4 - paddleHeight / 2,
        dy: 0,
        upKey: 65,
        downKey: 90,
        section: "bottom",
    }, // Sol oyuncu 2 (alt yarı)
    {
        x: width - paddleWidth - 10,
        y: (height * 3) / 4 - paddleHeight / 2,
        dy: 0,
        upKey: 74,
        downKey: 75,
        section: "bottom",
    }, // Sağ oyuncu 2 (alt yarı)
];

// Paddle'ı çiz
function drawPaddle(x, y) {
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.rect(x, y, paddleWidth, paddleHeight); // Düz kenarlarla dikdörtgen çiz
    ctx.closePath();
    ctx.fill();
}

// Topu çiz
function drawBall(x, y) {
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(x, y, ballSize, 0, Math.PI * 2, false);
    ctx.fill();
}

// Ortadaki kesik çizgiyi kalın şekilde çiz
function drawCenterLine() {
    ctx.fillStyle = "#FFF";
    const lineWidth = 5; // Çizgi parçasının genişliği
    const lineHeight = 10; // Çizgi parçasının yüksekliği
    const gapHeight = 10; // Çizgi parçası arasındaki boşluk
    const totalHeight = canvas.height;

    // Çizgi parçası ve boşluk arasında bir döngü çalıştırarak çizgiyi oluşturuyoruz
    for (let i = 0; i < totalHeight; i += lineHeight + gapHeight) {
        ctx.fillRect(
            canvas.width / 2 - lineWidth / 2,
            i,
            lineWidth,
            lineHeight
        ); // Dikey çizgi parçası
    }
}

// Yatay çizgiyi gizlemek için bir kontrol değişkeni ekleyin
let showHorizontalLine = false; // true: çizgi gösterilir, false: gizlenir

// Yatay kesik çizgiyi kalın şekilde çiz
function drawHorizontalLine() {
    if (showHorizontalLine) {
        ctx.fillStyle = "#FFF";
        const lineWidth = 20; // Çizgi parçasının genişliği
        const lineHeight = 5; // Çizgi parçasının yüksekliği (kalınlık)
        const gapWidth = 15; // Çizgi parçası arasındaki boşluk
        const totalWidth = canvas.width;

        // Çizgi parçası ve boşluk arasında bir döngü çalıştırarak yatay çizgiyi oluşturuyoruz
        for (let i = 0; i < totalWidth; i += lineWidth + gapWidth) {
            ctx.fillRect(i, height / 2 - lineHeight / 2, lineWidth, lineHeight); // Yatay çizgi parçası
        }
    }
}

// Fileyi (kesik çizgi) çizme
function drawNet() {
    ctx.fillStyle = "#FFF";
    const lineHeight = 10; // Kesik çizgi uzunluğu
    const spaceHeight = 20; // Çizgiler arasındaki boşluk

    for (let i = 0; i < height; i += spaceHeight) {
        // Kesik çizgi çizme
        ctx.fillRect(width / 2 - 1, i, 2, lineHeight); // Kesik çizgi
    }
}

// Paddle'ların hareketini kontrol et
function movePaddles() {
    paddles.forEach((paddle) => {
        // Üst yarıdaki oyuncu için sınır kontrolü
        if (paddle.section === "top") {
            if (paddle.dy > 0 && paddle.y < height / 2 - paddleHeight) {
                paddle.y += paddle.dy; // Aşağı hareket etmesine izin ver
            } else if (paddle.dy < 0 && paddle.y > 0) {
                paddle.y += paddle.dy; // Yukarı hareket etmesine izin ver
            }
        }

        // Alt yarıdaki oyuncu için sınır kontrolü
        if (paddle.section === "bottom") {
            if (paddle.dy > 0 && paddle.y < height - paddleHeight) {
                paddle.y += paddle.dy; // Aşağı hareket etmesine izin ver
            } else if (paddle.dy < 0 && paddle.y > height / 2) {
                paddle.y += paddle.dy; // Yukarı hareket etmesine izin ver
            }
        }
    });
}

// Skorları güncelle
function updateScore() {
    document.getElementById("team1-score").innerText = team1Score;
    document.getElementById("team2-score").innerText = team2Score;
}

// Topu hareket ettir
function moveBall() {
    ballX += ballDX;
    ballY += ballDY;

    if (ballY <= 0 || ballY >= height) {
        ballDY *= -1; // Top duvara çarptığında yön değiştir
    }

    paddles.forEach((paddle) => {
        if (
            ballX <= paddle.x + paddleWidth &&
            ballX >= paddle.x &&
            ballY >= paddle.y &&
            ballY <= paddle.y + paddleHeight
        ) {
            ballDX *= -1;
        }
    });

    // Skor güncellemeleri
    if (ballX <= 0) {
        team2Score += 1;
        updateScore();
        ballX = width / 2;
        ballY = height / 2;
        ballDX = -ballDX;
    }

    if (ballX >= width) {
        team1Score += 1;
        updateScore();
        ballX = width / 2;
        ballY = height / 2;
        ballDX = -ballDX;
    }

    // Kontrol et, biri 10 puana ulaşmışsa oyunu bitir
    if (team1Score === 10 || team2Score === 10) {
        gameOver();
    }
}

// Oyun bittiğinde gösterilecek mesaj
function gameOver() {
    let winner = team1Score === 10 ? "Team 1" : "Team 2";
    alert(winner + " wins!");
    cancelAnimationFrame(gameLoop); // Oyun döngüsünü durdur
}

// Oyun döngüsü
function gameLoop() {
    ctx.clearRect(0, 0, width, height);
    drawBall(ballX, ballY);
    paddles.forEach((paddle) => drawPaddle(paddle.x, paddle.y));
    drawCenterLine(); // Dikey çizgi
    drawHorizontalLine(); // Yatay çizgi
    drawNet(); // Kesik çizgi file
    movePaddles();
    moveBall();
    requestAnimationFrame(gameLoop);
}

// Sayfanın kaymasını engelleme
document.addEventListener("keydown", function (event) {
    // Ok tuşlarına basıldığında sayfanın kaymasını engelle
    if (event.keyCode === 38 || event.keyCode === 40) {
        // Yukarı (38) veya Aşağı (40) tuşu
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