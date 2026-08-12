export type PoseCategory =
  | "standing"
  | "walking"
  | "running"
  | "jumping"
  | "squatting"
  | "sitting"
  | "kneeling"
  | "lying"
  | "prone"
  | "leaning"
  | "ground";

export type PoseCategoryTab = "all" | "favorites" | "saved" | PoseCategory;
export type PoseDirection = "front" | "front-left" | "front-right" | "side" | "back" | "look-back";
export type PoseIntensity = "static" | "light" | "medium" | "strong";
export type PoseHand = "natural" | "hip" | "pocket" | "crossed" | "behind" | "support" | "face" | "chin" | "raise" | "open" | "fist" | "holding";
export type PoseBody = "upright" | "forward" | "backward" | "side-lean" | "twist" | "turn";
export type PoseStyle = "natural" | "fashion" | "photo" | "sport" | "combat" | "hero" | "emotion" | "dance" | "daily" | "commercial";

export type PoseItem = {
  id: string;
  name: string;
  category: PoseCategory;
  tags: string[];
  direction: PoseDirection;
  intensity: PoseIntensity;
  favorite: boolean;
  thumbnail: string;
  previewAngle: number;
  hand: PoseHand[];
  body: PoseBody[];
  style: PoseStyle[];
  aliases: string[];
  nameEn: string;
  poseAsset: string;
  skeletonProfile: "humanoid_v1";
  featured: boolean;
  sortOrder: number;
  enginePoseIndex: number;
  status: "ready" | "missing" | "incompatible";
};

export const poseCategoryLabels: Record<PoseCategory, string> = {
  standing: "站",
  walking: "走",
  running: "跑",
  jumping: "跳",
  squatting: "蹲",
  sitting: "坐",
  kneeling: "跪",
  lying: "躺",
  prone: "趴",
  leaning: "倚靠",
  ground: "地面",
};

export const poseCategoryTabs: ReadonlyArray<{ value: PoseCategoryTab; label: string; english?: string }> = [
  { value: "all", label: "全部" },
  { value: "favorites", label: "收藏" },
  { value: "saved", label: "已保存" },
  { value: "standing", label: "站", english: "Standing" },
  { value: "walking", label: "走", english: "Walking" },
  { value: "running", label: "跑", english: "Running" },
  { value: "jumping", label: "跳", english: "Jumping" },
  { value: "squatting", label: "蹲", english: "Squatting" },
  { value: "sitting", label: "坐", english: "Sitting" },
  { value: "kneeling", label: "跪", english: "Kneeling" },
  { value: "lying", label: "躺", english: "Lying" },
  { value: "prone", label: "趴", english: "Prone" },
  { value: "leaning", label: "倚靠", english: "Leaning" },
  { value: "ground", label: "地面", english: "Ground" },
];

export const directionOptions = [
  ["不限", "any"], ["正面", "front"], ["左前45°", "front-left"], ["右前45°", "front-right"],
  ["左右侧面", "side"], ["背面", "back"], ["回头", "look-back"],
] as const;

export const intensityOptions = [
  ["不限", "any"], ["静态", "static"], ["轻动态", "light"], ["中动态", "medium"], ["强动态", "strong"],
] as const;

export const handOptions = [
  ["不限", "any"], ["自然", "natural"], ["叉腰", "hip"], ["插兜", "pocket"], ["抱臂", "crossed"],
  ["背手", "behind"], ["支撑", "support"], ["扶脸", "face"], ["托腮", "chin"], ["举手", "raise"],
  ["张开", "open"], ["握拳", "fist"], ["持物", "holding"],
] as const;

export const bodyOptions = [
  ["不限", "any"], ["直立", "upright"], ["前倾", "forward"], ["后仰", "backward"],
  ["侧倾", "side-lean"], ["扭转", "twist"], ["回身", "turn"],
] as const;

export const styleOptions = [
  ["不限", "any"], ["自然", "natural"], ["时尚", "fashion"], ["拍照", "photo"], ["运动", "sport"],
  ["战斗", "combat"], ["英雄", "hero"], ["情绪", "emotion"], ["舞蹈", "dance"], ["生活", "daily"], ["商业", "commercial"],
] as const;

