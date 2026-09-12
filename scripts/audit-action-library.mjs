import fs from "node:fs/promises";
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??"playwright");
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  await page.goto("http://localhost:3000");
  const report=await page.evaluate(async()=>{
    const THREE=await import("/node_modules/.vite/deps/three.js");
    await import("/app/studio-editor.tsx");
    const {GLTFLoader}=await import("/node_modules/.vite/deps/three_examples_jsm_loaders_GLTFLoader__js.js");
    const {actionPresets,interactionProduction}=await import("/app/motion-authoring.ts");
    const {authoredInteractions}=await import("/app/interaction-authoring.ts");
    const {authoredPoseExpansion}=await import("/app/action-authoring.ts");
    const {compactActionClip}=await import("/app/action-runtime.ts");
    const {evaluateAnimationShot,normalizeAnimationTimeline}=await import("/app/animation-timeline.ts");
    const engine=globalThis.__POSEBOARD_ENGINE_DEBUG__;
    const {bakeActionClip,bakeInteractionClip}=engine;await engine.loadActionSources();
    const {scene:model}=await new GLTFLoader().loadAsync("/assets/humanoid/Superhero_Male_FullBody.gltf");
    const b=new THREE.Box3().setFromObject(model),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),fit=3.45/s.y;
    model.scale.setScalar(fit);model.position.set(-c.x*fit,-b.min.y*fit,-c.z*fit);model.updateMatrixWorld(true);
    const report={counts:{pose:authoredPoseExpansion.length,motion:actionPresets.length,interaction:interactionProduction.length},errors:[],clips:[],covers:{}};
    for(const action of actionPresets){
      try{
        const adapter=engine.createActionRigAdapter(model),clip=bakeActionClip(action,"actor-test",adapter,[0,0,0],[0,0,0],100);
        const frames=clip.tracks.find(t=>t.kind==="pose").keyframes,distinct=new Set(frames.map(f=>JSON.stringify(f.bones))).size;
        if(distinct<3)report.errors.push(action.id+": fewer than 3 body states");
        if(frames.some(f=>!Object.values(f.bones).flat().every(Number.isFinite)))report.errors.push(action.id+": invalid bone data");
        const restored=normalizeAnimationTimeline({shots:[clip]},[{id:clip.shotId,duration:clip.duration}],24).shots[0];
        const compact=compactActionClip(clip);
        for(const t of [0,.217,.58,.91,1].map(f=>f*action.duration)){
          const before=evaluateAnimationShot(clip,t,"actor-test"),after=evaluateAnimationShot(compact,t,"actor-test");
          if(Object.entries(before.pose.bones).some(([name,q])=>q.some((v,i)=>Math.abs(v-after.pose.bones[name][i])>1e-10)))report.errors.push(action.id+": compressed pose drift");
        }
        if(!restored.tracks.some(t=>t.targetId==="actor-test"))report.errors.push(action.id+": lost actor binding");
        if(evaluateAnimationShot(clip,.5,"other").pose)report.errors.push(action.id+": cross actor mutation");
        if(action.sourceClip&&action.gait&&action.loop){
          for(const [bone,phase] of [["LeftFoot",0],["RightFoot",.5]]){
            const points=[.025,.075,.125].map(f=>{const v=evaluateAnimationShot(clip,(phase+f)/(action.sourceCycles??1)*action.duration,"actor-test");adapter.refine(v.pose);return adapter.point(bone).map((p,i)=>p+v.root.position[i]);});
            const drift=Math.max(...points.map(p=>Math.hypot(...p.map((v,i)=>v-points[0][i]))));
            if(drift>.12)report.errors.push(action.id+": stance drift "+drift.toFixed(3));
          }
        }
        report.clips.push({id:action.id,frames:frames.length,distinct,bytes:JSON.stringify(compact).length});
        if(action.release==="ready"||action.sourceClip||["action-walk-stop","action-run-stop"].includes(action.id))report.covers[action.id]=engine.renderActionCovers(model,action,"16:9");
      }catch(error){report.errors.push(action.id+": "+error.message);}
    }
    for(const action of authoredInteractions){
      const clip=bakeInteractionClip(action,[{id:"a",adapter:engine.createActionRigAdapter(model)},{id:"b",adapter:engine.createActionRigAdapter(model)}]);
      const compact=compactActionClip(clip),restored=normalizeAnimationTimeline({shots:[compact]},[{id:clip.shotId,duration:clip.duration}],24).shots[0];
      if(!restored.tracks.some(t=>t.targetId==="a")||!restored.tracks.some(t=>t.targetId==="b"))report.errors.push(action.id+": lost partner");
      for(const t of [0,.1,.25,.45,.5,.6,.75,.9,1].map(f=>f*action.duration))for(const id of ["a","b"]){const pose=evaluateAnimationShot(restored,t,id).pose;if(!pose||!Object.values(pose.bones).flat().every(Number.isFinite))report.errors.push(action.id+": invalid partner frame");}
      report.covers[action.id]=engine.renderActionCovers(model,action,"16:9");
    }
    return report;
  });
  const cards=Object.entries(report.covers).map(([id,frames])=>'<section><h3>'+id+'</h3>'+frames.map(src=>'<img src="'+src+'" width="480">').join("")+'</section>').join("");
  await page.setContent('<body style="background:#fff;font:16px sans-serif">'+cards+'</body>');
  await page.screenshot({path:"/private/tmp/poseboard-action-audit.png",fullPage:true});
  for(const id of ["action-sit","action-walk","action-jog","action-stand-chair","action-walk-stop","action-run-stop","action-look-behind","interaction-1-1","interaction-1-2","interaction-1-3","interaction-1-4","interaction-2-1","interaction-3-2","interaction-4-2"]){await page.locator("section").filter({has:page.getByRole("heading",{name:id,exact:true})}).screenshot({path:`/private/tmp/${id}-review.png`});}
  delete report.covers;await fs.writeFile("/private/tmp/poseboard-action-audit.json",JSON.stringify(report,null,2));
  console.log(JSON.stringify({counts:report.counts,errors:report.errors,clips:report.clips.length,maxBytes:Math.max(...report.clips.map(c=>c.bytes))}));
  if(report.errors.length)process.exitCode=1;
}finally{await browser.close();}
