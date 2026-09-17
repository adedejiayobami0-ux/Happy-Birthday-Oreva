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

// Birthday wall (live + shared through Supabase)
const wishForm = document.getElementById('wishForm');
const wishList = document.getElementById('wishList');

const SUPABASE_URL = 'https://nlcgidgzchqhsgvjgpnu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6mPDzMyno65kgn0sro7UVA_L0NBNhNi';
const WISHES_ENDPOINT = `${SUPABASE_URL}/rest/v1/birthday_wishes`;

function escapeHTML(str = '') {
  return String(str).replace(/[&<>\"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function formatWishTime(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function renderWishes(wishes) {
  if (!wishList) return;

  if (!wishes.length) {
    wishList.innerHTML = `
      <article class=\"wish-card\">
        <div class=\"wish-card-top\">
          <h4>Be the first ♡</h4>
          <span class=\"wish-time\">birthday wall</span>
        </div>
        <p>Leave Oreva the first birthday message.</p>
      </article>
    `;
    return;
  }

  wishList.innerHTML = wishes.map((wish) => `
    <article class=\"wish-card\">
      <div class=\"wish-card-top\">
        <h4>${escapeHTML(wish.name)}</h4>
        <span class=\"wish-time\">${escapeHTML(formatWishTime(wish.created_at))}</span>
      </div>
      <p>${escapeHTML(wish.message)}</p>
    </article>
  `).join('');
}

async function loadWishes() {
  if (!wishList) return;
  wishList.innerHTML = `<article class=\"wish-card\"><p>Loading birthday wishes…</p></article>`;

  try {
    const response = await fetch(
      `${WISHES_ENDPOINT}?select=id,name,message,created_at&order=created_at.desc&limit=50`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Could not load wishes (${response.status})`);
    }

    const wishes = await response.json();
    renderWishes(wishes);
  } catch (error) {
    console.error(error);
    wishList.innerHTML = `
      <article class=\"wish-card\">
        <div class=\"wish-card-top\">
          <h4>Birthday wall</h4>
          <span class=\"wish-time\">not connected yet</span>
        </div>
        <p>The shared wall could not load. Make sure the Supabase table and policies were created successfully.</p>
      </article>
    `;
  }
}

if (wishForm) {
  wishForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nameInput = document.getElementById('wishName');
    const messageInput = document.getElementById('wishMessage');
    const submitButton = wishForm.querySelector('button[type=\"submit\"]');

    const name = nameInput?.value.trim();
    const message = messageInput?.value.trim();

    if (!name || !message) return;

    if (name.length > 40 || message.length > 2000) {
      alert('Please keep your name under 40 characters and your message under 2,000 characters.');
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Posting…';
    }

    try {
      const response = await fetch(WISHES_ENDPOINT, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({ name, message })
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Could not post wish (${response.status}): ${details}`);
      }

      wishForm.reset();
      launchConfetti(26);
      await loadWishes();

      const firstWish = wishList?.querySelector('.wish-card');
      if (firstWish) firstWish.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      console.error(error);
      alert('Your birthday message could not be posted yet. Please try again in a moment.');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Post to the wall';
      }
    }
  });
}

loadWishes();
