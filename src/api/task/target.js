import instance from "@/utils/intercept";

//算法模型列表
export function getAllAlgorithm() {
  return instance({
    url: "/createdetectiontask/selectAimodels",
    method: "get",
  });
}

//监控点位列表
export function getCameraList() {
  return instance({
    url: "/sterams/getCameralistGroup",
    method: "get",
  });
}

//监测任务列表
export function getTaskList(data) {
  return instance({
    url: "/createdetectiontask/gettasklist",
    method: "get",
    params: data,
  });
}

//监测任务详情
export function getTaskDetail(data) {
  return instance({
    url: "/createdetectiontask/getDetectionTask",
    method: "get",
    params: data,
  });
}

//添加目标检测任务
export function createTask(data) {
  return instance({
    url: "/createdetectiontask/insertDetectiontask",
    method: "post",
    data,
  });
}

//编辑目标检测任务
export function updateTask(data) {
  return instance({
    url: "/createdetectiontask/updateDetectiontask",
    method: "post",
    data,
  });
}

//启动目标检测任务
export function playTask(data) {
  return instance({
    url: "/createdetectiontask/startvideostream",
    method: "get",
    params: data,
  });
}

//停用目标检测任务
export function pauseTask(data) {
  return instance({
    url: "/createdetectiontask/stopvideostream",
    method: "get",
    params: data,
  });
}

//删除目标检测任务
export function deleteTask(data) {
  return instance({
    url: "/createdetectiontask/deletetask",
    method: "get",
    params: data,
  });
}
