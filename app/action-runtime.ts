import { evaluateAnimationShot, type AnimationShot, type PoseAnimationKeyframe, type RootAnimationKeyframe, type EvaluatedAnimation } from "./animation-timeline";
import type { ActionPreset } from "./motion-authoring";
import type { JointEdits, Triple } from "./action-authoring";
import {sourceActionDuration} from "./action-source";
import {shapeActionHand} from "./hand-shapes";

export type RigSample = Pick<PoseAnimationKeyframe,"bones" | "bonePositions" | "rigPosition">;
export type FootTargets = { left: Triple; right: Triple };
export const actionPropId=(action:ActionPreset,actorId:string)=>`action-prop-${action.id}-${actorId}`;
export function sampleActionProp(action:ActionPreset,fraction:number):Triple {
  const path=action.sharedProp?.path;if(!path?.length)return [0,0,0];
  let before=path[0],after=path.at(-1)!;
  for(const point of path){if(point.at<=fraction)before=point;if(point.at>=fraction){after=point;break;}}
  const u=after.at===before.at?0:Math.max(0,Math.min(1,(fraction-before.at)/(after.at-before.at))),t=u*u*(3-2*u);
  return before.position.map((v,i)=>v+(after.position[i]-v)*t) as Triple;
}
export type ActionRigAdapter = {
  sample: (name: string, edits?: JointEdits) => RigSample;
  refine: (value: NonNullable<EvaluatedAnimation["pose"]>, feet?: FootTargets, hands?: Partial<FootTargets>, directions?:Partial<Record<"left"|"right",{direction:Triple;weight:number}>>) => RigSample;
  feet: FootTargets;
  hands: FootTargets;
  point: (bone:string) => Triple;
  poseIndex: (name: string) => number;
  source: (name:string,time:number) => RigSample;
  nudge: (pose:RigSample,joints:JointEdits)=>RigSample;
};

/** Store constant channels once, without changing any sampled animation value. */
export function compactActionClip(clip: AnimationShot): AnimationShot {
  return {...clip,tracks:clip.tracks.map(track=>{
    if(track.kind!=="pose"||!track.keyframes.length)return track;
    const first=track.keyframes[0];
    const same=(a:number[]|undefined,b:number[]|undefined)=>!!a&&!!b&&a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<1e-10);
    const fixedBones=Object.fromEntries(Object.entries(first.bones).filter(([name,q])=>track.keyframes.every(frame=>same(q,frame.bones[name]))));
    const fixedPositions=Object.fromEntries(Object.entries(first.bonePositions??{}).filter(([name,p])=>track.keyframes.every(frame=>same(p,frame.bonePositions?.[name]))));
    return {
      ...track,
      restPose:{bones:{...track.restPose?.bones,...fixedBones},bonePositions:{...track.restPose?.bonePositions,...fixedPositions}},
      keyframes:track.keyframes.map(frame=>({
        ...frame,
        bones:Object.fromEntries(Object.entries(frame.bones).filter(([name])=>!fixedBones[name])),
        bonePositions:Object.fromEntries(Object.entries(frame.bonePositions??{}).filter(([name])=>!fixedPositions[name])),
      })),
    };
  })};
}

/** Bake once into the existing pose/root tracks. Preview, scrub and export all
 * consume evaluateAnimationShot; no second animation clock or rig is persisted. */
