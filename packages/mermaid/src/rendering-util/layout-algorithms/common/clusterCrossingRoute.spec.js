import { describe, it, expect } from 'vitest';
import { FRAME_CLEARANCE, routeClusterCrossing, toBox } from './clusterCrossingRoute.js';

/** A subgraph 400 wide and 120 tall, holding one row of three nodes. */
const frame = { left: 0, top: 200, right: 400, bottom: 320 };
const row = {
  first: toBox({ x: 70, y: 260, width: 60, height: 40 }),
  middle: toBox({ x: 200, y: 260, width: 60, height: 40 }),
  last: toBox({ x: 330, y: 260, width: 60, height: 40 }),
};

/** Every leg of a route is either horizontal or vertical. */
const isOrthogonal = (points) =>
  points.every((point, i) => i === 0 || point.x === points[i - 1].x || point.y === points[i - 1].y);

describe('routeClusterCrossing', () => {
  it('crosses the frame lined up with the node when nothing is in the way', () => {
    const route = routeClusterCrossing({
      frame,
      target: row.first,
      obstacles: [row.middle, row.last],
      approach: { x: 200, y: 120 },
    });

    // Straight down the node's own column: lined up clear of the frame, then into the lane.
    expect(route).toEqual([
      { x: 70, y: frame.top - FRAME_CLEARANCE },
      { x: 70, y: 220 },
    ]);
    expect(isOrthogonal(route)).toBe(true);
  });

  it('reaches a node at the far end without crossing the ones before it', () => {
    const route = routeClusterCrossing({
      frame,
      target: row.last,
      obstacles: [row.first, row.middle],
      approach: { x: 200, y: 120 },
    });

    expect(route).toEqual([
      { x: 330, y: frame.top - FRAME_CLEARANCE },
      { x: 330, y: 220 },
    ]);
    // The run down to the node clears both nodes it passes.
    for (const box of [row.first, row.middle]) {
      expect(route[route.length - 1].x).toBeGreaterThan(box.right);
    }
  });

  it('goes around a node standing between the frame and the target', () => {
    // A column: `blocker` sits directly above `target`, so the way straight in is shut.
    const column = { left: 100, top: 100, right: 200, bottom: 300 };
    const target = toBox({ x: 150, y: 260, width: 60, height: 40 });
    const blocker = toBox({ x: 150, y: 150, width: 60, height: 40 });

    const route = routeClusterCrossing({
      frame: column,
      target,
      obstacles: [blocker],
      approach: { x: 150, y: 40 },
    });

    expect(isOrthogonal(route)).toBe(true);
    // Down the side lane, clear of the blocker, and level with the target.
    expect(route).toEqual([
      { x: 110, y: column.top - FRAME_CLEARANCE },
      { x: 110, y: 260 },
    ]);
    expect(route[1].x).toBeLessThan(blocker.left);
  });

  it('rounds a corner when the edge arrives from the side', () => {
    const route = routeClusterCrossing({
      frame,
      target: row.middle,
      obstacles: [row.first, row.last],
      approach: { x: -80, y: 260 },
    });

    expect(isOrthogonal(route)).toBe(true);
    // In through the left of the frame, along the top lane, then down into the node.
    expect(route[0].x).toBe(frame.left - FRAME_CLEARANCE);
    expect(route[route.length - 1]).toEqual({ x: 200, y: 220 });
  });

  it('travels the far lane when the node can only be reached from the other side', () => {
    // `target` is boxed in on three sides, leaving only its bottom open.
    const box = { left: 0, top: 0, right: 300, bottom: 300 };
    const target = toBox({ x: 150, y: 100, width: 60, height: 40 });
    const obstacles = [
      toBox({ x: 60, y: 100, width: 40, height: 200 }),
      toBox({ x: 240, y: 100, width: 40, height: 200 }),
      toBox({ x: 150, y: 40, width: 200, height: 30 }),
    ];

    const route = routeClusterCrossing({
      frame: box,
      target,
      obstacles,
      approach: { x: 150, y: -60 },
    });

    expect(isOrthogonal(route)).toBe(true);
    // It ends below the node, which is the only side left open.
    expect(route[route.length - 1]).toMatchObject({ x: 150 });
    expect(route[route.length - 1].y).toBeGreaterThan(target.bottom);
  });

  it('gives up rather than guessing when the node is walled in', () => {
    const box = { left: 0, top: 0, right: 200, bottom: 200 };
    const target = toBox({ x: 100, y: 100, width: 40, height: 40 });
    // A ring of obstacles leaving no straight run in on any side.
    const obstacles = [
      toBox({ x: 100, y: 40, width: 180, height: 20 }),
      toBox({ x: 100, y: 160, width: 180, height: 20 }),
      toBox({ x: 40, y: 100, width: 20, height: 180 }),
      toBox({ x: 160, y: 100, width: 20, height: 180 }),
    ];

    expect(
      routeClusterCrossing({ frame: box, target, obstacles, approach: { x: 100, y: -50 } })
    ).toBeUndefined();
  });

  it('turns clear of the frame, never along it', () => {
    // The turn used to sit exactly on the border, so the run leading into it traced the
    // subgraph's own outline.
    for (const approach of [
      { x: 200, y: 120 },
      { x: -80, y: 260 },
      { x: 200, y: 420 },
      { x: 480, y: 260 },
    ]) {
      const route = routeClusterCrossing({
        frame,
        target: row.middle,
        obstacles: [row.first, row.last],
        approach,
      });
      const onBorder = route.filter(
        (point) =>
          point.x === frame.left ||
          point.x === frame.right ||
          point.y === frame.top ||
          point.y === frame.bottom
      );
      expect(onBorder).toEqual([]);
    }
  });

  it('has nothing to route without a frame, a target or an approach', () => {
    expect(routeClusterCrossing({ target: row.first, approach: { x: 0, y: 0 } })).toBeUndefined();
    expect(routeClusterCrossing({ frame, approach: { x: 0, y: 0 } })).toBeUndefined();
    expect(routeClusterCrossing({ frame, target: row.first })).toBeUndefined();
  });
});
