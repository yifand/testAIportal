<template>
  <div class="analysis-qa" ref="pageContent">
    <div class="page-header" ref="pageHeader">
      <h1 class="page-title">工具链调用</h1>
      <div class="page-subtitle">智能分析预警数据，快速获取洞察</div>
    </div>

    <div class="content-wrapper" ref="contentWrapper" :style="{ height: contentHeight + 'px' }">
      <!-- 左侧筛选区域 -->
      <div class="left-panel">
        <div class="panel-card">
          <div class="panel-header">
            <i class="el-icon-question"></i>
            <span>预设问题</span>
          </div>
          <div class="panel-content">
            <div class="time-section">
              <h3>智能分析</h3>
              <div class="question-list">
                <div v-for="(question, index) in todayQuestions" :key="index" class="question-item"
                  @click="handlePresetQuestion(question)">
                  {{ question }}
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      <!-- 右侧聊天区域 -->
      <div class="right-panel" ref="rightPanel">
        <div class="chat-container">
          <div class="chat-header" ref="chatHeader">
            <div class="chat-title">工具链调用</div>
            <div class="chat-actions">
              <el-button size="small" @click="clearChat" :disabled="messages.length === 0 || isGenerating">
                <i class="el-icon-delete"></i>
                清空对话
              </el-button>
              <el-button size="small" @click="loadHistory" :disabled="isGenerating">
                <i class="el-icon-refresh"></i>
                加载历史
              </el-button>
            </div>
          </div>

          <div class="chat-messages" ref="chatMessages" :style="{ height: messagesHeight + 'px' }">
            <div v-if="messages.length === 0" class="empty-chat">
              <i class="el-icon-chat-dot-round"></i>
              <p>开始提问吧！点击左侧预设问题或直接输入您的问题</p>
            </div>

            <div v-for="(message, index) in messages" :key="index" :class="['message-item', message.type]">
              <div class="message-avatar">
                <i v-if="message.type === 'user'" class="el-icon-user"></i>
                <i v-if="message.type === 'assistant'" class="el-icon-chat-line-round"></i>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-role">{{ message.type === 'user' ? '您' : '智能助手' }}</span>
                  <span class="message-time">{{ message.time }}</span>
                </div>
                <!-- 思考过程展示 -->
                <div v-if="message.think" class="think-content">
                  <div class="think-header" @click="message.thinkExpanded = !message.thinkExpanded">
                    <i :class="message.thinkExpanded ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"></i>
                    <span>思考过程</span>
                  </div>
                  <div v-show="message.thinkExpanded" class="think-body" v-html="formatMessage(message.think)"></div>
                </div>
                <div class="message-text" v-html="formatMessage(message.content)"></div>

                <!-- 知识库引用资料（数据保留，前端暂不展示） -->
                <!--
                <div
                    v-if="message.type === 'assistant' && message.references && message.references.length > 0 && message.complete"
                    class="reference-section"
                >
                  <div class="reference-header" @click="message.refExpanded = !message.refExpanded">
                    <i :class="message.refExpanded ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"></i>
                    <span>参考来源（{{ message.references.length }} 条）</span>
                  </div>
                  <div v-show="message.refExpanded" class="reference-list">
                    <div
                        v-for="(ref, rIdx) in message.references"
                        :key="rIdx"
                        class="reference-item"
                    >
                      <div class="ref-name">{{ ref.name }}</div>
                      <div class="ref-content" v-html="formatMessage(ref.content)"></div>
                    </div>
                  </div>
                </div>
                -->
                <!-- 流式响应中的加载动画 -->
                <div v-if="message.type === 'assistant' && message.isStreaming && !message.complete"
                  class="streaming-indicator">
                  <i class="el-icon-loading"></i>
                  <span>思考中...</span>
                </div>
              </div>
            </div>

            <!-- 生成中的加载状态 -->
            <div v-if="isGenerating && !currentStreamingMessage" class="loading-message">
              <div class="message-avatar">
                <i class="el-icon-chat-line-round"></i>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-role">智能助手</span>
                </div>
                <div class="message-text">
                  <i class="el-icon-loading"></i>
                  正在为您生成回答...
                </div>
              </div>
            </div>
          </div>

          <div class="chat-input" ref="chatInput">
            <div class="input-container">
              <el-input v-model="inputQuestion" type="textarea" :rows="3" placeholder="请输入您的问题，例如：当前隐患点数量是多少？"
                @keydown.enter.exact.prevent="handleSendQuestion" resize="none" :disabled="isGenerating" />
              <div class="input-actions">
                <el-button v-if="isGenerating" type="danger" @click="abortStream">
                  <i class="el-icon-video-pause"></i>
                  停止生成
                </el-button>
                <el-button v-else type="primary" @click="handleSendQuestion" :loading="isGenerating"
                  :disabled="!inputQuestion.trim()">
                  <i class="el-icon-s-promotion"></i>
                  发送
                </el-button>
                <el-button @click="inputQuestion = ''" :disabled="!inputQuestion.trim() || isGenerating">
                  清空
                </el-button>
              </div>
            </div>

            <div class="input-tips">
              <i class="el-icon-info"></i>
              提示：您可以使用自然语言提问，系统会自动分析预警数据并生成回答
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getWarningQAStream, parseSSEStream, getWarningQA, getPresetQuestions, deleteHis, stopQAchat } from '@/api/warning.js';
import chatHeightMixin from './mixins/chatHeight';

