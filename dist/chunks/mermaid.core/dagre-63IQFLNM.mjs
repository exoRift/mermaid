import {
  adjustClustersAndEdges,
  clusterDb,
  createCommonLayoutRenderer,
  createLayoutElementGroups,
  findNonClusterChild,
  insertMeasuredNode,
  sortNodesByHierarchy
} from "./chunk-MIQMH3EX.mjs";
import {
  insertCluster
} from "./chunk-BD47WVAS.mjs";
import {
  insertEdge,
  insertEdgeLabel,
  positionEdgeLabel
} from "./chunk-KMRHZOZX.mjs";
import {
  getSubGraphTitleMargins,
  positionNode,
  setNodeElem
} from "./chunk-IBF6GQSA.mjs";
import {
  intersect_rect_default,
  updateNodeBounds
} from "./chunk-YSWIPMVQ.mjs";
import "./chunk-H5QFDMAM.mjs";
import "./chunk-J5ZVWO5B.mjs";
import "./chunk-FP5LUCQQ.mjs";
import "./chunk-WAHVBNYK.mjs";
import "./chunk-MR5B6ZOG.mjs";
import {
  getConfig2 as getConfig
} from "./chunk-TBLCSLTH.mjs";
import {
  log
} from "./chunk-X3CZISLH.mjs";
import {
  __name
} from "./chunk-Y2CYZVJY.mjs";

// src/rendering-util/layout-algorithms/dagre/index.js
import { layout as dagreLayout } from "dagre-d3-es/src/dagre/index.js";
import * as graphlib from "dagre-d3-es/src/graphlib/index.js";

// src/rendering-util/layout-algorithms/common/clusterCrossingRoute.ts
var CLEARANCE = 2;
var FRAME_CLEARANCE = 10;
var OUTWARD = { top: -1, bottom: 1, left: -1, right: 1 };
var SIDES = ["top", "bottom", "left", "right"];
var OPPOSITE = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left"
};
var isVertical = /* @__PURE__ */ __name((side) => side === "top" || side === "bottom", "isVertical");
var toBox = /* @__PURE__ */ __name((node) => ({
  left: node.x - node.width / 2,
  right: node.x + node.width / 2,
  top: node.y - node.height / 2,
  bottom: node.y + node.height / 2,
  cx: node.x,
  cy: node.y
}), "toBox");
var union = /* @__PURE__ */ __name((boxes) => ({
  left: Math.min(...boxes.map((b) => b.left)),
  right: Math.max(...boxes.map((b) => b.right)),
  top: Math.min(...boxes.map((b) => b.top)),
  bottom: Math.max(...boxes.map((b) => b.bottom))
}), "union");
var lanesOf = /* @__PURE__ */ __name((frame, contents) => ({
  top: (frame.top + contents.top) / 2,
  bottom: (frame.bottom + contents.bottom) / 2,
  left: (frame.left + contents.left) / 2,
  right: (frame.right + contents.right) / 2
}), "lanesOf");
var entrySideFor = /* @__PURE__ */ __name((frame, approach) => {
  const outside = {
    top: frame.top - approach.y,
    bottom: approach.y - frame.bottom,
    left: frame.left - approach.x,
    right: approach.x - frame.right
  };
  return SIDES.reduce((best, side) => outside[side] > outside[best] ? side : best, "top");
}, "entrySideFor");
var segmentHitsBox = /* @__PURE__ */ __name((from, to, box) => {
  const minX = Math.min(from.x, to.x) - CLEARANCE;
  const maxX = Math.max(from.x, to.x) + CLEARANCE;
  const minY = Math.min(from.y, to.y) - CLEARANCE;
  const maxY = Math.max(from.y, to.y) + CLEARANCE;
  return box.left < maxX && box.right > minX && box.top < maxY && box.bottom > minY;
}, "segmentHitsBox");
var laneEntryFor = /* @__PURE__ */ __name((side, target, lanes) => isVertical(side) ? { x: target.cx, y: lanes[side] } : { x: lanes[side], y: target.cy }, "laneEntryFor");
var borderPointFor = /* @__PURE__ */ __name((side, target) => isVertical(side) ? { x: target.cx, y: target[side] } : { x: target[side], y: target.cy }, "borderPointFor");
var approachOrder = /* @__PURE__ */ __name((entrySide, preferred) => {
  const rest = [
    entrySide,
    ...SIDES.filter((side) => side !== entrySide && side !== OPPOSITE[entrySide]),
    OPPOSITE[entrySide]
  ];
  return preferred ? [preferred, ...rest.filter((side) => side !== preferred)] : rest;
}, "approachOrder");
var flowSides = /* @__PURE__ */ __name((dir) => {
  switch (dir) {
    case "LR":
      return { entry: "left", exit: "right" };
    case "RL":
      return { entry: "right", exit: "left" };
    case "BT":
      return { entry: "bottom", exit: "top" };
    case "TB":
    case "TD":
      return { entry: "top", exit: "bottom" };
    default:
      return { entry: "top", exit: "bottom" };
  }
}, "flowSides");
var crossingAt = /* @__PURE__ */ __name((entrySide, frame, next) => {
  const edge = frame[entrySide] + OUTWARD[entrySide] * FRAME_CLEARANCE;
  return isVertical(entrySide) ? { x: next.x, y: edge } : { x: edge, y: next.y };
}, "crossingAt");
var flankLaneFor = /* @__PURE__ */ __name((entrySide, approach, lanes) => {
  const [near, far] = isVertical(entrySide) ? ["left", "right"] : ["top", "bottom"];
  const along = isVertical(entrySide) ? approach.x : approach.y;
  return Math.abs(along - lanes[near]) <= Math.abs(along - lanes[far]) ? lanes[near] : lanes[far];
}, "flankLaneFor");
var routeClusterCrossing = /* @__PURE__ */ __name(({
  frame,
  target,
  obstacles = [],
  approach,
  preferSide
}) => {
  if (!frame || !target || !approach) {
    return void 0;
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
      const flank = flankLaneFor(entrySide, approach, lanes);
      const alongFlank = isVertical(entrySide) ? { x: flank, y: laneEntry.y } : { x: laneEntry.x, y: flank };
      return [crossingAt(entrySide, frame, alongFlank), alongFlank, laneEntry];
    }
    return [crossingAt(entrySide, frame, laneEntry), laneEntry];
  }
  return void 0;
}, "routeClusterCrossing");

