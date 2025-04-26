
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
        
        createFallbackGeometry(modelName) {

            let geometry;
            

            const size = 5;
            
            switch(modelName) {
                case 'abstract-block':

                    const group = new THREE.Group();
                    

                    const mainTower = new THREE.BoxGeometry(3, 8, 3);
                    const mainMesh = new THREE.Mesh(
                        mainTower, 
                        new THREE.MeshStandardMaterial({ color: 0xb3743a })
                    );
                    mainMesh.position.set(0, 4, 0);
                    group.add(mainMesh);
                    

                    const block1 = new THREE.BoxGeometry(5, 3, 3);
                    const block1Mesh = new THREE.Mesh(
                        block1, 
                        new THREE.MeshStandardMaterial({ color: 0xb3743a })
                    );
                    block1Mesh.position.set(-1, 1.5, 2);
                    group.add(block1Mesh);
                    

                    const block2 = new THREE.BoxGeometry(2, 5, 4);
                    const block2Mesh = new THREE.Mesh(
                        block2, 
                        new THREE.MeshStandardMaterial({ color: 0xb3743a })
                    );
                    block2Mesh.position.set(2, 2.5, 0);
                    group.add(block2Mesh);
                    
                    return group;
                    
                case 'education-academy':

                    const campus = new THREE.Group();
                    

                    const mainBuilding = new THREE.BoxGeometry(8, 2, 5);
                    const mainBuildingMesh = new THREE.Mesh(
                        mainBuilding, 
                        new THREE.MeshStandardMaterial({ color: 0xb3743a })
                    );
                    mainBuildingMesh.position.set(0, 1, 0);
                    campus.add(mainBuildingMesh);
                    

                    const tower = new THREE.CylinderGeometry(0.8, 0.8, 5, 8);
                    const towerMesh = new THREE.Mesh(
                        tower, 
                        new THREE.MeshStandardMaterial({ color: 0xb3743a })
                    );
                    towerMesh.position.set(3, 3.5, 0);
                    campus.add(towerMesh);
                    

                    const courtyard = new THREE.BoxGeometry(4, 0.1, 3);
                    const courtyardMesh = new THREE.Mesh(
                        courtyard, 
                        new THREE.MeshStandardMaterial({ color: 0x88bb44 })
                    );
                    courtyardMesh.position.set(0, 0.1, 0);
                    campus.add(courtyardMesh);
                    
                    return campus;
                    
                case 'music-conservatory':

                    const conservatory = new THREE.Group();
                    

                    const curve = new THREE.EllipseCurve(
                        0, 0,
                        4, 3,    
                        0, Math.PI * 2, 
                        false     
                    );
                    const points = curve.getPoints(50);
                    const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);
                    

                    const shape = new THREE.Shape();
                    shape.moveTo(points[0].x, points[0].y);
                    points.forEach(point => {
                        shape.lineTo(point.x, point.y);
                    });
                    

                    const extrudeSettings = {
                        steps: 1,
                        depth: 1.5,
                        bevelEnabled: true,
                        bevelThickness: 0.5,
                        bevelSize: 0.5,
                        bevelOffset: 0,
                        bevelSegments: 10
                    };
                    
                    const mainHall = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                    const mainHallMesh = new THREE.Mesh(
                        mainHall,
                        new THREE.MeshStandardMaterial({ color: 0xb3743a })
                    );
                    mainHallMesh.rotation.x = -Math.PI / 2;
                    mainHallMesh.position.set(0, 0.5, 2);
                    conservatory.add(mainHallMesh);
                    

                    const entrance = new THREE.CylinderGeometry(1, 1.5, 4, 8);
                    const entranceMesh = new THREE.Mesh(
                        entrance,
                        new THREE.MeshStandardMaterial({ color: 0xb3743a })
                    );
                    entranceMesh.position.set(0, 2.5, -2);
                    conservatory.add(entranceMesh);
                    
                    return conservatory;
                    
                case 'rooted-living':

                    const residential = new THREE.Group();
                    

                    const base = new THREE.CylinderGeometry(5, 5, 0.5, 32);
                    const baseMesh = new THREE.Mesh(
                        base,
                        new THREE.MeshStandardMaterial({ color: 0x88bb44 })
                    );
                    baseMesh.position.set(0, 0.25, 0);
                    residential.add(baseMesh);
                    

                    for (let i = 0; i < 4; i++) {
                        const level = new THREE.CylinderGeometry(4 - i * 0.7, 4 - i * 0.7, 1, 32);
                        const levelMesh = new THREE.Mesh(
                            level,
                            new THREE.MeshStandardMaterial({ color: 0xb3743a })
                        );
                        levelMesh.position.set(0, 1 + i * 1.2, 0);
                        residential.add(levelMesh);
                    }
                    

                    for (let i = 0; i < 6; i++) {
                        const angle = i * Math.PI / 3;
                        const radius = 3.5;
                        const x = Math.cos(angle) * radius;
                        const z = Math.sin(angle) * radius;
                        
                        const pillar = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
                        const pillarMesh = new THREE.Mesh(
                            pillar,
                            new THREE.MeshStandardMaterial({ color: 0xb3743a })
                        );
                        pillarMesh.position.set(x, 3, z);
                        residential.add(pillarMesh);
                    }
                    
                    return residential;
                    
                default:

                    const defaultGeometry = new THREE.Group();
                    

                    const baseGeo = new THREE.BoxGeometry(10, 0.5, 10);
                    const baseMeshDefault = new THREE.Mesh(
                        baseGeo,
                        new THREE.MeshStandardMaterial({ color: 0xb3743a })
                    );
                    baseMeshDefault.position.set(0, 0.25, 0);
                    defaultGeometry.add(baseMeshDefault);
                    

                    const mainGeo = new THREE.BoxGeometry(8, 4, 6);
                    const mainMeshDefault = new THREE.Mesh(
                        mainGeo,
                        new THREE.MeshStandardMaterial({ color: 0xb3743a })
                    );
                    mainMeshDefault.position.set(0, 2.5, 0);
                    defaultGeometry.add(mainMeshDefault);
                    

                    const roofGeo = new THREE.ConeGeometry(6, 3, 4);
                    const roofMesh = new THREE.Mesh(
                        roofGeo,
                        new THREE.MeshStandardMaterial({ color: 0xb3743a })
                    );
                    roofMesh.position.set(0, 6, 0);
                    roofMesh.rotation.y = Math.PI / 4;
                    defaultGeometry.add(roofMesh);
                    
                    return defaultGeometry;
            }
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
            

            if (this.model) {
                this.scene.remove(this.model);
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
                    console.warn(`Could not load STL file: ${error.message}. Creating fallback geometry.`);
                    this.createFallbackModel(modelName, name);
                });
        },
        
        loadSTLFile(modelPath) {
            return new Promise((resolve, reject) => {
                try {

                    const loader = new THREE.STLLoader();
                    
                    loader.load(
                        modelPath,
                        (geometry) => {

                            console.log(`STL file loaded successfully: ${modelPath}`);
                            console.log("Geometry stats:", {
                                vertices: geometry.attributes.position.count,
                                faces: geometry.attributes.position.count / 3
                            });
                            

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
                            console.log("Original bounding box:", {
                                min: boundingBox.min,
                                max: boundingBox.max
                            });
                            
                            const center = new THREE.Vector3();
                            boundingBox.getCenter(center);
                            mesh.position.set(-center.x, -center.y, -center.z);
                            

                            const size = boundingBox.getSize(new THREE.Vector3());
                            const maxDim = Math.max(size.x, size.y, size.z);
                            const scale = 10 / maxDim;
                            mesh.scale.set(scale, scale, scale);
                            
                            console.log(`Model centered at (${-center.x}, ${-center.y}, ${-center.z}) with scale ${scale}`);
                            

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
                            console.log(`Model added to scene at position:`, mesh.position);
                            resolve();
                        },
                        (xhr) => {

                            console.log(`${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded`);
                        },
                        (error) => {
                            console.error('Error loading STL model:', error);
                            reject(error);
                        }
                    );
                } catch (error) {
                    console.error('Exception while loading STL:', error);
                    reject(error);
                }
            });
        },
        createFallbackModel(modelName, displayName) {
            try {

                const fallbackModel = this.createFallbackGeometry(modelName);
                

                fallbackModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                

                this.model = fallbackModel;
                this.scene.add(this.model);
                

                this.resetCamera();
                

                if (this.modelInfo) {
                    const currentHtml = this.modelInfo.innerHTML;
                    const updatedHtml = currentHtml.replace(
                        '</p>',
                        '</p><p class="fallback-notice">Using a simplified model visualization.</p>'
                    );
                    this.modelInfo.innerHTML = updatedHtml;
                }
                

                if (this.loadingAnimation) {
                    this.loadingAnimation.style.opacity = '0';
                    setTimeout(() => {
                        this.loadingAnimation.style.display = 'none';
                    }, 300);
                }
                
                this.isLoading = false;
                console.log(`Created fallback model for ${modelName}`);
            } catch (error) {
                console.error('Error creating fallback model:', error);
                

                if (this.loadingAnimation) {
                    this.loadingAnimation.innerHTML = `
                        <div class="error-icon">!</div>
                        <p>Failed to display model: ${error.message || 'Unknown error'}</p>
                        <p class="error-hint">
                            Please try again later.
                        </p>
                    `;
                }
                
                this.isLoading = false;
            }
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
            
            const maxSafeVertices = 12000000;
            const vertirces = this.model.geometry?.attributes?.position?.count || 0;
            if (vertirces > maxSafeVertices) {
                console.warn(`Model has too many vertices (${vertirces}). Wireframe mode may not be supported.`);
                return;
            }

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
                    window.pageNavigation.showProjects();
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