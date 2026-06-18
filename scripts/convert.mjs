import { writeFile, readFile } from "node:fs/promises";

const [, , input, outPath] = process.argv;
if (!input) throw new Error("usage: node convert.mjs <base64-or-@file> [outPath]");

const raw = input.startsWith("@") ? await readFile(input.slice(1), "utf8") : input;
const clean = raw.trim().replace(/^data:[^;]+;base64,/, "");
const buf = Buffer.from(clean, "base64");

const out = outPath ?? `out.${type.ext}`;
await writeFile(out, buf);
console.log(`wrote ${out} (${type.ext}, ${buf.length} bytes)`);
