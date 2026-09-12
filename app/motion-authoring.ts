import type { Triple, JointEdits } from "./action-authoring";

export type MotionPhase = { at: number; pose: string; joints?: JointEdits; root?: Triple; yaw?: number };
type ActionPartner={position:Triple;yaw:number;phases:MotionPhase[];sourceClip?:string;sourceCycles?:number;travel?:number;gait?:"walk"|"run"|"side";additiveJoints?:JointEdits};
export type ActionPreset = {
  id: string; name: string; group: string; kind: "motion" | "interaction";
  duration: number; loop: boolean; phases: MotionPhase[];
  gait?: "walk" | "run" | "side"; travel?: number;
  sourceClip?:string; sourceCycles?:number;
  plantFeet?:boolean;
  additiveJoints?:JointEdits;
  props: string[]; release: "review" | "ready";
  framing: "full" | "upper" | "pair"; limitation?: string;
  partners?: [ActionPartner,ActionPartner];
  contacts?: {actor:0|1;hand:"left"|"right";start:number;settle:number;release:number;end:number;target:Triple;propOffset?:Triple;otherActor?:0|1;bone?:string}[];
  sharedProp?:{kind:"box"|"phone";size:Triple;path:{at:number;position:Triple}[]};
};
const phase = (at: number, pose: string, joints?: JointEdits, root?: Triple, yaw?: number): MotionPhase => ({ at, pose, joints, root, yaw });
const neutral = "自然站立";
const gesture = (pose: string, joints?: JointEdits): MotionPhase[] => [phase(0,neutral), phase(.16,neutral,{torso:[3,0,0],head:[-2,0,0]}),phase(.45,pose,joints),phase(.65,pose,joints),phase(.85,neutral,{torso:[2,0,0]}),phase(1,neutral)];
const a = (id: string, name: string, group: string, duration: number, phases: MotionPhase[], extra: Partial<ActionPreset> = {}): ActionPreset =>
  ({ id: `action-${id}`, name, group, duration, phases, kind:"motion", loop:false, props:[], release:"review", framing:"full", ...extra });

