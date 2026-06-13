import { describe, it, expect, vi, afterEach } from "vitest";
import {
  errorHandler,
  AppError,
} from "../../../app/src/middleware/errorHandler.js";
import { Request, Response } from "express";

describe("errorHandler", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("sanitizes non-operational AppError in production", () => {
    const err = new AppError("Internal secret message", 500, false);
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      headersSent: false,
    } as unknown as Response;
    const next = vi.fn();

    process.env.NODE_ENV = "production";
    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
      statusCode: 500,
    });
  });

  it("leaks operational AppError message even in production", () => {
    const err = new AppError("Operational secret message", 400, true);
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      headersSent: false,
    } as unknown as Response;
    const next = vi.fn();

    process.env.NODE_ENV = "production";
    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: "Operational secret message",
      statusCode: 400,
    });
  });

  it("sanitizes generic Error when NODE_ENV is unset/test", () => {
    const err = new Error("Secret db failure");
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      headersSent: false,
    } as unknown as Response;
    const next = vi.fn();

    process.env.NODE_ENV = "test";
    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
      statusCode: 500,
    });
  });

  it("leaks generic Error message in development", () => {
    const err = new Error("Secret db failure");
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      headersSent: false,
    } as unknown as Response;
    const next = vi.fn();

    process.env.NODE_ENV = "development";
    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      error: "Secret db failure",
      statusCode: 500,
    });
  });
});
