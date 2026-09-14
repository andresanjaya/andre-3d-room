import fs from 'node:fs/promises';
import validator from 'gltf-validator';
const data=await fs.readFile(new URL('./andre-archive-room.glb',import.meta.url));
const report=await validator.validateBytes(new Uint8Array(data));
console.log(JSON.stringify({errors:report.issues.numErrors,warnings:report.issues.numWarnings,info:report.issues.numInfos},null,2));
if(report.issues.numErrors||report.issues.numWarnings)process.exitCode=1;
