(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        initScrollReveal();
        initMobileNavOverlay();
        initNavbarScroll();
        initBackToTop();
        initAnimatedCounters();
        initImageLazyLoad();
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
                rootMargin: '0px 0px -40px 0px',
            }
        );

        revealElements.forEach((el) => observer.observe(el));
    }

    function injectMobileOverlay() {
        if (document.querySelector('.mobile-nav-overlay')) return;

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

        const socialDiv = document.createElement('div');
        socialDiv.className = 'mobile-nav-social';
        socialDiv.innerHTML = `
            <a href="https://www.instagram.com/simasarchitecture/" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a>
            <a href="https://www.linkedin.com/in/simasarchitecture/" target="_blank" rel="noopener"><i class="fab fa-linkedin-in"></i></a>
            <a href="https://www.behance.net/simaassaf" target="_blank" rel="noopener"><i class="fab fa-behance"></i></a>
            <a href="mailto:simasarchitecture@gmail.com"><i class="fas fa-envelope"></i></a>
        `;
        overlay.appendChild(socialDiv);

        document.body.appendChild(overlay);

        const menuBtn = document.querySelector('.mobile-menu-btn');
        if (menuBtn) {
            menuBtn.removeAttribute('onclick');
            if (!menuBtn.querySelector('.hamburger-lines')) {
                menuBtn.innerHTML = `
                    <div class="hamburger-lines">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                `;
            }
        }
    }

    function initMobileNavOverlay() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.mobile-menu-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                toggleMobileNav();
            }
        });

        document.addEventListener('click', (e) => {
            const link = e.target.closest('.mobile-nav-overlay a:not(.mobile-nav-social a)');
            if (link) {
                closeMobileNav();
            }
        });

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

    window.toggleMobileMenu = toggleMobileNav;

    function initNavbarScroll() {
        const nav = document.querySelector('.nav');
        if (!nav) return;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    nav.classList.toggle('scrolled', window.scrollY > 80);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    function initBackToTop() {
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
        const circumference = 2 * Math.PI * 22;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference;

        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollTop = window.scrollY;
                    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const progress = docHeight > 0 ? scrollTop / docHeight : 0;

                    btn.classList.toggle('visible', scrollTop > 400);
                    circle.style.strokeDashoffset = circumference - (progress * circumference);
                    ticking = false;
                });
                ticking = true;
            }
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
        const duration = 1600;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
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

    function initImageLazyLoad() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        images.forEach(img => {
            if (img.complete) return;
            
            img.classList.add('img-loading');
            
            img.addEventListener('load', () => {
                img.classList.remove('img-loading');
            }, { once: true });
        });
    }

    function injectEnhancedFooter() {
        const oldFooter = document.querySelector('footer.footer');
        if (!oldFooter) return;

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
                        <a href="https://www.instagram.com/simasarchitecture/" target="_blank" rel="noopener" class="footer-social-link" aria-label="Instagram">
                            <i class="fab fa-instagram"></i>
                        </a>
                        <a href="https://www.linkedin.com/in/simasarchitecture/" target="_blank" rel="noopener" class="footer-social-link" aria-label="LinkedIn">
                            <i class="fab fa-linkedin-in"></i>
                        </a>
                        <a href="https://www.behance.net/simaassaf" target="_blank" rel="noopener" class="footer-social-link" aria-label="Behance">
                            <i class="fab fa-behance"></i>
                        </a>
                        <a href="mailto:simasarchitecture@gmail.com" class="footer-social-link" aria-label="Email">
                            <i class="fas fa-envelope"></i>
                        </a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} Sima Assaf. All rights reserved.</p>
                <a href="mailto:simasarchitecture@gmail.com">simasarchitecture@gmail.com</a>
            </div>
        `;

        oldFooter.replaceWith(newFooter);
    }
})();
