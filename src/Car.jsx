import React, { useMemo, useRef, useState } from 'react';
import { createCarGeometry } from './carGeometry';
import { CarCanvas } from './CarCanvas';
import { MODEL_URL, SketchfabCar } from './SketchfabCar';

const INITIAL_ROTATION = -0.64;
const INITIAL_TILT = 0.39;

export function Car() {
  const [rotation, setRotation] = useState(INITIAL_ROTATION);
  const [tilt, setTilt] = useState(INITIAL_TILT);
  const [exploded, setExploded] = useState(false);
  const [localView, setLocalView] = useState(false);
  const [detailMode, setDetailMode] = useState('all');
  const viewerControls = useRef(null);
  const drag = useRef(null);
  const geometry = useMemo(() => createCarGeometry(exploded, detailMode), [exploded, detailMode]);

  function handleKey(event) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') setRotation(value => value - 0.12);
    if (event.key === 'ArrowRight') setRotation(value => value + 0.12);
    if (event.key === 'ArrowUp') setTilt(value => Math.min(0.85, value + 0.07));
    if (event.key === 'ArrowDown') setTilt(value => Math.max(0.12, value - 0.07));
  }

  return <figure className="car-figure">
    <div className="figure-top mono"><span>FIG. 01 / BMW M5 G90 · {localView?'СХЕМА':'МОДЕЛЬ'}</span><span>3D · ИНТЕРАКТИВ</span></div>
    <div className="car-stage" role="img"
      aria-label="Вращаемая трёхмерная схема BMW M5 G90" tabIndex="0"
      onKeyDown={handleKey}
      onPointerDown={event => {
        if (event.target.closest('button, a, iframe')) return;
        drag.current = [event.clientX, event.clientY, rotation, tilt];
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (!drag.current) return;
        setRotation(drag.current[2] + (event.clientX - drag.current[0]) * 0.009);
        setTilt(Math.max(0.12, Math.min(0.85, drag.current[3] + (event.clientY - drag.current[1]) * 0.004)));
      }}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      onLostPointerCapture={() => { drag.current = null; }}>
      <svg className="car-guides" viewBox="0 0 840 460" aria-hidden="true"><defs><pattern id="car-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.65" fill="var(--grid)" /></pattern></defs>
      <rect width="840" height="460" fill="url(#car-dots)" />
      <g stroke="var(--blue)" opacity="0.18" fill="none" strokeDasharray="5 6">
        <ellipse cx="420" cy="318" rx="300" ry="83" /><path d="M60 318H780 M420 30V415" />
      </g>
      </svg>
      {localView && <CarCanvas geometry={geometry} rotation={rotation} tilt={tilt} />}
      <SketchfabCar visible={!localView} exploded={exploded} controls={viewerControls} onFallback={() => setLocalView(true)} />
      <svg className={'car-callouts ' + (!localView ? 'callouts-hidden' : '')} viewBox="0 0 840 460" aria-hidden="true">
      <g className="callouts" fill="var(--blue)" stroke="var(--blue)" strokeWidth="0.8">
        <path fill="none" d="M112 108H218L306 170 M599 112H737 M590 280L679 340H763 M198 350H98" />
        <circle cx="306" cy="170" r="2.5" /><circle cx="590" cy="280" r="2.5" />
        <text x="112" y="95" stroke="none">{detailMode==='powertrain'?'ДВИГАТЕЛЬ V8':exploded?'САЛОН И КУЗОВ':'КУЗОВ И ОПТИКА'}</text><text x="599" y="99" stroke="none">{detailMode==='powertrain'?'ВПУСК И ТУРБИНЫ':exploded?'ДВИГАТЕЛЬ И КПП':'G90 / НОВАЯ ГЛАВА'}</text>
        <text x="679" y="359" stroke="none">{detailMode==='powertrain'?'КОРОБКА ПЕРЕДАЧ':'ХОДОВАЯ ЧАСТЬ'}</text><text x="98" y="369" stroke="none">{detailMode==='powertrain'?'ОХЛАЖДЕНИЕ':exploded?'ШАССИ И ПОДВЕСКА':'ЦЕННОСТЬ ВНУТРИ'}</text>
      </g>
      </svg>
    </div>
    <figcaption>
      <span className="mono drag-hint">↔ ПОТЯНИТЕ, ЧТОБЫ ПОВЕРНУТЬ</span>
      <div className="figure-controls">
        <button aria-pressed={exploded} onClick={() => {setExploded(value => !value);setLocalView(!exploded);setDetailMode('all');}}>{exploded ? 'Собрать' : 'Разнести детали'}</button>
        <button onClick={() => {setLocalView(value => !value);setDetailMode('all');}} aria-pressed={localView}>{localView ? 'Модель' : 'Чертёж'}</button>
        <button onClick={() => { setRotation(INITIAL_ROTATION); setTilt(INITIAL_TILT); viewerControls.current?.reset(); }} aria-label="Сбросить поворот">↺</button>
      </div>
    </figcaption>
    {exploded&&<div className="assembly-tabs" aria-label="Виды разнесённых деталей"><button className={localView&&detailMode==='all'?'selected':''} onClick={()=>{setLocalView(true);setDetailMode('all');}}>Все узлы · схема</button><button className={detailMode==='powertrain'?'selected':''} onClick={()=>{setLocalView(true);setDetailMode('powertrain');}}>Мотор и КПП</button><button className={!localView?'selected':''} onClick={()=>{setLocalView(false);setDetailMode('all');}}>Кузов G90 · оригинал</button></div>}
    <div className="model-credit">Модель: <a href={MODEL_URL} target="_blank" rel="noreferrer">BMW M5 G90 — vecarz / Sketchfab</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a>{exploded && <span>{localView?'Двигатель, КПП и внутренние узлы — авторская учебная схема, не заводская CAD-модель.':'Разнесены реальные узлы модели Sketchfab. Мотор и КПП показаны отдельно во вкладке «Мотор и КПП».'}</span>}</div>
  </figure>;
}
