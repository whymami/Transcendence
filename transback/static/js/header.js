{
  let burgers = document.querySelectorAll('.hamburger');
  let menu = document.getElementById('burger-drawer');

  function burgerClick() {
    burgers.forEach((burger) => {
      burger.classList.toggle('active');
    })
    menu.classList.toggle('active');
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('#burger') && !e.target.closest('#burger-drawer')) {
      burgers.forEach((burger) => {
        burger.classList.remove('active');
      })
      menu.classList.remove('active');
    }
  });

  burgers.forEach((burger) => {
    burger.addEventListener('click', burgerClick);
  });

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', burgerClick);
  });
}