const poseNamesByCategory: Record<PoseCategory, string[]> = {
  standing: [
    "自然站立", "双脚并拢站立", "双脚分开站立", "单腿微屈站立", "重心左移", "重心右移", "前后脚站立", "交叉腿站立",
    "单手叉腰", "双手叉腰", "双手插兜", "单手插兜", "双臂抱胸", "双手背后", "双手身前交叠", "单手扶下巴",
    "单手扶脸", "单手摸头", "单手举起", "双臂张开", "侧身站立", "侧身回眸", "背身站立", "背身回头",
  ],
  walking: [
    "自然行走", "向前迈步", "大步行走", "缓慢行走", "轻快行走", "模特猫步", "双手插兜行走", "单手插兜行走",
    "边走边回头", "侧向行走", "低头行走", "挥手行走",
  ],
  running: [
    "自然慢跑", "正常跑步", "快速奔跑", "全力冲刺", "冲刺起步", "起跑准备", "身体前倾奔跑", "大跨步奔跑",
    "转弯奔跑", "回头奔跑", "侧向奔跑", "急停姿态",
  ],
  jumping: [
    "原地起跳", "向前跳跃", "大跨步跳跃", "单腿起跳", "双腿腾空", "抱膝跳", "张腿跳", "腾空转身",
    "向上伸手跳", "跨越障碍", "跳跃落地", "落地缓冲",
  ],
  squatting: [
    "自然蹲姿", "半蹲", "深蹲", "双腿分开蹲", "双腿并拢蹲", "单腿侧伸低蹲", "双手撑膝蹲", "单手撑膝蹲",
    "单手触地蹲", "抱膝蹲", "运动准备半蹲", "防御低蹲",
  ],
  sitting: [
    "自然正坐", "双腿并拢坐", "双腿打开坐", "翘腿坐", "双腿交叉坐", "双腿斜放坐", "身体前倾坐", "身体后仰坐",
    "双手放腿上", "单手托腮坐", "双臂抱胸坐", "单手撑椅坐", "盘腿坐", "双腿前伸坐", "单腿屈膝坐", "双腿屈膝坐",
    "侧坐", "后手撑地坐",
  ],
  kneeling: [
    "双膝跪地", "跪坐", "单膝跪地", "单膝半跪", "求婚式单膝跪", "跪姿身体前倾", "跪姿身体后仰", "跪姿回头",
    "双手撑地跪姿", "单手撑地跪姿", "战斗半跪", "英雄落地",
  ],
  lying: [
    "自然仰躺", "双腿伸直仰躺", "单腿屈膝仰躺", "双腿屈膝仰躺", "双手张开仰躺", "双手枕头仰躺",
    "左侧卧", "右侧卧", "蜷缩侧卧", "侧卧回头", "半躺支撑", "单肘撑起侧卧",
  ],
  prone: [
    "自然俯卧", "趴地抬头", "双肘撑起", "单肘撑起", "双手撑起上身", "俯卧单腿屈起", "俯卧双腿屈起",
    "向前伸手趴姿", "趴姿回头", "低姿观察",
  ],
  leaning: [
    "背靠墙站立", "单肩靠墙", "侧身靠墙", "单手撑墙", "双手撑墙", "单手撑桌", "双手撑桌", "身体倚桌",
    "倚靠栏杆", "双手扶栏杆", "臀部倚桌", "坐姿侧靠",
  ],
  ground: [
    "四点支撑", "向前爬行", "熊爬姿态", "平板支撑", "俯卧撑准备", "俯卧撑低位", "坐地后撑", "跌坐",
    "跌倒侧撑", "倒地支撑", "翻滚准备", "地面翻滚", "滑跪", "低姿移动", "倒地起身", "单手撑地起身",
  ],
};

