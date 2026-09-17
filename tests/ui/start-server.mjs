// Playwright owns this process and provides all fixture credentials at BOTH
// build and runtime: Next inlines NEXT_PUBLIC_* during production builds.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const next = require.resolve("next/dist/bin/next");
let child;
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { stopping = true; child?.kill(signal); });
function run(args) {
  return new Promise((resolve, reject) => {
    child = spawn(process.execPath, [next, ...args], { stdio: "inherit", env: process.env, windowsHide: true });
    child.once("error", reject); child.once("exit", (code) => resolve(code ?? 1));
  });
}
const built = await run(["build"]);
if (built !== 0 || stopping) process.exit(built || 1);
process.exit(await run(["start", "--hostname", "127.0.0.1", "--port", "3035"]));
