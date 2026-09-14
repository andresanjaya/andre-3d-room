import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createRoom() {
  const scene = new THREE.Scene();
  scene.name = 'Andre_Archive_Room';
  const root = new THREE.Group(); root.name = 'room'; scene.add(root);
  const mats = {};
  const material = (name, color, roughness=.75, emissive=null) => {
    const m = new THREE.MeshStandardMaterial({color, roughness, ...(emissive ? {emissive, emissiveIntensity:.55} : {})});
    m.name = name; mats[name] = m; return m;
  };
  // Retain material keys and node transforms for compatibility with existing integrations.
  material('mulberry_wall','#e4e6e5'); material('rose_wall','#f1f2f0');
  material('walnut','#8e9699'); material('oak','#d2d6d5'); material('oak_light','#f5f6f3');
  material('ink','#303537'); material('ivory','#f5f6f3'); material('peach','#dfe2df');
  material('teal','#575f61'); material('mint','#b3beb8'); material('coral','#999f9d');
  material('lilac','#a8aeaf'); material('gold','#9da4a5',.4); material('green','#526e57');
  material('leaf_light','#829781'); material('paper','#fafbf8'); material('screen','#263033',.5,'#445052');
  material('glow','#fffdf4',.4,'#fff9e9'); material('red','#94575b'); material('black','#202526');
  material('blue','#849499');
  let serial=0;
  const boxGeo = new Map();
  function box(name, pos, size, mat, parent=root, radius=.025, rot=[0,0,0]) {
    const key=JSON.stringify([size,radius]);
    if(!boxGeo.has(key)) boxGeo.set(key,radius ? new RoundedBoxGeometry(...size,3,Math.min(radius,...size.map(v=>v*.25))) : new THREE.BoxGeometry(...size));
    const mesh=new THREE.Mesh(boxGeo.get(key),mats[mat]); mesh.name=name || `detail_${++serial}`;
    mesh.position.set(...pos); mesh.rotation.set(...rot); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
  }
  function sphere(name,pos,scale,mat,parent=root) {
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),mats[mat]); mesh.name=name||`detail_${++serial}`;
    mesh.position.set(...pos); mesh.scale.set(...scale); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh);return mesh;
  }
  function cyl(name,pos,r1,r2,h,mat,parent=root,rot=[0,0,0]) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,40),mats[mat]); mesh.name=name||`detail_${++serial}`;
    mesh.position.set(...pos);mesh.rotation.set(...rot);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  const interactive=[];
  function object(name, position, build, rotation=0) {
    const g=new THREE.Group(); build(g); g.name=name;g.position.set(...position);g.rotation.y=rotation;
    g.userData={interactive:true,contentKey:name.replace('_interactive','')};root.add(g);interactive.push(g);return g;
  }
  box('foundation',[0,-.15,0],[5.2,.3,4.8],'walnut',root,.08);
  for(let i=0;i<16;i++) for(let j=0;j<3;j++) {
    box('floor_plank_'+i+'_'+j,[-2.4+i*.32,.018,-1.6+j*1.6],[.313,.05,1.586],(i+j)%3?'oak':'lilac',root,.006);
  }
  box('left_wall',[-2.56,1.5,0],[.12,3,4.8],'mulberry_wall');
  box('back_wall',[0,1.5,-2.36],[5.2,3,.12],'rose_wall');
  box('left_skirting',[-2.47,.13,0],[.05,.18,4.65],'peach');
  box('back_skirting',[0,.13,-2.27],[5,.18,.05],'peach');
  // Desk, drawer cabinet, and a readable silhouette around each device.
  box('desktop',[-1.2,.86,-1.45],[2.28,.12,.94],'oak_light',root,.035);
  box('drawer_unit',[-2.02,.43,-1.48],[.48,.75,.76],'ivory');
  for(let y of [.25,.49,.7]) {box('',[-2.02,y,-1.085],[.42,.18,.024],'paper');box('',[-2.02,y,-1.065],[.12,.018,.015],'gold');}
  for(let z of [-1.78,-1.1]) box('desk_leg',[-.2,.43,z],[.065,.78,.065],'ink');
  box('desk_mat',[-1.23,.928,-1.19],[1.22,.012,.43],'teal',root,.01);
  object('monitor_interactive',[-1.37,.94,-1.68],g=>{
    box('base',[0,.018,0],[.35,.035,.22],'ink',g);
    box('stand',[0,.2,-.02],[.065,.36,.06],'ink',g);
    box('body',[0,.48,0],[.92,.57,.07],'ink',g,.025);
    box('screen',[0,.49,.039],[.84,.48,.012],'screen',g,.007);
    sphere('',[-.27,.52,.054],[.09,.09,.005],'mint',g);
    for(let k=0;k<3;k++)box('',[.13,.59-k*.075,.054],[.29-k*.055,.019,.005],k?'teal':'paper',g,.002);
    box('',[.11,.35,.054],[.29,.06,.005],'coral',g,.004);
  });
  box('keyboard',[-1.4,.95,-1.16],[.64,.03,.2],'ivory',root,.008);
  for(let row=0;row<3;row++)for(let col=0;col<12;col++)box('',[-1.68+col*.049,.968,-1.225+row*.057],[.037,.006,.04],col===0?'coral':'paper',root,.002);
  sphere('mouse',[-.93,.957,-1.16],[.045,.022,.065],'peach');
  object('laptop_interactive',[-.47,.94,-1.4],g=>{
    box('base',[0,.02,0],[.47,.03,.31],'lilac',g,.012);
    box('keyboard',[0,.039,-.035],[.39,.006,.15],'ink',g,.003);
    box('trackpad',[0,.04,.08],[.14,.005,.07],'ivory',g,.003);
    box('lid',[0,.19,-.155],[.47,.33,.027],'lilac',g,.015,[-.12,0,0]);
    box('display',[0,.19,-.137],[.42,.275,.009],'screen',g,.005,[-.12,0,0]);
    box('album',[-.1,.2,-.11],[.13,.13,.008],'coral',g,.008);
    for(let i=0;i<4;i++)box('',[.105,.265-i*.048,-.1],[.12,.012,.008],i?'teal':'ivory',g,.002);
  },-.12);
  // Chair with a five-spoke base, armrests and upholstered gaming back.
  const chair=new THREE.Group();chair.position.set(-1.32,0,-.35);chair.rotation.y=-.2;root.add(chair);chair.name='gaming_chair';
  cyl('',[0,.31,0],.045,.055,.5,'ink',chair);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;box('',[Math.sin(a)*.16,.12,Math.cos(a)*.16],[.055,.045,.35],'ink',chair,.015,[0,a,0]);sphere('',[Math.sin(a)*.3,.09,Math.cos(a)*.3],[.06,.06,.04],'black',chair);}
  box('',[0,.54,0],[.58,.15,.55],'ink',chair,.06);
  box('',[0,.63,0],[.47,.04,.43],'lilac',chair,.015);
  box('',[0,.98,.23],[.55,.8,.14],'ink',chair,.05,[-.12,0,0]);
  box('',[0,1.02,.145],[.35,.49,.065],'lilac',chair,.035,[-.12,0,0]);
  box('',[0,1.3,.12],[.27,.1,.07],'peach',chair);
  for(let x of [-.34,.34]){box('',[x,.71,0],[.045,.28,.045],'ink',chair);box('',[x,.85,0],[.11,.055,.32],'ink',chair);}
  // Bed and stitched duvet bands.
  box('bed_frame',[1.47,.26,-1.15],[1.65,.36,2.08],'walnut',root,.055);
  box('headboard',[1.47,.68,-2.11],[1.74,1.05,.12],'teal',root,.06);
  box('mattress',[1.47,.49,-1.15],[1.59,.25,1.99],'ivory',root,.09);
  box('duvet',[1.47,.65,-.78],[1.62,.17,1.3],'teal',root,.065);
  for(let x of [1.03,1.86])box('pillow',[x,.68,-1.79],[.64,.19,.43],'paper',root,.08,[0,x===1.03?-.06:.06,0]);
  box('bed_throw',[1.47,.75,-.4],[1.64,.06,.32],'peach',root,.018);
  for(let x of [.85,1.05,1.25,1.45,1.65,1.85,2.05])box('',[x,.784,-.4],[.018,.005,.31],'gold',root,.002);
  // Photo board: individual paper silhouettes, colored placeholders and pins.
  object('wall_board_interactive',[.38,2.03,-2.255],g=>{
    box('frame',[0,0,0],[1.18,.89,.075],'oak_light',g);
    box('felt',[0,0,.042],[1.07,.78,.015],'mulberry_wall',g);
    for(let i=0;i<6;i++){
      const x=-.35+(i%3)*.35,y=.19-Math.floor(i/3)*.36;
      box('photo',[x,y,.061],[.26,.3,.016],'paper',g,.003,[0,0,(i%2?1:-1)*.06]);
      box('image',[x,y+.02,.073],[.21,.2,.007],['teal','peach','blue','lilac','mint','coral'][i],g,.002);
      sphere('pin',[x,y+.125,.093],[.018,.018,.01],'gold',g);
      sphere('photo_shape',[x-.04,y+.04,.08],[.04,.035,.004],i%2?'ivory':'gold',g);
    }
  });
  object('bookshelf_interactive',[-1.54,2.12,-2.06],g=>{
    for(let y of [-.22,.37])box('shelf',[0,y,0],[1.7,.065,.42],'oak_light',g);
    for(let i=0;i<10;i++)box('book',[-.69+i*.105,-.01,-.025],[.075,.33+(i%3)*.04,.21],['teal','peach','gold','lilac','ivory'][i%5],g,.006,[0,0,i===9?-.18:0]);
    box('storage',[.54,-.02,0],[.31,.32,.29],'mint',g);
    box('pull',[.54,-.01,.15],[.1,.025,.012],'gold',g);
    for(let i=0;i<3;i++)box('stack',[-.4,.43+i*.055,0],[.46,.045,.27],['coral','ivory','blue'][i],g,.006);
    cyl('vinyl',[.37,.61,0],.2,.2,.022,'black',g,[Math.PI/2,0,0]);
    cyl('vinyl_label',[.37,.61,.017],.068,.068,.009,'coral',g,[Math.PI/2,0,0]);
  });
  box('console',[1.54,.34,1.45],[1.62,.56,.52],'oak',root,.03);
  for(let x of [.83,2.25])for(let z of [1.28,1.64])box('console_foot',[x,.095,z],[.06,.15,.06],'ink');
  for(let x of [1.12,1.93]){box('console_door',[x,.34,1.723],[.76,.44,.025],'oak_light');cyl('handle',[x,.42,1.748],.024,.024,.02,'gold',root,[Math.PI/2,0,0]);}
  object('tv_interactive',[1.54,.63,1.41],g=>{
    for(let x of [-.45,.45])box('foot',[x,.035,0],[.1,.045,.28],'ink',g);
    box('frame',[0,.43,0],[1.41,.78,.065],'ink',g,.025);
    box('display',[0,.43,.04],[1.3,.67,.012],'screen',g,.006);
    for(let i=0;i<3;i++) {box('poster',[-.42+i*.42,.46,.051],[.34,.43,.009],['coral','teal','lilac'][i],g,.009);sphere('poster_moon',[-.46+i*.42,.53,.059],[.085,.085,.005],['gold','mint','ivory'][i],g);box('poster_band',[-.42+i*.42,.32,.06],[.22,.024,.007],'ivory',g,.002);}
  });
  object('project_folder_interactive',[-2.03,.96,-1.39],g=>{
    box('folder',[0,.025,0],[.33,.05,.39],'coral',g,.006);
    box('tab',[-.09,.023,-.205],[.14,.045,.05],'coral',g,.004);
    box('paper',[0,.055,0],[.27,.008,.33],'paper',g,.003);
    box('cover',[0,.069,.035],[.33,.018,.3],'peach',g,.006);
  },.13);
  object('pokeball_interactive',[-2.02,2.72,-2.01],g=>{
    const upper=new THREE.Mesh(new THREE.SphereGeometry(.115,16,8,0,Math.PI*2,0,Math.PI/2),mats.red);g.add(upper);
    const lower=new THREE.Mesh(new THREE.SphereGeometry(.115,16,8,0,Math.PI*2,Math.PI/2,Math.PI/2),mats.ivory);g.add(lower);
    cyl('band',[0,0,0],.117,.117,.022,'ink',g);
    cyl('button',[0,0,.112],.035,.035,.025,'ink',g,[Math.PI/2,0,0]);
    cyl('button_inner',[0,0,.128],.023,.023,.012,'ivory',g,[Math.PI/2,0,0]);
  });
  object('camera_interactive',[-.92,2.62,-2.02],g=>{
    box('body',[0,0,0],[.26,.17,.14],'ink',g,.018);
    box('top',[.02,.105,0],[.1,.045,.09],'ink',g);
    cyl('lens',[0,0,.115],.075,.075,.11,'black',g,[Math.PI/2,0,0]);
    cyl('glass',[0,0,.173],.056,.056,.01,'teal',g,[Math.PI/2,0,0]);
    box('flash',[-.082,.047,.075],[.045,.027,.008],'ivory',g,.003);
  });
  object('phone_contact_interactive',[-.13,.96,-1.12],g=>{
    box('phone',[0,0,0],[.095,.018,.19],'ink',g,.012);
    box('screen',[0,.011,0],[.079,.005,.16],'teal',g,.005);
    sphere('avatar',[0,.015,-.025],[.022,.003,.022],'paper',g);
    box('button',[0,.015,.043],[.046,.004,.018],'mint',g,.003);
  },-.2);
  function plant(pos,scale=1) {
    const g=new THREE.Group();g.position.set(...pos);g.scale.setScalar(scale);g.name='plant_'+(++serial);root.add(g);
    cyl('pot',[0,.15,0],.15,.11,.3,'peach',g);cyl('soil',[0,.298,0],.137,.137,.008,'walnut',g);
    for(let i=0;i<7;i++) {const a=i*2.4; const leaf=sphere('leaf',[Math.sin(a)*.12,.43+(i%3)*.1,Math.cos(a)*.12],[.06,.2,.085],i%2?'green':'leaf_light',g);leaf.rotation.set(Math.cos(a)*.65,0,Math.sin(a)*.65);}
  }
  plant([-2.13,.04,1.57],1.7);plant([2.15,.66,1.42],.55);plant([-2.17,.93,-1.72],.65);
  box('rug',[-.3,.061,.76],[2.53,.025,1.68],'lilac',root,.09);
  for(let z of [.08,.17,1.35,1.44])box('rug_weave',[-.3,.077,z],[2.3,.005,.017],'ivory',root,.002);
  box('side_table',[2.15,.47,-.02],[.46,.08,.47],'oak_light');
  for(let x of [2,2.3])for(let z of [-.17,.13])box('',[x,.25,z],[.035,.43,.035],'ink');
  cyl('bedside_lamp_base',[2.15,.535,-.02],.09,.09,.03,'gold');
  cyl('bedside_lamp_stem',[2.15,.7,-.02],.016,.016,.3,'gold');
  cyl('bedside_lamp_shade',[2.15,.9,-.02],.1,.18,.23,'glow');
  cyl('desk_lamp_base',[-2.15,.95,-1.01],.1,.1,.04,'gold');
  box('desk_lamp_stem',[-2.15,1.19,-1.01],[.022,.45,.025],'gold');
  cyl('desk_lamp_shade',[-2.08,1.44,-1.01],.07,.13,.14,'glow',root,[0,0,-.4]);
  for(let i=0;i<3;i++)box('sticky_note',[-.7+i*.17,1.69+(i%2)*.05,-2.277],[.13,.13,.008],['gold','mint','peach'][i],root,.003,[0,0,i*.08]);
  // A graphic mask sticker, no typography or copied logo.
  box('sticker_back',[1.52,2.22,-2.274],[.39,.49,.018],'ink',root,.025,[0,0,-.07]);
  sphere('mask',[1.52,2.23,-2.247],[.13,.175,.008],'red');
  for(let x of [1.465,1.575])box('mask_eye',[x,2.26,-2.235],[.061,.035,.012],'ivory',root,.01,[0,0,x<1.52?-.25:.25]);
  const key=new THREE.DirectionalLight('#fffdf7',2.5);key.name='neutral_key';key.position.set(1,7,5);key.target.position.set(0,0,-1);key.add(key.target);key.lookAt(0,0,0);scene.add(key);
  const fill=new THREE.PointLight('#eef4ff',14,10,2);fill.name='neutral_fill';fill.position.set(-2,3,2);scene.add(fill);
  const lamp=new THREE.PointLight('#fff3dc',1.2,3,2);lamp.name='desk_warm_light';lamp.position.set(-2.08,1.35,-.95);scene.add(lamp);
  const bedside=new THREE.PointLight('#fff3dc',1.2,3,2);bedside.name='bedside_warm_light';bedside.position.set(2.15,.88,.01);scene.add(bedside);
  const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.name='overview_camera';camera.position.set(7.7,6.8,9);camera.lookAt(0,1,0);scene.add(camera);
  scene.userData={title:'Andre Archive Room',units:'meters',upAxis:'Y',floorCenter:[0,0,0],background:'#241c32',interactiveObjects:interactive.map(m=>m.name),notes:'Add environment illumination and shadows in host renderer. Camera interactions are application logic, not GLB behavior.'};
  return {scene,root,interactive,camera};
}
