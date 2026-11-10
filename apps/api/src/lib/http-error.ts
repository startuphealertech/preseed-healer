export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }

  static badRequest(message = "Bad request") {
    return new HttpError(400, "BAD_REQUEST", message);
  }
  static unauthorized(message = "Unauthorized") {
    return new HttpError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "Forbidden") {
    return new HttpError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Not found") {
    return new HttpError(404, "NOT_FOUND", message);
  }
}
