<template>
  <div class="change-page">
    <div class="page-head">
      <h2>变化对比浏览</h2>
      <p class="hint">选择已完成的变化检测成果，通过卷帘或分屏对比两期影像及变化高亮层</p>
    </div>

    <div class="main-layout" v-loading="loadingList">
      <div class="result-list panel">
        <div class="panel-title">变化检测成果</div>
        <el-input v-model="keyword" placeholder="任务名称" size="small" clearable class="search"
          @keyup.enter.native="reloadList" />
        <div class="list-body">
          <div v-for="item in resultList" :key="item.resultId"
            :class="['list-item', { active: selectedId === item.resultId }]"
            @click="selectResult(item.resultId)">
            <div class="item-name">{{ item.taskName }}</div>
            <div class="item-sub">{{ item.imageBeforeName }} → {{ item.imageAfterName }}</div>
            <div class="item-meta">{{ item.modelName }} · {{ formatTime(item.createTime) }}</div>
          </div>
          <el-empty v-if="!resultList.length" description="暂无变化检测成果" :image-size="56" />
        </div>
        <div class="pager" v-if="total > query.pageSize">
          <el-pagination small layout="prev, pager, next" :total="total"
            :page-size="query.pageSize" :current-page.sync="query.pageNum" @current-change="loadList" />
        </div>
      </div>

      <div class="viewer panel" v-loading="loadingDetail">
        <template v-if="detail">
          <div class="viewer-toolbar">
            <div class="time-tags">
              <el-tag size="small" type="info">前期 T1：{{ imageLabel(detail.imageBefore) }}</el-tag>
              <el-tag size="small" type="warning">后期 T2：{{ imageLabel(detail.imageAfter) }}</el-tag>
            </div>
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="swipe">卷帘对比</el-radio-button>
              <el-radio-button label="split">左右分屏</el-radio-button>
              <el-radio-button label="change">变化高亮</el-radio-button>
            </el-radio-group>
          </div>

          <div v-show="viewMode === 'swipe'" class="swipe-box" ref="swipeBox"
            @mousemove="onSwipeMove" @touchmove.prevent="onSwipeTouch">
            <div class="swipe-layer back" :style="layerStyle(detail.previewT2Png, 'T2 后期')"></div>
            <div class="swipe-layer front" :style="frontClipStyle">
              <div class="swipe-inner" :style="layerStyle(detail.previewT1Png, 'T1 前期')"></div>
            </div>
            <div class="swipe-handle" :style="{ left: swipePercent + '%' }">
              <span class="handle-line"></span>
              <span class="handle-knob"></span>
            </div>
            <div class="swipe-label left">T1 前期</div>
            <div class="swipe-label right">T2 后期</div>
          </div>

          <div v-show="viewMode === 'split'" class="split-box">
            <div class="split-pane" :style="layerStyle(detail.previewT1Png, 'T1 前期')">
              <span class="pane-label">T1 前期</span>
            </div>
            <div class="split-pane" :style="layerStyle(detail.previewT2Png, 'T2 后期')">
              <span class="pane-label">T2 后期</span>
            </div>
          </div>

          <div v-show="viewMode === 'change'" class="change-box"
            :style="layerStyle(detail.changePreviewPng, '变化高亮层')">
            <span class="pane-label">变化高亮（道路损坏 / 违章侵占 / 砍伐 / 农田侵占等）</span>
          </div>

          <div class="stats-section">
            <div class="panel-title">变化统计</div>
            <el-table :data="detail.changes || []" size="small" stripe>
              <el-table-column prop="changeType" label="变化类型" min-width="110" />
              <el-table-column prop="fromClass" label="变化前" width="80" />
              <el-table-column prop="toClass" label="变化后" width="80" />
              <el-table-column label="面积(㎡)" width="110" align="right">
                <template slot-scope="scope">{{ formatArea(scope.row.areaSqm) }}</template>
              </el-table-column>
              <el-table-column prop="patchCount" label="图斑数" width="72" align="center" />
            </el-table>
          </div>
        </template>
        <el-empty v-else description="请从左侧选择变化检测成果" />
      </div>
    </div>
  </div>
</template>

<script>
import { fetchChangeResults, fetchChangeResultDetail } from "@/api/rsVisualization";

const PLACEHOLDER_GRADIENTS = {
  T1: "linear-gradient(135deg, #2c5364 0%, #203a43 50%, #0f2027 100%)",
  T2: "linear-gradient(135deg, #3a6186 0%, #89253e 100%)",
  CHANGE: "linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)",
};

