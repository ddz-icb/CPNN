// import log from "../../logger.js";
// import { useGraphData } from "../adapters/state/graphState";

// export const graphService = {
//   getCurrentGraph() {
//     return useGraphData.getState().graphData;
//   },
//   async handleCreateGraph(event, takeAbs, minCorrForEdge, minCompSizeForNode, maxCompSizeForNode, takeSpearmanCoefficient, mergeSameProtein) {
//     const file = event.target.files[0];
//     if (!event || !event.target || !file) return;
//     log.info("Adding new graph file");

//     createGraph(
//       file,
//       graphData.uploadedGraphNames,
//       setGraphData,
//       takeAbs,
//       minCorrForEdge,
//       minCompSizeForNode,
//       maxCompSizeForNode,
//       takeSpearmanCoefficient,
//       mergeSameProtein
//     )
//       .then(() => {})
//       .catch((error) => {
//         setError(`${error.message}`);
//         log.error("Error adding graph file:", error);
//       });
//   },
// };
