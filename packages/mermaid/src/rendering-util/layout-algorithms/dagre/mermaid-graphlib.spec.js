import * as graphlibJson from 'dagre-d3-es/src/graphlib/json.js';
import * as graphlib from 'dagre-d3-es/src/graphlib/index.js';
import {
  validate,
  adjustClustersAndEdges,
  clear,
  extractDescendants,
  sortNodesByHierarchy,
} from './mermaid-graphlib.js';
import { setLogLevel, log } from '../../../logger.js';

describe('Graphlib decorations', () => {
  let g;
  beforeEach(function () {
    setLogLevel(1);
    g = new graphlib.Graph({
      multigraph: true,
      compound: true,
    });
    g.setGraph({
      rankdir: 'TB',
      nodesep: 10,
      ranksep: 10,
      marginx: 8,
      marginy: 8,
    });
    g.setDefaultEdgeLabel(function () {
      return {};
    });
  });

  describe('validate', function () {
    it('Validate should detect edges between clusters', function () {
      /*
        subgraph C1
          a --> b
        end
        subgraph C2
          c
        end
        C1 --> C2
      */
      g.setNode('a', { data: 1 });
      g.setNode('b', { data: 2 });
      g.setNode('c', { data: 3 });
      g.setParent('a', 'C1');
      g.setParent('b', 'C1');
      g.setParent('c', 'C2');
      g.setEdge('a', 'b');
      g.setEdge('C1', 'C2');

      expect(validate(g)).toBe(false);
    });
    it('Validate should not detect edges between clusters after adjustment', function () {
      /*
        subgraph C1
          a --> b
        end
        subgraph C2
          c
        end
        C1 --> C2
      */
      g.setNode('a', {});
      g.setNode('b', {});
      g.setNode('c', {});
      g.setParent('a', 'C1');
      g.setParent('b', 'C1');
      g.setParent('c', 'C2');
      g.setEdge('a', 'b');
      g.setEdge('C1', 'C2');

      adjustClustersAndEdges(g);
      log.info(g.edges());
      expect(validate(g)).toBe(true);
    });

    it('Validate should detect edges between clusters and transform clusters GLB4', function () {
      /*
        a --> b
        subgraph C1
          subgraph C2
            a
          end
          b
        end
        C1 --> c
      */
      g.setNode('a', { data: 1 });
      g.setNode('b', { data: 2 });
      g.setNode('c', { data: 3 });
      g.setNode('C1', { data: 4 });
      g.setNode('C2', { data: 5 });
      g.setParent('a', 'C2');
      g.setParent('b', 'C1');
      g.setParent('C2', 'C1');
      g.setEdge('a', 'b', { name: 'C1-internal-link' });
      g.setEdge('C1', 'c', { name: 'C1-external-link' });

      adjustClustersAndEdges(g);
      log.info(g.nodes());
      expect(g.nodes().length).toBe(2);
      expect(validate(g)).toBe(true);
    });
    it('Validate should detect edges between clusters and transform clusters GLB5', function () {
      /*
        a --> b
        subgraph C1
          a
        end
        subgraph C2
          b
        end
        C1 -->
      */
      g.setNode('a', { data: 1 });
      g.setNode('b', { data: 2 });
      g.setParent('a', 'C1');
      g.setParent('b', 'C2');
      // g.setEdge('a', 'b', { name: 'C1-internal-link' });
      g.setEdge('C1', 'C2', { name: 'C1-external-link' });

      log.info(g.nodes());
      adjustClustersAndEdges(g);
      log.info(g.nodes());
      expect(g.nodes().length).toBe(2);
      expect(validate(g)).toBe(true);
    });
    it('adjustClustersAndEdges GLB6', function () {
      /*
      subgraph C1
        a
      end
      C1 --> b
    */
      g.setNode('a', { data: 1 });
      g.setNode('b', { data: 2 });
      g.setNode('C1', { data: 3 });
      g.setParent('a', 'C1');
      g.setEdge('C1', 'b', { data: 'link1' }, '1');

      // log.info(g.edges())
      adjustClustersAndEdges(g);
      log.info(g.edges());
      expect(g.nodes()).toEqual(['b', 'C1']);
      expect(g.edges().length).toBe(1);
      expect(validate(g)).toBe(true);
      expect(g.node('C1').clusterNode).toBe(true);

      const C1Graph = g.node('C1').graph;
      expect(C1Graph.nodes()).toEqual(['a']);
    });
    it('adjustClustersAndEdges GLB7', function () {
      /*
      subgraph C1
        a
      end
      C1 --> b
      C1 --> c
    */
      g.setNode('a', { data: 1 });
      g.setNode('b', { data: 2 });
      g.setNode('c', { data: 3 });
      g.setParent('a', 'C1');
      g.setNode('C1', { data: 4 });
      g.setEdge('C1', 'b', { data: 'link1' }, '1');
      g.setEdge('C1', 'c', { data: 'link2' }, '2');

      log.info(g.node('C1'));
      adjustClustersAndEdges(g);
      log.info(g.edges());
      expect(g.nodes()).toEqual(['b', 'c', 'C1']);
      expect(g.nodes().length).toBe(3);
      expect(g.edges().length).toBe(2);

      expect(g.edges().length).toBe(2);
      const edgeData = g.edge(g.edges()[1]);
      expect(edgeData.data).toBe('link2');
      expect(validate(g)).toBe(true);

      const C1Graph = g.node('C1').graph;
      expect(C1Graph.nodes()).toEqual(['a']);
    });
    it('adjustClustersAndEdges GLB8', function () {
      /*
    subgraph A
      a
    end
    subgraph B
      b
    end
    subgraph C
      c
    end
    A --> B
    A --> C
    */
      g.setNode('a', { data: 1 });
      g.setNode('b', { data: 2 });
      g.setNode('c', { data: 3 });
      g.setParent('a', 'A');
      g.setParent('b', 'B');
      g.setParent('c', 'C');
      g.setEdge('A', 'B', { data: 'link1' }, '1');
      g.setEdge('A', 'C', { data: 'link2' }, '2');

      // log.info(g.edges())
      adjustClustersAndEdges(g);
      expect(g.nodes()).toEqual(['A', 'B', 'C']);
      expect(g.edges().length).toBe(2);

      expect(g.edges().length).toBe(2);
      const edgeData = g.edge(g.edges()[1]);
      expect(edgeData.data).toBe('link2');
      expect(validate(g)).toBe(true);

      const CGraph = g.node('C').graph;
      expect(CGraph.nodes()).toEqual(['c']);
    });

    it('adjustClustersAndEdges the extracted graphs shall contain the correct data GLB10', function () {
      /*
    subgraph C
      subgraph D
        d
      end
    end
    */

      g.setNode('C', { data: 1 });
      g.setNode('D', { data: 2 });
      g.setNode('d', { data: 3 });
      g.setParent('d', 'D');
      g.setParent('D', 'C');

      // log.info('Graph before', g.node('D'))
      // log.info('Graph before', graphlibJson.write(g))
      adjustClustersAndEdges(g);
      // log.info('Graph after', graphlibJson.write(g), g.node('C').graph)

      const CGraph = g.node('C').graph;
      const DGraph = CGraph.node('D').graph;

      expect(CGraph.nodes()).toEqual(['D']);
      expect(DGraph.nodes()).toEqual(['d']);

      expect(g.nodes()).toEqual(['C']);
      expect(g.nodes().length).toBe(1);
    });

    it('adjustClustersAndEdges the extracted graphs shall contain the correct data GLB11', function () {
      /*
    subgraph A
      a
    end
    subgraph B
      b
    end
    subgraph C
      subgraph D
        d
      end
    end
    A --> B
    A --> C
    */

      g.setNode('C', { data: 1 });
      g.setNode('D', { data: 2 });
      g.setNode('d', { data: 3 });
      g.setNode('B', { data: 4 });
      g.setNode('b', { data: 5 });
      g.setNode('A', { data: 6 });
      g.setNode('a', { data: 7 });
      g.setParent('a', 'A');
      g.setParent('b', 'B');
      g.setParent('d', 'D');
      g.setParent('D', 'C');
      g.setEdge('A', 'B', { data: 'link1' }, '1');
      g.setEdge('A', 'C', { data: 'link2' }, '2');

      log.info('Graph before', g.node('D'));
      log.info('Graph before', graphlibJson.write(g));
      adjustClustersAndEdges(g);
      log.trace('Graph after', graphlibJson.write(g));
      expect(g.nodes()).toEqual(['C', 'B', 'A']);
      expect(g.nodes().length).toBe(3);
      expect(g.edges().length).toBe(2);

      const AGraph = g.node('A').graph;
      const BGraph = g.node('B').graph;
      const CGraph = g.node('C').graph;
      // log.info(CGraph.nodes());
      const DGraph = CGraph.node('D').graph;
      // log.info('DG', CGraph.children('D'));

      log.info('A', AGraph.nodes());
      expect(AGraph.nodes().length).toBe(1);
      expect(AGraph.nodes()).toEqual(['a']);
      log.trace('Nodes', BGraph.nodes());
      expect(BGraph.nodes().length).toBe(1);
      expect(BGraph.nodes()).toEqual(['b']);
      expect(CGraph.nodes()).toEqual(['D']);
      expect(CGraph.nodes().length).toEqual(1);

      expect(AGraph.edges().length).toBe(0);
      expect(BGraph.edges().length).toBe(0);
      expect(CGraph.edges().length).toBe(0);
      expect(DGraph.nodes()).toEqual(['d']);
      expect(DGraph.edges().length).toBe(0);
      // expect(CGraph.node('D')).toEqual({ data: 2 });
      expect(g.edges().length).toBe(2);

      // expect(g.edges().length).toBe(2);
      // const edgeData = g.edge(g.edges()[1]);
      // expect(edgeData.data).toBe('link2');
      // expect(validate(g)).toBe(true);
    });
    it('adjustClustersAndEdges the extracted graphs shall contain the correct links  GLB20', function () {
      /*
      a --> b
      subgraph b [Test]
        c --> d -->e
      end
    */
      g.setNode('a', { data: 1 });
      g.setNode('b', { data: 2 });
      g.setNode('c', { data: 3 });
      g.setNode('d', { data: 3 });
      g.setNode('e', { data: 3 });
      g.setParent('c', 'b');
      g.setParent('d', 'b');
      g.setParent('e', 'b');
      g.setEdge('a', 'b', { data: 'link1' }, '1');
      g.setEdge('c', 'd', { data: 'link2' }, '2');
      g.setEdge('d', 'e', { data: 'link2' }, '2');

      log.info('Graph before', graphlibJson.write(g));
      adjustClustersAndEdges(g);
      const bGraph = g.node('b').graph;
      // log.trace('Graph after', graphlibJson.write(g))
      log.info('Graph after', graphlibJson.write(bGraph));
      expect(bGraph.nodes().length).toBe(3);
      expect(bGraph.edges().length).toBe(2);
    });
    it('adjustClustersAndEdges the extracted graphs shall contain the correct links  GLB21', function () {
      /*
    state a {
        state b {
            state c {
                e
            }
        }
    }
    */
      g.setNode('a', { data: 1 });
      g.setNode('b', { data: 2 });
      g.setNode('c', { data: 3 });
      g.setNode('e', { data: 3 });
      g.setParent('b', 'a');
      g.setParent('c', 'b');
      g.setParent('e', 'c');

      log.info('Graph before', graphlibJson.write(g));
      adjustClustersAndEdges(g);
      const aGraph = g.node('a').graph;
      const bGraph = aGraph.node('b').graph;
      log.info('Graph after', graphlibJson.write(aGraph));
      const cGraph = bGraph.node('c').graph;
      // log.trace('Graph after', graphlibJson.write(g))
      expect(aGraph.nodes().length).toBe(1);
      expect(bGraph.nodes().length).toBe(1);
      expect(cGraph.nodes().length).toBe(1);
      expect(bGraph.edges().length).toBe(0);
    });
  });
  it('adjustClustersAndEdges should handle nesting GLB77', function () {
    /*
flowchart TB
  subgraph A
    b-->B
    a-->c
  end
  subgraph B
    c
  end
    */

    const exportedGraph = JSON.parse(
      '{"options":{"directed":true,"multigraph":true,"compound":true},"nodes":[{"v":"A","value":{"labelStyle":"","shape":"rect","labelText":"A","rx":0,"ry":0,"cssClass":"default","style":"","id":"A","width":500,"type":"group","padding":15}},{"v":"B","value":{"labelStyle":"","shape":"rect","labelText":"B","rx":0,"ry":0,"class":"default","style":"","id":"B","width":500,"type":"group","padding":15},"parent":"A"},{"v":"b","value":{"labelStyle":"","shape":"rect","labelText":"b","rx":0,"ry":0,"class":"default","style":"","id":"b","padding":15},"parent":"A"},{"v":"c","value":{"labelStyle":"","shape":"rect","labelText":"c","rx":0,"ry":0,"class":"default","style":"","id":"c","padding":15},"parent":"B"},{"v":"a","value":{"labelStyle":"","shape":"rect","labelText":"a","rx":0,"ry":0,"class":"default","style":"","id":"a","padding":15},"parent":"A"}],"edges":[{"v":"b","w":"B","name":"1","value":{"minlen":1,"arrowhead":"normal","arrowTypeStart":"arrow_open","arrowTypeEnd":"arrow_point","thickness":"normal","pattern":"solid","style":"fill:none","labelStyle":"","arrowheadStyle":"fill: #333","labelpos":"c","labelType":"text","label":"","id":"L-b-B","cssClasses":"flowchart-link LS-b LE-B"}},{"v":"a","w":"c","name":"2","value":{"minlen":1,"arrowhead":"normal","arrowTypeStart":"arrow_open","arrowTypeEnd":"arrow_point","thickness":"normal","pattern":"solid","style":"fill:none","labelStyle":"","arrowheadStyle":"fill: #333","labelpos":"c","labelType":"text","label":"","id":"L-a-c","cssClasses":"flowchart-link LS-a LE-c"}}],"value":{"rankdir":"TB","nodesep":50,"ranksep":50,"marginx":8,"marginy":8}}'
    );
    const gr = graphlibJson.read(exportedGraph);

    log.info('Graph before', graphlibJson.write(gr));
    adjustClustersAndEdges(gr);
    const aGraph = gr.node('A').graph;
    const bGraph = aGraph.node('B').graph;
    log.info('Graph after', graphlibJson.write(aGraph));
    // log.trace('Graph after', graphlibJson.write(g))
    expect(aGraph.parent('c')).toBe('B');
    expect(aGraph.parent('B')).toBe(undefined);
  });
});
describe('extractDescendants', function () {
  let g;
  beforeEach(function () {
    setLogLevel(1);
    g = new graphlib.Graph({
      multigraph: true,
      compound: true,
    });
    g.setGraph({
      rankdir: 'TB',
      nodesep: 10,
      ranksep: 10,
      marginx: 8,
      marginy: 8,
    });
    g.setDefaultEdgeLabel(function () {
      return {};
    });
  });
  it('Simple case of one level descendants GLB9', function () {
    /*
    subgraph A
      a
    end
    subgraph B
      b
    end
    subgraph C
      c
    end
    A --> B
    A --> C
    */
    g.setNode('a', { data: 1 });
    g.setNode('b', { data: 2 });
    g.setNode('c', { data: 3 });
    g.setParent('a', 'A');
    g.setParent('b', 'B');
    g.setParent('c', 'C');
    g.setEdge('A', 'B', { data: 'link1' }, '1');
    g.setEdge('A', 'C', { data: 'link2' }, '2');

    // log.info(g.edges())
    const d1 = extractDescendants('A', g);
    const d2 = extractDescendants('B', g);
    const d3 = extractDescendants('C', g);

    expect(d1).toEqual(['a']);
    expect(d2).toEqual(['b']);
    expect(d3).toEqual(['c']);
  });
});
describe('sortNodesByHierarchy', function () {
  let g;
  beforeEach(function () {
    setLogLevel(1);
    g = new graphlib.Graph({
      multigraph: true,
      compound: true,
    });
    g.setGraph({
      rankdir: 'TB',
      nodesep: 10,
      ranksep: 10,
      marginx: 8,
      marginy: 8,
    });
    g.setDefaultEdgeLabel(function () {
      return {};
    });
  });
  it('should sort proper en nodes are in reverse order', function () {
    /*
  a -->b
  subgraph B
  b
  end
  subgraph A
  B
  end
    */
    g.setNode('a', { data: 1 });
    g.setNode('b', { data: 2 });
    g.setParent('b', 'B');
    g.setParent('B', 'A');
    g.setEdge('a', 'b', '1');
    expect(sortNodesByHierarchy(g)).toEqual(['a', 'A', 'B', 'b']);
  });
  it('should sort proper en nodes are in correct order', function () {
    /*
  a -->b
  subgraph B
  b
  end
  subgraph A
  B
  end
    */
    g.setNode('a', { data: 1 });
    g.setParent('B', 'A');
    g.setParent('b', 'B');
    g.setNode('b', { data: 2 });
    g.setEdge('a', 'b', '1');
    expect(sortNodesByHierarchy(g)).toEqual(['a', 'A', 'B', 'b']);
  });
});

