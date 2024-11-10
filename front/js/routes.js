pullHeader();

const routes = {
  '/': '/home',
  'login': '/login'
};

const container = document.getElementById("container");

function clearStaticFiles() {
  const staticFiles = document.querySelectorAll("link[rel=stylesheet], script");
  staticFiles.forEach((element) => {
    if (element.getAttribute("data-static") === "true") {
      element.parentNode.removeChild(element);
    }
  });
}

function loadPage(page, updateHistory = true) {
  if (page == undefined || page == "home") page = "/"
  if (page in routes) {
    page = routes[page];
  }

  container.innerHTML = '<div class="base-container">Loading...</div>';

  fetch(`/api${page}`)
    .then((response) => response.text())
    .then((html) => {
      if (updateHistory && page !== history.state?.page) {
        const path = page === "home" ? "/" : page
        if (location.pathname !== path) {
          history.pushState({ page: page }, "", path);
        }
      }

      clearStaticFiles();

      const parsedHtml = new DOMParser().parseFromString(html, "text/html");
      container.innerHTML = parsedHtml.body.innerHTML;

      document.title = parsedHtml.head.querySelector("title")?.innerText || document.title;

      parsedHtml.head.querySelectorAll("meta, link").forEach((element) => {
        document.head.appendChild(element.cloneNode(true));
      });

      parsedHtml.body.querySelectorAll("script").forEach((element) => {
        const src = element.getAttribute("src");
        if (src) {
          const script = document.createElement("script");
          script.src = src;
          script.defer = true;
          script.async = false;
          script.setAttribute("data-static", "true");
          document.body.appendChild(script);
        }
      });

      document.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const url = link.getAttribute("href").split("/").filter(Boolean).pop();
          
          if ("/" + url === page) return;

          loadPage(url);
        });
      });
    })
    .catch((error) => {
      console.error("Error loading page:", error);
      container.innerHTML = '<div class="base-container">Error loading page. Please try again.</div>';
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