import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const EarthGlobe: React.FC<{ className?: string }> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. High-fidelity procedural Earth texture generator
    const createEarthTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;

      // Deep navy/black ocean background
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      oceanGrad.addColorStop(0, '#061026');
      oceanGrad.addColorStop(0.5, '#040b1b');
      oceanGrad.addColorStop(1, '#050c1f');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw realistic lat/long subtle grid
      ctx.strokeStyle = 'rgba(79, 110, 180, 0.08)';
      ctx.lineWidth = 1;
      for (let lat = -80; lat <= 80; lat += 20) {
        const y = ((90 - lat) / 180) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = ((lon + 180) / 360) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Procedural continents approximation using smooth bezier blobs & coordinates
      ctx.fillStyle = '#1e335e';
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 8;

      const drawLand = (x: number, y: number, w: number, h: number, roughness: number) => {
        ctx.beginPath();
        const pts = 16;
        for (let i = 0; i <= pts; i++) {
          const angle = (i / pts) * Math.PI * 2;
          const rX = (w / 2) * (1 + (Math.sin(angle * 3 + x) * 0.2 + Math.cos(angle * 5) * 0.15) * roughness);
          const rY = (h / 2) * (1 + (Math.cos(angle * 2 + y) * 0.2 + Math.sin(angle * 4) * 0.15) * roughness);
          const px = x + Math.cos(angle) * rX;
          const py = y + Math.sin(angle) * rY;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      };

      // North America
      drawLand(550, 320, 360, 260, 0.7);
      drawLand(460, 240, 180, 140, 0.6); // Canada / Alaska
      drawLand(640, 150, 120, 100, 0.5); // Greenland

      // South America
      drawLand(720, 650, 220, 360, 0.6);

      // Europe
      drawLand(1080, 270, 200, 160, 0.8);
      drawLand(1020, 220, 100, 90, 0.6); // UK / Scandinavia

      // Africa
      drawLand(1120, 520, 280, 340, 0.7);

      // Asia
      drawLand(1450, 320, 520, 300, 0.8);
      drawLand(1380, 480, 200, 180, 0.6); // India
      drawLand(1680, 350, 120, 160, 0.5); // East Asia / Japan

      // Australia
      drawLand(1650, 720, 220, 180, 0.7);

      // City night light glows (dots)
      ctx.fillStyle = '#60a5fa';
      ctx.shadowColor = '#93c5fd';
      ctx.shadowBlur = 6;
      const cityPoints = [
        [520, 310], [560, 340], [480, 360], [710, 600], [740, 720],
        [1060, 260], [1100, 270], [1140, 280], [1360, 460], [1400, 490],
        [1540, 380], [1580, 410], [1680, 350], [1660, 740], [1080, 480],
      ];
      cityPoints.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.fillStyle = '#60a5fa';
      });

      return new THREE.CanvasTexture(canvas);
    };

    const earthTexture = createEarthTexture();
    earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // 3. Earth Core Sphere
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.15,
      emissive: new THREE.Color(0x0a1226),
      emissiveIntensity: 0.4,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // 4. Subtle Outer Atmosphere Glow Shell
    const atmosGeometry = new THREE.SphereGeometry(1.03, 48, 48);
    const atmosMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.38, 0.55, 0.98, 1.0) * intensity * 0.9;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosMesh = new THREE.Mesh(atmosGeometry, atmosMaterial);
    scene.add(atmosMesh);

    // 5. Orbital Security Telemetry Rings & Nodes
    const orbitalGroup = new THREE.Group();

    // Ring 1: Equatorial security boundary ring
    const ringGeo1 = new THREE.RingGeometry(1.25, 1.258, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x4f46e5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.3;
    ring1.rotation.y = 0.2;
    orbitalGroup.add(ring1);

    // Ring 2: Polar orbital track
    const ringGeo2 = new THREE.RingGeometry(1.4, 1.406, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = -0.5;
    orbitalGroup.add(ring2);

    // Security Assessment Nodes positioned on globe surface
    const createMarker = (lat: number, lon: number, colorHex: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const radius = 1.02;

      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);

      const markerGeo = new THREE.SphereGeometry(0.022, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.set(x, y, z);
      earthMesh.add(markerMesh);

      // Outward radar pulse ring
      const pulseGeo = new THREE.RingGeometry(0.025, 0.045, 24);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      pulse.position.set(x * 1.01, y * 1.01, z * 1.01);
      pulse.lookAt(x * 2, y * 2, z * 2);
      earthMesh.add(pulse);
    };

    createMarker(48.8566, 2.3522, 0xef4444);  // Target Node 1 (Critical Auth check)
    createMarker(37.7749, -122.4194, 0x38bdf8); // Target Node 2 (API gateway)
    createMarker(35.6762, 139.6503, 0x10b981);  // Target Node 3 (Healthy endpoint)
    createMarker(1.3521, 103.8198, 0xf59e0b);   // Target Node 4 (Throttling check)
    createMarker(51.5074, -0.1278, 0x6366f1);   // Target Node 5 (TLS cipher check)

    scene.add(orbitalGroup);

    // 6. Realistic Lighting: Directional Sun + Cool Ambient
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.set(4, 2, 3);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0e1c38, 1.2);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0x4338ca, 1.8);
    rimLight.position.set(-4, -1, -2);
    scene.add(rimLight);

    // 7. Continuous Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Slow, majestic Earth rotation
      earthMesh.rotation.y += delta * 0.12;

      // Subtle counter-rotation for telemetry rings
      ring1.rotation.z += delta * 0.05;
      ring2.rotation.z -= delta * 0.04;
      orbitalGroup.rotation.y += delta * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    // 8. Responsive Resize Handling
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      earthTexture.dispose();
      atmosGeometry.dispose();
      atmosMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full flex items-center justify-center pointer-events-none select-none ${className}`}
      aria-label="Moving Earth Globe with Live Security Target Telemetry"
    />
  );
};
