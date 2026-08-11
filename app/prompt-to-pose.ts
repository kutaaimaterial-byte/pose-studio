import {
  getPoseCategoryLabel,
  poseItems,
  type PoseBody,
  type PoseCategory,
  type PoseDirection,
  type PoseHand,
  type PoseIntensity,
  type PoseItem,
  type PoseStyle,
} from "./pose-data";

export type PromptCameraPreset = "commercial" | "cinematic" | "ecommerce";
export type PromptLightingPreset = "studio" | "cinematic" | "night" | "soft";
export type SemanticPoseModifiers = Record<string, string>;

export type PromptToPoseResult = {
  input: string;
  category: PoseCategory;
  categoryLabel: string;
  basePose: string;
  pose: PoseItem;
  tags: string[];
  modifiers: SemanticPoseModifiers;
  detected: {
    direction: PoseDirection | null;
    intensity: PoseIntensity | null;
    hands: PoseHand[];
    body: PoseBody[];
    styles: PoseStyle[];
  };
  cameraPreset: PromptCameraPreset;
  lightingPreset: PromptLightingPreset;
  confidence: number;
  explanation: string[];
};

export const promptToPoseExamples = [
  "一个武士单膝跪地，右手握刀，身体前倾，准备战斗",
  "时尚模特站在街头，双手插兜，侧身回头",
  "运动员全力向前冲刺，身体前倾，动作强烈",
  "人物坐在椅子上，单手托腮，放松地看向侧面",
] as const;

type WeightedCategoryRule = { category: PoseCategory; patterns: Array<[RegExp, number]> };

const categoryRules: WeightedCategoryRule[] = [
  { category: "kneeling", patterns: [[/单膝|双膝|半跪|跪地|跪姿|跪坐|求婚/, 12], [/跪/, 8]] },
  { category: "squatting", patterns: [[/深蹲|半蹲|低蹲|蹲姿|下蹲/, 11], [/蹲/, 8]] },
  { category: "jumping", patterns: [[/腾空|起跳|跳跃|跳起|跨越|落地缓冲/, 11], [/跳/, 7]] },
  { category: "running", patterns: [[/全力冲刺|快速奔跑|疾跑|慢跑|跑步|奔跑|起跑|急停/, 11], [/跑|冲刺/, 8]] },
  { category: "walking", patterns: [[/行走|步行|迈步|猫步|走路/, 10], [/走/, 7]] },
  { category: "sitting", patterns: [[/坐在|正坐|坐姿|翘腿|盘腿|坐地|坐下|椅子/, 10], [/坐/, 7]] },
  { category: "lying", patterns: [[/仰躺|侧卧|仰卧|躺下|半躺/, 11], [/躺|卧/, 7]] },
  { category: "prone", patterns: [[/自然俯卧|俯卧|趴地|趴姿|趴下/, 11], [/趴/, 8]] },
  { category: "leaning", patterns: [[/倚靠|靠墙|靠桌|靠栏杆|撑墙|倚桌|侧靠/, 11], [/靠|倚/, 6]] },
  { category: "ground", patterns: [[/四点支撑|爬行|熊爬|平板支撑|俯卧撑|跌倒|倒地|翻滚|地面起身|滑跪/, 11], [/地面|撑地/, 5]] },
  { category: "standing", patterns: [[/自然站立|站姿|站在|直立|叉腰|插兜|抱臂/, 9], [/站/, 7]] },
];

const handRules: Array<[PoseHand, RegExp]> = [
  ["hip", /叉腰/],
  ["pocket", /插兜|口袋/],
  ["crossed", /抱臂|抱胸/],
  ["behind", /背手|双手背后/],
  ["support", /撑地|撑墙|撑桌|扶栏杆|支撑/],
  ["face", /扶脸|摸脸|摸头|扶额/],
  ["chin", /托腮|扶下巴/],
  ["raise", /举手|抬手|向上伸手/],
  ["open", /张开双臂|双臂张开|张手/],
  ["fist", /握拳/],
  ["holding", /持物|拿着|拿起|握住|握刀|持刀|握剑|持剑|拿枪|持枪|武器/],
];

