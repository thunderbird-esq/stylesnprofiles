/**
 * ExoplanetVisualization.js
 * Three.js visualization of exoplanet systems
 * Shows orbital distances/periods relative to Earth
 * Apple System 6 HIG styled controls
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

/**
 * Get planet color based on type/radius
 */
function getPlanetColor(radius, mass) {
    if (!radius) {
        if (mass && mass > 100) return 0xcc9966; // Gas giant - tan
        return 0x888888; // Unknown - gray
    }
    if (radius < 1.5) return 0x6699cc; // Rocky - blue-ish (Earth-like)
    if (radius < 2.5) return 0x66cc99; // Super-Earth - green-ish
    if (radius < 6) return 0x3366cc; // Neptune-like - deep blue
    return 0xcc9966; // Gas giant - tan/orange
}

/**
 * Get planet type label
 */
function getPlanetType(radius) {
    if (!radius) return 'Unknown';
    if (radius < 1.5) return 'Rocky';
    if (radius < 2.5) return 'Super-Earth';
    if (radius < 6) return 'Neptune-like';
    return 'Gas Giant';
}

/**
 * Exoplanet 3D Visualization Component
 */
export default function ExoplanetVisualization({ planets, onClose }) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const animationRef = useRef(null);
    const planetMeshesRef = useRef([]);
    const cameraRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(true);
    const [timeScale, setTimeScale] = useState(1);
    const [showOrbits] = useState(true); // eslint-disable-line no-unused-vars
    const [showLabels] = useState(true); // eslint-disable-line no-unused-vars
    const [hoveredPlanet, setHoveredPlanet] = useState(null);
    const [viewMode, setViewMode] = useState('log'); // 'log' or 'linear'
    const [cameraAngle, setCameraAngle] = useState(0);

    // Process planets for visualization (max 20 for performance)
    const displayPlanets = useMemo(() => {
        return planets
            .filter(p => p.pl_orbper && p.pl_orbper > 0)
            .slice(0, 20)
            .map((p, i) => ({
                ...p,
                index: i,
                // Orbital radius: use log scale for better visualization
                // Earth's orbit = 1 AU = 365.25 days
                orbitalPeriod: p.pl_orbper, // days
                // Approximate semi-major axis using Kepler's third law (simplified)
                semiMajorAxis: Math.pow(p.pl_orbper / 365.25, 2 / 3), // AU
                radius: p.pl_rade || 1,
                color: getPlanetColor(p.pl_rade, p.pl_bmasse),
            }));
    }, [planets]);

    // Create planet mesh
    const createPlanet = useCallback((scene, planet, scale) => {
        // Size: scale by radius (Earth = 1)
        const size = Math.max(0.1, Math.min(0.5, (planet.radius || 1) * 0.1));

        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: planet.color,
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Calculate orbital distance for display
        let displayRadius;
        if (scale === 'log') {
            // Logarithmic scale for better visualization of varied distances
            displayRadius = 2 + Math.log10(Math.max(0.01, planet.semiMajorAxis)) * 3;
            displayRadius = Math.max(2.5, Math.min(15, displayRadius));
        } else {
            // Linear scale (capped)
            displayRadius = 2 + Math.min(planet.semiMajorAxis * 2, 12);
        }

        // Random starting angle
        const startAngle = Math.random() * Math.PI * 2;
        mesh.position.set(
            Math.cos(startAngle) * displayRadius,
            (Math.random() - 0.5) * 0.5, // Slight Y variation
            Math.sin(startAngle) * displayRadius
        );

        mesh.userData = {
            planet,
            displayRadius,
            angle: startAngle,
            // Angular velocity: inversely proportional to orbital period
            angularVelocity: (365.25 / planet.orbitalPeriod) * 0.01,
        };
        mesh.name = planet.pl_name;

        scene.add(mesh);

        // Create orbit ring
        if (showOrbits) {
            const orbitPoints = [];
            for (let i = 0; i <= 64; i++) {
                const angle = (i / 64) * Math.PI * 2;
                orbitPoints.push(new THREE.Vector3(
                    Math.cos(angle) * displayRadius,
                    0,
                    Math.sin(angle) * displayRadius
                ));
            }
            const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
            const orbitMaterial = new THREE.LineBasicMaterial({
                color: planet.color,
                transparent: true,
                opacity: 0.2
            });
            const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
            orbit.name = `orbit-${planet.pl_name}`;
            scene.add(orbit);
        }

        return mesh;
    }, [showOrbits]);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth || 500;
        const height = container.clientHeight || 350;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000011);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 8, 18);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Raycaster for hover
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x333366, 0.5);
        scene.add(ambientLight);

        // === THE SUN (Host Star) ===
        const sunGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.name = 'sun';
        scene.add(sun);

        // Sun glow
        const glowGeometry = new THREE.SphereGeometry(1.1, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        scene.add(glow);

        // === EARTH (reference) ===
        const earthGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const earthMaterial = new THREE.MeshBasicMaterial({ color: 0x4488ff });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.position.set(2, 0, 0);
        earth.name = 'earth';
        earth.userData = {
            angle: 0,
            displayRadius: 2,
            angularVelocity: 0.01, // 1 year reference
        };
        scene.add(earth);

        // Earth orbit
        const earthOrbitPoints = [];
        for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            earthOrbitPoints.push(new THREE.Vector3(Math.cos(angle) * 2, 0, Math.sin(angle) * 2));
        }
        const earthOrbitGeometry = new THREE.BufferGeometry().setFromPoints(earthOrbitPoints);
        const earthOrbitMaterial = new THREE.LineBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.5
        });
        const earthOrbit = new THREE.Line(earthOrbitGeometry, earthOrbitMaterial);
        earthOrbit.name = 'earth-orbit';
        scene.add(earthOrbit);

        // Earth label
        // (Using 2D overlay instead of 3D text for simplicity)

        // === STARFIELD ===
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 500;
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
            starPositions[i] = (Math.random() - 0.5) * 100;
            starPositions[i + 1] = (Math.random() - 0.5) * 100;
            starPositions[i + 2] = (Math.random() - 0.5) * 100;
        }
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        // === EXOPLANETS ===
        planetMeshesRef.current = displayPlanets.map(planet =>
            createPlanet(scene, planet, viewMode)
        );

        // Mouse move for hover
        const handleMouseMove = (event) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(planetMeshesRef.current);

            if (intersects.length > 0 && intersects[0].object.userData.planet) {
                setHoveredPlanet(intersects[0].object.userData.planet);
            } else {
                setHoveredPlanet(null);
            }
        };
        container.addEventListener('mousemove', handleMouseMove);

        // Animation
        let time = 0;
        const animate = () => {
            if (isPlaying) {
                time += 0.016 * timeScale;

                // Rotate camera slowly
                if (cameraAngle !== 0) {
                    camera.position.x = Math.cos(cameraAngle + time * 0.05) * 18;
                    camera.position.z = Math.sin(cameraAngle + time * 0.05) * 18;
                    camera.lookAt(0, 0, 0);
                }

                // Animate Earth
                const earthObj = scene.getObjectByName('earth');
                if (earthObj) {
                    earthObj.userData.angle += earthObj.userData.angularVelocity * timeScale;
                    const r = earthObj.userData.displayRadius;
                    earthObj.position.set(
                        Math.cos(earthObj.userData.angle) * r,
                        0,
                        Math.sin(earthObj.userData.angle) * r
                    );
                }

                // Animate exoplanets
                planetMeshesRef.current.forEach(mesh => {
                    if (!mesh.userData.planet) return;
                    mesh.userData.angle += mesh.userData.angularVelocity * timeScale;
                    const r = mesh.userData.displayRadius;
                    mesh.position.set(
                        Math.cos(mesh.userData.angle) * r,
                        mesh.position.y,
                        Math.sin(mesh.userData.angle) * r
                    );
                });

                // Pulse sun
                const pulse = 1 + Math.sin(time * 2) * 0.03;
                glow.scale.setScalar(pulse);
            }

            renderer.render(scene, camera);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup
        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
                container.removeChild(rendererRef.current.domElement);
            }
            rendererRef.current?.dispose();
            planetMeshesRef.current = [];
        };
    }, [displayPlanets, createPlanet, isPlaying, timeScale, viewMode, cameraAngle]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
                background: 'var(--secondary)',
                color: 'var(--primary)',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <span>🌌 Exoplanet Orbital Viewer</span>
                <button
                    onClick={onClose}
                    style={{
                        background: 'var(--primary)',
                        color: 'var(--secondary)',
                        border: '1px solid var(--primary)',
                        padding: '0 6px',
                        cursor: 'pointer',
                        fontSize: '10px',
                    }}
                >
                    ✕ Close
                </button>
            </div>

            {/* 3D Canvas */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    background: '#000',
                    minHeight: '280px',
                    position: 'relative',
                }}
            >
                {/* Hover tooltip */}
                {hoveredPlanet && (
                    <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(0,0,0,0.9)',
                        color: '#fff',
                        padding: '8px 12px',
                        fontSize: '11px',
                        border: '1px solid #669',
                        maxWidth: '220px',
                        zIndex: 10,
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#9cf' }}>
                            🪐 {hoveredPlanet.pl_name}
                        </div>
                        <div>⭐ Host: {hoveredPlanet.hostname}</div>
                        <div>📅 Orbital Period: {hoveredPlanet.pl_orbper?.toFixed(1)} days</div>
                        <div>📏 Distance: {hoveredPlanet.semiMajorAxis?.toFixed(2)} AU</div>
                        <div>🔵 Radius: {hoveredPlanet.pl_rade?.toFixed(2) || '?'} Earth</div>
                        <div>⚖️ Mass: {hoveredPlanet.pl_bmasse?.toFixed(1) || '?'} Earth</div>
                        <div style={{ opacity: 0.7, marginTop: '4px' }}>
                            Type: {getPlanetType(hoveredPlanet.pl_rade)}
                        </div>
                    </div>
                )}

                {/* Earth reference label */}
                {showLabels && (
                    <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        color: '#4af',
                        padding: '4px 8px',
                        fontSize: '10px',
                        border: '1px solid #44f',
                    }}>
                        🌍 Blue orbit = Earth (1 AU, 365 days)
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{
                padding: '8px',
                border: '1px solid var(--tertiary)',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center',
                fontSize: '11px',
            }}>
                {/* Play/Pause */}
                <button
                    className="btn"
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                >
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>

                {/* Time Scale */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Speed:
                    <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={timeScale}
                        onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                        style={{ width: '60px' }}
                    />
                    {timeScale.toFixed(1)}x
                </label>

                {/* View Mode */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        style={{ fontSize: '10px' }}
                    >
                        <option value="log">Log Scale</option>
                        <option value="linear">Linear</option>
                    </select>
                </label>

                {/* Rotate Camera */}
                <button
                    className="btn"
                    onClick={() => setCameraAngle(prev => prev + 0.5)}
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                >
                    🔄 Rotate
                </button>

                {/* Count */}
                <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
                    🪐 {displayPlanets.length} planets
                </span>
            </div>

            {/* Legend */}
            <div style={{
                padding: '4px 8px',
                fontSize: '10px',
                background: 'var(--tertiary)',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
            }}>
                <span>🟡 Star</span>
                <span style={{ color: '#4af' }}>● Earth</span>
                <span style={{ color: '#6699cc' }}>● Rocky</span>
                <span style={{ color: '#66cc99' }}>● Super-Earth</span>
                <span style={{ color: '#3366cc' }}>● Neptune</span>
                <span style={{ color: '#cc9966' }}>● Gas Giant</span>
            </div>
        </div>
    );
}

ExoplanetVisualization.propTypes = {
    planets: PropTypes.array.isRequired,
    onClose: PropTypes.func.isRequired,
};
