import instance from "@/utils/intercept";

export function fetchInterpretTasks(params) {
  return instance({
    url: "/rs/interpret/tasks",
    method: "get",
    params,
  });
}

export function getInterpretTask(id) {
  return instance({
    url: `/rs/interpret/tasks/${id}`,
    method: "get",
  });
}

export function createInterpretTask(data) {
  return instance({
    url: "/rs/interpret/tasks",
    method: "post",
    data,
  });
}

export function updateInterpretTask(data) {
  return instance({
    url: "/rs/interpret/tasks",
    method: "put",
    data,
  });
}

export function deleteInterpretTask(id, deleteResultFiles) {
  return instance({
    url: `/rs/interpret/tasks/${id}`,
    method: "delete",
    params: { deleteResultFiles: deleteResultFiles ? true : false },
  });
}

export function batchDeleteInterpretTasks(data) {
  return instance({
    url: "/rs/interpret/tasks/batch-delete",
    method: "post",
    data,
  });
}

export function fetchRsModelOptions() {
  return instance({
    url: "/rs/interpret/models/options",
    method: "get",
  });
}

export function fetchRsImages(params) {
  return instance({
    url: "/rs/interpret/images",
    method: "get",
    params,
  });
}

export function startInterpretTask(id) {
  return instance({ url: `/rs/interpret/tasks/${id}/start`, method: "post" });
}

export function stopInterpretTask(id) {
  return instance({ url: `/rs/interpret/tasks/${id}/stop`, method: "post" });
}

export function syncInterpretTaskStatus(id) {
  return instance({ url: `/rs/interpret/tasks/${id}/sync-status`, method: "post" });
}

export const TASK_TYPE_SINGLE = "SINGLE";
export const TASK_TYPE_CHANGE_DETECT = "CHANGE_DETECT";
