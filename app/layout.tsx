import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoseBoard 3D — 姿势与构图参考工具",
  description: "在浏览器中快速调整 3D 白模、镜头与构图，并导出干净的 PNG 参考图。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
