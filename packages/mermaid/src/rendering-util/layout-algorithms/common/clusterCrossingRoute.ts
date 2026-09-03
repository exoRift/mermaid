/**
 * Orthogonal routing for the leg of an edge that crosses a subgraph's frame.
 *
 * A subgraph with a direction of its own has to be laid out as a graph of its own for that
 * direction to be honoured, and neither layout engine will route an edge into a graph it
 * lays out separately — dagre cannot see inside it, and `elk.layered` refuses outright.
 * Both therefore lay the edge out as far as the frame, and both call this to carry it the
 * rest of the way: cross the frame, travel the lane between the frame and the nodes, and
 * turn in on a side of the node that is clear.
 *
 * Every coordinate here is in the coordinate space the frame is given in.
 */

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** A node's box, plus the centre the straight runs line up on. */
export interface RouteBox extends Bounds {
  cx: number;
  cy: number;
}

export interface RoutePoint {
  x: number;
  y: number;
}

export type Side = 'top' | 'bottom' | 'left' | 'right';

/** How far a run has to clear an obstacle to count as missing it. */
const CLEARANCE = 2;

/**
 * How far outside the frame an edge turns before crossing it.
 *
 * The turn used to sit exactly on the border, and the leg from wherever the engine left
 * the edge to that turn then ran along the frame at a distance of zero — reading as a line
 * drawn on top of the subgraph's outline. Callers use it too, to drop the points the
 * engine left within this much of the frame, so the leg starts from clear space.
 */
export const FRAME_CLEARANCE = 10;

const OUTWARD: Record<Side, -1 | 1> = { top: -1, bottom: 1, left: -1, right: 1 };

const SIDES: Side[] = ['top', 'bottom', 'left', 'right'];
const OPPOSITE: Record<Side, Side> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const isVertical = (side: Side) => side === 'top' || side === 'bottom';

/** A centre-and-size node as the edges of its box, which is what the geometry wants. */
export const toBox = (node: { x: number; y: number; width: number; height: number }): RouteBox => ({
  left: node.x - node.width / 2,
  right: node.x + node.width / 2,
  top: node.y - node.height / 2,
  bottom: node.y + node.height / 2,
  cx: node.x,
  cy: node.y,
});

const union = (boxes: Bounds[]): Bounds => ({
  left: Math.min(...boxes.map((b) => b.left)),
  right: Math.max(...boxes.map((b) => b.right)),
  top: Math.min(...boxes.map((b) => b.top)),
  bottom: Math.max(...boxes.map((b) => b.bottom)),
});

/**
 * The lane on each side: halfway between the frame and the nearest thing inside it.
 * Nothing is laid out there, which is what makes it safe to travel along.
 */
const lanesOf = (frame: Bounds, contents: Bounds): Record<Side, number> => ({
  top: (frame.top + contents.top) / 2,
  bottom: (frame.bottom + contents.bottom) / 2,
  left: (frame.left + contents.left) / 2,
  right: (frame.right + contents.right) / 2,
});

/** The side of the frame the edge arrives from — the one it is furthest outside of. */
const entrySideFor = (frame: Bounds, approach: RoutePoint): Side => {
  const outside: Record<Side, number> = {
    top: frame.top - approach.y,
    bottom: approach.y - frame.bottom,
    left: frame.left - approach.x,
    right: approach.x - frame.right,
  };
  return SIDES.reduce((best, side) => (outside[side] > outside[best] ? side : best), 'top');
};

const segmentHitsBox = (from: RoutePoint, to: RoutePoint, box: Bounds) => {
  const minX = Math.min(from.x, to.x) - CLEARANCE;
  const maxX = Math.max(from.x, to.x) + CLEARANCE;
  const minY = Math.min(from.y, to.y) - CLEARANCE;
  const maxY = Math.max(from.y, to.y) + CLEARANCE;
  return box.left < maxX && box.right > minX && box.top < maxY && box.bottom > minY;
};

/** Where the straight run into the target starts, out in the lane on the given side. */
const laneEntryFor = (side: Side, target: RouteBox, lanes: Record<Side, number>): RoutePoint =>
  isVertical(side) ? { x: target.cx, y: lanes[side] } : { x: lanes[side], y: target.cy };

/** The point on the target's own border that the run finishes on. */
const borderPointFor = (side: Side, target: RouteBox): RoutePoint =>
  isVertical(side) ? { x: target.cx, y: target[side] } : { x: target[side], y: target.cy };

