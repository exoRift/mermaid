/** Decorates with functions required by mermaids dagre-wrapper. */
import { log } from '../../../logger.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';

export let clusterDb = new Map();
let descendants = new Map();
let parents = new Map();

export const clear = () => {
  descendants.clear();
  parents.clear();
  clusterDb.clear();
};

const isDescendant = (id, ancestorId) => {
  const ancestorDescendants = descendants.get(ancestorId) || [];
  log.trace('In isDescendant', ancestorId, ' ', id, ' = ', ancestorDescendants.includes(id));
  return ancestorDescendants.includes(id);
};

const edgeInCluster = (edge, clusterId) => {
  const clusterDescendants = descendants.get(clusterId) || [];
  log.info('Descendants of ', clusterId, ' is ', clusterDescendants);
  log.info('Edge is ', edge);
  if (edge.v === clusterId || edge.w === clusterId) {
    return false;
  }

  if (!clusterDescendants) {
    log.debug('Tilt, ', clusterId, ',not in descendants');
    return false;
  }

  return (
    clusterDescendants.includes(edge.v) ||
    isDescendant(edge.v, clusterId) ||
    isDescendant(edge.w, clusterId) ||
    clusterDescendants.includes(edge.w)
  );
};

const copy = (clusterId, graph, newGraph, rootId) => {
  log.debug(
    'Copying children of ',
    clusterId,
    'root',
    rootId,
    'data',
    graph.node(clusterId),
    rootId
  );
  const nodes = graph.children(clusterId) || [];

  if (clusterId !== rootId) {
    nodes.push(clusterId);
  }

  log.debug('Copying (nodes) clusterId', clusterId, 'nodes', nodes);

  nodes.forEach((node) => {
    if (graph.children(node).length > 0) {
      copy(node, graph, newGraph, rootId);
    } else {
      const data = graph.node(node);
      log.info('cp ', node, ' to ', rootId, ' with parent ', clusterId);
      newGraph.setNode(node, data);
      if (rootId !== graph.parent(node)) {
        log.debug('Setting parent', node, graph.parent(node));
        newGraph.setParent(node, graph.parent(node));
      }

      if (clusterId !== rootId && node !== clusterId) {
        log.debug('Setting parent', node, clusterId);
        newGraph.setParent(node, clusterId);
      } else {
        log.info('In copy ', clusterId, 'root', rootId, 'data', graph.node(clusterId), rootId);
        log.debug(
          'Not Setting parent for node=',
          node,
          'cluster!==rootId',
          clusterId !== rootId,
          'node!==clusterId',
          node !== clusterId
        );
      }
      const edges = graph.edges(node);
      log.debug('Copying Edges', edges);
      edges.forEach((edge) => {
        log.info('Edge', edge);
        const data = graph.edge(edge.v, edge.w, edge.name);
        log.info('Edge data', data, rootId);
        try {
          if (edgeInCluster(edge, rootId)) {
            log.info('Copying as ', edge.v, edge.w, data, edge.name);
            newGraph.setEdge(edge.v, edge.w, data, edge.name);
            log.info('newGraph edges ', newGraph.edges(), newGraph.edge(newGraph.edges()[0]));
          } else {
            log.info(
              'Skipping copy of edge ',
              edge.v,
              '-->',
              edge.w,
              ' rootId: ',
              rootId,
              ' clusterId:',
              clusterId
            );
          }
        } catch (e) {
          log.error(e);
        }
      });
    }
    log.debug('Removing node', node);
    graph.removeNode(node);
  });
};

export const extractDescendants = (id, graph) => {
  const children = graph.children(id);
  let res = [...children];

  for (const child of children) {
    parents.set(child, id);
    res = [...res, ...extractDescendants(child, graph)];
  }

  return res;
};

export const validate = (graph) => {
  const edges = graph.edges();
  log.trace('Edges: ', edges);
  for (const edge of edges) {
    if (graph.children(edge.v).length > 0) {
      log.trace('The node ', edge.v, ' is part of and edge even though it has children');
      return false;
    }
    if (graph.children(edge.w).length > 0) {
      log.trace('The node ', edge.w, ' is part of and edge even though it has children');
      return false;
    }
  }
  return true;
};

