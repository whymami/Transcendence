{
    const btn = document.querySelectorAll('.back-button');
    btn.forEach((button) => {
        button.addEventListener("click", (e) => {
            urlRoute(e);
        });
    });
}