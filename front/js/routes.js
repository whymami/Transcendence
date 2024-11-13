pullHeader(true);

const routes = {
  '/': '/home',
  'login': '/login',
  'register': '/register',
  'profile': '/profile',
  'new-password': '/new-password',
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

  const token = getCookie("access_token");

  fetch(`/api${page}`, token && {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then((response) => {
      // console.log(response)
      if (!response.ok) {
        throw response
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
        console.log("Link:", link);
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const url = link.getAttribute("href").split("/").filter(Boolean).pop();

          console.log("Loading page:", url);
          console.log("Current page:", page);
          if ("/" + url === page) return;

          loadPage(url);
        });
      });
    })
    .catch((error) => {
      console.error("Error loading page:", error);
      if (error?.redirected)
        window.location.href = "/"
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
  if (!rePull && header.length > 0) return;

  const token = getCookie("access_token");

  // console.log("repull: ", rePull);
  // console.log("header: ", header);

  try {
    const res = await fetch("/api/header", token && {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const html = await res.text();
    const parsedHtml = new DOMParser().parseFromString(html, "text/html");

    const resHeader = parsedHtml.body.getElementsByTagName("header")[0];
    // console.log("resHeader: ", resHeader?.outerHTML);

    const currentHeader = document.body.getElementsByTagName("header")[0];

    if (resHeader) {
      if (currentHeader) {
        currentHeader.innerHTML = resHeader.innerHTML;
        // console.log("Header güncellendi:", resHeader.outerHTML);
      } else {
        document.body.insertAdjacentHTML("afterbegin", resHeader.outerHTML);
        // console.log("Header body'nin en üstüne eklendi:", resHeader.outerHTML);
      }
    }

    const links = parsedHtml.head.querySelectorAll("link");
    links.forEach((element) => {
      document.head.appendChild(element.cloneNode(true));
    });
    const scripts = parsedHtml.head.querySelectorAll("script");
    scripts.forEach((element) => {
      const src = element.getAttribute("src");
      if (src) {
        const script = document.createElement("script");
        script.src = src;
        script.setAttribute("data-static", "true");
        document.head.appendChild(script);
      }
    });
  } catch (error) {
    console.error("Header yüklenirken hata oluştu:", error);
  }

}