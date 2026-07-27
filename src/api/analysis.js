import instance from "@/utils/intercept";
import config from "../../config";
// PCI 等级统计
export function getPciStatistics() {
  return instance({
    url: "/road/task/statistics/pci",
    method: "get"
  });
}

// 资产统计
export function getAssetStatistics() {
  console.log({config});
  
  return instance({
    baseURL:config.api_path2,
    url: "/agent/asset/stat",
    method: "get"
  });
}

// 病害统计
export function getDiseaseStatistics(data) {
  return instance({
    baseURL:config.api_path2,
    url: "/agent/disease/stat",
    method: "post",
    data
  });
}

// 异常事件统计
export function getAbnormalEventStatistics(data) {
  return instance({
    baseURL:config.api_path2,
    url: "/agent/asset/abnormal",
    method: "post",
    data
  });
}
