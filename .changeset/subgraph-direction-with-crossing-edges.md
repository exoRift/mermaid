---
'mermaid': patch
'@mermaid-js/layout-elk': patch
---

fix: keep a subgraph's `direction` when an edge links a node inside it to the outside.

A subgraph can only honour a direction of its own by being laid out as a graph of its
own, and neither layout engine will route an edge into a graph it lays out separately.
An edge written against a node inside the subgraph therefore silently cost it its
direction, while the same edge written against the subgraph's id did not.

With ELK, such an edge is now split at a hierarchical port on each directed frame it
crosses — ELK's own way across the boundary — so ELK routes every piece like any other
edge, and the pieces are stitched back into the single edge the author wrote. Diagrams
where this happens also switch the root to SIMPLE node placement, which keeps the frames
in a row instead of letting edge straightening walk each one down the page. With dagre,
which has no ports, the leg crossing the frame is routed along the lane between the
frame and the nodes inside it. In both engines the direction now only affects how the
subgraph's own nodes flow.

Junction-style nodes — ones whose styles pin both dimensions to a point-marker size (at
most 20px, e.g. `classDef hidden width: 1px, height: 1px`) — are now laid out at that
styled size rather than at the size of their invisible label, so the edges meeting at one
are no longer spread across a phantom label box. Styles are read from both `style` and
`classDef`, and such a node is centred on what its edges span, so a visible junction dot
sits on the lines it joins rather than floating clear of them — a node drawn as a marker
has no position of its own worth keeping. A node that is merely small, such as a state
diagram's start circle or a fork bar, is left alone: it is the styles that mark a
junction, not the size. The leg that
joins a point node to its route now turns beside the node instead of at the far end,
where the corner used to land on the other node's border and be clipped away along with
the whole run behind it — which left the edge drawn as a single long diagonal.