const findCommonEdges = (graph, id1, id2) => {
  const edges1 = graph.edges().filter((edge) => edge.v === id1 || edge.w === id1);
  const edges2 = graph.edges().filter((edge) => edge.v === id2 || edge.w === id2);
  const edges1Prim = edges1.map((edge) => {
    return { v: edge.v === id1 ? id2 : edge.v, w: edge.w === id1 ? id1 : edge.w };
  });
  const edges2Prim = edges2.map((edge) => {
    return { v: edge.v, w: edge.w };
  });
  const result = edges1Prim.filter((edgeIn1) => {
    return edges2Prim.some((edge) => edgeIn1.v === edge.v && edgeIn1.w === edge.w);
  });

  return result;
};

export const findNonClusterChild = (id, graph, clusterId) => {
  const children = graph.children(id);
  log.trace('Searching children of id ', id, children);
  if (children.length < 1) {
    return id;
  }
  let reserve;
  for (const child of children) {
    const _id = findNonClusterChild(child, graph, clusterId);

    const commonEdges = findCommonEdges(graph, clusterId, _id);

    if (_id) {
      if (commonEdges.length > 0) {
        reserve = _id;
      } else {
        return _id;
      }
    }
  }
  return reserve;
};

/** `TD` and `TB` are the same direction spelled two ways. */
const normalizeDir = (dir) => (dir === 'TD' ? 'TB' : dir);

/**
 * The direction a cluster's contents fall back to when the cluster declares none:
 * the nearest ancestor that does declare one, or failing that the graph itself.
 */
const getInheritedDir = (graph, clusterId) => {
  let parent = graph.parent(clusterId);
  while (parent) {
    const dir = clusterDb.get(parent)?.clusterData?.dir;
    if (dir) {
      return normalizeDir(dir);
    }
    parent = graph.parent(parent);
  }
  return normalizeDir(graph.graph()?.rankdir);
};

/**
 * Whether a cluster asks for a direction that differs from the one it would inherit.
 * Only those clusters need the treatment below — a subgraph that already flows the
 * way its surroundings do has nothing to lose by being laid out alongside them.
 */
const hasOwnDirection = (graph, clusterId) => {
  const dir = clusterDb.get(clusterId)?.clusterData?.dir;
  return Boolean(dir) && normalizeDir(dir) !== getInheritedDir(graph, clusterId);
};

/**
 * The outermost cluster with a direction of its own that sits between `node` and
 * `other` — the frame this edge crosses that has to stay whole. Outermost wins:
 * re-pointing at a nested frame would still leave the edge crossing the outer one.
 */
const crossedDirectedCluster = (graph, node, other) => {
  const ancestors = [];
  let parent = graph.parent(node);
  while (parent) {
    ancestors.unshift(parent);
    parent = graph.parent(parent);
  }
  return ancestors.find(
    (ancestor) =>
      other !== ancestor && !isDescendant(other, ancestor) && hasOwnDirection(graph, ancestor)
  );
};

/**
 * Anchor edges that reach past the frame of a subgraph with its own direction onto
 * that frame instead.
 *
 * Dagre gives a graph a single `rankdir`, so a subgraph only keeps a direction of
 * its own when `extractor` lifts it into a graph of its own — and that happens only
 * while nothing connects across its frame. An edge written against a subgraph's id
 * (`B --> Sub`) already anchors there and so leaves the direction intact; one written
 * against a node inside it (`B --> B1`) did not, which is what cost the subgraph its
 * direction. Re-pointing the latter at the frame puts both spellings on the same
 * footing.
 */
const anchorEdgesOnDirectedClusters = (graph) => {
  graph.edges().forEach((e) => {
    const v = crossedDirectedCluster(graph, e.v, e.w) ?? e.v;
    const w = crossedDirectedCluster(graph, e.w, e.v) ?? e.w;
    if (v === e.v && w === e.w) {
      return;
    }
    if (v === w) {
      // Both ends landed on the same frame — leave the edge where it is rather than
      // turning it into a self-loop on the subgraph.
      return;
    }
    const edge = graph.edge(e.v, e.w, e.name);
    log.debug('Anchoring edge', e.v, '->', e.w, 'on', v, '->', w);
    // The frame is only as far as dagre can lay the edge out — it has no idea the
    // subgraph has an inside. The node the author wrote is kept so the drawn path can
    // carry on across the frame and finish on it.
    if (v !== e.v) {
      edge.terminalStart = e.v;
      edge.terminalStartAnchor = v;
    }
    if (w !== e.w) {
      edge.terminalEnd = e.w;
      edge.terminalEndAnchor = w;
    }
    graph.removeEdge(e.v, e.w, e.name);
    graph.setEdge(v, w, edge, e.name);
  });
};

const getAnchorId = (id) => {
  if (!clusterDb.has(id)) {
    return id;
  }
  if (!clusterDb.get(id).externalConnections) {
    return id;
  }

  if (clusterDb.has(id)) {
    return clusterDb.get(id).id;
  }
  return id;
};

