/**
 * NeoOrbitViewer.js
 * 3D visualization of Near Earth Object trajectory using Three.js
 * Lightweight implementation for GitHub Pages deployment
 */

import { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

/**
 * Parse NEO orbital data to get visualization parameters
 */
const getOrbitalParams = (neo) => {
    const closeApproach = neo.close_approach_data?.[0];
    if (!closeApproach) return null;

    // Get miss distance in lunar units for scale
    const lunarDistance = parseFloat(closeApproach.miss_distance?.lunar) || 1;
    // Velocity for animation speed
    const velocity = parseFloat(closeApproach.relative_velocity?.kilometers_per_hour) || 10000;
    // Is hazardous
    const isHazardous = neo.is_potentially_hazardous_asteroid;

    return {
        lunarDistance,
        velocity,
        isHazardous,
        approachDate: closeApproach.close_approach_date,
        missDistanceKm: parseFloat(closeApproach.miss_distance?.kilometers) || 0,
    };
};

/**
 * NeoOrbitViewer component
 * @param {Object} props - Component props
 * @param {Object} props.neo - NEO data object
 * @param {Function} props.onClose - Close handler
 */
export default function NeoOrbitViewer({ neo, onClose }) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const animationRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);

    const orbitalParams = getOrbitalParams(neo);

    useEffect(() => {
        if (!containerRef.current || !orbitalParams) return;

        const container = containerRef.current;
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 300;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000011);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 15, 20);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);
        const sunLight = new THREE.PointLight(0xffff00, 2, 100);
        sunLight.position.set(-30, 0, 0);
        scene.add(sunLight);

        // Sun (small yellow sphere on the left)
        const sunGeometry = new THREE.SphereGeometry(2, 16, 16);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(-30, 0, 0);
        scene.add(sun);

        // Earth
        const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x2233ff,
            emissive: 0x112244,
        });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.position.set(0, 0, 0);
        scene.add(earth);

        // Earth's orbit path (simple circle)
        const earthOrbitGeometry = new THREE.RingGeometry(29.5, 30, 64);
        const earthOrbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x333366,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3,
        });
        const earthOrbit = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
        earthOrbit.rotation.x = Math.PI / 2;
        scene.add(earthOrbit);

        // NEO (asteroid)
        const neoSize = 0.3;
        const neoGeometry = new THREE.IcosahedronGeometry(neoSize, 0);
        const neoMaterial = new THREE.MeshPhongMaterial({
            color: orbitalParams.isHazardous ? 0xff0000 : 0x888888,
            emissive: orbitalParams.isHazardous ? 0x440000 : 0x222222,
        });
        const neoMesh = new THREE.Mesh(neoGeometry, neoMaterial);
        scene.add(neoMesh);

        // NEO trajectory (arc passing near Earth)
        const trajectoryPoints = [];
        const approachDistance = Math.min(5, orbitalParams.lunarDistance * 0.5);
        for (let i = 0; i <= 100; i++) {
            const t = (i - 50) / 25;
            const x = t * 8;
            const z = approachDistance + Math.abs(t) * 2;
            const y = t * 0.5;
            trajectoryPoints.push(new THREE.Vector3(x, y, z));
        }
        const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
        const trajectoryMaterial = new THREE.LineBasicMaterial({
            color: orbitalParams.isHazardous ? 0xff6666 : 0x66ff66,
            transparent: true,
            opacity: 0.6,
        });
        const trajectory = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
        scene.add(trajectory);

        // Point of closest approach marker
        const approachMarkerGeometry = new THREE.RingGeometry(0.3, 0.5, 16);
        const approachMarkerMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            side: THREE.DoubleSide,
        });
        const approachMarker = new THREE.Mesh(approachMarkerGeometry, approachMarkerMaterial);
        approachMarker.position.set(0, 0, approachDistance);
        approachMarker.rotation.x = Math.PI / 2;
        scene.add(approachMarker);

        // Stars background
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        for (let i = 0; i < 500; i++) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            starPositions.push(x, y, z);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);

        // Animation variables
        let neoProgress = 0;
        const speed = 0.005;

        // Animation loop
        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);

            if (isPlaying) {
                // Animate NEO along trajectory
                neoProgress += speed;
                if (neoProgress > 1) neoProgress = 0;

                const idx = Math.floor(neoProgress * 99);
                const point = trajectoryPoints[idx];
                if (point) {
                    neoMesh.position.copy(point);
                    neoMesh.rotation.x += 0.02;
                    neoMesh.rotation.y += 0.01;
                }

                // Rotate Earth slowly
                earth.rotation.y += 0.002;
            }

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            const newWidth = container.clientWidth || 400;
            const newHeight = container.clientHeight || 300;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
                container.removeChild(rendererRef.current.domElement);
            }
            renderer.dispose();
        };
    }, [orbitalParams, isPlaying]);

    if (!orbitalParams) {
        return (
            <div className="neo-orbit-viewer" style={{ padding: '20px' }}>
                <p>No orbital data available for this object.</p>
                <button className="btn" onClick={onClose}>← Back</button>
            </div>
        );
    }

    return (
        <div className="neo-orbit-viewer">
            {/* Header */}
            <div className="neo-orbit-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: '1px solid var(--tertiary)',
            }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontFamily: 'Chicago_12' }}>
                    {neo.name} - Orbital Trajectory
                </h3>
                <button className="btn" onClick={onClose}>← Back</button>
            </div>

            {/* 3D Viewer */}
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '280px',
                    background: '#000011',
                    position: 'relative',
                }}
            />

            {/* Controls & Info */}
            <div style={{
                padding: '8px 12px',
                borderTop: '1px solid var(--tertiary)',
                fontSize: '12px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        className="btn"
                        onClick={() => setIsPlaying(!isPlaying)}
                        style={{ fontSize: '12px', padding: '4px 12px' }}
                    >
                        {isPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>
                    <div>
                        <strong>Miss Distance:</strong> {orbitalParams.missDistanceKm.toLocaleString()} km
                        {' | '}
                        <strong>{orbitalParams.lunarDistance.toFixed(2)}</strong> lunar distances
                    </div>
                </div>

                {/* Legend */}
                <div style={{ marginTop: '8px', display: 'flex', gap: '16px', opacity: 0.8 }}>
                    <span>🔵 Earth</span>
                    <span>🟡 Sun</span>
                    <span style={{ color: orbitalParams.isHazardous ? '#ff6666' : '#66ff66' }}>
                        ● NEO Trajectory
                    </span>
                    <span>◯ Closest Approach</span>
                </div>

                {orbitalParams.isHazardous && (
                    <div style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        background: '#ff0000',
                        color: '#fff',
                        fontSize: '11px',
                        textAlign: 'center',
                    }}>
                        ⚠️ POTENTIALLY HAZARDOUS ASTEROID
                    </div>
                )}
            </div>
        </div>
    );
}

NeoOrbitViewer.propTypes = {
    neo: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
};
