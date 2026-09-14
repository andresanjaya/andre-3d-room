import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createRoom as createBase} from './base-room.mjs';

// Deterministic material textures are embedded in the exported GLB.
function texture(kind, color, seed=37) {
  const c=document.createElement('canvas');c.width=c.height=512;
  const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,512,512);
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  if(kind==='wood') {
    for(let i=0;i<1700;i++) {
      const y=rand()*512;const thick=rand()*1.2+.2;
      x.strokeStyle=rand()>.6?'rgba(255,240,208,.12)':'rgba(78,49,28,.09)';x.lineWidth=thick;
      x.beginPath();for(let u=0;u<=512;u+=4){const v=y+Math.sin(u/75+y/27)*2.4+Math.sin(u/31+y)*.5;u?x.lineTo(u,v):x.moveTo(u,v);}x.stroke();
    }
  } else {
    for(let i=0;i<512;i+=2){x.strokeStyle='rgba(255,255,255,.065)';x.beginPath();x.moveTo(i,0);x.lineTo(i,512);x.stroke();x.strokeStyle='rgba(0,0,0,.08)';x.beginPath();x.moveTo(0,i);x.lineTo(512,i);x.stroke();}
    for(let i=0;i<20000;i++){x.fillStyle=`rgba(0,0,0,${rand()*.045})`;x.fillRect(rand()*512,rand()*512,1,1);}
  }
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;
}

