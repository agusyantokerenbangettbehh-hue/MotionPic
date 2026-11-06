/* MotionPic – tema, menu mobile, penanda menu aktif */
(function () {
  var root = document.documentElement, t;
  try { t = localStorage.getItem('mp-theme'); } catch (e) {}
  if (t) root.dataset.theme = t;
  document.getElementById('th').addEventListener('click', function () {
    var n = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = n;
    try { localStorage.setItem('mp-theme', n); } catch (e) {}
  });

  var mb = document.getElementById('mb'), nv = document.getElementById('nv');
  function menu(open) { nv.classList.toggle('open', open); mb.setAttribute('aria-expanded', open); }
  mb.addEventListener('click', function () { menu(!nv.classList.contains('open')); });
  nv.addEventListener('click', function (e) { if (e.target.tagName === 'A') menu(false); });

  var links = [].slice.call(nv.querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    ['beranda', 'fitur', 'studio', 'tentang'].forEach(function (id) { io.observe(document.getElementById(id)); });
  }
})();
