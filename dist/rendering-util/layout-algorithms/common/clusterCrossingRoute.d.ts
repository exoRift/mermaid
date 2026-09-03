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
/**
 * How far outside the frame an edge turns before crossing it.
 *
 * The turn used to sit exactly on the border, and the leg from wherever the engine left
 * the edge to that turn then ran along the frame at a distance of zero — reading as a line
 * drawn on top of the subgraph's outline. Callers use it too, to drop the points the
 * engine left within this much of the frame, so the leg starts from clear space.
 */
export declare const FRAME_CLEARANCE = 10;
/** A centre-and-size node as the edges of its box, which is what the geometry wants. */
export declare const toBox: (node: {
    x: number;
    y: number;
    width: number;
    height: number;
}) => RouteBox;
/**
 * The side of a node that the given flow direction brings an edge in on, and the side it
 * carries one out of.
 */
export declare const flowSides: (dir: unknown) => {
    entry: Side;
    exit: Side;
};
/**
 * The route from the frame to the lane in front of the target. The caller appends the
 * target's own centre, so the painter clips the last leg to its border.
 *
 * Returns `undefined` when every side of the target is blocked, leaving the caller with
 * what it already had — a straight run beats no edge at all.
 */
export declare const routeClusterCrossing: ({ frame, target, obstacles, approach, preferSide, }: {
    frame?: Bounds;
    target?: RouteBox;
    obstacles?: Bounds[];
    approach?: RoutePoint;
    /** Tried before anything else — see `approachOrder`. */
    preferSide?: Side;
}) => RoutePoint[] | undefined;