export function bakeActionClip(action: ActionPreset, targetId: string, adapter: ActionRigAdapter, start: Triple, rotation: Triple, scale: number, fps = 24): AnimationShot {
  if (!action.phases.length) throw new Error(`Action has no authored phases: ${action.id}`);
  const id = `${action.id}-${targetId}`;
  const sourceFrames: PoseAnimationKeyframe[] = action.phases.map((phase,i) => ({
    id:`${id}-phase-${i}`, time:phase.at*action.duration, interpolation:"ease-in-out",
    poseId:action.id, poseIndex:adapter.poseIndex(phase.pose), ...adapter.sample(phase.pose,phase.joints),
  }));
  const roots: RootAnimationKeyframe[] = action.phases.map((phase,i) => ({ id:`${id}-root-${i}`,time:phase.at*action.duration,interpolation:"ease-in-out",position:phase.root ?? [0,0,0],rotation:[0,phase.yaw??0,0],scale }));
  const source: AnimationShot = {id,shotId:id,duration:action.duration,speed:1,loop:false,motionId:null,cameraMotionId:null,tracks:[{id:`${id}-pose`,kind:"pose",name:action.name,enabled:true,keyframes:sourceFrames},{id:`${id}-root`,kind:"root",name:"人物移动",enabled:true,keyframes:roots}]};
  const poseFrames: PoseAnimationKeyframe[] = [], rootFrames: RootAnimationKeyframe[] = [];
  const sourceContacts=new Map<string,Triple>();
  const count = Math.ceil(action.duration * fps);
  for(let i=0;i<=count;i++) {
    const time=Math.min(action.duration,i/fps), fraction=time/action.duration;
    const value=evaluateAnimationShot(source,time);
    let pose=value.pose!, offset=value.root!.position, feet:FootTargets|undefined,hands:Partial<FootTargets>|undefined;
    if(action.sourceClip){
      const sourceDuration=sourceActionDuration(action.sourceClip);
      const stopping=!!action.gait&&!action.loop;
      const brake=Math.max(0,Math.min(1,(fraction-.58)/.32));
      const travelFraction=stopping?Math.min(1,(Math.min(fraction,.58)+.32*(brake-brake**3+brake**4/2))/.74):fraction;
      const total=travelFraction*(action.sourceCycles??1);
      const progress=action.loop||stopping?(fraction===1?1:total%1):Math.max(0,Math.min(1,(fraction-.08)/.78));
      const sampled=adapter.source(action.sourceClip,progress*sourceDuration);
      if(stopping){
        const settled=adapter.source("Idle_Loop",0),amount=brake*brake*(3-2*brake);
        const blend:AnimationShot={...source,duration:1,tracks:[{id:"recovery",kind:"pose",name:"制动与重心恢复",enabled:true,keyframes:[{...pose,...sampled,id:"moving",time:0,interpolation:"linear"},{...pose,...settled,id:"settled",time:1,interpolation:"linear"}]}]};
        pose=evaluateAnimationShot(blend,amount).pose!;
      }else pose={...pose,...sampled};
      offset=[0,0,(action.travel??0)*travelFraction];
      if(action.gait){
        // Match grounded feet to the authored root path. The retargeted source
        // supplies the full performance; this only corrects stance-phase drift.
        const duty=action.gait==="walk"?.28:action.sourceClip==="Sprint_Loop"?.2:.18;
        const cycles=action.sourceCycles??1,stride=(action.travel??0)/cycles;
        feet={} as FootTargets;
        for(const [side,phase] of [["left",0],["right",.5]] as const){
          let anchor=sourceContacts.get(side);
          if(!anchor){adapter.source(action.sourceClip,phase*sourceDuration);anchor=adapter.point(side==="left"?"LeftFoot":"RightFoot");sourceContacts.set(side,anchor);}
          adapter.refine(pose);const current=adapter.point(side==="left"?"LeftFoot":"RightFoot");
          const local=((total-phase)%1+1)%1;
          const release=Math.max(0,Math.min(1,(duty-local)/.05));
          const weight=local<duty?release*release*(3-2*release)*(stopping?1-brake:1):0;
          const target:Triple=[anchor[0],anchor[1],anchor[2]-local*stride];
          feet[side]=current.map((v,k)=>v+(target[k]-v)*weight) as Triple;
        }
      }
    } else if(action.gait) {
      const run=action.gait==="run", side=action.gait==="side";
      const period=run?.64:side?1.2:.96, duty=run?.4:.62;
      const stopping=!action.loop;
      const brakeStart=action.id==="action-run-stop"?.55:.7;
      // Integrated smooth deceleration; position and velocity remain continuous.
      const brake=Math.max(0,(fraction-brakeStart)/(1-brakeStart));
      const progress=stopping ? (fraction<=brakeStart?fraction:brakeStart+(1-brakeStart)*(brake-brake**3+brake**4/2))/(brakeStart+(1-brakeStart)/2) : fraction;
      const velocity=(action.travel??2.4)/action.duration/(stopping?brakeStart+(1-brakeStart)/2:1);
      const gain=stopping ? 1-(brake*brake*(3-2*brake)) : 1;
      const cycle=time/period;
      const stride=velocity*period*duty;
      const foot=(phase:number,rest:Triple):Triple=>{
        const q=((phase%1)+1)%1;
        const swing=Math.max(0,(q-duty)/(1-duty));
        const along=q<duty ? stride*(.5-q/duty) : stride*(-.5+swing*swing*(3-2*swing));
        const lift=q<duty ? 0 : Math.sin(Math.PI*swing)*(run?.38:.16);
        return [rest[0]+(side?along*gain:0),rest[1]+lift*gain,rest[2]+(side?0:along*gain)];
      };
      feet={left:foot(cycle,adapter.feet.left),right:foot(cycle+.5,adapter.feet.right)};
      const swing=Math.sin(cycle*Math.PI*2)*gain;
      const edits:JointEdits={ hips:[run?10:3,0,0],torso:[run?13:4,2*swing,-2*swing],head:[run?-13:-3,-2*swing,0],
        leftArm:[32*swing,0,-16],rightArm:[-32*swing,0,16],leftForearm:[run?-55:-10,0,run?65:22],rightForearm:[run?-55:-10,0,run?-65:-22] };
      const sampled=adapter.sample("自然站立",edits);
      sampled.rigPosition=[sampled.rigPosition![0],sampled.rigPosition![1]-(run?.14:.09)*gain,sampled.rigPosition![2]];
      hands={left:[adapter.hands.left[0],adapter.hands.left[1]+(run?.4:.08)*gain,adapter.hands.left[2]+.5*swing],right:[adapter.hands.right[0],adapter.hands.right[1]+(run?.4:.08)*gain,adapter.hands.right[2]-.5*swing]};
      if(stopping && fraction>brakeStart) {
        // Blend into the authored braking/recovery phases, never freeze a run pose.
        const blend:AnimationShot={...source,duration:1,tracks:[{id:"settle",kind:"pose",name:"重心恢复",enabled:true,keyframes:[{...pose,id:"gait",time:0,interpolation:"linear",...sampled},{...pose,id:"rest",time:1,interpolation:"linear"}]}]};
        pose=evaluateAnimationShot(blend,1-gain).pose!;
      } else pose={...pose,...sampled};
      offset=side?[(action.travel??2.4)*progress,0,0]:[0,0,(action.travel??2.4)*progress];
    } else if(action.plantFeet===true || action.plantFeet!==false && !action.props.length && !/jump|kick|kneel|turn|fall|dodge|hesitate|startled/.test(action.id)) {
      // Keep planted feet fixed during upper-body gestures and squat transitions.
      feet=adapter.feet;
    }
    if(action.additiveJoints)pose={...pose,...adapter.nudge(pose,action.additiveJoints)};
    let refined=adapter.refine(pose,feet,hands);
    if(action.id==="action-point")refined=shapeActionHand(refined,"right","point",Math.max(0,Math.min(1,(fraction-.15)/.2,(.9-fraction)/.2)));
    if(action.id==="action-celebrate")refined=shapeActionHand(refined,"right","fist",Math.max(0,Math.min(1,fraction/.2,(1-fraction)/.12)));
    poseFrames.push({...pose,...refined,id:`${id}-f${i}`,time,interpolation:"linear"});
    const yaw=rotation[1]*Math.PI/180, s=scale/100;
    rootFrames.push({id:`${id}-r${i}`,time,interpolation:"linear",position:[start[0]+(offset[0]*Math.cos(yaw)+offset[2]*Math.sin(yaw))*s,start[1]+offset[1]*s,start[2]+(-offset[0]*Math.sin(yaw)+offset[2]*Math.cos(yaw))*s],rotation:[rotation[0],rotation[1]+value.root!.rotation[1],rotation[2]],scale});
  }
  return {...source,actionId:action.id,sourceDuration:action.duration,loop:action.loop,tracks:[{id:`${id}-pose`,targetId,kind:"pose",name:action.name,enabled:true,keyframes:poseFrames},{id:`${id}-root`,targetId,kind:"root",name:"人物移动",enabled:true,keyframes:rootFrames}]};
}

