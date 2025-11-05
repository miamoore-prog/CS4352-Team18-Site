import fs from "fs";
import path from "path";

const USERS_DIR = path.join(process.cwd(), "database", "users");

export function listUsers() {
  const files = fs.readdirSync(USERS_DIR);
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(USERS_DIR, f), "utf8")));
}

export function findUserByUsername(username) {
  const users = listUsers();
  return users.find((u) => u.username === username) || null;
}

export function findUserById(id) {
  const users = listUsers();
  return users.find((u) => u.id === id) || null;
}

export function sanitizeUserForClient(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}
