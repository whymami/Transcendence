{
    const btn = document.querySelectorAll(".play-button");
    btn.forEach((button) => {
        button.addEventListener("click", (e) => {
            urlRoute(e);
        });
    });
}