import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readMarkdownFile() {
  return readFile(path.join(process.cwd(), "public/jamiesunderland.md"), "utf8");
}
