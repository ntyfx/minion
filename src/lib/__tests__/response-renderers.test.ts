import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  registerRenderer,
  unregisterRenderer,
  getRenderers,
  findMatchingRenderer,
  setRendererEnabled,
  type ResponseRenderer,
} from "@/lib/response-renderers";

function makeRenderer(
  partial: Pick<ResponseRenderer, "id" | "priority"> & Partial<ResponseRenderer>,
): ResponseRenderer {
  return {
    name: partial.id,
    match: () => false,
    render: () => null,
    enabled: true,
    ...partial,
  } as ResponseRenderer;
}

describe("response-renderers registry", () => {
  const ids = ["rr-test-a", "rr-test-b", "rr-test-c"];

  beforeEach(() => {
    ids.forEach((id) => unregisterRenderer(id));
  });

  afterEach(() => {
    ids.forEach((id) => unregisterRenderer(id));
  });

  it("registerRenderer adds to registry", () => {
    registerRenderer(
      makeRenderer({
        id: "rr-test-a",
        priority: 1,
        match: (c) => c.includes("alpha"),
      }),
    );
    const r = findMatchingRenderer("has alpha");
    expect(r?.id).toBe("rr-test-a");
  });

  it("getRenderers returns only enabled renderers", () => {
    registerRenderer(makeRenderer({ id: "rr-test-a", priority: 5, match: () => true }));
    registerRenderer(makeRenderer({ id: "rr-test-b", priority: 4, match: () => true }));
    setRendererEnabled("rr-test-b", false);
    const enabled = getRenderers().map((r) => r.id);
    expect(enabled).toContain("rr-test-a");
    expect(enabled).not.toContain("rr-test-b");
  });

  it("findMatchingRenderer returns highest priority enabled match", () => {
    registerRenderer(
      makeRenderer({
        id: "rr-test-a",
        priority: 10,
        match: (c) => c.includes("x"),
      }),
    );
    registerRenderer(
      makeRenderer({
        id: "rr-test-b",
        priority: 5,
        match: (c) => c.includes("x"),
      }),
    );
    expect(findMatchingRenderer("x")?.id).toBe("rr-test-a");
    setRendererEnabled("rr-test-a", false);
    expect(findMatchingRenderer("x")?.id).toBe("rr-test-b");
  });

  it("setRendererEnabled toggles renderer", () => {
    registerRenderer(
      makeRenderer({
        id: "rr-test-a",
        priority: 1,
        match: (c) => c === "ping",
      }),
    );
    expect(findMatchingRenderer("ping")).not.toBeNull();
    setRendererEnabled("rr-test-a", false);
    expect(findMatchingRenderer("ping")).toBeNull();
    setRendererEnabled("rr-test-a", true);
    expect(findMatchingRenderer("ping")?.id).toBe("rr-test-a");
  });

  it("unregisterRenderer removes renderer", () => {
    registerRenderer(
      makeRenderer({
        id: "rr-test-c",
        priority: 2,
        match: (c) => c === "bye",
      }),
    );
    expect(findMatchingRenderer("bye")?.id).toBe("rr-test-c");
    unregisterRenderer("rr-test-c");
    expect(findMatchingRenderer("bye")).toBeNull();
  });
});
