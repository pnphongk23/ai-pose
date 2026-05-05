import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app";

describe("GET /api/health", () => {
  it("returns status, uptime, and version", async () => {
    const app = createApp({ version: "1.2.3" });

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      uptime: expect.any(Number),
      version: "1.2.3"
    });
    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });
});
