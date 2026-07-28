import instance from "@/utils/intercept";

//预警事件列表
/**
 * 获取预警事件列表
 * @param {Object} data 请求参数
 * @param {string} data.startTime 开始时间，格式：yyyy-MM-dd HH:mm:ss
 * @param {string} data.endTime 结束时间，格式：yyyy-MM-dd HH:mm:ss
 * @param {Array<string>} data.warningTypes 预警类型数组，可选值：['吸烟监测', '渔船监测', '人员检测']
 * @param {string} data.cameraId 摄像头ID，可选
 * @param {number} data.pageNum 页码，默认1
 * @param {number} data.pageSize 每页大小，默认10
 * @returns {Promise<Object>} 响应数据
 * @returns {number} total 总记录数
 * @returns {Array<WarningEvent>} list 预警事件列表
 *
 * WarningEvent 字段：
 * @property {number} id 预警编号
 * @property {string} cameraName 摄像头名称（监测任务）
 * @property {string} position 监控区域
 * @property {string} warningType 预警类型
 * @property {string} warningTime 预警时间，格式：yyyy-MM-dd HH:mm:ss
 * @property {number} confidence 置信度（告警级别），百分比
 * @property {string} status 处理状态：'未处理'|'已处理'|'已确认'
 * @property {string} readStatus 已读未读状态：'已读'|'未读'
 * @property {string} imageUrl 告警图片URL
 * @property {Object} detectionBox 检测框坐标，包含 x, y, width, height
 * @property {string} remark 备注信息
 */
export function getWarningEvent(data) {
  return instance({
    url: "/warningTable/selectwarning",
    method: "post",
    data,
  });
}

//预警类型列表
/**
 * 获取所有预警类型列表
 * @returns {Promise<Array<AlgorithmType>>} 预警类型数组
 *
 * AlgorithmType 字段：
 * @property {string} value 类型值，如：'smoke', 'boat', 'person'
 * @property {string} label 类型显示名称，如：'吸烟监测', '渔船监测', '人员检测'
 */
export function getAllAlgorithm() {
  return instance({
    url: "/warningTable/getalertTypes",
    method: "get",
  });
}

//摄像头点位
/**
 * 获取所有摄像头点位
 * @returns {Promise<Array<CameraLocation>>} 摄像头点位数组
 *
 * CameraLocation 字段：
 * @property {string} value 摄像头ID，如：'camera01'
 * @property {string} label 摄像头显示名称，如：'东门摄像头01'
 * @property {string} position 监控区域，如：'东门岗亭'
 */
export function getAllLocations() {
  return instance({
    url: "/warningTable/getcameraPosition",
    method: "get",
  });
}

//预警信息详情
/**
 * 获取预警事件详情
 * @param {Object} data 请求参数
 * @param {number} data.id 预警事件ID
 * @returns {Promise<WarningEventDetail>} 预警事件详情
 *
 * WarningEventDetail 字段：
 * @property {number} id 预警编号
 * @property {string} cameraName 摄像头名称（监测任务）
 * @property {string} position 监控区域
 * @property {string} warningType 预警类型
 * @property {string} warningTime 预警时间，格式：yyyy-MM-dd HH:mm:ss
 * @property {number} confidence 置信度（告警级别），百分比
 * @property {string} status 处理状态：'未处理'|'已处理'|'已确认'
 * @property {string} readStatus 已读未读状态：'已读'|'未读'
 * @property {string} imageUrl 告警图片URL
 * @property {Object} detectionBox 检测框坐标，包含 x, y, width, height
 * @property {string} remark 备注信息
 * @property {string} taskId 关联任务ID
 * @property {string} createTime 创建时间
 * @property {string} updateTime 更新时间
 */
export function getWarningEventDetail(data) {
  return instance({
    url: "/warningTable/selectbytaskid",
    method: "get",
    params: data,
  });
}

//设置预警推送
/**
 * 设置预警推送任务
 * @param {Object} data 请求参数
 * @param {string} data.jobType 任务类型，如：'warning'
 * @param {string} data.cameraIds 摄像头ID列表，逗号分隔
 * @param {Array<string>} data.warningTypes 预警类型数组
 * @param {string} data.pushInterval 推送间隔，如：'5m', '10m'
 * @returns {Promise<Object>} 响应数据
 * @returns {number} code 状态码
 * @returns {string} msg 消息
 * @returns {Object} data 任务信息
 */
