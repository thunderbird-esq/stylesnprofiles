/**
 * NeoOrbitViewer.js
 * Enhanced 3D visualization of Near Earth Object trajectory using Three.js
 * Shows full solar system inner planets with animated orbits
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

// Orbital data (relative to Earth's orbit = 1 AU)
const PLANETS = {
    mercury: { distance: 0.39, size: 0.38, color: 0x8c8c8c, speed: 4.15, name: 'Mercury' },
    venus: { distance: 0.72, size: 0.95, color: 0xe6c229, speed: 1.62, name: 'Venus' },
    earth: { distance: 1.0, size: 1.0, color: 0x2233ff, speed: 1.0, name: 'Earth' },
    mars: { distance: 1.52, size: 0.53, color: 0xc1440e, speed: 0.53, name: 'Mars' },
};

const SCALE = 12; // Scale factor for orbit radii
const PLANET_SCALE = 0.4; // Planet size multiplier

/**
 * Parse NEO orbital data to get visualization parameters
 */
const getOrbitalParams = (neo) => {
    const closeApproach = neo.close_approach_data?.[0];
    if (!closeApproach) return null;

    const lunarDistance = parseFloat(closeApproach.miss_distance?.lunar) || 1;
    const velocity = parseFloat(closeApproach.relative_velocity?.kilometers_per_hour) || 10000;
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
 */
export default function NeoOrbitViewer({ neo, onClose }) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const animationRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [animSpeed, setAnimSpeed] = useState(1);

    const orbitalParams = getOrbitalParams(neo);

    const handleZoomIn = useCallback(() => {
        setZoom(z => Math.min(z * 1.3, 4));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(z => Math.max(z / 1.3, 0.3));
    }, []);

    const handleSpeedUp = useCallback(() => {
        setAnimSpeed(s => Math.min(s * 1.5, 5));
    }, []);

    const handleSlowDown = useCallback(() => {
        setAnimSpeed(s => Math.max(s / 1.5, 0.2));
    }, []);

    useEffect(() => {
        if (!containerRef.current || !orbitalParams) return;

        const container = containerRef.current;
        const width = container.clientWidth || 500;
        const height = container.clientHeight || 400;

        // Scene setup - brighter background
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a20); // Lighter space color

        // Camera with zoom - positioned to see full orbits
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        // Higher angle view to see complete orbits
        camera.position.set(0, 50 / zoom, 30 / zoom);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting - brighter ambient for visibility
        const ambientLight = new THREE.AmbientLight(0x666688, 1.5);
        scene.add(ambientLight);

        // Sun with glow
        const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd00 });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        // Sun glow
        const glowGeometry = new THREE.SphereGeometry(2.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.3,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        scene.add(glow);

        // Point light from sun - brighter
        const sunLight = new THREE.PointLight(0xffffff, 3, 200);
        scene.add(sunLight);

        // Create planets and orbits
        const planetMeshes = {};
        const orbitAngles = {
            mercury: Math.random() * Math.PI * 2,
            venus: Math.random() * Math.PI * 2,
            earth: 0, // Earth starts at reference position
            mars: Math.random() * Math.PI * 2,
        };

        Object.entries(PLANETS).forEach(([name, data]) => {
            // Orbit ring - thicker and brighter
            const orbitGeometry = new THREE.RingGeometry(
                data.distance * SCALE - 0.1,
                data.distance * SCALE + 0.1,
                128
            );
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: 0x6688aa, // Brighter blue-gray
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7, // More visible
            });
            const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbit.rotation.x = Math.PI / 2;
            scene.add(orbit);

            // Planet
            const planetGeometry = new THREE.SphereGeometry(
                data.size * PLANET_SCALE,
                name === 'earth' ? 32 : 16,
                name === 'earth' ? 32 : 16
            );
            const planetMaterial = new THREE.MeshPhongMaterial({
                color: data.color,
                emissive: data.color,
                emissiveIntensity: 0.1,
            });
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            scene.add(planet);
            planetMeshes[name] = planet;

            // Initial position
            const angle = orbitAngles[name];
            planet.position.x = Math.cos(angle) * data.distance * SCALE;
            planet.position.z = Math.sin(angle) * data.distance * SCALE;
        });

        // Moon for Earth (tiny)
        const moonGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const moonMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        scene.add(moon);

        // NEO asteroid (larger, more detailed)
        const neoSize = 0.5;
        const neoGeometry = new THREE.IcosahedronGeometry(neoSize, 1);
        const neoMaterial = new THREE.MeshPhongMaterial({
            color: orbitalParams.isHazardous ? 0xff3333 : 0x999999,
            emissive: orbitalParams.isHazardous ? 0x660000 : 0x333333,
            flatShading: true,
        });
        const neoMesh = new THREE.Mesh(neoGeometry, neoMaterial);
        scene.add(neoMesh);

        // NEO trajectory - hyperbolic arc through inner solar system
        const trajectoryPoints = [];
        const approachScale = Math.min(3, orbitalParams.lunarDistance * 0.3);
        const earthOrbitRadius = PLANETS.earth.distance * SCALE;

        for (let i = 0; i <= 200; i++) {
            const t = (i - 100) / 50;
            // Hyperbolic path approaching Earth
            const angle = t * 0.8;
            const r = earthOrbitRadius + approachScale + Math.abs(t) * 3;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            const y = t * 0.3;
            trajectoryPoints.push(new THREE.Vector3(x, y, z));
        }

        const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
        const trajectoryMaterial = new THREE.LineBasicMaterial({
            color: orbitalParams.isHazardous ? 0xff6666 : 0x66ff66,
            transparent: true,
            opacity: 0.8,
        });
        const trajectory = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
        scene.add(trajectory);

        // Closest approach marker
        const approachIdx = 100;
        const approachPoint = trajectoryPoints[approachIdx];
        const markerGeometry = new THREE.TorusGeometry(0.6, 0.1, 8, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(approachPoint);
        marker.rotation.x = Math.PI / 2;
        scene.add(marker);

        // Distance line from Earth to closest approach
        const distLineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0), // Will be updated
            approachPoint,
        ]);
        const distLineMaterial = new THREE.LineDashedMaterial({
            color: 0xffff00,
            dashSize: 0.5,
            gapSize: 0.3,
        });
        const distLine = new THREE.Line(distLineGeometry, distLineMaterial);
        distLine.computeLineDistances();
        scene.add(distLine);

        // Stars
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        for (let i = 0; i < 1000; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 150 + Math.random() * 50;
            starPositions.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3 + Math.random() * 0.3,
        });
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);

        // Animation state
        let neoProgress = 0;
        let moonAngle = 0;
        let time = 0;

        // Animation loop
        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);

            if (isPlaying) {
                time += 0.016 * animSpeed;

                // Animate all planets in their orbits
                Object.entries(PLANETS).forEach(([name, data]) => {
                    orbitAngles[name] += 0.002 * data.speed * animSpeed;
                    const planet = planetMeshes[name];
                    planet.position.x = Math.cos(orbitAngles[name]) * data.distance * SCALE;
                    planet.position.z = Math.sin(orbitAngles[name]) * data.distance * SCALE;
                    planet.rotation.y += 0.01 * animSpeed;
                });

                // Update distance line to Earth's current position
                const earthPos = planetMeshes.earth.position;
                distLineGeometry.setFromPoints([earthPos.clone(), approachPoint]);
                distLine.computeLineDistances();

                // Moon orbits Earth
                moonAngle += 0.03 * animSpeed;
                moon.position.x = earthPos.x + Math.cos(moonAngle) * 0.8;
                moon.position.z = earthPos.z + Math.sin(moonAngle) * 0.8;
                moon.position.y = Math.sin(moonAngle * 0.5) * 0.1;

                // Animate NEO along trajectory
                neoProgress += 0.003 * animSpeed;
                if (neoProgress > 1) neoProgress = 0;

                const idx = Math.floor(neoProgress * 199);
                const point = trajectoryPoints[idx];
                if (point) {
                    neoMesh.position.copy(point);
                    neoMesh.rotation.x += 0.03;
                    neoMesh.rotation.y += 0.02;
                    neoMesh.rotation.z += 0.01;
                }

                // Pulse the marker
                marker.scale.setScalar(1 + Math.sin(time * 3) * 0.1);

                // Slowly rotate stars for depth
                stars.rotation.y += 0.0001;
            }

            // Update camera zoom
            camera.position.set(0, 35 / zoom, 40 / zoom);
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            const newWidth = container.clientWidth || 500;
            const newHeight = container.clientHeight || 400;
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
    }, [orbitalParams, isPlaying, zoom, animSpeed]);

    if (!orbitalParams) {
        return (
            <div className="neo-orbit-viewer" style={{ padding: '20px', fontSize: '16px' }}>
                <p>No orbital data available for this object.</p>
                <button className="btn" onClick={onClose}>← Back</button>
            </div>
        );
    }

    return (
        <div className="neo-orbit-viewer">
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '2px solid var(--secondary)',
                background: 'var(--primary)',
            }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'Chicago_12' }}>
                    🌍 {neo.name}
                </h3>
                <button className="btn" onClick={onClose} style={{ fontSize: '14px' }}>
                    ← Back to Details
                </button>
            </div>

            {/* 3D Viewer */}
            <div
                ref={containerRef}
                style={{
                    width: '100%',
                    height: '350px',
                    background: '#000008',
                }}
            />

            {/* Controls */}
            <div style={{
                padding: '12px 16px',
                borderTop: '2px solid var(--secondary)',
                background: 'var(--primary)',
            }}>
                {/* Playback Controls */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn" onClick={() => setIsPlaying(!isPlaying)} style={{ fontSize: '14px' }}>
                            {isPlaying ? '⏸ Pause' : '▶ Play'}
                        </button>
                        <button className="btn" onClick={handleSlowDown} style={{ fontSize: '14px' }}>
                            🐢
                        </button>
                        <button className="btn" onClick={handleSpeedUp} style={{ fontSize: '14px' }}>
                            🐇
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn" onClick={handleZoomOut} style={{ fontSize: '14px' }}>
                            ➖ Zoom
                        </button>
                        <button className="btn" onClick={handleZoomIn} style={{ fontSize: '14px' }}>
                            ➕ Zoom
                        </button>
                    </div>
                </div>

                {/* Miss Distance Info */}
                <div style={{
                    fontSize: '16px',
                    marginBottom: '12px',
                    padding: '10px',
                    background: 'rgba(0,0,0,0.1)',
                    border: '1px solid var(--tertiary)',
                }}>
                    <strong>Closest Approach:</strong>{' '}
                    <span style={{ color: orbitalParams.isHazardous ? '#ff0000' : '#006600' }}>
                        {orbitalParams.missDistanceKm.toLocaleString()} km
                    </span>
                    {' '}({orbitalParams.lunarDistance.toFixed(2)} × Moon distance)
                </div>

                {/* Legend */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '14px',
                }}>
                    <span>☀️ Sun</span>
                    <span style={{ color: '#8c8c8c' }}>● Mercury</span>
                    <span style={{ color: '#e6c229' }}>● Venus</span>
                    <span style={{ color: '#2233ff' }}>● Earth</span>
                    <span style={{ color: '#c1440e' }}>● Mars</span>
                    <span style={{ color: orbitalParams.isHazardous ? '#ff6666' : '#66ff66' }}>
                        ━ NEO Path
                    </span>
                </div>

                {orbitalParams.isHazardous && (
                    <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        background: '#ff0000',
                        color: '#fff',
                        fontSize: '16px',
                        textAlign: 'center',
                        fontWeight: 'bold',
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
