let status;
let statusSocket;
let username;
let oldUsername;

async function connectWebSocket() {
  const token = await getAccessToken(); // Assume a function to get the token

  if (!token) return;

  statusSocket = new WebSocket(`ws://${window.location.host}:8000/ws/online-status/?token=${token}`);

  statusSocket.onopen = function () {
    console.log("WebSocket connection opened.");
  };

  statusSocket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    if (data.type === "online_status") {
      updateUserOnlineStatus(data.username, data.is_online);
    }
  };

  statusSocket.onclose = function () {
    console.log("WebSocket connection closed.");
  };
}

function checkUserOnlineStatus(username) {
  if (statusSocket && statusSocket.readyState === WebSocket.OPEN) {
    statusSocket.send(JSON.stringify({
      type: "check_online",
      username: username
    }));
  }
}

function updateUserOnlineStatus(username, isOnline) {
  status = isOnline ? "online" : "offline"
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.classList[1] != status && (statusElement.classList.replace(statusElement.classList[1], status));
  }
}

function disconnect() {
  if (statusSocket) {
    statusSocket.close();
    //console.log("WebSocket connection closed.");
  }
}
disconnect();

// Call this function to establish the WebSocket connection
connectWebSocket();

document.addEventListener("click", (e) => {
  const { target } = e;
  if (!target.matches("nav a")) {
    return;
  }
  e.preventDefault();
  urlRoute();
});

async function getToken() {
  const token = await getAccessToken();
  if (!token) {
    const refreshToken = await getCookie('refresh_token');
    if (!refreshToken) {
      showToast('error', 'Session expired, please log in again.');
      history.pushState({}, "", "/login");
      urlLocationHandler();
      return;
    }

  }
  return token;
}

function createScript(script) {
  const newScript = document.createElement('script');
  const url = new URL(script.src, window.location.origin);
  newScript.src = url.pathname;
  newScript.dataset.static = script.getAttribute('data-static');
  return newScript;
}

function createInlineScript(script) {
  const newScript = document.createElement('script');
  newScript.textContent = script.textContent;
  newScript.dataset.static = script.getAttribute('data-static');
  return newScript;
}

const urlRoutes = {
  404: {
    endPoint: "/api/404/",
  },
  "/": {
    endPoint: "/api/home/",
  },
  "/profile": {
    endPoint: "/api/profile/",
  },
  "/login": {
    endPoint: "/api/login/",
  },
  "/register": {
    endPoint: "/api/register/",
  },
  "/reset-password": {
    endPoint: "/api/reset-password/",
  },
  "/verify": {
    endPoint: "/api/verify-account/"
  },
  "/2fa": {
    endPoint: "/api/verify-login/"
  },
  "/settings": {
    endPoint: "/api/settings/"
  },
  "/game": {
    endPoint: "/api/game/",
  },
  "/users": {
    endPoint: "/api/users/"
  },
  "/friends": {
    endPoint: "/api/friends/"
  },
  "/lobby": {
    endPoint: "/api/lobby/"
  },
  "/local": {
    endPoint: "/api/local/"
  },
  "/local/game/ai": {
    endPoint: "/api/game/ai/"
  },
  "/local/game/two-player": {
    endPoint: "/api/game/two-player/"
  },
  "/local/game/four-player": {
    endPoint: "/api/game/four-player/"
  },
  "/local/game/tournament": {
    endPoint: "/api/game/tournament/"
  },
  "/online/game": {
    endPoint: "/api/game/online/"
  }
};

const urlRoute = (event) => {
  event = event || window.event;
  event.preventDefault();
  // window.history.pushState(state, unused, target link);
  window.history.pushState({}, "", event.target.href);
  urlLocationHandler();
};

