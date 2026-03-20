import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { downloadBlob } from "@/lib/download";

describe("downloadBlob", () => {
  const realCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:unit-test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a blob with correct content and mime type", () => {
    const BlobSpy = vi.spyOn(globalThis, "Blob");
    downloadBlob("hello world", "out.txt", "text/plain");
    expect(BlobSpy).toHaveBeenCalledWith(["hello world"], {
      type: "text/plain;charset=utf-8",
    });
  });

  it("creates an anchor element, sets href and download, clicks it, and revokes URL", () => {
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return mockAnchor as unknown as HTMLAnchorElement;
      }
      return realCreateElement(tag);
    });

    downloadBlob("csv,data", "report.csv", "text/csv");

    expect(URL.createObjectURL).toHaveBeenCalled();
    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Blob;
    expect(blobArg).toBeInstanceOf(Blob);

    expect(mockAnchor.href).toBe("blob:unit-test");
    expect(mockAnchor.download).toBe("report.csv");
    expect(mockAnchor.click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:unit-test");
  });
});
