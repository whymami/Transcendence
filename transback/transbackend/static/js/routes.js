function loadPage(page) {
    fetch(`/${page}/`)
      .then(response => response.text())
      .then(html => {
        document.getElementById('root').innerHTML = html;
      })
      .catch(error => console.error('Error loading page:', error));
  }
  
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = this.getAttribute('href').split('/').filter(Boolean).pop();
      loadPage(page);
    });
  });
  