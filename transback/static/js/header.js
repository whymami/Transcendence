{
  let burgers = document.querySelectorAll('.hamburger');
  let menu = document.getElementById('burger-drawer');

  function burgerClick(e) {
    e.preventDefault();
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

  const langSelect = document.getElementById('lang-select');
  langSelect.addEventListener('change', changeLanguage);
  langSelect.value = getCookie('lang') || 'en-US';
  
  function changeLanguage() {
    const lang = langSelect.value;
    setCookie('lang', lang, 365);
    location.reload();
  }
}