describe('Subgraphs with a direction of their own', function () {
  /**
   * Dagre lays out a graph with a single `rankdir`, so a subgraph only keeps its own
   * direction when it is extracted into a graph of its own. An extracted subgraph shows
   * up as a `clusterNode` carrying that graph; one that was left in place does not.
   */
  const subgraphRankdir = (g, id) => g.node(id)?.graph?.graph()?.rankdir;

  let g;
  beforeEach(function () {
    setLogLevel(1);
    // The cluster bookkeeping is module-level state shared with every other suite here.
    clear();
    g = new graphlib.Graph({ multigraph: true, compound: true });
    g.setGraph({ rankdir: 'TB', nodesep: 10, ranksep: 10, marginx: 8, marginy: 8 });
    g.setDefaultEdgeLabel(function () {
      return {};
    });
  });

  /**
   * flowchart TB
   *   A --> B
   *   subgraph Sub
   *     direction LR
   *     B1 --> B2
   *   end
   *   B --> B1
   *   B2 --> C
   */
  const graphWithEdgesIntoSubgraph = (g, subgraphData) => {
    g.setNode('A', {});
    g.setNode('B', {});
    g.setNode('C', {});
    g.setNode('Sub', subgraphData);
    for (const id of ['B1', 'B2']) {
      g.setNode(id, {});
      g.setParent(id, 'Sub');
    }
    g.setEdge('A', 'B', {}, 'a-b');
    g.setEdge('B1', 'B2', {}, 'b1-b2');
    g.setEdge('B', 'B1', {}, 'into');
    g.setEdge('B2', 'C', {}, 'out-of');
  };

  it('keeps its direction when an edge points at a node inside it', function () {
    graphWithEdgesIntoSubgraph(g, { dir: 'LR' });
    adjustClustersAndEdges(g);

    expect(subgraphRankdir(g, 'Sub')).toBe('LR');
    // Dagre lays the edges out against the frame, since it cannot route into a graph it
    // lays out separately.
    expect(g.edges()).toEqual([
      { v: 'A', w: 'B', name: 'a-b' },
      { v: 'B', w: 'Sub', name: 'into' },
      { v: 'Sub', w: 'C', name: 'out-of' },
    ]);
    // The node the author wrote is kept, so the painted edge can carry on across the
    // frame and finish on it rather than stopping at the subgraph's border.
    expect(g.edge('B', 'Sub', 'into')).toMatchObject({
      terminalEnd: 'B1',
      terminalEndAnchor: 'Sub',
    });
    expect(g.edge('Sub', 'C', 'out-of')).toMatchObject({
      terminalStart: 'B2',
      terminalStartAnchor: 'Sub',
    });
  });

  it('is left in place when it declares no direction', function () {
    graphWithEdgesIntoSubgraph(g, {});
    adjustClustersAndEdges(g);

    expect(g.node('Sub').clusterNode).toBeUndefined();
    expect(g.edges()).toContainEqual({ v: 'B', w: 'B1', name: 'into' });
    expect(g.edge('B', 'B1', 'into').terminalEnd).toBeUndefined();
  });

  it('is left in place when its direction matches the one it inherits', function () {
    // TD and TB are the same direction, so this subgraph has nothing of its own to keep.
    graphWithEdgesIntoSubgraph(g, { dir: 'TD' });
    adjustClustersAndEdges(g);

    expect(g.node('Sub').clusterNode).toBeUndefined();
    expect(g.edges()).toContainEqual({ v: 'B', w: 'B1', name: 'into' });
  });

  it('keeps both directions for an edge running between two of them', function () {
    /*
      flowchart TB
        subgraph S1
          direction LR
          a1 --> a2
        end
        subgraph S2
          direction BT
          b1 --> b2
        end
        a2 --> b1
    */
    g.setNode('S1', { dir: 'LR' });
    g.setNode('S2', { dir: 'BT' });
    for (const id of ['a1', 'a2']) {
      g.setNode(id, {});
      g.setParent(id, 'S1');
    }
    for (const id of ['b1', 'b2']) {
      g.setNode(id, {});
      g.setParent(id, 'S2');
    }
    g.setEdge('a1', 'a2', {}, 'a');
    g.setEdge('b1', 'b2', {}, 'b');
    g.setEdge('a2', 'b1', {}, 'cross');
    adjustClustersAndEdges(g);

    expect(subgraphRankdir(g, 'S1')).toBe('LR');
    expect(subgraphRankdir(g, 'S2')).toBe('BT');
    expect(g.edges()).toEqual([{ v: 'S1', w: 'S2', name: 'cross' }]);
    expect(g.edge('S1', 'S2', 'cross')).toMatchObject({
      terminalStart: 'a2',
      terminalStartAnchor: 'S1',
      terminalEnd: 'b1',
      terminalEndAnchor: 'S2',
    });
  });

  it('anchors on the outermost frame the edge crosses', function () {
    /*
      flowchart TB
        subgraph Outer
          subgraph Inner
            direction LR
            i1 --> i2
          end
        end
        X --> i1
    */
    g.setNode('X', {});
    g.setNode('Outer', {});
    g.setNode('Inner', { dir: 'LR' });
    g.setParent('Inner', 'Outer');
    for (const id of ['i1', 'i2']) {
      g.setNode(id, {});
      g.setParent(id, 'Inner');
    }
    g.setEdge('i1', 'i2', {}, 'inner');
    g.setEdge('X', 'i1', {}, 'cross');
    adjustClustersAndEdges(g);

    // `Outer` declares nothing, so the edge only has to clear `Inner`'s frame.
    expect(subgraphRankdir(g, 'Inner')).toBe('LR');
    expect(g.edges()).toEqual([{ v: 'X', w: 'Inner', name: 'cross' }]);
    expect(g.edge('X', 'Inner', 'cross')).toMatchObject({
      terminalEnd: 'i1',
      terminalEndAnchor: 'Inner',
    });
  });

  it('leaves an edge alone when both of its ends would land on the same frame', function () {
    /*
      flowchart TB
        subgraph Sub
          direction LR
          s1 --> s2
        end
        s1 --> Sub
    */
    g.setNode('Sub', { dir: 'LR' });
    for (const id of ['s1', 's2']) {
      g.setNode(id, {});
      g.setParent(id, 'Sub');
    }
    g.setEdge('s1', 's2', {}, 'inner');
    g.setEdge('s1', 'Sub', {}, 'to-own-frame');

    expect(() => adjustClustersAndEdges(g)).not.toThrow();
    // Nothing to anchor it on but its own frame, so the subgraph keeps the treatment it
    // has always had: laid out along with everything around it.
    expect(g.node('Sub').clusterNode).toBeUndefined();
  });
});
