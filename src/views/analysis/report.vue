<template>
  <div class="analysis-report">
    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <span>事件分析</span>
      <span class="separator">/</span>
      <span class="current">分析报告</span>
    </div>

    <!-- 搜索和操作区域 -->
    <div class="search-bar">
      <div class="search-input">
        <i class="el-icon-search search-icon"></i>
        <el-input
          v-model="searchText"
          placeholder="请输入报告名称"
          clearable
          @keyup.enter.native="handleSearch"
        />
      </div>
      <el-button type="primary" icon="el-icon-plus" @click="handleGenerateReport">生成报告</el-button>
    </div>

    <!-- 报告列表 -->
    <div class="report-list">
      <el-table
        :data="reportList"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column label="报告名称" min-width="200">
          <template slot-scope="scope">
            <span class="report-name" @click="handleViewReport(scope.row)">{{ scope.row.reportName }}</span>
          </template>
        </el-table-column>

        <el-table-column label="关联任务" min-width="80" align="center">
          <template slot-scope="scope">
            {{ getTaskCount(scope.row) }}
          </template>
        </el-table-column>

        <el-table-column label="编制时间" min-width="120">
          <template slot-scope="scope">
            {{ scope.row.createTime }}
          </template>
        </el-table-column>

        <el-table-column label="报告状态" min-width="120">
          <template slot-scope="scope">
            <span :class="['status', getStatusClass(scope.row.status)]">
              <i :class="getStatusIcon(scope.row.status)"></i>
              {{ scope.row.statusText }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="80" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="text"
              class="delete-btn"
              @click="handleDelete(scope.row)"
            >
              <i class="el-icon-delete"></i>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <span class="total-text">共 {{ total }} 条</span>
        <el-pagination
          @current-change="handlePageChange"
          :current-page="currentPage"
          :page-size="pageSize"
          layout="prev, pager, next"
          :total="total"
        />
      </div>
    </div>

    <!-- 生成报告弹窗 -->
    <el-dialog
      title="生成报告"
      :visible.sync="dialogVisible"
      width="600px"
    >
      <el-form :model="reportForm" label-width="110px" class="report-form">
        <el-form-item label="报告名称" required>
          <el-input
            v-model="reportForm.reportName"
            placeholder="请输入报告名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="选择任务" required>
          <el-select
            v-model="reportForm.taskIds"
            multiple
            collapse-tags
            filterable
            placeholder="请选择任务(可多选)"
          >
            <el-option
              v-for="item in taskOptions"
              :key="item.id"
              :label="item.taskName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmGenerate">确定</el-button>
      </div>
    </el-dialog>

    <!-- 报告预览弹窗 -->
    <el-dialog
      :title="currentReport ? currentReport.reportName : '报告预览'"
      :visible.sync="previewDialogVisible"
      width="90%"
      top="5vh"
      class="preview-dialog"
      @closed="currentReport = null"
    >
      <div class="preview-content">
        <!-- 下载按钮区域 -->
        <div class="preview-toolbar">
          <el-button
            type="primary"
            icon="el-icon-download"
            @click="handleDownloadReport"
            :disabled="!currentReport || !currentReport.content"
          >
            下载报告
          </el-button>
        </div>
        
        <!-- Markdown 预览区域 -->
        <div class="markdown-preview">
          <div
            v-if="currentReport && currentReport.content"
            class="markdown-body"
            v-html="renderedMarkdown"
          ></div>
          <div v-else class="no-preview">
            <i class="el-icon-document"></i>
            <p>报告内容加载中...</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getReportList, generateReport, deleteReport, getReportPreview } from '@/api/warning'
import { fetchTaskQueue } from '@/api/rsConsole'

