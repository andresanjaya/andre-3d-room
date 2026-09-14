import fs from 'node:fs/promises';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createRoom} from './room.mjs';
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:'+blob.type+';base64,'+Buffer.from(b).toString('base64');this.onloadend?.();});}};
const {scene,interactive}=createRoom();
const glb=await new GLTFExporter().parseAsync(scene,{binary:true});
await fs.writeFile(new URL('./andre-archive-room.glb',import.meta.url),Buffer.from(glb));
let triangles=0;scene.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
const jsonLength=new DataView(glb).getUint32(12,true);
const json=JSON.parse(new TextDecoder().decode(new Uint8Array(glb,20,jsonLength)));
for(const mesh of interactive){if(!json.nodes.some(n=>n.name===mesh.name&&n.mesh!==undefined))throw Error('Missing interactive mesh '+mesh.name);}
console.log(JSON.stringify({bytes:glb.byteLength,triangles,meshes:json.meshes.length,interactive:interactive.map(x=>x.name)},null,2));
