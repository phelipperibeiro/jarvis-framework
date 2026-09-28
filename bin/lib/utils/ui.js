import { getPackageInfo } from "./paths.js";

export const RED = "\x1b[0;31m";
export const GREEN = "\x1b[0;32m";
export const BLUE = "\x1b[0;34m";
export const YELLOW = "\x1b[1;33m";
export const CYAN = "\x1b[0;36m";
export const DIM = "\x1b[2m";
export const BOLD = "\x1b[1m";
export const NC = "\x1b[0m";

export function showBanner() {
  console.log(CYAN);
  console.log("");
  console.log("                 ╔════════════════════════════════╗");
  console.log("              ╔══╝                                ╚══╗");
  console.log("            ╔═╝        ┌────────────────────┐         ╚═╗");
  console.log("          ╔═╝          │     J.A.R.V.I.S    │           ╚═╗");
  console.log("         ║             └────────────────────┘               ║");
  console.log("        ║                                                    ║");
  console.log("       ║                  ╭──────────────╮                   ║");
  console.log("       ║               ╭──╯              ╰──╮                ║");
  console.log("       ║             ╭─╯     ◉        ◉     ╰─╮              ║");
  console.log("       ║            │                          │             ║");
  console.log("       ║            │          ╲____╱          │             ║");
  console.log("       ║            │       ────────────       │             ║");
  console.log("       ║             ╰─╮                    ╭─╯              ║");
  console.log("       ║               ╰──╮              ╭──╯                ║");
  console.log("       ║                  ╰──────────────╯                   ║");
  console.log("        ║                                                    ║");
  console.log("         ╚═╗          ◇  STARK INDUSTRIES  ◇             ╔═╝");
  console.log("           ╚═╗                                        ╔═╝");
  console.log("             ╚══╗    [ SYSTEM ONLINE ]           ╔══╝");
  console.log("                ╚════════════════════════════════╝");
  console.log("");
  console.log("              ──────── J . A . R . V . I . S ────────");
  console.log(NC);
  console.log(
    `${DIM}Framework Jarvis para desenvolvimento assistido por IA${NC}`,
  );

  try {
    const pkg = getPackageInfo();
    console.log("");
    console.log(
      `${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`,
    );
    console.log(`${BOLD}${CYAN}  ${pkg.name}  v${pkg.version}${NC}`);
    console.log(`${DIM}  origem: ${pkg.root}${NC}`);
    console.log(
      `${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}`,
    );
  } catch {
    // banner sem versão se assets não forem encontrados
  }

  console.log("");
  console.log("");
}
