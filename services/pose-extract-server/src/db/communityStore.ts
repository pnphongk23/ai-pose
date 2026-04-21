import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

export type PoseStatus = "draft" | "published";
export type PoseDifficulty = "beginner" | "intermediate" | "advanced";

export interface CommunityPoseRecord {
  id: string;
  name: string;
  imagePath: string;
  thumbnailPath: string | null;
  tags: string[];
  difficulty: PoseDifficulty | null;
  description: string | null;
  bodyParts: string[];
  status: PoseStatus;
  uploadedAt: string;
  downloadCount: number;
}

export interface CreatePoseInput {
  name: string;
  imagePath: string;
  thumbnailPath: string | null;
  tags: string[];
  difficulty: PoseDifficulty | null;
  description: string | null;
  bodyParts: string[];
  status: PoseStatus;
}

export interface ListPosesFilter {
  status: PoseStatus;
  difficulty?: PoseDifficulty;
  tag?: string;
  page: number;
  limit: number;
}

export interface ListPosesResult {
  poses: CommunityPoseRecord[];
  total: number;
}

interface CommunityPoseRow {
  id: string;
  name: string;
  image_path: string;
  thumbnail_path: string | null;
  tags: string;
  difficulty: PoseDifficulty | null;
  description: string | null;
  body_parts: string;
  status: PoseStatus;
  uploaded_at: string;
  download_count: number;
}

export class CommunityStore {
  constructor(private readonly db: Database.Database) {}

  createPose(input: CreatePoseInput): CommunityPoseRecord {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO community_poses
           (id, name, image_path, thumbnail_path, tags, difficulty, description, body_parts, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        input.name,
        input.imagePath,
        input.thumbnailPath,
        JSON.stringify(input.tags),
        input.difficulty,
        input.description,
        JSON.stringify(input.bodyParts),
        input.status
      );

    const created = this.getPoseById(id);
    if (!created) throw new Error("Failed to create pose");
    return created;
  }

  getPoseById(id: string): CommunityPoseRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM community_poses WHERE id = ?`)
      .get(id) as CommunityPoseRow | undefined;
    return row ? this.toRecord(row) : null;
  }

  listPoses(filter: ListPosesFilter): ListPosesResult {
    const conditions: string[] = ["status = ?"];
    const params: unknown[] = [filter.status];

    if (filter.difficulty) {
      conditions.push("difficulty = ?");
      params.push(filter.difficulty);
    }

    if (filter.tag) {
      conditions.push("tags LIKE ?");
      params.push(`%"${filter.tag}"%`);
    }

    const where = conditions.join(" AND ");
    const offset = (filter.page - 1) * filter.limit;

    const countRow = this.db
      .prepare(`SELECT COUNT(*) as count FROM community_poses WHERE ${where}`)
      .get(...params) as { count: number };

    const rows = this.db
      .prepare(
        `SELECT * FROM community_poses WHERE ${where}
         ORDER BY uploaded_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, filter.limit, offset) as CommunityPoseRow[];

    return {
      poses: rows.map((row) => this.toRecord(row)),
      total: countRow.count,
    };
  }

  incrementDownload(id: string): void {
    this.db
      .prepare(
        `UPDATE community_poses SET download_count = download_count + 1 WHERE id = ?`
      )
      .run(id);
  }

  private toRecord(row: CommunityPoseRow): CommunityPoseRecord {
    return {
      id: row.id,
      name: row.name,
      imagePath: row.image_path,
      thumbnailPath: row.thumbnail_path,
      tags: JSON.parse(row.tags) as string[],
      difficulty: row.difficulty,
      description: row.description,
      bodyParts: JSON.parse(row.body_parts) as string[],
      status: row.status,
      uploadedAt: row.uploaded_at,
      downloadCount: row.download_count,
    };
  }
}