/** Authored production catalog. Only reviewed entries are offered to users. */
export const actionPresets: ActionPreset[] = [
  a("breathe","自然呼吸","待机与头部反应",3,[phase(0,neutral),phase(.3,neutral,{chest:[-2.5,0,0],leftShoulder:[-1,0,-2],rightShoulder:[-1,0,2]}),phase(.7,neutral,{chest:[1.5,0,0],head:[.8,0,0]}),phase(1,neutral)],{loop:true}),
  a("look-up","抬头","待机与头部反应",2.4,gesture(neutral,{neck:[-8,0,0],head:[-24,0,0],chest:[-3,0,0]}),{framing:"upper"}),
  a("look-down","低头","待机与头部反应",2.4,gesture(neutral,{neck:[8,0,0],head:[24,0,0],chest:[4,0,0]}),{framing:"upper"}),
  a("look-behind","转头看身后","待机与头部反应",3.2,[phase(0,neutral),phase(.18,neutral,{head:[0,20,0]}),phase(.42,neutral,{torso:[2,16,0],chest:[0,10,0],neck:[0,15,0],head:[-4,48,0]}),phase(.68,neutral,{torso:[2,16,0],chest:[0,10,0],neck:[0,15,0],head:[-4,48,0]}),phase(.84,neutral,{head:[0,20,0]}),phase(1,neutral)],{framing:"upper"}),
  a("nod","点头","待机与头部反应",2,[phase(0,neutral),phase(.2,neutral,{head:[-6,0,0]}),phase(.37,neutral,{head:[18,0,0],neck:[4,0,0]}),phase(.54,neutral,{head:[-5,0,0]}),phase(.72,neutral,{head:[15,0,0],neck:[3,0,0]}),phase(1,neutral)],{framing:"upper"}),
  a("shake-head","摇头","待机与头部反应",2.6,[phase(0,neutral),phase(.2,neutral,{head:[0,28,0],neck:[0,5,0]}),phase(.45,neutral,{head:[0,-28,0],neck:[0,-5,0]}),phase(.7,neutral,{head:[0,23,0]}),phase(1,neutral)],{framing:"upper"}),
  a("raise-hand","举手示意","上肢表达",3.2,[phase(0,neutral),phase(.2,neutral,{torso:[0,-4,0],rightArm:[-30,0,48],rightForearm:[-15,0,35]}),phase(.45,"单手举起"),phase(.7,"单手举起",{head:[-4,-8,0]}),phase(.85,neutral,{rightArm:[-25,0,50],rightForearm:[-12,0,32]}),phase(1,neutral)]),
  a("wave","挥手招呼","上肢表达",4,[phase(0,neutral),phase(.25,"单手举起"),phase(.38,"单手举起",{rightForearm:[-10,0,30],rightHand:[0,0,20]}),phase(.51,"单手举起",{rightForearm:[-10,0,60],rightHand:[0,0,-20]}),phase(.64,"单手举起",{rightForearm:[-10,0,30],rightHand:[0,0,20]}),phase(.77,"单手举起",{rightForearm:[-10,0,60],rightHand:[0,0,-20]}),phase(1,neutral)]),
  a("point","伸手指向","上肢表达",3.2,gesture("前倾伸手",{torso:[10,-8,0],head:[-6,12,0]})),
  a("hands-hips","双手叉腰","上肢表达",3,gesture("双手叉腰")),
  a("fold-arms","双臂抱胸","上肢表达",3.6,[phase(0,neutral),phase(.2,neutral,{leftArm:[-20,0,-35],rightArm:[-15,0,30],leftForearm:[0,0,50],rightForearm:[0,0,-40]}),phase(.45,"双臂抱胸"),phase(.75,"双臂抱胸",{head:[0,8,0]}),phase(1,"双臂抱胸")]),
  a("scratch-head","摸头挠头","上肢表达",3.8,[phase(0,neutral),phase(.25,"单手摸头"),phase(.4,"单手摸头",{leftHand:[0,12,0],head:[6,0,-6]}),phase(.55,"单手摸头",{leftHand:[0,-12,0],head:[6,0,-6]}),phase(.7,"单手摸头",{leftHand:[0,12,0]}),phase(1,neutral)]),
  a("walk","自然行走","基础移动",4,[phase(0,neutral),phase(1,neutral)],{loop:true,gait:"walk",travel:2.4}),
  a("brisk-walk","快走","基础移动",3.5,[phase(0,neutral),phase(1,neutral)],{loop:true,gait:"walk",travel:3.4}),
  a("jog","慢跑","基础移动",4,[phase(0,neutral),phase(1,neutral)],{loop:true,gait:"run",travel:4.4}),
  a("sprint","冲刺跑","基础移动",3.2,[phase(0,neutral),phase(1,neutral)],{loop:true,gait:"run",travel:6}),
  a("side-step","侧向移动","基础移动",4,[phase(0,neutral),phase(1,neutral)],{loop:true,gait:"side",travel:2.2}),
  a("turn","原地转身","基础移动",3,[phase(0,neutral,{},[0,0,0],0),phase(.2,"向前迈步",{head:[0,25,0]},[0,0,0],25),phase(.45,"自然行走",{},[0,0,0],80),phase(.7,"向前迈步",{},[0,0,0],140),phase(.88,neutral,{},[0,0,0],180),phase(1,neutral,{},[0,0,0],180)]),
  a("sit","坐下","姿态过渡",4.5,[phase(0,neutral),phase(.2,"向前迈步",{},[0,0,-.22]),phase(.38,neutral,{torso:[18,0,0]},[0,0,-.25]),phase(.58,"半蹲",{},[0,0,-.32]),phase(.82,"自然正坐",{},[0,0,-.42]),phase(1,"自然正坐",{},[0,0,-.42])],{props:["chair"]}),
  a("stand-chair","从椅子起身","姿态过渡",3.6,[phase(0,"自然正坐"),phase(.2,"身体前倾坐"),phase(.42,"半蹲"),phase(.65,neutral,{torso:[12,0,0]}),phase(.83,neutral,{torso:[-2,0,0]}),phase(1,neutral)],{props:["chair"]}),
  a("squat","下蹲","姿态过渡",2.8,[phase(0,neutral),phase(.2,neutral,{torso:[8,0,0],leftLeg:[-12,0,-14],rightLeg:[-12,0,14],leftShin:[18,0,0],rightShin:[18,0,0]}),phase(.48,"半蹲"),phase(.8,"自然蹲姿"),phase(1,"自然蹲姿")]),
  a("stand-squat","从蹲姿起身","姿态过渡",2.8,[phase(0,"自然蹲姿"),phase(.25,"自然蹲姿",{torso:[28,0,0]}),phase(.55,"半蹲"),phase(.85,neutral,{torso:[4,0,0]}),phase(1,neutral)]),
  a("kneel","单膝跪下","姿态过渡",3.5,[phase(0,neutral),phase(.22,"前后脚站立"),phase(.48,"单膝半跪"),phase(.78,"单膝跪地"),phase(1,"单膝跪地")]),
  a("stand-kneel","从跪姿起身","姿态过渡",3.5,[phase(0,"单膝跪地"),phase(.24,"单膝半跪",{torso:[22,0,0]}),phase(.5,"半蹲"),phase(.76,"前后脚站立"),phase(1,neutral)]),
  a("phone","低头查看手机","日常行为",4.5,[phase(0,neutral),phase(.22,"单手插兜"),phase(.45,"低头看手机行走",{leftLeg:[0,0,-8],rightLeg:[0,0,8],leftShin:[0,0,0],rightShin:[0,0,0]}),phase(.75,"坐姿低头看手机",{leftLeg:[0,0,-8],rightLeg:[0,0,8],leftShin:[0,0,0],rightShin:[0,0,0]}),phase(1,neutral)],{props:["phone"],framing:"upper"}),
  a("drink","拿杯喝水","日常行为",5.5,[phase(0,neutral),phase(.18,"前倾伸手"),phase(.38,"坐姿端杯",{leftLeg:[0,0,-8],rightLeg:[0,0,8],leftShin:[0,0,0],rightShin:[0,0,0]}),phase(.54,neutral,{rightArm:[-40,0,35],rightForearm:[-70,0,110],head:[-8,0,0]}),phase(.7,neutral,{rightArm:[-25,0,30],rightForearm:[-40,0,90]}),phase(.88,"前倾伸手"),phase(1,neutral)],{props:["cup","table"],framing:"upper"}),
  a("pick-up","拿起物品","日常行为",4.5,[phase(0,neutral),phase(.2,"前倾伸手"),phase(.42,"下蹲拾物"),phase(.58,"蹲姿双手抱物"),phase(.8,"半蹲"),phase(1,"抱物于胸前")],{props:["box"]}),
  a("put-down","放下物品","日常行为",4.5,[phase(0,"抱物于胸前"),phase(.22,"半蹲"),phase(.48,"蹲姿双手抱物"),phase(.62,"下蹲拾物"),phase(.8,"半蹲"),phase(1,neutral)],{props:["box"]}),
  a("open-door","开门","日常行为",4,[phase(0,neutral),phase(.22,"前倾伸手"),phase(.45,"前倾伸手",{rightForearm:[0,0,-35]}),phase(.68,"前后脚站立",{rightArm:[15,0,45],rightForearm:[0,0,-60]}),phase(.85,"向前迈步"),phase(1,neutral)],{props:["door"]}),
  a("close-door","关门","日常行为",3.6,[phase(0,neutral),phase(.2,"侧身回眸"),phase(.42,"前后脚站立",{rightArm:[25,0,55],rightForearm:[0,0,-50]}),phase(.67,"双手推物"),phase(.85,"前倾伸手"),phase(1,neutral)],{props:["door"]}),
  a("jump","起跳落地","运动与动作",3,[phase(0,neutral),phase(.2,"半蹲"),phase(.38,"原地起跳"),phase(.5,"双腿腾空"),phase(.65,"跳跃落地"),phase(.8,"落地缓冲"),phase(1,neutral)]),
  a("dodge-side","侧闪躲避","运动与动作",2.5,[phase(0,"双拳防守"),phase(.22,"半蹲"),phase(.48,"侧身避让奔跑",{},[.7,0,0]),phase(.7,"前后脚站立",{},[.85,0,0]),phase(1,"双拳防守",{},[.85,0,0])]),
  a("dodge-back","后撤闪避","运动与动作",2.5,[phase(0,"双拳防守"),phase(.2,"仰身躲避"),phase(.5,"向前迈步",{},[0,0,-.6]),phase(.75,"前后脚站立",{},[0,0,-.8]),phase(1,"双拳防守",{},[0,0,-.8])]),
  a("punch","向前出拳","运动与动作",2.2,[phase(0,"双拳防守"),phase(.24,"双拳防守",{torso:[5,15,0]}),phase(.42,"前手直拳定格"),phase(.55,"前手直拳定格",{torso:[15,-24,0]}),phase(.78,"双拳防守",{torso:[6,-8,0]}),phase(1,"双拳防守")]),
  a("kick","侧向踢腿","运动与动作",2.8,[phase(0,"双拳防守"),phase(.25,"单腿提膝"),phase(.46,"侧向踢腿定格"),phase(.59,"侧向踢腿定格"),phase(.77,"单腿提膝"),phase(1,"双拳防守")]),
  a("fall-rise","跌倒后起身","运动与动作",6,[phase(0,neutral),phase(.15,"仰身躲避"),phase(.3,"后仰双手撑地缓冲"),phase(.42,"跌坐"),phase(.55,"坐地后撑"),phase(.7,"单手撑地起身"),phase(.86,"半蹲"),phase(1,neutral)]),
  a("startled","惊讶后退","情绪表演",3,[phase(0,neutral),phase(.14,neutral,{head:[-12,0,0],chest:[-8,0,0],leftArm:[-20,0,-48],rightArm:[-20,0,48]}),phase(.4,"仰身躲避",{},[0,0,-.35]),phase(.65,"前后脚站立",{},[0,0,-.5]),phase(.85,neutral,{head:[-5,0,0]},[0,0,-.5]),phase(1,neutral,{},[0,0,-.5])]),
  a("fear","害怕护头","情绪表演",3.5,[phase(0,neutral),phase(.2,"仰身躲避"),phase(.45,"双臂护头"),phase(.65,"双臂护头",{torso:[22,0,0],head:[25,0,0]}),phase(.82,"双臂护头",{torso:[18,0,0]}),phase(1,"双臂护头")]),
  a("dejected","失落垂肩","情绪表演",3.5,[phase(0,neutral),phase(.2,neutral,{head:[12,0,0]}),phase(.45,neutral,{head:[26,0,0],chest:[8,0,0],leftShoulder:[4,0,6],rightShoulder:[4,0,-6]}),phase(.75,neutral,{head:[30,0,0],torso:[12,0,0],leftArm:[8,0,-6],rightArm:[8,0,6]}),phase(1,neutral,{head:[28,0,0],torso:[10,0,0]})]),
  a("cry","掩面哭泣","情绪表演",5,[phase(0,neutral),phase(.24,"双臂护头"),phase(.42,"跪姿掩面",{leftLeg:[-8,0,-10],rightLeg:[-8,0,10],leftShin:[10,0,0],rightShin:[10,0,0]}),phase(.58,"跪姿掩面",{torso:[30,0,0],leftLeg:[-8,0,-10],rightLeg:[-8,0,10],leftShin:[10,0,0],rightShin:[10,0,0]}),phase(.72,"跪姿掩面",{torso:[25,0,0],leftLeg:[-8,0,-10],rightLeg:[-8,0,10],leftShin:[10,0,0],rightShin:[10,0,0]}),phase(1,neutral,{head:[24,0,0],torso:[12,0,0]})],{framing:"upper"}),
  a("celebrate","握拳振臂","情绪表演",3.5,[phase(0,neutral),phase(.2,"半蹲"),phase(.4,"单手举起"),phase(.55,"单手举起",{rightForearm:[-35,0,80]}),phase(.7,"单手举起",{rightForearm:[-15,0,30]}),phase(.85,"单手举起",{rightForearm:[-35,0,80]}),phase(1,neutral)]),
  a("bow","弯腰鞠躬","情绪表演",4,[phase(0,neutral),phase(.22,neutral,{hips:[6,0,0],torso:[12,0,0],head:[-4,0,0]}),phase(.46,"弯腰鞠躬"),phase(.7,"弯腰鞠躬"),phase(.86,neutral,{hips:[4,0,0],torso:[10,0,0]}),phase(1,neutral)]),
  a("slow-glance","缓慢回眸","叙事表演",4.5,[phase(0,neutral),phase(.22,neutral,{head:[0,15,0]}),phase(.48,"侧身回眸"),phase(.75,"侧身回眸",{head:[-4,60,0]}),phase(1,"侧身回眸")],{framing:"upper"}),
  a("walk-stop","走入后停下","叙事表演",5,[phase(0,neutral),phase(.7,neutral),phase(.85,"前后脚站立"),phase(1,neutral)],{gait:"walk",travel:2.8}),
  a("run-stop","奔跑急停","叙事表演",4.5,[phase(0,neutral),phase(.55,"正常跑步"),phase(.7,"急停姿态"),phase(.82,"半蹲"),phase(.92,"前后脚站立"),phase(1,neutral)],{gait:"run",travel:4.2}),
  a("peek","前倾探看","叙事表演",3.5,[phase(0,neutral),phase(.2,neutral,{head:[0,18,0]}),phase(.45,"前倾伸手",{rightArm:[12,0,25],torso:[24,-12,-6],head:[-18,20,0]}),phase(.7,"前倾伸手",{rightArm:[12,0,25],torso:[24,-12,-6],head:[-18,30,0]}),phase(1,neutral)]),
  a("reach-return","伸手后收回","叙事表演",3.5,[phase(0,neutral),phase(.2,neutral,{rightArm:[-25,0,30],head:[0,-8,0]}),phase(.45,"前倾伸手"),phase(.62,"前倾伸手",{rightHand:[0,12,0]}),phase(.8,neutral,{rightArm:[-28,0,25],rightForearm:[-18,0,-55]}),phase(1,neutral)]),
  a("hesitate","迈步后犹豫退回","叙事表演",4.5,[phase(0,neutral,{},[0,0,0]),phase(.25,"向前迈步",{},[0,0,.35]),phase(.45,"前后脚站立",{head:[0,-25,0]},[0,0,.45]),phase(.62,"前后脚站立",{head:[8,15,0]},[0,0,.4]),phase(.82,"向前迈步",{},[0,0,.15]),phase(1,neutral,{},[0,0,0])]),
];

