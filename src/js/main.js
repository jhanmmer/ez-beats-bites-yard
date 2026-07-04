/**
 * EZ Beats & Bites — Main UI Script
 * Handles: AOS init, navbar scroll, mobile nav (bottom sheet), live status badge
 */

// ── AOS Init ──
AOS.init({ duration: 800, once: true, offset: 30 });

// ── Navbar scroll effect (Smart Header) & Scroll to Top ──
const nav = document.getElementById('main-nav');
const scrollTopBtn = document.getElementById('scroll-to-top');
let lastScrollY = window.scrollY;

function handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Auto-hide logic
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past 100px - hide navbar
        nav.classList.add('nav-hidden');
    } else {
        // Scrolling up - show navbar
        nav.classList.remove('nav-hidden');
    }
    lastScrollY = currentScrollY;

    // Scrolled style logic
    if (currentScrollY > 60) {
        nav.classList.add('bg-brand-cream/95', 'backdrop-blur-lg', 'shadow-sm', 'py-2', 'nav-scrolled');
        nav.classList.remove('py-3', 'lg:py-4');
    } else {
        nav.classList.remove('bg-brand-cream/95', 'backdrop-blur-lg', 'shadow-sm', 'py-2', 'nav-scrolled');
        nav.classList.add('py-3', 'lg:py-4');
    }

    // Scroll to Top button visibility
    if (scrollTopBtn) {
        if (currentScrollY > 500) {
            scrollTopBtn.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
            scrollTopBtn.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
        } else {
            scrollTopBtn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
            scrollTopBtn.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
        }
    }
}
window.addEventListener('scroll', handleScroll);
handleScroll();

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

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

// ── Active Section Indicator (Intersection Observer) ──
const sections = document.querySelectorAll('section[id], footer[id]');
const navLinks = document.querySelectorAll('.nav-link');
const mobileLinks = document.querySelectorAll('.mobile-link');

const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -70% 0px', // Trigger when section is near the top third of viewport
    threshold: 0
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute('id');
            
            // Update desktop nav
            navLinks.forEach(link => {
                link.classList.remove('active-section');
                if (link.getAttribute('href') === `#${currentId}`) {
                    link.classList.add('active-section');
                }
            });
            
            // Update mobile nav
            mobileLinks.forEach(link => {
                link.classList.remove('active-section');
                if (link.getAttribute('href') === `#${currentId}`) {
                    link.classList.add('active-section');
                }
            });
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});
