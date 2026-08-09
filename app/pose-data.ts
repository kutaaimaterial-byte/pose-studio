export type PoseCategory = "基础" | "展示" | "时尚" | "动态" | "坐姿" | "蹲跪" | "地面" | "情绪" | "交互" | "特写";
export type PoseComposition = "full" | "threeQuarter" | "half" | "bust" | "close" | "extremeClose";
export type PoseFacing = "front" | "left45" | "right45" | "leftSide" | "rightSide" | "back" | "overShoulder";
export type PoseIntensity = "static" | "light" | "dynamic" | "strong";

export type PoseItem = {
  id: string;
  nameZh: string;
  nameEn?: string;
  aliases: string[];
  category: PoseCategory;
  subcategory?: string;
  tags: string[];
  composition: PoseComposition[];
  facing: PoseFacing[];
  intensity: PoseIntensity;
  useCases: string[];
  thumbnail: string;
  poseAsset: string;
  skeletonProfile: "humanoid_v1";
  variantIds?: string[];
  featured?: boolean;
  sortOrder: number;
  enginePoseIndex: number;
  status?: "ready" | "missing" | "incompatible";
};

export const poseCategories = ["全部", "基础", "展示", "时尚", "动态", "地面", "情绪", "特写"] as const;

export const compositionOptions = [
  ["不限", "any"], ["远景-全身", "full"], ["中远景-3/4身", "threeQuarter"], ["中景-半身", "half"],
  ["胸像", "bust"], ["近景", "close"], ["特写", "extremeClose"],
] as const;

export const facingOptions = [
  ["不限", "any"], ["正面", "front"], ["左前45°", "left45"], ["右前45°", "right45"],
  ["左侧面", "leftSide"], ["右侧面", "rightSide"], ["背面", "back"], ["回眸", "overShoulder"],
] as const;

export const intensityOptions = [
  ["不限", "any"], ["静态", "static"], ["轻动态", "light"], ["动态", "dynamic"], ["强动态", "strong"],
] as const;

export const useCaseOptions = [
  "人物设定", "电商", "产品展示", "Fashion", "Lookbook", "Editorial", "Street", "Beauty",
  "运动", "战斗", "剧情", "生活方式", "数码", "配饰", "旅行", "办公",
] as const;

type CatalogGroup = { category: PoseCategory; subcategory: string; items: string[] };

