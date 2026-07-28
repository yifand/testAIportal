<template>
  <div class="patrol-report">
    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <span>公路巡检智能可视化</span>
      <span class="separator">/</span>
      <span class="current">智能巡检分析报告</span>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-select v-model="selectedRecordId" placeholder="请选择检测记录" size="small" clearable filterable
        @change="handleRecordChange" style="width: 280px;">
        <el-option v-for="item in recordOptions" :key="item.id" :label="item.uploadName"
          :value="item.id + ''"></el-option>
      </el-select>
      <el-button type="primary" icon="el-icon-download" :loading="downloading" @click="handleDownloadPdf">
        下载为 PDF
      </el-button>
    </div>

    <!-- Markdown 渲染区域 -->
    <div class="report-card">
      <div v-if="loading" class="loading-wrap">
        <i class="el-icon-loading"></i>
        <span>报告加载中...</span>
      </div>
      <div v-else class="markdown-preview">
        <div ref="markdownBody" class="markdown-body" v-html="renderedMarkdown"></div>
      </div>
    </div>
  </div>
</template>

<script>
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { marked } from "marked";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
import "highlight.js/styles/github.css";
import "github-markdown-css/github-markdown-light.css";
import { getMonitorRecordDetail, getMonitorRecordList } from "@/api/monitorRecord";

export default {
  name: "PatrolReport",
  data() {
    return {
      loading: false,
      downloading: false,
      markdownContent: "",
      recordId: null,
      selectedRecordId: null,
      recordOptions: []
    };
  },
  computed: {
    renderedMarkdown() {
      if (!this.markdownContent) return "";
      return this.renderMarkdown(this.markdownContent);
    }
  },
  created() {
    this.recordId = this.$route.query.recordId || null;
    this.selectedRecordId = this.recordId;
    this.fetchRecordOptions().then(() => {
      this.loadMarkdown();
    });
  },
  methods: {
    // 加载检测记录列表
    fetchRecordOptions() {
      return getMonitorRecordList({ pageNum: 1, pageSize: 999, aiCheckStatus: 1 })
        .then(res => {
          this.recordOptions = (res && res.records) || [];
          if (!this.recordId && this.recordOptions.length > 0) {
            this.recordId = this.getLatestRecordId(this.recordOptions);
            this.selectedRecordId = this.recordId;
          }
        })
        .catch(err => {
          console.error("加载检测记录列表失败:", err);
        });
    },

    // 获取最新记录 ID
    getLatestRecordId(records) {
      if (!records || records.length === 0) return null;
      const sorted = [...records].sort((a, b) => {
        const tA = a.uploadTime ? new Date(a.uploadTime).getTime() : 0;
        const tB = b.uploadTime ? new Date(b.uploadTime).getTime() : 0;
        return tB - tA;
      });
      return sorted[0] ? String(sorted[0].id) : null;
    },

    // 选择器切换检测记录
    handleRecordChange(val) {
      this.recordId = val || null;
      this.selectedRecordId = val || null;
      if (this.recordId) {
        this.$router.replace({ path: "/patrol-report", query: { recordId: this.recordId } });
        this.loadMarkdown();
      } else {
        this.markdownContent = "";
      }
    },

    // 加载 Markdown 文件
    loadMarkdown() {
      this.loading = true;
      const id = this.recordId;
      if (!id) {
        this.loading = false;
        this.markdownContent = "";
        const msg = this.recordOptions.length === 0 ? "暂无检测记录" : "缺少检测记录 ID";
        this.$message.error(msg);
        return;
      }

      getMonitorRecordDetail(id)
        .then(res => {
          const errorMsg = this.extractErrorMsg(res && res.aiCheckResult);
          if (!errorMsg) {
            this.markdownContent = "";
            this.$message.error("未找到检测报告内容");
            return;
          }
          this.markdownContent = errorMsg;
        })
        .catch(err => {
          console.error("加载报告失败:", err);
          this.markdownContent = "";
          this.$message.error("报告加载失败");
        })
        .finally(() => {
          this.loading = false;
        });
    },

    // 从 aiCheckResult 中解析 errorMsg
    extractErrorMsg(aiCheckResult) {
      if (!aiCheckResult) return "";
      if (typeof aiCheckResult === "object") {
        return aiCheckResult.errorMsg || "";
      }
      const str = String(aiCheckResult).trim();
      if (str.startsWith("{") || str.startsWith("[")) {
        try {
          const parsed = JSON.parse(str);
          return (parsed && parsed.errorMsg) || "";
        } catch (e) {
          return str;
        }
      }
      return str;
    },

    // 下载为 PDF
    async handleDownloadPdf() {
      const element = this.$refs.markdownBody;
      if (!element) {
        this.$message.warning("报告内容为空，无法导出");
        return;
      }

      this.downloading = true;
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff"
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15; // 左右边距 15mm
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const record = this.recordOptions.find(item => String(item.id) === String(this.recordId));
        const fileName = record && record.uploadName ? `${record.uploadName}.pdf` : "智能巡检分析报告.pdf";
        pdf.save(fileName);
      } catch (err) {
        console.error("导出 PDF 失败:", err);
        this.$message.error("导出 PDF 失败");
      } finally {
        this.downloading = false;
      }
    },

    // 渲染 Markdown 为 HTML（使用 marked + highlight.js + DOMPurify）
    renderMarkdown(md) {
      marked.setOptions({
        highlight: function (code, lang) {
          const language = hljs.getLanguage(lang) ? lang : "plaintext";
          return hljs.highlight(code, { language }).value;
        },
        langPrefix: "hljs language-"
      });
      const rawHtml = marked.parse(md);
      return DOMPurify.sanitize(rawHtml);
    },

  }
};
</script>

<style lang="scss" scoped>
.patrol-report {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 70px);

  .breadcrumb {
    margin-bottom: 20px;
    font-size: 14px;
    color: #606266;

    .separator {
      margin: 0 8px;
      color: #c0c4cc;
    }

    .current {
      color: #303133;
      font-weight: 500;
    }
  }

  .toolbar {
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .report-card {
    background: #fff;
    border-radius: 4px;
    border: 1px solid #e4e7ed;
    overflow: hidden;

    .loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      color: #909399;

      i {
        font-size: 48px;
        margin-bottom: 16px;
      }
    }

    .markdown-preview {
      max-height: calc(100vh - 230px);
      overflow: auto;
      padding: 32px 40px;
      background: #ffffff;

      .markdown-body {
        box-sizing: border-box;
        min-width: 200px;
        max-width: 980px;
        margin: 0 auto;

        ::v-deep pre {
          background: #f6f8fa;
          border-radius: 6px;
          padding: 16px;
          overflow: auto;
        }

        ::v-deep code {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
        }
      }
    }
  }
}
</style>