const bodyRules: Array<[PoseBody, RegExp]> = [
  ["forward", /身体前倾|向前倾|前倾/],
  ["backward", /身体后仰|向后仰|后仰/],
  ["side-lean", /侧倾|向左倾|向右倾/],
  ["twist", /扭转|拧身|转体/],
  ["turn", /侧身|回身|转身|回头|回眸/],
  ["upright", /直立|挺直|站直/],
];

const styleRules: Array<[PoseStyle, RegExp]> = [
  ["fashion", /时尚|模特|猫步|杂志/],
  ["photo", /拍照|摄影|镜头感/],
  ["sport", /运动|运动员|竞技|冲刺|跑步/],
  ["combat", /战斗|武士|攻击|防御|持刀|握刀|武器/],
  ["hero", /英雄|史诗|超级英雄/],
  ["emotion", /冷酷|自信|放松|愤怒|悲伤|惊讶/],
  ["dance", /舞蹈|舞者|跳舞/],
  ["daily", /日常|生活|休闲|放松/],
  ["commercial", /商业|广告|电商|产品展示/],
  ["natural", /自然|随意/],
];

const directionRules: Array<[PoseDirection, RegExp]> = [
  ["look-back", /回头|回眸|向后看/],
  ["back", /背身|背对|背面/],
  ["side", /侧身|侧面|侧向/],
  ["front-left", /左前|朝左|向左看/],
  ["front-right", /右前|朝右|向右看/],
  ["front", /正面|面对镜头|朝前/],
];

const intensityRules: Array<[PoseIntensity, RegExp]> = [
  ["strong", /全力|强烈|爆发|冲刺|疾跑|腾空|英雄落地/],
  ["medium", /快速|动态|奔跑|跳跃|攻击|翻滚/],
  ["light", /轻快|缓慢|轻微|微屈|迈步/],
  ["static", /静态|安静|站定/],
];

const semanticTokens = [
  "单膝", "双膝", "前倾", "后仰", "侧身", "回头", "回眸", "叉腰", "插兜", "抱臂", "托腮",
  "扶脸", "举手", "持物", "握刀", "握剑", "握拳", "跨步", "弯腿", "交叉腿", "冲刺", "慢跑",
  "跳跃", "腾空", "支撑", "战斗", "英雄", "时尚", "商业", "运动", "放松", "冷酷", "自信",
] as const;

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[，。！？、；：,.!?;:\s]+/g, "");
}

