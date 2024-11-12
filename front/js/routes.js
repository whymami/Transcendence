pullHeader(true);

const routes = {
  '/': '/home',
  'login': '/login',
  'register': '/register'
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
    .then((response) => {
      console.log(response)
      if (!response.ok) {
        throw new Error("Error loading page");
      }
      return response.text();
    }
    )
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

async function pullHeader(rePull = false) {
  const header = document.getElementsByTagName("header");
  if (!rePull && header !== null) return;

  try {
    const res = await fetch("/api/header/");
    const html = await res.text();
    const parsedHtml = new DOMParser().parseFromString(html, "text/html");
    const header = parsedHtml.body.getElementsByTagName("header")[0];

    if (rePull && header) header.remove();
    document.body.insertAdjacentHTML("afterbegin", header.outerHTML);
    console.log("Header loaded", header);
    const links = parsedHtml.head.querySelectorAll("link");
    links.forEach((element) => {
      document.head.appendChild(element.cloneNode(true));
    });
  } catch (error) {
    console.error("Error loading header:", error);
  }

}