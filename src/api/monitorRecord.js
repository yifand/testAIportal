import instance from "@/utils/intercept";

export function getMonitorRecordList(params) {
  return instance({
    url: "/road/task/page",
    method: "get",
    params,
  });
}

export function getMonitorRecordDetail(id) {
  return instance({
    url: `/road/task/detail/${id}`,
    method: "get",
  });
}

export function createMonitorRecord(data) {
  const formData = new FormData();
  formData.append("uploadName", data.uploadName);
  formData.append("roadId", data.roadId);
  formData.append("roadName", data.roadName);
  data.images.forEach(file => {
    formData.append("images", file);
  });
  return instance({
    url: "/road/task/save",
    method: "post",
    data: formData,
  });
}

export function deleteMonitorRecord(id) {
  return instance({
    url: `/road/task/${id}`,
    method: "delete",
  });
}