const urlLocationHandler = async () => {
  if (window.gameSocket) {
    window.gameSocket.close(1000, "Connection closed by client.");
    window.gameSocket = null;
    console.log("WebSocket disconnected. gameSocket");

  }

  if (window.matchmakingSocket) {
    window.matchmakingSocket.close(1000, "Connection closed by client.");
    window.matchmakingSocket = null;
    console.log("WebSocket disconnected. matchmakingSocket");

  }

  const location = window.location.pathname;
  if (location.length == 0) {
    location = "/";
  }

  const token = await getAccessToken();
  const language = document.documentElement.lang;

  let route = urlRoutes[location] || urlRoutes["404"];
  const container = document.getElementById("container");
  const lang = await getCookie('lang') || 'en-US';

  let username = null;

  if (route.endPoint == "/api/profile/") {
    const search = new URLSearchParams(window.location.search);
    username = search.get('username');
  }

  try {
    const response = await fetch(route.endPoint + `${username ? "?username=" + username : ""}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Accept-Language": lang,
        },
      }
    )
    if (!response.ok) {
      const html = await response.text();
      container.innerHTML = html;
      return;
    }
    const html = await response.text();
    const parsedHtml = new DOMParser().parseFromString(html, "text/html");
    document.title = parsedHtml.title;
    parsedHtml.head.querySelector('title').remove();
    const links = document.head.querySelectorAll('link[rel="stylesheet"]')
    links.forEach(link => {
      const pathname = new URL(link.href, window.location.origin).pathname;
      if (pathname.startsWith('/static/') && pathname !== '/static/css/header.css') {
        link.remove();
      }
    });
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", parsedHtml.description);
    document.head.appendChild(parsedHtml.head.querySelector('link[rel="stylesheet"]'));
    parsedHtml.head.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      link.remove();
    });
    const oldScript = document.querySelectorAll('script[data-static="true"]');
    if (oldScript) {
      oldScript.forEach(script => {
        script.remove();
      });
    }
    parsedHtml.body.querySelectorAll('script').forEach(script => {
      let created = null;

      if (script.src) {
        created = createScript(script);
      } else {
        created = createInlineScript(script);
      }
      if (created)
        document.body.appendChild(created);
      script.remove();
    });

    container.innerHTML = parsedHtml.body.innerHTML;

  } catch (error) {
    console.error("Error:", error);
    showToast("error", "Error: " + error,);
    container.innerHTML = "Error: " + error;
  } finally {
    route = null;
  }
};

async function pullHeader(repull = false) {
  let header = document.getElementsByTagName('header').item(0);
  if (header && repull) {
    document.body.removeChild(header);
  }
  // console.log(header);
  header = document.getElementsByTagName('header').item(0);
  if (header) {
    return;
  }

  const token = await getAccessToken();
  const lang = await getCookie('lang') || 'en-US';
  // console.log(window.navigator.languages);
  fetch('/api/header/',
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Accept-Language": lang,
      }
    }
  )
    .then(response => response.text())
    .then(data => {
      const parsedHtml = new DOMParser().parseFromString(data, 'text/html');
      const header = parsedHtml.querySelector('header');
      document.body.insertAdjacentHTML('afterbegin', header.outerHTML);
      document.head.appendChild(parsedHtml.head.querySelector('link[rel="stylesheet"]'));
      parsedHtml.head.querySelectorAll('script').forEach(script => {
        const created = createScript(script)
        if (created)
          document.head.appendChild(created);
      });

    }).catch(error => {
      console.error('Error:', error);
      showToast("error", 'Error: ' + error, 'error');
    });
}

window.onpopstate = urlLocationHandler;
window.route = urlRoute;
urlLocationHandler();
pullHeader(false);

async function refreshAccessToken() {
  const refreshToken = getCookie('refresh_token');
  const currentPath = window.location.pathname;
  const publicPages = ['/login', '/register', '/reset-password', '/verify', '/2fa', '/',];

  if (!refreshToken) {
    eraseCookie('access_token');
    eraseCookie('refresh_token');
    if (!publicPages.includes(currentPath)) {
      showToast("error", 'Session expired, please log in again.');
      history.pushState({}, "", "/login");
      urlLocationHandler();
    }
    return null;
  }

  try {
    const response = await fetch('/api/token/refresh/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      setCookie('access_token', data.access, 1);
      const accessToken = await data.access;
      return accessToken;
    } else {
      eraseCookie('access_token');
      eraseCookie('refresh_token');
      showToast("error", 'Session expired, please log in again.');
      history.pushState({}, "", "/login");
      urlLocationHandler();
      return null;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    eraseCookie('access_token');
    eraseCookie('refresh_token');
    history.pushState({}, "", "/login");
    urlLocationHandler();
    return null;
  }
}

async function getAccessToken() {
  let token = await getCookie('access_token');
  if (!token) {
    token = await refreshAccessToken();
  }
  return token;
}
