let isConnected = false;
let statusSocket;

const socket = async () => {
  if (isConnected)
    return;

  const token = await getCookie('access_token');

  if (!token)
    return;

  statusSocket = new WebSocket(`ws://${window.location.host}:8000/ws/online-status/?token=${token}`);

  statusSocket.onmessage = function (event) {
    console.log(event.data);
  };

  statusSocket.onopen = function (event) {
    console.log("open");
    isConnected = true;
  };

  statusSocket.onclose = function (event) {
    console.log("close");
    isConnected = false;
  };

}

const disconnectSocketStatus = () => {
  if (statusSocket && isConnected) {
    statusSocket.close();
    statusSocket = null;
    isConnected = false;
  }
}

document.addEventListener("click", (e) => {
  const { target } = e;
  if (!target.matches("nav a")) {
    return;
  }
  e.preventDefault();
  urlRoute();
});

async function getToken() {
  const token = await getCookie('access_token');
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

const urlRoutes = {
  404: {
    endPoint: "api/404/",
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
  const location = window.location.pathname;
  if (location.length == 0) {
    location = "/";
  }

  socket();

  const token = await getCookie('access_token');
  const language = document.documentElement.lang;

  let route = urlRoutes[location] || urlRoutes["404"];
  const container = document.getElementById("container");
  const lang = await getCookie('lang') || 'en';

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
      const created = createScript(script);
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

  const token = await getCookie('access_token');
  const lang = await getCookie('lang') || 'en';
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
      showToast('Error: ' + error, 'error');
    });
}


window.onpopstate = urlLocationHandler;
window.route = urlRoute;
urlLocationHandler();
pullHeader(false);