export default {
  name: "RemoteChangeCompare",
  data() {
    return {
      loadingList: false,
      loadingDetail: false,
      keyword: "",
      resultList: [],
      total: 0,
      query: { pageNum: 1, pageSize: 10 },
      prefetchTaskId: null,
      selectedId: null,
      detail: null,
      viewMode: "swipe",
      swipePercent: 50,
    };
  },
  computed: {
    frontClipStyle() {
      return { clipPath: `inset(0 ${100 - this.swipePercent}% 0 0)` };
    },
  },
  created() {
    const qid = this.$route.query.resultId;
    const taskId = this.$route.query.taskId;
    if (qid) this.selectedId = Number(qid);
    this.prefetchTaskId = taskId ? Number(taskId) : null;
    this.loadList();
  },
  methods: {
    async loadList() {
      this.loadingList = true;
      try {
        const res = await fetchChangeResults({
          taskName: this.keyword || undefined,
          taskId: this.prefetchTaskId || undefined,
          pageNum: this.query.pageNum,
          pageSize: this.query.pageSize,
        });
        if (res && res.code === 200 && res.data) {
          this.resultList = res.data.records || [];
          this.total = res.data.total || 0;
          this.prefetchTaskId = null;
          if (!this.selectedId && this.resultList.length) {
            this.selectedId = this.resultList[0].resultId;
          }
          if (this.selectedId) this.loadDetail(this.selectedId);
        }
      } finally {
        this.loadingList = false;
      }
    },
    reloadList() {
      this.query.pageNum = 1;
      this.loadList();
    },
    selectResult(id) {
      this.selectedId = id;
      this.loadDetail(id);
    },
    async loadDetail(id) {
      this.loadingDetail = true;
      try {
        const res = await fetchChangeResultDetail(id);
        if (res && res.code === 200) {
          this.detail = res.data;
        } else {
          this.detail = null;
        }
      } finally {
        this.loadingDetail = false;
      }
    },
    layerStyle(path, label) {
      const kind = label.indexOf("T1") === 0 ? "T1" : label.indexOf("T2") === 0 ? "T2" : "CHANGE";
      const bg = PLACEHOLDER_GRADIENTS[kind];
      if (path && /^https?:\/\//i.test(path)) {
        return {
          backgroundImage: `url(${path})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };
      }
      return {
        background: bg,
      };
    },
    onSwipeMove(e) {
      const box = this.$refs.swipeBox;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
      this.swipePercent = (x / rect.width) * 100;
    },
    onSwipeTouch(e) {
      if (!e.touches || !e.touches[0]) return;
      const box = this.$refs.swipeBox;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const x = Math.min(Math.max(e.touches[0].clientX - rect.left, 0), rect.width);
      this.swipePercent = (x / rect.width) * 100;
    },
    imageLabel(img) {
      if (!img) return "-";
      const t = img.shootTime ? String(img.shootTime).slice(0, 10) : "";
      return t ? `${img.imageName}（${t}）` : img.imageName;
    },
    formatTime(t) {
      if (!t) return "-";
      return String(t).replace("T", " ").slice(0, 16);
    },
    formatArea(v) {
      if (v == null) return "-";
      return Number(v).toLocaleString();
    },
  },
};
</script>

<style lang="scss" scoped>
.change-page {
  padding: 16px;
}
.page-head {
  margin-bottom: 16px;
  h2 { margin: 0 0 6px; font-size: 18px; }
  .hint { margin: 0; color: #909399; font-size: 13px; }
}
.main-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  min-height: 520px;
}
.panel {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.panel-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 10px;
}
.search { margin-bottom: 10px; }
.list-body { max-height: 420px; overflow-y: auto; }
.list-item {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
  &:hover, &.active { border-color: #409eff; background: #f5f9ff; }
}
.item-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.item-sub { font-size: 12px; color: #606266; margin-bottom: 2px; }
.item-meta { font-size: 11px; color: #909399; }
.pager { margin-top: 8px; text-align: right; }
.viewer-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.time-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.swipe-box, .split-box, .change-box {
  position: relative;
  height: 360px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  margin-bottom: 16px;
}
.swipe-box { cursor: ew-resize; user-select: none; }
.swipe-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
.swipe-layer.front { z-index: 2; }
.swipe-inner { width: 100%; height: 100%; }
.swipe-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  transform: translateX(-50%);
  pointer-events: none;
}
.handle-line {
  display: block;
  width: 3px;
  height: 100%;
  background: #fff;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.45);
  margin: 0 auto;
}
.handle-knob {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.swipe-label {
  position: absolute;
  top: 10px;
  z-index: 4;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  padding: 2px 8px;
  border-radius: 4px;
  &.left { left: 10px; }
  &.right { right: 10px; }
}
.split-box { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: #dcdfe6; }
.split-pane, .change-box {
  background-size: cover;
  background-position: center;
  position: relative;
}
.pane-label {
  position: absolute;
  left: 10px;
  top: 10px;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 8px;
  border-radius: 4px;
}
.stats-section { margin-top: 4px; }
@media (max-width: 960px) {
  .main-layout { grid-template-columns: 1fr; }
}
</style>
