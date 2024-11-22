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
      window.location.href = '/login';
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
    endPoint: "/404",
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

  const token = await getCookie('access_token');

  const route = urlRoutes[location] || urlRoutes["404"];
  const container = document.getElementById("container")
  try {
    const response = await fetch(route.endPoint,
      token && {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const html = await response.text();
    container.innerHTML = html;
    const parsedHtml = new DOMParser().parseFromString(html, "text/html");
    document.title = parsedHtml.title;
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", parsedHtml.description);
    document.head.appendChild(parsedHtml.head.querySelector('link[rel="stylesheet"]'));
    const oldScript = document.querySelectorAll('script[data-static="true"]');
    if (oldScript) {
      oldScript.forEach(script => {
        script.remove();
      });
    }
    parsedHtml.body.querySelectorAll('script').forEach(script => {
      document.body.appendChild(createScript(script));
    });
  } catch (error) {
    console.error("Error:", error);
    showToast("error", "Error: " + error,);
    container.innerHTML = "Error: " + error;
  }
};


async function pullHeader() {
  const header = document.getElementById('header');
  if (header) {
    return;
  }

  const token = await getCookie('access_token');

  fetch('/api/header/',
    token && {
      headers: {
        Authorization: `Bearer ${token}`,
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
pullHeader();