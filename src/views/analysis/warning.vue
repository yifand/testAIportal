<template>
  <div class="analysis-warning">
    <div class="page-header">
      <h1 class="page-title">预警事件</h1>
    </div>

    <div class="content-wrapper">
      <!-- 左侧筛选条件 -->
      <div class="filter-panel">
        <div class="filter-header">
          <div class="filter-title">筛选条件</div>
          <div class="filter-actions">
            <el-button type="primary" @click="handleSearch" icon="el-icon-search">搜索</el-button>
            <el-button @click="handleReset" icon="el-icon-refresh">重置</el-button>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-label">预警时间</div>
          <div class="time-range">
            <div class="time-input">
              <span class="time-label">开始时间</span>
              <el-date-picker
                v-model="filterForm.startTime"
                type="datetime"
                placeholder="选择开始时间"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:mm:ss"
                :picker-options="pickerOptions"
              />
            </div>
            <div class="time-input">
              <span class="time-label">结束时间</span>
              <el-date-picker
                v-model="filterForm.endTime"
                type="datetime"
                placeholder="选择结束时间"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:mm:ss"
                :picker-options="pickerOptions"
              />
            </div>
          </div>
        </div>

        <div class="filter-section">
          <div class="filter-label">预警类型</div>
          <div class="type-checkbox-group">
            <el-checkbox
              v-model="checkAll"
              :indeterminate="isIndeterminate"
              @click="handleCheckAllChange"
            >
              全选
            </el-checkbox>
            <el-checkbox-group
              v-model="filterForm.warningTypes"
              @change="handleCheckedTypesChange"
            >
              <el-checkbox
                v-for="option in warningTypeOptions"
                :key="option.value"
                :label="option.label"
              >
                {{ option.label }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </div>

      <!-- 右侧搜索结果 -->
      <div class="result-panel">
        <div class="result-header">
          <div class="header-left">
            <div class="camera-filter">
              <span class="filter-label">摄像头点位：</span>
              <el-select
                v-model="selectedCamera"
                placeholder="请选择摄像头点位"
                clearable
                @change="handleCameraChange"
                style="width: 220px"
              >
                <el-option
                  v-for="item in cameraOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </div>
          </div>
          <div class="header-right">
            <div class="result-count">共找到 {{ total }} 条预警记录</div>
            <div class="result-actions">
              <el-button type="text" icon="el-icon-refresh" @click="refreshData">刷新</el-button>
            </div>
          </div>
        </div>

        <div class="result-list">
          <div v-if="loading" class="loading-container">
            <i class="el-icon-loading"></i>
            <span>加载中...</span>
          </div>

          <div v-else-if="warningList.length === 0" class="empty-container">
            <i class="el-icon-warning-outline"></i>
            <span>暂无预警数据</span>
          </div>

          <div v-else class="warning-cards">
            <div
              v-for="(item, index) in warningList"
              :key="index"
              class="warning-card"
              @click="handleCardClick(item)"
            >
              <div class="card-image">
                <div class="image-container">
                  <img
                    :src="item.imageUrl"
                    :alt="item.warningType"
                  />
                  <div v-if="item.detectionBox" class="detection-box" :style="getDetectionBoxStyle(item.detectionBox)"></div>
                </div>
                <div class="image-overlay">
                  <el-tag
                    :type="getWarningTypeTag(item.warningType)"
                    size="mini"
                    class="type-tag"
                  >
                    {{ item.warningType }}
                  </el-tag>
                </div>
              </div>

              <div class="card-content">
                <div class="camera-info">
                  <i class="el-icon-video-camera"></i>
                  <span class="camera-name">{{ item.cameraName }}</span>
                </div>
                <div class="warning-time">
                  <i class="el-icon-time"></i>
                  <span>{{ formatTime(item.warningTime) }}</span>
                </div>
                <div class="warning-status">
                  <el-tag
                    :type="getStatusTypeTag(item.status)"
                    size="mini"
                  >
                    {{ item.status }}
                  </el-tag>
                  <span class="confidence">{{ item.confidence }}%</span>
                </div>
                <div class="warning-position" :title="item.position">
                  <i class="el-icon-location-outline"></i>
                  <span>{{ item.position }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="pagination.currentPage"
            :page-sizes="[10, 20, 30, 50]"
            :page-size="pagination.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
          />
        </div>
      </div>
    </div>

    <!-- 事件详情弹窗 -->
    <el-dialog
      title="预警事件详情"
      :visible.sync="detailDialogVisible"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedWarning" class="detail-dialog">
        <div class="detail-left">
          <div class="detail-item">
            <label class="detail-label">预警编号：</label>
            <span class="detail-value">{{ selectedWarning.id }}</span>
          </div>
          <div class="detail-item">
            <label class="detail-label">监控区域：</label>
            <span class="detail-value">{{ selectedWarning.position }}</span>
          </div>
          <div class="detail-item">
            <label class="detail-label">监测任务：</label>
            <span class="detail-value">{{ selectedWarning.cameraName }}</span>
          </div>
          <div class="detail-item">
            <label class="detail-label">预警类型：</label>
            <span class="detail-value">{{ selectedWarning.warningType }}</span>
          </div>
          <div class="detail-item">
            <label class="detail-label">预警时间：</label>
            <span class="detail-value">{{ selectedWarning.warningTime }}</span>
          </div>
          <div class="detail-item">
            <label class="detail-label">告警级别：</label>
            <span class="detail-value">{{ selectedWarning.confidence }}%</span>
          </div>
          <div class="detail-item">
            <label class="detail-label">已读未读状态：</label>
            <el-tag
              :type="selectedWarning.readStatus === '已读' ? 'success' : 'warning'"
              size="small"
            >
              {{ selectedWarning.readStatus }}
            </el-tag>
          </div>
        </div>
        <div class="detail-right">
          <div class="detail-image">
            <img :src="selectedWarning.imageUrl" alt="预警图片" />
            <div v-if="selectedWarning.detectionBox" class="detail-detection-box" :style="getDetectionBoxStyle(selectedWarning.detectionBox)"></div>
          </div>
          <div class="image-remark" v-if="selectedWarning.remark">
            <label>备注：</label>
            <span>{{ selectedWarning.remark }}</span>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关 闭</el-button>
        <el-button type="primary" @click="handleMarkAsRead" v-if="selectedWarning && selectedWarning.readStatus === '未读'">标记为已读</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getWarningEvent, getAllAlgorithm, getAllLocations } from '@/api/warning';

export default {
  name: 'AnalysisWarning',

  data() {
    return {
      // 筛选表单
      filterForm: {
        startTime: '',
        endTime: '',
        warningTypes: []
      },

      // 预警类型选项
      warningTypeOptions: [],

      // 复选框状态
      checkAll: false,
      isIndeterminate: false,

      // 时间选择器选项
      pickerOptions: {
        shortcuts: [{
          text: '今天',
          onClick(picker) {
            picker.$emit('pick', new Date());
          }
        }, {
          text: '昨天',
          onClick(picker) {
            const date = new Date();
            date.setTime(date.getTime() - 3600 * 1000 * 24);
            picker.$emit('pick', date);
          }
        }, {
          text: '一周前',
          onClick(picker) {
            const date = new Date();
            date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
            picker.$emit('pick', date);
          }
        }]
      },

      // 分页数据
      pagination: {
        currentPage: 1,
        pageSize: 10
      },

      // 总记录数
      total: 0,

      // 加载状态
      loading: false,

      // 摄像头点位选项
      cameraOptions: [],
      selectedCamera: 'all',

      // 预警列表数据
      warningList: [],

      // 详情弹窗
      detailDialogVisible: false,
      selectedWarning: null
    };
  },

  created() {
    this.initData();
    this.loadCameraOptions();
    this.loadWarningTypeOptions();
    this.loadWarningList();
  },

  methods: {
    // 加载摄像头点位选项
    loadCameraOptions() {
      getAllLocations().then(res => {
        // 假设返回数据格式为 { code: 200, data: [...] }
        if (res.code === 200) {
          // 添加“全部摄像头”选项
          this.cameraOptions = [
            { value: 'all', label: '全部摄像头' },
            ...res.data.map(item => ({
              value: item.value || item.cameraId,
              label: item.label || item.cameraName,
              position: item.position
            }))
          ];
        } else {
          this.$message.error(res.msg || '加载摄像头点位失败');
          this.cameraOptions = [
            { value: 'all', label: '全部摄像头' }
          ];
        }
      }).catch(err => {
        console.error('加载摄像头点位失败:', err);
        this.$message.error('加载摄像头点位失败');
        this.cameraOptions = [
          { value: 'all', label: '全部摄像头' }
        ];
      });
    },

    // 摄像头选择变化
    handleCameraChange(value) {
      console.log('选择的摄像头:', value);
      this.pagination.currentPage = 1;
      this.loadWarningList();
    },

    // 卡片点击事件
    handleCardClick(item) {
      this.handleViewDetail(item);
    },

    // 初始化数据
    initData() {
      // 设置默认时间（最近7天）
      const endTime = new Date();
      const startTime = new Date();
      startTime.setTime(startTime.getTime() - 3600 * 1000 * 24 * 7);

      this.filterForm.startTime = this.formatDate(startTime);
      this.filterForm.endTime = this.formatDate(endTime);
    },

    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    // 格式化显示时间
    formatTime(timeStr) {
      if (!timeStr) return '';
      return timeStr.replace(' ', ' ').substring(0, 16);
    },

    // 全选处理
    handleCheckAllChange(val) {
      this.filterForm.warningTypes = val ? this.warningTypeOptions.map(item => item.label) : [];
      this.isIndeterminate = false;
    },

    // 复选框变化处理
    handleCheckedTypesChange(value) {
      const checkedCount = value.length;
      const totalCount = this.warningTypeOptions.length;
      this.checkAll = checkedCount === totalCount && totalCount > 0;
      this.isIndeterminate = checkedCount > 0 && checkedCount < totalCount;
    },

    // 搜索
    handleSearch() {
      this.pagination.currentPage = 1;
      this.loadWarningList();
    },

    // 重置
    handleReset() {
      this.filterForm.startTime = '';
      this.filterForm.endTime = '';
      this.filterForm.warningTypes = this.warningTypeOptions.map(item => item.label);
      this.checkAll = this.warningTypeOptions.length > 0;
      this.isIndeterminate = false;
      this.pagination.currentPage = 1;
      this.loadWarningList();
    },

    // 刷新数据
    refreshData() {
      this.loadWarningList();
    },

    // 加载预警列表
    loadWarningList() {
      this.loading = true;

      // 构建请求参数
      const params = {
        startTime: this.filterForm.startTime,
        endTime: this.filterForm.endTime,
        warningTypes: this.filterForm.warningTypes,
        cameraId: this.selectedCamera === 'all' ? '' : this.selectedCamera,
        pageNum: this.pagination.currentPage,
        pageSize: this.pagination.pageSize
      };

      getWarningEvent(params).then(res => {
        if (res.code === 200) {
          // 映射字段，假设返回的列表字段与所需字段一致
          this.warningList = res.data.list.map(item => ({
            id: item.id,
            cameraName: item.cameraName,
            position: item.position,
            warningType: item.warningType,
            warningTime: item.warningTime,
            confidence: item.confidence,
            status: item.status,
            readStatus: item.readStatus,
            imageUrl: item.imageUrl,
            detectionBox: item.detectionBox,
            remark: item.remark
          }));
          this.total = res.data.total || 0;
        } else {
          this.$message.error(res.msg || '加载预警列表失败');
          this.warningList = [];
          this.total = 0;
        }
        this.loading = false;
      }).catch(err => {
        console.error('加载预警列表失败:', err);
        this.$message.error('网络请求失败');
        this.warningList = [];
        this.total = 0;
        this.loading = false;
      });
    },



    // 获取预警类型标签样式
    getWarningTypeTag(type) {
      const tagMap = {
        '吸烟监测': 'danger',
        '渔船监测': 'warning',
        '人员检测': 'primary'
      };
      return tagMap[type] || 'info';
    },

    // 获取状态标签样式
    getStatusTypeTag(status) {
      const tagMap = {
        '未处理': 'danger',
        '已处理': 'success',
        '已确认': 'info'
      };
      return tagMap[status] || 'info';
    },

    // 获取检测框样式
    getDetectionBoxStyle(box) {
      if (!box) return {};
      return {
        left: `${box.x}px`,
        top: `${box.y}px`,
        width: `${box.width}px`,
        height: `${box.height}px`
      };
    },

    // 图片点击
    handleImageClick(item) {
      console.log('查看图片:', item);
      // 这里可以打开大图预览
    },

    // 查看详情
    handleViewDetail(item) {
      console.log('查看详情:', item);
      this.selectedWarning = item;
      this.detailDialogVisible = true;
    },

    // 标记为已读
    handleMarkAsRead() {
      if (!this.selectedWarning) return;

      this.selectedWarning.readStatus = '已读';
      // 更新列表中对应的项
      const index = this.warningList.findIndex(w => w.id === this.selectedWarning.id);
      if (index !== -1) {
        this.$set(this.warningList, index, { ...this.selectedWarning });
      }

      this.$message({
        message: '已标记为已读',
        type: 'success'
      });
      this.detailDialogVisible = false;
    },

    // 标记处理
    handleMarkProcessed(item) {
      console.log('标记处理:', item);
      this.$message({
        message: `已标记预警为已处理：${item.cameraName}`,
        type: 'success'
      });
      // 更新状态
      item.status = '已处理';
    },

    // 删除
    handleDelete(item) {
      console.log('删除:', item);
      this.$confirm(`确定删除预警记录：${item.cameraName} - ${item.warningType}？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message({
          message: '删除成功',
          type: 'success'
        });
        // 从列表中移除
        this.warningList = this.warningList.filter(w => w.id !== item.id);
        this.total--;
      }).catch(() => {
        // 取消删除
      });
    },

    // 分页大小变化
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.currentPage = 1;
      this.loadWarningList();
    },

    // 当前页变化
    handleCurrentChange(val) {
      this.pagination.currentPage = val;
      this.loadWarningList();
    }
  }
};
</script>

<style lang="scss" scoped>
.analysis-warning {
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  .page-header {
    margin-bottom: 20px;

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
  }

  .content-wrapper {
    flex: 1;
    display: flex;
    gap: 20px;
    overflow: hidden;

    .filter-panel {
      width: 280px;
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;

      .filter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;

        .filter-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0;
          padding: 0;
          border: none;
          flex-grow: 1;
        }

        .filter-actions {
          display: flex;
          gap: 5px;

          .el-button {
            flex: none;
            padding: 7px 10px;
            font-size: 13px;
          }
        }
      }

      .filter-section {
        margin-bottom: 24px;

        .filter-label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }

        .time-range {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .time-input {
            display: flex;
            flex-direction: column;
            gap: 6px;

            .time-label {
              font-size: 13px;
              color: #666;
            }
          }
        }

        .type-checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 12px;

          ::v-deep .el-checkbox-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-left: 20px;
          }
        }
      }


    }

    .result-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #eee;

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;

          .camera-filter {
            display: flex;
            align-items: center;
            gap: 8px;

            .filter-label {
              font-size: 14px;
              color: #333;
              font-weight: 500;
            }
          }
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;

          .result-count {
            font-size: 14px;
            color: #333;
            font-weight: 500;
          }

          .result-actions {
            display: flex;
            gap: 8px;
          }
        }
      }

      .result-list {
        flex: 1;
        overflow-y: auto;
        padding: 20px;

        .loading-container,
        .empty-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #999;
          font-size: 16px;

          i {
            font-size: 48px;
            margin-bottom: 16px;
          }
        }

        .warning-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;

          .warning-card {
            border: 1px solid #e4e7ed;
            border-radius: 8px;
            background: #fff;
            overflow: hidden;
            transition: all 0.3s;
            cursor: pointer;

            &:hover {
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              transform: translateY(-2px);
            }

            .card-image {
              position: relative;
              height: 160px;
              overflow: hidden;

              .image-container {
                width: 100%;
                height: 100%;
                position: relative;

                img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  transition: transform 0.3s;
                }

                .detection-box {
                  position: absolute;
                  border: 2px solid #f56c6c;
                  background: rgba(245, 108, 108, 0.1);
                  pointer-events: none;
                }
              }

              .image-overlay {
                position: absolute;
                top: 12px;
                right: 12px;

                .type-tag {
                  font-size: 12px;
                  padding: 2px 8px;
                  border-radius: 10px;
                }
              }
            }

            .card-content {
              padding: 12px;
              display: flex;
              flex-direction: column;
              gap: 8px;

              .camera-info {
                display: flex;
                align-items: center;
                gap: 6px;

                i {
                  color: #409eff;
                  font-size: 14px;
                }

                .camera-name {
                  font-weight: 600;
                  color: #333;
                  font-size: 14px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
              }

              .warning-time {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #666;
                font-size: 12px;

                i {
                  font-size: 12px;
                }
              }

              .warning-status {
                display: flex;
                align-items: center;
                justify-content: space-between;

                .el-tag {
                  font-size: 11px;
                  padding: 1px 6px;
                  height: 20px;
                  line-height: 18px;
                }

                .confidence {
                  font-size: 12px;
                  color: #f56c6c;
                  font-weight: 500;
                }
              }

              .warning-position {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #999;
                font-size: 12px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;

                i {
                  font-size: 12px;
                }
              }
            }
          }
        }
      }

      .pagination-container {
        padding: 16px 20px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
      }
    }
  }

  /* 详情弹窗样式 */
  .detail-dialog {
    display: flex;
    gap: 30px;

    .detail-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .detail-item {
        display: flex;
        align-items: flex-start;

        .detail-label {
          width: 120px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .detail-value {
          flex: 1;
          color: #666;
          font-size: 14px;
        }
      }
    }

    .detail-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .detail-image {
        position: relative;
        width: 100%;
        height: 300px;
        border-radius: 8px;
        overflow: hidden;
        background: #f5f5f5;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .detail-detection-box {
          position: absolute;
          border: 2px solid #f56c6c;
          background: rgba(245, 108, 108, 0.1);
          pointer-events: none;
        }
      }

      .image-remark {
        padding: 12px;
        background: #f9f9f9;
        border-radius: 6px;
        font-size: 14px;

        label {
          font-weight: 600;
          color: #333;
          margin-right: 8px;
        }

        span {
          color: #666;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>
