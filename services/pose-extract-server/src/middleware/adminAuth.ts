import type { NextFunction, Request, Response } from "express";

function unauthorized(res: Response): void {
  res.status(401).json({
    error: {
      code: "UNAUTHORIZED",
      message: "Unauthorized"
    }
  });
}

export function createAdminAuthMiddleware(adminSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.header("authorization");
    const match = authHeader?.match(/^\s*Bearer\s+(.+)\s*$/i);
    if (!match) {
      unauthorized(res);
      return;
    }

    const token = match[1].trim();
    if (!token) {
      unauthorized(res);
      return;
    }

    if (token !== adminSecret) {
      unauthorized(res);
      return;
    }

    next();
  };
}