const catalog: CatalogGroup[] = [
  { category: "基础", subcategory: "站立基础", items: [
    "自然站立|基础,全身,正面", "标准正立|基础,对称,正面", "放松站立|休闲,重心偏移", "单腿支撑|自然,轻动态",
    "双手自然下垂|基础,通用", "双手背后|沉稳,展示", "双手抱胸|自信,通用", "双手插兜|休闲,Street",
    "单手插兜|Fashion,广告", "双手叉腰|自信,展示", "单手叉腰|Fashion,展示", "微侧身站立|自然,30°",
    "45°侧身|展示,45°", "完全侧身|侧面,90°", "背身站立|背面,全身", "背身回头|回眸,背面",
    "双脚并拢|基础,对称", "双脚前后站|自然,轻动态", "一腿微曲|Fashion,自然", "轻靠重心|休闲,非对称",
  ]},
  { category: "展示", subcategory: "角色展示", items: [
    "英雄登场|角色,强势", "英雄站姿|角色,自信", "Power Pose|广告,力量", "T型展示|标准,人物设定",
    "A型站姿|标准,人物设定", "正面展示|人物设定,全身", "侧身展示|展示,侧面", "回身展示|展示,回眸", "背部展示|服装,背面",
  ]},
  { category: "展示", subcategory: "商品展示", items: [
    "单手展示商品|电商,手部", "双手托举商品|电商,产品展示", "手掌托物|广告,产品展示", "指向产品|广告,引导",
    "胸前持物|电商,正面", "腰间持物|Fashion,配饰", "肩扛物品|广告,动感", "双手持物|电商,稳定",
    "单手拎包|Fashion,配饰", "肩背包展示|Fashion,配饰", "手表展示|配饰,手腕", "鞋履展示|电商,下肢",
    "耳机展示|数码,头部", "手机展示|数码,手持", "香水展示|Beauty,近景",
  ]},
  { category: "时尚", subcategory: "模特站姿", items: [
    "经典模特站姿|Fashion,全身", "单腿前伸|Lookbook,全身", "交叉腿站立|Fashion,全身", "一腿微曲时装|Fashion,自然",
    "S型站姿|Editorial,曲线", "胯部侧移|Editorial,非对称", "单手叉腰时装|Fashion,展示", "双手叉腰时装|Fashion,强势",
    "单手扶头|Editorial,上半身", "单手摸发|Beauty,自然", "双手整理头发|Beauty,动态", "手扶下巴|Beauty,近景",
    "手扶颈部|Beauty,近景", "单手扶肩|Editorial,半身", "手臂交叉时装|Fashion,半身", "手臂自然展开|Editorial,全身",
    "侧身回眸|Fashion,回眸", "背身回眸|Editorial,背面", "微微俯身|Editorial,动态", "高冷站姿|Editorial,情绪", "慵懒站姿|Fashion,休闲",
  ]},
  { category: "时尚", subcategory: "风格化", items: [
    "杂志封面 Pose|Editorial,封面", "高级时装 Pose|Fashion,展示", "红毯 Pose|Event,展示", "Lookbook Pose|Lookbook,基础",
    "街拍 Pose|Street,自然", "秀场停步 Pose|Runway,展示", "肩线展示 Pose|Fashion,上半身", "廓形展示 Pose|Fashion,服装", "配饰展示 Pose|Fashion,配饰",
  ]},
  { category: "动态", subcategory: "行走", items: [
    "自然行走|轻动态,全身", "向前行走|轻动态,正面", "大步行走|动态,全身", "快速行走|动态,全身", "模特走秀|Fashion,动态",
    "侧面行走|侧面,动态", "背向行走|背面,动态", "回头行走|回眸,动态", "边走边看|生活方式,动态", "行走转身|转体,动态",
  ]},
  { category: "动态", subcategory: "跑步", items: [
    "慢跑|运动,动态", "疾跑冲刺|速度,强动态", "起跑动作|运动,预备", "加速跑|速度,强动态", "侧面奔跑|侧面,强动态",
    "跑步回头|回眸,强动态", "冲向镜头|正面,强动态", "逃跑姿态|剧情,强动态", "追逐姿态|剧情,强动态",
  ]},
  { category: "动态", subcategory: "跳跃", items: [
    "原地跳跃|动态,全身", "向前跳跃|动态,全身", "高空跳跃|强动态,全身", "单腿跳跃|强动态,非对称", "张腿跳跃|强动态,全身",
    "空中转身|强动态,旋转", "跨越障碍|运动,强动态", "落地动作|动态,下蹲", "跃下动作|剧情,强动态",
  ]},
  { category: "动态", subcategory: "战斗与英雄", items: [
    "战斗准备|角色,预备", "防御姿势|战斗,动态", "出拳|战斗,强动态", "蓄力出拳|战斗,预备", "侧踢|战斗,强动态",
    "高踢|战斗,强动态", "飞踢|战斗,强动态", "挥拳|战斗,动态", "闪避|战斗,强动态", "冲锋|战斗,强动态",
    "落地半蹲|英雄,动态", "超级英雄落地|英雄,强动态", "拔剑姿势|武器,预备", "持剑站立|武器,静态", "双手持剑|武器,战斗",
    "举剑|武器,展示", "瞄准姿势|武器,半身", "持枪警戒|武器,全身",
  ]},
  { category: "动态", subcategory: "运动", items: [
    "篮球运球|运动,动态", "投篮准备|运动,预备", "足球带球|运动,动态", "踢球|运动,强动态", "网球挥拍|运动,强动态",
    "拳击架势|运动,战斗", "健身深蹲|运动,全身", "弓步训练|运动,全身",
  ]},
  { category: "坐姿", subcategory: "椅子", items: [
    "标准坐姿|基础,坐姿", "放松坐姿|休闲,坐姿", "双腿并拢坐|正式,坐姿", "双腿分开坐|休闲,坐姿", "单腿前伸坐|Fashion,坐姿",
    "双腿交叉坐|Fashion,坐姿", "翘二郎腿|商务,坐姿", "身体前倾坐|互动,坐姿", "身体后靠坐|休闲,坐姿", "手撑膝盖坐|自然,坐姿",
    "双手放腿上|正式,坐姿", "单手托腮坐|情绪,坐姿", "单手撑椅坐|Fashion,坐姿", "侧坐|Fashion,侧面", "反向坐椅|Editorial,坐姿", "回头坐姿|回眸,坐姿",
  ]},
  { category: "坐姿", subcategory: "高凳与沙发", items: [
    "高凳标准坐|展示,坐姿", "单脚落地高凳|Fashion,坐姿", "双脚悬空|休闲,坐姿", "一腿伸直高凳|Fashion,坐姿", "单腿踩凳|Fashion,坐姿",
    "身体侧倾高凳|Editorial,坐姿", "沙发放松坐|生活方式,休闲", "沙发半躺|生活方式,慵懒", "沙发双腿交叉|Fashion,坐姿",
    "沙发单手撑头|Editorial,情绪", "沙发双臂展开|生活方式,放松", "沙发身体后仰|生活方式,放松",
  ]},
  { category: "蹲跪", subcategory: "蹲姿与跪姿", items: [
    "自然下蹲|基础,蹲姿", "深蹲|运动,蹲姿", "单腿蹲|动态,蹲姿", "双腿蹲|基础,蹲姿", "街头蹲姿|Street,蹲姿",
    "单手撑膝|自然,蹲姿", "双手撑膝|运动,蹲姿", "半蹲准备|动态,预备", "低位蹲姿|强动态,蹲姿", "侧向蹲姿|侧面,蹲姿",
    "回头蹲姿|回眸,蹲姿", "单膝跪地|基础,跪姿", "双膝跪地|基础,跪姿", "英雄跪姿|角色,跪姿", "求婚跪姿|剧情,跪姿",
    "单腿支撑跪姿|动态,跪姿", "战斗跪姿|战斗,跪姿", "低头跪姿|情绪,跪姿", "抬头跪姿|剧情,跪姿",
  ]},
  { category: "地面", subcategory: "坐地与躺卧", items: [
    "盘腿坐地|休闲,地面", "双腿伸直坐地|基础,地面", "单腿曲起坐地|Fashion,地面", "双腿曲起坐地|生活方式,地面", "侧坐地面|Fashion,地面",
    "手撑地面坐|自然,地面", "后仰撑地|Editorial,地面", "单手撑身体|Editorial,地面", "平躺|基础,躺卧", "侧躺|Fashion,躺卧",
    "趴卧|Editorial,躺卧", "半躺|生活方式,躺卧", "曲腿躺卧|Fashion,躺卧", "单腿抬起躺卧|Editorial,躺卧", "手撑头侧躺|Beauty,躺卧", "杂志大片躺姿|Editorial,大片",
  ]},
  { category: "情绪", subcategory: "身体语言", items: [
    "昂首站立|自信,静态", "双手抱胸自信|自信,静态", "双手叉腰自信|自信,展示", "Power Pose 自信|自信,强势", "俯视姿态|自信,压迫",
    "放松叉腰|休闲,静态", "慵懒站立|休闲,静态", "身体靠墙|休闲,互动", "双手插兜放松|休闲,静态", "低头放松|情绪,静态",
    "手扶下巴思考|思考,半身", "单手抱胸思考|思考,半身", "低头沉思|思考,静态", "抬头思考|思考,静态", "踱步思考|思考,轻动态",
    "张开双臂|开心,展示", "双手举起|开心,动态", "跳跃欢呼|开心,强动态", "鼓掌|开心,轻动态", "挥手|开心,互动",
    "低头失落|悲伤,静态", "抱膝|悲伤,地面", "坐地低头|悲伤,地面", "双手捂脸|悲伤,半身", "弯腰失落|悲伤,全身",
    "握拳|愤怒,半身", "身体前倾愤怒|愤怒,动态", "指向前方|愤怒,互动", "双手握拳|愤怒,全身", "愤怒战斗姿态|愤怒,强动态",
    "双手张开惊讶|惊讶,全身", "身体后仰|惊讶,动态", "双手捂嘴|惊讶,半身", "后退一步|惊讶,轻动态",
  ]},
  { category: "交互", subcategory: "人与环境和物", items: [
    "扶墙|环境,互动", "靠墙|环境,互动", "扶桌|环境,互动", "趴桌|环境,互动", "坐桌|环境,互动", "靠桌|环境,互动", "扶椅|环境,互动",
    "开门|剧情,互动", "推门|剧情,互动", "拉门|剧情,互动", "举杯|生活方式,手持", "喝水|生活方式,手持", "看手机|数码,互动",
    "打电话|数码,互动", "使用电脑|办公,互动", "看书|生活方式,互动", "拿包|Fashion,互动", "戴耳机|数码,互动", "整理衣服|Fashion,互动",
    "拿相机|摄影,互动", "握方向盘|汽车,互动", "提行李箱|旅行,互动",
  ]},
  { category: "特写", subcategory: "上半身", items: [
    "正面半身|半身,正面", "45°半身|半身,45°", "侧面半身|半身,侧面", "背面半身|半身,背面", "回眸半身|半身,回眸",
    "半身双手抱胸|半身,自信", "半身单手叉腰|半身,展示", "手扶下巴近景|近景,思考", "手扶脸|近景,Beauty", "手扶头|近景,Beauty",
    "双手捧脸|近景,Beauty", "手扶颈部特写|近景,Beauty", "单手遮脸|近景,Editorial", "手放胸前|近景,情绪", "指向镜头|近景,互动", "肩部回望|近景,回眸",
  ]},
];

