import type { Metadata } from "next";
import "./globals.css";

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
    <div hidden dangerouslySetInnerHTML={{ __html: "<!-- THESIS: A canvas-first pose workstation that refuses the permanent three-column inspector layout. OWN-WORLD: cool white structural surfaces, graphite text, one precise blue accent, compact linear controls, and border-led depth. STORY: choose a pose, make focused adjustments, then move through camera, perspective, lighting, prompt, and export without losing the canvas. FIRST VIEWPORT: a 56px top bar, 64px left tool rail, the dominant artboard, one 380px right context panel, and a 48px result-and-next bar. FORM: PRD-pinned Operate workstation; seed poseboard-v4-prd. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md -->" }} />
    {children}
  </body></html>;
}