export default {
  name: 'AnalysisQa',
  mixins: [chatHeightMixin],

  data() {
    return {
      // 聊天相关
      messages: [],
      inputQuestion: '',
      isGenerating: false,
      isStop: false,
      isMsg: false,
      isEnd: true,
      currentStreamingMessage: null,
      messageId: '',
      taskId: '',
      conversationId: '',  // 多轮对话会话 ID
      cancelStream: null,
      abortController: null,
      thinkIndex: [],

      // 预设问题
      todayQuestions: [
        '当前有多少巡检车？',
        '道路资产情况如何？',
        '累计工单总数'
      ],

      hisQueryParams: {
        pageNo: 1,
        pageSize: 50,
        hisIds: [],
        type: '1'
      },
      chatConfig: {
        aiHistoryType: 1,
        response_mode: 'streaming',
        files: null,
      }
    };
  },

  created() {
    this.initData();
    this.loadHistory();
  },

  methods: {
    initData() {
      this.messages = [];
    },

    async loadHistory() {
      try {
        const res = await getPresetQuestions(this.hisQueryParams);
        if (res.code === 200 && res.data) {
          const recordList = Array.isArray(res.data) ? res.data : (res.data.records || []);
          if (!recordList || recordList.length === 0) {
            this.$message.info('暂无历史对话记录');
            return;
          }
          // 后端按 createTime DESC 倒序返回，反转后按时间正序展示对话
          const sortedList = [...recordList].reverse();
          this.messages = [];
          sortedList.forEach(item => {
            const msgTime = item.createTime
              ? this.formatTime(new Date(item.createTime))
              : this.formatTime(new Date());
            if (item.req) {
              this.messages.push({
                type: 'user',
                content: item.req,
                time: msgTime
              });
            }
            if (item.answer) {
              this.messages.push({
                type: 'assistant',
                content: item.answer,
                time: msgTime,
                think: item.thought || '',
                thinkExpanded: false
              });
            }
          });
          if (this.messages.length === 0) {
            this.$message.info('暂无历史对话记录');
          } else {
            this.$nextTick(() => this.scrollToBottom());
          }
        } else {
          this.$message.info('暂无历史对话记录');
        }
      } catch (err) {
        console.error('加载历史对话失败', err);
        this.$message.error('加载历史失败，请重试');
      }
    },

    handlePresetQuestion(question) {
      this.inputQuestion = question;
      this.handleSendQuestion();
    },

    handleSendQuestion() {
      const question = this.inputQuestion.trim();
      if (!question) return;
      this.sendQuestion(question);
    },

    // 组装AiChatReq实体，发起POST流式问答
    async sendQuestion(question, isRefresh = false) {
      // 中断上一次未完成的流
      if (this.cancelStream) {
        this.cancelStream();
        this.cancelStream = null;
      }
      if (this.abortController) {
        this.abortController = null;
      }

      if (!isRefresh) {
        this.addMessage('user', question);
        this.inputQuestion = '';
      }
      this.isGenerating = true;
      this.isStop = false;
      this.isMsg = false;
      this.isEnd = false;

      // 后端AiChatReq完整JSON请求体
      const aiChatReq = {
        query: question,
        response_mode: this.chatConfig.response_mode,
        aiHistoryType: this.chatConfig.aiHistoryType,
        conversation_id: this.conversationId || undefined,
        files: this.chatConfig.files,
        inputs: {
          timeRange: '7d',
          warningTypes: [],
          cameraId: ''
        }
      };

      // 创建流式占位消息，带 message_id 标记
      const placeholderId = 'streaming_' + Date.now();
      this.currentStreamingMessage = {
        type: 'assistant',
        content: '',
        message_id: placeholderId,
        time: this.formatTime(new Date()),
        isStreaming: true,
        complete: false
      };
      this.messages.push(this.currentStreamingMessage);
      this.scrollToBottom();

      try {
        // 获取可读流
        const stream = await getWarningQAStream(aiChatReq);
        // 解析SSE流，保存取消句柄
        const self = this;
        this.cancelStream = parseSSEStream(stream, {
          onMessage: (value, length, abortCon) => {
            if (self.isGenerating) {
              self.isMsg = true;

              // 非空校验：传入回调的 value 可能是对象或字符串
              const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
              const eventName = value && value.event;

              // 统一提取公共字段（conversation_id 每一帧都携带，取首次即可）
              if (value && value.conversation_id && !self.conversationId) {
                self.conversationId = value.conversation_id;
              }
              if (value && value.message_id) self.messageId = value.message_id;
              if (value && value.task_id) self.taskId = value.task_id;

              if (eventName === 'workflow_started') {
                // 工作流启动：conversation_id / task_id 已在上面统一提取，无需额外操作
              } else if (eventName === 'message' && !isEmpty) {
                // 核心：逐字推送 answer 字段，实时拼接渲染
                const answer = value.answer || value.data || '';
                if (answer) self.changeMsg(answer, false);
              } else if (eventName === 'node_started') {
                // 节点开始，仅做流程记录，不影响对话展示
              } else if (eventName === 'node_finished') {
                // 节点完成：不影响流，后续还有 message_end 统一收尾
              } else if (eventName === 'workflow_finished') {
                // 工作流完成：取 data.outputs.answer 作为兜底，防止 message 分片丢失
                const fullAnswer = value.data && value.data.outputs && value.data.outputs.answer;
                if (fullAnswer && self.currentStreamingMessage) {
                  const currentContent = self.currentStreamingMessage.content || '';
                  if (!currentContent || currentContent.length < fullAnswer.length) {
                    self.currentStreamingMessage.content = fullAnswer;
                    self.messages = [...self.messages];
                    self.handleAddTask();
                  }
                }
              } else if (eventName === 'message_end') {
                // 消息结束：标记完成，提取引用资料（retriever_resources）挂到消息上
                const refs = value.metadata && value.metadata.retriever_resources;
                if (refs && refs.length > 0 && self.currentStreamingMessage) {
                  self.currentStreamingMessage.references = refs.map(r => ({
                    name: r.document_name || '',
                    content: r.content || '',
                    score: r.score
                  }));
                }
                self.changeMsg('', true);
                self.resetData();
                self.resetThinkData(self.messageId);
              } else if (eventName === 'error') {
                // 错误
                const errMsg = value.message || value.answer || '服务器繁忙，请稍候再继续';
                self.changeMsg(errMsg, true);
                self.resetData();
                self.abortStream();
              } else if (typeof value === 'string' && value.trim()) {
                // 兼容纯文本流式响应
                self.changeMsg(value, false);
              } else if (value && typeof value === 'object' && !eventName) {
                // 兼容无 event 字段的对象
                const answer = value.answer || value.data || value.content || '';
                if (answer) self.changeMsg(answer, false);
              }
            }
            self.abortController = abortCon;
          },
          onEnd: () => {
            if (self.currentStreamingMessage) {
              self.currentStreamingMessage.isStreaming = false;
              self.currentStreamingMessage.complete = true;
              self.currentStreamingMessage = null;
            }
            self.resetData();
            self.cancelStream = null;
          },
          onError: (error) => {
            console.error('流式连接错误:', error);
            self.fallbackToNormalRequest(aiChatReq);
          }
        });
      } catch (err) {
        console.error('发起流式请求失败', err);
        this.fallbackToNormalRequest(aiChatReq);
      }
    },

    // 重置状态
    resetData() {
      this.isStop = false;
      this.isGenerating = false;
      this.isMsg = false;
      this.isEnd = true;
    },

    // 重置思考索引
    resetThinkData(messageId) {
      const index = this.thinkIndex.findIndex((x) => x === messageId);
      if (index > -1) {
        this.thinkIndex.splice(index, 1);
      }
    },

    // 中止流式响应
    abortStream() {
      this.abortContStop();
      if (this.taskId) {
        stopQAchat(this.taskId).then((res) => { });
      }
      this.resetData();
    },

    // 前端取消读流
    abortContStop() {
      if (this.cancelStream) {
        this.cancelStream();
        this.cancelStream = null;
      }
      this.abortController = null;
    },

    // 滚动到底部
    handleAddTask() {
      setTimeout(() => {
        const container = this.$refs.chatMessages;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 17);
    },

    // 变更消息内容：支持 <think> 思考标签解析
    changeMsg(res, isMsgEnd = false) {
      // 第一步：先把占位消息的 message_id 同步为真实的 messageId
      if (
        this.currentStreamingMessage &&
        this.currentStreamingMessage.message_id !== this.messageId &&
        this.messageId
      ) {
        this.currentStreamingMessage.message_id = this.messageId;
      }

      // 第二步：按 messageId 查找已有消息
      const existingItem = this.messages.find(
        (x) => x.message_id === this.messageId
      );

      if (existingItem) {
        // 已找到消息，累加内容
        const oldContent = existingItem.content || '';
        const oldAllMsg = existingItem.allMsg || oldContent;

        if (oldContent.includes('<think>') || oldAllMsg.includes('<think>')) {
          // 已包含思考标签，累计 allMsg 然后按 </think> 切分
          existingItem.allMsg = oldAllMsg + res;
          const newStr = existingItem.allMsg.split('</think>');
          if (newStr && newStr[1] !== undefined) {
            existingItem.content = newStr[1];
            existingItem.think = newStr[0];
            this.resetThinkData(this.messageId);
          } else {
            // 还未到 </think>，全部当作思考内容
            existingItem.think = existingItem.allMsg;
            existingItem.content = '';
          }
        } else {
          // 普通文本累加
          if (isMsgEnd) {
            existingItem.content = oldContent + res;
          } else {
            existingItem.content = oldContent + res;
          }
          this.resetThinkData(this.messageId);
        }
        // 标记流状态
        if (isMsgEnd) {
          existingItem.isStreaming = false;
          existingItem.complete = true;
        }
      } else {
        // 第一次创建/更新消息
        const newStr = (res || '').split('</think>');
        const hasThink = (res || '').includes('<think>');

        if (hasThink) {
          // 包含 <think> 标签
          const newMsg = {
            type: 'assistant',
            content: '',
            message_id: this.messageId,
            time: this.formatTime(new Date()),
            allMsg: res,
            think: '',
            isStreaming: !isMsgEnd,
            complete: isMsgEnd
          };
          if (newStr && newStr[1] !== undefined) {
            newMsg.content = newStr[1];
            newMsg.think = newStr[0];
            this.resetThinkData(this.messageId);
          } else {
            newMsg.think = res;
            newMsg.content = '';
          }
          if (!this.thinkIndex.find((x) => x === this.messageId)) {
            this.thinkIndex.push(this.messageId);
          }
          // 替换占位消息
          if (this.currentStreamingMessage) {
            const idx = this.messages.indexOf(this.currentStreamingMessage);
            if (idx > -1) {
              this.messages.splice(idx, 1, newMsg);
              this.currentStreamingMessage = newMsg;
            } else {
              this.messages.push(newMsg);
              this.currentStreamingMessage = newMsg;
            }
          } else {
            this.messages.push(newMsg);
            this.currentStreamingMessage = newMsg;
          }
        } else if (newStr && newStr[1] !== undefined) {
          // 包含 </think> 但可能不含 <think> 开头（前半段是 think）
          const newMsg = {
            type: 'assistant',
            content: newStr[1],
            message_id: this.messageId,
            time: this.formatTime(new Date()),
            allMsg: res,
            think: newStr[0],
            isStreaming: !isMsgEnd,
            complete: isMsgEnd
          };
          this.resetThinkData(this.messageId);
          if (this.currentStreamingMessage) {
            const idx = this.messages.indexOf(this.currentStreamingMessage);
            if (idx > -1) {
              this.messages.splice(idx, 1, newMsg);
              this.currentStreamingMessage = newMsg;
            } else {
              this.messages.push(newMsg);
              this.currentStreamingMessage = newMsg;
            }
          } else {
            this.messages.push(newMsg);
            this.currentStreamingMessage = newMsg;
          }
        } else {
          // 普通文本（首次）
          if (this.currentStreamingMessage) {
            this.currentStreamingMessage.content =
              (this.currentStreamingMessage.content || '') + res;
            if (isMsgEnd) {
              this.currentStreamingMessage.isStreaming = false;
              this.currentStreamingMessage.complete = true;
            }
            this.resetThinkData(this.messageId);
          } else {
            // 没有占位消息，直接 push
            this.messages.push({
              type: 'assistant',
              content: res,
              message_id: this.messageId,
              time: this.formatTime(new Date()),
              isStreaming: !isMsgEnd,
              complete: isMsgEnd
            });
          }
        }
      }

      // 强制触发响应式更新
      this.messages = [...this.messages];
      this.handleAddTask();
    },

    // 降级普通同步POST接口
    fallbackToNormalRequest(aiChatReq) {
      // 清除流式占位消息
      if (this.currentStreamingMessage) {
        const index = this.messages.indexOf(this.currentStreamingMessage);
        if (index > -1) this.messages.splice(index, 1);
        this.currentStreamingMessage = null;
      }
      if (this.cancelStream) {
        this.cancelStream();
        this.cancelStream = null;
      }
      this.resetData();
      getWarningQA(aiChatReq).then(res => {
        if (res.code === 200) {
          this.addMessage('assistant', res.data.answer || '已收到您的请求，正在分析数据...');
        } else {
          this.addMessage('assistant', `抱歉，暂时无法回答您的问题。错误：${res.msg || '未知错误'}`);
        }
        this.loadHistory();
      }).catch(err => {
        console.error('问答接口请求失败:', err);
        this.addMessage('assistant', '抱歉，服务暂时不可用，请稍后重试。');
      });
    },

    addMessage(type, content) {
      const message = {
        type: type,
        content: content,
        time: this.formatTime(new Date())
      };
      this.messages.push(message);
      this.scrollToBottom();
    },

    formatMessage(content) {
      if (!content) return '';
      let formatted = content.replace(/\n/g, '<br>');
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
      return formatted;
    },

    formatTime(date) {
      if (!date) return '';
      const d = new Date(date);
      const now = new Date();
      const isToday = d.getFullYear() === now.getFullYear()
        && d.getMonth() === now.getMonth()
        && d.getDate() === now.getDate();
      if (isToday) {
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const seconds = d.getSeconds().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatMessages;
        if (container) container.scrollTop = container.scrollHeight;
      });
    },

    clearChat() {
      this.$confirm('确定要清空所有对话记录吗？删除后无法恢复！', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteHis(this.hisQueryParams);
          this.messages = [];
          this.conversationId = '';
          this.$message.success('对话记录已清空，已开启新会话');
        } catch (err) {
          console.error('删除历史失败', err);
          this.$message.error('清空对话失败，请重试');
        }
      }).catch(() => { });
    }
  },

  beforeDestroy() {
    // 页面销毁中断流式请求，防止后台持续推送
    if (this.cancelStream) {
      this.cancelStream();
    }
  }
};
</script>

<style lang="scss" scoped>
@import './chat-common.scss';
</style>