// src/rendering-util/layout-algorithms/dagre/index.js
var clamp = /* @__PURE__ */ __name((value, min, max) => Math.max(min, Math.min(max, value)), "clamp");
var getDefaultSelfLoopSide = /* @__PURE__ */ __name((rankdir = "TB") => {
  switch (rankdir) {
    case "BT":
      return "bottom";
    case "LR":
      return "right";
    case "RL":
      return "left";
    case "TB":
    default:
      return "top";
  }
}, "getDefaultSelfLoopSide");
var shouldMergeSelfLoopSegments = /* @__PURE__ */ __name((diagramType) => diagramType === "flowchart" || diagramType === "flowchart-v2" || diagramType === "stateDiagram" || diagramType === "er" || diagramType === "classDiagram", "shouldMergeSelfLoopSegments");
var DAGRE_NODE_LAYOUT_PROPERTIES = [
  "x",
  "y",
  "width",
  "height",
  "labelBBox",
  "intersect",
  "calcIntersect",
  "diff",
  "clusterNode"
];
var getSelfLoopSide = /* @__PURE__ */ __name((graph, node, segments, originalNodeId, rankdir) => {
  const layoutHints = [];
  const dummyNodeIds = /* @__PURE__ */ new Set();
  segments.forEach(({ start, end }) => {
    if (start !== originalNodeId) {
      dummyNodeIds.add(start);
    }
    if (end !== originalNodeId) {
      dummyNodeIds.add(end);
    }
  });
  dummyNodeIds.forEach((id) => {
    const dummyNode = graph.node(id);
    if (typeof dummyNode?.x === "number" && typeof dummyNode?.y === "number") {
      layoutHints.push(dummyNode);
    }
  });
  if (layoutHints.length === 0) {
    segments.forEach(({ edge }) => {
      (edge.points ?? []).forEach((point) => {
        if (typeof point?.x === "number" && typeof point?.y === "number") {
          layoutHints.push(point);
        }
      });
    });
  }
  if (layoutHints.length === 0) {
    return getDefaultSelfLoopSide(rankdir);
  }
  const center = layoutHints.reduce(
    (acc, point) => ({
      x: acc.x + point.x / layoutHints.length,
      y: acc.y + point.y / layoutHints.length
    }),
    { x: 0, y: 0 }
  );
  const dx = center.x - node.x;
  const dy = center.y - node.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }
  if (Math.abs(dy) > 0) {
    return dy > 0 ? "bottom" : "top";
  }
  return getDefaultSelfLoopSide(rankdir);
}, "getSelfLoopSide");
var getSelfLoopPoints = /* @__PURE__ */ __name((node, side = "top", yOffset = 0, labelWidth = 0) => {
  const x = node.x;
  const y = node.y - yOffset;
  const halfWidth = node.width / 2;
  const halfHeight = node.height / 2;
  const maxSpan = Math.max(36, Math.min(100, node.width * 0.8));
  const span = clamp(Math.max(labelWidth, node.width * 0.35), 36, maxSpan);
  const depth = clamp(Math.min(node.width, node.height) * 0.45, 24, 48);
  switch (side) {
    case "bottom": {
      const bottom = y + halfHeight;
      return [
        { x: x - span / 2, y: bottom },
        { x: x - span / 2, y: bottom + depth },
        { x: x + span / 2, y: bottom + depth },
        { x: x + span / 2, y: bottom }
      ];
    }
    case "right": {
      const right = x + halfWidth;
      return [
        { x: right, y: y - span / 2 },
        { x: right + depth, y: y - span / 2 },
        { x: right + depth, y: y + span / 2 },
        { x: right, y: y + span / 2 }
      ];
    }
    case "left": {
      const left = x - halfWidth;
      return [
        { x: left, y: y - span / 2 },
        { x: left - depth, y: y - span / 2 },
        { x: left - depth, y: y + span / 2 },
        { x: left, y: y + span / 2 }
      ];
    }
    case "top":
    default: {
      const top = y - halfHeight;
      return [
        { x: x - span / 2, y: top },
        { x: x - span / 2, y: top - depth },
        { x: x + span / 2, y: top - depth },
        { x: x + span / 2, y: top }
      ];
    }
  }
}, "getSelfLoopPoints");
var getSelfLoopLabelPosition = /* @__PURE__ */ __name((node, points, side = "top", yOffset = 0, label = {}) => {
  const gap = 4;
  const x = node.x;
  const y = node.y - yOffset;
  const labelWidth = label.width ?? 0;
  const labelHeight = label.height ?? 0;
  switch (side) {
    case "bottom":
      return { x, y: Math.max(...points.map((point) => point.y)) + labelHeight / 2 + gap };
    case "right":
      return { x: Math.max(...points.map((point) => point.x)) + labelWidth / 2 + gap, y };
    case "left":
      return { x: Math.min(...points.map((point) => point.x)) - labelWidth / 2 - gap, y };
    case "top":
    default:
      return { x, y: Math.min(...points.map((point) => point.y)) - labelHeight / 2 - gap };
  }
}, "getSelfLoopLabelPosition");
var getEdgesToRender = /* @__PURE__ */ __name((graph, yOffset = 0, { mergeSelfLoops = true } = {}) => {
  const selfLoopEdgeGroups = /* @__PURE__ */ new Map();
  const edgesToRender = [];
  const rankdir = graph.graph()?.rankdir;
  graph.edges().forEach((e) => {
    const edge = graph.edge(e);
    if (mergeSelfLoops && edge.selfLoop) {
      const key = edge.selfLoop.id;
      if (!selfLoopEdgeGroups.has(key)) {
        selfLoopEdgeGroups.set(key, []);
      }
      selfLoopEdgeGroups.get(key).push({ edge, start: e.v, end: e.w });
    } else {
      edgesToRender.push({ edge, start: e.v, end: e.w });
    }
  });
  selfLoopEdgeGroups.forEach((segments) => {
    if (segments.length !== 3) {
      segments.forEach((segment) => edgesToRender.push(segment));
      return;
    }
    segments.sort((a, b) => a.edge.selfLoop.order - b.edge.selfLoop.order);
    const [firstSegment, middleSegment, lastSegment] = segments;
    const originalEdge = firstSegment.edge.originalEdge ?? middleSegment.edge.originalEdge ?? lastSegment.edge.originalEdge ?? middleSegment.edge;
    const node = graph.node(originalEdge.start);
    if (!node) {
      segments.forEach((segment) => edgesToRender.push(segment));
      return;
    }
    const label = {
      width: middleSegment.edge.width,
      height: middleSegment.edge.height
    };
    const side = getSelfLoopSide(graph, node, segments, originalEdge.start, rankdir);
    const points = getSelfLoopPoints(node, side, yOffset, label.width ?? 0);
    const labelPosition = getSelfLoopLabelPosition(node, points, side, yOffset, label);
    const mergedEdge = {
      ...middleSegment.edge,
      ...originalEdge,
      id: originalEdge.id,
      points,
      start: originalEdge.start,
      end: originalEdge.end,
      x: labelPosition.x,
      y: labelPosition.y,
      width: label.width,
      height: label.height,
      labelStyle: middleSegment.edge.labelStyle,
      fromCluster: firstSegment.edge.fromCluster ?? middleSegment.edge.fromCluster ?? lastSegment.edge.fromCluster,
      toCluster: firstSegment.edge.toCluster ?? middleSegment.edge.toCluster ?? lastSegment.edge.toCluster
    };
    delete mergedEdge.selfLoop;
    delete mergedEdge.originalEdge;
    edgesToRender.push({ edge: mergedEdge, start: mergedEdge.start, end: mergedEdge.end });
  });
  return edgesToRender;
}, "getEdgesToRender");
var CLUSTER_GROUP_PADDING = 8;
var resolveTerminal = /* @__PURE__ */ __name((graph, clusterId, terminalId) => {
  if (!terminalId) {
    return void 0;
  }
  const search = /* @__PURE__ */ __name((cluster, offsetX, offsetY) => {
    if (!cluster?.clusterNode || !cluster.graph) {
      return void 0;
    }
    const originX = offsetX + cluster.x + (cluster.diff || 0) - cluster.width / 2;
    const originY = offsetY + cluster.y - cluster.height / 2 - CLUSTER_GROUP_PADDING;
    const place = /* @__PURE__ */ __name((node) => ({
      x: originX + node.x,
      y: originY + node.y,
      width: node.width,
      height: node.height
    }), "place");
    const inner = cluster.graph.node(terminalId);
    if (inner) {
      const target = toBox(place(inner));
      const boxes = cluster.graph.nodes().filter((id) => id !== terminalId).map((id) => cluster.graph.node(id)).filter((node) => typeof node?.x === "number" && node.width && node.height).map((node) => toBox(place(node)));
      return {
        node: {
          ...place(inner),
          intersect(point) {
            return intersect_rect_default(this, point);
          }
        },
        // The subgraph carries a box of its own inside its graph, and that is the frame
        // as painted — more dependable than reconstructing it from the group's translate.
        frame: boxes.find((box) => contains(box, target)) ?? {
          left: originX,
          top: originY,
          right: originX + cluster.width,
          bottom: originY + cluster.height
        },
        // What the crossing leg has to steer around: everything laid out beside the
        // target. Anything the target sits inside is a container, not an obstacle.
        obstacles: boxes.filter((box) => !contains(box, target)),
        dir: cluster.graph.graph()?.rankdir
      };
    }
    for (const id of cluster.graph.nodes()) {
      const found = search(cluster.graph.node(id), originX, originY);
      if (found) {
        return found;
      }
    }
    return void 0;
  }, "search");
  return search(graph.node(clusterId), 0, 0);
}, "resolveTerminal");
var contains = /* @__PURE__ */ __name((outer, inner) => outer.left <= inner.left && outer.right >= inner.right && outer.top <= inner.top && outer.bottom >= inner.bottom, "contains");
var isInsideFrame = /* @__PURE__ */ __name((frame, point) => point.x > frame.left - FRAME_CLEARANCE && point.x < frame.right + FRAME_CLEARANCE && point.y > frame.top - FRAME_CLEARANCE && point.y < frame.bottom + FRAME_CLEARANCE, "isInsideFrame");
var applyClusterCrossingRoute = /* @__PURE__ */ __name((graph, edge, side) => {
  const terminalId = side === "end" ? edge.terminalEnd : edge.terminalStart;
  const anchorId = side === "end" ? edge.terminalEndAnchor : edge.terminalStartAnchor;
  if (!terminalId || !anchorId || !edge.points?.length) {
    return;
  }
  const terminal = resolveTerminal(graph, anchorId, terminalId);
  if (!terminal) {
    return;
  }
  const points = side === "end" ? [...edge.points] : [...edge.points].reverse();
  const outside = points.filter((point) => !isInsideFrame(terminal.frame, point));
  const flow = flowSides(terminal.dir);
  const route = routeClusterCrossing({
    frame: terminal.frame,
    target: toBox(terminal.node),
    obstacles: terminal.obstacles,
    approach: outside[outside.length - 1] ?? points[0],
    preferSide: side === "end" ? flow.entry : flow.exit
  });
  if (!route) {
    return;
  }
  const routed = [...outside, ...route, { x: terminal.node.x, y: terminal.node.y }];
  edge.points = side === "end" ? routed : routed.reverse();
}, "applyClusterCrossingRoute");
var applyClusterCrossingRoutes = /* @__PURE__ */ __name((graph, edges) => {
  for (const edge of edges) {
    applyClusterCrossingRoute(graph, edge, "end");
    applyClusterCrossingRoute(graph, edge, "start");
  }
}, "applyClusterCrossingRoutes");
var measureDagreGraph = /* @__PURE__ */ __name(async ({
  element: _elem,
  graph,
  diagramType,
  id,
  parentCluster,
  siteConfig
}) => {
  const dir = graph.graph().rankdir;
  log.trace("Dir in recursive render - dir:", dir);
  const {
    clusters,
    edgePaths,
    edgeLabels,
    nodes,
    rootGroups: elem
  } = createLayoutElementGroups(_elem, {
    edgePathsClass: "edgePaths"
  });
  if (!graph.nodes()) {
    log.info("No nodes found for", graph);
  } else {
    log.info("Recursive render XXX", graph.nodes());
  }
  if (graph.edges().length > 0) {
    log.info("Recursive edges", graph.edge(graph.edges()[0]));
  }
  const mergeSelfLoops = shouldMergeSelfLoopSegments(diagramType);
  await Promise.all(
    graph.nodes().map(async function(v) {
      const node = graph.node(v);
      if (parentCluster !== void 0) {
        const data = JSON.parse(JSON.stringify(parentCluster.clusterData));
        log.trace(
          "Setting data for parent cluster XXX\n Node.id = ",
          v,
          "\n data=",
          data.height,
          "\nParent cluster",
          parentCluster.height
        );
        graph.setNode(parentCluster.id, data);
        if (!graph.parent(v)) {
          log.trace("Setting parent", v, parentCluster.id);
          graph.setParent(v, parentCluster.id, data);
        }
      }
      log.info("(Insert) Node XXX" + v + ": " + JSON.stringify(graph.node(v)));
      if (node?.clusterNode) {
        log.info("Cluster identified XBX", v, node.width, graph.node(v));
        const { ranksep, nodesep } = graph.graph();
        node.graph.setGraph({
          ...node.graph.graph(),
          ranksep: ranksep + 25,
          nodesep
        });
        const o = await renderDagreSubgraph({
          element: nodes,
          graph: node.graph,
          diagramType,
          id,
          parentCluster: graph.node(v),
          siteConfig
        });
        const newEl = o.elem;
        updateNodeBounds(node, newEl);
        node.diff = o.diff || 0;
        log.info(
          "New compound node after recursive render XAX",
          v,
          "width",
          // node,
          node.width,
          "height",
          node.height
          // node.x,
          // node.y
        );
        setNodeElem(newEl, node);
      } else {
        if (graph.children(v).length > 0) {
          log.trace(
            "Cluster - the non recursive path XBX",
            v,
            node.id,
            node,
            node.width,
            "Graph:",
            graph
          );
          log.trace(findNonClusterChild(node.id, graph));
          clusterDb.set(node.id, { id: findNonClusterChild(node.id, graph), node });
        } else {
          log.trace("Node - the non recursive path XAX", v, nodes, graph.node(v), dir);
          await insertMeasuredNode(nodes, graph.node(v), { config: siteConfig, dir });
        }
      }
    })
  );
  const processEdges = /* @__PURE__ */ __name(async () => {
    const edgePromises = graph.edges().map(async function(e) {
      const edge = graph.edge(e.v, e.w, e.name);
      log.info("Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(e));
      log.info("Edge " + e.v + " -> " + e.w + ": ", e, " ", JSON.stringify(graph.edge(e)));
      log.info(
        "Fix",
        clusterDb,
        "ids:",
        e.v,
        e.w,
        "Translating: ",
        clusterDb.get(e.v),
        clusterDb.get(e.w)
      );
      if (mergeSelfLoops && edge.selfLoop) {
        if (edge.selfLoop.order !== 1) {
          return;
        }
        const labelEdge = {
          ...edge.originalEdge,
          ...edge,
          id: edge.selfLoop.id,
          startLabelLeft: edge.originalEdge?.startLabelLeft ?? edge.startLabelLeft,
          startLabelRight: edge.originalEdge?.startLabelRight ?? edge.startLabelRight,
          endLabelLeft: edge.originalEdge?.endLabelLeft ?? edge.endLabelLeft,
          endLabelRight: edge.originalEdge?.endLabelRight ?? edge.endLabelRight
        };
        await insertEdgeLabel(edgeLabels, labelEdge);
        edge.width = labelEdge.width;
        edge.height = labelEdge.height;
        edge.labelStyle = labelEdge.labelStyle;
        return;
      }
      await insertEdgeLabel(edgeLabels, edge);
    });
    await Promise.all(edgePromises);
  }, "processEdges");
  await processEdges();
  const { subGraphTitleTotalMargin } = getSubGraphTitleMargins(siteConfig);
  return {
    elem,
    graph,
    groups: { clusters, edgePaths, edgeLabels, nodes, rootGroups: elem },
    diagramType,
    id,
    mergeSelfLoops,
    subGraphTitleTotalMargin
  };
}, "measureDagreGraph");
var runDagreGraphLayout = /* @__PURE__ */ __name((graph) => {
  log.info("############################################# XXX");
  log.info("###                Layout                 ### XXX");
  log.info("############################################# XXX");
  if (false) {
    profiler.begin("layoutCore");
  }
  dagreLayout(graph);
  if (false) {
    profiler.end();
  }
}, "runDagreGraphLayout");
var normalizeDagreNode = /* @__PURE__ */ __name((graph, nodeId, subGraphTitleTotalMargin) => {
  const node = graph.node(nodeId);
  if (!node) {
    return void 0;
  }
  const normalizedNode = { ...node };
  if (node?.clusterNode) {
    normalizedNode.y = (node.y ?? 0) + subGraphTitleTotalMargin;
  } else if (graph.children(nodeId).length > 0) {
    normalizedNode.height = (node.height ?? 0) + subGraphTitleTotalMargin;
  } else {
    normalizedNode.y = (node.y ?? 0) + subGraphTitleTotalMargin / 2;
  }
  return normalizedNode;
}, "normalizeDagreNode");
var applyDagreNodeLayout = /* @__PURE__ */ __name((targetNode, dagreNode) => {
  DAGRE_NODE_LAYOUT_PROPERTIES.forEach((property) => {
    if (dagreNode[property] !== void 0) {
      targetNode[property] = dagreNode[property];
    }
  });
}, "applyDagreNodeLayout");
var normalizeDagreEdge = /* @__PURE__ */ __name((edge, start, end, edgeOffsetY) => ({
  ...edge,
  start: edge.start ?? start,
  end: edge.end ?? end,
  points: (edge.points ?? []).map((point) => ({
    ...point,
    y: typeof point.y === "number" ? point.y + edgeOffsetY : point.y
  }))
}), "normalizeDagreEdge");
var applyDagreLayoutResult = /* @__PURE__ */ __name((data4Layout, measuredLayout) => {
  const { graph, mergeSelfLoops, subGraphTitleTotalMargin = 0 } = measuredLayout;
  const nodeById = new Map(data4Layout.nodes.map((node) => [node.id, node]));
  sortNodesByHierarchy(graph).forEach((nodeId) => {
    const dagreNode = normalizeDagreNode(graph, nodeId, subGraphTitleTotalMargin);
    if (!dagreNode) {
      return;
    }
    applyDagreNodeLayout(graph.node(nodeId), dagreNode);
    const targetNode = nodeById.get(nodeId);
    if (targetNode) {
      applyDagreNodeLayout(targetNode, dagreNode);
    }
  });
  const edgeOffsetY = subGraphTitleTotalMargin / 2;
  data4Layout.edges = getEdgesToRender(graph, edgeOffsetY, { mergeSelfLoops }).map(
    ({ edge, start, end }) => normalizeDagreEdge(edge, start, end, edgeOffsetY)
  );
  applyClusterCrossingRoutes(graph, data4Layout.edges);
  return data4Layout;
}, "applyDagreLayoutResult");
var paintDagreLayoutCore = /* @__PURE__ */ __name(async ({
  elem,
  graph,
  groups: { clusters, edgePaths },
  diagramType,
  id,
  mergeSelfLoops,
  subGraphTitleTotalMargin
}) => {
  let diff = 0;
  await Promise.all(
    sortNodesByHierarchy(graph).map(async function(v) {
      const node = graph.node(v);
      log.info(
        "Position XBX => " + v + ": (" + node.x,
        "," + node.y,
        ") width: ",
        node.width,
        " height: ",
        node.height
      );
      if (node?.clusterNode) {
        node.y += subGraphTitleTotalMargin;
        log.info(
          "A tainted cluster node XBX1",
          v,
          node.id,
          node.width,
          node.height,
          node.x,
          node.y,
          graph.parent(v)
        );
        clusterDb.get(node.id).node = node;
        positionNode(node);
      } else {
        if (graph.children(v).length > 0) {
          log.info(
            "A pure cluster node XBX1",
            v,
            node.id,
            node.x,
            node.y,
            node.width,
            node.height,
            graph.parent(v)
          );
          node.height += subGraphTitleTotalMargin;
          graph.node(node.parentId);
          const halfPadding = node?.padding / 2 || 0;
          const labelHeight = node?.labelBBox?.height || 0;
          const offsetY = labelHeight - halfPadding || 0;
          log.debug("OffsetY", offsetY, "labelHeight", labelHeight, "halfPadding", halfPadding);
          await insertCluster(clusters, node);
          clusterDb.get(node.id).node = node;
        } else {
          const parent = graph.node(node.parentId);
          node.y += subGraphTitleTotalMargin / 2;
          log.info(
            "A regular node XBX1 - using the padding",
            node.id,
            "parent",
            node.parentId,
            node.width,
            node.height,
            node.x,
            node.y,
            "offsetY",
            node.offsetY,
            "parent",
            parent,
            parent?.offsetY,
            node
          );
          positionNode(node);
        }
      }
    })
  );
  const edgeOffsetY = subGraphTitleTotalMargin / 2;
  const edgesToRender = getEdgesToRender(graph, edgeOffsetY, { mergeSelfLoops });
  edgesToRender.forEach(function({ edge, start, end }) {
    log.info("Edge " + start + " -> " + end + ": " + JSON.stringify(edge), edge);
    edge.points.forEach((point) => point.y += edgeOffsetY);
    const startNode = graph.node(start);
    const endNode = graph.node(end);
    applyClusterCrossingRoute(graph, edge, "end");
    applyClusterCrossingRoute(graph, edge, "start");
    const terminalTail = resolveTerminal(graph, edge.terminalStartAnchor, edge.terminalStart);
    const terminalHead = resolveTerminal(graph, edge.terminalEndAnchor, edge.terminalEnd);
    const paths = insertEdge(
      edgePaths,
      edge,
      clusterDb,
      diagramType,
      terminalTail?.node ?? startNode,
      terminalHead?.node ?? endNode,
      id
    );
    positionEdgeLabel(edge, paths);
  });
  graph.nodes().forEach(function(v) {
    const n = graph.node(v);
    log.info(v, n.type, n.diff);
    if (n.isGroup) {
      diff = n.diff;
    }
  });
  log.warn("Returning from recursive render XAX", elem, diff);
  return { elem, diff };
}, "paintDagreLayoutCore");
var renderDagreSubgraph = /* @__PURE__ */ __name(async (options) => {
  const measuredLayout = await measureDagreGraph(options);
  runDagreGraphLayout(measuredLayout.graph);
  return await paintDagreLayoutCore(measuredLayout);
}, "renderDagreSubgraph");
var prepareLayoutForDagre = /* @__PURE__ */ __name((data4Layout) => {
  const graph = new graphlib.Graph({
    multigraph: true,
    compound: true
  }).setGraph({
    rankdir: data4Layout.direction,
    // Precedence: an explicit top-level config override (only present when a
    // user sets it - it has no schema default) > the value the diagram's own
    // renderer put on data4Layout (usually derived from that diagram's config)
    // > the flowchart config as a generic fallback. The flowchart keys have
    // schema defaults and therefore always exist, so they must come last or
    // they silently shadow every diagram's own spacing (see #7932).
    nodesep: data4Layout.config?.nodeSpacing || data4Layout.nodeSpacing || data4Layout.config?.flowchart?.nodeSpacing,
    ranksep: data4Layout.config?.rankSpacing || data4Layout.rankSpacing || data4Layout.config?.flowchart?.rankSpacing,
    marginx: 8,
    marginy: 8
  }).setDefaultEdgeLabel(function() {
    return {};
  });
  data4Layout.nodes.forEach((node) => {
    graph.setNode(node.id, { ...node });
    if (node.parentId) {
      graph.setParent(node.id, node.parentId);
    }
  });
  log.debug("Edges:", data4Layout.edges);
  data4Layout.edges.forEach((edge) => {
    if (edge.start === edge.end) {
      const nodeId = edge.start;
      const specialId1 = nodeId + "---" + nodeId + "---1";
      const specialId2 = nodeId + "---" + nodeId + "---2";
      const node = graph.node(nodeId);
      graph.setNode(specialId1, {
        domId: specialId1,
        id: specialId1,
        parentId: node.parentId,
        labelStyle: "",
        label: "",
        padding: 0,
        shape: "labelRect",
        // shape: 'rect',
        style: "",
        width: 10,
        height: 10
      });
      graph.setParent(specialId1, node.parentId);
      graph.setNode(specialId2, {
        domId: specialId2,
        id: specialId2,
        parentId: node.parentId,
        labelStyle: "",
        padding: 0,
        // shape: 'rect',
        shape: "labelRect",
        label: "",
        style: "",
        width: 10,
        height: 10
      });
      graph.setParent(specialId2, node.parentId);
      const originalEdge = structuredClone(edge);
      const edge1 = structuredClone(edge);
      const edgeMid = structuredClone(edge);
      const edge2 = structuredClone(edge);
      edge1.originalEdge = originalEdge;
      edge1.selfLoop = { id: originalEdge.id, order: 0 };
      edgeMid.originalEdge = originalEdge;
      edgeMid.selfLoop = { id: originalEdge.id, order: 1 };
      edge2.originalEdge = originalEdge;
      edge2.selfLoop = { id: originalEdge.id, order: 2 };
      edge1.label = "";
      edge1.arrowTypeEnd = "none";
      edge1.endLabelLeft = "";
      edge1.endLabelRight = "";
      edge1.startLabelLeft = "";
      edge1.id = nodeId + "-cyclic-special-1";
      edgeMid.startLabelRight = "";
      edgeMid.startLabelLeft = "";
      edgeMid.endLabelLeft = "";
      edgeMid.endLabelRight = "";
      edgeMid.arrowTypeStart = "none";
      edgeMid.arrowTypeEnd = "none";
      edgeMid.id = nodeId + "-cyclic-special-mid";
      edge2.label = "";
      edge2.startLabelRight = "";
      edge2.startLabelLeft = "";
      edge2.arrowTypeStart = "none";
      if (node.isGroup) {
        edge1.fromCluster = nodeId;
        edge2.toCluster = nodeId;
      }
      edge2.id = nodeId + "-cyclic-special-2";
      edge2.arrowTypeStart = "none";
      graph.setEdge(nodeId, specialId1, edge1, nodeId + "-cyclic-special-0");
      graph.setEdge(specialId1, specialId2, edgeMid, nodeId + "-cyclic-special-1");
      graph.setEdge(specialId2, nodeId, edge2, nodeId + "-cyclic-special-2");
    } else {
      graph.setEdge(edge.start, edge.end, { ...edge }, edge.id);
    }
  });
  adjustClustersAndEdges(graph);
  return { graph };
}, "prepareLayoutForDagre");
var measureDagreLayout = /* @__PURE__ */ __name(async (data4Layout, { element, preparedLayout }) => {
  const prepared = preparedLayout ?? prepareLayoutForDagre(data4Layout);
  const siteConfig = getConfig();
  const measuredLayout = await measureDagreGraph({
    element,
    graph: prepared.graph,
    diagramType: data4Layout.type,
    id: data4Layout.diagramId,
    parentCluster: void 0,
    siteConfig
  });
  prepared.measuredLayout = measuredLayout;
  return measuredLayout;
}, "measureDagreLayout");
var runDagreLayoutCore = /* @__PURE__ */ __name((data4Layout, context) => {
  const measuredLayout = context.preparedLayout?.measuredLayout;
  if (!measuredLayout) {
    throw new Error("runDagreLayoutCore requires measureDagreLayout to run first");
  }
  runDagreGraphLayout(measuredLayout.graph);
  applyDagreLayoutResult(data4Layout, measuredLayout);
  return measuredLayout;
}, "runDagreLayoutCore");
var getDagrePaintNodes = /* @__PURE__ */ __name((_data4Layout, { measure }) => sortNodesByHierarchy(measure.graph).map((nodeId) => measure.graph.node(nodeId)).filter(Boolean), "getDagrePaintNodes");
var getDagreEdgeNode = /* @__PURE__ */ __name((nodeId, edge, { measure }) => {
  if (!nodeId) {
    return void 0;
  }
  const anchor = nodeId === edge?.terminalStart && edge.terminalStartAnchor || nodeId === edge?.terminalEnd && edge.terminalEndAnchor;
  if (anchor) {
    const terminal = resolveTerminal(measure.graph, anchor, nodeId);
    if (terminal) {
      return terminal.node;
    }
  }
  return measure.graph.node(nodeId);
}, "getDagreEdgeNode");
var getDagreEdgeGroup = /* @__PURE__ */ __name((edge, groups) => {
  if (!edge?.terminalStart && !edge?.terminalEnd) {
    return void 0;
  }
  groups.edgePathsOverTheTop ??= groups.rootGroups.append("g").attr("class", "edges edgePaths");
  return groups.edgePathsOverTheTop;
}, "getDagreEdgeGroup");
var render = createCommonLayoutRenderer({
  prepareLayout: prepareLayoutForDagre,
  measureLayout: measureDagreLayout,
  runLayoutCore: runDagreLayoutCore,
  paintOptions: {
    clusterDb,
    getNodes: getDagrePaintNodes,
    getEdgeNode: getDagreEdgeNode,
    getEdgeGroup: getDagreEdgeGroup,
    skipNode: /* @__PURE__ */ __name((node, { measure }) => !measure.graph.hasNode(node.id), "skipNode"),
    isCluster: /* @__PURE__ */ __name((node, { measure }) => measure.graph.hasNode(node.id) && (measure.graph.children(node.id) ?? []).length > 0, "isCluster")
  }
});
export {
  applyDagreLayoutResult,
  getEdgesToRender,
  measureDagreLayout,
  prepareLayoutForDagre,
  render,
  runDagreLayoutCore
};
