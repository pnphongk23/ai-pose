import { Router } from "express";
import { z } from "zod";

import { createAdminAuthMiddleware } from "../middleware/adminAuth";
import { buildPublicUrl, type UploadUrlPayload } from "../services/r2Storage";
import type { CommunityStore } from "../db/communityStore";

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const uploadUrlBodySchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
});

const metadataSchema = z.object({
  name: z.string().trim().min(1),
  fileKey: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional(),
  description: z.string().optional().nullable(),
  bodyParts: z.array(z.string()).optional().default([]),
  status: z.enum(["draft", "published"]).default("draft"),
});

export interface CreateAdminCommunityRoutesOptions {
  adminSecret: string;
  communityStore: CommunityStore;
  r2PublicUrl: string;
  createUploadUrl: (input: { fileName: string; mimeType: string }) => Promise<UploadUrlPayload>;
  objectExists: (fileKey: string) => Promise<boolean>;
}

export function createAdminCommunityRoutes(options: CreateAdminCommunityRoutesOptions): Router {
  const { adminSecret, communityStore, r2PublicUrl, createUploadUrl, objectExists } = options;

  const auth = createAdminAuthMiddleware(adminSecret);
  const router = Router();

  // GET all poses (draft + published) for admin
  router.get("/", auth, (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
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

  // POST /upload-url — generate a presigned R2 POST payload
  router.post("/upload-url", auth, async (req, res) => {
    const parsed = uploadUrlBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      res.status(400).json({ error: { code: "BAD_REQUEST", message: messages } });
      return;
    }

    const { fileName, mimeType } = parsed.data;

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: `mimeType "${mimeType}" is not allowed. Allowed types: ${[...ALLOWED_MIME_TYPES].join(", ")}`,
        },
      });
      return;
    }

    const payload = await createUploadUrl({ fileName, mimeType });
    res.json({ data: payload });
  });

  // POST / — save pose metadata after R2 upload
  router.post("/", auth, async (req, res) => {
    const parsed = metadataSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      res.status(400).json({ error: { code: "BAD_REQUEST", message: messages } });
      return;
    }

    const { name, fileKey, tags, difficulty, description, bodyParts, status } = parsed.data;

    const exists = await objectExists(fileKey);
    if (!exists) {
      res.status(409).json({
        error: {
          code: "CONFLICT",
          message: `File "${fileKey}" not found in storage. Upload the file before submitting metadata.`,
        },
      });
      return;
    }

    const imagePath = buildPublicUrl(r2PublicUrl, fileKey);

    const pose = communityStore.createPose({
      name,
      imagePath,
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