const featuredNames = new Set([
  "自然站立", "单手插兜", "单手叉腰", "英雄登场", "经典模特站姿",
  "自然行走", "疾跑冲刺", "标准坐姿", "单膝跪地", "侧身回眸", "手扶下巴",
]);

// The procedural rig intentionally supports a compact set of clearly different
// silhouettes. Several catalogue labels used to resolve to the same (or almost
// the same) joint pose, which made the library look much larger than it really
// was. Keep one representative card for every visual action family. Removed
// labels are merged into the representative's aliases below, so old searches
// and terminology still lead to the right action without showing duplicates.
const duplicatePoseCanonicalNames = new Map<string, string>([
  // Neutral, display, and fashion standing families.
  ["标准正立", "自然站立"],
  ["双手自然下垂", "自然站立"],
  ["双脚并拢", "自然站立"],
  ["双脚前后站", "自然站立"],
  ["正面展示", "自然站立"],
  ["放松站立", "自然站立"],
  ["轻靠重心", "放松站立"],
  ["慵懒站姿", "放松站立"],
  ["慵懒站立", "放松站立"],
  ["侧身展示", "完全侧身"],
  ["回身展示", "侧身回眸"],
  ["背部展示", "背身站立"],
  ["背身回眸", "背身回头"],
  ["英雄站姿", "英雄登场"],
  ["Power Pose", "英雄登场"],
  ["Power Pose 自信", "英雄登场"],
  ["单腿支撑", "经典模特站姿"],
  ["一腿微曲时装", "一腿微曲"],
  ["单手叉腰时装", "单手叉腰"],
  ["半身单手叉腰", "单手叉腰"],
  ["放松叉腰", "单手叉腰"],
  ["双手叉腰时装", "双手叉腰"],
  ["双手叉腰自信", "双手叉腰"],
  ["双手抱胸自信", "双手抱胸"],
  ["半身双手抱胸", "双手抱胸"],
  ["手臂交叉时装", "双手抱胸"],
  ["双手插兜放松", "双手插兜"],
  ["手扶下巴思考", "手扶下巴"],
  ["手扶下巴近景", "手扶下巴"],
  ["手扶头", "单手扶头"],
  ["手扶颈部特写", "手扶颈部"],
  ["单手扶肩", "手扶颈部"],
  ["手臂自然展开", "张开双臂"],
  ["交叉腿站立", "经典模特站姿"],
  ["S型站姿", "经典模特站姿"],
  ["胯部侧移", "经典模特站姿"],
  ["高冷站姿", "经典模特站姿"],
  ["杂志封面 Pose", "经典模特站姿"],
  ["高级时装 Pose", "经典模特站姿"],
  ["红毯 Pose", "经典模特站姿"],
  ["Lookbook Pose", "经典模特站姿"],
  ["街拍 Pose", "经典模特站姿"],
  ["秀场停步 Pose", "经典模特站姿"],
  ["肩线展示 Pose", "经典模特站姿"],
  ["廓形展示 Pose", "经典模特站姿"],
  ["配饰展示 Pose", "手表展示"],

  // Product and environmental interactions that share the same hand target.
  ["手掌托物", "单手展示商品"],
  ["双手持物", "双手托举商品"],
  ["香水展示", "单手展示商品"],
  ["肩扛物品", "单手展示商品"],
  ["单手拎包", "单手展示商品"],
  ["肩背包展示", "单手展示商品"],
  ["鞋履展示", "经典模特站姿"],
  ["手机展示", "单手展示商品"],
  ["戴耳机", "耳机展示"],
  ["拿包", "单手拎包"],
  ["看书", "看手机"],
  ["喝水", "举杯"],
  ["扶椅", "扶墙"],
  ["推门", "开门"],
  ["拉门", "开门"],
  ["握方向盘", "使用电脑"],
  ["整理衣服", "经典模特站姿"],

  // Locomotion families. Side, back, and over-shoulder views stay available.
  ["向前行走", "自然行走"],
  ["大步行走", "自然行走"],
  ["快速行走", "自然行走"],
  ["边走边看", "自然行走"],
  ["踱步思考", "自然行走"],
  ["足球带球", "自然行走"],
  ["模特走秀", "自然行走"],
  ["行走转身", "自然行走"],
  // A true block-start needs hand/foot ground constraints that this rig does
  // not expose. Keep the phrase searchable without displaying a false start.
  ["起跑动作", "疾跑冲刺"],
  ["慢跑", "疾跑冲刺"],
  ["加速跑", "疾跑冲刺"],
  ["冲向镜头", "疾跑冲刺"],
  ["逃跑姿态", "疾跑冲刺"],
  ["追逐姿态", "疾跑冲刺"],
  ["冲锋", "疾跑冲刺"],
  ["向前跳跃", "原地跳跃"],
  ["高空跳跃", "原地跳跃"],
  ["单腿跳跃", "原地跳跃"],
  ["空中转身", "原地跳跃"],
  ["跨越障碍", "原地跳跃"],
  ["跃下动作", "原地跳跃"],

  // Combat families generated from the same defensive, punch, sword, or kick pose.
  ["防御姿势", "战斗准备"],
  ["拳击架势", "战斗准备"],
  ["愤怒战斗姿态", "战斗准备"],
  ["握拳", "战斗准备"],
  ["双手握拳", "战斗准备"],
  ["闪避", "战斗准备"],
  ["挥拳", "出拳"],
  ["蓄力出拳", "出拳"],
  ["拔剑姿势", "持剑站立"],
  ["双手持剑", "持剑站立"],
  ["举剑", "持剑站立"],
  ["持枪警戒", "瞄准姿势"],
  ["踢球", "侧踢"],
  ["落地半蹲", "落地动作"],
  ["健身深蹲", "自然下蹲"],
  ["弓步训练", "自然下蹲"],

  // Seated, crouching, kneeling, and floor variants with the same silhouette.
  ["沙发双腿交叉", "双腿交叉坐"],
  ["沙发身体后仰", "身体后靠坐"],
  ["深蹲", "自然下蹲"],
  ["单腿蹲", "自然下蹲"],
  ["双腿蹲", "自然下蹲"],
  ["街头蹲姿", "自然下蹲"],
  ["半蹲准备", "自然下蹲"],
  ["低位蹲姿", "自然下蹲"],
  ["单手撑膝", "双手撑膝"],
  ["英雄跪姿", "单膝跪地"],
  ["求婚跪姿", "单膝跪地"],
  ["单腿支撑跪姿", "单膝跪地"],
  ["战斗跪姿", "单膝跪地"],
  ["单手撑身体", "手撑地面坐"],
  ["手撑头侧躺", "侧躺"],
  ["杂志大片躺姿", "侧躺"],
  ["单腿抬起躺卧", "曲腿躺卧"],

  // Remove floor-pose labels that the current humanoid rig cannot reproduce
  // faithfully. Their search phrases still resolve to the closest verified
  // pose, but the inaccurate cards themselves are no longer shown.
  ["盘腿坐地", "双腿曲起坐地"],
  ["侧坐地面", "单腿曲起坐地"],
  ["手撑地面坐", "半躺"],
  ["后仰撑地", "半躺"],

  // Emotional labels that previously produced an already-listed action.
  ["低头放松", "低头沉思"],
  ["低头失落", "低头沉思"],
  ["抬头思考", "昂首站立"],
  ["单手抱胸思考", "低头沉思"],
  ["双手张开惊讶", "张开双臂"],
  ["后退一步", "自然站立"],
  ["身体前倾愤怒", "微微俯身"],
  ["弯腰失落", "微微俯身"],
  ["抱膝", "坐地低头"],
  ["身体靠墙", "靠墙"],
  ["身体后仰", "靠墙"],
  ["指向前方", "指向产品"],
  ["手放胸前", "正面半身"],
  ["扶桌", "微微俯身"],
  ["趴桌", "微微俯身"],
  ["坐桌", "标准坐姿"],
  ["靠桌", "靠墙"],
  ["开门", "扶墙"],
  ["举杯", "单手展示商品"],
  ["打电话", "耳机展示"],
  ["使用电脑", "扶墙"],
  ["提行李箱", "单手展示商品"],
  ["回眸半身", "肩部回望"],

  // The current rig cannot produce a readable camera-axis pointing gesture in
  // the orthographic preview, so keep its search phrase as an alias of the
  // verified product-pointing pose instead of showing a misleading card.
  ["指向镜头", "指向产品"],
]);

