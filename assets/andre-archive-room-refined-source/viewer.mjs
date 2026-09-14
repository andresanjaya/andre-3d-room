import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutlinePass} from 'three/addons/postprocessing/OutlinePass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {interactionConfig} from './interaction-config.mjs';

const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#211d2b');scene.add(new T.HemisphereLight('#f5f7f5','#a4a298',.8));
const pmrem=new T.PMREMGenerator(renderer);const env=new RoomEnvironment();scene.environment=pmrem.fromScene(env,.04).texture;scene.environmentIntensity=.32;env.dispose();pmrem.dispose();
const camera=new T.PerspectiveCamera(36,1,.05,100);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI/2-.07;controls.minDistance=3;controls.maxDistance=30;
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const ao=new SSAOPass(scene,camera,innerWidth,innerHeight);ao.kernelRadius=12;ao.minDistance=.003;ao.maxDistance=.11;composer.addPass(ao);
const outline=new OutlinePass(new T.Vector2(innerWidth,innerHeight),scene,camera);outline.edgeStrength=2.5;outline.edgeGlow=.5;outline.edgeThickness=1;outline.visibleEdgeColor.set('#d2e9d8');outline.hiddenEdgeColor.set('#000000');composer.addPass(outline);composer.addPass(new OutputPass());const fxaa=new ShaderPass(FXAAShader);composer.addPass(fxaa);
let model,selected=null,state='loading',saved=null,tween=null;const back=document.querySelector('#back'),status=document.querySelector('#status');
const roomTarget=new T.Vector3(0,1.3,0),homeDirection=new T.Vector3(7.7,5.8,9).normalize();
function fitBox(bounds,target,direction,margin=1.12){const right=new T.Vector3().crossVectors(camera.up,direction).normalize(),up=new T.Vector3().crossVectors(direction,right).normalize(),tan=Math.tan(T.MathUtils.degToRad(camera.fov/2));let d=0;for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const v=new T.Vector3(x,y,z).sub(target);d=Math.max(d,v.dot(direction)+margin*Math.max(Math.abs(v.dot(right))/(tan*camera.aspect),Math.abs(v.dot(up))/tan));}return target.clone().addScaledVector(direction,d+.1);}
function home(){const bounds=new T.Box3().setFromObject(model.getObjectByName('room'));camera.position.copy(fitBox(bounds,roomTarget,homeDirection));controls.target.copy(roomTarget);camera.lookAt(roomTarget);controls.update();}
function resize(){renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);fxaa.uniforms.resolution.value.set(1/(innerWidth*renderer.getPixelRatio()),1/(innerHeight*renderer.getPixelRatio()));camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(model&&state==='room')home();else if(selected&&state==='focused')focus(selected,false);}
addEventListener('resize',resize);resize();
function transition(position,target,next){controls.enabled=false;outline.selectedObjects=[];tween={from:camera.position.clone(),fromTarget:controls.target.clone(),position,target,next,start:performance.now(),duration:matchMedia('(prefers-reduced-motion: reduce)').matches?50:1050};state=next==='room'?'returning':'focusing';}
function focus(o,remember=true){const cfg=interactionConfig[o.name];if(remember&&!saved)saved={position:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom};selected=o;const anchor=cfg.anchor&&o.getObjectByName(cfg.anchor);const bounds=new T.Box3().setFromObject(o);const target=anchor?anchor.getWorldPosition(new T.Vector3()):bounds.getCenter(new T.Vector3());const direction=new T.Vector3(...(cfg.direction||[0,.06,1])).applyQuaternion(o.getWorldQuaternion(new T.Quaternion())).normalize();let dest;if(cfg.size){const dist=Math.max(cfg.size[1],cfg.size[0]/camera.aspect)/2/Math.tan(T.MathUtils.degToRad(camera.fov/2))*1.15;dest=target.clone().addScaledVector(direction,dist);}else dest=fitBox(bounds,target,direction,1.2);transition(dest,target,'focused');back.hidden=false;window.lastSelected=o.name;}
function reset(){if(!saved)return;const s=saved;camera.zoom=s.zoom;camera.updateProjectionMatrix();transition(s.position.clone(),s.target.clone(),'room');}
back.onclick=reset;addEventListener('keydown',e=>{if(e.key==='Escape')reset();});
const ray=new T.Raycaster(),mouse=new T.Vector2();let start=null,dragged=false,pointerCount=0;
function hit(e){if(!model)return null;mouse.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(mouse,camera);let o=ray.intersectObject(model,true)[0]?.object;while(o){if(interactionConfig[o.name])return o;o=o.parent;}return null;}
renderer.domElement.addEventListener('pointerdown',e=>{pointerCount++;if(pointerCount>1)dragged=true;else{start={x:e.clientX,y:e.clientY};dragged=false;}});
renderer.domElement.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>5)dragged=true;const o=state==='room'||state==='focused'?hit(e):null;renderer.domElement.style.cursor=o?'pointer':'grab';outline.selectedObjects=o?[o]:[];});
function toggle(o){const cfg=interactionConfig[o.name];const l=model.getObjectByName(cfg.light);if(!l)return;const on=l.intensity>0;l.intensity=on?0:(l.userData.baseIntensity||.38);o.traverse(m=>{if(m.isMesh&&m.material.emissive){if(m.userData.onEmissive===undefined)m.userData.onEmissive=m.material.emissiveIntensity;m.material.emissiveIntensity=on?0:m.userData.onEmissive;}});o.userData.isOn=!on;}
renderer.domElement.addEventListener('pointerup',e=>{pointerCount=Math.max(0,pointerCount-1);if(!start||dragged||!['room','focused'].includes(state)){if(!pointerCount)start=null;return;}const o=hit(e);start=null;if(!o)return;if(interactionConfig[o.name].type==='toggle')toggle(o);else if(o===selected)reset();else focus(o);});
renderer.domElement.addEventListener('pointercancel',()=>{pointerCount=0;start=null;dragged=true;});
try{
  const gltf=await new GLTFLoader().loadAsync('./andre-archive-room-refined.glb');model=gltf.scene;scene.add(model);
  model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.map)m.map.anisotropy=renderer.capabilities.getMaxAnisotropy();}if(o.isDirectionalLight){o.castShadow=true;o.shadow.mapSize.set(2048,2048);Object.assign(o.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:20});o.shadow.bias=-.00015;o.shadow.normalBias=.025;o.shadow.radius=3;}});
  state='room';home();status.hidden=true;window.roomReady=true;
}catch(e){status.textContent='Unable to load room. Run the supplied local server and reload.';console.error(e);}
renderer.setAnimationLoop(()=>{if(tween){const t=Math.min(1,(performance.now()-tween.start)/tween.duration),k=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.position,k);controls.target.lerpVectors(tween.fromTarget,tween.target,k);camera.lookAt(controls.target);if(t===1){state=tween.next;tween=null;if(state==='room'){selected=null;saved=null;back.hidden=true;controls.enabled=true;controls.update();}}}else if(controls.enabled)controls.update();composer.render();});
window.roomDebug={get state(){return state;},get snapshot(){return {position:camera.position.toArray(),target:controls.target.toArray()};},project(name){const o=model.getObjectByName(name);const v=new T.Box3().setFromObject(o).getCenter(new T.Vector3()).project(camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};},get bounds(){const b=new T.Box3().setFromObject(model.getObjectByName('room'));const pts=[];for(let x of [b.min.x,b.max.x])for(let y of [b.min.y,b.max.y])for(let z of [b.min.z,b.max.z]){const v=new T.Vector3(x,y,z).project(camera);pts.push([v.x,v.y]);}return pts;},focus(name){focus(model.getObjectByName(name));},light(name){return model.getObjectByName(name).intensity;}};