export function setWarningPush(data) {
  return instance({
    url: "/job/startJob",
    method: "post",
    data,
  });
}

//获取预警推送详情
/**
 * 获取预警推送任务详情
 * @returns {Promise<Object>} 响应数据
 * @returns {number} code 状态码
 * @returns {string} msg 消息
 * @returns {Object} data 任务详情
 * @property {string} jobId 任务ID
 * @property {string} jobType 任务类型
 * @property {string} cameraIds 摄像头ID列表
 * @property {Array<string>} warningTypes 预警类型数组
 * @property {string} pushInterval 推送间隔
 * @property {string} status 任务状态：'running'|'stopped'
 * @property {string} createTime 创建时间
 */
export function getWarningPushDetail() {
  return instance({
    url: "/job/getJobMsg",
    method: "get",
  });
}

//获取文字检测摄像头点位
export function getTextDetectLocations() {
  return instance({
    url: "/ocrTable/getcameraPosition",
    method: "post",
  });
}

//获取文字检测预警事件
export function getTextDetectWarning(data) {
  return instance({
    url: "/ocrTable/getOcrTalbes",
    method: "post",
    data,
  });
}

//获取文字检测预警事件详情
export function getTextDetectWarningDetail(data) {
  return instance({
    url: "/ocrTable/getOcrTalbe",
    method: "post",
    data,
  });
}

//获取人脸识别摄像头点位
export function getFaceDetectLocations() {
  return instance({
    url: "/faceTable/getcameraPosition",
    method: "post",
  });
}

//获取人脸识别预警事件
export function getFaceDetectWarning(data) {
  return instance({
    url: "/faceTable/getOcrTalbes",
    method: "post",
    data,
  });
}

//获取人脸识别预警事件详情
export function getFaceDetectWarningDetail(data) {
  return instance({
    url: "/faceTable/getOcrTalbe",
    method: "post",
    data,
  });
}


//删除目标检测预警事件
export function deleteTargetDetectWarning(data) {
  return instance({
    url: "/warningTable/deleteByIds",
    method: "post",
    data,
  });
}
/**
 * 预警问答 - 流式响应 POST SSE，token放header
 * @param {Object} req AiChatReq实体
 * @returns {Promise<ReadableStream>}
 */
export async function getWarningQAStream(req) {
  const baseURL = instance.defaults.baseURL;
  const url = `${baseURL}/ai/assistant/qa_chat`;
  const token = localStorage.getItem('Authorization');

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(req),
    mode: 'cors',
    credentials: 'include'
  });

  if (!res.ok) {
    throw new Error(`流式接口请求失败：${res.status}`);
  }
  // 返回可读流，外部解析data分片
  return res.body;
}

/**
 * 流式数据解析工具：逐行解析SSE data: xxx
 * 支持结构化JSON事件：message、node_started、error、message_end
 * @param {ReadableStream} stream fetch返回的body流
 * @param {Object} callbacks 回调函数集合
 * @param {Function} callbacks.onMessage 收到data回调 (parsedValue, rawLength, abortController)
 * @param {Function} callbacks.onEnd 流结束回调
 * @param {Function} callbacks.onError 异常回调
 */
export function parseSSEStream(stream, { onMessage, onEnd, onError }) {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  const abortController = reader; // 用于外部取消

  function read() {
    reader.read().then(({ done, value }) => {
      if (done) {
        onEnd?.();
        return;
      }
      // 拼接分片并按换行切割
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop(); // 剩余不完整片段留在缓冲区

      for (const line of lines) {
        // 兼容两种 SSE data 前缀：'data: '（带空格，标准推荐） 和 'data:'（无空格，Spring SseEmitter 默认）
        let rawData = null;
        if (line.startsWith('data: ')) {
          rawData = line.slice(6);
        } else if (line.startsWith('data:')) {
          rawData = line.slice(5);
        }
        if (rawData !== null) {
          if (rawData.trim()) {
            let parsedValue = rawData;
            try {
              // 尝试解析为 JSON 事件对象
              parsedValue = JSON.parse(rawData);
            } catch (e) {
              // 非 JSON 格式，作为纯文本处理
            }
            const rawLength = rawData.length;
            onMessage(parsedValue, rawLength, abortController);
          }
          // 空 data 行（如心跳 "data:"）继续解析后续行，不当作结束
        }
        // SSE结束标识（后端需输出 event:end）
        if (line.startsWith('event: end')) {
          reader.cancel();
          onEnd?.();
          return;
        }
      }
      read();
    }).catch(err => {
      reader.cancel();
      onError?.(err);
    });
  }
  read();

  // 返回取消流方法，页面销毁时中断请求
  return () => reader.cancel();
}