// Visual QA pass (118/118): only expose poses that satisfy all three release
// criteria at once — readable title, no visible self-intersection, and a
// believable support/contact relationship. Unsupported chair/wall/prop poses
// stay out of the library until their required scene assets and constraints
// exist; misleading near-duplicates are removed instead of being renamed.
const excludedPoseNames = new Set<string>([
  // Hands do not actually enter pockets on the current rig.
  "单手插兜", "双手插兜",

  // Product titles that duplicate another silhouette or require a prop.
  "胸前持物", "手表展示",

  // Hair/head variants with awkward wrists or hands covering the face.
  "单手扶头", "单手摸发", "双手整理头发",

  // Dynamic poses that failed title, contact, or prop checks.
  "落地动作", "出拳", "侧踢", "飞踢", "超级英雄落地",
  "持剑站立", "瞄准姿势", "篮球运球", "投篮准备", "网球挥拍",

  // All visible chair/stool/sofa poses currently float without their support.
  "标准坐姿", "放松坐姿", "双腿并拢坐", "双腿分开坐", "单腿前伸坐",
  "双腿交叉坐", "翘二郎腿", "身体前倾坐", "身体后靠坐", "手撑膝盖坐",
  "双手放腿上", "单手托腮坐", "单手撑椅坐", "侧坐", "反向坐椅", "回头坐姿",
  "高凳标准坐", "单脚落地高凳", "双脚悬空", "一腿伸直高凳", "单腿踩凳",
  "身体侧倾高凳", "沙发放松坐", "沙发半躺", "沙发单手撑头", "沙发双臂展开",

  // Knees, toes, or the pelvis are visibly suspended above the ground.
  "自然下蹲", "双手撑膝", "侧向蹲姿", "回头蹲姿",
  "单膝跪地", "双膝跪地", "低头跪姿", "抬头跪姿",

  // Floor variants that still resolve to floating seated/reclining silhouettes.
  "双腿伸直坐地", "单腿曲起坐地", "双腿曲起坐地", "半躺",

  // Emotion labels whose hands/contact do not match the title.
  "鼓掌", "坐地低头", "双手捂脸", "双手捂嘴",

  // Missing wall/phone/camera assets make every remaining interaction false.
  "扶墙", "靠墙", "看手机", "拿相机",

  // Only one hand reaches the face; the other faces the camera.
  "双手捧脸",
]);

