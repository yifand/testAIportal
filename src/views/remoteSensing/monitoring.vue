<template>
  <div class="monitoring-page">
    <div class="page-head">
      <h2>遥感监测</h2>
      <p class="hint">选择监测影像进行浏览，开启卷帘后可对比两期影像并同步缩放</p>
    </div>

    <div class="main-layout">
      <div class="result-list panel">
        <div class="panel-title">监测影像</div>
        <el-input v-model="keyword" placeholder="搜索区域/任务" size="small" clearable class="search"
          @keyup.enter.native="filterList" />
        <div class="list-body">
          <div v-for="item in filteredList" :key="item.id"
            :class="['list-item', { active: selectedId === item.id }]"
            @click="selectItem(item.id)">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-sub">{{ item.dateBefore }} / {{ item.dateAfter }}</div>
          </div>
          <el-empty v-if="!filteredList.length" description="暂无监测影像" :image-size="56" />
        </div>
      </div>

      <div class="viewer panel">
        <div class="viewer-toolbar">
          <div class="time-tags">
            <el-tag size="small" type="info">T1 前期：{{ currentLabel.dateBefore }}</el-tag>
            <el-tag size="small" type="warning">T2 后期：{{ currentLabel.dateAfter }}</el-tag>
          </div>
          <div class="toolbar-actions">
            <el-button size="small" :type="swipeEnabled ? 'primary' : 'default'" @click="toggleSwipe"
              :icon="swipeEnabled ? 'el-icon-check' : 'el-icon-crop'">
              {{ swipeEnabled ? '关闭卷帘' : '打开卷帘' }}
            </el-button>
            <el-button-group>
              <el-button size="small" icon="el-icon-zoom-in" @click="zoomIn">放大</el-button>
              <el-button size="small" icon="el-icon-zoom-out" @click="zoomOut">缩小</el-button>
              <el-button size="small" icon="el-icon-refresh" @click="resetView">重置</el-button>
            </el-button-group>
          </div>
        </div>

        <div class="viewer-body">
          <div class="image-viewer" ref="viewer"
            @wheel.prevent="onWheel"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
            @touchstart="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend="onMouseUp">

            <!-- 单图模式 -->
            <template v-if="!swipeEnabled">
              <img class="viewer-image" :src="currentPair.imageAfter" :alt="currentPair.name"
                :style="imageStyle" draggable="false" />
            </template>

            <!-- 卷帘模式：两张图重叠，顶层通过裁剪容器限定显示区域 -->
            <template v-else>
              <img class="viewer-image back" :src="currentPair.imageAfter" :alt="currentPair.name + ' T2'"
                :style="imageStyle" draggable="false" />
              <div class="clip-container" :style="{ width: dividerPercent + '%' }"
                @mousedown="onDividerMouseDown"
                @touchstart.prevent="onDividerTouchStart"
                @touchmove.prevent="onDividerTouchMove"
                @touchend="onDividerMouseUp"
                @touchcancel="onDividerMouseUp">
                <img class="viewer-image front" :src="currentPair.imageBefore" :alt="currentPair.name + ' T1'"
                  :style="imageStyle" draggable="false" />
              </div>

              <!-- 分割线及手柄 -->
              <div class="swipe-divider" :style="{ left: dividerPercent + '%' }"
                @mousedown="onDividerMouseDown"
                @touchstart.prevent="onDividerTouchStart"
                @touchmove.prevent="onDividerTouchMove"
                @touchend="onDividerMouseUp"
                @touchcancel="onDividerMouseUp">
                <span class="divider-line"></span>
                <span class="divider-knob">
                  <i class="el-icon-d-caret"></i>
                </span>
              </div>
            </template>

            <div class="viewer-status">
              <span>缩放：{{ (scale * 100).toFixed(0) }}%</span>
              <span v-if="swipeEnabled">卷帘：{{ dividerPercent.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const TEST_IMAGES = [
  {
    id: 1,
    name: "测试区域 A",
    dateBefore: "2024-01-15",
    dateAfter: "2024-07-20",
    imageBefore: "/test/test1.png",
    imageAfter: "/test/test21.png",
  },
  {
    id: 2,
    name: "测试区域 B",
    dateBefore: "2023-09-10",
    dateAfter: "2024-03-12",
    imageBefore: "/test/test11.png",
    imageAfter: "/test/test32.png",
  },
  {
    id: 3,
    name: "测试区域 C",
    dateBefore: "2023-06-05",
    dateAfter: "2024-01-08",
    imageBefore: "/test/test16.png",
    imageAfter: "/test/test22.png",
  },
  {
    id: 4,
    name: "测试区域 D",
    dateBefore: "2023-11-22",
    dateAfter: "2024-05-30",
    imageBefore: "/test/test9.png",
    imageAfter: "/test/test1.png",
  },
];

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;

export default {
  name: "RemoteSensingMonitoring",
  data() {
    return {
      imageList: TEST_IMAGES,
      selectedId: TEST_IMAGES[0].id,
      keyword: "",
      swipeEnabled: false,
      scale: 1,
      translateX: 0,
      translateY: 0,
      dividerPercent: 50,
      isPanning: false,
      isDraggingDivider: false,
      lastMouseX: 0,
      lastMouseY: 0,
      panStartTranslateX: 0,
      panStartTranslateY: 0,
    };
  },
  computed: {
    filteredList() {
      if (!this.keyword) return this.imageList;
      const key = this.keyword.toLowerCase();
      return this.imageList.filter(
        (item) =>
          item.name.toLowerCase().includes(key) ||
          item.dateBefore.includes(key) ||
          item.dateAfter.includes(key)
      );
    },
    currentPair() {
      return (
        this.imageList.find((item) => item.id === this.selectedId) ||
        this.imageList[0]
      );
    },
    currentLabel() {
      const pair = this.currentPair;
      return {
        dateBefore: pair ? pair.dateBefore : "-",
        dateAfter: pair ? pair.dateAfter : "-",
      };
    },
    imageStyle() {
      return {
        transform: `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`,
        transformOrigin: "0 0",
      };
    },
    frontImageStyle() {
      return {
        transform: `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`,
        transformOrigin: "0 0",
      };
    },
  },
  methods: {
    filterList() {
      // 搜索仅过滤列表，无需额外逻辑
    },
    selectItem(id) {
      this.selectedId = id;
    },
    toggleSwipe() {
      this.swipeEnabled = !this.swipeEnabled;
      if (!this.swipeEnabled) {
        this.dividerPercent = 50;
      }
    },
    zoomIn() {
      this.applyZoom(this.scale * 1.25, null, null);
    },
    zoomOut() {
      this.applyZoom(this.scale * 0.8, null, null);
    },
    resetView() {
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;
      this.dividerPercent = 50;
    },
    onWheel(e) {
      const viewer = this.$refs.viewer;
      if (!viewer) return;
      const rect = viewer.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const direction = e.deltaY > 0 ? -1 : 1;
      const factor = direction > 0 ? 1.15 : 0.87;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.scale * factor));
      this.applyZoom(newScale, mx, my);
    },
    applyZoom(newScale, mx, my) {
      const viewer = this.$refs.viewer;
      if (!viewer) return;
      const rect = viewer.getBoundingClientRect();
      if (mx == null) mx = rect.width / 2;
      if (my == null) my = rect.height / 2;

      const oldScale = this.scale;
      // 保持鼠标/中心点所在图像位置不变
      this.translateX = mx - (mx - this.translateX) * (newScale / oldScale);
      this.translateY = my - (my - this.translateY) * (newScale / oldScale);
      this.scale = newScale;
    },
    onMouseDown(e) {
      const target = e.target;
      // 点击分割线开始拖动卷帘
      if (target && target.closest && target.closest(".swipe-divider")) {
        e.preventDefault();
        e.stopPropagation();
        this.isDraggingDivider = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        return;
      }
      // 点击图片区域开始平移
      if (target && target.closest && target.closest(".viewer-image")) {
        this.isPanning = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.panStartTranslateX = this.translateX;
        this.panStartTranslateY = this.translateY;
      }
    },
    onMouseMove(e) {
      if (this.isDraggingDivider) return;
      if (this.isPanning) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.translateX = this.panStartTranslateX + dx;
        this.translateY = this.panStartTranslateY + dy;
      }
    },
    onMouseUp() {
      this.isPanning = false;
      this.isDraggingDivider = false;
      // 释放时同步起始位置，避免下次拖拽跳动
      this.panStartTranslateX = this.translateX;
      this.panStartTranslateY = this.translateY;
    },
    onDividerMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();
      this.isDraggingDivider = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      window.addEventListener("mousemove", this.onDividerMouseMove);
      window.addEventListener("mouseup", this.onDividerMouseUp);
    },
    onDividerMouseMove(e) {
      if (!this.isDraggingDivider) return;
      e.preventDefault();
      const viewer = this.$refs.viewer;
      if (!viewer) return;
      const rect = viewer.getBoundingClientRect();
      const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
      this.dividerPercent = (x / rect.width) * 100;
    },
    onDividerMouseUp(e) {
      this.isDraggingDivider = false;
      window.removeEventListener("mousemove", this.onDividerMouseMove);
      window.removeEventListener("mouseup", this.onDividerMouseUp);
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    onDividerTouchStart(e) {
      if (!e.touches || !e.touches[0]) return;
      e.preventDefault();
      e.stopPropagation();
      this.isDraggingDivider = true;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
      window.addEventListener("touchmove", this.onDividerTouchMove, { passive: false });
      window.addEventListener("touchend", this.onDividerTouchEnd);
      window.addEventListener("touchcancel", this.onDividerTouchEnd);
    },
    onDividerTouchMove(e) {
      if (!this.isDraggingDivider || !e.touches || !e.touches[0]) return;
      e.preventDefault();
      const viewer = this.$refs.viewer;
      if (!viewer) return;
      const rect = viewer.getBoundingClientRect();
      const x = Math.min(Math.max(e.touches[0].clientX - rect.left, 0), rect.width);
      this.dividerPercent = (x / rect.width) * 100;
    },
    onDividerTouchEnd(e) {
      this.isDraggingDivider = false;
      window.removeEventListener("touchmove", this.onDividerTouchMove, { passive: false });
      window.removeEventListener("touchend", this.onDividerTouchEnd);
      window.removeEventListener("touchcancel", this.onDividerTouchEnd);
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    onTouchStart(e) {
      if (!e.touches || !e.touches[0]) return;
      const touch = e.touches[0];
      const viewer = this.$refs.viewer;
      if (!viewer) return;
      const rect = viewer.getBoundingClientRect();
      const mx = touch.clientX - rect.left;
      const my = touch.clientY - rect.top;
      // 判断是否点在分割线附近（触摸宽容 24px）
      const dividerX = (this.dividerPercent / 100) * rect.width;
      if (this.swipeEnabled && Math.abs(mx - dividerX) < 24) {
        this.isDraggingDivider = true;
        this.lastMouseX = touch.clientX;
        this.lastMouseY = touch.clientY;
        return;
      }
      this.isPanning = true;
      this.lastMouseX = touch.clientX;
      this.lastMouseY = touch.clientY;
      this.panStartTranslateX = this.translateX;
      this.panStartTranslateY = this.translateY;
    },
    onTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      const touch = e.touches[0];
      if (this.isDraggingDivider) {
        const viewer = this.$refs.viewer;
        if (!viewer) return;
        const rect = viewer.getBoundingClientRect();
        const x = Math.min(Math.max(touch.clientX - rect.left, 0), rect.width);
        this.dividerPercent = (x / rect.width) * 100;
        return;
      }
      if (this.isPanning) {
        const dx = touch.clientX - this.lastMouseX;
        const dy = touch.clientY - this.lastMouseY;
        this.translateX = this.panStartTranslateX + dx;
        this.translateY = this.panStartTranslateY + dy;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.monitoring-page {
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
}
.page-head {
  margin-bottom: 16px;
  h2 {
    margin: 0 0 6px;
    font-size: 18px;
  }
  .hint {
    margin: 0;
    color: #909399;
    font-size: 13px;
  }
}
.main-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  min-height: 520px;
  height: calc(100% - 70px);
}
.panel {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 10px;
}
.search {
  margin-bottom: 10px;
}
.list-body {
  flex: 1;
  overflow-y: auto;
}
.list-item {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  &:hover,
  &.active {
    border-color: #409eff;
    background: #f5f9ff;
  }
}
.item-name {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
.item-sub {
  font-size: 12px;
  color: #606266;
}
.viewer {
  position: relative;
}
.viewer-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.time-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.viewer-body {
  flex: 1;
  position: relative;
  min-height: 0;
}
.image-viewer {
  position: absolute;
  inset: 0;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  &:active {
    cursor: grabbing;
  }
}
.viewer-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: auto;
  &.front,
  &.back {
    z-index: auto;
  }
}
.clip-container {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  overflow: hidden;
  z-index: 2;
  pointer-events: none;
}
.clip-container .viewer-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.swipe-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 24px;
  transform: translateX(-50%);
  z-index: 100;
  cursor: ew-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  touch-action: none;
}
.swipe-divider::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  z-index: -1;
  background: transparent;
  pointer-events: auto;
}
.divider-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 3px;
  transform: translateX(-50%);
  background: #fff;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
.divider-knob {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  font-size: 12px;
  pointer-events: none;
  z-index: 101;
}
.viewer-status {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 4;
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 10px;
  border-radius: 4px;
  pointer-events: none;
}
@media (max-width: 960px) {
  .main-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
  .viewer-body {
    min-height: 360px;
  }
}
</style>
