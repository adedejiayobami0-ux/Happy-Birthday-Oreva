const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

let taps = 0;
const egg = document.getElementById('easterEgg');
const secret = document.getElementById('secret');
const close = document.getElementById('closeSecret');

if (egg) {
  egg.addEventListener('click', () => {
    taps += 1;
    if (taps >= 5) {
      secret.classList.add('show');
      secret.setAttribute('aria-hidden', 'false');
      taps = 0;
      launchConfetti(22);
    }
  });
}

function closeSecret(){
  secret.classList.remove('show');
  secret.setAttribute('aria-hidden','true');
}
if (close) close.addEventListener('click', closeSecret);
if (secret) {
  secret.addEventListener('click', e => { if(e.target === secret) closeSecret(); });
}
document.addEventListener('keydown', e => { if(e.key === 'Escape' && secret) closeSecret(); });

const confettiLayer = document.getElementById('confettiLayer');
function launchConfetti(count = 18) {
  if (!confettiLayer) return;
  const pieces = ['♡', '✦', '❀', '•'];
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.textContent = pieces[Math.floor(Math.random() * pieces.length)];
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.fontSize = `${14 + Math.random() * 16}px`;
    confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 3800);
  }
}
window.addEventListener('load', () => setTimeout(() => launchConfetti(16), 400));

// Mini-like buttons
const likeButtons = document.querySelectorAll('.like-btn');
likeButtons.forEach((button, index) => {
  const countEl = button.closest('.social-post')?.querySelector('.like-count');
  const key = `oreva-like-${index}`;
  let liked = localStorage.getItem(key) === 'true';

  const update = () => {
    button.classList.toggle('liked', liked);
    button.textContent = liked ? '♥' : '♡';
    if (countEl) {
      const base = Number(countEl.dataset.base || countEl.textContent || '0');
      countEl.textContent = String(base + (liked ? 1 : 0));
    }
  };

  if (countEl && !countEl.dataset.base) countEl.dataset.base = countEl.textContent.trim();
  update();

  button.addEventListener('click', () => {
    liked = !liked;
    localStorage.setItem(key, String(liked));
    update();
  });
});

// Birthday wall (browser-local on static hosting)
const wishForm = document.getElementById('wishForm');
const wishList = document.getElementById('wishList');
const STORAGE_KEY = 'oreva-birthday-wall';
const starterWishes = [
  {
    name: 'Ayo',
    message: 'Happy birthday Oreva ♡ Thank you for being thoughtful, intentional and one of my favorite people in the world.',
    createdAt: 'Birthday wish'
  },
  {
    name: 'Someone who loves you',
    message: 'Wishing you joy, peace, books, laughter and a year that is as beautiful as the care you give to other people.',
    createdAt: 'Add yours below'
  }
];

function escapeHTML(str) {
  return str.replace(/[&<>"]+/g, (match) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[match] || match));
}

function getSavedWishes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWishes(wishes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes.slice(0, 30)));
}

function renderWishes() {
  if (!wishList) return;
  const wishes = [...getSavedWishes(), ...starterWishes];
  wishList.innerHTML = wishes.map((wish) => `
    <article class="wish-card">
      <div class="wish-card-top">
        <h4>${escapeHTML(wish.name)}</h4>
        <span class="wish-time">${escapeHTML(wish.createdAt)}</span>
      </div>
      <p>${escapeHTML(wish.message)}</p>
    </article>
  `).join('');
}

renderWishes();

if (wishForm) {
  wishForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('wishName')?.value.trim();
    const message = document.getElementById('wishMessage')?.value.trim();
    if (!name || !message) return;

    const wishes = getSavedWishes();
    wishes.unshift({
      name,
      message,
      createdAt: 'Just now'
    });

    saveWishes(wishes);
    renderWishes();
    wishForm.reset();
    launchConfetti(26);

    const firstWish = wishList?.querySelector('.wish-card');
    if (firstWish) firstWish.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}