export const adjustClustersAndEdges = (graph, depth) => {
  if (!graph || depth > 10) {
    log.debug('Opting out, no graph ');
    return;
  } else {
    log.debug('Opting in, graph ');
  }

  graph.nodes().forEach(function (id) {
    const children = graph.children(id);
    if (children.length > 0) {
      log.debug(
        'Cluster identified',
        id,
        ' Replacement id in edges: ',
        findNonClusterChild(id, graph, id)
      );
      descendants.set(id, extractDescendants(id, graph));
      clusterDb.set(id, { id: findNonClusterChild(id, graph, id), clusterData: graph.node(id) });
    }
  });

  // Before any edge is counted against a cluster: an edge that reaches past the frame
  // of a subgraph with its own direction is anchored on the frame, so that the cluster
  // comes out of the next loop without external connections and stays extractable.
  anchorEdgesOnDirectedClusters(graph);

  graph.nodes().forEach(function (id) {
    const children = graph.children(id);
    const edges = graph.edges();
    if (children.length > 0) {
      log.debug('Cluster identified', id, descendants);
      edges.forEach((edge) => {
        const d1 = isDescendant(edge.v, id);
        const d2 = isDescendant(edge.w, id);

        if (d1 ^ d2) {
          log.debug('Edge: ', edge, ' leaves cluster ', id);
          log.debug('Descendants of XXX ', id, ': ', descendants.get(id));
          clusterDb.get(id).externalConnections = true;
        }
      });
    } else {
      log.debug('Not a cluster ', id, descendants);
    }
  });

  for (let id of clusterDb.keys()) {
    const nonClusterChild = clusterDb.get(id).id;
    const parent = graph.parent(nonClusterChild);

    if (parent !== id && clusterDb.has(parent) && !clusterDb.get(parent).externalConnections) {
      clusterDb.get(id).id = parent;
    }
    // When this cluster has a direct outgoing edge AND its current anchor sits inside
    // a sibling subgraph that will be extracted (collapsed into a clusterNode), the
    // anchor will disappear by render time and the edge endpoint becomes undefined.
    // Re-anchor onto a node that survives extraction.
    const hasDirectOutgoingEdge = graph.edges().some((edge) => edge.v === id);
    if (
      nonClusterChild &&
      clusterDb.get(id)?.externalConnections &&
      hasDirectOutgoingEdge &&
      isNodeInExtractableCluster(graph, nonClusterChild, id)
    ) {
      const safeAnchor = findSafeAnchorNode(graph, id, graph.parent(nonClusterChild));
      if (safeAnchor) {
        clusterDb.get(id).id = safeAnchor;
      }
    }
  }

  graph.edges().forEach(function (e) {
    const edge = graph.edge(e);
    log.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(e));
    log.debug('Edge ' + e.v + ' -> ' + e.w + ': ' + JSON.stringify(graph.edge(e)));

    let v = e.v;
    let w = e.w;
    log.debug(
      'Fix XXX',
      clusterDb,
      'ids:',
      e.v,
      e.w,
      'Translating: ',
      clusterDb.get(e.v),
      ' --- ',
      clusterDb.get(e.w)
    );
    if (clusterDb.get(e.v) || clusterDb.get(e.w)) {
      log.debug('Fixing and trying - removing XXX', e.v, e.w, e.name);
      v = getAnchorId(e.v);
      w = getAnchorId(e.w);
      graph.removeEdge(e.v, e.w, e.name);
      if (v !== e.v) {
        const parent = graph.parent(v);
        clusterDb.get(parent).externalConnections = true;
        edge.fromCluster = e.v;
      }
      if (w !== e.w) {
        const parent = graph.parent(w);
        clusterDb.get(parent).externalConnections = true;
        edge.toCluster = e.w;
      }
      log.debug('Fix Replacing with XXX', v, w, e.name);
      graph.setEdge(v, w, edge, e.name);
    }
  });
  // perf: skip eager graphlibJson.write() serialization (the arg runs every render even when the log is a no-op)
  // log.debug('Adjusted Graph', graphlibJson.write(graph));
  extractor(graph, 0);

  log.trace(clusterDb);
};

