{
    const btn = document.querySelectorAll(".play-button");
    btn.forEach((button) => {
        button.addEventListener("click", (e) => {
            urlRoute(e);
        });
    });
}

{
    const cardButtons = document.querySelectorAll(".card-button");
    cardButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const href = button.getAttribute("href");
            history.pushState({}, "", href);
            urlLocationHandler();
        });
    });
}