const poseNamesEnByCategory: Record<PoseCategory, string[]> = {
  standing: [
    "Natural Standing", "Feet Together", "Wide Stance", "Single Knee Relaxed", "Weight Shift Left", "Weight Shift Right", "Staggered Stance", "Crossed-Leg Standing",
    "One Hand on Hip", "Hands on Hips", "Both Hands in Pockets", "One Hand in Pocket", "Arms Crossed", "Hands Behind Back", "Hands Folded in Front", "Hand on Chin",
    "Hand on Face", "Hand on Head", "One Arm Raised", "Arms Open", "Side Standing", "Side Pose Looking Back", "Back-Facing Standing", "Back Pose Looking Over Shoulder",
  ],
  walking: [
    "Natural Walk", "Step Forward", "Long Stride Walk", "Slow Walk", "Light Walk", "Model Catwalk", "Walking with Hands in Pockets", "Walking with One Hand in Pocket",
    "Walking and Looking Back", "Side Walk", "Walking with Head Down", "Walking and Waving",
  ],
  running: [
    "Natural Jog", "Running", "Fast Run", "Full Sprint", "Sprint Start", "Starting Position", "Forward-Leaning Run", "Long-Stride Run",
    "Turning Run", "Running and Looking Back", "Side Run", "Sudden Stop",
  ],
  jumping: [
    "Vertical Jump", "Forward Jump", "Long-Leap Jump", "Single-Leg Takeoff", "Both Legs Airborne", "Tuck Jump", "Straddle Jump", "Airborne Turn",
    "Jump with Arms Reaching Up", "Obstacle Vault", "Jump Landing", "Landing Recovery",
  ],
  squatting: [
    "Natural Squat", "Half Squat", "Deep Squat", "Wide-Leg Squat", "Feet-Together Squat", "Side-Lunge Low Squat", "Squat with Hands on Knees", "Squat with One Hand on Knee",
    "Crouch with One Hand on Ground", "Knee-Hug Squat", "Athletic Ready Squat", "Defensive Low Crouch",
  ],
  sitting: [
    "Natural Seated Pose", "Sitting with Legs Together", "Sitting with Legs Apart", "Cross-Legged Chair Pose", "Sitting with Legs Crossed", "Sitting with Legs Angled", "Forward-Leaning Sit", "Reclined Sitting",
    "Hands Resting on Legs", "Seated with Hand on Chin", "Seated with Arms Crossed", "One Hand Supporting on Chair", "Lotus Sitting", "Sitting with Legs Extended", "Sitting with One Knee Bent", "Sitting with Both Knees Bent",
    "Side Sitting", "Ground Sit with Hands Behind",
  ],
  kneeling: [
    "Kneeling on Both Knees", "Kneeling Sit", "One-Knee Kneel", "Half Kneel", "Proposal Kneel", "Forward-Leaning Kneel", "Backward-Leaning Kneel", "Kneeling and Looking Back",
    "Kneeling with Both Hands Down", "Kneeling with One Hand Down", "Combat Half Kneel", "Hero Landing",
  ],
  lying: [
    "Natural Supine Pose", "Lying Supine with Legs Straight", "Supine with One Knee Bent", "Supine with Both Knees Bent", "Supine with Arms Open", "Lying with Hands Behind Head",
    "Left Side Lying", "Right Side Lying", "Curled Side Lying", "Side Lying and Looking Back", "Supported Recline", "Side Lying on One Elbow",
  ],
  prone: [
    "Natural Prone Pose", "Prone with Head Raised", "Prone on Both Elbows", "Prone on One Elbow", "Upper Body Push-Up", "Prone with One Leg Bent", "Prone with Both Legs Bent",
    "Prone Reaching Forward", "Prone Looking Back", "Low Observation Pose",
  ],
  leaning: [
    "Standing with Back Against Wall", "One Shoulder Against Wall", "Side Lean Against Wall", "One Hand on Wall", "Both Hands on Wall", "One Hand on Table", "Both Hands on Table", "Body Leaning on Table",
    "Leaning on Railing", "Both Hands on Railing", "Hips Against Table", "Seated Side Lean",
  ],
  ground: [
    "All-Fours Support", "Forward Crawl", "Bear Crawl", "Plank", "Push-Up Ready", "Low Push-Up", "Ground Sit with Rear Support", "Fallen Sitting",
    "Side-Supported Fall", "Ground Recovery Support", "Roll Preparation", "Ground Roll", "Knee Slide", "Low Movement", "Rising from the Ground", "One-Hand Ground Recovery",
  ],
};