export const extractor = (graph, depth) => {
  // perf: skip eager graphlibJson.write() serialization (the arg runs every render even when the log is a no-op)
  // log.debug('extractor - ', depth, graphlibJson.write(graph), graph.children('D'));
  if (depth > 10) {
    log.error('Bailing out');
    return;
  }
  let nodes = graph.nodes();
  let hasChildren = false;
  for (const node of nodes) {
    const children = graph.children(node);
    hasChildren = hasChildren || children.length > 0;
  }

  if (!hasChildren) {
    log.debug('Done, no node has children', graph.nodes());
    return;
  }
  log.debug('Nodes = ', nodes, depth);
  for (const node of nodes) {
    log.debug(
      'Extracting node',
      node,
      clusterDb,
      clusterDb.has(node) && !clusterDb.get(node).externalConnections,
      !graph.parent(node),
      graph.node(node),
      graph.children('D'),
      ' Depth ',
      depth
    );
    if (!clusterDb.has(node)) {
      log.debug('Not a cluster', node, depth);
    } else if (
      !clusterDb.get(node).externalConnections &&
      graph.children(node) &&
      graph.children(node).length > 0
    ) {
      // Original behaviour: cluster without external connections gets its own sub-graph.
      log.debug(
        'Cluster without external connections, without a parent and with children',
        node,
        depth
      );

      const graphSettings = graph.graph();
      let dir = graphSettings.rankdir === 'TB' ? 'LR' : 'TB';
      if (clusterDb.get(node)?.clusterData?.dir) {
        dir = clusterDb.get(node).clusterData.dir;
        log.debug('Fixing dir', clusterDb.get(node).clusterData.dir, dir);
      }

      const clusterGraph = new graphlib.Graph({
        multigraph: true,
        compound: true,
      })
        .setGraph({
          rankdir: dir,
          nodesep: 50,
          ranksep: 50,
          marginx: 8,
          marginy: 8,
        })
        .setDefaultEdgeLabel(function () {
          return {};
        });

      // perf: skip eager graphlibJson.write() serialization (the arg runs every render even when the log is a no-op)
      // log.debug('Old graph before copy', graphlibJson.write(graph));
      copy(node, graph, clusterGraph, node);
      graph.setNode(node, {
        clusterNode: true,
        id: node,
        clusterData: clusterDb.get(node).clusterData,
        label: clusterDb.get(node).label,
        graph: clusterGraph,
      });
      // perf: skip eager graphlibJson.write() serialization (the arg runs every render even when the log is a no-op)
      // log.debug('Old graph after copy', graphlibJson.write(graph));
    } else {
      log.debug(
        'Cluster ** ',
        node,
        ' **not meeting the criteria !externalConnections:',
        !clusterDb.get(node).externalConnections,
        ' no parent: ',
        !graph.parent(node),
        ' children ',
        graph.children(node) && graph.children(node).length > 0,
        graph.children('D'),
        depth
      );
      log.debug(clusterDb);
    }
  }

  nodes = graph.nodes();
  log.debug('New list of nodes', nodes);
  for (const node of nodes) {
    const data = graph.node(node);
    log.debug(' Now next level', node, data);
    if (data?.clusterNode) {
      extractor(data.graph, depth + 1);
    }
  }
};

const sorter = (graph, nodes) => {
  if (nodes.length === 0) {
    return [];
  }
  let result = Object.assign([], nodes);
  nodes.forEach((node) => {
    const children = graph.children(node);
    const sorted = sorter(graph, children);
    result = [...result, ...sorted];
  });

  return result;
};

export const sortNodesByHierarchy = (graph) => sorter(graph, graph.children());

/** Checks if a node is inside a cluster that will be extracted (has no external connections). */
const isNodeInExtractableCluster = (graph, node, rootId) => {
  let parent = graph.parent(node);

  while (parent && parent !== rootId) {
    const cluster = clusterDb.get(parent);
    if (cluster && !cluster.externalConnections) {
      return true;
    }
    parent = graph.parent(parent);
  }

  return false;
};

/** Finds an alternative anchor node for a cluster that is not inside an extractable cluster. */
const findSafeAnchorNode = (graph, clusterId, excludedCluster) => {
  const children = graph.children(clusterId) ?? [];

  for (const child of children) {
    if (child === excludedCluster || isDescendant(child, excludedCluster)) {
      continue;
    }

    // findNonClusterChild returns the leaf itself when child is a leaf, or drills
    // into a subgraph to find a non-cluster descendant. A returned leaf sibling is
    // a perfectly valid anchor — only skip when the lookup found nothing usable.
    const candidate = findNonClusterChild(child, graph, clusterId);
    if (!candidate) {
      continue;
    }

    if (!isNodeInExtractableCluster(graph, candidate, clusterId)) {
      return candidate;
    }
  }

  return null;
};
