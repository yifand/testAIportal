import instance from "@/utils/intercept";

export function fetchVisualizationOverview() {
  return instance({ url: "/rs/visualization/overview", method: "get" });
}

export function fetchVisualizationResults(params) {
  return instance({ url: "/rs/visualization/results", method: "get", params });
}

export function fetchClassStatistics(params) {
  return instance({ url: "/rs/visualization/class-stats", method: "get", params });
}

export function fetchChangeResults(params) {
  return instance({ url: "/rs/visualization/change-results", method: "get", params });
}

export function fetchChangeResultDetail(resultId) {
  return instance({ url: `/rs/visualization/change-result/${resultId}`, method: "get" });
}
