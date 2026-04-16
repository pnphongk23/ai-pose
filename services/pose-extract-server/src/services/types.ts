export type KeyStatus = "active" | "exhausted" | "disabled";

export interface ApiKeyRecord {
  id: string;
  name: string;
  apiKey: string;
  status: KeyStatus;
  requestsToday: number;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface PublicApiKeyRecord {
  id: string;
  name: string;
  status: KeyStatus;
  requestsToday: number;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ExtractedImage {
  imageBase64: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
}
