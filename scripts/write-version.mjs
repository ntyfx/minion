import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf-8"));
const version = pkg.version;

writeFileSync(
  resolve(__dirname, "../public/version.json"),
  JSON.stringify({ version }) + "\n",
);
console.log(`Wrote version.json → ${version}`);

const swTemplate = readFileSync(resolve(__dirname, "sw.template.js"), "utf-8");
writeFileSync(
  resolve(__dirname, "../public/sw.js"),
  swTemplate.replace("__APP_VERSION__", version),
);
console.log(`Stamped sw.js → ${version}`);
