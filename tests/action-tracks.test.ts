import assert from "node:assert/strict";
import test from "node:test";
import {evaluateAnimationShot,normalizeAnimationTimeline,type AnimationShot} from "../app/animation-timeline";
import {cloneInstance} from "../app/project-store";

const clip:AnimationShot={id:"anim-test",shotId:"shot-test",actionId:"interaction-test",sourceDuration:2,duration:6,speed:1,loop:true,motionId:null,cameraMotionId:null,tracks:[
  {id:"pose-a",targetId:"actor-a",kind:"pose",name:"A",enabled:true,restPose:{bones:{finger:[0,0,0,1]},bonePositions:{hip:[0,1,0]}},keyframes:[{id:"a0",time:0,poseId:"pose",poseIndex:0,interpolation:"linear",bones:{arm:[0,0,0,1]}},{id:"a1",time:2,poseId:"pose",poseIndex:0,interpolation:"linear",bones:{arm:[0,0,1,0],finger:[0,0,1,0]}}]},
  {id:"root-a",targetId:"actor-a",kind:"root",name:"A move",enabled:true,keyframes:[{id:"r0",time:0,interpolation:"linear",position:[0,0,0],rotation:[0,0,0],scale:100},{id:"r1",time:2,interpolation:"linear",position:[0,0,3],rotation:[0,0,0],scale:100}]},
  {id:"pose-b",targetId:"actor-b",kind:"pose",name:"B",enabled:true,keyframes:[{id:"b0",time:0,poseId:"pose",poseIndex:0,interpolation:"linear",bones:{arm:[0,1,0,0]}}]},
  {id:"camera",kind:"camera",name:"Camera",enabled:true,keyframes:[{id:"c0",time:0,interpolation:"linear",position:[0,2,8],target:[0,1,0],focalLength:50}]},
]};
test("actor-bound tracks never leak into another actor or the camera-only evaluation",()=>{
  assert.deepEqual(evaluateAnimationShot(clip,1,"actor-b").pose?.bones.arm,[0,1,0,0]);
  assert.equal(evaluateAnimationShot(clip,1,"other").pose,undefined);
  assert.equal(evaluateAnimationShot(clip,1).pose,undefined);
  assert.equal(evaluateAnimationShot(clip,1).camera?.focalLength,50);
});
test("compact constant channels interpolate into explicit advanced edits",()=>{
  const pose=evaluateAnimationShot(clip,1,"actor-a").pose!;
  assert.ok(Math.abs(pose.bones.finger[2]-Math.SQRT1_2)<1e-5);
  assert.deepEqual(pose.bonePositions?.hip,[0,1,0]);
});
test("looped locomotion continues across the seam without resetting the actor root",()=>{
  assert.deepEqual(evaluateAnimationShot(clip,2,"actor-a").root?.position,[0,0,3]);
  assert.deepEqual(evaluateAnimationShot(clip,4,"actor-a").root?.position,[0,0,6]);
  const before=evaluateAnimationShot(clip,1.999,"actor-a").root!.position[2];
  const after=evaluateAnimationShot(clip,2.001,"actor-a").root!.position[2];
  assert.ok(after-before<.01&&after>before);
});
test("once-only actions hold their final state when the shot is longer",()=>{
  const once={...clip,loop:false};
  assert.deepEqual(evaluateAnimationShot(once,5,"actor-a").pose,evaluateAnimationShot(once,2,"actor-a").pose);
  assert.deepEqual(evaluateAnimationShot(once,5,"actor-a").root?.position,[0,0,3]);
});
test("source loops and motion speed do not wrap or truncate the camera track",()=>{
  const camera:AnimationShot={...clip,speed:2,tracks:[{id:"c",kind:"camera",name:"camera",enabled:true,keyframes:[{id:"c0",time:0,interpolation:"linear",position:[0,2,8],target:[0,1,0],focalLength:50},{id:"c1",time:6,interpolation:"linear",position:[6,2,8],target:[0,1,0],focalLength:50}]}]};
  assert.deepEqual(evaluateAnimationShot(camera,6).camera?.position,[3,2,8]);
  const shorter={...clip,loop:false,duration:1,speed:2};
  assert.deepEqual(evaluateAnimationShot(shorter,2,"actor-a").root?.position,[0,0,3]);
});
test("save/load preserves both performers, props and compact constants",()=>{
  const restored=normalizeAnimationTimeline(JSON.parse(JSON.stringify({shots:[clip]})),[{id:"shot-test",duration:6}]).shots[0];
  assert.equal(restored.tracks.filter(t=>t.kind==="pose").length,2);
  assert.deepEqual(evaluateAnimationShot(restored,1,"actor-a"),evaluateAnimationShot(clip,1,"actor-a"));
});
test("a copied project rewrites actor and prop references without changing action identity",()=>{
  const original={models:[{id:"actor-a"},{id:"actor-b"}],props:[{id:"prop-a",actorId:"actor-a"}],clip:{...clip,tracks:[...clip.tracks,{id:"prop-track",targetId:"prop-a",kind:"root"}]}};
  const copied=cloneInstance(original);
  assert.notEqual(copied.models[0].id,original.models[0].id);
  assert.equal(copied.clip.tracks[0].targetId,copied.models[0].id);
  assert.equal(copied.props[0].actorId,copied.models[0].id);
  assert.equal(copied.clip.tracks.at(-1)?.targetId,copied.props[0].id);
  assert.equal(copied.clip.actionId,clip.actionId);
});
