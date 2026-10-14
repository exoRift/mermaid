import {
  ClassDB,
  classDiagram_default,
  classRenderer_v3_unified_default,
  styles_default
} from "./chunk-35KTR4ZU.mjs";
import "./chunk-RRR7N7RX.mjs";
import "./chunk-CJTOMMB5.mjs";
import "./chunk-VTC7VYGZ.mjs";
import "./chunk-6MHT6GC4.mjs";
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

// src/diagrams/class/classDiagram-v2.ts
var diagram = {
  parser: classDiagram_default,
  get db() {
    return new ClassDB();
  },
  renderer: classRenderer_v3_unified_default,
  styles: styles_default,
  init: /* @__PURE__ */ __name((cnf) => {
    if (!cnf.class) {
      cnf.class = {};
    }
    cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
  }, "init")
};
export {
  diagram
};
