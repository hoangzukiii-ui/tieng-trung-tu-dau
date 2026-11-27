import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

globalThis.require = createRequire(import.meta.url);
globalThis.__dirname = fileURLToPath(new URL("./node_modules/espeak-ng/dist/", import.meta.url));
const { default: espeak } = await import("espeak-ng");
const wasmBinary = readFileSync(join(globalThis.__dirname, "espeak-ng.wasm"));
const content = process.argv[2];
const course = JSON.parse(readFileSync(join(content, "course.json"), "utf8"));
const audit = process.argv.includes("--audit");
const pronunciation = new Map([
  ["现在几点？", "[[S;'iE51n ts'ai51 tS;'i35 t'iE214n]]"],
  ["哪里", "[[nA35 l'i214]]"],
  ["你在哪里？", "[[n'i21 ts'ai51 nA35 l'i214]]"],
  ["请问，车站在哪里？", "[[tS;h'i21N w'u@51n]]，[[ts.h'o55 ts.'a51n ts'ai51 nA35 l'i214]]"],
  ["请问，饭店在哪里？", "[[tS;h'i21N w'u@51n]]，[[f'a51n t'iE51n ts'ai51 nA35 l'i214]]"],
]);
if (!audit) mkdirSync(join(content, "audio"), { recursive: true });

for (const item of course.items) {
  const destination = join(content, item.audio);
  if (!audit && existsSync(destination)) continue;
  const input = pronunciation.get(item.hanzi) ?? item.hanzi;
  const instance = await espeak({
    wasmBinary,
    arguments: audit
      ? ["-v", "cmn", "-b", "1", "-q", "-x", "--phonout=/phonemes.txt", input]
      : ["-v", "cmn", "-s", "135", "-b", "1", "-w", "/clip.wav", input],
  });
  if (audit) {
    console.log(item.id, item.pinyin, instance.FS.readFile("/phonemes.txt", { encoding: "utf8" }).trim());
  } else {
    writeFileSync(destination, instance.FS.readFile("/clip.wav"));
  }
}
