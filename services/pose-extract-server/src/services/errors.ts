export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class InvalidImageError extends AppError {
  constructor(message = "Invalid image") {
    super(message, 400, "INVALID_IMAGE");
  }
}

export class ImageTooLargeError extends AppError {
  constructor(message = "Image too large") {
    super(message, 413, "IMAGE_TOO_LARGE");
  }
}

export class RateLimitedError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMITED");
  }
}

export class AllKeysExhaustedError extends AppError {
  constructor(message = "All API keys exhausted") {
    super(message, 503, "ALL_KEYS_EXHAUSTED");
  }
}

export class GeminiError extends AppError {
  constructor(message = "Gemini API failed") {
    super(message, 500, "GEMINI_ERROR");
  }
}

export class GeminiQuotaExceededError extends AppError {
  constructor(message = "Gemini API quota exceeded") {
    super(message, 429, "GEMINI_QUOTA_EXCEEDED");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}
