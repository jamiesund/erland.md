import { readFile } from "node:fs/promises";
import path from "node:path";
import { markdownFileName } from "@/lib/links";

export async function readMarkdownFile() {
  return readFile(path.join(process.cwd(), "public", markdownFileName), "utf8");
}