export const interactionProduction = [
  ["交流招呼", "对视交谈", "握手", "击掌", "碰拳"],
  ["物品传递", "递物接物", "递手机给对方查看", "共同捧物", "双人抬箱"],
  ["亲密与安慰", "牵手同行", "拥抱", "拍肩安慰", "背靠背靠坐"],
  ["帮助搀扶", "伸手拉起", "扶肩行走", "搀扶坐下", "接住失去平衡的人"],
  ["冲突与反应", "推开对方", "出拳与格挡", "挥击与闪避", "追逐后急停回望"],
  ["叙事关系", "擦肩而过", "迎面走近后停下", "一人走开另一人伸手挽留", "背负同行"],
].flatMap(([group,...names]) => names.map((name,index) => ({ id:`interaction-${["交流招呼","物品传递","亲密与安慰","帮助搀扶","冲突与反应","叙事关系"].indexOf(group)+1}-${index+1}`,name,group,release:"review" as const })));

export const actionById = new Map(actionPresets.map((action) => [action.id, action]));

// Full authored CC0 skeletal performances, retargeted offline to our mannequin.
// This is not a relabelling of unrelated clips: only exact behaviours are mapped.
for(const [id,clip,cycles,duration,travel] of [
  ["action-walk","Walk_Loop",3,4,3.6],
  ["action-jog","Jog_Fwd_Loop",4,3.733333,6.2],
  ["action-sprint","Sprint_Loop",5,3.333333,8],
  ["action-sit","Sitting_Enter",1,2.4,0],
  ["action-stand-chair","Sitting_Exit",1,2.2,0],
  ["action-walk-stop","Walk_Loop",3,5,3.8],
  ["action-run-stop","Sprint_Loop",5,4.5,6.5],
] as const){const action=actionById.get(id)!;Object.assign(action,{sourceClip:clip,sourceCycles:cycles,duration,travel});}

// These gestures and selected retargeted clips passed the default-rig review.
// Complex contacts are deliberately not released by virtue of having keyframes.
const reviewedActions=new Set(["action-breathe","action-look-up","action-look-down","action-look-behind","action-nod","action-shake-head","action-raise-hand","action-wave","action-hands-hips","action-fold-arms","action-scratch-head","action-bow","action-reach-return","action-point","action-walk","action-jog","action-sprint","action-sit","action-stand-chair","action-walk-stop","action-run-stop"]);
for(const action of actionPresets)if(reviewedActions.has(action.id))action.release="ready";
