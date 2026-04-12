(function () {
  var loc = window.location.pathname;
  var isHome = loc.endsWith('/') || loc.endsWith('/index.html') || loc === '/index.html';

  if (isHome) return;

  var basePath = loc.includes('/admin/') ? '../index.html' : 'index.html';

  history.pushState({ intercepted: true }, '', window.location.href);

  window.addEventListener('popstate', function () {
    window.location.replace(basePath);
  });
})();
