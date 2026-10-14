import {
  insertCluster
} from "./chunk-BD47WVAS.mjs";
import {
  insertEdge,
  insertEdgeLabel,
  markers_default,
  positionEdgeLabel
} from "./chunk-KMRHZOZX.mjs";
import {
  insertNode
} from "./chunk-IBF6GQSA.mjs";
import {
  labelHelper
} from "./chunk-YSWIPMVQ.mjs";
import {
  interpolateToCurve
} from "./chunk-MR5B6ZOG.mjs";
import {
  common_default,
  getConfig
} from "./chunk-TBLCSLTH.mjs";
import {
  log
} from "./chunk-X3CZISLH.mjs";
import {
  __name
} from "./chunk-Y2CYZVJY.mjs";

// src/internals.ts
var internalHelpers = {
  common: common_default,
  getConfig,
  insertCluster,
  insertEdge,
  insertEdgeLabel,
  insertMarkers: markers_default,
  insertNode,
  interpolateToCurve,
  labelHelper,
  log,
  positionEdgeLabel
};

// src/rendering-util/layout-algorithms/elk/algorithms.ts
var ELK_ALGORITHMS = [
  "elk.stress",
  "elk.force",
  "elk.mrtree",
  "elk.sporeOverlap",
  "elk.box",
  "elk.rectpacking"
];

// src/rendering-util/render.ts
var layoutAlgorithms = /* @__PURE__ */ Object.create(null);
var registerLayoutLoaders = /* @__PURE__ */ __name((loaders) => {
  for (const loader of loaders) {
    layoutAlgorithms[loader.name] = loader;
  }
}, "registerLayoutLoaders");
var elkLayoutLoaders = /* @__PURE__ */ __name(() => {
  const loader = /* @__PURE__ */ __name(async () => await import("./elk-QQR72ZSC.mjs"), "loader");
  return [
    { name: "elk", loader, algorithm: "elk.layered" },
    ...ELK_ALGORITHMS.map((algorithm) => ({ name: algorithm, loader, algorithm }))
  ];
}, "elkLayoutLoaders");
var registerDefaultLayoutLoaders = /* @__PURE__ */ __name(() => {
  registerLayoutLoaders([
    {
      name: "dagre",
      loader: /* @__PURE__ */ __name(async () => await import("./dagre-63IQFLNM.mjs"), "loader")
    },
    {
      name: "swimlane",
      loader: /* @__PURE__ */ __name(async () => await import("./swimlanes-CN3ZCF5Q.mjs"), "loader")
    },
    // elkjs is ~1.6 MB of source, so it is excluded from the tiny build along
    // with the other large features. `getRegisteredLayoutAlgorithm` then falls
    // back to dagre for diagrams that ask for an ELK layout there.
    ...true ? [
      {
        name: "cose-bilkent",
        loader: /* @__PURE__ */ __name(async () => await import("./cose-bilkent-JH36ORCC.mjs"), "loader")
      },
      ...elkLayoutLoaders()
    ] : []
  ]);
}, "registerDefaultLayoutLoaders");
registerDefaultLayoutLoaders();
var render = /* @__PURE__ */ __name(async (data4Layout, svg) => {
  if (!Object.hasOwn(layoutAlgorithms, data4Layout.layoutAlgorithm)) {
    throw new Error(`Unknown layout algorithm: ${data4Layout.layoutAlgorithm}`);
  }
  if (data4Layout.diagramId) {
    for (const node of data4Layout.nodes) {
      const originalDomId = node.domId || node.id;
      node.domId = `${data4Layout.diagramId}-${originalDomId}`;
    }
  }
  const layoutDefinition = layoutAlgorithms[data4Layout.layoutAlgorithm];
  const layoutRenderer = await layoutDefinition.loader();
  const { theme, themeVariables } = data4Layout.config;
  const { useGradient, gradientStart, gradientStop } = themeVariables;
  const svgId = svg.attr("id");
  svg.append("defs").append("filter").attr("id", `${svgId}-drop-shadow`).attr("height", "130%").attr("width", "130%").append("feDropShadow").attr("dx", "4").attr("dy", "4").attr("stdDeviation", 0).attr("flood-opacity", "0.06").attr("flood-color", `${theme?.includes("dark") ? "#FFFFFF" : "#000000"}`);
  svg.append("defs").append("filter").attr("id", `${svgId}-drop-shadow-small`).attr("height", "150%").attr("width", "150%").append("feDropShadow").attr("dx", "2").attr("dy", "2").attr("stdDeviation", 0).attr("flood-opacity", "0.06").attr("flood-color", `${theme?.includes("dark") ? "#FFFFFF" : "#000000"}`);
  if (useGradient) {
    const gradient = svg.append("linearGradient").attr("id", svg.attr("id") + "-gradient").attr("gradientUnits", "objectBoundingBox").attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");
    gradient.append("svg:stop").attr("offset", "0%").attr("stop-color", gradientStart).attr("stop-opacity", 1);
    gradient.append("svg:stop").attr("offset", "100%").attr("stop-color", gradientStop).attr("stop-opacity", 1);
  }
  return layoutRenderer.render(data4Layout, svg, internalHelpers, {
    algorithm: layoutDefinition.algorithm
  });
}, "render");
var LAST_RESORT_LAYOUT = "dagre";
var getRegisteredLayoutAlgorithm = /* @__PURE__ */ __name((algorithm = "", { fallback = LAST_RESORT_LAYOUT } = {}) => {
  if (Object.hasOwn(layoutAlgorithms, algorithm)) {
    return algorithm;
  }
  for (const candidate of [fallback, LAST_RESORT_LAYOUT]) {
    if (Object.hasOwn(layoutAlgorithms, candidate)) {
      log.warn(`Layout algorithm ${algorithm} is not registered. Using ${candidate} as fallback.`);
      return candidate;
    }
  }
  throw new Error(
    `Neither layout algorithm ${algorithm}, ${fallback}, nor ${LAST_RESORT_LAYOUT} is registered.`
  );
}, "getRegisteredLayoutAlgorithm");

export {
  registerLayoutLoaders,
  render,
  getRegisteredLayoutAlgorithm
};