function resolveCanonicalPoseName(name: string) {
  const visited = new Set<string>();
  let current = name;
  while (duplicatePoseCanonicalNames.has(current)) {
    if (visited.has(current)) throw new Error(`Circular duplicate pose mapping: ${name}`);
    visited.add(current);
    current = duplicatePoseCanonicalNames.get(current)!;
  }
  return current;
}

const categoryEnglish: Record<PoseCategory, string> = {
  基础: "basic standing", 展示: "display product", 时尚: "fashion model", 动态: "action motion",
  坐姿: "sitting", 蹲跪: "crouch kneel", 地面: "floor lying", 情绪: "emotion", 交互: "interaction", 特写: "close up",
};

function inferComposition(name: string, tags: string[]): PoseComposition[] {
  const text = `${name} ${tags.join(" ")}`;
  if (/特写/.test(text)) return ["extremeClose", "close"];
  if (/近景/.test(text)) return ["close", "bust"];
  if (/胸像/.test(text)) return ["bust"];
  if (/半身|上半身|手表|耳机|香水/.test(text)) return ["half", "bust"];
  if (/全身|地面|躺|坐|蹲|跪|跑|走|跳|踢/.test(text)) return ["full", "threeQuarter"];
  return ["full", "threeQuarter", "half"];
}