const englishSemanticAliases: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(one[- ]?knee|half kneel|kneeling|kneel)\b/i, "单膝 跪姿"],
  [/\b(squat|squatting|crouch)\b/i, "蹲姿"],
  [/\b(jump|jumping|leap|airborne|vault|landing)\b/i, "跳跃 腾空"],
  [/\b(sprint(?:ing)?|running|run|jog(?:ging)?)\b/i, "奔跑 冲刺"],
  [/\b(walking|walk|step|catwalk)\b/i, "行走 迈步"],
  [/\b(sitting|seated|sit|chair)\b/i, "坐姿 椅子"],
  [/\b(supine|lying|lie down|side lying)\b/i, "仰躺 侧卧"],
  [/\b(prone|face down)\b/i, "俯卧 趴姿"],
  [/\b(leaning against|lean against|against (?:a |the )?wall|railing)\b/i, "倚靠 靠墙"],
  [/\b(crawl|plank|push[- ]?up|ground roll|all fours)\b/i, "地面 四点支撑"],
  [/\b(standing|stand|upright)\b/i, "站姿 直立"],
  [/\b(hand|hands) on (the )?hip(s)?\b/i, "叉腰"],
  [/\b(hand|hands) in (the )?pocket(s)?\b/i, "插兜"],
  [/\barms crossed\b/i, "抱臂"],
  [/\bhands behind (the )?back\b/i, "双手背后"],
  [/\b(hand on chin|touching chin)\b/i, "托腮"],
  [/\b(touching face|hand on face)\b/i, "扶脸"],
  [/\b(arm raised|hand raised|reaching up)\b/i, "举手"],
  [/\b(open arms|arms open)\b/i, "双臂张开"],
  [/\b(fist|clenched fist)\b/i, "握拳"],
  [/\b(holding|gripping|sword|weapon)\b/i, "持物 握刀 战斗"],
  [/\b(leaning forward|forward lean)\b/i, "身体前倾"],
  [/\b(leaning back|backward lean|reclined)\b/i, "身体后仰"],
  [/\b(twist|twisting)\b/i, "扭转"],
  [/\b(looking back|look back|over (the )?shoulder)\b/i, "回头 回眸"],
  [/\b(side view|sideways|to the side)\b/i, "侧身 侧面"],
  [/\b(fashion|model|catwalk)\b/i, "时尚 模特"],
  [/\b(athlete|athletic|sport)\b/i, "运动 运动员"],
  [/\b(combat|fight|warrior|defensive|attack)\b/i, "战斗 武士"],
  [/\b(hero|heroic|epic)\b/i, "英雄 史诗"],
  [/\b(dance|dancer)\b/i, "舞蹈"],
  [/\b(commercial|advertising|e[- ]?commerce)\b/i, "商业 电商"],
  [/\b(relaxed|natural|casual)\b/i, "放松 自然"],
  [/\b(full speed|powerful|explosive|strong motion)\b/i, "全力 强烈"],
  [/\b(slow|subtle|light motion)\b/i, "缓慢 轻微"],
];

function enrichEnglishPrompt(value: string) {
  const aliases = englishSemanticAliases.filter(([pattern]) => pattern.test(value)).map(([, alias]) => alias);
  return aliases.length ? `${value} ${aliases.join(" ")}` : value;
}

function detectMany<T extends string>(input: string, rules: Array<[T, RegExp]>): T[] {
  return rules.filter(([, pattern]) => pattern.test(input)).map(([value]) => value);
}

function detectOne<T extends string>(input: string, rules: Array<[T, RegExp]>): T | null {
  return rules.find(([, pattern]) => pattern.test(input))?.[0] ?? null;
}

function detectCategory(input: string): { category: PoseCategory; score: number; clue: string } {
  let best: { category: PoseCategory; score: number; clue: string } = { category: "standing", score: 0, clue: "未发现明确主姿态，使用站姿作为安全基础" };
  categoryRules.forEach(({ category, patterns }) => {
    let score = 0;
    let clue = "";
    patterns.forEach(([pattern, weight]) => {
      const match = input.match(pattern);
      if (match) {
        score += weight;
        if (!clue) clue = match[0];
      }
    });
    if (score > best.score) best = { category, score, clue: `识别到“${clue}”` };
  });
  return best;
}

function poseSearchText(pose: PoseItem) {
  return normalize([pose.name, pose.nameEn, ...pose.tags, ...pose.aliases].join(" "));
}

