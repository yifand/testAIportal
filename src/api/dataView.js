import axios from "@/utils/intercept";

//设备统计
export function getDeviceStats(data) {
  return axios({
    url: "/screen/getCamerastus",
    method: "post",
    data,
  });
}

//摄像头布控预警占比统计
export function getCameraLocationProportion() {
  return axios({
    url: "/screen/getcameraPosition",
    method: "post",
    data: { Nums: 4 },
  });
}

//实时告警事件
export function getRealtimeAlertEvents(data) {
  return axios({
    url: "/screen/getwarning",
    method: "post",
    data,
  });
}

//预警类型占比
export function getAlertTypeProportion() {
  return axios({
    url: "/screen/getalertTypes",
    method: "post",
    data: { Nums: 5 },
  });
}

//今日预警排名走势
export function getTodayAlertTrend(data) {
  return axios({
    url: "/screen/countWarningsToday",
    method: "post",
    data,
  });
}

//七天预警排名走势
export function getWeekAlertTrend(data) {
  return axios({
    url: "/screen/countWarningsLastSevenDays",
    method: "post",
    data,
  });
}

//三十天预警排名走势
export function getMonthAlertTrend(data) {
  return axios({
    url: "/screen/countWarningsLastMonth",
    method: "post",
    data,
  });
}

//预警事件前十统计
export function getAlertEventTop10(data) {
  return axios({
    url: "/screen/getTopAlertMonthTypes",
    method: "post",
    data,
  });
}

//视频标签
export function getVideoLabels() {
  return axios({
    url: "/screen/getTopAlertTypes",
    method: "post",
    data: { Nums: 13 },
  });
}
