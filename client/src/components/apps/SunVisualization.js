/**
 * SunVisualization.js
 * Three.js visualization of the Sun with CME particle eruptions
 * Apple System 6 HIG styled controls
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';

/**
 * Sun Visualization Component
 * Shows animated sun with corona and CME particle eruptions
 */
export default function SunVisualization({ events, onClose }) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);

    const [isPlaying, setIsPlaying] = useState(true);
    const [showEarth, setShowEarth] = useState(true);
    const [cmeIntensity, setCmeIntensity] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);

    // Count CME events - more events = more intense visualization
    const eventCount = useMemo(() => events?.length || 0, [events]);

    // Particle system for CME
    const createCMEParticle = useCallback((scene, angle, speed, color) => {
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.8,
        });
        const particle = new THREE.Mesh(geometry, material);

        // Start near sun surface
        const startRadius = 1.2;
        particle.position.set(
            Math.cos(angle) * startRadius,
            (Math.random() - 0.5) * 0.5,
            Math.sin(angle) * startRadius
        );

        particle.userData = {
            angle,
            speed: speed * (0.8 + Math.random() * 0.4),
            radius: startRadius,
            maxRadius: 8 + Math.random() * 4,
            life: 0,
        };

        scene.add(particle);
        return particle;
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 300;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000011);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 2, 8);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
        scene.add(ambientLight);

        // Sun core - bright yellow/orange
        const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffcc00,
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        // Sun glow (corona) - multiple layers
        const createGlow = (size, color, opacity) => {
            const glowGeometry = new THREE.SphereGeometry(size, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity,
                side: THREE.BackSide,
            });
            return new THREE.Mesh(glowGeometry, glowMaterial);
        };

        const glow1 = createGlow(1.3, 0xff6600, 0.3);
        const glow2 = createGlow(1.6, 0xff4400, 0.15);
        const glow3 = createGlow(2.0, 0xff2200, 0.08);
        scene.add(glow1, glow2, glow3);

        // Earth - small blue sphere at distance
        const earthGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const earthMaterial = new THREE.MeshBasicMaterial({ color: 0x4488ff });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.position.set(6, 0, 0);
        earth.name = 'earth';
        scene.add(earth);

        // Earth orbit line
        const orbitPoints = [];
        for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            orbitPoints.push(new THREE.Vector3(Math.cos(angle) * 6, 0, Math.sin(angle) * 6));
        }
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x336699, transparent: true, opacity: 0.3 });
        const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
        orbit.name = 'orbit';
        scene.add(orbit);

        // Starfield
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

        // Initial CME particles based on event count
        const particleColors = [0xff4400, 0xff6600, 0xffaa00, 0xffcc00];
        for (let i = 0; i < Math.min(eventCount * 5, 50); i++) {
            const angle = Math.random() * Math.PI * 2;
            const color = particleColors[Math.floor(Math.random() * particleColors.length)];
            particlesRef.current.push(createCMEParticle(scene, angle, 0.02, color));
        }

        // Animation
        let time = 0;
        const animate = () => {
            if (!isPlaying) {
                animationRef.current = requestAnimationFrame(animate);
                renderer.render(scene, camera);
                return;
            }

            time += 0.016;
            setCurrentTime(t => t + 0.016);

            // Rotate sun slowly
            sun.rotation.y += 0.002;

            // Pulse corona
            const pulse = 1 + Math.sin(time * 2) * 0.05;
            glow1.scale.setScalar(pulse);
            glow2.scale.setScalar(pulse * 0.98);
            glow3.scale.setScalar(pulse * 0.96);

            // Update Earth position
            const earthObj = scene.getObjectByName('earth');
            if (earthObj && showEarth) {
                const earthAngle = time * 0.1;
                earthObj.position.set(Math.cos(earthAngle) * 6, 0, Math.sin(earthAngle) * 6);
                earthObj.visible = true;
            } else if (earthObj) {
                earthObj.visible = false;
            }

            // Update orbit visibility
            const orbitObj = scene.getObjectByName('orbit');
            if (orbitObj) orbitObj.visible = showEarth;

            // Animate CME particles
            particlesRef.current.forEach((particle, i) => {
                if (!particle.parent) return;

                particle.userData.radius += particle.userData.speed * cmeIntensity;
                particle.userData.life += 0.01;

                const { angle, radius } = particle.userData;
                particle.position.set(
                    Math.cos(angle + time * 0.1) * radius,
                    particle.position.y + (Math.random() - 0.5) * 0.01,
                    Math.sin(angle + time * 0.1) * radius
                );

                // Fade out as it travels
                particle.material.opacity = Math.max(0, 0.8 - particle.userData.life);

                // Respawn if too far or faded
                if (radius > particle.userData.maxRadius || particle.material.opacity <= 0) {
                    particle.userData.radius = 1.2;
                    particle.userData.life = 0;
                    particle.userData.angle = Math.random() * Math.PI * 2;
                    particle.material.opacity = 0.8;
                }
            });

            // Spawn new particles occasionally
            if (Math.random() < 0.1 * cmeIntensity && particlesRef.current.length < 100) {
                const angle = Math.random() * Math.PI * 2;
                const color = particleColors[Math.floor(Math.random() * particleColors.length)];
                particlesRef.current.push(createCMEParticle(scene, angle, 0.02 * cmeIntensity, color));
            }

            renderer.render(scene, camera);
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
                container.removeChild(rendererRef.current.domElement);
            }
            rendererRef.current?.dispose();
            particlesRef.current = [];
        };
    }, [eventCount, createCMEParticle, isPlaying, showEarth, cmeIntensity]);

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
                <span>☀️ Solar Activity Visualization</span>
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
                    minHeight: '250px',
                }}
            />

            {/* Controls - System 6 Style */}
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

                {/* Show Earth Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                        type="checkbox"
                        checked={showEarth}
                        onChange={(e) => setShowEarth(e.target.checked)}
                    />
                    🌍 Earth
                </label>

                {/* CME Intensity */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    CME:
                    <input
                        type="range"
                        min="0.2"
                        max="3"
                        step="0.1"
                        value={cmeIntensity}
                        onChange={(e) => setCmeIntensity(parseFloat(e.target.value))}
                        style={{ width: '60px' }}
                    />
                    {cmeIntensity.toFixed(1)}x
                </label>

                {/* Event count */}
                <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
                    📊 {eventCount} events loaded
                </span>
            </div>

            {/* Legend */}
            <div style={{
                padding: '4px 8px',
                fontSize: '10px',
                background: 'var(--tertiary)',
                display: 'flex',
                gap: '12px',
            }}>
                <span>🟡 Sun</span>
                <span>🟠 Corona</span>
                <span>🔸 CME Particles</span>
                <span>🔵 Earth</span>
            </div>
        </div>
    );
}

SunVisualization.propTypes = {
    events: PropTypes.array,
    onClose: PropTypes.func.isRequired,
};

SunVisualization.defaultProps = {
    events: [],
};
