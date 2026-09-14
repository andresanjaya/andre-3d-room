import fs from 'node:fs/promises';
import validator from 'gltf-validator';
const data=await fs.readFile(new URL('./andre-archive-room-refined.glb',import.meta.url));
const report=await validator.validateBytes(new Uint8Array(data));
await fs.writeFile(new URL('./validation.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({errors:report.issues.numErrors,warnings:report.issues.numWarnings,info:report.issues.numInfos,bytes:data.length,statistics:report.info},null,2));
if(report.issues.numErrors||report.issues.numWarnings)process.exitCode=1;
