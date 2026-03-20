import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import {
  SlashCommandPopup,
  SystemMentionPopup,
} from "@/components/slash-command-popup";
import { SLASH_COMMANDS } from "@/lib/slash-commands";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("SlashCommandPopup", () => {
  it("renders nothing when commands is empty", () => {
    const { container } = render(
      <SlashCommandPopup
        commands={[]}
        selectedIndex={0}
        onSelect={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all commands with /{key} labels", () => {
    const { container } = render(
      <SlashCommandPopup
        commands={SLASH_COMMANDS}
        selectedIndex={0}
        onSelect={vi.fn()}
      />,
    );
    const texts = [...container.querySelectorAll(".slash-popup-label")].map(
      (el) => el.textContent,
    );
    for (const cmd of SLASH_COMMANDS) {
      expect(texts).toContain(`/${cmd.key}`);
    }
  });

  it("highlights the selected index item with active class", () => {
    const { container } = render(
      <SlashCommandPopup
        commands={SLASH_COMMANDS.slice(0, 3)}
        selectedIndex={1}
        onSelect={vi.fn()}
      />,
    );
    const items = container.querySelectorAll(".slash-popup-item");
    expect(items[0].className).not.toContain("slash-popup-item-active");
    expect(items[1].className).toContain("slash-popup-item-active");
    expect(items[2].className).not.toContain("slash-popup-item-active");
  });

  it("calls onSelect when item is mouseDown'd", () => {
    const onSelect = vi.fn();
    const subset = SLASH_COMMANDS.slice(0, 2);
    const { container } = render(
      <SlashCommandPopup
        commands={subset}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );
    const items = container.querySelectorAll(".slash-popup-item");
    fireEvent.mouseDown(items[1]);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(subset[1]);
  });
});

describe("SystemMentionPopup", () => {
  it("renders nothing when systems is empty", () => {
    const { container } = render(
      <SystemMentionPopup
        systems={[]}
        selectedIndex={0}
        onSelect={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders system names with @ prefix", () => {
    const { container } = render(
      <SystemMentionPopup
        systems={["Alpha", "Beta"]}
        selectedIndex={0}
        onSelect={vi.fn()}
      />,
    );
    const items = container.querySelectorAll(".slash-popup-item");
    expect(items).toHaveLength(2);
    expect(items[0].querySelector(".slash-popup-icon")?.textContent).toBe("@");
    expect(items[0].querySelector(".slash-popup-label")?.textContent).toBe(
      "Alpha",
    );
    expect(items[1].querySelector(".slash-popup-icon")?.textContent).toBe("@");
    expect(items[1].querySelector(".slash-popup-label")?.textContent).toBe(
      "Beta",
    );
  });

  it("calls onSelect on mouseDown", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <SystemMentionPopup
        systems={["X", "Y"]}
        selectedIndex={0}
        onSelect={onSelect}
      />,
    );
    const items = container.querySelectorAll(".slash-popup-item");
    fireEvent.mouseDown(items[1]);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith("Y");
  });
});
