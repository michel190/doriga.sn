document.documentElement.classList.add('js');
const $ = id => document.getElementById(id);
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ---------- Photo manquante : la case reste « photo à venir » ---------- */
document.querySelectorAll('.product[data-views]').forEach(card => {
  const imgs = card.querySelectorAll('img');
  const check = () => {
    const first = imgs[0];
    if (first.complete && first.naturalWidth === 0) {
      card.classList.add('placeholder'); card.removeAttribute('tabindex'); card.hidden = true;
    } else if (first.complete) card.querySelector('.todo')?.remove();
  };
  imgs[0].addEventListener('error', () => { check(); apply(); }); imgs[0].addEventListener('load', check); check();
  // une 2e vue manquante ne doit pas apparaître au survol
  imgs.forEach((im, i) => i && im.addEventListener('error', () => {
    const src = im.getAttribute('src');
    card.dataset.views = card.dataset.views.split(',').filter(v => v.split('|')[0] !== src).join(',');
    im.remove();
  }));
  // vérifie aussi les vues manquantes tout de suite (pas seulement au survol)
  imgs.forEach((im, i) => { if (i) im.loading = 'eager'; });
});

/* ---------- Visionneuse : toutes les vues d'une même robe ---------- */
const lb = $('lightbox'), lbImg = $('lbImg'), lbThumbs = $('lbThumbs');
function openDress(card) {
  const name = card.querySelector('.label span').textContent;
  const views = card.dataset.views.split(',').map(v => v.split('|'));
  $('lbTitle').textContent = name;
  $('lbDesc').textContent = card.dataset.desc;
  $('lbFabric').textContent = card.dataset.fabric;
  $('lbTech').textContent = card.dataset.tech;
  lbThumbs.replaceChildren();
  views.forEach(([src, label], i) => {
    const b = document.createElement('button');
    const im = document.createElement('img'); im.src = src; im.alt = '';
    const t = document.createElement('span'); t.textContent = label;
    b.append(im, t);
    b.setAttribute('aria-pressed', i === 0);
    b.addEventListener('click', () => {
      lbThumbs.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
      lbImg.src = src; lbImg.alt = `${name}, vue ${label.toLowerCase()}`;
    });
    lbThumbs.append(b);
  });
  lbImg.src = views[0][0]; lbImg.alt = `${name}, vue ${views[0][1].toLowerCase()}`;
  lb.showModal();
}
document.querySelectorAll('.product[data-views]').forEach(card => {
  card.addEventListener('click', () => { if (!card.classList.contains('placeholder')) openDress(card); });
  card.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !card.classList.contains('placeholder')) { e.preventDefault(); openDress(card); } });
});
$('lbClose').addEventListener('click', () => lb.close());
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

/* ---------- Filtres + recherche ---------- */
const filters = { type: '', occasion: '', tissu: '' };
let query = '', showAll = false;
const exploreBtn = $('exploreAll');
const noRes = $('noResult');
function apply() {
  const words = norm(query.trim()).split(/\s+/).filter(Boolean);
  const active = words.length || Object.values(filters).some(Boolean);
  let n = 0;
  document.querySelectorAll('.product').forEach(c => {
    if (c.classList.contains('placeholder')) { c.hidden = true; return; }
    const txt = norm(c.dataset.keywords + ' ' + c.querySelector('.label span').textContent);
    const ok = words.every(w => txt.includes(w)) &&
      Object.entries(filters).every(([k, v]) => !v || c.dataset[k].split(' ').includes(v));
    c.hidden = !ok; if (ok) n++;
  });
  // sans filtre : 4 robes, comme la maquette ; « Tout voir » affiche le reste
  const shown = [...document.querySelectorAll('.product:not(.placeholder)')].filter(c => !c.hidden);
  if (!active && !showAll) shown.slice(4).forEach(c => c.hidden = true);
  exploreBtn.hidden = !active && shown.length <= 4;
  exploreBtn.firstChild.textContent = showAll && !active ? 'Réduire' : 'Tout voir';
  noRes.hidden = n > 0;
}
const closeMenus = except => document.querySelectorAll('.dd').forEach(d => {
  if (d === except) return;
  d.querySelector('.dd-menu').hidden = true; d.querySelector('.dd-btn').setAttribute('aria-expanded', 'false');
});
document.querySelectorAll('.dd').forEach(dd => {
  const btn = dd.querySelector('.dd-btn'), menu = dd.querySelector('.dd-menu'), base = btn.textContent;
  btn.addEventListener('click', e => {
    e.stopPropagation(); closeMenus(dd);
    const open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', open);
  });
  menu.querySelectorAll('button').forEach(opt => opt.addEventListener('click', () => {
    filters[btn.dataset.key] = opt.dataset.val;
    menu.querySelectorAll('button').forEach(o => o.setAttribute('aria-checked', o === opt));
    btn.textContent = opt.dataset.val ? opt.textContent : base;
    btn.classList.toggle('active', !!opt.dataset.val);
    menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
    apply();
  }));
});
document.addEventListener('click', () => closeMenus());
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });
exploreBtn.addEventListener('click', e => {
  e.preventDefault();
  const anyFilter = query.trim() || Object.values(filters).some(Boolean);
  showAll = anyFilter ? true : !showAll;
  Object.keys(filters).forEach(k => filters[k] = '');
  document.querySelectorAll('.dd-btn').forEach(b => { b.classList.remove('active'); b.textContent = { type: 'Type', occasion: 'Occasion', tissu: 'Tissu' }[b.dataset.key]; });
  query = ''; document.querySelectorAll('form.search input').forEach(i => i.value = '');
  apply();
});

