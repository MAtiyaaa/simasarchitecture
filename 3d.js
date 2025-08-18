function init3DViewer() {
    const modelViewer = {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        model: null,
        currentModel: '',
        isLoading: false,
        autoRotate: false,
        viewerContainer: document.getElementById('model-viewer'),
        loadingAnimation: document.querySelector('.model-loading-animation'),
        modelInfo: document.querySelector('.model-information'),
        init() {
            console.log('Initializing 3D model viewer...');
            if (!this.viewerContainer) {
                console.error('Model viewer container not found!');
                return;
            }
            this.checkThreeJSAvailability();
            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupLights();
            this.setupControls();
            this.addEventListeners();
            this.animate();
            window.addEventListener('resize', () => this.onWindowResize(), false);
        },
        checkThreeJSAvailability() {
            if (!window.THREE) {
                console.error('Three.js library not found! Trying to load it...');
                this.loadThreeJS();
            } else {
                console.log('Three.js is available.');
            }
        },
        loadThreeJS() {
            const threeScript = document.createElement('script');
            threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            document.head.appendChild(threeScript);
            const stlLoaderScript = document.createElement('script');
            stlLoaderScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js';
            document.head.appendChild(stlLoaderScript);
            const orbitControlsScript = document.createElement('script');
            orbitControlsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
            document.head.appendChild(orbitControlsScript);
            orbitControlsScript.onload = () => {
                console.log('Three.js libraries loaded successfully');
                this.setupScene();
                this.setupCamera();
                this.setupRenderer();
                this.setupLights();
                this.setupControls();
                this.animate();
            };
        },
        setupScene() {
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xf5f5f5);
            if (document.body.classList.contains('dark-mode')) {
                this.scene.background = new THREE.Color(0x2a2a2a);
            }
        },
        setupCamera() {
            const aspect = this.viewerContainer.clientWidth / this.viewerContainer.clientHeight;
            this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
            this.camera.position.set(0, 5, 10);
        },
        setupRenderer() {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(this.viewerContainer.clientWidth, this.viewerContainer.clientHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.viewerContainer.innerHTML = '';
            this.viewerContainer.appendChild(this.renderer.domElement);
        },
        setupLights() {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 7);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 50;
            directionalLight.shadow.camera.left = -15;
            directionalLight.shadow.camera.right = 15;
            directionalLight.shadow.camera.top = 15;
            directionalLight.shadow.camera.bottom = -15;
            directionalLight.shadow.bias = -0.0005;
            this.scene.add(directionalLight);
            const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
            backLight.position.set(-5, 5, -7);
            this.scene.add(backLight);
        },
        setupControls() {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.rotateSpeed = 0.7;
            this.controls.autoRotate = this.autoRotate;
            this.controls.autoRotateSpeed = 2.0;
            this.controls.enablePan = true;
            this.controls.minDistance = 3;
            this.controls.maxDistance = 300;
        },
        loadModel(modelPath, name, info) {
            if (this.isLoading || this.currentModel === modelPath) return;
            this.isLoading = true;
            this.currentModel = modelPath;
            if (this.loadingAnimation) {
                this.loadingAnimation.style.display = 'flex';
                this.loadingAnimation.style.opacity = '1';
            }
            if (this.modelInfo && name && info) {
                this.modelInfo.innerHTML = `
                    <h4>${name}</h4>
                    <p>${info}</p>
                    <p class="tip">Tip: Drag to rotate, scroll to zoom, right-click to pan</p>
                `;
            }
            this.modelInfo.classList.add('hidden');
            const infoBtn = document.getElementById('info-toggle');
            if (infoBtn) {
                infoBtn.classList.remove('active');
            }
            if (this.model) {
                this.scene.remove(this.model);
                if (this.model.geometry) {
                    this.model.geometry.dispose();
                }
                if (this.model.material) {
                    if (Array.isArray(this.model.material)) {
                        this.model.material.forEach(m => m.dispose());
                    } else {
                        this.model.material.dispose();
                    }
                }
                this.model = null;
            }
            const modelName = modelPath.split('/').pop().split('.')[0];
            fetch(modelPath, { method: 'HEAD' })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`STL file not found: ${modelPath}`);
                    }
                    return this.loadSTLFile(modelPath);
                })
                .catch(error => {
                    console.warn(`Could not load STL file: ${error.message}.`);
                    if (this.loadingAnimation) {
                        this.loadingAnimation.innerHTML = `
                            <div class="error-icon">!</div>
                            <p>Failed to load model: ${error.message}</p>
                            <button class="retry-btn" onclick="window.modelViewer.retryLoading('${modelPath}')">Try Again</button>
                        `;
                    }
                    this.isLoading = false;
                });
        },
        retryLoading(modelPath) {
            if (this.loadingAnimation) {
                this.loadingAnimation.innerHTML = `
                    <div class="model-spinner"></div>
                    <p>Loading 3D Model...</p>
                `;
            }
            this.currentModel = '';
            this.loadModel(modelPath);
        },
        loadSTLFile(modelPath) {
            return new Promise((resolve, reject) => {
                try {
                    const loader = new THREE.STLLoader();
                    loader.load(
                        modelPath,
                        (geometry) => {
                            try {
                                console.log(`STL file loaded successfully: ${modelPath}`);
                                if (!geometry.attributes.normal) {
                                    geometry.computeVertexNormals();
                                }
                                const material = new THREE.MeshPhongMaterial({
                                    color: 0xb3743a,
                                    specular: 0x111111,
                                    shininess: 200,
                                    flatShading: false
                                });
                                const mesh = new THREE.Mesh(geometry, material);
                                mesh.rotation.x = -Math.PI / 2;
                                geometry.computeBoundingBox();
                                const boundingBox = geometry.boundingBox;
                                const center = new THREE.Vector3();
                                boundingBox.getCenter(center);
                                mesh.position.set(-center.x, -center.y, -center.z);
                                const size = boundingBox.getSize(new THREE.Vector3());
                                const maxDim = Math.max(size.x, size.y, size.z);
                                const scale = 10 / maxDim;
                                mesh.scale.set(scale, scale, scale);
                                mesh.castShadow = true;
                                mesh.receiveShadow = true;
                                this.model = mesh;
                                this.scene.add(this.model);
                                this.resetCamera();
                                if (this.loadingAnimation) {
                                    this.loadingAnimation.style.opacity = '0';
                                    setTimeout(() => {
                                        this.loadingAnimation.style.display = 'none';
                                    }, 300);
                                }
                                this.isLoading = false;
                                resolve();
                            } catch (innerError) {
                                console.error('Error processing geometry:', innerError);
                                reject(innerError);
                            }
                        },
                        (xhr) => {
                            console.log(`${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded`);
                        },
                        (error) => {
                            if (error.message && error.message.includes('allocation failed')) {
                                console.error('Memory allocation error - model may be too large');
                                reject(new Error('Model is too large for available memory. Try a smaller model.'));
                            } else {
                                console.error('Error loading STL model:', error);
                                reject(error);
                            }
                        }
                    );
                } catch (error) {
                    console.error('Exception while loading STL:', error);
                    reject(error);
                }
            });
        },
        resetCamera() {
            if (!this.model) return;
            const box = new THREE.Box3().setFromObject(this.model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = this.camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
            cameraZ *= 1.2;
            this.camera.position.set(center.x, center.y, center.z + cameraZ);
            this.controls.target.copy(center);
            this.controls.update();
        },
        toggleRotation() {
            this.autoRotate = !this.autoRotate;
            this.controls.autoRotate = this.autoRotate;
            const rotateBtn = document.getElementById('rotate-toggle');
            if (rotateBtn) {
                if (this.autoRotate) {
                    rotateBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    rotateBtn.setAttribute('title', 'Pause Rotation');
                } else {
                    rotateBtn.innerHTML = '<i class="fas fa-play"></i>';
                    rotateBtn.setAttribute('title', 'Start Rotation');
                }
            }
        },
        toggleWireframe() {
            if (!this.model) return;
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.material.wireframe = !child.material.wireframe;
                }
            });
            const wireframeBtn = document.getElementById('wireframe-toggle');
            if (wireframeBtn) {
                wireframeBtn.classList.toggle('active');
            }
        },
        toggleModelInfo() {
            if (this.modelInfo) {
                this.modelInfo.classList.toggle('hidden');
                const infoBtn = document.getElementById('info-toggle');
                if (infoBtn) {
                    infoBtn.classList.toggle('active');
                }
            }
        },
        rotateModel90() {
            if (!this.model) return;
            this.model.rotation.y += Math.PI / 2;
        },
        addEventListeners() {
            const backBtn = document.getElementById('back-to-projects');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    if (window.pageNavigation && window.pageNavigation.showProjects) {
                        window.pageNavigation.showProjects();
                    }
                });
            }
            const rotate90Btn = document.getElementById('rotate-90');
            if (rotate90Btn) {
                rotate90Btn.addEventListener('click', () => {
                    this.rotateModel90();
                    this.addClickEffect(rotate90Btn);
                });
            }
            const rotateBtn = document.getElementById('rotate-toggle');
            if (rotateBtn) {
                rotateBtn.addEventListener('click', () => {
                    this.toggleRotation();
                    this.addClickEffect(rotateBtn);
                });
            }
            const resetBtn = document.getElementById('reset-view');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    this.resetCamera();
                    this.addClickEffect(resetBtn);
                });
            }
            const wireframeBtn = document.getElementById('wireframe-toggle');
            if (wireframeBtn) {
                wireframeBtn.addEventListener('click', () => {
                    this.toggleWireframe();
                    this.addClickEffect(wireframeBtn);
                });
            }
            const infoBtn = document.getElementById('info-toggle');
            if (infoBtn) {
                infoBtn.addEventListener('click', () => {
                    this.toggleModelInfo();
                    this.addClickEffect(infoBtn);
                });
            }
            const tipsToggle = document.querySelector('.model-tips-toggle');
            if (tipsToggle) {
                tipsToggle.addEventListener('click', () => {
                    this.toggleModelInfo();
                    this.addClickEffect(tipsToggle);
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
        onWindowResize() {
            if (!this.camera || !this.renderer || !this.viewerContainer) return;
            this.camera.aspect = this.viewerContainer.clientWidth / this.viewerContainer.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.viewerContainer.clientWidth, this.viewerContainer.clientHeight);
        },
        updateTheme() {
            if (!this.scene) return;
            if (document.body.classList.contains('dark-mode')) {
                this.scene.background = new THREE.Color(0x2a2a2a);
            } else {
                this.scene.background = new THREE.Color(0xf5f5f5);
            }
        },
        animate() {
            requestAnimationFrame(() => this.animate());
            if (this.controls) {
                this.controls.update();
            }
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        }
    };
    modelViewer.init();
    return modelViewer;
}
function init3DSection() {
    const modelContainer = document.querySelector('.model-container');
    if (!modelContainer) {
        console.error('Model container not found!');
        return null;
    }
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && 
                modelContainer.classList.contains('active')) {
                if (!window.modelViewer) {
                    window.modelViewer = init3DViewer();
                }
                const modelPath = modelContainer.dataset.modelPath || 'stl/default.stl';
                const modelName = modelContainer.dataset.modelName || 'Architectural Model';
                const modelInfo = modelContainer.dataset.modelInfo || 'Interactive 3D model of the project. Explore it by rotating, zooming, and panning.';
                window.modelViewer.loadModel(modelPath, modelName, modelInfo);
            }
        });
    });
    observer.observe(modelContainer, { attributes: true });
    if (window.pageNavigation) {
        window.pageNavigation.show3DModel = function(modelPath, name, info) {
            document.querySelectorAll('.pdf-container, .about-container, .cv-container, .projects-container, .model-container').forEach(c => {
                c.classList.remove('active');
            });
            modelContainer.dataset.modelPath = modelPath;
            modelContainer.dataset.modelName = name;
            modelContainer.dataset.modelInfo = info;
            modelContainer.classList.add('active');
            if (!window.modelViewer) {
                window.modelViewer = init3DViewer();
            }
            window.modelViewer.loadModel(modelPath, name, info);
        };
    }
    document.addEventListener('themeChange', () => {
        if (window.modelViewer) {
            window.modelViewer.updateTheme();
        }
    });
    return {
        showModel: (modelPath, name, info) => {
            if (window.pageNavigation && window.pageNavigation.show3DModel) {
                window.pageNavigation.show3DModel(modelPath, name, info);
            }
        }
    };
}
document.addEventListener('DOMContentLoaded', () => {
    window.model3DSection = init3DSection();
});
function enhance3DControls() {
    if (!window.modelViewer) return;
    const keyboardControls = {
        keysPressed: {},
        moveSpeed: 0.02,
        rotateSpeed: 0.001,
        init() {
            document.addEventListener('keydown', (e) => this.onKeyDown(e));
            document.addEventListener('keyup', (e) => this.onKeyUp(e));
            this.animate();
            console.log('3D keyboard controls initialized (W,A,S,D to move, Q,E to rotate, Mouse scroll to zoom)');
        },
        onKeyDown(e) {
            if (!document.querySelector('.model-container.active')) return;
            this.keysPressed[e.key.toLowerCase()] = true;
            if (['w', 'a', 's', 'd', 'q', 'e'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        },
        onKeyUp(e) {
            this.keysPressed[e.key.toLowerCase()] = false;
        },
        animate() {
            requestAnimationFrame(() => this.animate());
            if (!document.querySelector('.model-container.active') || !window.modelViewer.model) return;
            this.processMovement();
        },
        processMovement() {
            const moveSpeed = this.moveSpeed;
            const rotateSpeed = this.rotateSpeed;
            const camera = window.modelViewer.camera;
            const controls = window.modelViewer.controls;
            if (!camera || !controls) return;
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            const sideways = new THREE.Vector3();
            sideways.crossVectors(camera.up, direction).normalize();
            if (this.keysPressed['w']) {
                camera.position.addScaledVector(direction, moveSpeed);
                controls.target.addScaledVector(direction, moveSpeed);
            }
            if (this.keysPressed['s']) {
                camera.position.addScaledVector(direction, -moveSpeed);
                controls.target.addScaledVector(direction, -moveSpeed);
            }
            if (this.keysPressed['a']) {
                camera.position.addScaledVector(sideways, -moveSpeed);
                controls.target.addScaledVector(sideways, -moveSpeed);
            }
            if (this.keysPressed['d']) {
                camera.position.addScaledVector(sideways, moveSpeed);
                controls.target.addScaledVector(sideways, moveSpeed);
            }
            if (this.keysPressed['q']) {
                window.modelViewer.model.rotation.y -= rotateSpeed;
            }
            if (this.keysPressed['e']) {
                window.modelViewer.model.rotation.y += rotateSpeed;
            }
            controls.update();
        }
    };
    function enhanceZoom() {
        if (window.modelViewer.controls) {
            window.modelViewer.controls.minDistance = 1;
            window.modelViewer.controls.maxDistance = 500;
            document.getElementById('model-viewer').addEventListener('wheel', (e) => {
                if (e.shiftKey) {
                    e.preventDefault();
                    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
                    const camera = window.modelViewer.camera;
                    const controls = window.modelViewer.controls;
                    if (camera && controls) {
                        const direction = new THREE.Vector3().subVectors(
                            camera.position,
                            controls.target
                        );
                        direction.multiplyScalar(zoomFactor);
                        camera.position.copy(controls.target).add(direction);
                        controls.update();
                    }
                }
            }, { passive: false });
        }
    }
    function addKeyboardInfo() {
        const modelInfo = document.querySelector('.model-information');
        if (modelInfo) {
            const keyboardTips = document.createElement('div');
            keyboardTips.className = 'keyboard-tips';
            keyboardTips.innerHTML = `
                <h5>Keyboard Controls:</h5>
                <ul>
                    <li><strong>W, A, S, D</strong> - Move camera</li>
                    <li><strong>Q, E</strong> - Rotate model</li>
                    <li><strong>Scroll</strong> - Zoom in/out</li>
                    <li><strong>Shift+Scroll</strong> - Fast zoom</li>
                </ul>
            `;
            modelInfo.appendChild(keyboardTips);
        }
    }
    keyboardControls.init();
    enhanceZoom();
    mobileControls.init();
    addKeyboardInfo();
    return {
        keyboardControls,
        mobileControls
    };
}
function addJoystickStyles() {
    const joystickStyles = document.createElement('style');
    joystickStyles.textContent = `
        .joystick-container {
            position: absolute;
            bottom: 20px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
            z-index: 10;
            pointer-events: none;
        }
        .joystick {
            width: 120px;
            height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
        }
        .joystick-base {
            width: 100px;
            height: 100px;
            background-color: rgba(0, 0, 0, 0.2);
            border: 2px solid rgba(179, 116, 58, 0.7);
            border-radius: 50%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
        }
        .dark-mode .joystick-base {
            background-color: rgba(255, 255, 255, 0.15);
        }
        .joystick-thumb {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #b3743a, #d9a066);
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(0, 0);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            pointer-events: none;
        }
        .joystick-label {
            margin-top: 8px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.8rem;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
            pointer-events: none;
        }
        .keyboard-tips {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid rgba(179, 116, 58, 0.3);
        }
        .keyboard-tips h5 {
            font-size: 0.9rem;
            margin-bottom: 5px;
            color: var(--accent-color);
        }
        .keyboard-tips ul {
            padding-left: 15px;
            margin: 5px 0;
            font-size: 0.8rem;
        }
        .keyboard-tips li {
            margin-bottom: 3px;
        }
        @media (min-width: 769px) {
            .joystick-container {
                display: none;
            }
        }
    `;
    document.head.appendChild(joystickStyles);
}
function initialize3DEnhancements() {
    addJoystickStyles();
    if (window.modelViewer) {
        enhance3DControls();
    } else {
        const checkInterval = setInterval(() => {
            if (window.modelViewer) {
                clearInterval(checkInterval);
                enhance3DControls();
            }
        }, 500);
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
}
document.addEventListener('DOMContentLoaded', initialize3DEnhancements);
const modelContainer = document.querySelector('.model-container');
if (modelContainer) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && 
                modelContainer.classList.contains('active')) {
                initialize3DEnhancements();
            }
        });
    });
    observer.observe(modelContainer, { attributes: true });
}
function initSkillBars() {
    const skillsData = [
        { name: "Revit", level: 100, icon: "img/skills/revit.png" },
        { name: "ArcGIS", level: 70, icon: "img/skills/arcgis.png" },
        { name: "Rhino", level: 90, icon: "img/skills/rhino.png" },
        { name: "Sketchup", level: 85, icon: "img/skills/sketchup.png" },
        { name: "Photoshop", level: 100, icon: "img/skills/photoshop.png" },
        { name: "InDesign", level: 100, icon: "img/skills/indesign.png" },
        { name: "TwinMotion", level: 100, icon: "img/skills/twinmotion.png" },
        { name: "Grasshopper", level: 100, icon: "img/skills/grasshopper.png" },
        { name: "AutoCAD", level: 80, icon: "img/skills/autocad.png" },
        { name: "Model Making", level: 100, icon: "img/skills/modelmaking.png" },
        { name: "3D Printing", level: 75, icon: "img/skills/3d-printing.png" },
        { name: "Procreate", level: 100, icon: "img/skills/procreate.png" }
    ];
    function updateSkillCards() {
        const skillCards = document.querySelectorAll('.skill-card');
        if (skillCards.length !== skillsData.length) {
            rebuildSkillCards();
            return;
        }
        skillCards.forEach((card, index) => {
            const data = skillsData[index];
            if (!data) return;
            const skillIcon = card.querySelector('.skill-icon');
            const skillName = card.querySelector('.skill-name');
            if (skillIcon) {
                skillIcon.innerHTML = `<img src="${data.icon}" alt="${data.name}" />`;
            }
            if (skillName) {
                skillName.textContent = data.name;
            }
            let skillLevel = card.querySelector('.skill-level');
            if (!skillLevel) {
                skillLevel = document.createElement('div');
                skillLevel.className = 'skill-level';
                card.appendChild(skillLevel);
                const progress = document.createElement('div');
                progress.className = 'skill-progress';
                skillLevel.appendChild(progress);
            }
            const progress = skillLevel.querySelector('.skill-progress');
            if (progress) {
                progress.style.width = '0%';
                progress.dataset.width = `${data.level}%`;
            }
        });
    }
    function rebuildSkillCards() {
        const aboutGrid = document.querySelector('.about-grid');
        if (!aboutGrid) return;
        aboutGrid.innerHTML = '';
        skillsData.forEach(skill => {
            const card = document.createElement('div');
            card.className = 'skill-card';
            const icon = document.createElement('div');
            icon.className = 'skill-icon';
            icon.innerHTML = `<img src="${skill.icon}" alt="${skill.name}" />`;
            const name = document.createElement('div');
            name.className = 'skill-name';
            name.textContent = skill.name;
            const level = document.createElement('div');
            level.className = 'skill-level';
            const progress = document.createElement('div');
            progress.className = 'skill-progress';
            progress.style.width = '0%';
            progress.dataset.width = `${skill.level}%`;
            level.appendChild(progress);
            card.appendChild(icon);
            card.appendChild(name);
            card.appendChild(level);
            aboutGrid.appendChild(card);
        });
    }
    function animateSkillBars() {
        document.querySelectorAll('.skill-progress').forEach((bar, i) => {
            const width = bar.dataset.width || '0%';
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
                bar.classList.add('skill-shimmer');
                setTimeout(() => {
                    bar.classList.remove('skill-shimmer');
                }, 1500);
            }, 100 + i * 120);
        });
    }
    const originalShowAbout = window.pageNavigation?.showAbout;
    if (window.pageNavigation && originalShowAbout) {
        window.pageNavigation.showAbout = function() {
            originalShowAbout();
            updateSkillCards();
            setTimeout(animateSkillBars, 300);
        };
    }
    function addSkillBarStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .skill-icon img {
                width: 36px;
                height: 36px;
                object-fit: contain;
            }
            .skill-level {
                width: 100%;
                height: 6px;
                background-color: rgba(0, 0, 0, 0.05);
                border-radius: 3px;
                overflow: hidden;
                margin-top: var(--spacing-sm);
                position: relative;
                z-index: 1;
            }
            .dark-mode .skill-level {
                background-color: rgba(255, 255, 255, 0.1);
            }
            .skill-progress {
                height: 100%;
                background: var(--accent-gradient);
                border-radius: 3px;
                width: 0%;
                transition: width 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                position: relative;
                overflow: hidden;
            }
            .skill-shimmer::after {
                content: '';
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
            .skill-card {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .skill-card .skill-icon {
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        document.head.appendChild(styleElement);
    }
    addSkillBarStyles();
    updateSkillCards();
    if (document.querySelector('.about-container.active')) {
        setTimeout(animateSkillBars, 300);
    }
    function setupSkillIcons() {
        console.log('Remember to add skill icon images to img/skills/ directory');
    }
    setupSkillIcons();
    return {
        updateSkillCards,
        animateSkillBars
    };
}
document.addEventListener('DOMContentLoaded', initSkillBars);
function handleSkillIcons() {
    const skillIcons = [
        { name: "revit", fallbackIcon: "fas fa-building" },
        { name: "3d-printing", fallbackIcon: "fas fa-print" },
        { name: "arcgis", fallbackIcon: "fas fa-map" },
        { name: "rhino", fallbackIcon: "fas fa-shapes" },
        { name: "sketchup", fallbackIcon: "fas fa-cube" },
        { name: "photoshop", fallbackIcon: "fas fa-image" },
        { name: "indesign", fallbackIcon: "fas fa-file-invoice" },
        { name: "grasshopper", fallbackIcon: "fas fa-bezier-curve" },
        { name: "autocad", fallbackIcon: "fas fa-drafting-compass" },
        { name: "painting", fallbackIcon: "fas fa-paint-brush" },
        { name: "twinmotion", fallbackIcon: "fas fa-vr-cardboard" },
        { name: "procreate", fallbackIcon: "fas fa-paint-brush" }
    ];
    function addImageErrorHandling() {
        document.querySelectorAll('.skill-icon img').forEach((img, index) => {
            const skill = skillIcons[index] || skillIcons[0];
            img.onerror = function() {
                const iconElement = this.parentElement;
                iconElement.innerHTML = `<i class="${skill.fallbackIcon}"></i>`;
                console.log(`Failed to load image for ${skill.name}, using fallback icon`);
            };
        });
    }
    function checkSkillImages() {
        skillIcons.forEach(skill => {
            const img = new Image();
            const path = `img/skills/${skill.name}.png`;
            img.onload = function() {
                console.log(`Skill icon for ${skill.name} loaded successfully`);
            };
            img.onerror = function() {
                console.warn(`Skill icon for ${skill.name} not found at ${path}`);
            };
            img.src = path;
        });
    }
    function createDirectoryStructure() {
        console.log(`
For the skill icons to work properly, please create the following directory structure:
/img/skills/
  - revit.png
  - 3d-printing.png
  - arcgis.png
  - rhino.png
  - sketchup.png
  - photoshop.png
  - twinmotion.png
  - procreate.png
Until these images are added, the site will use FontAwesome icons as fallbacks.
        `);
    }
    function setupExistingImages() {
        setTimeout(() => {
            addImageErrorHandling();
        }, 500);
    }
    createDirectoryStructure();
    checkSkillImages();
    setupExistingImages();
    const aboutContainer = document.querySelector('.about-container');
    if (aboutContainer) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && 
                    aboutContainer.classList.contains('active')) {
                    setupExistingImages();
                }
            });
        });
        observer.observe(aboutContainer, { attributes: true });
    }
    document.addEventListener('DOMSubtreeModified', function(e) {
        if (e.target.classList && e.target.classList.contains('about-grid')) {
            setupExistingImages();
        }
    });
    return {
        addImageErrorHandling,
        checkSkillImages
    };
}
function add3DControlsHelp() {
    function createHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'controls-help-modal';
        modal.innerHTML = `
            <div class="controls-help-content">
                <button class="controls-help-close"><i class="fas fa-times"></i></button>
                <div class="controls-help-title">
                    <i class="fas fa-gamepad"></i>
                    3D Model Controls
                </div>
                <div class="controls-section">
                    <h3><i class="fas fa-keyboard"></i> Keyboard Controls</h3>
                    <div class="controls-grid">
                        <div class="control-item">
                            <div class="control-key">W</div>
                            <div class="control-desc">Move forward</div>
                        </div>
                        <div class="control-item">
                            <div class="control-key">S</div>
                            <div class="control-desc">Move backward</div>
                        </div>
                        <div class="control-item">
                            <div class="control-key">A</div>
                            <div class="control-desc">Move left</div>
                        </div>
                        <div class="control-item">
                            <div class="control-key">D</div>
                            <div class="control-desc">Move right</div>
                        </div>
                        <div class="control-item">
                            <div class="control-key">Q</div>
                            <div class="control-desc">Rotate left</div>
                        </div>
                        <div class="control-item">
                            <div class="control-key">E</div>
                            <div class="control-desc">Rotate right</div>
                        </div>
                    </div>
                </div>
                <div class="controls-section">
                    <h3><i class="fas fa-mouse"></i> Mouse Controls</h3>
                    <div class="controls-grid">
                        <div class="control-item">
                            <div class="control-key"><i class="fas fa-mouse"></i></div>
                            <div class="control-desc">Drag to rotate view</div>
                        </div>
                        <div class="control-item">
                            <div class="control-key"><i class="fas fa-scroll"></i></div>
                            <div class="control-desc">Zoom in/out</div>
                        </div>
                        <div class="control-item">
                            <div class="control-key">⇧+<i class="fas fa-scroll"></i></div>
                            <div class="control-desc">Fast zoom</div>
                        </div>
                        <div class="control-item">
                            <div class="control-key">Right-click</div>
                            <div class="control-desc">Pan camera</div>
                        </div>
                    </div>
                </div>
                <div class="controls-section">
                    <h3><i class="fas fa-mobile-alt"></i> Touch Controls</h3>
                    <div class="controls-grid">
                        <div class="control-item">
                            <div class="control-key"><i class="fas fa-hand-pointer"></i></div>
                            <div class="control-desc">Drag to rotate view</div>
                        </div>
                        <div class="control-item">
                            <div class="control-key"><i class="fas fa-expand"></i></div>
                            <div class="control-desc">Pinch to zoom</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const closeBtn = modal.querySelector('.controls-help-close');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        return modal;
    }
    function createHelpButton() {
        const modelViewerContainer = document.querySelector('.model-viewer-container');
        if (!modelViewerContainer) return;
        const helpBtn = document.createElement('button');
        helpBtn.className = 'model-help-btn';
        helpBtn.innerHTML = '<i class="fas fa-question"></i>';
        helpBtn.setAttribute('title', 'Control Help');
        modelViewerContainer.appendChild(helpBtn);
        return helpBtn;
    }
    function createKeyIndicators() {
        const modelViewer = document.getElementById('model-viewer');
        if (!modelViewer) return;
        const keys = ['w', 'a', 's', 'd', 'q', 'e'];
        const indicators = {};
        keys.forEach(key => {
            const indicator = document.createElement('div');
            indicator.className = `key-indicator key-${key}`;
            indicator.textContent = key.toUpperCase();
            modelViewer.appendChild(indicator);
            indicators[key] = indicator;
        });
        return indicators;
    }
    function setupKeyIndicators(indicators) {
        if (!indicators) return;
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (indicators[key]) {
                indicators[key].classList.add('active');
            }
        });
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (indicators[key]) {
                indicators[key].classList.remove('active');
            }
        });
    }
    const modal = createHelpModal();
    const helpBtn = createHelpButton();
    const keyIndicators = createKeyIndicators();
    if (helpBtn && modal) {
        helpBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }
    setupKeyIndicators(keyIndicators);
    const modelContainer = document.querySelector('.model-container');
    if (modelContainer) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && 
                    modelContainer.classList.contains('active')) {
                    if (!document.querySelector('.model-help-btn')) {
                        const newHelpBtn = createHelpButton();
                        if (newHelpBtn && modal) {
                            newHelpBtn.addEventListener('click', () => {
                                modal.classList.add('active');
                            });
                        }
                    }
                    if (!document.querySelector('.key-indicator')) {
                        const newKeyIndicators = createKeyIndicators();
                        setupKeyIndicators(newKeyIndicators);
                    }
                }
            });
        });
        observer.observe(modelContainer, { attributes: true });
    }
    window.addEventListener('resize', () => {
        if (document.querySelector('.model-container.active')) {
            if (!document.querySelector('.model-help-btn')) {
                const newHelpBtn = createHelpButton();
                if (newHelpBtn && modal) {
                    newHelpBtn.addEventListener('click', () => {
                        modal.classList.add('active');
                    });
                }
            }
            if (!document.querySelector('.key-indicator')) {
                const newKeyIndicators = createKeyIndicators();
                setupKeyIndicators(newKeyIndicators);
            }
        }
    });
    return {
        modal,
        helpBtn,
        keyIndicators
    };
}
document.addEventListener('DOMContentLoaded', add3DControlsHelp);