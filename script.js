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
egg.addEventListener('click', () => {
  taps += 1;
  if (taps >= 5) {
    secret.classList.add('show');
    secret.setAttribute('aria-hidden', 'false');
    taps = 0;
  }
});
function closeSecret(){secret.classList.remove('show');secret.setAttribute('aria-hidden','true')}
close.addEventListener('click', closeSecret);
secret.addEventListener('click', e => { if(e.target === secret) closeSecret(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeSecret(); });