export function bakeInteractionClip(action:ActionPreset,actors:[{id:string;adapter:ActionRigAdapter;scale?:number},{id:string;adapter:ActionRigAdapter;scale?:number}],origin:Triple=[0,0,0],yaw=0,scale=100):AnimationShot {
  if(!action.partners)throw new Error("互动尚未制作人物时序");
  const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
  const baseClips=actors.map((actor,index)=>{
    const partner=action.partners![index],angle=yaw*Math.PI/180,s=scale/100;
    const at:Triple=[origin[0]+(partner.position[0]*Math.cos(angle)+partner.position[2]*Math.sin(angle))*s,origin[1]+partner.position[1]*s,origin[2]+(-partner.position[0]*Math.sin(angle)+partner.position[2]*Math.cos(angle))*s];
    const actorScale=actor.scale??scale,travel=partner.travel??action.travel;
    return bakeActionClip({...action,...partner,travel:travel===undefined?undefined:travel*scale/actorScale,phases:partner.phases,partners:undefined},actor.id,actor.adapter,at,[0,yaw+partner.yaw,0],actorScale);
  });
  const clips=baseClips.map((clip,index)=>{
    const actor=actors[index];
    const canonical=(point:Triple):Triple=>{const a=-yaw*Math.PI/180,s=scale/100,x=(point[0]-origin[0])/s,z=(point[2]-origin[2])/s;return [x*Math.cos(a)+z*Math.sin(a),(point[1]-origin[1])/s,-x*Math.sin(a)+z*Math.cos(a)];};
    const poseTrack=clip.tracks.find(track=>track.kind==="pose") as Extract<AnimationShot["tracks"][number],{kind:"pose"}>;
    for(const frame of poseTrack.keyframes){
      const fraction=frame.time/action.duration;
      const value=evaluateAnimationShot(clip,frame.time,actor.id);
      actor.adapter.refine(value.pose!);
      const hands:Partial<FootTargets>={};
      const directions:Partial<Record<"left"|"right",{direction:Triple;weight:number}>>={};
      let grip=0;
      for(const contact of action.contacts??[]){
        if(contact.actor!==index||fraction<contact.start||fraction>contact.end)continue;
        const amount=fraction<contact.settle?smooth((fraction-contact.start)/(contact.settle-contact.start)):fraction>contact.release?1-smooth((fraction-contact.release)/(contact.end-contact.release)):1;
        const target=[...contact.target] as Triple;
        if(contact.propOffset){const position=sampleActionProp(action,fraction);for(let i=0;i<3;i++)target[i]=position[i]+contact.propOffset[i];}
        if(contact.otherActor!==undefined&&contact.bone){
          const other=actors[contact.otherActor],otherValue=evaluateAnimationShot(baseClips[contact.otherActor],frame.time,other.id);
          other.adapter.refine(otherValue.pose!);const p=other.adapter.point(contact.bone),r=otherValue.root!,a=r.rotation[1]*Math.PI/180,s=r.scale/100;
          const anchor=canonical([r.position[0]+(p[0]*Math.cos(a)+p[2]*Math.sin(a))*s,r.position[1]+p[1]*s,r.position[2]+(-p[0]*Math.sin(a)+p[2]*Math.cos(a))*s]);
          for(let i=0;i<3;i++)target[i]+=anchor[i];
        }
        // A handshake's joined hands move together, including the shared pump.
        if(action.id==="interaction-1-2")target[1]+=.06*Math.sin((fraction-.34)*Math.PI*10)*Math.sin(Math.PI*Math.max(0,Math.min(1,(fraction-.34)/.4)));
        const bodyAt=canonical(value.root!.position),localYaw=-(value.root!.rotation[1]-yaw)*Math.PI/180;
        const dx=target[0]-bodyAt[0],dz=target[2]-bodyAt[2];
        const actorRatio=scale/value.root!.scale;
        const local:Triple=[(dx*Math.cos(localYaw)+dz*Math.sin(localYaw))*actorRatio,(target[1]-bodyAt[1])*actorRatio,(-dx*Math.sin(localYaw)+dz*Math.cos(localYaw))*actorRatio];
        const from=actor.adapter.point(contact.hand==="left"?"LeftHand":"RightHand");
        hands[contact.hand]=from.map((v,i)=>v+(local[i]-v)*amount) as Triple;
        if(["interaction-1-2","interaction-1-3","interaction-1-4"].includes(action.id)){
          directions[contact.hand]={direction:action.id==="interaction-1-3"?[0,1,0]:[0,0,1],weight:amount};
          grip=action.id==="interaction-1-3"?0:amount*(action.id==="interaction-1-2"?.5:1);
        }
        if(contact.propOffset){directions[contact.hand]={direction:[0,0,1],weight:amount};grip=amount*.62;}
      }
      let refined=actor.adapter.refine(value.pose!,undefined,hands,directions);
      if(grip)refined=shapeActionHand(refined,"right","fist",grip);
      Object.assign(frame,refined);
    }
    return clip;
  });
  const tracks=clips.flatMap(clip=>clip.tracks);
  if(action.sharedProp){
    const angle=yaw*Math.PI/180,s=scale/100,count=Math.ceil(action.duration*24),id=actionPropId(action,actors[0].id);
    const frames:RootAnimationKeyframe[]=Array.from({length:count+1},(_,i)=>{const time=Math.min(action.duration,i/24),p=sampleActionProp(action,time/action.duration);return {id:`${id}-${i}`,time,interpolation:"linear",position:[origin[0]+(p[0]*Math.cos(angle)+p[2]*Math.sin(angle))*s,origin[1]+p[1]*s,origin[2]+(-p[0]*Math.sin(angle)+p[2]*Math.cos(angle))*s],rotation:[0,yaw,0],scale:100};});
    tracks.push({id,targetId:id,kind:"root",name:"道具交接",enabled:true,keyframes:frames});
  }
  return {...clips[0],id:action.id,actionId:action.id,tracks};
}
