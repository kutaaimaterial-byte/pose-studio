import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync,statSync} from "node:fs";
import {authoredPoseExpansion} from "../app/action-authoring";
import {actionPresets,interactionProduction} from "../app/motion-authoring";
import {authoredInteractions} from "../app/interaction-authoring";
import {poseItems} from "../app/pose-data";

test("requested counts are production targets, not a claim that every draft is usable",()=>{
  assert.equal(authoredPoseExpansion.length,88);
  assert.equal(actionPresets.length,48);
  assert.equal(interactionProduction.length,24);
  assert.equal(authoredPoseExpansion.filter(p=>p.release==="ready").length,10);
  assert.equal(actionPresets.filter(p=>p.release==="ready").length,21);
  assert.equal(authoredInteractions.filter(p=>p.release==="ready").length,3);
  for(const pose of authoredPoseExpansion){
    const card=poseItems.find(p=>p.id===pose.id)!;
    assert.equal(card.status==="ready",pose.release==="ready");
    if(pose.release==="ready")assert.equal(pose.supports.length,0,"unsupported prop-dependent static drafts stay gated");
  }
  for(const rows of [authoredPoseExpansion,actionPresets,interactionProduction]){
    assert.equal(new Set(rows.map(p=>p.id)).size,rows.length);
    assert.equal(new Set(rows.map(p=>p.name)).size,rows.length);
  }
});
test("every offered action has real, separate portrait and landscape frame assets",()=>{
  const manifest=JSON.parse(readFileSync("public/assets/actions/covers.json","utf8"));
  const ready=[...actionPresets,...authoredInteractions].filter(a=>a.release==="ready");
  for(const ratio of ["16:9","9:16"]){
    assert.deepEqual(Object.keys(manifest[ratio]).sort(),ready.map(a=>a.id).sort());
    for(const action of ready){
      const frames:string[]=manifest[ratio][action.id];assert.equal(frames.length,12);
      for(const file of frames)assert.ok(statSync(`public${file}`).size>1000);
    }
  }
  for(const action of ready)assert.notEqual(manifest["16:9"][action.id][0],manifest["9:16"][action.id][0]);
});
