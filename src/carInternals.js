// Authored educational assemblies. They illustrate the arrangement of parts;
// they are not extracted from Sketchfab and are not BMW manufacturing data.
const C={body:'var(--car-fill)',light:'var(--car-light)',shade:'var(--car-shade)',dark:'var(--wheel)',glass:'var(--glass)',ink:'var(--blue)'};
export function createInternals(focus='all') {
  const result=[];
  let part='chassis';
  const face=(vertices,fill=C.body,stroke='none',weight=.65)=>result.push({vertices,fill,stroke,weight,bias:0,part});
  const line=(vertices,weight=.7)=>result.push({vertices,line:true,stroke:C.ink,weight,opacity:1,bias:.012,part});
  const box=(p,s,fill=C.body)=>{
    const[x,y,z]=p,[w,h,d]=s;
    const v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,c])=>[x+a*w/2,y+b*h/2,z+c*d/2]);
    for(const f of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]])face(f.map(i=>v[i]),fill,C.ink,.55);
  };
  const cylinder=(a,b,r1,r2=r1,fill=C.shade,n=16)=>{
    const direction=b.map((v,i)=>v-a[i]),length=Math.hypot(...direction),u=direction.map(v=>v/length);
    const ref=Math.abs(u[1])<.9?[0,1,0]:[1,0,0];
    let v=[u[1]*ref[2]-u[2]*ref[1],u[2]*ref[0]-u[0]*ref[2],u[0]*ref[1]-u[1]*ref[0]];const vl=Math.hypot(...v);v=v.map(c=>c/vl);
    const w=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const ring=(p,r)=>Array.from({length:n},(_,i)=>p.map((c,j)=>c+r*(Math.cos(i/n*Math.PI*2)*v[j]+Math.sin(i/n*Math.PI*2)*w[j])));
    const ra=ring(a,r1),rb=ring(b,r2);
    for(let i=0;i<n;i++)face([ra[i],ra[(i+1)%n],rb[(i+1)%n],rb[i]],fill);
    face(ra,fill,C.ink,.55);face(rb,fill,C.ink,.55);line([...ra,ra[0]],.45);line([...rb,rb[0]],.45);
  };
  const tube=(points,r=.04,fill=C.shade)=>{for(let i=1;i<points.length;i++)cylinder(points[i-1],points[i],r,r,fill,8);};
  // Ladder-like floor structure, transmission tunnel and underfloor battery pack.
  box([.25,.38,0],[4.8,.12,1.95],C.light);
  for(const z of [-.9,.9])box([.1,.28,z],[5.2,.16,.12],C.shade);
  for(const x of [-1.65,-.75,.15,1.05,1.85])box([x,.3,0],[.10,.11,1.85],C.shade);
  box([.35,.51,0],[2.25,.28,.32],C.body);
  box([1.28,.31,0],[1.15,.22,1.5],C.glass);
  for(let i=0;i<9;i++)line([[.79+i*.12,.425,-.68],[.79+i*.12,.425,.68]],.45);
  // V8 block, cylinder heads, intake plenum, turbos, pulleys and cooling hoses.
  part='engine';
  box([-2.03,.92,0],[1.08,.68,.75],C.shade);
  box([-2.03,.58,0],[.9,.15,.68],C.dark);
  for(const side of [-1,1]){
    box([-2.04,1.22,side*.37],[1.20,.22,.32],C.body);
    box([-2.04,1.36,side*.38],[1.13,.08,.30],C.light);
    for(let i=0;i<4;i++){
      const x=-2.45+i*.27;
      cylinder([x,1.26,side*.34],[x,1.45,side*.26],.055,.045,C.dark,10);
      line([[x-.10,1.405,side*.26],[x-.10,1.405,side*.49]],.5);
      tube([[x,1.08,side*.5],[x,1.02,side*.68],[x+.16,.89,side*.68]],.055,C.body);
    }
    cylinder([-2.45,.85,side*.67],[-2.16,.85,side*.67],.16,.16,C.shade,20);
    cylinder([-2.3,.85,side*.57],[-2.3,.85,side*.80],.11,.09,C.light,16);
    tube([[-2.3,.85,side*.8],[-2.51,1.12,side*.77],[-2.52,1.39,side*.58],[-2.1,1.45,side*.19]],.07,C.body);
  }
  box([-1.98,1.47,0],[.87,.18,.36],C.glass);
  for(let i=0;i<5;i++)line([[-2.34+i*.17,1.565,-.14],[-2.34+i*.17,1.565,.14]],.6);
  for(const [y,z,r]of [[.77,0,.18],[.88,.31,.12],[.68,-.29,.10]]){
    cylinder([-2.62,y,z],[-2.72,y,z],r,r,C.dark,24);cylinder([-2.725,y,z],[-2.735,y,z],r*.5,r*.5,C.light,16);
  }
  line([[-2.74,.77,.18],[-2.74,1.0,.31],[-2.74,.80,-.29],[-2.74,.59,0],[-2.74,.77,.18]],1.1);
  box([-2.94,1.00,0],[.12,.72,1.22],C.body);
  for(let i=0;i<18;i++)line([[-3.005,.68,-.55+i*.065],[-3.005,1.33,-.55+i*.065]],.4);
  cylinder([-2.83,.99,0],[-2.87,.99,0],.27,.27,C.dark,24);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;line([[-2.89,.99,0],[-2.89,.99+Math.sin(a)*.24,Math.cos(a)*.24]],1.1);}
  tube([[-2.65,1.2,.4],[-2.82,1.27,.49],[-2.92,1.29,.5]],.045,C.shade);
  // Bellhousing, ribbed gearbox case, sump, prop shaft and differential.
  part='transmission';
  cylinder([-1.45,.83,0],[-1.15,.83,0],.37,.29,C.body,24);
  cylinder([-1.15,.83,0],[-.18,.83,0],.28,.17,C.shade,16);
  for(let i=0;i<10;i++)cylinder([-1.10+i*.09,.83,0],[-1.08+i*.09,.83,0],.285-i*.009,.285-i*.009,C.light,16);
  box([-.67,.57,0],[.8,.12,.43],C.body);
  for(let i=0;i<5;i++)for(const z of [-.2,.2])cylinder([-.99+i*.15,.53,z],[-.99+i*.15,.51,z],.025,.025,C.dark,8);
  cylinder([-.15,.75,0],[1.90,.60,0],.075,.075,C.dark,16);
  for(const x of [-.06,1.72])cylinder([x,.74-(x+.15)*.07,0],[x+.14,.73-(x+.15)*.07,0],.12,.12,C.body,12);
  box([2.01,.58,0],[.38,.29,.44],C.shade);
  // Double wishbones, dampers, coils, anti-roll bars and half-shafts.
  part='suspension';
  for(const x of [-2.03,2.0]){
    box([x,.37,0],[.56,.15,1.28],C.shade);
    for(const side of [-1,1]){
      const z=side*1.04;
      cylinder([x,.62,side*.12],[x,.62,side*1.21],.045,.045,C.dark,12);
      cylinder([x,.62,z],[x,1.27,side*.86],.043,.075,C.body,12);
      line(Array.from({length:101},(_,i)=>{const t=i/100,a=t*Math.PI*12;return[x+Math.cos(a)*.115,.78+t*.42,side*(1.01-t*.13)+Math.sin(a)*.115];}),1.2);
      for(const y of [.39,.81])for(const dx of [-.3,.3])cylinder([x+dx,y,side*.49],[x,y+.05,side*1.17],.035,.035,C.light,10);
      cylinder([x,.62,side*1.11],[x,.62,side*1.22],.34,.34,C.body,32);
      cylinder([x,.62,side*1.23],[x,.62,side*1.25],.12,.12,C.shade,16);
      box([x+.26,.64,side*1.15],[.13,.34,.15],C.glass);
      for(let i=0;i<16;i++){const a=i/16*Math.PI*2;line([[x+Math.cos(a)*.25,.62+Math.sin(a)*.25,side*1.265],[x+Math.cos(a)*.29,.62+Math.sin(a)*.29,side*1.265]],.45);}
    }
    tube([[x-.2,.43,-1.06],[x-.35,.43,-.7],[x-.35,.43,.7],[x-.2,.43,1.06]],.032,C.shade);
  }
  // Catalysts, dual exhaust pipes and rear silencers.
  part='chassis';
  for(const side of [-1,1]){
    tube([[-2.12,.68,side*.63],[-1.52,.43,side*.63],[-.9,.27,side*.55],[.6,.24,side*.62],[1.8,.24,side*.7],[2.68,.3,side*.75]],.045,C.body);
    cylinder([-.8,.27,side*.55],[-.25,.26,side*.58],.11,.11,C.shade,16);
    box([2.66,.3,side*.68],[.65,.25,.43],C.body);
  }
  // Seat cushions, bolsters, reclined backs, headrests, rear bench and cabin trim.
  part='cabin';
  const seat=(x,z)=>{
    box([x,.81,z],[.72,.19,.61],C.glass);
    box([x-.02,.92,z-.28],[.66,.18,.095],C.body);box([x-.02,.92,z+.28],[.66,.18,.095],C.body);
    face([[x+.28,.91,z-.30],[x+.48,1.62,z-.28],[x+.48,1.62,z+.28],[x+.28,.91,z+.30]],C.glass,C.ink,.8);
    for(const s of [-1,1])box([x+.43,1.24,z+s*.28],[.17,.61,.10],C.body);
    box([x+.49,1.74,z],[.15,.22,.37],C.body);
    for(let i=0;i<4;i++)line([[x-.23+i*.13,.914,z-.20],[x-.23+i*.13,.914,z+.20]],.55);
    for(let i=0;i<4;i++)line([[x+.30+i*.04,1.01+i*.14,z-.20],[x+.30+i*.04,1.01+i*.14,z+.20]],.55);
    cylinder([x-.2,.65,z-.23],[x+.3,.65,z-.23],.025,.025,C.dark,8);
  };
  seat(-.15,-.57);seat(-.15,.57);
  box([1.22,.82,0],[.65,.2,1.72],C.glass);box([1.52,1.18,0],[.20,.65,1.72],C.body);
  for(const z of [-.57,0,.57])box([1.55,1.59,z],[.16,.20,.32],C.glass);
  box([-.91,1.13,0],[.35,.28,1.94],C.body);
  box([-.78,1.36,-.03],[.08,.28,1.26],C.dark);
  line([[-.728,1.26,-.59],[-.728,1.43,-.59],[-.728,1.43,.53],[-.728,1.26,.53],[-.728,1.26,-.59]],.8);
  box([.02,1.00,0],[1.12,.17,.30],C.body);box([-.23,1.11,0],[.28,.06,.18],C.dark);
  for(const z of [-.065,.065])cylinder([.14,1.09,z],[.14,1.105,z],.052,.052,C.dark,16);
  // Steering wheel torus and three spokes in a plane perpendicular to the car.
  const steeringCenter=[-.55,1.33,.61],r=.22;
  for(let i=0;i<32;i++){const a=i/32*Math.PI*2,b=(i+1)/32*Math.PI*2;tube([[steeringCenter[0],steeringCenter[1]+Math.sin(a)*r,steeringCenter[2]+Math.cos(a)*r],[steeringCenter[0],steeringCenter[1]+Math.sin(b)*r,steeringCenter[2]+Math.cos(b)*r]],.025,C.dark);}
  cylinder([-.58,1.33,.61],[-.51,1.33,.61],.085,.085,C.body,16);
  for(const a of [-Math.PI/2,.2,Math.PI-.2])tube([steeringCenter,[-.55,1.33+Math.sin(a)*.19,.61+Math.cos(a)*.19]],.022,C.body);
  // Focus mode shows the mechanical assemblies larger and keeps labels honest.
  const filtered=focus==='powertrain'?result.filter(s=>s.part==='engine'||s.part==='transmission'):result;
  if(focus==='powertrain')for(const shape of filtered)shape.vertices=shape.vertices.map(([x,y,z])=>[(x+.5)*1.45,y*1.45,z*1.45]);
  return filtered;
}
