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
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      burgerClick(e);
      history.pushState({}, '', href);
      urlLocationHandler();
    });
  });

  const langSelects = document.getElementsByClassName('language-select');
  Array.from(langSelects).forEach(async (langSelect) => {
    langSelect.addEventListener('change', changeLanguage);
    const curLang = await getCookie('lang') || 'en-US';
    console.log(curLang)
    langSelect.value = curLang;
  });

  async function changeLanguage(e) {
    const lang = e.target.value;
    console.log(lang)
    await setCookie('lang', lang, 365);
    await pullHeader(true);
    urlLocationHandler();
  }

  const logouts = document.querySelectorAll('.logout');
  logouts.forEach((logout) => {
    logout.addEventListener('click', logoutFN);
  });

  function logoutFN(e) {
    e.preventDefault();
    disconnect();
    eraseCookie('refresh_token');
    eraseCookie('access_token');
    pullHeader(true);
    history.pushState({}, "", "/");
    urlLocationHandler();
  }

}
