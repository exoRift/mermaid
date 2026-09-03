import {
  createFlowDiagram,
  styles_default
} from "./chunk-BCM427BM.mjs";
import "./chunk-RRR7N7RX.mjs";
import "./chunk-CJTOMMB5.mjs";
import "./chunk-VTC7VYGZ.mjs";
import "./chunk-3QQH2IZE.mjs";
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

// src/diagrams/swimlanes/styles.ts
var getStyles = /* @__PURE__ */ __name((options) => `${styles_default(options)}
  .swimlane.cluster:not([data-color-id]) rect {
    stroke: ${options.clusterBorder} !important;
  }
  [data-look="neo"].cluster rect {
    filter: none;
  }
`, "getStyles");
var styles_default2 = getStyles;

// src/diagrams/swimlanes/swimlanesDiagram.ts
var diagram = createFlowDiagram({ styles: styles_default2 });
export {
  diagram
};
