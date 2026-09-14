import fs from 'node:fs/promises';
const data=await fs.readFile(new URL('./andre-archive-room-refined.glb',import.meta.url));
const doc=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
const expected=['monitor_interactive','laptop_interactive','wall_board_interactive','tv_interactive','bookshelf_interactive','project_folder_interactive','pokeball_interactive','camera_interactive','phone_contact_interactive','lamp_interactive','bedside_lamp_interactive'];
const names=doc.nodes.map(n=>n.name);
for(const name of [...expected,'monitor_screen_anchor','laptop_screen_anchor','board_surface_anchor',...Array.from({length:6},(_,i)=>`board_photo_0${i+1}`)]){
  if(names.filter(n=>n===name).length!==1)throw Error(`Missing or duplicate named target: ${name}`);
}
console.log(JSON.stringify({interactiveParents:expected,textureImages:doc.images.length,screenAnchors:3,boardPhotoSlots:6,bytes:data.length},null,2));
