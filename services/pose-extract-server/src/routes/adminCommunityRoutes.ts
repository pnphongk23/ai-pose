import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import { createAdminAuthMiddleware } from "../middleware/adminAuth";
import type { CommunityStore } from "../db/communityStore";

function parseJsonArray(val: string): string[] {
  if (!val || val.trim() === "") return [];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fallback: comma-separated plain text
  }
  return val.split(",").map((s) => s.trim()).filter(Boolean);
}

const metadataSchema = z.object({
  name: z.string().trim().min(1),
  tags: z.string().optional().default("").transform(parseJsonArray),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional(),
  description: z.string().optional().nullable(),
  bodyParts: z.string().optional().default("").transform(parseJsonArray),
  status: z.enum(["draft", "published"]).default("draft"),
});

export interface CreateAdminCommunityRoutesOptions {
  adminSecret: string;
  communityStore: CommunityStore;
  uploadDir: string;
}

export function createAdminCommunityRoutes(options: CreateAdminCommunityRoutesOptions): Router {
  const { adminSecret, communityStore, uploadDir } = options;

  fs.mkdirSync(uploadDir, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || ".png";
        const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, uniqueName);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files allowed"));
      }
    },
  });

  const auth = createAdminAuthMiddleware(adminSecret);
  const router = Router();

  // GET all poses (draft + published) for admin
  router.get("/", auth, (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const status = (req.query.status as string) === "draft" ? "draft" : "published";
    const allStatuses: Array<"draft" | "published"> = ["draft", "published"];
    const results = allStatuses.flatMap((s) =>
      communityStore.listPoses({ status: s, page: 1, limit: 200 }).poses
    );
    // sort by uploadedAt desc
    results.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
    const offset = (page - 1) * limit;
    const paginated = results.slice(offset, offset + limit);
    res.json({ data: paginated, pagination: { page, limit, total: results.length } });
  });

  router.post("/", auth, upload.single("image"), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "image file is required" } });
      return;
    }

    const parsed = metadataSchema.safeParse(req.body);
    if (!parsed.success) {
      fs.unlink(req.file.path, () => {});
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      res.status(400).json({ error: { code: "BAD_REQUEST", message: messages } });
      return;
    }

    const { name, tags, difficulty, description, bodyParts, status } = parsed.data;
    const relativePath = `community/${path.basename(req.file.path)}`;

    const pose = communityStore.createPose({
      name,
      imagePath: relativePath,
      thumbnailPath: null,
      tags,
      difficulty: difficulty ?? null,
      description: description ?? null,
      bodyParts,
      status,
    });

    res.status(201).json({ data: pose });
  });

  return router;
}