export default {
  name: 'AnalysisReport',
  data() {
    return {
      searchText: '',
      loading: false,
      reportList: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      dialogVisible: false,
      previewDialogVisible: false,
      currentReport: null,
      taskOptions: [],
      reportForm: {
        reportName: '',
        taskIds: []
      }
    }
  },
  computed: {
    // 渲染 Markdown 为 HTML
    renderedMarkdown() {
      if (!this.currentReport || !this.currentReport.content) return ''
      return this.simpleMarkdownToHtml(this.currentReport.content)
    }
  },
  created() {
    this.loadReportList()
  },
  methods: {
    // 加载任务选项（从任务队列接口获取）
    loadTaskOptions() {
      fetchTaskQueue({ pageNum: 1, pageSize: 100 }).then(res => {
        if (res && res.code === 200 && res.data) {
          this.taskOptions = res.data.records || []
        }
      }).catch(err => {
        console.error('加载任务列表失败:', err)
      })
    },

    // 加载报告列表
    loadReportList() {
      this.loading = true
      const params = {
        reportName: this.searchText,
        pageNum: this.currentPage,
        pageSize: this.pageSize
      }
      
      getReportList(params).then(res => {
        if (res.code === 200) {
          this.reportList = res.data.list || []
          this.total = res.data.total || 0
          
          // 格式化状态文本
          this.reportList.forEach(item => {
            if (!item.statusText) {
              item.statusText = this.getStatusText(item.status)
            }
          })
        } else {
          this.$message.error(res.msg || '加载报告列表失败')
          this.reportList = []
          this.total = 0
        }
      }).catch(err => {
        console.error('加载报告列表失败:', err)
        this.$message.error('网络请求失败')
        this.reportList = []
        this.total = 0
      }).finally(() => {
        this.loading = false
      })
    },

    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'pending': '待生成报告',
        'generating': '生成中',
        'generated': '已生成报告',
        'failed': '生成失败'
      }
      return statusMap[status] || '未知状态'
    },

    // 搜索
    handleSearch() {
      this.currentPage = 1
      this.loadReportList()
    },

    // 生成报告
    handleGenerateReport() {
      this.reportForm = {
        reportName: '',
        taskIds: []
      }
      this.loadTaskOptions()
      this.dialogVisible = true
    },

    // 确认生成
    confirmGenerate() {
      if (!this.reportForm.reportName) {
        this.$message.warning('请输入报告名称')
        return
      }
      if (!this.reportForm.taskIds || this.reportForm.taskIds.length === 0) {
        this.$message.warning('请选择至少一个任务')
        return
      }

      const params = {
        reportName: this.reportForm.reportName,
        taskIds: this.reportForm.taskIds
      }

      generateReport(params).then(res => {
        if (res.code === 200) {
          this.$message.success('报告生成成功')
          this.dialogVisible = false
          this.loadReportList()
        } else {
          this.$message.error(res.msg || '生成报告失败')
        }
      }).catch(err => {
        console.error('生成报告失败:', err)
        this.$message.error('网络请求失败')
      })
    },

    // 查看报告详情
    handleViewReport(row) {
      if (row.status !== 'generated') {
        this.$message.warning('报告尚未生成，无法预览')
        return
      }
      
      this.currentReport = row
      this.previewDialogVisible = true
      
      // 如果当前行没有content，则请求获取完整报告内容
      if (!row.content) {
        getReportPreview({ reportId: row.id }).then(res => {
          if (res.code === 200 && res.data) {
            this.$set(this.currentReport, 'content', res.data.content)
          }
        })
      }
    },

    // 下载报告（Markdown 文件）
    handleDownloadReport() {
      if (!this.currentReport || !this.currentReport.content) {
        this.$message.warning('报告内容为空，无法下载')
        return
      }
      
      const blob = new Blob([this.currentReport.content], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${this.currentReport.reportName}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },

    // 删除报告
    handleDelete(row) {
      this.$confirm(`确定删除报告 "${row.reportName}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteReport({ ids: row.id }).then(res => {
          if (res.code === 200) {
            this.$message.success('删除成功')
            this.loadReportList()
          } else {
            this.$message.error(res.msg || '删除失败')
          }
        }).catch(err => {
          console.error('删除报告失败:', err)
          this.$message.error('网络请求失败')
        })
      }).catch(() => {})
    },

    // 获取状态类名
    getStatusClass(status) {
      const statusClassMap = {
        'pending': 'status-pending',
        'generating': 'status-generating',
        'generated': 'status-success',
        'failed': 'status-danger'
      }
      return statusClassMap[status] || 'status-pending'
    },

    // 获取状态图标
    getStatusIcon(status) {
      const statusIconMap = {
        'pending': 'el-icon-time',
        'generating': 'el-icon-loading',
        'generated': 'el-icon-success',
        'failed': 'el-icon-error'
      }
      return statusIconMap[status] || 'el-icon-time'
    },

    // 分页切换
    handlePageChange(val) {
      this.currentPage = val
      this.loadReportList()
    },

    // 获取关联任务数量
    getTaskCount(row) {
      if (row.taskIds) {
        try {
          const ids = typeof row.taskIds === 'string' ? JSON.parse(row.taskIds) : row.taskIds
          return Array.isArray(ids) ? ids.length : 0
        } catch (e) {
          return 0
        }
      }
      return 0
    },

    // 简单 Markdown 转 HTML
    simpleMarkdownToHtml(md) {
      if (!md) return ''
      let html = md
        // 转义HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      
      // 标题
      html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
      html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
      html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
      
      // 粗体、斜体
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
      
      // 分割线
      html = html.replace(/^---$/gm, '<hr>')
      
      // 引用块
      html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
      
      // 表格
      html = html.replace(/<table>/g, '<table class="md-table">')
      
      // 无序列表
      html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
      
      // 段落：连续非空行
      html = html.replace(/\n\n+/g, '</p><p>')
      html = '<p>' + html + '</p>'
      
      // 清理空段落
      html = html.replace(/<p><\/p>/g, '')
      html = html.replace(/<p>(\s*<h[123]>)/g, '$1')
      html = html.replace(/(<\/h[123]>)\s*<\/p>/g, '$1')
      html = html.replace(/<p>(\s*<hr\s*\/?>\s*)<\/p>/g, '$1')
      html = html.replace(/<p>(\s*<blockquote>)/g, '$1')
      html = html.replace(/(<\/blockquote>)\s*<\/p>/g, '$1')
      html = html.replace(/<p>(\s*<li>)/g, '<ul>$1')
      html = html.replace(/(<\/li>)\s*<\/p>/g, '$1</ul>')
      html = html.replace(/<\/li>\s*<li>/g, '</li><li>')
      
      // 换行
      html = html.replace(/\n/g, '<br>')
      
      return html
    }
  }
}
</script>

<style lang="scss" scoped>
.analysis-report {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  // 旋转动画
  @keyframes rotating {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  // 面包屑导航
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

  // 搜索栏
  .search-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: #fff;
    padding: 16px 20px;
    border-radius: 4px;

    .search-input {
      display: flex;
      align-items: center;
      width: 300px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      padding: 0 12px;
      background: #fff;

      .search-icon {
        color: #909399;
        margin-right: 8px;
        font-size: 16px;
      }

      ::v-deep .el-input {
        flex: 1;

        .el-input__inner {
          border: none;
          padding-left: 0;
        }
      }
    }
  }

  // 报告列表
  .report-list {
    background: #fff;
    padding: 20px;
    border-radius: 4px;

    .report-name {
      color: #409eff;
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    .status {
      display: flex;
      align-items: center;
      gap: 4px;

      i {
        font-size: 14px;
      }

      &.status-generating i {
        animation: rotating 2s linear infinite;
      }

      &.status-success {
        color: #67c23a;
      }

      &.status-pending {
        color: #909399;
      }

      &.status-generating {
        color: #e6a23c;
      }

      &.status-danger {
        color: #f56c6c;
      }
    }

    .delete-btn {
      color: #f56c6c;
      padding: 0;
      font-size: 16px;

      &:hover {
        color: #f78989;
      }
    }

    // 分页
    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 20px;
      gap: 16px;

      .total-text {
        color: #606266;
        font-size: 13px;
      }

      ::v-deep .el-pagination {
        .el-pagination__total {
          margin-right: 16px;
        }

        .btn-prev,
        .btn-next,
        .number {
          background: #fff;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          margin: 0 4px;
          min-width: 30px;
          height: 30px;
          line-height: 28px;

          &:hover {
            color: #409eff;
          }
        }

        .number.active {
          background: #409eff;
          color: #fff;
          border-color: #409eff;
        }
      }
    }
  }

  // 弹窗表单样式
  .report-form {
    ::v-deep .el-form-item {
      margin-bottom: 24px;

      &.is-required .el-form-item__label:before {
        content: '*';
        color: #f56c6c;
        margin-right: 4px;
      }

      .el-form-item__label {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
      }

      .el-input__inner,
      .el-range-editor.el-input__inner {
        height: 36px;
        line-height: 36px;
        border-color: #dcdfe6;

        &:hover {
          border-color: #c0c4cc;
        }

        &:focus {
          border-color: #409eff;
        }
      }

      .el-select {
        width: 100%;

        .el-select__tags {
          flex-wrap: nowrap;
          overflow: hidden;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #e8e8e8;
  }

  // PDF预览弹窗样式
  .preview-dialog {
    ::v-deep .el-dialog {
      height: 90vh;
      display: flex;
      flex-direction: column;

      .el-dialog__body {
        flex: 1;
        padding: 20px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
    }

    .preview-content {
      display: flex;
      flex-direction: column;
      height: 100%;

      .preview-toolbar {
        margin-bottom: 16px;
        text-align: right;
      }

      .markdown-preview {
        flex: 1;
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        background: #fff;
        overflow: auto;
        padding: 24px 32px;

        .markdown-body {
          font-size: 14px;
          line-height: 1.8;
          color: #303133;

          ::v-deep h1 { font-size: 22px; margin: 16px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
          ::v-deep h2 { font-size: 18px; margin: 14px 0 10px; }
          ::v-deep h3 { font-size: 15px; margin: 12px 0 8px; }
          ::v-deep hr { border: none; border-top: 1px solid #e8e8e8; margin: 16px 0; }
          ::v-deep blockquote { margin: 8px 0; padding: 8px 16px; border-left: 4px solid #409eff; background: #f0f7ff; color: #606266; }
          ::v-deep strong { color: #303133; }
          ::v-deep ul { padding-left: 24px; margin: 4px 0; }
          ::v-deep li { margin: 2px 0; }
          ::v-deep table.md-table { border-collapse: collapse; width: 100%; margin: 12px 0; }
          ::v-deep table.md-table th,
          ::v-deep table.md-table td { border: 1px solid #dcdfe6; padding: 8px 12px; text-align: left; font-size: 13px; }
          ::v-deep table.md-table th { background: #f5f7fa; font-weight: 600; }
          ::v-deep p { margin: 4px 0; }
        }

        .no-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #909399;

          i {
            font-size: 48px;
            margin-bottom: 16px;
          }

          p {
            margin: 4px 0;
          }
        }
      }
    }
  }
}
</style>