/**
 * 停止QA聊天流式响应
 * @param {string} taskId 任务ID
 * @returns {Promise<Object>}
 */
export function stopQAchat(taskId) {
  return instance({
    url: `/ai/assistant/stop_chat/${taskId}`,
    method: 'post',
  });
}


/**
 * 预警问答 - 普通同步接口 AiChatReq 请求体
 * @param {Object} req AiChatReq
 * @returns {Promise<Object>}
 */
export function getWarningQA(req) {
  return instance({
    url: "/ai/assistant/qa_chat",
    method: "post",
    data: req,
  });
}

//获取历史问题列表
/**
 * 获取历史问题列表
 * @returns {Promise<Array>} 预设问题数组
 */
export function getPresetQuestions(data) {
  return instance({
    url: "/ai/assistant/history",
    method: "post",
    data,
  });
}

/**
 * 删除问答历史记录
 * @param {Object} params QueryHisReq
 */
export function deleteHis(data) {
  return instance({
    url: '/ai/assistant/delete/his',
    method: 'post',
    data,
  })
}
// 分析报告相关接口

/**
 * 获取报告列表
 * @param {Object} data 请求参数
 * @param {string} data.reportName 报告名称关键词，可选
 * @param {number} data.pageNum 页码，默认1
 * @param {number} data.pageSize 每页大小，默认10
 * @returns {Promise<Object>} 响应数据
 * @returns {number} total 总记录数
 * @returns {Array<ReportItem>} list 报告列表
 *
 * ReportItem 字段：
 * @property {number} id 报告ID
 * @property {string} reportName 报告名称
 * @property {string} startDate 开始日期，格式：yyyy-MM-dd
 * @property {string} endDate 结束日期，格式：yyyy-MM-dd
 * @property {string} createTime 创建时间，格式：yyyy-MM-dd HH:mm:ss
 * @property {string} status 报告状态：'pending'|'generating'|'generated'|'failed'
 * @property {string} statusText 状态文本：'待生成报告'|'生成中'|'已生成报告'|'生成失败'
 * @property {string} downloadUrl 报告下载URL
 * @property {string} fileType 文件类型：'pdf'
 */
export function getReportList(data) {
  return instance({
    url: "/report/list",
    method: "post",
    data,
  });
}

/**
 * 生成报告
 * @param {Object} data 请求参数
 * @param {string} data.reportName 报告名称
 * @param {Array<number>} data.taskIds 选中的任务ID数组
 * @returns {Promise<Object>} 响应数据
 * @returns {number} code 状态码
 * @returns {string} msg 消息
 * @returns {Object} data 报告信息
 */
export function generateReport(data) {
  return instance({
    url: "/report/generate",
    method: "post",
    data,
  });
}

/**
 * 删除报告
 * @param {Object} data 请求参数
 * @param {number|Array<number>} data.ids 报告ID或ID数组
 * @returns {Promise<Object>} 响应数据
 * @returns {number} code 状态码
 * @returns {string} msg 消息
 */
export function deleteReport(data) {
  return instance({
    url: "/report/delete",
    method: "post",
    data,
  });
}

/**
 * 获取报告预览信息
 * @param {Object} data 请求参数
 * @param {number} data.reportId 报告ID
 * @returns {Promise<Object>} 响应数据
 * @returns {number} code 状态码
 * @returns {string} msg 消息
 * @returns {Object} data 报告信息，包含下载URL等
 */
export function getReportPreview(data) {
  return instance({
    url: "/report/preview",
    method: "get",
    params: data,
  });
}