const categoryEnglish: Record<PoseCategory, string> = {
  standing: "standing", walking: "walking", running: "running", jumping: "jumping", squatting: "squatting",
  sitting: "sitting", kneeling: "kneeling", lying: "lying", prone: "prone", leaning: "leaning", ground: "ground",
};

export const poseCategoryLabelsEn: Record<PoseCategory, string> = {
  standing: "Standing", walking: "Walking", running: "Running", jumping: "Jumping", squatting: "Squatting",
  sitting: "Sitting", kneeling: "Kneeling", lying: "Lying", prone: "Prone", leaning: "Leaning", ground: "Ground",
};

export const directionLabelsEn: Record<PoseDirection, string> = {
  front: "Front", "front-left": "Front Left 45°", "front-right": "Front Right 45°", side: "Side", back: "Back", "look-back": "Look Back",
};

export const intensityLabelsEn: Record<PoseIntensity, string> = {
  static: "Static", light: "Light Motion", medium: "Medium Motion", strong: "Strong Motion",
};

export const handLabelsEn: Record<PoseHand, string> = {
  natural: "Natural", hip: "On Hip", pocket: "In Pocket", crossed: "Arms Crossed", behind: "Behind Back", support: "Support",
  face: "Touch Face", chin: "On Chin", raise: "Raised", open: "Open", fist: "Fist", holding: "Holding",
};

export const bodyLabelsEn: Record<PoseBody, string> = {
  upright: "Upright", forward: "Forward Lean", backward: "Backward Lean", "side-lean": "Side Lean", twist: "Twist", turn: "Turn",
};

export const styleLabelsEn: Record<PoseStyle, string> = {
  natural: "Natural", fashion: "Fashion", photo: "Photo", sport: "Sport", combat: "Combat", hero: "Hero",
  emotion: "Emotion", dance: "Dance", daily: "Daily", commercial: "Commercial",
};

const directionLabels: Record<PoseDirection, string> = {
  front: "正面", "front-left": "左前45度", "front-right": "右前45度", side: "侧面", back: "背面", "look-back": "回头",
};

const intensityLabels: Record<PoseIntensity, string> = {
  static: "静态", light: "轻动态", medium: "中动态", strong: "强动态",
};

const handLabels: Record<PoseHand, string> = {
  natural: "自然", hip: "叉腰", pocket: "插兜", crossed: "抱臂", behind: "背手", support: "支撑",
  face: "扶脸", chin: "托腮", raise: "举手", open: "张开", fist: "握拳", holding: "持物",
};

const bodyLabels: Record<PoseBody, string> = {
  upright: "直立", forward: "前倾", backward: "后仰", "side-lean": "侧倾", twist: "扭转", turn: "回身",
};

const styleLabels: Record<PoseStyle, string> = {
  natural: "自然", fashion: "时尚", photo: "拍照", sport: "运动", combat: "战斗", hero: "英雄",
  emotion: "情绪", dance: "舞蹈", daily: "生活", commercial: "商业",
};

function inferDirection(name: string, index: number): PoseDirection {
  if (/回头|回眸/.test(name)) return "look-back";
  if (/背身|背靠/.test(name)) return "back";
  if (/侧身|侧向|侧卧|侧坐|侧靠|侧撑|侧伸/.test(name)) return "side";
  if (/左移|左侧/.test(name)) return "front-left";
  if (/右移|右侧/.test(name)) return "front-right";
  if (/转弯|转身|回身|翻滚/.test(name)) return index % 2 ? "front-left" : "front-right";
  return "front";
}

function inferIntensity(category: PoseCategory, name: string): PoseIntensity {
  if (/冲刺|全力|腾空|大跨步跳|张腿跳|跨越|英雄落地|地面翻滚|快速奔跑/.test(name)) return "strong";
  if (/跑|跳|爬行|熊爬|俯卧撑|滑跪|急停|落地|起身|低姿移动/.test(name)) return "medium";
  if (/走|迈步|重心|微屈|半蹲|回头|回眸|举起|张开|前倾|后仰|侧倾|倚|靠|撑|屈膝/.test(name)) return "light";
  if (["walking", "running", "jumping", "ground"].includes(category)) return "medium";
  return "static";
}

