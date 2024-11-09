pullHeader();
const called = [];

const routes = {
  '/': 'home/',
  'login': '/login'
};

const container = document.getElementById("container");

function loadScript(url) {
  if (called.includes(url)) return;
  called.push(url);
  return new Promise((resolve, reject) => {
    const js = Array.from(document.getElementsByClassName("dynamic-js"));
    js.forEach((e) => e.remove());

    const script = document.createElement("script");
    script.src = url;
    script.className = "dynamic-js";
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Script load error for ${url}`));
    document.body.append(script);
  });
}

function loadCss(url) {
  return new Promise((resolve, reject) => {
    const css = Array.from(document.getElementsByClassName("dynamic-css"));
    css.forEach((e) => e.remove());

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.className = "dynamic-css";
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`CSS load error for ${url}`));
    document.head.append(link);
  });
}

function loadPage(page, updateHistory = true) {
  if (page in routes) {
    page = routes[page];
  }

  container.innerHTML = `<div class="base-container">Loading...</div>`;

  fetch(`/api${page}`)
    .then((response) => response.text())
    .then((html) => {
      if (updateHistory && page !== history.state?.page) {
        page === "home"
          ? history.pushState({}, "", "/")
          : history.pushState({ page: page }, "", `${page}/`);
      }

      container.innerHTML = html;
      document.title = page;
    })
    .then(() => {
      document.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const page = link.getAttribute("href").split("/").filter(Boolean).pop();
          loadPage(page);
        });
      });
    })
    .catch((error) => {
      console.error("Error loading page:", error);
      container.innerHTML = `<div class="base-container">Error loading page. Please try again.</div>`;
    });
}

window.onpopstate = function (e) {
  const page = e.state?.page || location.pathname.split("/").filter(Boolean).pop() || "home";
  loadPage(page, false);
};

window.onload = function () {
  const page = location.pathname.split("/").filter(Boolean).pop();
  loadPage(page);
};

function pullHeader() {
  const header = document.getElementById("header");
  if (header !== null) return;
  fetch("/api/header/")
    .then((response) => response.text())
    .then((html) => {
      document.body.insertAdjacentHTML("afterbegin", html);
    })
    .catch((error) => {
      console.error("Error loading header:", error);
    });
}