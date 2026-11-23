import React, { useEffect, useRef, useState } from 'react';
import { Matrix4, Vector3 } from 'three';

export const MODEL_URL = 'https://sketchfab.com/3d-models/bmw-m5-g90-2024-wwwvecarzcom-b2dd13e63c2649c3be90da30e6670a46';
const MODEL_ID = 'b2dd13e63c2649c3be90da30e6670a46';
let sdk;
function loadViewer() {
  if (window.Sketchfab) return Promise.resolve(window.Sketchfab);
  if (!sdk) sdk = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
    script.onload = () => window.Sketchfab ? resolve(window.Sketchfab) : reject(new Error('Viewer SDK unavailable'));
    script.onerror = () => { sdk = null; reject(new Error('Viewer SDK unavailable')); };
    document.head.append(script);
  });
  return sdk;
}

export function SketchfabCar({ visible, exploded, controls, onFallback }) {
  const frame = useRef(null), viewer = useRef(null), paint = useRef(null);
  const visibleNow = useRef(visible), explodedNow = useRef(exploded);
  visibleNow.current = visible; explodedNow.current = exploded;
  const [status, setStatus] = useState('loading');
  const [inspection, setInspection] = useState('');
  useEffect(() => {
    let disposed = false, originalMaterials = [];
    const timer = window.setTimeout(() => { if (!disposed) setStatus(value => value === 'ready' ? value : 'slow'); }, 35000);
    const cssColor = token => {
      const hex = getComputedStyle(document.documentElement).getPropertyValue(token).trim().replace('#', '');
      return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
    };
    const repaint = () => {
      const api = viewer.current;
      if (!api) return;
      api.setBackground({ color: cssColor('--paper') });
      for (const original of originalMaterials) {
        const material = structuredClone(original);
        const name = (material.name || '').toLowerCase();
        const base = original.channels.AlbedoPBR?.color || original.channels.DiffuseColor?.color || [.6,.6,.6];
        const brightness = (base[0]+base[1]+base[2])/3;
        const token = /glass|window|windscreen/.test(name)||original.channels.Opacity?.enable ? '--glass' : /tire|tyre|rubber|black/.test(name)||brightness<.07 ? '--wheel' : /chrome|wheel|rim|metal/.test(name)||original.channels.MetalnessPBR?.factor>.5 ? '--car-shade' : '--car-fill';
        for (const channelName of ['AlbedoPBR', 'DiffusePBR', 'DiffuseColor']) {
          const channel = material.channels[channelName];
          if (channel) { delete channel.texture; channel.enable = true; channel.factor = 1; channel.color = cssColor(token); }
        }
        for (const channelName of ['MetalnessPBR', 'ClearCoat']) if (material.channels[channelName]) { delete material.channels[channelName].texture; material.channels[channelName].factor = 0; }
        for (const channelName of ['EmitColor','Matcap']) if (material.channels[channelName]) material.channels[channelName].enable = false;
        if (material.channels.RoughnessPBR) { delete material.channels.RoughnessPBR.texture; material.channels.RoughnessPBR.factor = 0.8; }
        api.setMaterial(material);
      }
    };
    paint.current = repaint;
    loadViewer().then(Sketchfab => {
      if (disposed) return;
      const client = new Sketchfab('1.12.1', frame.current);
      client.init(MODEL_ID, {
        autostart: 1, preload: 1, ui_infos: 0, ui_controls: 0, ui_stop: 0, ui_inspector: 1,
        success(api) {
          if (disposed) return;
          viewer.current = api;
          let partMatrices = [], savedCamera;
          const reset = () => {
            if (savedCamera) api.setCameraLookAt(savedCamera.position,savedCamera.target,0.6);
            else api.recenterCamera();
          };
          const setExploded = separate => {
            for (const part of partMatrices) {
              const matrix = [...part.original];
              if (separate) {matrix[12]+=part.delta.x;matrix[13]+=part.delta.y;matrix[14]+=part.delta.z;}
              api.translate(part.id,matrix.slice(12,15),{duration:.85,easing:'easeInOutQuad'});
            }
            if(savedCamera){
              const target=separate?[0,.3,1.25]:savedCamera.target;
              const position=separate?savedCamera.position.map((value,i)=>target[i]+(value-savedCamera.target[i])*1.28):savedCamera.position;
              api.setCameraLookAt(position,target,.85);
            }
          };
          controls.current = { reset, setExploded };
          api.addEventListener('viewerready', () => {
            if (disposed) return;
            window.clearTimeout(timer);
            api.setShadingStyle('pbr', { type: 'lit' });
            api.setPostProcessing({ enable: false });
            api.setEnvironment({ shadowEnabled: false, exposure: 0.6, lightIntensity: 0.5 });
            api.getMaterialList((error, materials) => {
              if (disposed) return;
              if (!error) originalMaterials = materials;
              repaint();
              setStatus('ready');
              if(!visibleNow.current)api.stop();
            });
            api.getNodeMap((error, nodes) => {
              if (!error && !disposed && new URLSearchParams(location.search).has('inspectModel')) setInspection(JSON.stringify(Object.values(nodes).map(node => ({ id: node.instanceID, name: node.name, type: node.type }))));
              if (error || disposed) return;
              const targets=Object.values(nodes).filter(node=>node.type==='MatrixTransform'&&/^WHEEL_(LF|LR|RF|RR)_|^SUSP_(LF|LR|RF|RR)_|^Hood 3_|^Glass_|^Body_lodA|^Interior.*Geo_lodA/.test(node.name||''));
              Promise.all(targets.map(node=>new Promise(resolve=>api.getMatrix(node.instanceID,(err,m)=>{
                if(err)return resolve(null);
                const name=node.name,local=new Matrix4().fromArray(m.local),world=new Matrix4().fromArray(Array.from({length:16},(_,i)=>m.world[i]));
                const parentInverse=local.clone().multiply(world.clone().invert());
                const side=/_(LF|LR)_/.test(name)?1:-1;
                const shift=/^WHEEL_/.test(name)?[side*1.02,0,.03]:/^SUSP_/.test(name)?[side*.55,0,-.10]:/^Hood/.test(name)?[0,-.50,1.60]:/^Glass_/.test(name)?[0,0,1.38]:/^Interior/.test(name)?[0,0,.20]:[0,0,1.20];
                const delta=new Vector3(...shift).applyMatrix4(parentInverse).sub(new Vector3().applyMatrix4(parentInverse));
                resolve({id:node.instanceID,original:m.local,delta});
              })))).then(parts=>{if(!disposed){partMatrices=parts.filter(Boolean);controls.current?.setExploded(explodedNow.current);}});
            });
            const target=[0,.3,.85],position=[5.4,-6.6,3.6];
            savedCamera={position,target};api.setFov(25,()=>api.setCameraLookAt(position,target,.6));
          });
          api.start();
        },
        error() { if (!disposed) setStatus('error'); },
      });
    }).catch(() => { if (!disposed) setStatus('error'); });
    const observer = new MutationObserver(repaint);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      disposed = true; window.clearTimeout(timer); observer.disconnect();
      viewer.current?.stop(); viewer.current = null; controls.current = null;
    };
  }, [controls]);

  useEffect(() => { if (viewer.current) visible ? viewer.current.start() : viewer.current.stop(); }, [visible]);
  useEffect(() => { if(status==='ready')controls.current?.setExploded(exploded); },[exploded,visible,status,controls]);

  return <div className={'sketchfab-view ' + (visible ? '' : 'viewer-hidden')} data-model-status={status}>
    <iframe ref={frame} title="BMW M5 G90 — модель vecarz на Sketchfab" allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen />
    {status !== 'ready' && <div className="model-loading"><span className="mono">{status === 'loading' ? 'ЗАГРУЖАЕМ BMW M5 G90…' : 'МОДЕЛЬ SKETCHFAB ПОКА НЕ ЗАГРУЗИЛАСЬ'}</span><p>{status === 'loading' ? 'Детальная модель может загружаться некоторое время.' : 'Можно открыть лёгкий чертёж и изучить внутренние узлы.'}</p><button className="key" onClick={onFallback}>Открыть чертёж</button></div>}
    {new URLSearchParams(location.search).has('inspectModel') && <pre className="model-inspection">{inspection}</pre>}
  </div>;
}
