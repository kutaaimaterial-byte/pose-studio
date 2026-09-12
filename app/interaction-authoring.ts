import type { ActionPreset,MotionPhase } from "./motion-authoring";
const phase=(at:number,pose:string,joints?:MotionPhase["joints"]):MotionPhase=>({at,pose,joints});
const stand="自然站立",reach="前倾伸手";
const partner=(position:[number,number,number],yaw:number,phases:MotionPhase[])=>({position,yaw,phases});

export const authoredInteractions:ActionPreset[]=[
  {id:"interaction-4-2",name:"扶肩行走",group:"帮助搀扶",kind:"interaction",duration:5.333333,loop:true,release:"review",props:[],framing:"pair",phases:[],partners:[
    {...partner([-.52,0,0],0,[phase(0,stand),phase(1,stand)]),sourceClip:"Walk_Loop",sourceCycles:4,travel:4.8,gait:"walk",additiveJoints:{head:[0,-12,0],torso:[0,0,3]}},
    {...partner([.52,0,0],0,[phase(0,stand),phase(1,stand)]),sourceClip:"Walk_Loop",sourceCycles:4,travel:4.8,gait:"walk",additiveJoints:{torso:[8,0,-7],head:[6,0,4]}},
  ],contacts:[{actor:0,hand:"left",start:0,settle:0,release:1,end:1,otherActor:1,bone:"RightUpperArm",target:[0,.04,-.16]},{actor:1,hand:"right",start:0,settle:0,release:1,end:1,otherActor:0,bone:"LeftUpperArm",target:[0,.02,-.15]}]},
  {id:"interaction-2-1",name:"递物接物",group:"物品传递",kind:"interaction",duration:6,loop:false,release:"review",plantFeet:true,props:["box"],framing:"pair",phases:[],
    sharedProp:{kind:"box",size:[.34,.25,.3],path:[{at:0,position:[-.42,1.65,0]},{at:.25,position:[-.2,2.15,0]},{at:.45,position:[0,2.15,0]},{at:.62,position:[.12,2.15,0]},{at:.86,position:[.43,1.9,0]},{at:1,position:[.43,1.9,0]}]},
    partners:[partner([-.95,0,0],90,[phase(0,reach,{head:[8,0,0]}),phase(.25,reach,{head:[-2,0,0],torso:[10,0,0]}),phase(.5,reach),phase(.65,reach),phase(.85,stand),phase(1,stand)]),partner([.95,0,0],-90,[phase(0,stand),phase(.15,stand,{head:[15,0,0]}),phase(.35,reach),phase(.55,reach,{head:[-4,0,0]}),phase(.8,reach,{head:[12,0,0]}),phase(1,reach,{head:[10,0,0]})])],
    contacts:[{actor:0,hand:"right",start:0,settle:0,release:.59,end:.76,target:[0,0,0],propOffset:[-.24,-.02,0]},{actor:1,hand:"right",start:.2,settle:.43,release:1,end:1,target:[0,0,0],propOffset:[.24,-.02,0]}],
  },
  ...(["击掌","碰拳"] as const).map((name,index):ActionPreset=>{
    const high=index===0,y=high?3.05:2.18,wrist=high?.03:.23;
    return {id:`interaction-1-${index+3}`,name,group:"交流招呼",kind:"interaction",duration:high?3.6:3.2,loop:false,release:"review",props:[],framing:"pair",phases:[],partners:[
      partner([-.82,0,0],90,[phase(0,stand),phase(.18,high?"单手举起":reach),phase(.38,high?"单手举起":reach,{head:[high?-8:5,0,0]}),phase(.58,high?"单手举起":reach),phase(.8,reach),phase(1,stand)]),
      partner([.82,0,0],-90,[phase(0,stand),phase(.16,stand,{head:[-4,0,0]}),phase(.3,high?"单手举起":reach),phase(.54,high?"单手举起":reach),phase(.76,reach),phase(1,stand)]),
    ],contacts:[{actor:0,hand:"right",start:.2,settle:.45,release:.53,end:.75,target:[-wrist,y,0]},{actor:1,hand:"right",start:.28,settle:.45,release:.53,end:.78,target:[wrist,y,0]}]};
  }),
  {id:"interaction-1-1",name:"对视交谈",group:"交流招呼",kind:"interaction",duration:6,loop:true,release:"review",props:[],framing:"pair",phases:[],partners:[
    partner([-.9,0,0],70,[phase(0,stand),phase(.18,stand,{head:[-3,12,0],rightArm:[-25,0,35],rightForearm:[-15,0,55]}),phase(.36,stand,{head:[6,12,0],rightArm:[-35,0,40],rightForearm:[-20,0,70]}),phase(.5,stand),phase(.7,stand,{head:[10,12,0]}),phase(.85,stand,{head:[-4,12,0]}),phase(1,stand)]),
    partner([.9,0,0],-70,[phase(0,stand),phase(.16,stand,{head:[8,-12,0]}),phase(.34,stand,{head:[-4,-12,0]}),phase(.52,stand,{head:[3,-12,0],leftArm:[-25,0,-38],leftForearm:[-15,0,-55]}),phase(.7,stand,{leftArm:[-35,0,-45],leftForearm:[-20,0,-65]}),phase(.88,stand,{head:[8,-12,0]}),phase(1,stand)]),
  ]},
  {id:"interaction-1-2",name:"握手",group:"交流招呼",kind:"interaction",duration:4.8,loop:false,release:"review",props:[],framing:"pair",phases:[],partners:[
    partner([-.72,0,0],90,[phase(0,stand),phase(.2,reach),phase(.38,reach,{torso:[7,0,0],head:[5,0,0]}),phase(.52,reach,{torso:[9,0,0]}),phase(.66,reach,{torso:[7,0,0]}),phase(.82,reach),phase(1,stand)]),
    partner([.72,0,0],-90,[phase(0,stand),phase(.12,stand,{head:[10,0,0]}),phase(.32,reach),phase(.46,reach,{head:[-3,0,0]}),phase(.62,reach,{head:[6,0,0]}),phase(.82,reach),phase(1,stand)]),
  ],contacts:[{actor:0,hand:"right",start:.16,settle:.34,release:.74,end:.94,target:[-.13,1.9,0]},{actor:1,hand:"right",start:.2,settle:.34,release:.74,end:.94,target:[.13,1.9,0]}]},
  {id:"interaction-3-2",name:"拥抱",group:"亲密与安慰",kind:"interaction",duration:5.5,loop:false,release:"review",props:[],framing:"pair",phases:[],partners:[
    partner([-.43,0,0],90,[phase(0,stand),phase(.18,"双臂张开"),phase(.38,"抱物于胸前",{hips:[3,0,0],torso:[5,0,0],head:[0,18,-7]}),phase(.58,"抱物于胸前",{torso:[5,0,0],head:[0,18,-7]}),phase(.72,"抱物于胸前"),phase(.86,"双臂张开"),phase(1,stand)]),
    partner([.43,0,0],-90,[phase(0,stand),phase(.22,"双臂张开"),phase(.4,"抱物于胸前",{hips:[3,0,0],torso:[4,0,0],head:[0,18,-7]}),phase(.62,"抱物于胸前",{torso:[4,0,0],head:[0,18,-7]}),phase(.74,"抱物于胸前"),phase(.88,"双臂张开"),phase(1,stand)]),
  ],contacts:[
    {actor:0,hand:"left",start:.18,settle:.4,release:.7,end:.9,target:[.57,2.22,-.32]},
    {actor:0,hand:"right",start:.18,settle:.4,release:.7,end:.9,target:[.57,2.4,.32]},
    {actor:1,hand:"left",start:.22,settle:.4,release:.7,end:.9,target:[-.57,2.42,.32]},
    {actor:1,hand:"right",start:.22,settle:.4,release:.7,end:.9,target:[-.57,2.2,-.32]},
  ]},
];

// Handshakes, high-fives, fist bumps and transfers remain in contact review.
for(const action of authoredInteractions)if(["interaction-1-1","interaction-3-2","interaction-4-2"].includes(action.id)){
  action.release="ready";
  action.limitation="按内置白模制作；不同体型的精确接触适配尚未完成，已有角色身份和缩放会保留。";
}
