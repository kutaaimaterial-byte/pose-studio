# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

PoseBoard 面向需要快速建立人体姿态参考的 AI 图像、AI 视频、电商视觉、分镜和角色设计创作者。用户通常在桌面浏览器中工作，希望在不了解复杂 3D 术语的前提下完成姿势、镜头、透视、灯光和导出。

## Product Purpose

PoseBoard AI Character Studio 是一套 3D 姿态预设计工作台。核心成功标准是让用户在 3 秒内找到或生成姿势，在 30 秒内得到可控参考，并沿着“姿势 → 镜头 → 导出”的主链路完成工作。

## Positioning

产品把 Pose 预设、自然语言动作匹配、骨骼微调、镜头构图、透视辅助、灯光与 AI 提示词生成放在同一个可恢复的 3D 工作流中，而不是要求用户先掌握传统 3D 软件的骨骼树和参数体系。

## Operating Context

- 默认从姿势库开始，选择、搜索或描述动作。
- 必要时进入 IK 微调，之后调整人物整体位置、镜头、透视和灯光。
- 用户可以上传并锁定参考图片、复制粘贴人物、保存自定义姿势。
- 最终导出干净参考图、含透视网格图、透明背景图、项目数据或提示词。
- 项目在浏览器本地自动保存，刷新后可恢复。

## Capabilities and Constraints

- 保留现有 vinext、React 19、Three.js、GLTFLoader、OrbitControls 与 TransformControls 技术栈。
- 保留现有 Pose 数据、骨骼求解、模型加载、人物复制/粘贴/删除、图片层、透视网格、灯光、提示词与 PNG/JSON 导出。
- `activeTool` 与 `interactionMode` 必须分离；镜头浏览、人物整体变换、IK 微调和透视编辑必须互斥。
- 桌面工作台只有一个主要上下文面板，中央画布始终是最大工作区域；低于 1024px 可使用覆盖式面板。
- AI 服务不可用时，基础姿势搜索、镜头、透视、灯光和导出仍可工作。
- 不承诺当前实现未支持的模型格式、云同步或多人协作。

## Brand Commitments

- 产品名称为 PoseBoard AI Character Studio / PoseBoard 3D Studio。
- 工具界面使用专业、轻量、扁平的白色与浅灰体系，蓝色只承担主操作和选中状态。
- 不使用厚重阴影、玻璃拟态、大面积渐变、装饰性背景或长期占据画布的引导气泡。

## Evidence on Hand

- V4.0 产品与交互基线：`/Users/sunyu/Downloads/PoseBoard_UIUX_Redesign_PRD_V4.0_Codex.md`。
- 现有可运行实现位于 `app/page.tsx`、`app/globals.css`、`app/perspective-grid.tsx`、`app/prompt-to-pose.ts` 与 `app/pose-data.ts`。
- 内置 Quaternius Humanoid GLTF 与贴图位于 `public/assets/humanoid/`。
- 没有真实客户评价、商业指标或云端账户数据，未来界面不得虚构这些内容。

## Product Principles

1. 画布优先：内容与当前控制状态比参数面板更重要。
2. 预设优先：用户先获得可靠结果，再按需展开高级参数。
3. 单一模式：任何时刻只允许一个控制系统响应输入。
4. 可恢复：切换工具、失败和刷新都不得破坏当前项目。
5. 用户语言：隐藏骨骼树和内部字段，用任务与结果描述操作。

## Accessibility & Inclusion

桌面周边 UI 以 WCAG AA 对比度为目标，所有按钮、标签、筛选和弹窗支持键盘焦点；状态不能只依赖颜色。尊重 `prefers-reduced-motion`。完整 3D 骨骼编辑不要求屏幕阅读器直接操纵，但当前姿势、模式、镜头、网格和导出状态必须有文本说明。
