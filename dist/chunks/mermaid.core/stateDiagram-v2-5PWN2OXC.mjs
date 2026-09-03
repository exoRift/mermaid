import {
  StateDB,
  stateDiagram_default,
  stateRenderer_v3_unified_default,
  styles_default
} from "./chunk-FDF5BC4P.mjs";
import "./chunk-XXDRQBXY.mjs";
import "./chunk-M4NEF4PN.mjs";
import "./chunk-64ML4ENR.mjs";
import "./chunk-MYAAS4NN.mjs";
import "./chunk-BD47WVAS.mjs";
import "./chunk-KMRHZOZX.mjs";
import "./chunk-IBF6GQSA.mjs";
import "./chunk-YSWIPMVQ.mjs";
import "./chunk-H5QFDMAM.mjs";
import "./chunk-J5ZVWO5B.mjs";
import "./chunk-FP5LUCQQ.mjs";
import "./chunk-WAHVBNYK.mjs";
import "./chunk-MR5B6ZOG.mjs";
import "./chunk-TBLCSLTH.mjs";
import "./chunk-X3CZISLH.mjs";
import {
  __name
} from "./chunk-Y2CYZVJY.mjs";

// src/diagrams/state/stateDiagram-v2.ts
var diagram = {
  parser: stateDiagram_default,
  get db() {
    return new StateDB(2);
  },
  renderer: stateRenderer_v3_unified_default,
  styles: styles_default,
  init: /* @__PURE__ */ __name((cnf) => {
    if (!cnf.state) {
      cnf.state = {};
    }
    cnf.state.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
  }, "init")
};
export {
  diagram
};
