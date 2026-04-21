import fs from "node:fs";
import path from "node:path";

import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import { createAdminAuthMiddleware } from "../middleware/adminAuth";
import type { CommunityStore } from "../db/communityStore";

const metadataSchema = z.object({
  name: z.string().trim().min(1),
  tags: z.string().transform((val) => JSON.parse(val) as string[]).pipe(z.array(z.string())),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional(),
  description: z.string().optional().nullable(),
  bodyParts: z.string().transform((val) => JSON.parse(val) as string[]).pipe(z.array(z.string())),
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
