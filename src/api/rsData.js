import instance from "@/utils/intercept";

export function fetchDataImages(params) {
  return instance({ url: "/rs/data/images", method: "get", params });
}

export function getDataImage(id) {
  return instance({ url: `/rs/data/images/${id}`, method: "get" });
}

export function createDataImage(data) {
  return instance({ url: "/rs/data/images", method: "post", data });
}

export function updateDataImage(data) {
  return instance({ url: "/rs/data/images", method: "put", data });
}

export function deleteDataImage(id) {
  return instance({ url: `/rs/data/images/${id}`, method: "delete" });
}

export function syncFtpData(data) {
  return instance({ url: "/rs/data/ftp/sync", method: "post", data });
}
