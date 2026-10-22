// Shared header navigation. Each page has <header id="site-header"></header>
// and loads this file with <script type="module" src="js/nav.js"></script>.
const links = [
  { href: 'index.html', label: 'Home' },
  { href: 'pets.html', label: 'Browse Pets' },
  { href: 'index.html#guide', label: 'How Adoption Works' },
];

const header = document.getElementById('site-header');
if (header) {
  const current = location.pathname.split('/').pop() || 'index.html';
  header.className = 'site-header';
  header.innerHTML = `
    <div class="inner">
      <a class="logo" href="index.html">PawConnect</a>
      <nav aria-label="Main">
        ${links.map((l) => `<a href="${l.href}"${l.href === current ? ' aria-current="page"' : ''}>${l.label}</a>`).join('')}
      </nav>
    </div>`;
}
