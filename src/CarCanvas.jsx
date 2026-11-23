import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Render on demand, with a real depth buffer: rims, glass and grille details
// remain on their own surface at every angle. No idle animation loop.
export function CarCanvas({ geometry, rotation, tilt }) {
  const canvas = useRef(null), runtime = useRef(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas.current, antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch {
      setUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene(), root = new THREE.Group(), lines = new THREE.Group();
    scene.add(root);
    root.add(lines);
    const camera = new THREE.OrthographicCamera(-420 / 77, 420 / 77, 230 / 77, -230 / 77, 0.1, 100);
    const state = { renderer, scene, root, lines, camera, meshes: [], materials: [], rotation: 0, tilt: 0 };
    const paint = () => {
      const css = getComputedStyle(document.documentElement);
      for (const material of state.materials) material.color.set(css.getPropertyValue(material.userData.token).trim());
      state.root.rotation.y = -state.rotation;
      camera.position.set(0, 1.08 + Math.sin(state.tilt) * 20, Math.cos(state.tilt) * 20);
      camera.lookAt(0, 1.08, 0);
      // A minute offset prevents contour lines fighting coplanar body surfaces.
      lines.position.set(Math.sin(state.rotation) * Math.cos(state.tilt) * 0.004, Math.sin(state.tilt) * 0.004, Math.cos(state.rotation) * Math.cos(state.tilt) * 0.004);
      renderer.render(scene, camera);
    };
    state.paint = paint;
    runtime.current = state;
    const resize = new ResizeObserver(() => {
      const width = canvas.current.clientWidth;
      if (width) { renderer.setSize(width, width * 460 / 840, false); paint(); }
    });
    resize.observe(canvas.current);
    const theme = new MutationObserver(paint);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const lost = event => { event.preventDefault(); setUnavailable(true); };
    canvas.current.addEventListener('webglcontextlost', lost);
    const element = canvas.current;
    return () => {
      resize.disconnect(); theme.disconnect(); element.removeEventListener('webglcontextlost', lost);
      for (const mesh of state.meshes) mesh.geometry.dispose();
      for (const material of state.materials) material.dispose();
      renderer.dispose(); runtime.current = null;
    };
  }, []);

  useEffect(() => {
    const state = runtime.current;
    if (!state) return;
    for (const mesh of state.meshes) { mesh.parent.remove(mesh); mesh.geometry.dispose(); }
    for (const material of state.materials) material.dispose();
    state.meshes = []; state.materials = [];
    const batches = new Map();
    const batch = (token, bias, line, opacity = 1) => {
      const key = `${token}/${bias}/${line}/${opacity}`;
      if (!batches.has(key)) batches.set(key, { token: token.slice(4, -1), bias, line, opacity, positions: [] });
      return batches.get(key).positions;
    };
    for (const shape of geometry) {
      if (shape.line) {
        const p = batch(shape.stroke, 0, true, shape.opacity);
        for (let i = 1; i < shape.vertices.length; i++) p.push(...shape.vertices[i - 1], ...shape.vertices[i]);
      } else {
        const p = batch(shape.fill, shape.bias, false);
        for (let i = 2; i < shape.vertices.length; i++) p.push(...shape.vertices[0], ...shape.vertices[i - 1], ...shape.vertices[i]);
        if (shape.stroke !== 'none' && shape.weight > 0) {
          const edge = batch(shape.stroke, 0, true);
          for (let i = 0; i < shape.vertices.length; i++) edge.push(...shape.vertices[i], ...shape.vertices[(i + 1) % shape.vertices.length]);
        }
      }
    }
    for (const b of batches.values()) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(b.positions, 3));
      const material = b.line
        ? new THREE.LineBasicMaterial({ transparent: b.opacity < 1, opacity: b.opacity, depthWrite: false })
        : new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -b.bias * 1000 });
      material.userData.token = b.token;
      const mesh = b.line ? new THREE.LineSegments(geometry, material) : new THREE.Mesh(geometry, material);
      if (b.line) { mesh.renderOrder = 1; state.lines.add(mesh); } else state.root.add(mesh);
      state.meshes.push(mesh); state.materials.push(material);
    }
    state.paint();
  }, [geometry]);

  useEffect(() => {
    const state = runtime.current;
    if (state) { state.rotation = rotation; state.tilt = tilt; state.paint(); }
  }, [rotation, tilt]);

  return <>{unavailable && <div className="car-unavailable">Для интерактивной модели нужен WebGL 2.<br />Откройте страницу в браузере с аппаратным ускорением.</div>}<canvas ref={canvas} className="car-canvas" aria-hidden="true" /></>;
}
