import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { ExplainerController } from "../../../app/src/controllers/explainerController";
import {
  ExplainerService,
  NotArticleError,
} from "../../../app/src/services/explainerService";
import { ExplainerUnavailableError } from "../../../app/src/adapters/claudeExplainer";
import { AppError } from "../../../app/src/middleware/errorHandler";
import type { AuthenticatedRequest } from "../../../app/src/middleware/auth";
import { DiscoveryService } from "../../../app/src/services/discoveryService";

const URL = "https://en.wikipedia.org/wiki/Tardigrade";

const makeReq = (url: string | undefined): Request =>
  ({ query: url === undefined ? {} : { url } }) as unknown as Request;

const makeRes = () => {
  const res = { json: vi.fn() } as unknown as Response;
  return res;
};

/** A fake ExplainerService whose explain() does whatever the test needs. */
const fakeService = (explain: () => Promise<unknown>) =>
  ({ explain }) as unknown as ExplainerService;

describe("ExplainerController.read (#219)", () => {
  it("200s with the draft on success", async () => {
    const draft = { summary: "x", keyPoints: [], scenes: [], image: null, provenance: "p", sourceUrl: URL };
    const res = makeRes();
    const ctrl = new ExplainerController(fakeService(async () => draft));

    await ctrl.read(makeReq(URL), res);

    expect(res.json).toHaveBeenCalledWith(draft);
  });

  it("400 when url is missing", async () => {
    const ctrl = new ExplainerController(fakeService(async () => ({})));
    await expect(ctrl.read(makeReq(undefined), makeRes())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("422 when the explainer is not configured", async () => {
    const ctrl = new ExplainerController(null);
    await expect(ctrl.read(makeReq(URL), makeRes())).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it("422 on NotArticleError", async () => {
    const ctrl = new ExplainerController(
      fakeService(async () => {
        throw new NotArticleError(URL);
      }),
    );
    const err = await ctrl.read(makeReq(URL), makeRes()).catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(422);
  });

  it("503 on an upstream LLM failure", async () => {
    const ctrl = new ExplainerController(
      fakeService(async () => {
        throw new ExplainerUnavailableError("boom");
      }),
    );
    const err = await ctrl.read(makeReq(URL), makeRes()).catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(503);
  });

  it("503 (never 500) on any other failure", async () => {
    const ctrl = new ExplainerController(
      fakeService(async () => {
        throw new Error("network exploded");
      }),
    );
    await expect(ctrl.read(makeReq(URL), makeRes())).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});

const makeRateReq = (body: unknown, userId?: string): AuthenticatedRequest =>
  ({ body, user_id: userId }) as unknown as AuthenticatedRequest;

const makeRateRes = () => ({ sendStatus: vi.fn() }) as unknown as Response;

const fakeDiscovery = () => {
  const rate = vi.fn(async () => {});
  return { service: { rate } as unknown as DiscoveryService, rate };
};

describe("ExplainerController.rate (#225)", () => {
  it("feeds discoveryService prefs and 204s", async () => {
    const { service, rate } = fakeDiscovery();
    const ctrl = new ExplainerController(null, service);
    const res = makeRateRes();

    await ctrl.rate(
      makeRateReq({ assetId: "a1", isPositive: true }, "u1"),
      res,
    );

    expect(rate).toHaveBeenCalledWith("a1", true, "u1");
    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });

  it("401 when unauthenticated", async () => {
    const { service } = fakeDiscovery();
    const ctrl = new ExplainerController(null, service);
    await expect(
      ctrl.rate(makeRateReq({ assetId: "a1", isPositive: true }), makeRateRes()),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("400 on an invalid body (missing/!boolean fields)", async () => {
    const { service, rate } = fakeDiscovery();
    const ctrl = new ExplainerController(null, service);
    await expect(
      ctrl.rate(makeRateReq({ assetId: "a1" }, "u1"), makeRateRes()),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(rate).not.toHaveBeenCalled();
  });
});
