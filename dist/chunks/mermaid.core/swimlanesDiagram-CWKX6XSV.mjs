import {
  createFlowDiagram,
  styles_default
} from "./chunk-PXB5IAAP.mjs";
import "./chunk-5VM5RSS4.mjs";
import "./chunk-XXDRQBXY.mjs";
import "./chunk-M4NEF4PN.mjs";
import "./chunk-LNGE3PJU.mjs";
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