/**
 * Sides of the target to come in on, best first: the side the subgraph's own flow would
 * bring an edge in on, then straight on from where this edge arrived, then around a
 * corner, and only then all the way around to the far side.
 *
 * The flow side leads for a reason. The node's other edges leave along that same axis, so
 * arriving on it keeps this leg in line with them — which matters most at the junction
 * nodes people use to fan a flow out, where the two meet with nothing drawn in between.
 */
const approachOrder = (entrySide: Side, preferred?: Side): Side[] => {
  const rest = [
    entrySide,
    ...SIDES.filter((side) => side !== entrySide && side !== OPPOSITE[entrySide]),
    OPPOSITE[entrySide],
  ];
  return preferred ? [preferred, ...rest.filter((side) => side !== preferred)] : rest;
};

/**
 * The side of a node that the given flow direction brings an edge in on, and the side it
 * carries one out of.
 */
export const flowSides = (dir: unknown): { entry: Side; exit: Side } => {
  switch (dir) {
    case 'LR':
      return { entry: 'left', exit: 'right' };
    case 'RL':
      return { entry: 'right', exit: 'left' };
    case 'BT':
      return { entry: 'bottom', exit: 'top' };
    case 'TB':
    case 'TD':
      return { entry: 'top', exit: 'bottom' };
    default:
      return { entry: 'top', exit: 'bottom' };
  }
};

/**
 * Where the route lines itself up before crossing the frame — `FRAME_CLEARANCE` outside it,
 * so whatever run leads into the crossing stays clear of the border rather than tracing it.
 */
const crossingAt = (entrySide: Side, frame: Bounds, next: RoutePoint): RoutePoint => {
  const edge = frame[entrySide] + OUTWARD[entrySide] * FRAME_CLEARANCE;
  return isVertical(entrySide) ? { x: next.x, y: edge } : { x: edge, y: next.y };
};

/**
 * The flank a route travels down when it has to cross the whole subgraph: the left or
 * right lane for a top/bottom entry, the top or bottom lane otherwise. Whichever the edge
 * already arrives nearest, so it does not double back on itself.
 */
const flankLaneFor = (entrySide: Side, approach: RoutePoint, lanes: Record<Side, number>) => {
  const [near, far]: Side[] = isVertical(entrySide) ? ['left', 'right'] : ['top', 'bottom'];
  const along = isVertical(entrySide) ? approach.x : approach.y;
  return Math.abs(along - lanes[near]) <= Math.abs(along - lanes[far]) ? lanes[near] : lanes[far];
};

/**
 * The route from the frame to the lane in front of the target. The caller appends the
 * target's own centre, so the painter clips the last leg to its border.
 *
 * Returns `undefined` when every side of the target is blocked, leaving the caller with
 * what it already had — a straight run beats no edge at all.
 */
export const routeClusterCrossing = ({
  frame,
  target,
  obstacles = [],
  approach,
  preferSide,
}: {
  frame?: Bounds;
  target?: RouteBox;
  obstacles?: Bounds[];
  approach?: RoutePoint;
  /** Tried before anything else — see `approachOrder`. */
  preferSide?: Side;
}): RoutePoint[] | undefined => {
  if (!frame || !target || !approach) {
    return undefined;
  }
  const lanes = lanesOf(frame, union([target, ...obstacles]));
  const entrySide = entrySideFor(frame, approach);

  for (const approachSide of approachOrder(entrySide, preferSide)) {
    const laneEntry = laneEntryFor(approachSide, target, lanes);
    const border = borderPointFor(approachSide, target);
    if (obstacles.some((box) => segmentHitsBox(laneEntry, border, box))) {
      continue;
    }

    if (approachSide === OPPOSITE[entrySide]) {
      // All the way around: in along one flank, across the far lane, then in.
      const flank = flankLaneFor(entrySide, approach, lanes);
      const alongFlank = isVertical(entrySide)
        ? { x: flank, y: laneEntry.y }
        : { x: laneEntry.x, y: flank };
      return [crossingAt(entrySide, frame, alongFlank), alongFlank, laneEntry];
    }

    // Straight on, or around a single corner: either way the frame is crossed already
    // lined up with the lane the run travels down.
    return [crossingAt(entrySide, frame, laneEntry), laneEntry];
  }

  return undefined;
};
