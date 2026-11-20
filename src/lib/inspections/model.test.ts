import { describe, expect, it } from "vitest";
import { missingViews, newDamages, photoPointToDiagram, viewOfPoint, type Damage } from "./model";

const d = (x: number, y: number, extra: Partial<Damage> = {}): Damage => ({ id: `${x}-${y}`, x, y, type: "scratch", view: null, note: null, source: "staff", confirmed: true, ...extra });

describe("inspection model", () => {
  it("points of the drawing belong to a view", () => {
    expect(viewOfPoint(0.5, 0.1)).toBe("front");
    expect(viewOfPoint(0.5, 0.9)).toBe("back");
    expect(viewOfPoint(0.1, 0.5)).toBe("left");
    expect(viewOfPoint(0.9, 0.5)).toBe("right");
    expect(viewOfPoint(0.5, 0.5)).toBe("roof");
  });

  it("a point on a photo lands on the right side of the drawing", () => {
    // front photo: the car's left is on the photo's right
    expect(photoPointToDiagram("front", 0.9, 0.5).x).toBeLessThan(0.5);
    // right side photo: the car's front is on the photo's right -> top of the drawing
    expect(photoPointToDiagram("right", 0.95, 0.5)).toMatchObject({ x: 0.84 });
    expect(photoPointToDiagram("right", 0.95, 0.5).y).toBeLessThan(0.3);
    expect(viewOfPoint(photoPointToDiagram("left", 0.5, 0.5).x, photoPointToDiagram("left", 0.5, 0.5).y)).toBe("left");
    expect(viewOfPoint(photoPointToDiagram("back", 0.2, 0.5).x, photoPointToDiagram("back", 0.2, 0.5).y)).toBe("back");
  });

  it("new damages: not near a departure damage; unconfirmed AI suggestions wait", () => {
    const dep = [d(0.3, 0.16)];
    const ret = [d(0.31, 0.17), d(0.86, 0.55), d(0.5, 0.9, { source: "ai", confirmed: false })];
    expect(newDamages(dep, ret).map((x) => [x.x, x.y])).toEqual([[0.86, 0.55]]);
  });

  it("required photos", () => {
    expect(missingViews(["front", "left", "roof"])).toEqual(["back", "right"]);
    expect(missingViews(["front", "back", "left", "right"])).toEqual([]);
  });
});
