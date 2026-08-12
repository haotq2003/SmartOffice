'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Office3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Setup Scene with dark, deep space/cyberpunk theme
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#090e17', 0.02);

    // 2. Setup Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 12;

    // 3. Setup WebGL Renderer with transparency and high resolution
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Main Group to contain all visual elements (helps with camera parallax and rotation)
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // --- A. THE CORE: Holographic Server/Database Node ---
    // Outer wireframe core representing the cloud system
    const coreOuterGeom = new THREE.IcosahedronGeometry(2.2, 1);
    const coreOuterMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6, // Blue
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const coreOuterMesh = new THREE.Mesh(coreOuterGeom, coreOuterMat);
    mainGroup.add(coreOuterMesh);

    // Inner wireframe core (denser structure)
    const coreInnerGeom = new THREE.IcosahedronGeometry(1.6, 2);
    const coreInnerMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa, // Light Blue
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const coreInnerMesh = new THREE.Mesh(coreInnerGeom, coreInnerMat);
    mainGroup.add(coreInnerMesh);

    // Glowing center sphere
    const coreCenterGeom = new THREE.SphereGeometry(0.8, 16, 16);
    const coreCenterMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6, // Violet
      transparent: true,
      opacity: 0.7,
    });
    const coreCenterMesh = new THREE.Mesh(coreCenterGeom, coreCenterMat);
    mainGroup.add(coreCenterMesh);

    // --- B. ORBITING RESOURCES (Satellites) ---
    // We create several distinct objects representing typical office resources:
    // 1. Meeting Room (Cyan Sphere with wireframe ring)
    // 2. Devices/IT (Purple Torus Knot)
    // 3. Corporate Car/Fleet (Amber Octahedron)
    // 4. Working Space/Desks (Emerald Box)

    const satellites: {
      mesh: THREE.Group;
      orbitRadius: number;
      speed: number;
      angle: number;
      yOffset: number;
      ySpeed: number;
    }[] = [];

    const resourceTypes = [
      {
        name: 'Room',
        color: 0x06b6d4, // Cyan
        orbitRadius: 4.8,
        speed: 0.007,
        yOffset: 1.5,
        ySpeed: 0.01,
        createGeometry: () => {
          const group = new THREE.Group();
          // Room core
          const geom = new THREE.SphereGeometry(0.4, 16, 16);
          const mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 });
          const m = new THREE.Mesh(geom, mat);
          group.add(m);
          // Ring around it
          const ringGeom = new THREE.RingGeometry(0.55, 0.6, 32);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
          const ring = new THREE.Mesh(ringGeom, ringMat);
          ring.rotation.x = Math.PI / 2.5;
          group.add(ring);
          return group;
        }
      },
      {
        name: 'Device',
        color: 0xa855f7, // Purple
        orbitRadius: 5.6,
        speed: -0.005,
        yOffset: -1.2,
        ySpeed: 0.007,
        createGeometry: () => {
          const group = new THREE.Group();
          // Torus Knot represents high tech equipment/network
          const geom = new THREE.TorusKnotGeometry(0.25, 0.08, 48, 8, 2, 3);
          const mat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.9 });
          const m = new THREE.Mesh(geom, mat);
          group.add(m);
          return group;
        }
      },
      {
        name: 'Vehicle',
        color: 0xf59e0b, // Amber/Gold
        orbitRadius: 4.2,
        speed: 0.009,
        yOffset: -0.5,
        ySpeed: 0.015,
        createGeometry: () => {
          const group = new THREE.Group();
          // Double pyramid (octahedron) representing fleet/cars
          const geom = new THREE.OctahedronGeometry(0.42, 0);
          const mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.85 });
          const m = new THREE.Mesh(geom, mat);
          group.add(m);
          // Small orbiting dot for vehicle tracking indicator
          const dotGeom = new THREE.SphereGeometry(0.1, 8, 8);
          const dotMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
          const dot = new THREE.Mesh(dotGeom, dotMat);
          dot.position.set(0.6, 0, 0);
          group.add(dot);
          return group;
        }
      },
      {
        name: 'Desk',
        color: 0x10b981, // Emerald
        orbitRadius: 5.2,
        speed: -0.006,
        yOffset: 0.8,
        ySpeed: 0.009,
        createGeometry: () => {
          const group = new THREE.Group();
          // Box representing workstations
          const geom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
          const mat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.8 });
          const m = new THREE.Mesh(geom, mat);
          group.add(m);
          // Glowing core inside
          const innerGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
          const innerMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
          const inner = new THREE.Mesh(innerGeom, innerMat);
          group.add(inner);
          return group;
        }
      }
    ];

    resourceTypes.forEach((res, idx) => {
      const meshGroup = res.createGeometry();
      mainGroup.add(meshGroup);

      satellites.push({
        mesh: meshGroup,
        orbitRadius: res.orbitRadius,
        speed: res.speed,
        angle: (idx * Math.PI * 2) / resourceTypes.length + Math.PI / 4,
        yOffset: res.yOffset,
        ySpeed: res.ySpeed,
      });
    });

    // --- C. DYNAMIC NETWORKING LINES ---
    // Build connection lines from the satellites to the core, mimicking network queries.
    const lines: THREE.Line[] = [];
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.35,
    });

    satellites.forEach(() => {
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
      ]);
      const line = new THREE.Line(lineGeom, lineMaterial);
      mainGroup.add(line);
      lines.push(line);
    });

    // --- D. CLUSTERS OF DRIFTING PARTICLES ---
    // Creates a cloud of stars/data packets floating in space
    const particleCount = 450;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Distributed inside a spherical shell
      const radius = 6 + Math.random() * 10;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      particlePositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i + 2] = radius * Math.cos(phi);
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Custom circle texture for soft round particles
    const canvasTexture = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(96, 165, 250, 0.8)'); // light blue glow
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(canvas);
    })();

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.16,
      map: canvasTexture,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starParticles = new THREE.Points(particleGeometry, particleMaterial);
    mainGroup.add(starParticles);

    // --- E. PARALLAX EFFECT ON MOUSEMOVE ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      // Get normalized mouse position relative to browser screen (-1 to 1)
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- F. ANIMATION RENDER LOOP ---
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.01;

      // Rotate the core meshes
      coreOuterMesh.rotation.y += 0.003;
      coreOuterMesh.rotation.x += 0.001;

      coreInnerMesh.rotation.y -= 0.005;
      coreInnerMesh.rotation.z += 0.002;

      coreCenterMesh.scale.setScalar(1 + Math.sin(time * 3) * 0.08); // pulse effect

      // Update orbiting satellites positions
      satellites.forEach((sat, idx) => {
        sat.angle += sat.speed;

        // Calculate 3D position
        const x = Math.cos(sat.angle) * sat.orbitRadius;
        const z = Math.sin(sat.angle) * sat.orbitRadius;
        // Introduce a subtle wavy vertical movement
        const y = sat.yOffset + Math.sin(time * 1.5 + idx) * 0.4;

        sat.mesh.position.set(x, y, z);

        // Spin the satellite itself
        sat.mesh.rotation.y += 0.015;
        sat.mesh.rotation.x += 0.008;

        // Rotate vehicle tracker sub-orbiting dot if present
        if (sat.mesh.children.length > 1) {
          const dot = sat.mesh.children[1];
          dot.position.x = Math.cos(time * 5) * 0.6;
          dot.position.z = Math.sin(time * 5) * 0.6;
        }

        // Draw connections from core center to satellite
        const line = lines[idx];
        const posAttr = line.geometry.attributes.position;
        posAttr.setXYZ(0, 0, 0, 0); // start at core (0,0,0)
        posAttr.setXYZ(1, x, y, z); // end at satellite
        posAttr.needsUpdate = true;
      });

      // Orbit the background stars slowly
      starParticles.rotation.y += 0.0004;
      starParticles.rotation.x += 0.0001;

      // Apply smooth mouse parallax interpolation
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      // Tilt the entire main visual group slightly
      mainGroup.rotation.y = targetX * 0.35;
      mainGroup.rotation.x = -targetY * 0.25;

      renderer.render(scene, camera);
    };

    animate();

    // --- G. RESPONSIVENESS AND RESIZING ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // --- H. CLEANUP AND MEMORY MANAGEMENT ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);

      // Dispose resources to prevent GPU memory leaks
      coreOuterGeom.dispose();
      coreOuterMat.dispose();
      coreInnerGeom.dispose();
      coreInnerMat.dispose();
      coreCenterGeom.dispose();
      coreCenterMat.dispose();

      satellites.forEach(sat => {
        sat.mesh.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });

      lines.forEach(line => {
        line.geometry.dispose();
        if (Array.isArray(line.material)) {
          line.material.forEach(m => m.dispose());
        } else {
          line.material.dispose();
        }
      });
      lineMaterial.dispose();

      particleGeometry.dispose();
      particleMaterial.dispose();
      canvasTexture.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden" 
    />
  );
}