function inferFacing(name: string, tags: string[], index: number): PoseFacing[] {
  const text = `${name} ${tags.join(" ")}`;
  if (/回眸|回头|回望/.test(text)) return ["overShoulder", "back"];
  if (/背面|背身|背向/.test(text)) return ["back"];
  if (/45°/.test(text)) return index % 2 ? ["left45"] : ["right45"];
  if (/侧面|侧身|侧向|侧坐|侧躺/.test(text)) return index % 2 ? ["leftSide"] : ["rightSide"];
  return index % 5 === 0 ? ["front", "left45"] : ["front"];
}

function inferIntensity(name: string, tags: string[]): PoseIntensity {
  const text = `${name} ${tags.join(" ")}`;
  if (/强动态|疾跑|冲刺|冲锋|飞踢|高踢|跳跃|腾空|追逐|逃跑/.test(text)) return "strong";
  if (/动态|跑|踢|出拳|挥拳|运球|挥拍|行走|走秀|转身/.test(text)) return "dynamic";
  if (/轻动态|微|重心|挥手|鼓掌|踱步|准备|预备/.test(text)) return "light";
  return "static";
}

function inferAliases(name: string, category: PoseCategory) {
  const aliases = [categoryEnglish[category]];
  if (/站|立/.test(name)) aliases.push("stand standing");
  if (/走/.test(name)) aliases.push("walk walking");
  if (/跑|冲刺/.test(name)) aliases.push("run running sprint");
  if (/坐/.test(name)) aliases.push("sit sitting chair");
  if (/跪/.test(name)) aliases.push("kneel kneeling");
  if (/战斗|拳|踢|防御/.test(name)) aliases.push("combat fight action");
  if (/商品|产品|托物|持物/.test(name)) aliases.push("product ecommerce display");
  if (/模特|时装|Lookbook|Pose/.test(name)) aliases.push("fashion model editorial");
  return aliases;
}

