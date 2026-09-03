import {
  StateDB,
  stateDiagram_default,
  stateRenderer_v3_unified_default,
  styles_default
} from "./chunk-XCXC5OUH.mjs";
import "./chunk-CJTOMMB5.mjs";
import "./chunk-VTC7VYGZ.mjs";
import "./chunk-V5ESWE5Q.mjs";
import "./chunk-AFAC7KXL.mjs";
import "./chunk-PMXDW5KB.mjs";
import "./chunk-UCVOOVTW.mjs";
import "./chunk-THX4NYLK.mjs";
import "./chunk-KH3TF6JI.mjs";
import "./chunk-AWAWVJFC.mjs";
import "./chunk-LCDYBOFP.mjs";
import "./chunk-K2DFZHL5.mjs";
import "./chunk-44VG2JZA.mjs";
import "./chunk-XH24M5MD.mjs";
import "./chunk-VHRBJK3G.mjs";
import "./chunk-445WJIJ4.mjs";
import "./chunk-ZYW6AQDM.mjs";
import "./chunk-OHNBJXQ2.mjs";
import {
  __name
} from "./chunk-35ZOQMXA.mjs";

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