function scorePose(
  pose: PoseItem,
  input: string,
  normalizedInput: string,
  direction: PoseDirection | null,
  intensity: PoseIntensity | null,
  hands: PoseHand[],
  body: PoseBody[],
  styles: PoseStyle[],
) {
  const searchable = poseSearchText(pose);
  let score = 20;
  if (normalizedInput.includes(normalize(pose.name))) score += 90;
  pose.tags.concat(pose.aliases).forEach((term) => {
    const normalizedTerm = normalize(term);
    if (normalizedTerm.length > 1 && normalizedInput.includes(normalizedTerm)) score += 10;
  });
  semanticTokens.forEach((term) => {
    if (input.includes(term) && searchable.includes(normalize(term))) score += 18;
  });
  if (direction && pose.direction === direction) score += 12;
  if (intensity && pose.intensity === intensity) score += 8;
  hands.forEach((value) => { if (pose.hand.includes(value)) score += 16; });
  body.forEach((value) => { if (pose.body.includes(value)) score += 14; });
  styles.forEach((value) => { if (pose.style.includes(value)) score += 12; });
  if (/单膝/.test(input) && /单膝/.test(pose.name)) score += 28;
  if (/双手插兜/.test(input) && /双手插兜/.test(pose.name)) score += 32;
  if (/战斗|武士|武器|握刀|持刀/.test(input) && /战斗|英雄/.test(pose.name)) score += 100;
  if (/全力/.test(input) && /冲刺/.test(input) && /全力冲刺/.test(pose.name)) score += 100;
  if (/右手|左手/.test(input) && /单手/.test(pose.name)) score += 5;
  return score;
}

function buildModifiers(input: string, direction: PoseDirection | null, hands: PoseHand[], body: PoseBody[]) {
  const modifiers: SemanticPoseModifiers = {};
  if (/右手.*(握|持|拿).*(刀|剑|枪|武器)|右手(握刀|持刀|握剑|持剑)/.test(input)) modifiers.rightHand = "holding_weapon";
  else if (/左手.*(握|持|拿).*(刀|剑|枪|武器)|左手(握刀|持刀|握剑|持剑)/.test(input)) modifiers.leftHand = "holding_weapon";
  else if (hands.includes("holding")) modifiers.hands = "holding_object";
  if (/双手插兜/.test(input)) modifiers.hands = "both_in_pockets";
  else if (/右手插兜/.test(input)) modifiers.rightHand = "in_pocket";
  else if (/左手插兜/.test(input)) modifiers.leftHand = "in_pocket";
  else if (hands.includes("pocket")) modifiers.hands = "in_pockets";
  if (hands.includes("hip")) modifiers.hands = /双手叉腰/.test(input) ? "both_on_hips" : "one_on_hip";
  if (hands.includes("crossed")) modifiers.hands = "arms_crossed";
  if (hands.includes("chin")) modifiers.handGesture = "touching_chin";
  if (hands.includes("face")) modifiers.handGesture = "touching_face";
  if (hands.includes("raise")) modifiers.handGesture = "raised";
  if (body.includes("forward")) modifiers.bodyLean = "forward";
  else if (body.includes("backward")) modifiers.bodyLean = "backward";
  else if (body.includes("side-lean")) modifiers.bodyLean = "side";
  if (body.includes("twist")) modifiers.torso = "twist";
  if (body.includes("turn")) modifiers.torso = "turn";
  if (/单膝/.test(input)) modifiers.legs = "single_knee";
  else if (/双膝/.test(input)) modifiers.legs = "both_knees";
  else if (/交叉腿/.test(input)) modifiers.legs = "crossed";
  else if (/跨步|大步/.test(input)) modifiers.legs = "wide_stride";
  else if (/弯腿|屈膝/.test(input)) modifiers.legs = "bent";
  if (direction === "look-back") modifiers.head = "look_back";
  else if (direction === "side") modifiers.bodyDirection = "side";
  if (/侧身|侧面|侧向/.test(input)) modifiers.bodyDirection = "side";
  if (/低头/.test(input)) modifiers.head = "look_down";
  if (/抬头|仰头/.test(input)) modifiers.head = "look_up";
  return modifiers;
}

function recommendCamera(input: string, styles: PoseStyle[]): PromptCameraPreset {
  if (/电影|英雄|史诗|战斗|武士|持刀|握刀|武器|低机位|广角/.test(input) || styles.includes("combat") || styles.includes("hero")) return "cinematic";
  if (/电商|商品|产品展示/.test(input)) return "ecommerce";
  return "commercial";
}

