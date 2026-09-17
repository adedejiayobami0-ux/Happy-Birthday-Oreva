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
const wishPhoto = document.getElementById('wishPhoto');
const photoPreviewWrap = document.getElementById('photoPreviewWrap');
const photoPreview = document.getElementById('photoPreview');
const videoPreview = document.getElementById('videoPreview');
const removePhoto = document.getElementById('removePhoto');

const SUPABASE_URL = 'https://nlcgidgzchqhsgvjgpnu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6mPDzMyno65kgn0sro7UVA_L0NBNhNi';
const WISHES_ENDPOINT = `${SUPABASE_URL}/rest/v1/birthday_wishes`;
const STORAGE_BUCKET = 'birthday-wall-images';
const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']);

function escapeHTML(str = '') {
  return String(str).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function formatWishTime(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(date);
}

function isVideoType(type = '') {
  return type.startsWith('video/');
}

function isVideoUrl(url = '') {
  return /\.(mp4|mov|webm)(?:[?#].*)?$/i.test(url);
}

function renderWishMedia(url, name) {
  const safeUrl = escapeHTML(url);
  const safeName = escapeHTML(name);
  if (isVideoUrl(url)) {
    return `<video class="wish-media wish-video" controls playsinline preload="metadata"><source src="${safeUrl}">Your browser does not support video.</video>`;
  }
  return `<img class="wish-media wish-photo" src="${safeUrl}" alt="Media shared by ${safeName}" loading="lazy">`;
}

function renderWishes(wishes) {
  if (!wishList) return;
  if (!wishes.length) {
    wishList.innerHTML = `
      <article class="wish-card">
        <div class="wish-card-top">
          <h4>Be the first ♡</h4>
          <span class="wish-time">birthday wall</span>
        </div>
        <p>Leave Oreva the first birthday message.</p>
      </article>`;
    return;
  }

  wishList.innerHTML = wishes.map((wish) => `
    <article class="wish-card">
      <div class="wish-card-top">
        <h4>${escapeHTML(wish.name)}</h4>
        <span class="wish-time">${escapeHTML(formatWishTime(wish.created_at))}</span>
      </div>
      ${wish.image_url ? renderWishMedia(wish.image_url, wish.name) : ''}
      <p>${escapeHTML(wish.message)}</p>
    </article>
  `).join('');
}

async function loadWishes() {
  if (!wishList) return;
  wishList.innerHTML = `<article class="wish-card"><p>Loading birthday wishes…</p></article>`;
  try {
    const response = await fetch(
      `${WISHES_ENDPOINT}?select=id,name,message,image_url,created_at&order=created_at.desc&limit=100`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!response.ok) throw new Error(`Could not load wishes (${response.status})`);
    renderWishes(await response.json());
  } catch (error) {
    console.error(error);
    wishList.innerHTML = `
      <article class="wish-card">
        <div class="wish-card-top"><h4>Birthday wall</h4><span class="wish-time">not connected yet</span></div>
        <p>The shared wall could not load. Check the Supabase table and storage policies.</p>
      </article>`;
  }
}

function clearPhotoPreview() {
  if (wishPhoto) wishPhoto.value = '';
  if (photoPreview) {
    photoPreview.removeAttribute('src');
    photoPreview.hidden = true;
  }
  if (videoPreview) {
    videoPreview.pause();
    videoPreview.removeAttribute('src');
    videoPreview.load();
    videoPreview.hidden = true;
  }
  if (photoPreviewWrap) photoPreviewWrap.hidden = true;
}

if (wishPhoto) {
  wishPhoto.addEventListener('change', () => {
    const file = wishPhoto.files?.[0];
    if (!file) return clearPhotoPreview();
    if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
      alert('Please choose a JPG, PNG, WEBP, MP4, MOV or WEBM file.');
      return clearPhotoPreview();
    }
    if (file.size > MAX_MEDIA_BYTES) {
      alert('Please choose a file smaller than 25MB.');
      return clearPhotoPreview();
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (photoPreview) photoPreview.hidden = true;
      if (videoPreview) videoPreview.hidden = true;
      if (isVideoType(file.type)) {
        if (videoPreview) {
          videoPreview.src = reader.result;
          videoPreview.hidden = false;
        }
      } else if (photoPreview) {
        photoPreview.src = reader.result;
        photoPreview.hidden = false;
      }
      if (photoPreviewWrap) photoPreviewWrap.hidden = false;
    };
    reader.readAsDataURL(file);
  });
}
if (removePhoto) removePhoto.addEventListener('click', clearPhotoPreview);

function safeExtension(file) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'video/mp4') return 'mp4';
  if (file.type === 'video/quicktime') return 'mov';
  if (file.type === 'video/webm') return 'webm';
  return 'jpg';
}

async function uploadWishMedia(file) {
  if (!file) return null;
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${safeExtension(file)}`;
  const objectPath = `uploads/${fileName}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${objectPath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': file.type,
      'x-upsert': 'false'
    },
    body: file
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Media upload failed (${response.status}): ${details}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${objectPath}`;
}

if (wishForm) {
  wishForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nameInput = document.getElementById('wishName');
    const messageInput = document.getElementById('wishMessage');
    const submitButton = wishForm.querySelector('button[type="submit"]');
    const name = nameInput?.value.trim();
    const message = messageInput?.value.trim();
    const file = wishPhoto?.files?.[0] || null;

    if (!name || !message) return;
    if (name.length > 40 || message.length > 2000) {
      alert('Please keep your name under 40 characters and your message under 2,000 characters.');
      return;
    }
    if (file && (!ALLOWED_MEDIA_TYPES.has(file.type) || file.size > MAX_MEDIA_BYTES)) {
      alert('Your file must be JPG, PNG, WEBP, MP4, MOV or WEBM and smaller than 25MB.');
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = file ? 'Uploading media & posting…' : 'Posting…';
    }

    try {
      const image_url = await uploadWishMedia(file);
      const response = await fetch(WISHES_ENDPOINT, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({ name, message, image_url })
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Could not post wish (${response.status}): ${details}`);
      }

      wishForm.reset();
      clearPhotoPreview();
      launchConfetti(26);
      await loadWishes();
      wishList?.querySelector('.wish-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      console.error(error);
      alert('Your birthday post could not be added yet. Please try again.');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Post to the wall';
      }
    }
  });
}

loadWishes();
