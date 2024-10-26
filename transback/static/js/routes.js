function loadPage(page, updateHistory = true) {
  page = page || "";
  console.log("Loading page:", page);
  fetch(page == "" ? "/" : `/${page}/`)
    .then((response) => response.text())
    .then((html) => {
      document.getElementsByTagName("html")[0].innerHTML = html;
      if (updateHistory) {
        page == ""
          ? history.pushState({}, "", "/")
          : history.pushState({ page: page }, "", `/${page}/`);
      }
    })
    .catch((error) => {
      console.error("Error loading page:", error);
    });
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
