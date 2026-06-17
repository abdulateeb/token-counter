import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A restrained 3D backdrop: a drifting field of "token" blocks of varying
 * widths, evoking how text is segmented into discrete pieces. No bloom, no
 * shimmer, just slow drift and soft studio lighting. Respects
 * prefers-reduced-motion by rendering a single static frame.
 */
export default function TokenScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 16);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Lighting: one key, one cool fill; neutral, no colored glow.
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(6, 9, 8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6b8cff, 0.6);
    fill.position.set(-8, -4, 4);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    // Palette drawn from the Radix accent colours used across the UI.
    const palette = [0x3b9eff, 0x30a46c, 0xe54d2e, 0x8e8c99, 0x5b5bd6];

    const group = new THREE.Group();
    scene.add(group);

    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0.5, 0, 0); // pivot from the left edge so widths grow rightward

    type Block = {
      mesh: THREE.Mesh;
      baseY: number;
      phase: number;
      speed: number;
    };
    const blocks: Block[] = [];

    // Span wider than the camera frustum so blocks fill the full hero width
    // (including the left/right edges) with no empty gutters.
    const ROWS = 6;
    const SPAN = 48;
    for (let r = 0; r < ROWS; r++) {
      const y = (r - (ROWS - 1) / 2) * 3.1;
      let x = -SPAN / 2 - Math.random() * 4;
      while (x < SPAN / 2) {
        const w = 0.7 + Math.random() * 2.2;
        const color = palette[(Math.random() * palette.length) | 0];
        const mat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.55,
          metalness: 0.1,
          transparent: true,
          opacity: 0.92,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(w, 0.92, 0.92);
        mesh.position.set(x, y, (Math.random() - 0.5) * 2);
        group.add(mesh);
        blocks.push({
          mesh,
          baseY: mesh.position.y,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.5,
        });
        x += w + 0.28; // small gap between tokens
      }
    }

    group.rotation.x = -0.18;
    group.rotation.y = 0.0;

    const clock = new THREE.Clock();
    let raf = 0;

    const render = () => {
      const t = clock.getElapsedTime();

      // Slow leftward drift; wrap blocks for an endless stream.
      for (const b of blocks) {
        b.mesh.position.x -= 0.012;
        if (b.mesh.position.x < -SPAN / 2 - 4) {
          b.mesh.position.x = SPAN / 2 + Math.random() * 3;
        }
        b.mesh.position.y = b.baseY + Math.sin(t * b.speed + b.phase) * 0.12;
      }

      renderer.render(scene, camera);
      if (!prefersReduced) raf = requestAnimationFrame(render);
    };

    render();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geo.dispose();
      for (const b of blocks) (b.mesh.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="token-scene" aria-hidden="true" />;
}
