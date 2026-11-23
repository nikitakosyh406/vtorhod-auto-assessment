import { createInternals } from './carInternals.js';
// Original stylised G90-inspired mesh, authored for ВТОРХОД.
// Relative units: an illustrative model rather than a production CAD asset.
const BODY = 'var(--car-fill)', LIGHT = 'var(--car-light)', GLASS = 'var(--glass)';
const DARK = 'var(--wheel)', BLUE = 'var(--blue)', SHADE = 'var(--car-shade)';

function interpolate(stations, x, index) {
  for (let i = 1; i < stations.length; i++) if (x <= stations[i][0]) {
    const t = (x - stations[i - 1][0]) / (stations[i][0] - stations[i - 1][0]);
    return stations[i - 1][index] * (1 - t) + stations[i][index] * t;
  }
  return stations.at(-1)[index];
}

export function createCarGeometry(exploded = false, focus = 'all') {
  if (focus === 'powertrain') return createInternals('powertrain');
  const shapes = [];
  const face = (vertices, fill = BODY, stroke = 'none', weight = 0.75, bias = 0) => shapes.push({ vertices, fill, stroke, weight, bias });
  const line = (vertices, weight = 0.8, opacity = 1) => shapes.push({ vertices, line: true, stroke: BLUE, weight, opacity, bias: 0.018 });
  const hoodLift = exploded ? 1.55 : 0, cabinLift = exploded ? 1.40 : 0, noseShift = exploded ? -0.65 : 0;
  const axleX = [-2.03, 2.0];
  const stations = [[-3.38,1.08,1.17],[-3.25,1.24,1.3],[-2.8,1.31,1.38],[-2.03,1.34,1.43],[-1.22,1.30,1.46],[0,1.28,1.46],[1.25,1.30,1.47],[2.0,1.35,1.45],[2.9,1.28,1.38],[3.3,1.16,1.29],[3.4,1.08,1.19]];
  const widthAt = x => interpolate(stations, x, 1), topAt = x => interpolate(stations, x, 2);
  const lowerAt = x => {
    let y = 0.35;
    for (const axle of axleX) if (Math.abs(x - axle) < 0.70) y = Math.max(y, 0.62 + Math.sqrt(0.70 ** 2 - (x - axle) ** 2));
    return y;
  };
  // Sculpted body with genuine wheel apertures and gently flared shoulders.
  const xs = [...new Set([...stations.map(s=>s[0]),...Array.from({length:86},(_,i)=>-3.38+i*6.78/85),...axleX.flatMap(x=>[x-0.70,x+0.70])])].sort((a,b)=>a-b);
  for (const side of [-1,1]) {
    for (let i=1;i<xs.length;i++) {
      const a=xs[i-1],b=xs[i];
      const rim=x=>[x,lowerAt(x),side*(widthAt(x)-0.065)], shoulder=x=>[x,topAt(x)-0.13,side*widthAt(x)], belt=x=>[x,topAt(x),side*(widthAt(x)-0.11)];
      face([rim(a),rim(b),shoulder(b),shoulder(a)],side>0?BODY:SHADE);
      face([shoulder(a),shoulder(b),belt(b),belt(a)],LIGHT);
    }
    line(xs.map(x=>[x,topAt(x)-0.13,side*(widthAt(x)+0.004)]),0.85);
    line(xs.map(x=>[x,topAt(x),side*(widthAt(x)-0.11)]),0.85);
    line(xs.map(x=>[x,lowerAt(x),side*(widthAt(x)-0.06)]),1.0);
    for (const axle of axleX) line(Array.from({length:33},(_,i)=>{const a=i/32*Math.PI,x=axle+Math.cos(a)*0.71;return[x,0.62+Math.sin(a)*0.71,side*(widthAt(x)-0.037)];}),1.1);
    for (const x of [-1.13,0.58,1.71]) line([[x,topAt(x)-0.02,side*(widthAt(x)-0.085)],[x+0.04,0.86,side*(widthAt(x)-0.02)],[x-0.03,Math.max(0.39,lowerAt(x)),side*(widthAt(x)-0.05)]],0.75);
    line([[-1.28,0.47,side*1.22],[-0.4,0.43,side*1.23],[1.29,0.43,side*1.24]],1.1);
    for (const x of [0.27,1.43]) {const z=side*(widthAt(x)+0.008);face([[x-0.10,1.23,z],[x+0.10,1.23,z],[x+0.10,1.19,z],[x-0.10,1.19,z]],SHADE,BLUE,0.65,0.015);}
  }
  if (exploded) for(const shape of shapes) shape.vertices=shape.vertices.map(([x,y,z])=>[x,y+.65,z+Math.sign(z)*.48]);
  if (!exploded) face([[-3.1,0.35,-1.12],[3.18,0.35,-1.12],[3.18,0.35,1.12],[-3.1,0.35,1.12]],DARK);
  // Long hood with the central sculpted creases of a modern performance sedan.
  const hoodXs=[-3.30,-3.12,-2.8,-2.03,-1.22],hoodZs=[-1,-0.66,0,0.66,1];
  const hoodPoint=(x,z)=>[x+(exploded?-0.15:0),topAt(x)+(1-z*z)*0.065+hoodLift,z*(widthAt(x)-0.11)];
  for(let i=1;i<hoodXs.length;i++)for(let j=1;j<hoodZs.length;j++)face([hoodPoint(hoodXs[i-1],hoodZs[j-1]),hoodPoint(hoodXs[i],hoodZs[j-1]),hoodPoint(hoodXs[i],hoodZs[j]),hoodPoint(hoodXs[i-1],hoodZs[j])],j===1?BODY:LIGHT);
  for(const z of [-1,-0.66,0.66,1])line(hoodXs.map(x=>hoodPoint(x,z)),Math.abs(z)===1?0.9:0.55);
  for(const x of [-3.30,-1.22])line(hoodZs.map(z=>hoodPoint(x,z)),0.9);
  // Curved roof, sloped glazing, B-pillars, rear-quarter kink and wing mirrors.
  const cabin=p=>[p[0],p[1]+cabinLift,p[2]];
  const roofStations=[[-0.48,0.93,2.00],[-0.22,0.96,2.10],[0.65,0.97,2.13],[1.20,0.93,2.03]];
  for(let i=1;i<roofStations.length;i++){const a=roofStations[i-1],b=roofStations[i];for(const side of [-1,1])face([cabin([a[0],a[2],side*a[1]]),cabin([b[0],b[2],side*b[1]]),cabin([b[0],b[2]+0.045,0]),cabin([a[0],a[2]+0.045,0])],LIGHT);}
  face([cabin([-1.22,1.48,-1.16]),cabin([-0.48,2.00,-0.93]),cabin([-0.48,2.00,0.93]),cabin([-1.22,1.48,1.16])],GLASS,BLUE,1.0);
  line([cabin([-1.22,1.48,-1.16]),cabin([-1.28,1.46,0]),cabin([-1.22,1.48,1.16])],0.8);
  face([cabin([1.20,2.03,-0.93]),cabin([2.16,1.47,-1.17]),cabin([2.16,1.47,1.17]),cabin([1.20,2.03,0.93])],GLASS,BLUE,1.0);
  for(const side of [-1,1]){
    const p=(x,y,z)=>cabin([x,y,side*z]);
    face([p(-1.20,1.47,1.18),p(-0.48,2.00,0.93),p(-0.22,2.10,0.96),p(0.45,2.12,0.97),p(0.47,1.48,1.19)],GLASS,BLUE,0.9);
    face([p(0.55,1.48,1.19),p(0.54,2.12,0.97),p(1.20,2.03,0.93),p(1.88,1.61,1.12),p(1.66,1.48,1.19)],GLASS,BLUE,0.9);
    face([p(0.45,2.12,0.97),p(0.54,2.12,0.97),p(0.55,1.48,1.19),p(0.47,1.48,1.19)],DARK,BLUE,0.65);
    face([p(1.20,2.03,0.93),p(2.16,1.47,1.17),p(1.66,1.48,1.19),p(1.88,1.61,1.12)],BODY,BLUE,0.85);
    line(roofStations.map(([x,z,y])=>p(x,y,z)),1.0);
    line([p(-1.20,1.47,1.18),p(0.47,1.48,1.19),p(1.66,1.48,1.19),p(2.16,1.47,1.17)],1.15);
    const offset=exploded?0.18:0;
    line([p(-1.0,1.48,1.15),p(-1.11,1.48,1.47+offset)],2.1);
    face([p(-1.23,1.58,1.36+offset),p(-0.91,1.60,1.39+offset),p(-0.88,1.49,1.57+offset),p(-1.17,1.47,1.57+offset)],DARK,BLUE,0.85);
  }
  // Rear deck, narrow lamps, spoiler and quad exhaust outlets.
  for(const side of [-1,1])face([[2.16,1.47,0],[3.25,1.31,0],[3.25,1.31,side*1.09],[2.16,1.47,side*1.17]],LIGHT);
  face([[3.4,0.36,-1.08],[3.4,1.19,-1.08],[3.4,1.19,1.08],[3.4,0.36,1.08]],BODY,BLUE,0.9);
  line([[3.27,1.37,-1.09],[3.34,1.38,0],[3.27,1.37,1.09]],2.1);
  for(const side of [-1,1]){face([[3.415,1.14,side*0.28],[3.415,1.16,side*1.04],[3.415,1.05,side*1.04],[3.415,1.04,side*0.28]],GLASS,BLUE,0.9);line([[3.43,1.10,side*0.32],[3.43,1.11,side*0.96]],1.5);}
  face([[3.43,0.37,-0.98],[3.43,0.67,-0.8],[3.43,0.67,0.8],[3.43,0.37,0.98]],DARK,BLUE,0.8);
  for(const z of [-0.86,-0.66,0.66,0.86])face(Array.from({length:16},(_,i)=>[3.47,0.49+Math.sin(i/16*Math.PI*2)*0.075,z+Math.cos(i/16*Math.PI*2)*0.075]),LIGHT,BLUE,0.8);
  // Paired kidney grille, double LED signatures and deep lower air intakes.
  const nose=(y,z,x=-3.405)=>[x+noseShift,y,z];
  face([nose(0.36,-1.08),nose(1.17,-1.08),nose(1.17,1.08),nose(0.36,1.08)],BODY,BLUE,1.0);
  for(const side of [-1,1]){
    face([[0.88,0.07],[1.24,0.07],[1.25,0.49],[1.14,0.64],[0.88,0.59]].map(([y,z])=>nose(y,z*side,-3.425)),DARK,BLUE,1.15);
    for(let i=0;i<5;i++){const z=side*(0.14+i*0.087);line([nose(0.93,z,-3.445),nose(i<4?1.19:1.12,z,-3.445)],0.65,0.8);}
    face([nose(1.20,side*0.72,-3.39),nose(1.24,side*1.12,-3.30),nose(1.09,side*1.16,-3.30),nose(1.06,side*0.74,-3.39)],GLASS,BLUE,0.9);
    for(const z of [0.82,1.02])line([nose(1.20,side*z,-3.423),nose(1.1,side*(z-0.025),-3.423),nose(1.095,side*(z+0.055),-3.423)],2.2);
    face([nose(0.46,side*0.68),nose(0.83,side*0.76),nose(0.86,side*1.05),nose(0.47,side*1.04)].map(([x,y,z])=>[x-0.02,y,z]),DARK,BLUE,0.85);
    line([nose(0.51,side*0.76,-3.445),nose(0.76,side*0.84,-3.445)],1.1);
  }
  face([nose(0.43,-0.60),nose(0.79,-0.49),nose(0.79,0.49),nose(0.43,0.60)],DARK,BLUE,0.8);
  line([nose(0.36,-1.13,-3.46),nose(0.33,0,-3.48),nose(0.36,1.13,-3.46)],1.6);
  face(Array.from({length:20},(_,i)=>[-3.16+Math.cos(i/20*Math.PI*2)*0.075+(exploded?-0.15:0),1.388+hoodLift,Math.sin(i/20*Math.PI*2)*0.075]),LIGHT,BLUE,0.8);
  // Independent tyres, deep rims, brake discs and paired spokes.
  for(const axle of axleX)for(const side of [-1,1]){
    const centerZ=side*(1.235+(exploded?0.83:0));
    const wp=(a,r,dz)=>[axle+Math.cos(a)*r,0.62+Math.sin(a)*r,centerZ+dz];
    const profile=[[-0.16,0.49],[-0.15,0.55],[-0.10,0.60],[0.10,0.60],[0.15,0.55],[0.16,0.49]];
    for(let i=0;i<48;i++){const a=i/48*Math.PI*2,b=(i+1)/48*Math.PI*2;for(let j=1;j<profile.length;j++){const p=profile[j-1],q=profile[j];face([wp(a,p[1],p[0]),wp(b,p[1],p[0]),wp(b,q[1],q[0]),wp(a,q[1],q[0])],j===3?SHADE:DARK);}}
    for(const sign of [-1,1]){
      const dz=sign*0.163,circle=r=>Array.from({length:49},(_,i)=>wp(i/48*Math.PI*2,r,dz));
      face(circle(0.50),DARK,BLUE,0.9,0.002);face(circle(0.425),LIGHT,BLUE,0.85,0.004);face(circle(0.365),DARK,BLUE,0.65,0.006);face(circle(0.285),SHADE,'none',0,0.008);
      for(let k=0;k<5;k++)for(const offset of [-0.065,0.065]){const a=k/5*Math.PI*2+offset;face([[a-0.045,0.11],[a+0.08,0.40],[a+0.14,0.40],[a+0.06,0.11]].map(([a,r])=>wp(a,r,dz+sign*0.012)),LIGHT,BLUE,0.45,0.01);}
      face(circle(0.115).map(([x,y,z])=>[x,y,z+sign*0.015]),LIGHT,BLUE,0.7,0.02);
    }
    for(let k=0;k<32;k++){const a=k/32*Math.PI*2;line([wp(a,0.601,-0.09),wp(a+0.035,0.601,0.09)],0.45,0.65);}
  }
  return [...shapes,...createInternals()];
}

export function projectScene(geometry, rotation=-0.64, tilt=0.39) {
  const c=Math.cos(rotation),s=Math.sin(rotation),ct=Math.cos(tilt),st=Math.sin(tilt);
  const project=([x,y,z])=>{const horizontal=x*c-z*s,forward=x*s+z*c;return[420+horizontal*77,307-(y*ct-forward*st)*77,forward*ct+y*st];};
  return geometry.map(shape=>{const vertices=shape.vertices.map(project);return{...shape,points:vertices.map(p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' '),depth:vertices.reduce((sum,p)=>sum+p[2],0)/vertices.length+(shape.bias||0)};}).sort((a,b)=>a.depth-b.depth);
}
