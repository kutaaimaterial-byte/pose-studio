// Offline asset conversion. The source is the author's CC0 Standard release;
// no executable content from the downloaded archive is loaded.
import fs from "node:fs/promises";
import * as THREE from "three";
const [sourcePath,outputPath]=process.argv.slice(2);
if(!sourcePath||!outputPath)throw new Error("Provide the Standard GLB and output JSON paths");
const bytes=await fs.readFile(sourcePath),jsonLength=bytes.readUInt32LE(12);
const source=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
const binary=bytes.subarray(28+jsonLength);
const target=JSON.parse(await fs.readFile(new URL("../public/assets/humanoid/Superhero_Male_FullBody.gltf",import.meta.url)));
function hierarchy(data){
  const nodes=data.nodes.map(n=>{const o=new THREE.Object3D();o.name=n.name??"";if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);return o;});
  data.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>nodes[i].add(nodes[c])));
  const root=new THREE.Group();data.scenes[data.scene??0].nodes.forEach(i=>root.add(nodes[i]));root.updateMatrixWorld(true);
  return {root,nodes,byName:new Map(nodes.map(n=>[n.name,n]))};
}
const src=hierarchy(source),dst=hierarchy(target);
const names={pelvis:"DEF-hips",spine_01:"DEF-spine.001",spine_02:"DEF-spine.002",spine_03:"DEF-spine.003",neck_01:"DEF-neck",Head:"DEF-head"};
for(const [side,suffix] of [["l","L"],["r","R"]]){
  for(const [to,from] of Object.entries({clavicle:"shoulder",upperarm:"upper_arm",lowerarm:"forearm",hand:"hand",thigh:"thigh",calf:"shin",foot:"foot",ball:"toe"}))names[`${to}_${side}`]=`DEF-${from}.${suffix}`;
  for(const finger of ["index","middle","ring","pinky","thumb"])for(let i=1;i<=3;i++)names[`${finger}_0${i}_${side}`]=`DEF-${finger==="thumb"?"thumb":`f_${finger}`}.0${i}.${suffix}`;
}
const channels=Object.entries(names).map(([to,from])=>({to:dst.byName.get(to),from:src.byName.get(from)}));
if(channels.some(c=>!c.to||!c.from))throw new Error("Unmapped skeleton channel");
const ordered=[];dst.root.traverse(node=>{const channel=channels.find(c=>c.to===node);if(channel)ordered.push(channel);});
const srcRest=new Map(channels.map(c=>[c.from,c.from.getWorldQuaternion(new THREE.Quaternion())]));
const dstRest=new Map(channels.map(c=>[c.to,c.to.getWorldQuaternion(new THREE.Quaternion())]));
const srcHip=src.byName.get("DEF-hips"),dstHip=dst.byName.get("pelvis");
const srcHipRest=srcHip.getWorldPosition(new THREE.Vector3()),dstHipRest=dstHip.getWorldPosition(new THREE.Vector3());
const ratio=dstHipRest.y/srcHipRest.y;
function accessor(index){const a=source.accessors[index],view=source.bufferViews[a.bufferView],size={SCALAR:1,VEC3:3,VEC4:4}[a.type];if(a.componentType!==5126||!size)throw new Error("Unexpected animation accessor");const offset=(view.byteOffset??0)+(a.byteOffset??0);return Float32Array.from({length:a.count*size},(_,i)=>binary.readFloatLE(offset+i*4));}
const selected=["Idle_Loop","Idle_Talking_Loop","Walk_Loop","Walk_Formal_Loop","Jog_Fwd_Loop","Sprint_Loop","Sitting_Enter","Sitting_Exit","Sitting_Idle_Loop","Jump_Start","Jump_Loop","Jump_Land","Punch_Jab"];
const output={schema:1,author:"Quaternius",license:"CC0-1.0",source:"https://opengameart.org/content/universal-animation-library",clips:{}};
for(const name of selected){
  const animation=source.animations.find(a=>a.name===name);if(!animation)throw new Error(name);
  const tracks=animation.channels.map(c=>{const s=animation.samplers[c.sampler],times=accessor(s.input),values=accessor(s.output),node=src.nodes[c.target.node];const property={translation:"position",rotation:"quaternion",scale:"scale"}[c.target.path];return c.target.path==="rotation"?new THREE.QuaternionKeyframeTrack(`${node.uuid}.${property}`,times,values):new THREE.VectorKeyframeTrack(`${node.uuid}.${property}`,times,values);});
  const clip=new THREE.AnimationClip(name,-1,tracks),mixer=new THREE.AnimationMixer(src.root),action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
  const frames=[];const count=Math.ceil(clip.duration*30);
  for(let i=0;i<=count;i++){
    const time=Math.min(clip.duration,i/30);mixer.setTime(time);src.root.updateMatrixWorld(true);
    for(const c of ordered){
      const desired=c.from.getWorldQuaternion(new THREE.Quaternion()).multiply(srcRest.get(c.from).clone().invert()).multiply(dstRest.get(c.to));
      const parent=c.to.parent.getWorldQuaternion(new THREE.Quaternion()).invert();c.to.quaternion.copy(parent.multiply(desired));
      if(c.to===dstHip){const p=srcHip.getWorldPosition(new THREE.Vector3()).sub(srcHipRest).multiplyScalar(ratio).add(dstHipRest);c.to.position.copy(c.to.parent.worldToLocal(p));}
      c.to.updateMatrixWorld(true);
    }
    const round=a=>a.map(n=>Number(n.toFixed(7)));
    frames.push({time:Number(time.toFixed(7)),bones:Object.fromEntries(ordered.map(c=>[c.to.name,round(c.to.quaternion.toArray())])),bonePositions:{pelvis:round(dstHip.position.toArray())}});
  }
  output.clips[name]={duration:clip.duration,frames};mixer.stopAllAction();mixer.uncacheRoot(src.root);
}
await fs.mkdir(new URL("../public/assets/motions/",import.meta.url),{recursive:true});
await fs.writeFile(outputPath,JSON.stringify(output));
await fs.writeFile(new URL("../public/assets/motions/hand-shapes.json",import.meta.url),JSON.stringify(Object.fromEntries(Object.entries(output.clips.Punch_Jab.frames[12].bones).filter(([name])=>/^(index|middle|ring|pinky|thumb)_/.test(name)))));
console.log("Retargeted",Object.keys(output.clips).length,"licensed source clips;",(JSON.stringify(output).length/1024/1024).toFixed(2),"MB");
