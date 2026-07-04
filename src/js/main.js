/**
 * EZ Beats & Bites — Main UI Script
 * Handles: AOS init, navbar scroll, mobile nav (bottom sheet), live status badge
 */

// ── AOS Init ──
AOS.init({ duration: 800, once: true, offset: 30 });

// ── Navbar scroll effect ──
const nav = document.getElementById('main-nav');
function handleScroll() {
    if (window.scrollY > 60) {
        nav.classList.add('bg-brand-cream/95', 'backdrop-blur-lg', 'shadow-sm', 'py-2', 'nav-scrolled');
        nav.classList.remove('py-3', 'lg:py-4');
    } else {
        nav.classList.remove('bg-brand-cream/95', 'backdrop-blur-lg', 'shadow-sm', 'py-2', 'nav-scrolled');
        nav.classList.add('py-3', 'lg:py-4');
    }
}
window.addEventListener('scroll', handleScroll);
handleScroll();

// ── Mobile Nav (Bottom Sheet) ──
const mobileNav = document.getElementById('mobile-nav');
const backdrop = document.getElementById('mobile-backdrop');

function openSheet() {
    mobileNav.classList.add('is-open');
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}
function closeSheet() {
    mobileNav.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
}

document.getElementById('mobile-open').addEventListener('click', openSheet);
document.getElementById('mobile-close').addEventListener('click', closeSheet);
backdrop.addEventListener('click', closeSheet);
document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', closeSheet);
});

// ── Live Open/Closed Badge ──
function updateStatus() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    // Closed Mondays (1) and Tuesdays (2)
    const isClosedDay = day === 1 || day === 2;
    const isOpen = !isClosedDay && hour >= 15 && hour < 22;

    const badge = `
        <div class="status-badge ${isOpen ? 'open' : 'closed'}">
            <span class="status-dot"></span>
            ${isOpen ? 'Open Now' : (isClosedDay ? 'Closed Today' : 'Closed')}
        </div>
    `;
    const desktopEl = document.getElementById('nav-status');
    const mobileEl = document.getElementById('nav-status-mobile');
    const mobileNavEl = document.getElementById('mobile-status');
    if (desktopEl) desktopEl.innerHTML = badge;
    if (mobileEl) mobileEl.innerHTML = badge;
    if (mobileNavEl) mobileNavEl.innerHTML = badge;
}
updateStatus();
setInterval(updateStatus, 60000);
