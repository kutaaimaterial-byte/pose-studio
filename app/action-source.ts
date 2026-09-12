import {evaluateAnimationShot,type AnimationShot,type PoseAnimationKeyframe} from "./animation-timeline";
type SourceLibrary={schema:number;clips:Record<string,{duration:number;frames:Pick<PoseAnimationKeyframe,"time"|"bones"|"bonePositions">[]}>};
let loading:Promise<void>|undefined;
const clips=new Map<string,AnimationShot>();
export function loadActionSources():Promise<void>{
  if(!loading)loading=fetch("/assets/motions/quaternius-standard.json").then(async response=>{
    if(!response.ok)throw new Error("完整动作资源加载失败，请重试");
    const data:SourceLibrary=await response.json();
    if(data.schema!==1||!data.clips)throw new Error("动作资源格式不匹配");
    for(const [id,clip] of Object.entries(data.clips))clips.set(id,{id,shotId:id,duration:clip.duration,speed:1,loop:false,motionId:null,cameraMotionId:null,tracks:[{id,kind:"pose",name:id,enabled:true,keyframes:clip.frames.map((frame,i)=>({...frame,id:`${id}-${i}`,poseId:id,poseIndex:0,interpolation:"linear"}))}]});
  }).catch(error=>{loading=undefined;throw error;});
  return loading;
}
export function sourceActionDuration(id:string){const clip=clips.get(id);if(!clip)throw new Error("完整动作资源尚未加载，请稍后重试");return clip.duration;}
export function sampleSourceAction(id:string,time:number){const clip=clips.get(id);if(!clip)throw new Error("完整动作资源尚未加载，请稍后重试");return evaluateAnimationShot(clip,time).pose!;}
