import fs from "node:fs";
import path from "node:path";

const source = path.resolve(process.cwd(), "src", "db", "schema.sql");
const destination = path.resolve(process.cwd(), "dist", "db", "schema.sql");

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);
