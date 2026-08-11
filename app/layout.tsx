import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://poseboard-3d-studio.kutaaimaterial.chatgpt.site"),
  title: "AI Character Studio — PoseBoard 3D Studio",
  description: "面向 AI 绘图、AI 视频与视觉设计师的人体姿态、镜头、灯光和 Prompt 创作工作台。",
  openGraph: {
    title: "PoseBoard 3D — AI Character Studio",
    description: "设计人体姿态、镜头与灯光，并生成可直接使用的 AI Prompt。",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "PoseBoard 3D AI Character Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PoseBoard 3D — AI Character Studio",
    description: "AI 创作者的人体姿态设计工作台。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
