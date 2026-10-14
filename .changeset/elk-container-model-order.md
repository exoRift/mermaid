---
'mermaid': patch
---

fix(elk): a subgraph with its own `direction` now keeps the order its nodes and edges were written in.

`elk.considerModelOrder` and `elk.forceNodeModelOrder` were resolved for the root graph but never
passed to containers, so a subgraph with an explicit direction — laid out on its own — fell back
to ELK's default, `NONE`, and left the order of its siblings to crossing minimisation alone. Two
branches leaving the same node could come out either way round, whatever order they were declared
in: an `Otherwise` written after the condition it falls through from could be drawn to its left.

Directional subgraphs now take both options from the same config as the root. Subgraphs without a
direction are laid out as part of the root and already respected them, so they are unchanged.