function inferHands(name: string): PoseHand[] {
  const hands: PoseHand[] = [];
  if (/叉腰/.test(name)) hands.push("hip");
  if (/插兜/.test(name)) hands.push("pocket");
  if (/抱胸|抱臂/.test(name)) hands.push("crossed");
  if (/背后|背手/.test(name)) hands.push("behind");
  if (/撑|扶栏杆|靠墙|倚桌/.test(name)) hands.push("support");
  if (/扶脸|摸头|枕头/.test(name)) hands.push("face");
  if (/下巴|托腮/.test(name)) hands.push("chin");
  if (/举起|举手|伸手/.test(name)) hands.push("raise");
  if (/张开/.test(name)) hands.push("open");
  if (/防御|战斗/.test(name)) hands.push("fist");
  if (!hands.length) hands.push("natural");
  return [...new Set(hands)];
}

function inferBody(category: PoseCategory, name: string): PoseBody[] {
  const body: PoseBody[] = [];
  if (/前倾|向前|低姿|俯卧撑|爬行|熊爬|冲刺|奔跑|跑步/.test(name) || category === "running") body.push("forward");
  if (/后仰|后撑|半躺|背靠/.test(name)) body.push("backward");
  if (/侧倾|侧靠|单肩/.test(name)) body.push("side-lean");
  if (/扭|转弯|翻滚/.test(name)) body.push("twist");
  if (/回身|回头|回眸/.test(name)) body.push("turn");
  if (!body.length) body.push("upright");
  return [...new Set(body)];
}

function inferStyle(category: PoseCategory, name: string): PoseStyle[] {
  const styles: PoseStyle[] = [];
  if (/模特|猫步|交叉腿|叉腰|侧身回眸|扶脸|摸头/.test(name)) styles.push("fashion", "photo");
  if (/跑|跳|蹲|起跑|冲刺|俯卧撑|平板|熊爬|运动/.test(name)) styles.push("sport");
  if (/防御|战斗|低姿观察/.test(name)) styles.push("combat");
  if (/英雄/.test(name)) styles.push("hero");
  if (/跌|倒地|求婚|抱膝|回头|回眸/.test(name)) styles.push("emotion");
  if (/腾空转身|张腿跳|交叉腿/.test(name)) styles.push("dance");
  if (/身前交叠|双臂张开|单手举起|撑桌|倚靠栏杆|扶栏杆/.test(name)) styles.push("commercial");
  if (/倚|靠|坐|躺|卧|趴|走/.test(name)) styles.push("daily");
  if (!styles.length || category === "standing") styles.push("natural");
  return [...new Set(styles)];
}

function inferDetailTag(name: string, category: PoseCategory): string {
  if (/冲刺/.test(name)) return "冲刺";
  if (/回头|回眸/.test(name)) return "回头";
  if (/叉腰/.test(name)) return "叉腰";
  if (/插兜/.test(name)) return "插兜";
  if (/抱胸|抱臂/.test(name)) return "抱臂";
  if (/背后|背手/.test(name)) return "背手";
  if (/托腮|下巴/.test(name)) return "托腮";
  if (/扶脸|摸头/.test(name)) return "扶脸";
  if (/撑/.test(name)) return "支撑";
  if (/跪/.test(name)) return "跪姿";
  if (/侧卧/.test(name)) return "侧卧";
  if (/仰躺/.test(name)) return "仰躺";
  if (/俯卧|趴/.test(name)) return "俯卧";
  if (/跳|腾空|跨越/.test(name)) return "跳跃";
  if (/跑/.test(name)) return "奔跑";
  if (/走|迈步|猫步/.test(name)) return "行走";
  if (/蹲/.test(name)) return "蹲姿";
  return poseCategoryLabels[category];
}

