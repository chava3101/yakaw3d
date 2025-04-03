// Terrain lighting and visual effects manager
class TerrainLightingManager {
    constructor() {
        // Get the scene from QGIS2ThreeJS application
        this.scene = Q3D.application.scene;
        if (!this.scene) {
            console.error('Could not find Three.js scene in QGIS2ThreeJS application');
            return;
        }
        console.log('Found Three.js scene:', this.scene);
        
        this.currentTime = 'morning'; // 'morning' or 'afternoon'
        this.isCustomLightingActive = false;
        this.isCloudy = false;
        this.setupLighting();
        this.setupUI();
    }

    setupLighting() {
        if (!this.scene) return;

        // Get the light group from the scene
        const lightGroup = this.scene.lightGroup;
        if (!lightGroup) {
            console.error('Could not find light group in scene');
            return;
        }

        // Store original lights if they exist
        this.originalLights = Array.from(lightGroup.children);

        // Create our custom lights
        this.createCustomLights();
    }

    createCustomLights() {
        if (!this.scene) return;

        const lightGroup = this.scene.lightGroup;
        if (!lightGroup) return;

        // Clear existing lights
        while (lightGroup.children.length > 0) {
            lightGroup.remove(lightGroup.children[0]);
        }

        // Main directional light (sun) - Increased intensity for stronger shadows
        this.sunLight = new THREE.DirectionalLight(0xffffff, 15);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.bias = -0.0001;
        lightGroup.add(this.sunLight);

        // Ambient light - Reduced intensity to make shadows more visible
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        lightGroup.add(this.ambientLight);

        // Hemisphere light - Reduced intensity to make shadows more visible
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
        lightGroup.add(hemisphereLight);

        this.isCustomLightingActive = true;

        // Update the scene's lighting
        this.scene.dispatchEvent({ type: 'lightChanged' });
    }

    setupUI() {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1000';
        container.style.backgroundColor = 'rgba(0,0,0,0.7)';
        container.style.padding = '10px';
        container.style.borderRadius = '5px';

        const morningBtn = document.createElement('button');
        morningBtn.textContent = 'Simulación Mañana';
        morningBtn.onclick = () => this.setTimeOfDay('morning');
        morningBtn.style.margin = '5px';

        const afternoonBtn = document.createElement('button');
        afternoonBtn.textContent = 'Simulación Tarde';
        afternoonBtn.onclick = () => this.setTimeOfDay('afternoon');
        afternoonBtn.style.margin = '5px';

        const noScenarioBtn = document.createElement('button');
        noScenarioBtn.textContent = 'Sin Simulación';
        noScenarioBtn.onclick = () => this.removeCustomLighting();
        noScenarioBtn.style.margin = '5px';
        noScenarioBtn.style.backgroundColor = '#ff4444'; // Red color to indicate removal

        // Add cloudy checkbox
        const cloudyContainer = document.createElement('div');
        cloudyContainer.style.margin = '5px';
        cloudyContainer.style.color = 'white';
        
        const cloudyCheckbox = document.createElement('input');
        cloudyCheckbox.type = 'checkbox';
        cloudyCheckbox.id = 'cloudyCheckbox';
        cloudyCheckbox.style.marginRight = '5px';
        cloudyCheckbox.onchange = () => {
            this.isCloudy = cloudyCheckbox.checked;
            this.updateLighting();
        };
        
        const cloudyLabel = document.createElement('label');
        cloudyLabel.htmlFor = 'cloudyCheckbox';
        cloudyLabel.textContent = 'Nublado';
        
        cloudyContainer.appendChild(cloudyCheckbox);
        cloudyContainer.appendChild(cloudyLabel);

        container.appendChild(morningBtn);
        container.appendChild(afternoonBtn);
        container.appendChild(noScenarioBtn);
        container.appendChild(cloudyContainer);
        document.body.appendChild(container);
    }

    removeCustomLighting() {
        if (!this.scene) return;

        const lightGroup = this.scene.lightGroup;
        if (!lightGroup) return;

        // Clear all current lights
        while (lightGroup.children.length > 0) {
            lightGroup.remove(lightGroup.children[0]);
        }

        // Restore original lights if they exist
        if (this.originalLights) {
            this.originalLights.forEach(light => {
                lightGroup.add(light);
            });
        }

        this.isCustomLightingActive = false;
        this.sunLight = null;
        this.ambientLight = null;

        // Update the scene's lighting
        this.scene.dispatchEvent({ type: 'lightChanged' });
        
        // Force a render update
        Q3D.application.renderer.render(this.scene, Q3D.application.camera);
    }

    setTimeOfDay(time) {
        this.currentTime = time;
        
        // If custom lighting is not active, create it
        if (!this.isCustomLightingActive) {
            this.createCustomLights();
        }
        
        this.updateLighting();
    }

    updateLighting() {
        if (!this.scene || !this.isCustomLightingActive) return;

        // Get the light group
        const lightGroup = this.scene.lightGroup;
        if (!lightGroup) return;

        // Set base intensity and adjust for cloudy conditions
        const baseIntensity = 3.5;
        const lightIntensity = this.isCloudy ? baseIntensity * 0.3 : baseIntensity;
        const lightHeight = 60;

        if (this.currentTime === 'morning') {
            // Morning lighting (sun in east)
            this.sunLight.position.set(100, lightHeight, 0);
            this.sunLight.intensity = lightIntensity;
            this.sunLight.shadow.bias = -0.0001;
        } else {
            // Afternoon lighting (sun in west)
            this.sunLight.position.set(-100, lightHeight, 0);
            this.sunLight.intensity = lightIntensity;
            this.sunLight.shadow.bias = -0.0001;
        }

        // Adjust ambient light for cloudy conditions
        const baseAmbientIntensity = 0.3;
        this.ambientLight.intensity = this.isCloudy ? baseAmbientIntensity * 0.5 : baseAmbientIntensity;

        // Force shadow map update
        this.sunLight.shadow.needsUpdate = true;

        // Update the scene's lighting
        this.scene.dispatchEvent({ type: 'lightChanged' });
        
        // Force a render update
        Q3D.application.renderer.render(this.scene, Q3D.application.camera);
    }
}

// Initialize the lighting manager when the scene is loaded
var app = Q3D.application;
app.addEventListener('sceneLoaded', function() {
    console.log('Scene loaded, initializing lighting manager...');
    // Wait a short moment to ensure the scene is fully initialized
    setTimeout(() => {
        window.terrainLighting = new TerrainLightingManager();
    }, 100);
}); 