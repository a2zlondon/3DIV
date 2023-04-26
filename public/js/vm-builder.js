import * as THREE from '../../js/libs/three/three.module.js';
import { GLTFLoader } from '../../js/libs/three/jsm/GLTFLoader.js';
import { FBXLoader } from '../../js/libs/three/jsm/FBXLoader.js';
import { RGBELoader } from '../../js/libs/three/jsm/RGBELoader.js';
import { OrbitControls } from '../../js/libs/three/jsm/OrbitControls.js';
import { LoadingBar } from '../../js/libs/LoadingBar.js';
import { Stats } from '../../js/libs/stats.module.js';
import { ARButton } from '../../js/libs/ARButton.js';

class VMBuilder {
    constructor() {
        const container = document.createElement('div');
        //document.body.appendChild(container);
        document.getElementById('3dviewer').appendChild(container);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 4, 14);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);

        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.5);
        this.scene.add(ambient);

        const light = new THREE.DirectionalLight(0xFFFFFF, 1.5);
        light.position.set(0.2, 1, 1);
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        this.renderer.setSize(window.innerWidth/2, window.innerHeight/2);
        
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        container.appendChild(this.renderer.domElement);
        this.setEnvironment();

        this.loadingBar = new LoadingBar();

        this.loadGLTF();
        //this.loadFBX();

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();

        this.stats = new Stats();

        this.initScene();
        this.setupVR();

        window.addEventListener('resize', this.resize.bind(this));
    }

    initScene() {
        this.geometry = new THREE.BoxBufferGeometry(0.06, 0.06, 0.06);
        this.meshes = [];
    }

    setupVR() {
        this.renderer.xr.enabled = true;

        const self = this;
        let controller;

        function onSelect() {
            const material = new THREE.MeshPhongMaterial({ color: 0xffffff * Math.random() });
            const mesh = new THREE.Mesh(self.geometry, material);
            mesh.position.set(0, 0, - 0.3).applyMatrix4(controller.matrixWorld);
            mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
            self.scene.add(mesh);
            self.meshes.push(mesh);

        }

        const btn = new ARButton(this.renderer);

        controller = this.renderer.xr.getController(0);
        controller.addEventListener('select', onSelect);
        this.scene.add(controller);

        this.renderer.setAnimationLoop(this.render.bind(this));
    }

    setEnvironment() {
        const loader = new RGBELoader().setDataType(THREE.UnsignedByteType);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        const self = this;

        // loader.load('/assets/hdr/venice_sunset_1k.hdr', (texture) => {
        //     const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        //     pmremGenerator.dispose();

        //     self.scene.environment = envMap;

        // }, undefined, (err) => {
        //     console.error('An error occurred setting the environment');
        // });
    }

    loadGLTF() {
        const loader = new GLTFLoader().setPath('../assets/');
        const self = this;

        // Load a glTF resource
        loader.load(
            // resource URL
            //'VM_tshirt_basic.gltf',
            'office-chair.glb',
            //'VM_tshirt_basic_Textured.glb',
            // called when the resource is loaded
            function (gltf) {
                const bbox = new THREE.Box3().setFromObject(gltf.scene);
                console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);

                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        child.material.metalness = 0.2;
                    }
                })
                self.shirt = gltf.scene;

                self.scene.add(gltf.scene);

                self.loadingBar.visible = false;

                self.renderer.setAnimationLoop(self.render.bind(self));
            },
            // called while loading is progressing
            function (xhr) {

                self.loadingBar.progress = (xhr.loaded / xhr.total);

            },
            // called when loading has errors
            function (error) {

                console.log('An error happened');

            }
        );
    }

    loadFBX() {
        const loader = new FBXLoader().setPath('../assets/');
        const self = this;

        loader.load('VM_tshirt_basic.fbx',
            function (object) {
                self.shirt = object;

                self.scene.add(object);

                self.loadingBar.visible = false;

                self.renderer.setAnimationLoop(self.render.bind(self));
            },
            // called while loading is progressing
            function (xhr) {

                self.loadingBar.progress = (xhr.loaded / xhr.total);

            },
            // called when loading has errors
            function (error) {

                console.log('An error happened');

            }
        );
    }

    resize() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        //this.shirt.rotateY(0.009);
        this.renderer.render(this.scene, this.camera);
    }
}

export { VMBuilder };