function buildTags(name: string, category: PoseCategory, direction: PoseDirection, intensity: PoseIntensity, hands: PoseHand[], body: PoseBody[], styles: PoseStyle[]): string[] {
  if (name === "自然站立") return ["正面", "自然", "直立"];
  if (name === "英雄落地") return ["英雄", "强动态", "落地"];
  if (/冲刺/.test(name)) return ["强动态", "冲刺", "运动"];

  const detail = inferDetailTag(name, category);
  const hand = hands.find((item) => item !== "natural");
  const style = styles.find((item) => item !== "natural" && item !== "daily");
  const tags = [
    hand ? handLabels[hand] : detail,
    style ? styleLabels[style] : intensity !== "static" ? intensityLabels[intensity] : directionLabels[direction],
    intensity === "strong" ? intensityLabels[intensity] : styleLabels[styles[0]],
    detail,
    directionLabels[direction],
    ...hands.map((item) => handLabels[item]),
    ...body.map((item) => bodyLabels[item]),
    ...styles.map((item) => styleLabels[item]),
  ];
  return [...new Set(tags.filter(Boolean))];
}

function directionToAngle(direction: PoseDirection): number {
  if (direction === "front-left") return 35;
  if (direction === "front-right") return -35;
  if (direction === "side") return -82;
  if (direction === "back") return 176;
  if (direction === "look-back") return 146;
  return 0;
}

const featuredNames = new Set(["自然站立", "单手叉腰", "侧身回眸", "自然行走", "全力冲刺", "原地起跳", "自然蹲姿", "自然正坐", "单膝跪地", "自然仰躺", "自然俯卧", "背靠墙站立", "四点支撑"]);

const idOverrides: Record<string, string> = {
  自然站立: "standing_natural",
  单手叉腰: "standing_one_hand_hip",
  自然行走: "walking_natural",
  全力冲刺: "running_full_sprint",
  英雄落地: "kneeling_hero_landing",
};

let enginePoseIndex = 0;
export const poseItems: PoseItem[] = (Object.entries(poseNamesByCategory) as Array<[PoseCategory, string[]]>).flatMap(([category, names]) =>
  names.map((name, categoryIndex) => {
    const index = enginePoseIndex++;
    const direction = inferDirection(name, index);
    const intensity = inferIntensity(category, name);
    const hand = inferHands(name);
    const body = inferBody(category, name);
    const style = inferStyle(category, name);
    const tags = buildTags(name, category, direction, intensity, hand, body, style);
    const id = idOverrides[name] ?? `${category}_${String(categoryIndex + 1).padStart(3, "0")}`;
    const aliases = [categoryEnglish[category], poseCategoryLabels[category], ...tags];
    if (name === "全力冲刺") aliases.push("疾跑冲刺", "sprint");
    if (name === "边走边回头") aliases.push("行走回头");
    return {
      id,
      name,
      category,
      tags,
      direction,
      intensity,
      favorite: false,
      thumbnail: `procedural://humanoid_v2/thumbnail/${String(index).padStart(3, "0")}`,
      previewAngle: directionToAngle(direction),
      hand,
      body,
      style,
      aliases: [...new Set(aliases)],
      nameEn: poseNamesEnByCategory[category][categoryIndex] ?? `${categoryEnglish[category]} pose ${categoryIndex + 1}`,
      poseAsset: `procedural://humanoid_v2/${String(index).padStart(3, "0")}`,
      skeletonProfile: "humanoid_v1" as const,
      featured: featuredNames.has(name),
      sortOrder: index,
      enginePoseIndex: index,
      status: "ready" as const,
    };
  }),
);

export const defaultPose = poseItems.find((pose) => pose.id === "standing_natural") ?? poseItems[0];

export function getPoseCategoryLabel(category: PoseCategory): string {
  return poseCategoryLabels[category];
}

export function getPoseTabLabel(tab: PoseCategoryTab): string {
  if (tab === "all") return "全部";
  if (tab === "favorites") return "收藏";
  if (tab === "saved") return "已保存";
  return poseCategoryLabels[tab];
}

export function getPoseCategoryLabelEn(category: PoseCategory): string {
  return poseCategoryLabelsEn[category];
}

export function getPoseTabLabelEn(tab: PoseCategoryTab): string {
  if (tab === "all") return "All";
  if (tab === "favorites") return "Favorites";
  if (tab === "saved") return "Saved";
  return poseCategoryLabelsEn[tab];
}
