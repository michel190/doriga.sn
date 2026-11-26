const $ = id => document.getElementById(id);
const capEyebrow=$('capEyebrow'),capTitle=$('capTitle'),capText=$('capText'),capBig=$('capBig'),capSide=$('capSide'),result=$('result'),showResult=$('showResult'),resImg=$('resImg'),resText=$('resText');

// Une robe = plusieurs vues : boutons Face / Pose / Dos
document.querySelectorAll('.product').forEach(card => {
  const btns = card.querySelectorAll('.views button'), imgs = card.querySelectorAll('img');
  btns.forEach((b, i) => b.addEventListener('click', () => {
    btns.forEach(x => x.setAttribute('aria-pressed', x === b));
    imgs.forEach((im, j) => im.classList.toggle('on', j === i));
  }));
});

// Filtres
document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () =>
  c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true')));

// Détails du savoir-faire
const strip = document.getElementById('strip'), count = document.getElementById('storyCount');
let idx = 0; const total = strip.children.length;
document.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => {
  idx = (idx + +b.dataset.dir + total) % total;
  const w = strip.children[0].getBoundingClientRect().width + 4;
  const shift = Math.min(idx * w, strip.scrollWidth - strip.clientWidth);
  [...strip.children].forEach(el => el.style.transform = `translateX(-${shift}px)`);
  count.textContent = String(idx + 1).padStart(2,'0') + '/' + String(total).padStart(2,'0');
}));

// Pièce phare : bascule entre les deux robes
const dresses = {
  brodee:{eyebrow:'Pièce phare',title:['Le bazin caramel —','broderie signature'],
    text:'Un bazin lumineux, rehaussé de grandes broderies orangées. Une robe de cérémonie qui se commande aussi à vos mesures.',
    big:'img/robe-brodee-pose.jpg',side:'img/robe-brodee-face.jpg',name:'la robe en bazin caramel brodée',thumb:'img/robe-brodee-face.jpg'},
  rose:{eyebrow:'Peinte à la main',title:['Le rose poudré —','peint à la main'],
    text:'Cercles bleus et traits noirs peints à la main sur un tissu rose texturé, taille empire et plis plats. Une pièce unique, élégante et légère.',
    big:'img/robe-rose-face-pose.jpg',side:'img/robe-rose-dos.jpg',name:'la robe rose poudré peinte à la main',thumb:'img/robe-rose-face.jpg'}
};
const order = ['brodee','rose']; let cap = 0;
document.querySelectorAll('[data-cap]').forEach(b => b.addEventListener('click', () => {
  cap = (cap + +b.dataset.cap + order.length) % order.length;
  const d = dresses[order[cap]];
  capEyebrow.textContent = d.eyebrow; capTitle.replaceChildren(...d.title.flatMap((t,i)=> i ? [document.createElement('br'), t] : [t])); capText.textContent = d.text;
  capBig.src = d.big; capSide.src = d.side;
}));

// Quiz
document.querySelectorAll('.opts').forEach(g => g.addEventListener('click', e => {
  if (e.target.tagName !== 'BUTTON') return;
  g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === e.target));
  result.classList.remove('show');
}));
showResult.addEventListener('click', () => {
  const feel = document.querySelector('[data-group=feel] [aria-pressed=true]');
  const occ = document.querySelector('[data-group=occasion] [aria-pressed=true]').textContent;
  const d = dresses[feel.dataset.dress];
  resImg.src = d.thumb; resImg.alt = d.name;
  resText.textContent = `${feel.textContent} pour : ${occ}. Notre conseil : ${d.name}.`;
  result.classList.add('show');
});

// Menu mobile
const menuBtn=$('menuBtn'), menu=$('mobileMenu');
menuBtn.addEventListener('click',()=>{const open=menuBtn.getAttribute('aria-expanded')!=='true';
  menuBtn.setAttribute('aria-expanded',open); menu.hidden=!open;});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;menuBtn.setAttribute('aria-expanded','false');}));

// Recherche : filtre les robes de la collection
const noRes=$('noResult');
function search(q){
  const t=q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let n=0;
  document.querySelectorAll('.product').forEach(c=>{
    const txt=(c.dataset.keywords+' '+c.querySelector('.label span').textContent).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const ok=!t||t.split(/\s+/).every(w=>txt.includes(w)); c.hidden=!ok; if(ok) n++;
  });
  noRes.hidden=n>0;
}
document.querySelectorAll('form.search').forEach(f=>{
  const inp=f.querySelector('input');
  inp.addEventListener('input',()=>{document.querySelectorAll('form.search input').forEach(o=>{if(o!==inp)o.value=inp.value}); search(inp.value);});
  f.addEventListener('submit',e=>{e.preventDefault(); search(inp.value);
    menu.hidden=true; menuBtn.setAttribute('aria-expanded','false');
    $('collection').scrollIntoView({behavior:'smooth'});});
});
