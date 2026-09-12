// Generate catalog covers from the exact production rig/compiler. No stock or
// AI artwork: every frame is the same skeletal motion the timeline evaluates.
import fs from "node:fs/promises";
import path from "node:path";
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??"playwright");
const browser=await chromium.launch({headless:true});
const output=path.resolve("public/assets/actions");
try{
  const page=await browser.newPage();await page.goto("http://localhost:3000");
  await page.evaluate(async()=>{
    await import("/app/studio-editor.tsx");
    const T=await import("/node_modules/.vite/deps/three.js"),{GLTFLoader}=await import("/node_modules/.vite/deps/three_examples_jsm_loaders_GLTFLoader__js.js");
    const {scene:model}=await new GLTFLoader().loadAsync("/assets/humanoid/Superhero_Male_FullBody.gltf");
    const b=new T.Box3().setFromObject(model),s=3.45/b.getSize(new T.Vector3()).y,c=b.getCenter(new T.Vector3());
    model.scale.setScalar(s);model.position.set(-c.x*s,-b.min.y*s,-c.z*s);model.updateMatrixWorld(true);
    globalThis.coverModel=model;await globalThis.__POSEBOARD_ENGINE_DEBUG__.loadActionSources();
    const {actionPresets}=await import("/app/motion-authoring.ts"),{authoredInteractions}=await import("/app/interaction-authoring.ts");
    globalThis.coverActions=[...actionPresets,...authoredInteractions].filter(a=>a.release==="ready");
  });
  await fs.mkdir(output,{recursive:true});const manifest={};
  const ids=await page.evaluate(()=>globalThis.coverActions.map(a=>a.id));
  for(const ratio of ["16:9","9:16"]){
    manifest[ratio]={};
    for(const id of ids){
      const frames=await page.evaluate(({id,ratio})=>globalThis.__POSEBOARD_ENGINE_DEBUG__.renderActionCovers(globalThis.coverModel,globalThis.coverActions.find(a=>a.id===id),ratio,12),{id,ratio});
      manifest[ratio][id]=[];
      for(let i=0;i<frames.length;i++){
        const file=`${id}-${ratio.replace(":","x")}-${i}.jpg`;
        await fs.writeFile(path.join(output,file),Buffer.from(frames[i].split(",")[1],"base64"));
        manifest[ratio][id].push(`/assets/actions/${file}`);
      }
    }
  }
  await fs.writeFile(path.join(output,"covers.json"),JSON.stringify(manifest));
  console.log(`Rendered ${ids.length} real actions × 2 compositions × 12 frames`);
}finally{await browser.close();}