function recommendLighting(input: string, styles: PoseStyle[]): PromptLightingPreset {
  if (/夜景|夜晚|霓虹|蓝橙/.test(input)) return "night";
  if (/电影|英雄|史诗|战斗|武士|侧逆光|顶光/.test(input) || styles.includes("combat") || styles.includes("hero")) return "cinematic";
  if (/柔光|时尚|模特|人像|放松/.test(input) || styles.includes("fashion")) return "soft";
  return "studio";
}

export function analyzePromptToPose(rawInput: string): PromptToPoseResult {
  const sourceInput = rawInput.trim();
  const input = enrichEnglishPrompt(sourceInput);
  const normalizedInput = normalize(input);
  const categoryMatch = detectCategory(input);
  const direction = detectOne(input, directionRules);
  const intensity = detectOne(input, intensityRules);
  const hands = detectMany(input, handRules);
  const body = detectMany(input, bodyRules);
  const styles = detectMany(input, styleRules);
  const candidates = poseItems.filter((pose) => pose.category === categoryMatch.category && pose.status === "ready");
  const ranked = candidates
    .map((pose) => ({ pose, score: scorePose(pose, input, normalizedInput, direction, intensity, hands, body, styles) }))
    .sort((a, b) => b.score - a.score || a.pose.sortOrder - b.pose.sortOrder);
  const winner = ranked[0] ?? { pose: poseItems[0], score: 0 };
  const modifiers = buildModifiers(input, direction, hands, body);
  const semanticTags = semanticTokens.filter((token) => input.includes(token));
  const explicitStyle = styles.length > 0;
  const conflictingDirectionTags = direction ? new Set(["正面", "侧面", "背面", "回头"]) : new Set<string>();
  const directionTag: Partial<Record<PoseDirection, string>> = { front: "正面", side: "侧面", back: "背面", "look-back": "回头", "front-left": "左前45度", "front-right": "右前45度" };
  const inheritedTags = winner.pose.tags.filter((tag) => (!conflictingDirectionTags.has(tag) || tag === directionTag[direction!]) && !(explicitStyle && tag === "自然"));
  const tags = [...new Set([...semanticTags, ...(direction ? [directionTag[direction] ?? direction] : []), ...inheritedTags.slice(0, 3)])].slice(0, 8);
  const cameraPreset = recommendCamera(input, styles);
  const lightingPreset = recommendLighting(input, styles);
  const confidence = Math.min(0.98, Math.max(0.56, 0.52 + categoryMatch.score / 50 + winner.score / 520));
  const explanation = [
    `${categoryMatch.clue}，主分类为${getPoseCategoryLabel(categoryMatch.category)}`,
    `Pose 数据库最佳匹配：${winner.pose.name}`,
    Object.keys(modifiers).length ? `组合 ${Object.keys(modifiers).length} 个动作修饰参数` : "未检测到额外动作修饰参数",
    `自动推荐${cameraPreset === "cinematic" ? "电影英雄" : cameraPreset === "ecommerce" ? "电商模特" : "商业摄影"}镜头与${lightingPreset === "cinematic" ? "电影侧逆光" : lightingPreset === "night" ? "蓝橙夜景" : lightingPreset === "soft" ? "柔光人像" : "商业棚拍"}`,
  ];

  return {
    input: sourceInput,
    category: categoryMatch.category,
    categoryLabel: getPoseCategoryLabel(categoryMatch.category),
    basePose: winner.pose.id,
    pose: winner.pose,
    tags,
    modifiers,
    detected: { direction, intensity, hands, body, styles },
    cameraPreset,
    lightingPreset,
    confidence,
    explanation,
  };
}

export function promptToPoseJson(result: PromptToPoseResult) {
  return {
    category: result.category,
    basePose: result.basePose,
    tags: result.tags,
    modifiers: result.modifiers,
  };
}
