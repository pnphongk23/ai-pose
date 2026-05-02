import { randomUUID } from "node:crypto";
import path from "node:path";

import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

import { getEnv } from "../config/env";

export interface UploadUrlPayload {
  uploadUrl: string;
  fileKey: string;
  fields: Record<string, string>;
}

export function getR2Client(): S3Client {
  const env = getEnv();
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY
    }
  });
}

export async function createUploadUrl(input: {
  fileName: string;
  mimeType: string;
}): Promise<UploadUrlPayload> {
  const env = getEnv();
  const ext = path.extname(input.fileName) || ".bin";
  const fileKey = `community/${randomUUID()}${ext.toLowerCase()}`;

  const signed = await createPresignedPost(getR2Client(), {
    Bucket: env.R2_BUCKET,
    Key: fileKey,
    Conditions: [["content-length-range", 1, 10 * 1024 * 1024], ["eq", "$Content-Type", input.mimeType]],
    Fields: {
      "Content-Type": input.mimeType
    },
    Expires: 60
  });

  return {
    uploadUrl: signed.url,
    fileKey,
    fields: signed.fields
  };
}

export async function objectExists(fileKey: string): Promise<boolean> {
  const env = getEnv();

  try {
    await getR2Client().send(
      new HeadObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: fileKey
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function buildPublicUrl(base: string, fileKey: string): string {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedKey = fileKey.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedKey}`;
}
