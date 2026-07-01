import fs from "fs";
import path from "path";

const FONT_DIR = path.join(process.cwd(), "assets/fonts");
const FONT_PATH = path.join(FONT_DIR, "Cairo-Regular.ttf");

const FONT_URLS = [
  "https://cdn.jsdelivr.net/gh/googlefonts/cairo@master/fonts/ttf/Cairo-Regular.ttf",
  "https://raw.githubusercontent.com/googlefonts/cairo/main/fonts/ttf/Cairo-Regular.ttf",
];

export async function ensureCertificateFont(): Promise<string | null> {
  if (fs.existsSync(FONT_PATH)) {
    return FONT_PATH;
  }

  fs.mkdirSync(FONT_DIR, { recursive: true });

  for (const url of FONT_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1000) continue;
      fs.writeFileSync(FONT_PATH, buf);
      return FONT_PATH;
    } catch {
      // try next URL
    }
  }

  return null;
}
