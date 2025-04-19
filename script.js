const pdfViewer = {
    pdfDoc: null,
    currentPage: 1,
    scale: 1.0,
    pdfPath: 'pdf/portfolio.pdf',
    viewerContainer: document.getElementById('pdf-viewer'),
    loadingAnimation: document.querySelector('.pdf-container .loading-animation'),
    canvas: null,
    
    init() {
        console.log('Initializing PDF viewer...');
        if (!this.viewerContainer) {
            console.error('PDF viewer container not found!');
            return;
        }
        
        if (!this.loadingAnimation) {
            console.error('Loading animation not found!');
        }
        
        this.checkPDFJSAvailability();
        this.addEventListeners();
        this.loadPDF();
        this.setupSwipeDetection();
        this.setupKeyboardNavigation();
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
        } else {
            console.log('PDF.js library found');
        }
    },
    
    addEventListeners() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const prevArrow = document.getElementById('prev-page-arrow');
        const nextArrow = document.getElementById('next-page-arrow');
        const downloadBtn = document.getElementById('download-pdf');
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevPage());
        else console.error('Previous page button not found');
        
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());
        else console.error('Next page button not found');
        
        if (prevArrow) prevArrow.addEventListener('click', () => this.prevPage());
        else console.warn('Previous page arrow not found');
        
        if (nextArrow) nextArrow.addEventListener('click', () => this.nextPage());
        else console.warn('Next page arrow not found');
        
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadPDF());
        else console.error('Download button not found');
        
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomIn());
        else console.warn('Zoom in button not found');
        
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOut());
        else console.warn('Zoom out button not found');
    },
    
    async loadPDF() {
        try {
            console.log('Starting PDF loading process...');
            
            if (!window.pdfjsLib) {
                throw new Error('PDF.js library failed to load. Check your internet connection or CDN availability.');
            }
            
            await this.testPDFAccess();
            const loadingTask = pdfjsLib.getDocument(this.pdfPath);
            
            loadingTask.onProgress = (progress) => {
                console.log(`Loading progress: ${Math.round(progress.loaded / progress.total * 100)}%`);
                const progressBar = document.getElementById('progress-bar');
                if (progressBar) {
                    const percentLoaded = progress.loaded / progress.total * 100;
                    progressBar.style.width = `${Math.round(percentLoaded)}%`;
                }
            };
            
            this.pdfDoc = await loadingTask.promise;
            console.log(`PDF loaded successfully with ${this.pdfDoc.numPages} pages`);
            
            if (!this.pdfDoc.numPages || this.pdfDoc.numPages < 1) {
                throw new Error('Invalid PDF: No pages found in the document.');
            }
            
            const totalPagesElement = document.getElementById('total-pages');
            if (totalPagesElement) {
                totalPagesElement.textContent = this.pdfDoc.numPages;
            }
            
            await this.renderPage(this.currentPage);
            
            if (this.loadingAnimation) {
                this.loadingAnimation.style.display = 'none';
            }
            
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.style.width = `${(this.currentPage / this.pdfDoc.numPages) * 100}%`;
            }
        } catch (error) {
            console.error('PDF Loading Error:', error);
            if (this.loadingAnimation) {
                this.loadingAnimation.innerHTML = `
                    <div style="color: #ff3333; font-size: 24px; margin-bottom: 10px;">!</div>
                    <p>Failed to load PDF: ${error.message}</p>
                    <p style="font-size: 14px; color: #666; margin-top: 10px;">
                        Ensure 'pdf/portfolio.pdf' exists and is served via a web server (http://, not file://).
                        <br><a href="${this.pdfPath}" target="_blank" style="color: #0070f3;">Try opening the PDF directly</a>
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
            console.log(`Rendering page ${pageNumber} with scale ${this.scale}`);
            if (pageNumber < 1 || pageNumber > this.pdfDoc.numPages) {
                throw new Error(`Invalid page number: ${pageNumber}`);
            }
            
            const page = await this.pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: this.scale });
            
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.viewerContainer.innerHTML = '';
                this.viewerContainer.appendChild(this.canvas);
            }
            
            const context = this.canvas.getContext('2d');
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            this.currentPage = pageNumber;
            
            const currentPageElement = document.getElementById('current-page');
            if (currentPageElement) {
                currentPageElement.textContent = pageNumber;
            }
            
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.style.width = `${(this.currentPage / this.pdfDoc.numPages) * 100}%`;
            }
            
            this.addPageNumberEffect();
            console.log(`Page ${pageNumber} rendered successfully`);
        } catch (error) {
            console.error('Error rendering page:', error);
            this.viewerContainer.innerHTML = `
                <p style="color: #ff3333; text-align: center;">Error rendering page: ${error.message}</p>
                <p style="text-align: center; font-size: 14px; color: #666;">
                    <a href="${this.pdfPath}" target="_blank" style="color: #0070f3;">Open PDF in default viewer</a>
                </p>
            `;
        }
    },
    
    addPageNumberEffect() {
        const pageNumber = document.getElementById('current-page');
        if (pageNumber) {
            pageNumber.style.transform = 'scale(1.2)';
            setTimeout(() => {
                pageNumber.style.transform = 'scale(1)';
            }, 200);
        }
    },
    
    async prevPage() {
        if (this.currentPage <= 1) return;
        console.log('Navigating to previous page');
        await this.renderPage(this.currentPage - 1);
    },
    
    async nextPage() {
        if (!this.pdfDoc || this.currentPage >= this.pdfDoc.numPages) return;
        console.log('Navigating to next page');
        await this.renderPage(this.currentPage + 1);
    },
    
    zoomIn() {
        this.scale = Math.min(this.scale + 0.2, 2.0);
        console.log(`Zooming in to scale ${this.scale}`);
        this.renderPage(this.currentPage);
    },
    
    zoomOut() {
        this.scale = Math.max(this.scale - 0.2, 0.5);
        console.log(`Zooming out to scale ${this.scale}`);
        this.renderPage(this.currentPage);
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
            btn.innerHTML = '<i class="fas fa-check"></i><span>Downloaded</span>';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        }
        
        this.showNotification('Portfolio downloaded successfully!');
    },
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(20px)';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    },
    
    setupSwipeDetection() {
        if (!this.viewerContainer) return;
        
        let touchstartX = 0;
        let touchendX = 0;
        
        this.viewerContainer.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
        });
        
        this.viewerContainer.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
        
        this.handleSwipe = function() {
            const threshold = 50;
            if (touchendX < touchstartX - threshold) {
                this.nextPage();
            }
            if (touchendX > touchstartX + threshold) {
                this.prevPage();
            }
        };
    },
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (document.querySelector('.pdf-container.active')) {
                if (e.key === 'ArrowLeft') {
                    this.prevPage();
                } else if (e.key === 'ArrowRight') {
                    this.nextPage();
                }
            }
        });
    }
};

const cvViewer = {
    pdfDoc: null,
    currentPage: 1,
    scale: 1.0,
    pdfPath: 'pdf/cv.pdf',
    viewerContainer: document.getElementById('cv-viewer'),
    loadingAnimation: document.querySelector('.cv-container .loading-animation'),
    canvas: null,
    
    init() {
        console.log('Initializing CV viewer...');
        if (!this.viewerContainer) {
            console.error('CV viewer container not found!');
            return;
        }
        
        if (!this.loadingAnimation) {
            console.error('CV loading animation not found!');
        }
        
        this.addEventListeners();
        this.loadPDF();
    },
    
    addEventListeners() {
        const zoomInBtn = document.getElementById('cv-zoom-in');
        const zoomOutBtn = document.getElementById('cv-zoom-out');
        
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoomIn());
        else console.warn('CV zoom in button not found');
        
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoomOut());
        else console.warn('CV zoom out button not found');
    },
    
    async loadPDF() {
        try {
            console.log('Starting CV PDF loading process...');
            
            if (!window.pdfjsLib) {
                throw new Error('PDF.js library failed to load.');
            }
            
            await this.testPDFAccess();
            const loadingTask = pdfjsLib.getDocument(this.pdfPath);
            
            loadingTask.onProgress = (progress) => {
                console.log(`CV Loading progress: ${Math.round(progress.loaded / progress.total * 100)}%`);
                const progressBar = document.getElementById('cv-progress-bar');
                if (progressBar) {
                    const percentLoaded = progress.loaded / progress.total * 100;
                    progressBar.style.width = `${Math.round(percentLoaded)}%`;
                }
            };
            
            this.pdfDoc = await loadingTask.promise;
            console.log(`CV PDF loaded successfully with ${this.pdfDoc.numPages} pages`);
            
            if (!this.pdfDoc.numPages || this.pdfDoc.numPages < 1) {
                throw new Error('Invalid CV PDF: No pages found in the document.');
            }
            
            await this.renderPage(this.currentPage);
            
            if (this.loadingAnimation) {
                this.loadingAnimation.style.display = 'none';
            }
            
            const progressBar = document.getElementById('cv-progress-bar');
            if (progressBar) {
                progressBar.style.width = '100%';
            }
        } catch (error) {
            console.error('CV PDF Loading Error:', error);
            if (this.loadingAnimation) {
                this.loadingAnimation.innerHTML = `
                    <div style="color: #ff3333; font-size: 24px; margin-bottom: 10px;">!</div>
                    <p>Failed to load CV: ${error.message}</p>
                    <p style="font-size: 14px; color: #666; margin-top: 10px;">
                        Ensure 'pdf/cv.pdf' exists and is served via a web server (http://, not file://).
                        <br><a href="${this.pdfPath}" target="_blank" style="color: #0070f3;">Try opening the CV directly</a>
                    </p>
                `;
            }
        }
    },
    
    async testPDFAccess() {
        try {
            console.log('Testing CV PDF access...');
            const response = await fetch(this.pdfPath, { method: 'HEAD' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log('CV PDF file is accessible');
        } catch (error) {
            console.error('CV PDF access test failed:', error);
            throw new Error(`Cannot access CV PDF file at ${this.pdfPath}: ${error.message}`);
        }
    },
    
    async renderPage(pageNumber) {
        if (!this.viewerContainer || !this.pdfDoc) return;
        
        try {
            console.log(`Rendering CV page ${pageNumber} with scale ${this.scale}`);
            if (pageNumber !== 1) {
                throw new Error('CV has only one page');
            }
            
            const page = await this.pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: this.scale });
            
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.viewerContainer.innerHTML = '';
                this.viewerContainer.appendChild(this.canvas);
            }
            
            const context = this.canvas.getContext('2d');
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            this.currentPage = pageNumber;
            
            const progressBar = document.getElementById('cv-progress-bar');
            if (progressBar) {
                progressBar.style.width = '100%';
            }
            
            console.log(`CV Page ${pageNumber} rendered successfully`);
        } catch (error) {
            console.error('Error rendering CV page:', error);
            this.viewerContainer.innerHTML = `
                <p style="color: #ff3333; text-align: center;">Error rendering CV page: ${error.message}</p>
                <p style="text-align: center; font-size: 14px; color: #666;">
                    <a href="${this.pdfPath}" target="_blank" style="color: #0070f3;">Open CV in default viewer</a>
                </p>
            `;
        }
    },
    
    zoomIn() {
        this.scale = Math.min(this.scale + 0.2, 2.0);
        console.log(`CV Zooming in to scale ${this.scale}`);
        this.renderPage(this.currentPage);
    },
    
    zoomOut() {
        this.scale = Math.max(this.scale - 0.2, 0.5);
        console.log(`CV Zooming out to scale ${this.scale}`);
        this.renderPage(this.currentPage);
    }
};

const themeToggler = {
    init() {
        const toggle = document.querySelector('.theme-toggle');
        if (!toggle) {
            console.error('Theme toggle button not found');
            return;
        }
        
        toggle.addEventListener('click', () => this.toggleTheme());
        
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            toggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    },
    
    toggleTheme() {
        const toggle = document.querySelector('.theme-toggle');
        if (!toggle) return;
        
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            toggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        } else {
            toggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        }
    }
};

const pageNavigation = {
    init() {
        const portfolioLink = document.getElementById('portfolio-link');
        const aboutLink = document.getElementById('about-link');
        const contactLink = document.getElementById('contact-link');
        const downloadCVBtn = document.getElementById('download-cv');
        const viewCVBtn = document.getElementById('view-cv');
        const backToAboutBtn = document.getElementById('back-to-about');
        const pdfControls = document.getElementById('pdf-controls');
        const cvControls = document.getElementById('cv-controls');
        
        if (!portfolioLink || !aboutLink || !contactLink) {
            console.error('Navigation links not found');
            return;
        }
        
        if (!downloadCVBtn) {
            console.error('Download CV button not found');
        } else {
            downloadCVBtn.addEventListener('click', () => this.downloadCV());
        }
        
        if (!viewCVBtn) {
            console.error('View CV button not found');
        } else {
            viewCVBtn.addEventListener('click', () => this.viewCV());
        }
        
        if (!backToAboutBtn) {
            console.error('Back to About button not found');
        } else {
            backToAboutBtn.addEventListener('click', () => this.showAbout());
        }
        
        const pdfContainer = document.querySelector('.pdf-container');
        const aboutContainer = document.querySelector('.about-container');
        const cvContainer = document.querySelector('.cv-container');
        
        if (!pdfContainer || !aboutContainer || !cvContainer) {
            console.error('Content containers not found');
            return;
        }
        
        portfolioLink.addEventListener('click', (e) => {
            e.preventDefault();
            portfolioLink.classList.add('active');
            aboutLink.classList.remove('active');
            contactLink.classList.remove('active');
            pdfContainer.classList.add('active');
            aboutContainer.classList.remove('active');
            cvContainer.classList.remove('active');
            pdfControls.style.display = 'flex';
            cvControls.style.display = 'none';
            pdfViewer.loadPDF();
        });
        
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            aboutLink.classList.add('active');
            portfolioLink.classList.remove('active');
            contactLink.classList.remove('active');
            aboutContainer.classList.add('active');
            pdfContainer.classList.remove('active');
            cvContainer.classList.remove('active');
            pdfControls.style.display = 'none';
            cvControls.style.display = 'none';
            setTimeout(() => {
                const skillBars = document.querySelectorAll('.skill-progress');
                console.log('Skill bars found:', skillBars.length);
                console.log('About container content:', aboutContainer.innerHTML.substring(0, 200) + '...');
                if (skillBars.length === 0) {
                    console.warn('No skill progress bars found. Check .about-grid in DOM.');
                }
                this.animateSkillBars();
            }, 500);
        });
        
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            contactLink.classList.add('active');
            portfolioLink.classList.remove('active');
            aboutLink.classList.remove('active');
            pdfContainer.classList.remove('active');
            aboutContainer.classList.remove('active');
            cvContainer.classList.remove('active');
            pdfControls.style.display = 'none';
            cvControls.style.display = 'none';
            window.location.href = 'mailto:simasarchitecture@gmail.com';
        });
    },
    
    animateSkillBars() {
        const skillBars = document.querySelectorAll('.skill-progress');
        skillBars.forEach(bar => {
            const width = bar.dataset.width || bar.style.width || '0%';
            bar.style.width = '0';
            bar.dataset.width = width;
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    },
    
    downloadCV() {
        const link = document.createElement('a');
        link.href = 'pdf/cv.pdf';
        link.download = 'sima_assaf_cv.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        const btn = document.getElementById('download-cv');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i><span>Downloaded</span>';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        }
        
        pdfViewer.showNotification('CV downloaded successfully!');
    },
    
    viewCV() {
        const portfolioLink = document.getElementById('portfolio-link');
        const aboutLink = document.getElementById('about-link');
        const contactLink = document.getElementById('contact-link');
        const pdfContainer = document.querySelector('.pdf-container');
        const aboutContainer = document.querySelector('.about-container');
        const cvContainer = document.querySelector('.cv-container');
        const pdfControls = document.getElementById('pdf-controls');
        const cvControls = document.getElementById('cv-controls');
        
        aboutLink.classList.add('active');
        portfolioLink.classList.remove('active');
        contactLink.classList.remove('active');
        cvContainer.classList.add('active');
        pdfContainer.classList.remove('active');
        aboutContainer.classList.remove('active');
        pdfControls.style.display = 'none';
        cvControls.style.display = 'flex';
        
        cvViewer.init();
        pdfViewer.showNotification('Loading CV...');
    },
    
    showAbout() {
        const portfolioLink = document.getElementById('portfolio-link');
        const aboutLink = document.getElementById('about-link');
        const contactLink = document.getElementById('contact-link');
        const pdfContainer = document.querySelector('.pdf-container');
        const aboutContainer = document.querySelector('.about-container');
        const cvContainer = document.querySelector('.cv-container');
        const pdfControls = document.getElementById('pdf-controls');
        const cvControls = document.getElementById('cv-controls');
        
        aboutLink.classList.add('active');
        portfolioLink.classList.remove('active');
        contactLink.classList.remove('active');
        aboutContainer.classList.add('active');
        pdfContainer.classList.remove('active');
        cvContainer.classList.remove('active');
        pdfControls.style.display = 'none';
        cvControls.style.display = 'none';
        
        setTimeout(() => {
            this.animateSkillBars();
        }, 500);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Document loaded, initializing components...');
    setTimeout(() => {
        pdfViewer.init();
        themeToggler.init();
        pageNavigation.init();
        
        const socialButtons = document.querySelectorAll('.social-btn');
        socialButtons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-5px)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
            });
        });
    }, 100);
});
