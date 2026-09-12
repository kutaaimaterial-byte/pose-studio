import fists from "../public/assets/motions/hand-shapes.json";
import {slerpQuaternion,type QuaternionTuple} from "./animation-timeline";
import type {RigSample} from "./action-runtime";
export function shapeActionHand(sample:RigSample,side:"left"|"right",shape:"fist"|"point",amount=1):RigSample{
  const suffix=side==="left"?"_l":"_r",bones={...sample.bones};
  for(const [name,q] of Object.entries(fists)){
    if(!name.endsWith(suffix)||!bones[name]||shape==="point"&&name.startsWith("index_"))continue;
    bones[name]=slerpQuaternion(bones[name],q as QuaternionTuple,Math.max(0,Math.min(1,amount)));
  }
  return {...sample,bones};
}
