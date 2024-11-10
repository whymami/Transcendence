pullHeader();
const called = [];

const routes = {
  '/': 'home/',
  'login': '/login'
};

const container = document.getElementById("container");

function clearStaticFiles() {
  const staticFiles = document.querySelectorAll("link[rel=stylesheet], script");
  staticFiles.forEach((element) => {
    element.remove();
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
      html = new DOMParser().parseFromString(html, "text/html");
      console.log("after: ", html);

      container.innerHTML = html.body.innerHTML;

      const head = html?.head;
      document.title = head?.querySelector("title")?.innerHTML;

      const meta = head.querySelectorAll("meta");
      meta.forEach((element) => {
        document.head?.appendChild(element);
      });

      const link = head.querySelectorAll("link");
      link.forEach((element) => {
        document.head?.appendChild(element);
      });

      const script = head.querySelectorAll("script");
      script.forEach((element) => {
        document.head?.appendChild(element);
      });

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