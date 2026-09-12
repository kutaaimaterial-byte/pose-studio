import type { Metadata } from "next";
import "./globals.css";
import "./precision-light.css";
import "./stage-studio.css";
import "./recipe-studio.css";
import "./project-workspace.css";
import "./action-library.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://poseboard-3d-studio.kutaaimaterial.chatgpt.site"),
  title: "AI Character Studio | PoseBoard 3D Studio",
  description: "A professional 3D pose, camera, lighting, and prompt workspace for AI image, video, and visual designers.",
  openGraph: {
    title: "PoseBoard 3D | AI Character Studio",
    description: "Design human poses, cameras, and lighting, then generate production-ready AI prompts.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "PoseBoard 3D AI Character Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PoseBoard 3D | AI Character Studio",
    description: "A professional human pose workspace for AI creators.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <div hidden dangerouslySetInnerHTML={{ __html: "<!-- THESIS: A precision-light canvas workstation that keeps pose, camera, and animation controls visible without crowding the character. OWN-WORLD: cool white surfaces, graphite text, one precise blue accent, compact linear controls, and border-led depth. STORY: choose a pose, adjust the character, animate the camera, and export without leaving the workspace. FIRST VIEWPORT: a 48px top bar, 44px horizontal tool navigation, the dominant artboard, a 372px pose library, and a three-lane timeline. FORM: PRD-pinned Operate workstation; seed poseboard-v4-prd. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md -->" }} />
    {children}
  </body></html>;
}
