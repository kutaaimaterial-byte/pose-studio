import type { PoseCategory } from "./pose-data";

export type Triple = [number, number, number];
export type JointEdits = Partial<Record<"hips" | "torso" | "chest" | "neck" | "head" | "leftShoulder" | "leftArm" | "leftForearm" | "leftHand" | "rightShoulder" | "rightArm" | "rightForearm" | "rightHand" | "leftLeg" | "leftShin" | "leftFoot" | "rightLeg" | "rightShin" | "rightFoot", Triple>>;
export type SupportKind = "chair" | "table" | "wall" | "steps" | "rail" | "column" | "box" | "bag" | "backpack" | "phone" | "cup" | "camera" | "sword" | "bow" | "suitcase";
export type AuthoredPose = {
  id: string; name: string; category: PoseCategory; base: string; joints: JointEdits;
  supports: SupportKind[]; tags: string[];
  /** Production gate: a definition alone is not evidence of a usable preset. */
  release: "review" | "ready";
};

const p = (id: string, name: string, category: PoseCategory, base: string, joints: JointEdits, supports: SupportKind[] = [], tags: string[] = []): AuthoredPose =>
  ({ id: `pose-v35-${id}`, name, category, base, joints, supports, tags, release: "review" });

// Each row is independently authored; variants never receive new catalog IDs.
// Keep new entries after legacy poses so serialized engine indices remain valid.
export const authoredPoseExpansion: AuthoredPose[] = [
  p("bow", "弯腰鞠躬", "standing", "自然站立", { hips: [14,0,0], torso:[34,0,0], chest:[7,0,0], head:[-9,0,0], leftArm:[-10,0,-8], rightArm:[-10,0,8], leftLeg:[-14,0,-8], rightLeg:[-14,0,8], leftShin:[15,0,0], rightShin:[15,0,0] }),
  p("lean-reach", "前倾伸手", "standing", "前后脚站立", { hips:[8,0,0], torso:[17,-10,-3], head:[-12,14,0], rightArm:[-72,-8,20], rightForearm:[-8,0,-16], leftArm:[15,0,-25], leftLeg:[-18,0,-10], rightLeg:[20,0,14] }),
  p("lean-dodge", "仰身躲避", "standing", "前后脚站立", { hips:[-18,0,0], torso:[-22,8,5], head:[18,-8,0], leftArm:[-24,0,-45], rightArm:[-35,0,55], leftForearm:[0,0,80], rightForearm:[0,0,-95], leftLeg:[-30,0,-15], rightLeg:[22,0,22], leftShin:[40,0,0] }),
  p("head-guard", "双臂护头", "standing", "双脚分开站立", { torso:[17,0,0], head:[18,0,0], leftArm:[-35,0,-100], rightArm:[-35,0,100], leftForearm:[-35,0,-70], rightForearm:[-35,0,70], leftLeg:[-16,0,-15], rightLeg:[-16,0,15], leftShin:[22,0,0], rightShin:[22,0,0] }),
  p("boxing-guard", "双拳防守", "standing", "前后脚站立", { torso:[9,-18,0], chest:[0,8,0], head:[-5,10,0], leftArm:[-28,0,-48], rightArm:[-22,0,54], leftForearm:[-25,0,-106], rightForearm:[-25,0,112], leftLeg:[-22,0,-18], rightLeg:[14,0,20], leftShin:[28,0,0] }),
  p("jab-freeze", "前手直拳定格", "standing", "前后脚站立", { hips:[7,-18,0], torso:[12,-20,0], head:[-5,32,0], leftArm:[-88,0,-15], leftForearm:[0,0,7], rightArm:[-28,0,48], rightForearm:[-18,0,110], leftLeg:[-30,0,-15], rightLeg:[22,0,18], leftShin:[35,0,0] }),
  p("side-kick-freeze", "侧向踢腿定格", "standing", "单腿微屈站立", { hips:[0,0,-14], torso:[0,0,-23], head:[0,-30,15], rightLeg:[-12,0,86], rightShin:[12,0,0], rightFoot:[0,0,-12], leftLeg:[-6,0,-4], leftShin:[8,0,0], leftArm:[-15,0,-50], rightArm:[-28,0,60], rightForearm:[0,0,100] }),
  p("knee-up", "单腿提膝", "standing", "单腿微屈站立", { torso:[-6,0,2], head:[5,0,0], rightLeg:[-92,0,12], rightShin:[110,0,0], rightFoot:[20,0,0], leftArm:[-25,0,-28], rightArm:[22,0,22], leftForearm:[0,0,-90], rightForearm:[0,0,78] }),
  p("lunge-archer", "弓步拉弓", "standing", "前后脚站立", { hips:[0,55,0], torso:[5,16,0], head:[-3,-65,0], leftArm:[-15,0,-86], leftForearm:[0,0,-8], rightArm:[-10,0,95], rightForearm:[0,0,118], leftLeg:[-34,0,-22], rightLeg:[20,0,24], leftShin:[42,0,0] }, ["bow"], ["战斗"]),
  p("push-object", "双手推物", "standing", "前后脚站立", { hips:[10,0,0], torso:[20,0,0], head:[-16,0,0], leftArm:[-62,0,-25], rightArm:[-62,0,25], leftForearm:[-10,0,-15], rightForearm:[-10,0,15], leftLeg:[-34,0,-13], leftShin:[44,0,0], rightLeg:[20,0,16] }, ["box"]),
  p("shoulder-carry", "单肩扛物", "standing", "重心左移", { hips:[0,0,-6], torso:[5,0,9], head:[-3,-18,-5], leftArm:[-25,0,-105], leftForearm:[-35,0,-62], rightArm:[8,0,30], rightLeg:[12,0,18] }, ["bag"]),
  p("chest-carry", "抱物于胸前", "standing", "双脚分开站立", { torso:[-6,0,0], head:[10,0,0], leftArm:[-32,0,-27], rightArm:[-32,0,27], leftForearm:[-35,0,80], rightForearm:[-35,0,-80], leftHand:[0,0,16], rightHand:[0,0,-16], leftLeg:[-8,0,-14], rightLeg:[-8,0,14] }, ["box"]),
  p("walk-bag", "单手提袋行走", "walking", "自然行走", { torso:[5,0,-4], head:[-3,0,3], leftArm:[0,0,-17], leftForearm:[0,0,10], rightArm:[-30,0,20], rightForearm:[0,0,-35] }, ["bag"]),
  p("walk-pack", "背包行走", "walking", "大步行走", { torso:[12,0,0], head:[-9,0,0], leftArm:[-18,0,-23], rightArm:[-18,0,23], leftForearm:[-20,0,-90], rightForearm:[-20,0,90] }, ["backpack"]),
  p("walk-box", "双手抱箱行走", "walking", "缓慢行走", { torso:[-5,0,0], head:[8,0,0], leftArm:[-28,0,-26], rightArm:[-28,0,26], leftForearm:[-25,0,76], rightForearm:[-25,0,-76] }, ["box"]),
  p("walk-luggage", "拖行李行走", "walking", "自然行走", { torso:[6,-12,3], head:[-4,12,0], rightArm:[28,0,20], rightForearm:[0,0,-12], leftArm:[-34,0,-22] }, ["suitcase"]),
  p("walk-phone", "低头看手机行走", "walking", "缓慢行走", { torso:[7,0,0], head:[28,0,0], leftArm:[-20,0,-18], rightArm:[-26,0,20], leftForearm:[-40,0,80], rightForearm:[-40,0,-84] }, ["phone"]),
  p("tiptoe", "踮脚潜行", "walking", "向前迈步", { hips:[10,0,0], torso:[19,0,0], head:[-20,10,0], leftLeg:[-35,0,-12], rightLeg:[10,0,13], leftShin:[44,0,0], rightShin:[35,0,0], leftFoot:[28,0,0], rightFoot:[25,0,0], leftArm:[-24,0,-38], rightArm:[-20,0,38] }),
  p("step-up", "上台阶行走", "walking", "向前迈步", { torso:[17,0,0], head:[-12,0,0], leftLeg:[-76,0,-9], leftShin:[84,0,0], rightLeg:[6,0,10], rightShin:[12,0,0], leftArm:[25,0,-20], rightArm:[-35,0,22] }, ["steps"]),
  p("step-down", "下台阶行走", "walking", "向前迈步", { torso:[3,0,0], head:[20,0,0], leftLeg:[-20,0,-8], leftShin:[10,0,0], rightLeg:[-28,0,10], rightShin:[48,0,0], leftArm:[-8,0,-46], rightArm:[12,0,40] }, ["steps"]),
  p("run-item", "单手提物奔跑", "running", "正常跑步", { torso:[18,0,-5], head:[-14,0,3], leftArm:[10,0,-18], leftForearm:[0,0,24], rightArm:[-44,0,20], rightForearm:[0,0,92] }, ["bag"]),
  p("run-box", "双手抱箱奔跑", "running", "自然慢跑", { torso:[10,0,0], head:[-9,0,0], leftArm:[-30,0,-28], rightArm:[-30,0,28], leftForearm:[-25,0,86], rightForearm:[-25,0,-86] }, ["box"]),
  p("run-embrace", "张臂奔向前方", "running", "大跨步奔跑", { torso:[12,0,0], head:[-10,0,0], leftArm:[-35,0,-72], rightArm:[-35,0,72], leftForearm:[0,0,12], rightForearm:[0,0,-12] }),
  p("run-duck", "俯身避障奔跑", "running", "身体前倾奔跑", { hips:[22,0,0], torso:[30,0,0], head:[-25,0,0], leftArm:[-5,0,-50], rightArm:[-15,0,64], leftForearm:[0,0,-95], rightForearm:[0,0,104] }),
  p("run-stairs", "跨阶奔跑", "running", "大跨步奔跑", { torso:[23,0,0], head:[-17,0,0], leftLeg:[-88,0,-13], leftShin:[100,0,0], rightLeg:[28,0,14], rightShin:[48,0,0], leftArm:[32,0,-25], rightArm:[-50,0,26] }, ["steps"]),
  p("run-evade", "侧身避让奔跑", "running", "转弯奔跑", { hips:[10,25,12], torso:[12,-18,20], head:[-9,-18,-12], leftArm:[-35,0,-60], rightArm:[22,0,48], leftLeg:[-48,0,-28], rightLeg:[30,0,24] }),
  p("run-reach", "奔跑中伸手够物", "running", "快速奔跑", { torso:[26,-12,0], head:[-18,18,0], rightArm:[-88,0,16], rightForearm:[0,0,-12], leftArm:[32,0,-35] }),
  p("run-pack", "背负物品奔跑", "running", "正常跑步", { hips:[15,0,0], torso:[24,0,0], head:[-20,0,0], leftArm:[-22,0,-36], rightArm:[-22,0,36], leftForearm:[-18,0,-100], rightForearm:[-18,0,100] }, ["backpack"]),
  p("jump-back", "后撤跳", "jumping", "双腿腾空", { hips:[-14,0,0], torso:[10,0,0], head:[-8,0,0], leftLeg:[-34,0,-18], rightLeg:[-20,0,20], leftShin:[62,0,0], rightShin:[72,0,0], leftArm:[-42,0,-50], rightArm:[-38,0,56] }),
  p("jump-side", "侧向闪避跳", "jumping", "双腿腾空", { hips:[0,0,23], torso:[10,0,15], head:[-8,20,-20], leftLeg:[-30,0,-42], rightLeg:[-18,0,16], leftShin:[72,0,0], rightShin:[92,0,0], leftArm:[-12,0,-70], rightArm:[-25,0,80] }),
  p("jump-catch", "跳起接物", "jumping", "向上伸手跳", { torso:[-8,0,0], head:[-24,0,0], leftArm:[-145,0,-20], rightArm:[-145,0,20], leftForearm:[-8,0,25], rightForearm:[-8,0,-25], leftLeg:[15,0,-16], rightLeg:[-20,0,18] }, ["box"]),
  p("jump-throw", "跳起投掷", "jumping", "单腿起跳", { hips:[8,24,0], torso:[-12,-30,0], head:[-8,8,0], rightArm:[-125,0,65], rightForearm:[-70,0,35], leftArm:[-80,0,-24], rightLeg:[28,0,20], rightShin:[96,0,0] }, ["box"]),
  p("air-front-kick", "腾空前踢", "jumping", "双腿腾空", { torso:[-18,0,0], head:[12,0,0], leftLeg:[-100,0,-10], leftShin:[8,0,0], rightLeg:[30,0,16], rightShin:[100,0,0], leftArm:[-22,0,-65], rightArm:[18,0,70] }),
  p("air-side-kick", "腾空侧踢", "jumping", "张腿跳", { hips:[0,30,-15], torso:[0,-10,-25], head:[0,-25,20], rightLeg:[-8,0,98], rightShin:[5,0,0], leftLeg:[-20,0,-26], leftShin:[105,0,0], leftArm:[-15,0,-60], rightArm:[-22,0,75] }),
  p("air-dodge", "腾空后仰躲避", "jumping", "双腿腾空", { hips:[-22,0,0], torso:[-28,0,0], head:[20,0,0], leftLeg:[-55,0,-20], rightLeg:[-35,0,25], leftShin:[80,0,0], rightShin:[95,0,0], leftArm:[-18,0,-80], rightArm:[-12,0,90] }),
  p("vault-hand", "单手撑台越障", "jumping", "跨越障碍", { hips:[15,0,40], torso:[20,-15,-10], head:[-18,10,0], leftArm:[20,0,-25], leftForearm:[0,0,10], rightArm:[-90,0,68], leftLeg:[-65,0,-18], rightLeg:[-45,0,25] }, ["table"]),
  p("crouch-pick", "下蹲拾物", "squatting", "单手触地蹲", { torso:[40,6,-3], head:[10,-6,0], rightArm:[25,0,12], rightForearm:[10,0,-14], leftArm:[15,0,-32], leftForearm:[0,0,60] }, ["box"]),
  p("tie-shoe", "蹲姿系鞋带", "squatting", "深蹲", { torso:[45,0,0], head:[20,0,0], leftArm:[24,0,-12], rightArm:[24,0,12], leftForearm:[15,0,20], rightForearm:[15,0,-20], leftLeg:[-78,0,-16], rightLeg:[-68,0,15] }),
  p("crouch-peek", "蹲姿探身观察", "squatting", "自然蹲姿", { torso:[28,16,-8], head:[-20,-30,4], leftArm:[10,0,-25], rightArm:[-30,0,38], rightForearm:[0,0,90], leftLeg:[-76,0,-24], rightLeg:[-55,0,32] }),
  p("crouch-camera", "蹲姿举机拍摄", "squatting", "半蹲", { torso:[16,0,0], head:[-8,0,0], leftArm:[-48,0,-28], rightArm:[-48,0,28], leftForearm:[-44,0,84], rightForearm:[-44,0,-84] }, ["camera"]),
  p("crouch-carry", "蹲姿双手抱物", "squatting", "双腿分开蹲", { torso:[12,0,0], head:[12,0,0], leftArm:[-22,0,-34], rightArm:[-22,0,34], leftForearm:[-20,0,88], rightForearm:[-20,0,-88] }, ["box"]),
  p("crouch-sword", "蹲姿持剑防守", "squatting", "防御低蹲", { torso:[22,-20,0], head:[-10,25,0], rightArm:[-45,0,34], rightForearm:[-20,0,90], leftArm:[-25,0,-55], leftForearm:[0,0,-75] }, ["sword"]),
  p("crouch-archer", "蹲姿拉弓", "squatting", "单腿侧伸低蹲", { torso:[20,55,0], head:[-16,-55,0], leftArm:[-10,0,-85], rightArm:[-15,0,85], leftForearm:[0,0,-10], rightForearm:[0,0,120] }, ["bow"]),
  p("crouch-toes", "踮脚窄距蹲", "squatting", "双腿并拢蹲", { torso:[15,0,0], head:[-12,0,0], leftFoot:[35,0,0], rightFoot:[35,0,0], leftLeg:[-82,0,-5], rightLeg:[-82,0,5], leftArm:[-45,0,-16], rightArm:[-45,0,16] }),
  p("sit-reach-back", "坐姿后转取物", "sitting", "自然正坐", { torso:[8,38,0], head:[-4,25,0], rightArm:[22,15,40], rightForearm:[0,0,-15], leftArm:[12,0,-18] }, ["chair","box"]),
  p("sit-offer", "坐姿前伸递物", "sitting", "身体前倾坐", { torso:[18,0,0], head:[-12,0,0], rightArm:[-66,0,20], rightForearm:[-10,0,-20], leftArm:[12,0,-14] }, ["chair","box"]),
  p("sit-phone", "坐姿低头看手机", "sitting", "自然正坐", { torso:[10,0,0], head:[28,0,0], leftArm:[-20,0,-16], rightArm:[-20,0,16], leftForearm:[-35,0,86], rightForearm:[-35,0,-86] }, ["chair","phone"]),
  p("sit-type", "坐姿双手打字", "sitting", "自然正坐", { torso:[14,0,0], head:[12,0,0], leftArm:[-30,0,-18], rightArm:[-30,0,18], leftForearm:[-20,0,65], rightForearm:[-20,0,-65], leftHand:[-18,0,0], rightHand:[-18,0,0] }, ["chair","table"]),
  p("sit-cup", "坐姿端杯", "sitting", "自然正坐", { torso:[-3,5,0], head:[7,-10,0], rightArm:[-22,0,28], rightForearm:[-45,0,85], leftArm:[10,0,-15] }, ["chair","cup"]),
  p("sit-carry", "坐姿抱物", "sitting", "双腿打开坐", { torso:[-5,0,0], head:[14,0,0], leftArm:[-20,0,-28], rightArm:[-20,0,28], leftForearm:[-25,0,90], rightForearm:[-25,0,-90] }, ["chair","box"]),
  p("sit-cover-face", "坐姿掩面", "sitting", "身体前倾坐", { torso:[28,0,0], head:[24,0,0], leftArm:[-35,0,-30], rightArm:[-35,0,30], leftForearm:[-55,0,110], rightForearm:[-55,0,-110] }, ["chair"]),
  p("sit-signal", "坐姿抬手示意", "sitting", "自然正坐", { torso:[0,-8,0], head:[-6,16,0], rightArm:[-60,0,100], rightForearm:[-35,0,30], leftArm:[14,0,-14] }, ["chair"]),
  p("chair-edge", "侧坐椅沿", "sitting", "侧坐", { hips:[0,35,0], torso:[10,-20,4], head:[-5,-15,0], leftLeg:[-72,20,-8], rightLeg:[-50,20,15], leftArm:[10,0,-18], rightArm:[18,0,32] }, ["chair"]),
  p("chair-reverse", "反向骑坐椅子", "sitting", "双腿打开坐", { hips:[0,180,0], torso:[15,0,0], head:[-12,25,0], leftArm:[-45,0,-25], rightArm:[-45,0,25], leftForearm:[-25,0,60], rightForearm:[-25,0,-60], leftLeg:[-68,0,-42], rightLeg:[-68,0,42] }, ["chair"]),
  p("sit-step", "坐台阶单腿下垂", "sitting", "单腿屈膝坐", { torso:[8,0,-5], head:[-5,12,0], leftLeg:[-94,0,-22], leftShin:[106,0,0], rightLeg:[-42,0,15], rightShin:[55,0,0], leftArm:[10,0,-32], rightArm:[14,0,20] }, ["steps"]),
  p("sit-curled", "坐地抱膝蜷缩", "sitting", "双腿屈膝坐", { hips:[-12,0,0], torso:[32,0,0], head:[26,0,0], leftLeg:[-112,0,-8], rightLeg:[-112,0,8], leftShin:[125,0,0], rightShin:[125,0,0], leftArm:[-25,0,-35], rightArm:[-25,0,35], leftForearm:[-15,0,95], rightForearm:[-15,0,-95] }),
  p("kneel-reach", "跪姿双手前伸", "kneeling", "双膝跪地", { torso:[17,0,0], head:[-12,0,0], leftArm:[-70,0,-24], rightArm:[-70,0,24], leftForearm:[-8,0,12], rightForearm:[-8,0,-12] }),
  p("kneel-lift", "跪姿举物", "kneeling", "双膝跪地", { torso:[-8,0,0], head:[-22,0,0], leftArm:[-132,0,-24], rightArm:[-132,0,24], leftForearm:[-10,0,24], rightForearm:[-10,0,-24] }, ["box"]),
  p("kneel-prayer", "跪姿合掌", "kneeling", "跪坐", { torso:[6,0,0], head:[18,0,0], leftArm:[-20,0,-35], rightArm:[-20,0,35], leftForearm:[-45,0,115], rightForearm:[-45,0,-115] }),
  p("kneel-face", "跪姿掩面", "kneeling", "跪坐", { torso:[25,0,0], head:[25,0,0], leftArm:[-35,0,-28], rightArm:[-35,0,28], leftForearm:[-50,0,110], rightForearm:[-50,0,-110] }),
  p("kneel-bow", "单膝跪姿拉弓", "kneeling", "单膝跪地", { torso:[12,50,0], head:[-8,-50,0], leftArm:[-12,0,-85], rightArm:[-10,0,90], leftForearm:[0,0,-8], rightForearm:[0,0,120] }, ["bow"]),
  p("kneel-sword", "单膝跪姿持剑", "kneeling", "战斗半跪", { torso:[12,-15,0], head:[-6,20,0], rightArm:[-45,0,28], rightForearm:[-30,0,92], leftArm:[-18,0,-60] }, ["sword"]),
  p("kneel-inspect", "跪姿俯身查看物品", "kneeling", "跪姿身体前倾", { torso:[42,0,0], head:[18,0,0], leftArm:[25,0,-16], rightArm:[18,0,26], leftForearm:[10,0,20], rightForearm:[10,0,-32] }, ["box"]),
  p("kneel-help", "单膝跪姿伸手扶人", "kneeling", "单膝半跪", { torso:[23,-12,-3], head:[-15,15,0], rightArm:[-65,0,26], rightForearm:[-12,0,-22], leftArm:[12,0,-20], leftForearm:[0,0,55] }),
  p("supine-head", "仰躺抬头", "lying", "自然仰躺", { torso:[12,0,0], neck:[12,0,0], head:[20,0,0], leftArm:[8,0,-20], rightArm:[8,0,20], leftLeg:[-5,0,-8], rightLeg:[-5,0,8] }),
  p("supine-legs", "仰躺双腿抬起", "lying", "自然仰躺", { torso:[7,0,0], head:[8,0,0], leftLeg:[-85,0,-7], rightLeg:[-85,0,7], leftShin:[12,0,0], rightShin:[12,0,0], leftArm:[5,0,-25], rightArm:[5,0,25] }),
  p("supine-reach", "仰躺侧伸取物", "lying", "自然仰躺", { torso:[6,18,0], head:[0,45,0], rightArm:[-20,0,85], rightForearm:[0,0,-15], leftLeg:[-20,0,-12], leftShin:[30,0,0] }, ["box"]),
  p("side-carry", "侧卧抱物", "lying", "左侧卧", { torso:[12,0,0], head:[10,-8,0], leftArm:[-35,0,-20], rightArm:[-45,0,35], leftForearm:[-20,0,85], rightForearm:[-20,0,-100], leftLeg:[-30,0,-5], rightLeg:[-40,0,8] }, ["box"]),
  p("side-guard", "侧卧护头", "lying", "左侧卧", { torso:[20,0,0], head:[18,0,0], leftArm:[-45,0,-85], rightArm:[-40,0,100], leftForearm:[-40,0,-90], rightForearm:[-40,0,100], leftLeg:[-55,0,-4], rightLeg:[-65,0,6] }),
  p("curl-reach", "蜷缩侧卧伸手", "lying", "蜷缩侧卧", { torso:[25,10,0], head:[-8,-25,0], rightArm:[-80,0,20], rightForearm:[0,0,-12], leftArm:[-30,0,-30], leftForearm:[0,0,100], rightLeg:[-85,0,12] }),
  p("prone-pillow", "俯卧双手枕额", "prone", "自然俯卧", { torso:[-4,0,0], head:[5,0,0], leftArm:[-90,0,-55], rightArm:[-90,0,55], leftForearm:[0,0,110], rightForearm:[0,0,-110], leftLeg:[5,0,-10], rightLeg:[5,0,10] }),
  p("prone-cheek", "俯卧侧脸贴地", "prone", "自然俯卧", { torso:[-2,0,0], neck:[0,25,0], head:[5,55,0], leftArm:[-15,0,-20], rightArm:[-65,0,60], rightForearm:[0,0,100], leftLeg:[0,0,-6], rightLeg:[-10,0,16] }),
  p("prone-carry", "俯卧抱物护胸", "prone", "双肘撑起", { torso:[-10,0,0], head:[18,0,0], leftArm:[-30,0,-26], rightArm:[-30,0,26], leftForearm:[-20,0,110], rightForearm:[-20,0,-110], leftLeg:[5,0,-14], rightLeg:[5,0,14] }, ["box"]),
  p("prone-guard", "俯卧单手护头", "prone", "自然俯卧", { torso:[5,-10,0], head:[10,40,0], rightArm:[-75,0,95], rightForearm:[-25,0,110], leftArm:[-35,0,-20], leftForearm:[0,0,35], rightLeg:[-18,0,18], rightShin:[35,0,0] }),
  p("wall-foot", "单脚抵墙倚靠", "leaning", "背靠墙站立", { torso:[-5,0,0], head:[3,15,0], rightLeg:[25,0,20], rightShin:[-90,0,0], rightFoot:[18,0,0], leftArm:[4,0,-18], rightArm:[8,0,28] }, ["wall"]),
  p("wall-forehead", "额头抵墙", "leaning", "双手撑墙", { hips:[10,0,0], torso:[28,0,0], head:[20,0,0], leftArm:[-70,0,-30], rightArm:[-70,0,30], leftForearm:[-25,0,30], rightForearm:[-25,0,-30] }, ["wall"]),
  p("desk-rest", "双臂交叠伏桌", "leaning", "双手撑桌", { hips:[15,0,0], torso:[48,0,0], head:[28,15,0], leftArm:[-30,0,-35], rightArm:[-30,0,35], leftForearm:[-15,0,115], rightForearm:[-15,0,-115] }, ["table"]),
  p("chair-hand", "单手扶椅背", "leaning", "单手撑桌", { torso:[12,12,-4], head:[-8,-15,0], leftArm:[-42,0,-20], leftForearm:[-12,0,20], rightArm:[8,0,25], rightLeg:[15,0,16] }, ["chair"]),
  p("rail-elbows", "双肘压栏杆前倾", "leaning", "双手扶栏杆", { hips:[8,0,0], torso:[30,0,0], head:[-20,0,0], leftArm:[-32,0,-30], rightArm:[-32,0,30], leftForearm:[-30,0,95], rightForearm:[-30,0,-95] }, ["rail"]),
  p("wall-slide-sit", "背靠墙滑坐", "leaning", "双腿前伸坐", { hips:[-10,0,0], torso:[-8,0,0], head:[18,0,0], leftLeg:[-70,0,-15], rightLeg:[-50,0,18], leftShin:[65,0,0], rightShin:[35,0,0], leftArm:[8,0,-25], rightArm:[8,0,25] }, ["wall"]),
  p("table-cup", "侧腰倚桌持杯", "leaning", "臀部倚桌", { hips:[0,15,12], torso:[-5,-10,-8], head:[4,-12,0], rightArm:[-25,0,35], rightForearm:[-45,0,95], leftArm:[15,0,-28] }, ["table","cup"]),
  p("column-look", "肩靠柱回头", "leaning", "单肩靠墙", { hips:[0,15,8], torso:[-5,22,10], head:[-4,58,-5], leftArm:[8,0,-24], rightArm:[8,0,30], leftLeg:[-4,0,-10], rightLeg:[22,0,22] }, ["column"]),
  p("side-plank", "侧向单臂支撑", "ground", "单肘撑起侧卧", { hips:[0,0,85], torso:[0,0,-4], head:[0,-15,0], leftArm:[0,0,-5], leftForearm:[0,0,8], rightArm:[0,0,155], rightForearm:[0,0,5], leftLeg:[0,0,-2], rightLeg:[0,0,4] }),
  p("reverse-plank", "反向平板支撑", "ground", "坐地后撑", { hips:[-65,0,0], torso:[-8,0,0], head:[12,0,0], leftArm:[38,0,-15], rightArm:[38,0,15], leftForearm:[0,0,8], rightForearm:[0,0,-8], leftLeg:[0,0,-8], rightLeg:[0,0,8], leftShin:[0,0,0], rightShin:[0,0,0] }),
  p("bridge", "仰卧桥式支撑", "ground", "双腿屈膝仰躺", { hips:[-70,0,0], torso:[-15,0,0], head:[16,0,0], leftLeg:[-45,0,-18], rightLeg:[-45,0,18], leftShin:[95,0,0], rightShin:[95,0,0], leftArm:[10,0,-20], rightArm:[10,0,20] }),
  p("ground-side-shift", "单手撑地侧向转移", "ground", "单手撑地起身", { hips:[20,20,25], torso:[28,-15,-12], head:[-18,-10,0], leftArm:[30,0,-15], leftForearm:[0,0,10], rightArm:[-50,0,80], leftLeg:[-65,0,-35], rightLeg:[15,0,45], rightShin:[30,0,0] }),
  p("fall-forward-brace", "前扑双手撑地", "ground", "俯卧撑准备", { hips:[55,0,0], torso:[18,0,0], head:[-20,0,0], leftArm:[-30,0,-30], rightArm:[-30,0,30], leftForearm:[-12,0,22], rightForearm:[-12,0,-22], leftLeg:[12,0,-16], rightLeg:[22,0,20], rightShin:[45,0,0] }),
  p("fall-back-brace", "后仰双手撑地缓冲", "ground", "跌坐", { hips:[-32,0,0], torso:[-22,0,0], head:[25,0,0], leftArm:[35,0,-35], rightArm:[35,0,35], leftForearm:[0,0,15], rightForearm:[0,0,-15], leftLeg:[-55,0,-24], rightLeg:[-40,0,28], leftShin:[65,0,0], rightShin:[45,0,0] }),
];

// Only independently inspected, prop-free definitions pass the release gate.
const reviewedStatic=new Set(["bow","lean-reach","lean-dodge","head-guard","side-kick-freeze","knee-up","run-duck","run-evade","kneel-reach","kneel-face"].map(id=>`pose-v35-${id}`));
for(const pose of authoredPoseExpansion)if(reviewedStatic.has(pose.id))pose.release="ready";
export const authoredPoseByName = new Map(authoredPoseExpansion.map((pose) => [pose.name, pose]));
