document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, initializing enhanced components...');
    setTimeout(() => {
        const pdfViewer = initPdfViewer();
        const cvViewer = initCvViewer();
        const themeToggler = initThemeToggler();
        const pageNavigation = initPageNavigation();
        initSocialButtons();
        initMobileOptimizations();
        initAnimations();
        initFooterNavigation();
    initImageLightbox();
        document.body.classList.add('page-loaded');
        addTactileFeedback();
        window.portfolioApp = {
            pdfViewer,
            cvViewer,
            themeToggler,
            pageNavigation
        };
    }, 100);
});
function initPdfViewer() {
    const pdfViewer = {
        pdfDoc: null,
        currentPage: 1,
        scale: 1.0,
        pdfPath: 'pdf/portfolio.pdf',
        viewerContainer: document.getElementById('pdf-viewer'),
        loadingAnimation: document.querySelector('.pdf-container .loading-animation'),
        renderedPages: {},
        touchStartX: 0,
        touchEndX: 0,
        init() {
            console.log('Initializing enhanced PDF viewer...');
            if (!this.viewerContainer) {
                console.error('PDF viewer container not found!');
                return;
            }
            this.checkPDFJSAvailability();
            this.addEventListeners();
            this.loadPDF();
            this.setupSwipeDetection();
            this.setupKeyboardNavigation();
            this.setupPinchZoom();
        },
        checkPDFJSAvailability() {
            if (!window.pdfjsLib) {
                console.error('PDF.js library not found! Trying to reload...');
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
                script.onload = () => {
                    console.log('PDF.js loaded dynamically');
                    window.pdfjsLib.GlobalWorkerOptions = window.pdfjsLib.GlobalWorkerOptions || {};
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                    this.loadPDF();
                };
                document.head.appendChild(script);
            }
        },
        addEventListeners() {
            const prevArrow = document.getElementById('prev-page-arrow');
            const nextArrow = document.getElementById('next-page-arrow');
            const downloadBtn = document.getElementById('download-pdf');
            if (prevArrow) {
                prevArrow.addEventListener('click', () => {
                    this.prevPage();
                    this.addClickEffect(prevArrow);
                });
            }
            if (nextArrow) {
                nextArrow.addEventListener('click', () => {
                    this.nextPage();
                    this.addClickEffect(nextArrow);
                });
            }
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    this.downloadPDF();
                    this.addClickEffect(downloadBtn);
                });
            }
        },
        addClickEffect(element) {
            if (!element) return;
            element.classList.add('button-clicked');
            setTimeout(() => {
                element.classList.remove('button-clicked');
            }, 300);
        },
        async loadPDF() {
            try {
                console.log('Starting enhanced PDF loading process...');
                if (!window.pdfjsLib) {
                    throw new Error('PDF.js library failed to load. Check your internet connection or CDN availability.');
                }
                await this.testPDFAccess();
                const progressBar = document.getElementById('progress-bar');
                if (progressBar) {
                    progressBar.style.width = '0%';
                    progressBar.classList.add('loading-pulse');
                }
                const loadingTask = pdfjsLib.getDocument(this.pdfPath);
                loadingTask.onProgress = (progress) => {
                    const percentLoaded = progress.loaded / progress.total * 100;
                    if (progressBar) {
                        progressBar.style.width = `${Math.round(percentLoaded)}%`;
                    }
                };
                this.pdfDoc = await loadingTask.promise;
                console.log(`PDF loaded successfully with ${this.pdfDoc.numPages} pages`);
                if (progressBar) {
                    progressBar.classList.remove('loading-pulse');
                }
                await this.renderPage(this.currentPage);
                if (this.loadingAnimation) {
                    this.loadingAnimation.style.opacity = '0';
                    setTimeout(() => {
                        this.loadingAnimation.style.display = 'none';
                    }, 300);
                }
                if (window.innerWidth <= 768) {
                    const swipeIndicator = document.querySelector('.swipe-indicator');
                    if (swipeIndicator) {
                        setTimeout(() => {
                            swipeIndicator.classList.add('show-swipe-hint');
                            setTimeout(() => {
                                swipeIndicator.classList.remove('show-swipe-hint');
                            }, 3000);
                        }, 1000);
                    }
                }
            } catch (error) {
                console.error('PDF Loading Error:', error);
                if (this.loadingAnimation) {
                    this.loadingAnimation.innerHTML = `
                        <div class=__STRING_0__>!</div>
                        <p>Failed to load PDF: ${error.message}</p>
                        <p class=__STRING_1__>
                            Ensure __STRING_81__ exists and is served via a web server.
                            <br><a href=__STRING_2__ target=__STRING_3__ class=__STRING_4__>Try opening the PDF directly</a>
                        </p>
                    `;
                }
            }
        },
        async testPDFAccess() {
            try {
                console.log('Testing PDF access...');
                const response = await fetch(this.pdfPath, { method: 'HEAD' });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                console.log('PDF file is accessible');
            } catch (error) {
                console.error('PDF access test failed:', error);
                throw new Error(`Cannot access PDF file at ${this.pdfPath}: ${error.message}`);
            }
        },
        async renderPage(pageNumber) {
            if (!this.viewerContainer || !this.pdfDoc) return;
            try {
                console.log(`Rendering CV page ${pageNumber} with scale ${this.scale}`);
                const page = await this.pdfDoc.getPage(pageNumber);
                const viewport = page.getViewport({ scale: this.scale });
                const renderNewPage = () => {
                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'pdf-page';
                    pageDiv.dataset.pageNumber = pageNumber;
                    pageDiv.style.opacity = '0';
                    pageDiv.style.transform = 'translateY(20px)';
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    pageDiv.appendChild(canvas);
                    this.viewerContainer.appendChild(pageDiv);
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    page.render(renderContext).promise.then(() => {
                        this.currentPage = pageNumber;
                        setTimeout(() => {
                            pageDiv.style.opacity = '1';
                            pageDiv.style.transform = 'translateY(0)';
                        }, 50);
                        console.log(`CV page ${pageNumber} rendered successfully`);
                    });
                };
                if (this.viewerContainer.firstChild) {
                    this.viewerContainer.firstChild.style.opacity = '0';
                    setTimeout(() => {
                        this.viewerContainer.innerHTML = '';
                        renderNewPage();
                    }, 300);
                } else {
                    renderNewPage();
                }
            } catch (error) {
                console.error('Error rendering CV page:', error);
                this.viewerContainer.innerHTML = `
                    <div class=__STRING_5__>
                        <div class=__STRING_6__>!</div>
                        <p>Error rendering CV: ${error.message}</p>
                        <button class=__STRING_7__ onclick=__STRING_8__>Retry</button>
                        <a href=__STRING_9__ target=__STRING_10__ class=__STRING_11__>Open CV in default viewer</a>
                    </div>
                `;
            }
        },
        showPage(pageNumber) {
            Object.values(this.renderedPages).forEach(pageDiv => {
                pageDiv.style.display = 'none';
            });
            if (this.renderedPages[pageNumber]) {
                const pageDiv = this.renderedPages[pageNumber];
                pageDiv.style.display = 'block';
                setTimeout(() => {
                    pageDiv.style.opacity = '1';
                    pageDiv.style.transform = 'translateY(0)';
                }, 50);
                this.currentPage = pageNumber;
                this.updatePageIndicators();
            }
        },
        updatePageIndicators() {
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.style.width = `${(this.currentPage / this.pdfDoc.numPages) * 100}%`;
            }
            this.addPageNumberEffect();
            this.updateArrowVisibility();
        },
        updateArrowVisibility() {
            const prevArrow = document.getElementById('prev-page-arrow');
            const nextArrow = document.getElementById('next-page-arrow');
            if (prevArrow) {
                if (this.currentPage <= 1) {
                    prevArrow.classList.add('disabled-arrow');
                } else {
                    prevArrow.classList.remove('disabled-arrow');
                }
            }
            if (nextArrow) {
                if (this.currentPage >= this.pdfDoc.numPages) {
                    nextArrow.classList.add('disabled-arrow');
                } else {
                    nextArrow.classList.remove('disabled-arrow');
                }
            }
        },
        addPageNumberEffect() {
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.classList.add('progress-pulse');
                setTimeout(() => {
                    progressBar.classList.remove('progress-pulse');
                }, 300);
            }
        },
        async prevPage() {
            if (this.currentPage <= 1) return;
            console.log('Navigating to previous page with animation');
            const newPage = this.currentPage - 1;
            const currentPageDiv = this.renderedPages[this.currentPage];
            if (currentPageDiv) {
                currentPageDiv.style.transform = 'translateX(100px)';
                currentPageDiv.style.opacity = '0';
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
                setTimeout(async () => {
                    await this.renderPage(newPage);
                    const newPageDiv = this.renderedPages[newPage];
                    if (newPageDiv) {
                        newPageDiv.style.transform = 'translateX(-100px)';
                        newPageDiv.style.opacity = '0';
                        newPageDiv.style.display = 'block';
                        setTimeout(() => {
                            newPageDiv.style.transform = 'translateX(0)';
                            newPageDiv.style.opacity = '1';
                        }, 50);
                    }
                }, 250);
            } else {
                await this.renderPage(newPage);
            }
        },
        async nextPage() {
            if (!this.pdfDoc || this.currentPage >= this.pdfDoc.numPages) return;
            console.log('Navigating to next page with animation');
            const newPage = this.currentPage + 1;
            const currentPageDiv = this.renderedPages[this.currentPage];
            if (currentPageDiv) {
                currentPageDiv.style.transform = 'translateX(-100px)';
                currentPageDiv.style.opacity = '0';
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
                setTimeout(async () => {
                    await this.renderPage(newPage);
                    const newPageDiv = this.renderedPages[newPage];
                    if (newPageDiv) {
                        newPageDiv.style.transform = 'translateX(100px)';
                        newPageDiv.style.opacity = '0';
                        newPageDiv.style.display = 'block';
                        setTimeout(() => {
                            newPageDiv.style.transform = 'translateX(0)';
                            newPageDiv.style.opacity = '1';
                        }, 50);
                    }
                }, 250);
            } else {
                await this.renderPage(newPage);
            }
        },
        toggleZoom(e) {
            const rect = this.viewerContainer.getBoundingClientRect();
            const x = e.changedTouches[0].clientX - rect.left;
            const y = e.changedTouches[0].clientY - rect.top;
            if (this.scale === 1.0) {
                this.zoomTo(2.0, x, y);
            } else {
                this.zoomTo(1.0);
            }
        },
        zoomTo(newScale, centerX, centerY) {
            const oldScale = this.scale;
            this.scale = newScale;
            const currentPageDiv = this.renderedPages[this.currentPage];
            if (!currentPageDiv) return;
            if (centerX && centerY && oldScale !== newScale) {
                const scaleChange = newScale / oldScale;
                currentPageDiv.style.transformOrigin = `${centerX}px ${centerY}px`;
                currentPageDiv.style.transition = 'transform 0.3s ease-out';
                if (newScale > oldScale) {
                    currentPageDiv.style.transform = `scale(${scaleChange})`;
                } else {
                    currentPageDiv.style.transform = 'none';
                }
            } else {
                this.updatePage();
            }
        },
        async updatePage() {
            this.renderedPages = {};
            this.viewerContainer.innerHTML = '';
            await this.renderPage(this.currentPage);
        },
        downloadPDF() {
            const link = document.createElement('a');
            link.href = this.pdfPath;
            link.download = 'sima_assaf_portfolio.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            const btn = document.getElementById('download-pdf');
            if (btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class=__STRING_12__></i><span>Downloaded</span>';
                btn.classList.add('download-success');
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.classList.remove('download-success');
                }, 2000);
            }
            this.showNotification('Downloaded!');
        },
        showNotification(message) {
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(notification => {
                document.body.removeChild(notification);
            });
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.innerHTML = `
                <div class=__STRING_13__>
                    <i class=__STRING_14__></i>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.classList.add('show-notification');
                if (navigator.vibrate) {
                    navigator.vibrate([15, 30, 15]);
                }
                setTimeout(() => {
                    notification.classList.remove('show-notification');
                    notification.classList.add('hide-notification');
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 300);
                }, 3000);
            }, 10);
        },
        setupSwipeDetection() {
            if (!this.viewerContainer) return;
            this.viewerContainer.addEventListener('touchstart', e => {
                this.touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            this.viewerContainer.addEventListener('touchend', e => {
                this.touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
            }, { passive: true });
        },
        handleSwipe() {
            const threshold = 50;
            const swipeDistance = this.touchEndX - this.touchStartX;
            if (Math.abs(swipeDistance) > threshold) {
                if (swipeDistance < 0) {
                    this.nextPage();
                } else {
                    this.prevPage();
                }
            }
        },
        setupKeyboardNavigation() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    this.prevPage();
                } else if (e.key === 'ArrowRight') {
                    this.nextPage();
                } else if (e.key === '+') {
                    this.zoomTo(this.scale + 0.2);
                } else if (e.key === '-') {
                    this.zoomTo(Math.max(0.5, this.scale - 0.2));
                }
            });
        },
        setupPinchZoom() {
            if (!this.viewerContainer) return;
            let initialDistance = 0;
            let initialScale = 1;
            this.viewerContainer.addEventListener('touchstart', e => {
                if (e.touches.length === 2) {
                    initialDistance = getDistance(e.touches[0], e.touches[1]);
                    initialScale = this.scale;
                }
            }, { passive: true });
            this.viewerContainer.addEventListener('touchmove', e => {
                if (e.touches.length === 2) {
                    const currentDistance = getDistance(e.touches[0], e.touches[1]);
                    const scaleFactor = currentDistance / initialDistance;
                    const newScale = Math.min(Math.max(initialScale * scaleFactor, 0.5), 3.0);
                    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                    const rect = this.viewerContainer.getBoundingClientRect();
                    const x = centerX - rect.left;
                    const y = centerY - rect.top;
                    this.zoomTo(newScale, x, y);
                    e.preventDefault(); 
                }
            }, { passive: false });
            function getDistance(touch1, touch2) {
                const dx = touch1.clientX - touch2.clientX;
                const dy = touch1.clientY - touch2.clientY;
                return Math.sqrt(dx * dx + dy * dy);
            }
        }
    };
    pdfViewer.init();
    window.pdfViewer = pdfViewer;
    return pdfViewer;
}
function initCvViewer() {
    const cvViewer = {
        pdfDoc: null,
        currentPage: 1,
        scale: 1.0,
        pdfPath: 'pdf/cv.pdf',
        viewerContainer: document.getElementById('cv-viewer'),
        loadingAnimation: document.querySelector('.cv-container .loading-animation'),
        init() {
            console.log('Initializing enhanced CV viewer...');
            if (!this.viewerContainer) {
                console.error('CV viewer container not found!');
                return;
            }
            this.addEventListeners();
            const cvContainer = document.querySelector('.cv-container');
            if (cvContainer) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'class' && 
                            cvContainer.classList.contains('active')) {
                            this.loadPDF();
                        }
                    });
                });
                observer.observe(cvContainer, { attributes: true });
            }
        },
        addEventListeners() {
            const zoomInBtn = document.getElementById('cv-zoom-in');
            const zoomOutBtn = document.getElementById('cv-zoom-out');
            const backBtn = document.getElementById('back-to-about');
            if (zoomInBtn) {
                zoomInBtn.addEventListener('click', () => {
                    this.zoomIn();
                    addButtonEffect(zoomInBtn);
                });
            }
            if (zoomOutBtn) {
                zoomOutBtn.addEventListener('click', () => {
                    this.zoomOut();
                    addButtonEffect(zoomOutBtn);
                });
            }
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    addButtonEffect(backBtn);
                    window.pageNavigation.showAbout();
                });
            }
            if (this.viewerContainer) {
                this.setupPinchZoom();
            }
            function addButtonEffect(btn) {
                btn.classList.add('button-clicked');
                setTimeout(() => {
                    btn.classList.remove('button-clicked');
                }, 300);
            }
        },
        async loadPDF() {
            if (this.pdfDoc) return;
            try {
                console.log('Starting CV loading process...');
                if (!window.pdfjsLib) {
                    throw new Error('PDF.js library failed to load.');
                }
                if (this.loadingAnimation) {
                    this.loadingAnimation.style.display = 'flex';
                    this.loadingAnimation.style.opacity = '1';
                }
                await this.testPDFAccess();
                const loadingTask = pdfjsLib.getDocument(this.pdfPath);
                this.pdfDoc = await loadingTask.promise;
                console.log('CV loaded successfully');
                await this.renderPage(this.currentPage);
                if (this.loadingAnimation) {
                    this.loadingAnimation.style.opacity = '0';
                    setTimeout(() => {
                        this.loadingAnimation.style.display = 'none';
                    }, 300);
                }
            } catch (error) {
                console.error('CV Loading Error:', error);
                if (this.loadingAnimation) {
                    this.loadingAnimation.innerHTML = `
                        <div class=__STRING_15__>!</div>
                        <p>Failed to load CV: ${error.message}</p>
                        <p class=__STRING_16__>
                            <a href=__STRING_17__ target=__STRING_18__ class=__STRING_19__>Try opening the CV directly</a>
                        </p>
                    `;
                }
            }
        },
        async testPDFAccess() {
            try {
                console.log('Testing CV access...');
                const response = await fetch(this.pdfPath, { method: 'HEAD' });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                console.log('CV file is accessible');
            } catch (error) {
                console.error('CV access test failed:', error);
                throw new Error(`Cannot access CV file at ${this.pdfPath}: ${error.message}`);
            }
        },
        async renderPage(pageNumber) {
            if (!this.viewerContainer || !this.pdfDoc) return;
            try {
                console.log(`Rendering CV page ${pageNumber} with scale ${this.scale}`);
                const page = await this.pdfDoc.getPage(pageNumber);
                const viewport = page.getViewport({ scale: this.scale });
                const self = this;
                if (this.viewerContainer.firstChild) {
                    this.viewerContainer.firstChild.style.opacity = '0';
                    setTimeout(() => {
                        self.viewerContainer.innerHTML = '';
                        createPageAndRender();
                    }, 300);
                } else {
                    createPageAndRender();
                }
                function createPageAndRender() {
                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'pdf-page';
                    pageDiv.dataset.pageNumber = pageNumber;
                    pageDiv.style.opacity = '0';
                    pageDiv.style.transform = 'translateY(20px)';
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    pageDiv.appendChild(canvas);
                    self.viewerContainer.appendChild(pageDiv);
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    page.render(renderContext).promise.then(() => {
                        self.currentPage = pageNumber;
                        setTimeout(() => {
                            pageDiv.style.opacity = '1';
                            pageDiv.style.transform = 'translateY(0)';
                        }, 50);
                        console.log(`CV page ${pageNumber} rendered successfully`);
                    });
                }
            } catch (error) {
                console.error('Error rendering CV page:', error);
                this.viewerContainer.innerHTML = `
                    <div class=__STRING_20__>
                        <div class=__STRING_21__>!</div>
                        <p>Error rendering CV: ${error.message}</p>
                        <button class=__STRING_22__ onclick=__STRING_23__>Retry</button>
                        <a href=__STRING_24__ target=__STRING_25__ class=__STRING_26__>Open CV in default viewer</a>
                    </div>
                `;
            }
        },
        zoomIn() {
            this.scale = Math.min(this.scale + 0.2, 3.0);
            console.log(`Zooming in CV to scale ${this.scale}`);
            this.renderPage(this.currentPage);
        },
        zoomOut() {
            this.scale = Math.max(this.scale - 0.2, 0.5);
            console.log(`Zooming out CV to scale ${this.scale}`);
            this.renderPage(this.currentPage);
        },
        setupPinchZoom() {
            if (!this.viewerContainer) return;
            let initialDistance = 0;
            let initialScale = 1;
            const self = this;
            this.viewerContainer.addEventListener('touchstart', e => {
                if (e.touches.length === 2) {
                    initialDistance = getDistance(e.touches[0], e.touches[1]);
                    initialScale = self.scale;
                }
            }, { passive: true });
            this.viewerContainer.addEventListener('touchmove', e => {
                if (e.touches.length === 2) {
                    const currentDistance = getDistance(e.touches[0], e.touches[1]);
                    const scaleFactor = currentDistance / initialDistance;
                    self.scale = Math.min(Math.max(initialScale * scaleFactor, 0.5), 3.0);
                    const pageDiv = self.viewerContainer.querySelector('.pdf-page');
                    if (pageDiv) {
                        pageDiv.style.transform = `scale(${scaleFactor})`;
                        pageDiv.style.transformOrigin = 'center center';
                    }
                    e.preventDefault();
                }
            }, { passive: false });
            this.viewerContainer.addEventListener('touchend', e => {
                if (e.touches.length < 2) {
                    self.renderPage(self.currentPage);
                }
            }, { passive: true });
            function getDistance(touch1, touch2) {
                const dx = touch1.clientX - touch2.clientX;
                const dy = touch1.clientY - touch2.clientY;
                return Math.sqrt(dx * dx + dy * dy);
            }
        }
    };
    cvViewer.init();
    return cvViewer;
}
function initThemeToggler() {
    const themeToggler = {
        init() {
            const toggle = document.querySelector('.theme-toggle');
            if (!toggle) {
                console.error('Theme toggle button not found');
                return;
            }
            toggle.addEventListener('click', () => this.toggleTheme(toggle));
            if (localStorage.getItem('theme') === 'dark') {
                document.body.classList.add('dark-mode');
                toggle.innerHTML = '<i class=__STRING_27__></i>';
            }
            if (!localStorage.getItem('theme')) {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    document.body.classList.add('dark-mode');
                    toggle.innerHTML = '<i class=__STRING_28__></i>';
                    localStorage.setItem('theme', 'dark');
                }
            }
            document.querySelectorAll('.sidebar, .profile, .social-btn, .skill-card').forEach(el => {
                el.classList.add('theme-transition');
            });
        },
        toggleTheme(toggle) {
            if (!toggle) return;
            toggle.classList.add('theme-toggle-active');
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                toggle.innerHTML = '<i class=__STRING_29__></i>';
                localStorage.setItem('theme', 'dark');
                document.body.classList.add('theme-changing');
                const icon = toggle.querySelector('i');
                icon.classList.add('rotate-icon');
                setTimeout(() => {
                    document.body.classList.remove('theme-changing');
                    icon.classList.remove('rotate-icon');
                    toggle.classList.remove('theme-toggle-active');
                }, 500);
            } else {
                toggle.innerHTML = '<i class=__STRING_30__></i>';
                localStorage.setItem('theme', 'light');
                document.body.classList.add('theme-changing');
                const icon = toggle.querySelector('i');
                icon.classList.add('rotate-icon');
                setTimeout(() => {
                    document.body.classList.remove('theme-changing');
                    icon.classList.remove('rotate-icon');
                    toggle.classList.remove('theme-toggle-active');
                }, 500);
            }
        }
    };
    themeToggler.init();
    return themeToggler;
}
function initPageNavigation () {
    function hideAll () {
      document
        .querySelectorAll(
          '.pdf-container, .about-container, .cv-container, .projects-container, .artworks-container, .model-container'
        )
        .forEach(c => c.classList.remove('active'));
      document
        .querySelectorAll(
          '#portfolio-link, #about-link, #projects-link, #artworks-link'
        )
        .forEach(l => l.classList.remove('active'));
    }
    function showPortfolio () {
      hideAll();
      pdfContainer.classList.add('active');
      portfolioLink.classList.add('active');
      if (window.pdfViewer && !window.pdfViewer.pdfDoc) {
        window.pdfViewer.loadPDF();
      }
    }
    function showProjects () {
      hideAll();
      projectsContainer.classList.add('active');
      projectsLink.classList.add('active');
    }
    function showAbout () {
      hideAll();
      aboutContainer.classList.add('active');
      aboutLink.classList.add('active');
      animateSkillBars();                
    }
    function showArtworks () {
      hideAll();
      artworksContainer.classList.add('active');
      artworksLink.classList.add('active');
      initArtworkSliders();
    }
    function initArtworkSliders() {
      const sliders = document.querySelectorAll('.slider');
      sliders.forEach(slider => {
        const artworkItem = slider.closest('.artwork-item');
        const beforeImage = artworkItem.querySelector('.artwork-before');
        const afterImage = artworkItem.querySelector('.artwork-after');
        if (!beforeImage) {
          console.error('Before image not found');
          return;
        }
        slider.addEventListener('input', function() {
          const value = parseInt(this.value);
          const leftEdge = value; 
          beforeImage.style.clipPath = `polygon(${leftEdge}% 0%, 100% 0%, 100% 100%, ${leftEdge}% 100%)`;
          beforeImage.style.transform = 'translate(-50%, -50%)';
        });
        const initialValue = parseInt(slider.value);
        beforeImage.style.clipPath = `polygon(${initialValue}% 0%, 100% 0%, 100% 100%, ${initialValue}% 100%)`;
        beforeImage.style.transform = 'translate(-50%, -50%)';
      });
    }
    function showCV () {
      hideAll();
      cvContainer.classList.add('active');
      aboutLink.classList.add('active'); 
    }
    function show3DModel(modelPath, name, info) {
      hideAll();
      modelContainer.dataset.modelPath = modelPath;
      modelContainer.dataset.modelName = name || 'Architectural Model';
      modelContainer.dataset.modelInfo = info || 'Interactive 3D model of the project. Explore it by rotating, zooming, and panning.';
      modelContainer.classList.add('active');
      projectsLink.classList.add('active');
      if (window.modelViewer) {
        window.modelViewer.loadModel(modelPath, name, info);
      }
    }
    function showContact () { window.location.href = 'mailto:simasarchitecture@gmail.com'; }
    const portfolioLink    = document.getElementById('portfolio-link');
    const projectsLink     = document.getElementById('projects-link');
    const artworksLink     = document.getElementById('artworks-link');
    const aboutLink        = document.getElementById('about-link');
    const contactLink      = document.getElementById('contact-link');
    const pdfContainer     = document.querySelector('.pdf-container');
    const projectsContainer= document.querySelector('.projects-container');
    const artworksContainer= document.querySelector('.artworks-container');
    const aboutContainer   = document.querySelector('.about-container');
    const cvContainer      = document.querySelector('.cv-container');
    const modelContainer   = document.querySelector('.model-container');
    const viewCVBtn        = document.getElementById('view-cv');
    const downloadCVBtn    = document.getElementById('download-cv');
    portfolioLink?.addEventListener('click', e => { e.preventDefault(); showPortfolio(); });
    projectsLink ?.addEventListener('click', e => { e.preventDefault(); showProjects (); });
    artworksLink ?.addEventListener('click', e => { e.preventDefault(); showArtworks (); });
    aboutLink    ?.addEventListener('click', e => { e.preventDefault(); showAbout    (); });
    contactLink  ?.addEventListener('click', e => { e.preventDefault(); showContact  (); });
    viewCVBtn    ?.addEventListener('click', () => showCV());
    downloadCVBtn?.addEventListener('click', () => downloadCV());
    function animateSkillBars () {
      document.querySelectorAll('.skill-progress').forEach((bar, i) => {
        const w = bar.dataset.width || bar.style.width || '0%';
        bar.style.width = '0';
        setTimeout(() => { bar.style.width = w; }, 100 + i * 120);
      });
    }
    function downloadCV () {
      const link = document.createElement('a');
      link.href = 'pdf/cv.pdf';
      link.download = 'sima_assaf_cv.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    showPortfolio();                           
    const api = { 
      showPortfolio, 
      showProjects, 
      showArtworks,
      showAbout, 
      showCV, 
      showContact,
      show3DModel
    };
    window.pageNavigation = api;               
    return api;
  }
initPageNavigation();
function initSocialButtons() {
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-5px) scale(1.02)';
            animateIcon(btn.querySelector('i'));
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0) scale(1)';
        });
        btn.addEventListener('click', () => {
            btn.classList.add('social-btn-clicked');
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
            setTimeout(() => {
                btn.classList.remove('social-btn-clicked');
            }, 300);
        });
        function animateIcon(icon) {
            if (!icon) return;
            icon.classList.add('icon-pulse');
            setTimeout(() => {
                icon.classList.remove('icon-pulse');
            }, 500);
        }
    });
}
function initProjects() {
    document.querySelectorAll('.project-card').forEach(card => {
      const is3DCard = card.classList.contains('project-card-3d');
      const pageBtn = card.querySelector('.view-chapter-btn');
      const page = pageBtn ? (pageBtn.dataset.pdfpage || card.dataset.pdfpage) : card.dataset.pdfpage;
      if (!is3DCard && page) {
        card.addEventListener('click', () => {
          pageNavigation.showPortfolio();
          pdfViewer.renderPage(parseInt(page));
        });
        if (pageBtn) {
          pageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            pageNavigation.showPortfolio();
            pdfViewer.renderPage(parseInt(page));
          });
        }
      } 
      else if (is3DCard) {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.view-chapter-btn') && !e.target.closest('.view-3d-btn')) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
        if (pageBtn && page) {
          pageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            pageNavigation.showPortfolio();
            pdfViewer.renderPage(parseInt(page));
          });
        }
        const view3DBtn = card.querySelector('.view-3d-btn');
        if (view3DBtn && card.dataset.stl) {
          view3DBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const stlPath = card.dataset.stl;
            const modelName = card.querySelector('h3').textContent || 'Architectural Model';
            const modelDesc = card.querySelector('.project-blurb').textContent || 
                            'Interactive 3D model of the project. Explore it by rotating, zooming, and panning.';
            if (window.pageNavigation && window.pageNavigation.show3DModel) {
              window.pageNavigation.show3DModel(stlPath, modelName, modelDesc);
            }
          });
        }
      }
    });
  }
function initMobileOptimizations() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.body.classList.add('mobile-device');
        document.querySelectorAll('button, .nav-links a, .social-btn').forEach(el => {
            el.classList.add('touch-optimized');
        });
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (window.pdfViewer && window.pdfViewer.currentPage) {
                    window.pdfViewer.updatePage();
                }
                const aboutContainer = document.querySelector('.about-container');
                if (aboutContainer && aboutContainer.classList.contains('active')) {
                    window.pageNavigation.animateSkillBars();
                }
            }, 300);
        });
        showMobileHints();
    }
    const aboutContainer = document.querySelector('.about-container');
    if (aboutContainer) {
        aboutContainer.classList.add('smooth-scroll');
    }
}
function showMobileHints() {
    if (localStorage.getItem('mobile-hints-shown')) return;
    setTimeout(() => {
        const hint = document.createElement('div');
        hint.className = 'mobile-hint';
        hint.innerHTML = `
            <div class=__STRING_31__>
                <i class=__STRING_32__></i>
                <p>Swipe between sections & pages</p>
                <button class=__STRING_33__>Got it</button>
            </div>
        `;
        document.body.appendChild(hint);
        setTimeout(() => {
            hint.classList.add('show-hint');
        }, 100);
        hint.querySelector('.hint-dismiss').addEventListener('click', () => {
            hint.classList.remove('show-hint');
            setTimeout(() => {
                document.body.removeChild(hint);
            }, 300);
            localStorage.setItem('mobile-hints-shown', 'true');
        });
        setTimeout(() => {
            if (document.body.contains(hint)) {
                hint.classList.remove('show-hint');
                setTimeout(() => {
                    if (document.body.contains(hint)) {
                        document.body.removeChild(hint);
                    }
                }, 300);
                localStorage.setItem('mobile-hints-shown', 'true');
            }
        }, 5000);
    }, 2000);
}
function initFooterNavigation() {
    const footerPortfolio = document.getElementById('footer-portfolio');
    const footerAbout = document.getElementById('footer-about');
    const footerProjects = document.getElementById('footer-projects');
    const footerArtworks = document.getElementById('footer-artworks');
    if (footerPortfolio) {
        footerPortfolio.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.pageNavigation) {
                window.pageNavigation.showPortfolio();
            }
        });
    }
    if (footerProjects) {
        footerProjects.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.pageNavigation) {
                window.pageNavigation.showProjects();
            }
        });
    }
    if (footerArtworks) {
        footerArtworks.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.pageNavigation) {
                window.pageNavigation.showArtworks();
            }
        });
    }
    if (footerAbout) {
        footerAbout.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.pageNavigation) {
                window.pageNavigation.showAbout();
            }
        });
    }
}
function initImageLightbox() {
        const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('aria-hidden', 'true');
        const img = document.createElement('img');
        img.className = 'lightbox-image';
        img.alt = '';
        const compare = document.createElement('div');
        compare.className = 'lightbox-compare';
        compare.innerHTML = `
            <div class=__STRING_34__>
                <img class=__STRING_35__ alt=__STRING_36__>
                <img class=__STRING_37__ alt=__STRING_38__>
            </div>
            <div class=__STRING_39__>
                <input type=__STRING_40__ class=__STRING_41__ min=__STRING_42__ max=__STRING_43__ value=__STRING_44__ aria-label=__STRING_45__>
                <div class=__STRING_46__><span>Before</span><span>After</span></div>
            </div>
        `;
        const lbBefore = compare.querySelector('.lb-before');
        const lbAfter  = compare.querySelector('.lb-after');
        const lbRange  = compare.querySelector('.lightbox-slider');
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close image');
    closeBtn.innerHTML = '<span aria-hidden=__STRING_47__>&times;</span>';
        overlay.appendChild(img);
        overlay.appendChild(compare);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
    let active = false;
    function openLightboxSingle(src, altText) {
        if (!src) return;
        img.src = src;
        img.alt = altText || '';
        img.style.display = 'block';
        compare.style.display = 'none';
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        active = true;
    }
    function openLightboxCompare(beforeSrc, afterSrc) {
        if (!beforeSrc || !afterSrc) return openLightboxSingle(afterSrc || beforeSrc, '');
        lbBefore.src = beforeSrc;
        lbAfter.src  = afterSrc;
        lbRange.value = 100;
        lbBefore.style.clipPath = `polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)`;
        img.style.display = 'none';
        compare.style.display = 'flex';
        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        active = true;
    }
    function closeLightbox() {
        if (!active) return;
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
        setTimeout(() => { img.removeAttribute('src'); }, 150);
        active = false;
    }
    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
    lbRange.addEventListener('input', function() {
        const value = parseInt(this.value);
        const leftEdge = value;
        lbBefore.style.clipPath = `polygon(${leftEdge}% 0%, 100% 0%, 100% 100%, ${leftEdge}% 100%)`;
    });
    function bindImages(scope=document) {
        const imgs = scope.querySelectorAll('img');
        imgs.forEach(el => {
            if (el.dataset.lightboxBound) return;
            el.dataset.lightboxBound = 'true';
            el.style.cursor = 'zoom-in';
            el.addEventListener('click', (e) => {
                const anchor = el.closest('a');
                if (anchor) e.preventDefault();
                const sliderContainer = el.closest('.artwork-slider-container');
                if (sliderContainer) {
                    const wrapper = sliderContainer.querySelector('.artwork-image-wrapper');
                    const bImg = wrapper?.querySelector('.artwork-before');
                    const aImg = wrapper?.querySelector('.artwork-after');
                    if (bImg && aImg) {
                        const beforeSrc = bImg.currentSrc || bImg.src;
                        const afterSrc  = aImg.currentSrc || aImg.src;
                        openLightboxCompare(beforeSrc, afterSrc);
                        e.stopPropagation();
                        return;
                    }
                }
                const src = el.currentSrc || el.src;
                openLightboxSingle(src, el.alt || '');
                e.stopPropagation();
            });
        });
    }
    bindImages();
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length) {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { 
                        if (node.tagName === 'IMG') {
                            bindImages(node.parentElement || document);
                        } else {
                            bindImages(node);
                        }
                    }
                });
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
function initAnimations() {
    const elements = [
        { selector: 'header', delay: 0 },
        { selector: '.sidebar', delay: 200 },
        { selector: '.profile', delay: 400 },
        { selector: '.social-links a', delay: 600, stagger: 100 },
        { selector: '.content-container', delay: 400 }
    ];
    elements.forEach(item => {
        const els = document.querySelectorAll(item.selector);
        els.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            let delay = item.delay;
            if (item.stagger) {
                delay += index * item.stagger;
            }
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, delay);
        });
    });
}
function addTactileFeedback() {
    const buttons = document.querySelectorAll('button, .nav-links a, .social-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', () => {
            btn.style.transform = 'scale(0.98)';
        });
        btn.addEventListener('mouseup', () => {
            btn.style.transform = '';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}
const extraStyles = document.createElement('style');
extraStyles.textContent = `
        .button-clicked {
        transform: scale(0.95) !important;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    }
    .nav-link-clicked {
        transform: scale(0.95);
    }
    .download-success {
        background: linear-gradient(135deg, #2ecc71, #27ae60) !important;
    }
        .skill-shimmer::after {
        content: __STRING_409__;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        animation: shimmer 1.5s ease-in-out;
    }
    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
        .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 0;
        background: transparent;
        box-shadow: none;
        z-index: 1000;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 20px;
        background: linear-gradient(135deg, #b3743a, #cb8d5f);
        color: white;
        border-radius: 50px;
        box-shadow: 0 10px 25px rgba(179, 116, 58, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
    }
    .notification-icon {
        font-size: 1.2rem;
    }
    .show-notification {
        opacity: 1;
        transform: translateY(0);
    }
    .hide-notification {
        opacity: 0;
        transform: translateY(10px);
    }
        .mobile-hint {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    .hint-content {
        background-color: #fff;
        padding: 20px;
        border-radius: 16px;
        text-align: center;
        max-width: 80%;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        transform: scale(0.9);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .dark-mode .hint-content {
        background-color: #2a2a2a;
        color: white;
    }
    .hint-icon {
        font-size: 2rem;
        color: var(--accent-color);
        margin-bottom: 15px;
    }
    .hint-small {
        font-size: 0.8rem;
        color: #666;
        margin-top: 5px;
    }
    .dark-mode .hint-small {
        color: #aaa;
    }
    .hint-dismiss {
        background: var(--accent-gradient);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        margin-top: 15px;
        cursor: pointer;
        font-family: Consolas, monospace;
    }
    .show-hint {
        opacity: 1;
        visibility: visible;
    }
    .show-hint .hint-content {
        transform: scale(1);
    }
        .loading-pulse {
        animation: pulse-width 1.5s infinite;
    }
    @keyframes pulse-width {
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
    }
        .touch-optimized {
        min-height: 44px;
        min-width: 44px;
    }
        .progress-pulse {
        animation: progress-pulse 0.5s ease;
    }
    @keyframes progress-pulse {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
    }
        .disabled-arrow {
        opacity: 0.3 !important;
        cursor: default !important;
    }
    .disabled-arrow:hover {
        transform: none !important;
        background: rgba(255, 255, 255, 0.7) !important;
        color: var(--accent-color) !important;
        box-shadow: none !important;
    }
        .animate-on-scroll {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .animate-in {
        opacity: 1;
        transform: translateY(0);
    }
        .icon-pulse {
        animation: icon-pulse 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes icon-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.3) rotate(10deg); }
        100% { transform: scale(1); }
    }
        .show-swipe-hint {
        opacity: 1 !important;
        transform: translateX(-50%) translateY(0) !important;
    }
        .page-loaded .sidebar,
    .page-loaded .content-container {
        transform: translateY(0);
        opacity: 1;
    }
        .theme-transition {
        transition: background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
    }
    .theme-changing {
        transition: background-color 0.5s ease;
    }
    .rotate-icon {
        animation: rotate-full 0.5s ease;
    }
    @keyframes rotate-full {
        0% { transform: rotate(0); }
        100% { transform: rotate(360deg); }
    }
    .theme-toggle-active {
        transform: scale(1.1);
    }
        .smooth-scroll {
        scroll-behavior: smooth;
    }
        .error-icon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #ff3333;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        font-weight: bold;
        margin: 0 auto 15px;
    }
    .pdf-error {
        padding: 30px;
        text-align: center;
    }
    .retry-btn, .open-pdf-btn {
        display: inline-block;
        margin: 15px 10px 0;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-family: Consolas, monospace;
    }
    .retry-btn {
        background: var(--accent-gradient);
        color: white;
        border: none;
    }
    .open-pdf-btn {
        background: transparent;
        color: var(--accent-color);
        border: 1px solid var(--accent-color);
        text-decoration: none;
    }
    .error-hint {
        margin-top: 15px;
        font-size: 14px;
        color: #666;
    }
    .dark-mode .error-hint {
        color: #aaa;
    }
    .retry-link {
        color: var(--accent-color);
        text-decoration: underline;
    }
    .social-btn-clicked {
        transform: scale(0.95) !important;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1) !important;
    }
`;
document.head.appendChild(extraStyles);
document.addEventListener('DOMContentLoaded', initProjects);
