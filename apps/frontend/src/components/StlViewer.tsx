import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface StlViewerProps {
    fileUrl: string;
    width?: number;
    height?: number;
    backgroundColor?: string;
}

export function StlViewer({
    fileUrl,
    width = 600,
    height = 400,
    backgroundColor = '#1a1a2e'
}: StlViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(backgroundColor);

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            1000
        );
        camera.position.set(0, 0, 100);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);

        // Orbit controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 10;
        controls.maxDistance = 500;
        controls.maxPolarAngle = Math.PI;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
        backLight.position.set(-10, -10, -10);
        scene.add(backLight);

        // Grid helper removed for cleaner look
        // const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
        // scene.add(gridHelper);

        // Load STL
        const loader = new STLLoader();
        loader.load(
            fileUrl,
            (geometry) => {
                // Center the geometry
                geometry.computeBoundingBox();
                const center = new THREE.Vector3();
                geometry.boundingBox!.getCenter(center);
                geometry.translate(-center.x, -center.y, -center.z);

                // Auto-orient: Find largest flat surface and orient it downward
                geometry.computeVertexNormals();
                const positions = geometry.attributes.position;
                const normals = geometry.attributes.normal;

                let largestArea = 0;
                let bestNormal = new THREE.Vector3(0, -1, 0);

                // Analyze triangles to find largest flat region
                for (let i = 0; i < positions.count; i += 3) {
                    const v0 = new THREE.Vector3().fromBufferAttribute(positions, i);
                    const v1 = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
                    const v2 = new THREE.Vector3().fromBufferAttribute(positions, i + 2);

                    const edge1 = new THREE.Vector3().subVectors(v1, v0);
                    const edge2 = new THREE.Vector3().subVectors(v2, v0);
                    const cross = new THREE.Vector3().crossVectors(edge1, edge2);
                    const area = cross.length() / 2;

                    const n0 = new THREE.Vector3().fromBufferAttribute(normals, i);
                    const n1 = new THREE.Vector3().fromBufferAttribute(normals, i + 1);
                    const n2 = new THREE.Vector3().fromBufferAttribute(normals, i + 2);
                    const faceNormal = new THREE.Vector3().addVectors(n0, n1).add(n2).normalize();

                    const verticalAlignment = Math.abs(faceNormal.y);
                    const weightedArea = area * (0.5 + verticalAlignment * 0.5);

                    if (weightedArea > largestArea) {
                        largestArea = weightedArea;
                        bestNormal.copy(faceNormal);
                    }
                }

                // Rotate to align best surface with ground
                const targetNormal = new THREE.Vector3(0, -1, 0);
                const rotationAxis = new THREE.Vector3().crossVectors(bestNormal, targetNormal).normalize();
                const rotationAngle = Math.acos(bestNormal.dot(targetNormal));

                if (rotationAxis.length() > 0.001 && !isNaN(rotationAngle)) {
                    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(rotationAxis, rotationAngle);
                    geometry.applyMatrix4(rotationMatrix);
                    geometry.computeVertexNormals();
                }

                // Create material with nice colors
                const material = new THREE.MeshPhongMaterial({
                    color: 0x00d4ff,
                    specular: 0x111111,
                    shininess: 200,
                    flatShading: false,
                });

                const mesh = new THREE.Mesh(geometry, material);

                // Add wireframe overlay
                const wireframeMaterial = new THREE.MeshBasicMaterial({
                    color: 0x0088cc,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.1,
                });
                const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
                mesh.add(wireframe);

                scene.add(mesh);

                // Auto-fit camera to model
                const box = new THREE.Box3().setFromObject(mesh);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const fov = camera.fov * (Math.PI / 180);
                let cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;
                camera.position.z = cameraZ;
                camera.lookAt(0, 0, 0);
                controls.update();

                setLoading(false);
            },
            (progress) => {
                console.log((progress.loaded / progress.total) * 100 + '% loaded');
            },
            (err) => {
                console.error('Error loading STL:', err);
                setError('Failed to load 3D model');
                setLoading(false);
            }
        );

        // Animation loop
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            cancelAnimationFrame(animationId);
            controls.dispose();
            renderer.dispose();
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, [fileUrl, width, height, backgroundColor]);

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className="rounded-lg overflow-hidden shadow-2xl border border-cyan-500/30"
            />
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-cyan-400 font-medium">Loading 3D model...</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 rounded-lg">
                    <p className="text-red-400 font-medium">{error}</p>
                </div>
            )}
        </div>
    );
}
