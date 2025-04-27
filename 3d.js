function init3DViewer() {
    const modelViewer = {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        model: null,
        currentModel: '',
        isLoading: false,
        autoRotate: true,
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
