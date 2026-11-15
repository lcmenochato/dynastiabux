import { copyFile, mkdir } from "node:fs/promises";

const source = new URL("../upsell.html", import.meta.url);
const publicDir = new URL("../public/", import.meta.url);
const destination = new URL("../public/upsell.html", import.meta.url);

await mkdir(publicDir, { recursive: true });
await copyFile(source, destination);
console.log("upsell.html sincronizado para public/upsell.html");
