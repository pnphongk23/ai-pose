import { describe, expect, it, vi } from "vitest";

import { GeminiError, GeminiQuotaExceededError } from "./errors";
import { GeminiService } from "./geminiService";

const API_KEY = "AIza-test";

describe("GeminiService", () => {
  it("normalizes successful provider response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: "  dGVzdA==  ",
                    mimeType: "image/png"
                  }
                }
              ]
            }
          }
        ]
      })
    });
    const service = new GeminiService({ fetchImpl: fetchMock as typeof fetch });

    const result = await service.extractPoseImage({
      apiKey: API_KEY,
      sourceImageBase64: "c291cmNl",
      sourceMimeType: "image/jpeg"
    });

    expect(result).toEqual({
      imageBase64: "dGVzdA==",
      mimeType: "image/png"
    });
  });

  it("rejects malformed provider response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [] })
    });
    const service = new GeminiService({ fetchImpl: fetchMock as typeof fetch });

    await expect(
      service.extractPoseImage({
        apiKey: API_KEY,
        sourceImageBase64: "c291cmNl",
        sourceMimeType: "image/png"
      })
    ).rejects.toBeInstanceOf(GeminiError);
  });

  it("rejects non-whitelisted mime type", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ inlineData: { data: "dGVzdA==", mimeType: "image/gif" } }]
            }
          }
        ]
      })
    });
    const service = new GeminiService({ fetchImpl: fetchMock as typeof fetch });

    await expect(
      service.extractPoseImage({
        apiKey: API_KEY,
        sourceImageBase64: "c291cmNl",
        sourceMimeType: "image/png"
      })
    ).rejects.toBeInstanceOf(GeminiError);
  });

  it("maps quota/rate-limit provider errors to quota-exhausted signal", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: {
          status: "RESOURCE_EXHAUSTED",
          message: "Quota exceeded"
        }
      })
    });
    const service = new GeminiService({ fetchImpl: fetchMock as typeof fetch });

    await expect(
      service.extractPoseImage({
        apiKey: API_KEY,
        sourceImageBase64: "c291cmNl",
        sourceMimeType: "image/png"
      })
    ).rejects.toBeInstanceOf(GeminiQuotaExceededError);
  });

  it("maps non-quota provider errors to GEMINI_ERROR", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: {
          status: "INTERNAL",
          message: "Internal error"
        }
      })
    });
    const service = new GeminiService({ fetchImpl: fetchMock as typeof fetch });

    await expect(
      service.extractPoseImage({
        apiKey: API_KEY,
        sourceImageBase64: "c291cmNl",
        sourceMimeType: "image/png"
      })
    ).rejects.toMatchObject({ code: "GEMINI_ERROR" });
  });
});
