const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??"playwright");
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.goto("http://localhost:3000");
  const cards=await page.evaluate(async()=>{
    const THREE=await import("/node_modules/.vite/deps/three.js");await import("/app/studio-editor.tsx");
    const {GLTFLoader}=await import("/node_modules/.vite/deps/three_examples_jsm_loaders_GLTFLoader__js.js");
    const {authoredPoseExpansion}=await import("/app/action-authoring.ts");
    const {scene:model}=await new GLTFLoader().loadAsync("/assets/humanoid/Superhero_Male_FullBody.gltf");
    const b=new THREE.Box3().setFromObject(model),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),fit=3.45/size.y;
    model.scale.setScalar(fit);model.position.set(-center.x*fit,-b.min.y*fit,-center.z*fit);model.updateMatrixWorld(true);
    const engine=globalThis.__POSEBOARD_ENGINE_DEBUG__;
    return authoredPoseExpansion.filter(p=>!p.supports.length).map(p=>({id:p.id,name:p.name,category:p.category,src:engine.renderActionCovers(model,{id:p.id,name:p.name,group:p.category,kind:"motion",duration:1,loop:false,release:"review",framing:"full",plantFeet:false,props:[],phases:[{at:0,pose:p.name},{at:1,pose:p.name}]},"9:16")[0]}));
  });
  for(let i=0;i<cards.length;i+=8){const items=cards.slice(i,i+8);await page.setContent('<body style="font:16px sans-serif;background:#fff;display:grid;grid-template-columns:repeat(4,1fr);gap:12px">'+items.map(c=>`<section><h3>${c.name}</h3><img src="${c.src}" width="220"></section>`).join("")+'</body>');await page.screenshot({path:`/private/tmp/poseboard-static-review-${i/8}.png`,fullPage:true});}
  console.log(cards.map(c=>`${c.id}: ${c.name}`).join("\n"));
}finally{await browser.close();}