/* ---------- Menu mobile ---------- */
const menuBtn = $('menuBtn'), mMenu = $('mobileMenu');
const setMenu = open => { menuBtn.setAttribute('aria-expanded', open); mMenu.hidden = !open; };
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
mMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

document.querySelectorAll('form.search').forEach(f => {
  const inp = f.querySelector('input');
  inp.addEventListener('input', () => {
    query = inp.value;
    document.querySelectorAll('form.search input').forEach(o => { if (o !== inp) o.value = inp.value; });
    apply();
  });
  f.addEventListener('submit', e => {
    e.preventDefault(); query = inp.value; apply(); setMenu(false);
    $('collection').scrollIntoView({ behavior: 'smooth' });
  });
});

/* ---------- Carrousel savoir-faire ---------- */
const strip = $('strip'), count = $('storyCount');
let idx = 0; const total = strip.children.length;
document.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => {
  idx = (idx + +b.dataset.dir + total) % total;
  const w = strip.children[0].getBoundingClientRect().width + 4;
  const shift = Math.min(idx * w, strip.scrollWidth - strip.clientWidth);
  [...strip.children].forEach(el => el.style.transform = `translateX(-${shift}px)`);
  count.textContent = String(idx + 1).padStart(2, '0') + '/' + String(total).padStart(2, '0');
}));

/* ---------- Pièce phare ---------- */
const dresses = {
  brodee: { eyebrow: 'Pièce phare', title: ['Le bazin caramel —', 'broderie signature'],
    text: 'Un murmure de rareté, une déclaration de style. Un bazin lumineux rehaussé de grandes broderies orangées, pensé pour les grandes occasions.',
    big: 'img/robe-brodee-pose.jpg', side: 'img/robe-brodee-face.jpg', name: 'la robe en bazin caramel brodée', thumb: 'img/robe-brodee-face.jpg' },
  rose: { eyebrow: 'Peinte à la main', title: ['Le rose poudré —', 'peint à la main'],
    text: 'Cercles bleus et traits noirs peints à la main sur un tissu rose texturé, taille empire et plis plats. Une pièce unique, élégante et légère.',
    big: 'img/robe-rose-face-pose.jpg', side: 'img/robe-rose-dos.jpg', name: 'la robe rose poudré peinte à la main', thumb: 'img/robe-rose-face.jpg' }
};
Object.assign(dresses, {
  jaune: { eyebrow: 'Peint à la main', title: ['Le boubou jaune —', 'fleurs bleues peintes'],
    text: 'Un grand boubou en bazin jaune soleil, de larges fleurs bleues peintes à la main et rehaussées de strass, porté avec son foulard.',
    big: 'img/robe-jaune-face.jpg', side: 'img/robe-jaune-face.jpg', zoom: '70% 90%', name: 'le boubou jaune aux fleurs bleues', thumb: 'img/robe-jaune-face.jpg' },
  rouge: { eyebrow: 'Brodée et perlée', title: ['Le bazin rouge —', 'roses brodées'],
    text: 'Un bazin rouge éclatant, de grandes roses brodées et perlées sur le buste, l’ourlet et les manches, col officier fendu.',
    big: 'img/robe-rouge-face.jpg', side: 'img/robe-rouge-face.jpg', zoom: '52% 27%', name: 'la robe en bazin rouge aux roses brodées', thumb: 'img/robe-rouge-face.jpg' },
  peche: { eyebrow: 'Broderie géométrique', title: ['Le bazin pêche —', 'manches évasées'],
    text: 'Un bazin pêche aux broderies géométriques bordeaux, buste plissé et manches évasées. Douce, lumineuse, élégante.',
    big: 'img/robe-peche-face.jpg', side: 'img/robe-peche-face.jpg', zoom: '40% 21%', name: 'la robe en bazin pêche brodée', thumb: 'img/robe-peche-face.jpg' }
});
const order = ['brodee', 'jaune', 'rouge', 'peche', 'rose']; let cap = 0;
document.querySelectorAll('[data-cap]').forEach(b => b.addEventListener('click', () => {
  cap = (cap + +b.dataset.cap + order.length) % order.length;
  const d = dresses[order[cap]];
  $('capEyebrow').textContent = d.eyebrow;
  $('capTitle').replaceChildren(...d.title.flatMap((t, i) => i ? [document.createElement('br'), t] : [t]));
  $('capText').textContent = d.text;
  $('capBig').src = d.big; $('capSide').src = d.side;
  const side = $('capSide');
  side.style.transformOrigin = d.zoom || '';
  side.style.transform = d.zoom ? 'scale(2.6)' : '';
}));

/* ---------- Quiz ---------- */
const result = $('result');
document.querySelectorAll('.opts').forEach(g => g.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  result.classList.remove('show');
}));
$('showResult').addEventListener('click', () => {
  const feel = document.querySelector('[data-group=feel] [aria-pressed=true]');
  const occ = document.querySelector('[data-group=occasion] [aria-pressed=true]').textContent;
  const d = dresses[feel.dataset.dress];
  $('resImg').src = d.thumb; $('resImg').alt = d.name;
  $('resText').textContent = `${feel.textContent} pour : ${occ}. Notre conseil : ${d.name}.`;
  result.classList.add('show');
});

/* état initial de la collection */
apply();

/* apparition en douceur au défilement */
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));
