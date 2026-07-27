import instance from "@/utils/intercept";

export function fetchTaskMonitorOverview() {
  return instance({ url: "/rs/console/task-monitor/overview", method: "get" });
}

export function fetchTaskQueue(params) {
  return instance({ url: "/rs/console/task-monitor/queue", method: "get", params });
}

export function fetchTaskRunLog(taskId) {
  return instance({ url: `/rs/console/task-monitor/log/${taskId}`, method: "get" });
}

export function fetchResourceOverview() {
  return instance({ url: "/rs/console/resource/overview", method: "get" });
}

export function fetchComputeNodes() {
  return instance({ url: "/rs/console/resource/nodes", method: "get" });
}

export function fetchStorageResources() {
  return instance({ url: "/rs/console/resource/storage", method: "get" });
}

export function fetchQueuePolicy() {
  return instance({ url: "/rs/console/resource/policy", method: "get" });
}

export function updateQueuePolicy(data) {
  return instance({ url: "/rs/console/resource/policy", method: "put", data });
}

export function fetchServiceHealth() {
  return instance({ url: "/rs/console/service-monitor/health", method: "get" });
}