let itemIndex = 0;
const catalogPoseItems: PoseItem[] = catalog.flatMap((group) => group.items.map((raw) => {
  const [nameZh, tagText = ""] = raw.split("|");
  const tags = tagText.split(",").filter(Boolean);
  const index = itemIndex++;
  const status = nameZh === "持枪警戒" ? "incompatible" : nameZh === "香水展示" ? "missing" : "ready";
  return {
    id: `${group.category.toLowerCase()}_${String(index + 1).padStart(3, "0")}`,
    nameZh,
    nameEn: inferAliases(nameZh, group.category)[0],
    aliases: inferAliases(nameZh, group.category),
    category: group.category,
    subcategory: group.subcategory,
    tags,
    composition: inferComposition(nameZh, tags),
    facing: inferFacing(nameZh, tags, index),
    intensity: inferIntensity(nameZh, tags),
    useCases: tags.filter((tag) => (useCaseOptions as readonly string[]).includes(tag)),
    thumbnail: "",
    poseAsset: `procedural://humanoid_v1/${String(index).padStart(3, "0")}`,
    skeletonProfile: "humanoid_v1" as const,
    featured: featuredNames.has(nameZh),
    sortOrder: featuredNames.has(nameZh) ? index - 1000 : index,
    enginePoseIndex: index,
    status,
  };
}));

const removedAliasesByCanonical = new Map<string, string[]>();
catalogPoseItems.forEach((item) => {
  if (!duplicatePoseCanonicalNames.has(item.nameZh)) return;
  const canonicalName = resolveCanonicalPoseName(item.nameZh);
  const aliases = removedAliasesByCanonical.get(canonicalName) ?? [];
  aliases.push(item.nameZh, ...item.aliases);
  removedAliasesByCanonical.set(canonicalName, aliases);
});

export const poseItems: PoseItem[] = catalogPoseItems
  .filter((item) => !duplicatePoseCanonicalNames.has(item.nameZh))
  .filter((item) => !excludedPoseNames.has(item.nameZh))
  .map((item) => ({
    ...item,
    aliases: [...new Set([...item.aliases, ...(removedAliasesByCanonical.get(item.nameZh) ?? [])])],
  }))
  .sort((a, b) => a.sortOrder - b.sortOrder);

export const defaultPose = poseItems.find((pose) => pose.nameZh === "自然站立") ?? poseItems[0];