export function createRoom() {
  const data=createBase();const {root,scene,interactive}=data;
  scene.name='Andre_Archive_Room_Refined';
  const all=[];root.traverse(o=>all.push(o));
  const remove=(test)=>all.filter(test).forEach(o=>o.removeFromParent());
  const mat=(name,color,roughness=.65,other={})=>{const m=new T.MeshStandardMaterial({color,roughness,...other});m.name=name;return m;};
  const white=mat('porcelain_white','#edece6',.48),metal=mat('brushed_aluminium','#8e9696',.34,{metalness:.72});
  const dark=mat('graphite','#252b2b',.52),oak=mat('natural_oak','#ffffff',.63,{map:texture('wood','#b49a76')});
  const paleOak=mat('pale_oak','#ffffff',.59,{map:texture('wood','#c9b595',89)});
  const sage=mat('sage_linen','#ffffff',.95,{map:texture('fabric','#77847a')});
  const linen=mat('ivory_linen','#ffffff',.96,{map:texture('fabric','#dddcd1')});
  const charcoal=mat('charcoal_weave','#ffffff',.94,{map:texture('fabric','#454c4c')});
  const cork=mat('board_felt','#ffffff',1,{map:texture('fabric','#3e4b48')});
  const soil=mat('potting_soil','#292c20',1),leafMat=mat('botanical_green','#456948',.72,{side:T.DoubleSide});
  const leafLight=mat('new_leaf_green','#72936a',.7,{side:T.DoubleSide});
  const paper=mat('archival_paper','#f0eee5',.91),brass=mat('satin_brass','#aaa27d',.35,{metalness:.65});
  let id=0;const geos=new Map();
  function box(name,p,s,m,parent=root,r=.02) {const key=JSON.stringify([s,r]);if(!geos.has(key))geos.set(key,r?new RoundedBoxGeometry(...s,3,Math.min(r,...s.map(v=>v*.42))):new T.BoxGeometry(...s));const o=new T.Mesh(geos.get(key),m);o.name=name||`refined_${++id}`;o.position.set(...p);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function ball(name,p,s,m,parent=root) {const o=new T.Mesh(new T.SphereGeometry(1,40,24),m);o.name=name;o.position.set(...p);o.scale.set(...s);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function cyl(name,p,rt,rb,h,m,parent=root) {const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,48),m);o.name=name;o.position.set(...p);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function line(name,points,r,m,parent=root) {const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const o=new T.Mesh(new T.TubeGeometry(path,Math.max(8,points.length*5),r,6,false),m);o.name=name;parent.add(o);return o;}
  function group(name,p=[0,0,0]){const g=new T.Group();g.name=name;g.position.set(...p);root.add(g);return g;}
  function anchor(parent,name,p,size){const o=new T.Object3D();o.name=name;o.position.set(...p);o.userData={width:size[0],height:size[1],normal:[0,0,1]};parent.add(o);return o;}
  // Retain device transforms while making individual screen surfaces addressable.
  root.traverse(o=>{
    if(!o.isMesh)return;
    if(['oak','oak_light'].includes(o.material?.name))o.material=white;
    if(o.material?.name==='walnut')o.material=dark;
    if(o.material?.name==='mulberry_wall'||o.material?.name==='rose_wall')o.material=mat('soft_white_plaster','#e5e6e2',.91);
  });
  remove(o=>o.name.startsWith('floor_plank')||o.name==='left_wall'||o.name==='rug'||o.name==='rug_weave'||o.name.startsWith('plant_'));
  // Staggered oak boards, with physical joints and varied grain, not a checkerboard.
  const floorMats=Array.from({length:6},(_,i)=>{const m=oak.clone();m.color.setHSL(.09,.07,.9+i*.012);m.map=oak.map.clone();m.map.center.set(.5,.5);m.map.rotation=Math.PI/2;return m;});
  for(let row=0;row<16;row++){
    let z=-2.39;let k=0;while(z<2.39){const len=Math.min(k===0?.65+(row%3)*.35:1.35,2.39-z);box(`oak_plank_${row}_${k}`,[-2.4+row*.32,.018,z+len/2],[.316,.05,len-.007],floorMats[(row*7+k)%6],root,.004);z+=len;k++;}
  }
  root.getObjectByName('desktop').material=paleOak;
  root.getObjectByName('bed_frame').material=oak;
  root.getObjectByName('console').material=paleOak;
  const rug=box('woven_rug',[-.3,.065,.76],[2.53,.022,1.68],linen,root,.035);
  for(let z of [.02,1.5])for(let i=0;i<70;i++)line('rug_fringe',[[-1.52+i*.035,.078,z],[-1.51+i*.035,.078,z+(z<1?-.07:.07)]],.003,linen);
  for(let z of [.08,.12,1.4,1.44])box('woven_rug_border',[-.3,.078,z],[2.36,.002,.009],sage,root,.001);
  // Real opening in the left wall, with a recessed frame and folded linen curtains.
  const wx=-2.56,wz=.15,wy=1.94,ww=1.85,wh=1.32;
  const plaster=mat('window_wall_plaster','#e5e6e2',.91);
  box('window_wall_lower',[wx,(wy-wh/2)/2,0],[.12,wy-wh/2,4.8],plaster,root,0);
  box('window_wall_upper',[wx,(3+wy+wh/2)/2,0],[.12,3-wy-wh/2,4.8],plaster,root,0);
  const near=wz+ww/2,far=wz-ww/2;
  box('window_wall_front',[wx,wy,(near+2.4)/2],[.12,wh,2.4-near],plaster,root,0);
  box('window_wall_back',[wx,wy,(-2.4+far)/2],[.12,wh,far+2.4],plaster,root,0);
  const win=group('window_frame',[wx,wy,wz]);win.rotation.y=Math.PI/2;
  for(let u of [-ww/2,ww/2])box('window_jamb',[u,0,.035],[.085,wh+.12,.15],white,win,.009);
  for(let v of [-wh/2,wh/2])box('window_rail',[0,v,.035],[ww+.15,.085,.15],white,win,.009);
  const glass=mat('daylight_glass','#d5e7e7',.2,{metalness:.05,emissive:'#c0d5da',emissiveIntensity:.23});
  box('window_glass',[0,0,-.035],[ww-.09,wh-.09,.018],glass,win,.001);
  box('window_mullion',[0,0,.047],[.048,wh,.095],white,win,.004);
  box('window_crossbar',[0,.06,.047],[ww,.044,.095],white,win,.004);
  box('window_sill',[0,-wh/2-.04,.105],[ww+.25,.08,.34],paleOak,win,.016);
  box('window_latch',[.065,-.1,.11],[.025,.13,.03],metal,win,.01);
  line('curtain_rod',[[-2.27,2.78,wz-1.16],[-2.27,2.78,wz+1.16]],.019,brass);
  for(let z of [wz-1.18,wz+1.18])ball('rod_finial',[-2.27,2.78,z],[.034,.034,.034],brass);
  for(let side of [-1,1]) {
    const geo=new T.PlaneGeometry(.48,1.59,32,36);const a=geo.attributes.position;
    for(let i=0;i<a.count;i++){const u=a.getX(i),v=a.getY(i);a.setZ(i,Math.cos((u+.24)/.48*Math.PI*8)*.045*(.9+.15*Math.sin(v*2)));a.setY(i,v+.01*Math.cos(u*48)*(v<-.7?1:0));}geo.computeVertexNormals();
    const curtain=new T.Mesh(geo,linen.clone());curtain.material.side=T.DoubleSide;curtain.name='linen_curtain';curtain.position.set(-2.23,1.92,wz+side*.91);curtain.rotation.y=Math.PI/2;curtain.castShadow=curtain.receiveShadow=true;root.add(curtain);
    for(let k=0;k<5;k++){const ring=new T.Mesh(new T.TorusGeometry(.028,.006,8,24),brass);ring.position.set(-2.27,2.75,wz+side*.91-.2+k*.1);root.add(ring);}
  }
  // Soft goods use continuous curved surfaces with restrained folds and sewn edges.
  remove(o=>['duvet','bed_throw','pillow'].includes(o.name));
  // Remove the previous throw's decorative geometry without touching other furniture.
  all.filter(o=>o.isMesh&&o.parent===root&&Math.abs(o.position.y-.784)<.001).forEach(o=>o.removeFromParent());
  root.getObjectByName('headboard').material=charcoal;
  root.getObjectByName('mattress').material=linen;
  function cushion(name,p,s,m){const geo=new T.SphereGeometry(1,56,32);const a=geo.attributes.position;for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),z=a.getZ(i);const f=v=>Math.sign(v)*Math.pow(Math.abs(v),.46);a.setXYZ(i,f(x)*s[0]/2,f(y)*s[1]/2*(1+.045*Math.sin(x*17+z*11)),f(z)*s[2]/2);}geo.computeVertexNormals();const o=new T.Mesh(geo,m);o.name=name;o.position.set(...p);o.castShadow=o.receiveShadow=true;root.add(o);return o;}
  cushion('tailored_duvet',[1.47,.66,-.77],[1.65,.23,1.34],sage);
  for(let x of [1.03,1.86]){const p=cushion('linen_pillow',[x,.72,-1.8],[.7,.22,.45],linen);p.rotation.y=x<1.4?-.07:.07;}
  cushion('accent_cushion',[1.49,.76,-1.62],[.46,.24,.33],charcoal);
  const throwGeo=new T.PlaneGeometry(1.65,.43,64,20);const a=throwGeo.attributes.position;
  for(let i=0;i<a.count;i++){const x=a.getX(i);a.setZ(i,.007*Math.sin(x*34)+.006*Math.sin(a.getY(i)*24+x*9));}throwGeo.computeVertexNormals();
  const throwMesh=new T.Mesh(throwGeo,linen);throwMesh.rotation.x=-Math.PI/2;throwMesh.position.set(1.47,.813,-.39);throwMesh.name='folded_linen_throw';throwMesh.receiveShadow=true;root.add(throwMesh);
  line('duvet_piping',[[.67,.66,-1.34],[.66,.64,-.78],[.68,.63,-.14],[1.47,.62,-.11],[2.27,.63,-.14],[2.28,.64,-.78],[2.27,.66,-1.34]],.007,sage);
  // Ergonomic chair with separate cushions, stitched edge, castors, and metal supports.
  const chair=root.getObjectByName('gaming_chair');
  chair.children.forEach(o=>{if(o.isMesh&&o.material.name==='lilac')o.material=charcoal;});
  line('chair_piping',[[-.23,.67,.24],[-.24,.9,.21],[-.22,1.31,.16],[0,1.36,.16],[.22,1.31,.16],[.24,.9,.21],[.23,.67,.24]],.007,linen,chair);
  box('lumbar_cushion',[0,.79,.13],[.37,.15,.10],charcoal,chair,.045);
  for(let s of [-1,1])box('backrest_stitch',[s*.14,1.05,.107],[.008,.27,.003],sage,chair,.001);
  box('chair_rear_shell',[0,1.0,.313],[.39,.49,.035],charcoal,chair,.015);
  for(let s of [-1,1])line('chair_rear_seam',[[s*.2,.78,.326],[s*.2,1.0,.32],[s*.17,1.23,.292]],.005,sage,chair);
  // Device detailing: real keycaps, ports, lens rings, speaker perforations.
  const monitor=root.getObjectByName('monitor_interactive');
  monitor.children.filter(o=>o.name.startsWith('detail_')).forEach(o=>o.removeFromParent());
  const screen=monitor.getObjectByName('screen');screen.material=mat('monitor_display','#132725',.4,{emissive:'#213e38',emissiveIntensity:.24});screen.name='monitor_screen';
  anchor(monitor,'monitor_screen_anchor',[0,.49,.047],[.84,.48]);
  ball('power_indicator',[.39,.225,.043],[.004,.004,.003],mat('indicator','#add8bc',.4,{emissive:'#a2e5c0',emissiveIntensity:1}),monitor);
  for(let i=0;i<24;i++)box('monitor_rear_vent',[-.34+i*.029,.35,-.039],[.015,.055,.003],dark,monitor,.001);
  const laptop=root.getObjectByName('laptop_interactive');
  for(let row=0;row<4;row++)for(let col=0;col<12;col++)box('laptop_key',[-.17+col*.031,.045,-.09+row*.032],[.025,.008,.025],dark,laptop,.002);
  for(let s of [-1,1])for(let j=0;j<8;j++)box('speaker_grille',[s*.211,.043,-.09+j*.018],[.008,.004,.007],dark,laptop,.001);
  for(let i=0;i<2;i++)box('usb_port',[.237,.021,-.07+i*.11],[.002,.011,.045],dark,laptop,.001);
  anchor(laptop,'laptop_screen_anchor',[0,.191,-.125],[.42,.275]).rotation.x=-.12;
  const camera=root.getObjectByName('camera_interactive');
  for(let z of [.09,.125,.15]){const ring=new T.Mesh(new T.TorusGeometry(.076,.006,8,40),metal);ring.position.set(0,0,z);ring.name='lens_focus_ring';camera.add(ring);}
  cyl('shutter_button',[-.075,.093,0],.016,.016,.012,metal,camera);
  box('camera_grip',[-.105,-.015,.077],[.04,.105,.023],charcoal,camera,.011);
  // Archival board retains its size and interactive parent; no fabricated personal photos.
  const board=root.getObjectByName('wall_board_interactive');board.getObjectByName('felt').material=cork;
  board.children.filter(o=>o.name==='photo_shape').forEach(o=>o.removeFromParent());
  const slots=[];board.children.filter(o=>o.name==='image').forEach((o,i)=>{o.name=`board_photo_${String(i+1).padStart(2,'0')}`;o.material=[sage,linen,charcoal,paleOak,sage,linen][i];o.userData={photoSlot:i+1,replaceWithUserImage:true};slots.push(o.name);});
  anchor(board,'board_surface_anchor',[0,0,.08],[1.07,.78]);
  line('board_string',[[-.47,.31,.095],[0,.25,.095],[.47,.31,.095]],.003,linen,board);
  const shelf=root.getObjectByName('bookshelf_interactive');
  shelf.children.filter(o=>o.name==='shelf').forEach(o=>o.material=paleOak);
  shelf.children.filter(o=>o.name==='book').forEach((b,i)=>{
    const p=b.position;box('book_page_block',[p.x,p.y,p.z+.107],[.053,b.geometry.parameters?.height*.8||.26,.009],paper,shelf,.001);
    for(let y of [-.1,.09])box('book_spine_band',[p.x,y,.087],[.053,.008,.004],brass,shelf,.001);
  });
  // Curved, veined leaves replace the old ellipsoid foliage.
  function plant(name,p,scale=1){const g=group(name,p);g.scale.setScalar(scale);cyl('ceramic_pot',[0,.16,0],.16,.115,.3,white,g);cyl('pot_rim',[0,.303,0],.168,.168,.028,white,g);cyl('soil',[0,.316,0],.146,.146,.01,soil,g);
    for(let i=0;i<9;i++){const angle=i*2.4,len=.27+(i%3)*.06;const tip=[Math.sin(angle)*len,.48+(i%4)*.1,Math.cos(angle)*len];line('plant_stem',[[0,.32,0],[tip[0]*.35,tip[1]-.1,tip[2]*.35],tip],.005,leafMat,g);
      const geo=new T.PlaneGeometry(1,1,12,20);const a=geo.attributes.position;for(let j=0;j<a.count;j++){const u=a.getX(j)*2,v=a.getY(j)+.5;const w=Math.pow(Math.sin(v*Math.PI),.8)*.105;a.setXYZ(j,u*w, v*.31, Math.sin(v*Math.PI)*.038+u*u*.025);}geo.computeVertexNormals();
      const leaf=new T.Mesh(geo,i%3?leafMat:leafLight);leaf.position.set(...tip);leaf.rotation.set(Math.cos(angle)*.6,angle,-Math.sin(angle)*.6);leaf.name='curved_leaf';leaf.castShadow=leaf.receiveShadow=true;g.add(leaf);
      line('leaf_midvein',[[0,0,.001],[0,.155,.04],[0,.31,.001]],.0015,leafLight,leaf);
    }
  }
  plant('floor_botanical',[-2.05,.045,1.53],1.45);plant('desk_botanical',[-2.16,.93,-1.72],.59);plant('console_botanical',[2.15,.66,1.42],.5);
  plant('windowsill_botanical',[-2.33,1.31,.3],.48);
  // Lamp assemblies expose their own toggle targets and separate emissive materials.
  for(const prefix of ['desk','bedside']){
    const g=group(prefix==='desk'?'lamp_interactive':'bedside_lamp_interactive');
    all.filter(o=>o.name.startsWith(`${prefix}_lamp_`)).forEach(o=>g.attach(o));
    const shade=g.getObjectByName(`${prefix}_lamp_shade`);shade.material=linen.clone();shade.material.name=`${prefix}_lamp_fabric`;shade.material.emissive=new T.Color('#fff0d2');shade.material.emissiveIntensity=.15;
    const p=prefix==='desk'?[-2.08,1.405,-1.01]:[2.15,.83,-.02];const bulb=ball(`${prefix}_bulb`,p,[.035,.038,.035],mat(`${prefix}_bulb_glow`,'#fff1cd',.4,{emissive:'#ffe4aa',emissiveIntensity:1.1}),g);
    g.userData={interactive:true,interactionType:'toggle',lightName:`${prefix}_warm_light`,bulbName:bulb.name};interactive.push(g);
  }
  // Desk accessories add recognizable small-scale detail without adding new content systems.
  cyl('pencil_cup',[-1.94,1.006,-1.8],.055,.05,.14,white);
  for(let i=0;i<5;i++){const pen=cyl('pencil',[-1.97+i*.016,1.14,-1.8],.006,.006,.22,i%2?sage:oak);pen.rotation.z=(i-2)*.09;}
  const mug=cyl('ceramic_mug',[-.85,.99,-1.01],.055,.05,.12,white);cyl('coffee',[-.85,1.052,-1.01],.047,.047,.003,mat('coffee','#3c2c21',.3));
  const handle=new T.Mesh(new T.TorusGeometry(.035,.008,10,32),white);handle.position.set(-.79,1,-1.01);root.add(handle);
  line('monitor_cable',[[-1.37,1.15,-1.73],[-1.38,.94,-1.83],[-1.06,.93,-1.85],[-.9,.82,-1.88]],.006,dark);
  // Minimal clock on the back wall balances the window without changing the board location.
  const clock=group('wall_clock',[1.58,2.22,-2.25]);
  const disc=cyl('clock_case',[0,0,0],.225,.225,.045,metal,clock);disc.rotation.x=Math.PI/2;
  const face=cyl('clock_face',[0,0,.025],.205,.205,.006,white,clock);face.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const tick=box('clock_tick',[Math.sin(a)*.18,Math.cos(a)*.18,.032],[.008,.022,.004],dark,clock,.001);tick.rotation.z=-a;}
  line('clock_minute',[[0,0,.039],[.12,.1,.039]],.004,dark,clock);line('clock_hour',[[0,0,.04],[-.065,.06,.04]],.006,dark,clock);
  remove(o=>['sticker_back','mask','mask_eye'].includes(o.name));
  scene.getObjectByName('neutral_key').intensity=2;
  scene.getObjectByName('neutral_fill').intensity=4;
  for(let name of ['desk_warm_light','bedside_warm_light']){const l=scene.getObjectByName(name);l.intensity=.38;l.userData.baseIntensity=.38;}
  scene.userData={...scene.userData,title:'Andre Archive Room - Refined Oak',version:3,interactiveObjects:interactive.map(o=>o.name),photoSlots:slots,notes:'Screen anchors and photo slots are named children. Configure renderer environment, shadows and tone mapping in the host application. New assemblies are groups, not merged meshes.'};
  return data;
}
