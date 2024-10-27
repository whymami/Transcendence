const routes = {
  '/': 'home/',
  'login': '/login/'
}


function loadScript(url) {
  return new Promise((resolve, reject) => {
    const js = document.getElementsByClassName("dynamic-js");
    if (js.length != 0) {
      js.forEach((script) => {
        if (script.src == url) {
          script.remove();
        }
      })
    }

    const script = document.createElement("script");
    script.src = url;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Script load error for ${url}`));
    document.body.append(script);
  });
}

function loadCss(url) {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.href;
    link.rel = "stylesheet";
    link.className = "dynamic-css";
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`CSS load error for ${url}`));
    document.head.append(link);
  });
}

function loadPage(page, updateHistory = true) {
  page = page || "home";
  console.log("Loading page:", page);
  fetch(page == "home" ? "/" : `/${page}/`)
    .then((response) => response.text())
    .then((html) => {
      console.log(html);
      const app = document.getElementById("app");
      app.innerHTML = html;
      if (updateHistory) {
        page == "home"
          ? history.pushState({}, "", "/")
          : history.pushState({ page: page }, "", `/${page}/`);
      }
    })
    .catch((error) => {
      console.error("Error loading page:", error);
    });
  try {
    loadScript(`/api/static/js/${page}.js`);
  } catch (error) {
    console.error("Error loading script:", error);
  }
}

document.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", function (e) {
    console.log(link.href);
    e.preventDefault();
    const page = this.getAttribute("href").split("/").filter(Boolean).pop();
    loadPage(page);
  });
});

window.onpopstate = function (event) {
  if (event.state && event.state.page) {
    loadPage(event.state.page, false);
  }
};

window.onload = function () {
  const page = location.pathname.split("/").filter(Boolean).pop();
  loadPage(page);
};
