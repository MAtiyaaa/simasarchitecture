
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        initScrollReveal();
        initMobileNavOverlay();
        initNavbarScroll();
        initBackToTop();
        initAnimatedCounters();
        initParallax();
        injectEnhancedFooter();
        injectMobileOverlay();
    }
    function initScrollReveal() {
        const revealElements = document.querySelectorAll(
            '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-fade'
        );

        if (!revealElements.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -60px 0px',
            }
        );

        revealElements.forEach((el) => observer.observe(el));
    }
    function injectMobileOverlay() {
        // Check if overlay already exists
        if (document.querySelector('.mobile-nav-overlay')) return;

        // Determine which page is active
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

        const pages = [
            { href: 'index.html', label: 'Home' },
            { href: 'portfolio.html', label: 'Portfolio' },
            { href: 'projects.html', label: 'Projects' },
            { href: 'thesis.html', label: 'Thesis' },
            { href: 'artworks.html', label: 'Artworks' },
            { href: 'about.html', label: 'About' },
        ];

        const overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';

        pages.forEach((page) => {
            const a = document.createElement('a');
            a.href = page.href;
            a.textContent = page.label;
            if (currentPath === page.href || (currentPath === '' && page.href === 'index.html')) {
                a.classList.add('active');
            }
            overlay.appendChild(a);
        });

        // Add social links
        const socialDiv = document.createElement('div');
        socialDiv.className = 'mobile-nav-social';
        socialDiv.innerHTML = `
            <a href="https://www.instagram.com/simasarchitecture/" target="_blank"><i class="fab fa-instagram"></i></a>
            <a href="https://www.linkedin.com/in/simasarchitecture/" target="_blank"><i class="fab fa-linkedin-in"></i></a>
            <a href="https://www.behance.net/simaassaf" target="_blank"><i class="fab fa-behance"></i></a>
            <a href="mailto:simasarchitecture@gmail.com"><i class="fas fa-envelope"></i></a>
        `;
        overlay.appendChild(socialDiv);

        document.body.appendChild(overlay);

        // Replace hamburger button content
        const menuBtn = document.querySelector('.mobile-menu-btn');
        if (menuBtn) {
            // Remove old onclick
            menuBtn.removeAttribute('onclick');
            menuBtn.innerHTML = `
                <div class="hamburger-lines">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
        }
    }

    function initMobileNavOverlay() {
        // Use event delegation since button is already in DOM
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.mobile-menu-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                toggleMobileNav();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMobileNav();
            }
        });
    }

    function toggleMobileNav() {
        const overlay = document.querySelector('.mobile-nav-overlay');
        const btn = document.querySelector('.mobile-menu-btn');
        if (!overlay || !btn) return;

        const isOpen = overlay.classList.contains('is-open');

        if (isOpen) {
            closeMobileNav();
        } else {
            overlay.classList.add('is-open');
            btn.classList.add('is-active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMobileNav() {
        const overlay = document.querySelector('.mobile-nav-overlay');
        const btn = document.querySelector('.mobile-menu-btn');
        if (!overlay || !btn) return;

        overlay.classList.remove('is-open');
        btn.classList.remove('is-active');
        document.body.style.overflow = '';
    }

    // Make toggleMobileMenu available globally (replaces old function)
    window.toggleMobileMenu = toggleMobileNav;

    function initNavbarScroll() {
        const nav = document.querySelector('.nav');
        if (!nav) return;

        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            nav.classList.toggle('scrolled', scrollY > 80);
            lastScroll = scrollY;
        }, { passive: true });
    }

    function initBackToTop() {
        // Create button
        const btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Back to top');
        btn.innerHTML = `
            <svg viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" />
            </svg>
            <i class="fas fa-arrow-up" style="position:relative;z-index:2;"></i>
        `;
        document.body.appendChild(btn);

        const circle = btn.querySelector('circle');
        const circumference = 2 * Math.PI * 22; // ~138
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference;

        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? scrollTop / docHeight : 0;

            // Show/hide
            btn.classList.toggle('visible', scrollTop > 400);

            // Update progress ring
            circle.style.strokeDashoffset = circumference - (progress * circumference);
        }, { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    function initAnimatedCounters() {
        const counters = document.querySelectorAll('.stat-value[data-count]');
        if (!counters.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        counters.forEach((el) => observer.observe(el));
    }

    function animateCounter(el) {
        const target = el.getAttribute('data-count');
        const suffix = el.getAttribute('data-suffix') || '';
        const isDecimal = target.includes('.');
        const targetNum = parseFloat(target);
        const duration = 1800;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = targetNum * eased;

            if (isDecimal) {
                el.textContent = current.toFixed(2) + suffix;
            } else {
                el.textContent = Math.floor(current) + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target + suffix;
            }
        }

        requestAnimationFrame(update);
    }
    function initParallax() {
        const heroBg = document.querySelector('.hero-bg, .hero-bg-parallax');
        if (!heroBg) return;

        // Only on desktop
        if (window.innerWidth < 1024) return;

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const before = heroBg.querySelector('::before') || heroBg;
            heroBg.style.transform = `translateY(${scrollY * 0.15}px)`;
        }, { passive: true });
    }
    function injectEnhancedFooter() {
        // Find existing footer and replace it
        const oldFooter = document.querySelector('footer.footer');
        if (!oldFooter) return;

        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

        const pages = [
            { href: 'index.html', label: 'Home' },
            { href: 'portfolio.html', label: 'Portfolio' },
            { href: 'projects.html', label: 'Projects' },
            { href: 'thesis.html', label: 'Thesis' },
            { href: 'artworks.html', label: 'Artworks' },
            { href: 'about.html', label: 'About' },
        ];

        const navLinksHTML = pages
            .map((p) => `<li><a href="${p.href}">${p.label}</a></li>`)
            .join('');

        const newFooter = document.createElement('footer');
        newFooter.className = 'enhanced-footer';
        newFooter.innerHTML = `
            <div class="footer-inner">
                <div class="footer-brand">
                    <a href="index.html" class="footer-logo">SIMA ASSAF</a>
                    <p>Architecture student at American University in Dubai, passionate about sustainable design and human-centered spaces.</p>
                </div>
                <div class="footer-nav">
                    <h4>Navigation</h4>
                    <ul class="footer-nav-links">
                        ${navLinksHTML}
                    </ul>
                </div>
                <div class="footer-social-col">
                    <h4>Connect</h4>
                    <div class="footer-social-links">
                        <a href="https://www.instagram.com/simasarchitecture/" target="_blank" class="footer-social-link" aria-label="Instagram">
                            <i class="fab fa-instagram"></i>
                        </a>
                        <a href="https://www.linkedin.com/in/simasarchitecture/" target="_blank" class="footer-social-link" aria-label="LinkedIn">
                            <i class="fab fa-linkedin-in"></i>
                        </a>
                        <a href="https://www.behance.net/simaassaf" target="_blank" class="footer-social-link" aria-label="Behance">
                            <i class="fab fa-behance"></i>
                        </a>
                        <a href="mailto:simasarchitecture@gmail.com" class="footer-social-link" aria-label="Email">
                            <i class="fas fa-envelope"></i>
                        </a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 Sima Assaf. All rights reserved.</p>
                <a href="mailto:simasarchitecture@gmail.com">simasarchitecture@gmail.com</a>
            </div>
        `;

        oldFooter.replaceWith(newFooter);
    }
})();
