<template>
  <div class="viz-page">
    <div class="overview-row" v-loading="loadingOverview">
      <div class="ov-card" v-for="item in overviewItems" :key="item.label">
        <div class="ov-label">{{ item.label }}</div>
        <div class="ov-value">{{ item.value }}</div>
      </div>
    </div>

    <div class="main-row">
      <div class="chart-panel">
        <div class="panel-head">
          <h3>地物分类统计</h3>
          <el-select v-model="selectedResultId" placeholder="选择成果" size="small" clearable @change="loadChart">
            <el-option v-for="r in resultOptions" :key="r.id"
              :label="`${r.taskName} / ${r.imageName}`" :value="r.id" />
          </el-select>
        </div>
        <div ref="pieChart" class="chart-box"></div>
        <div ref="barChart" class="chart-box bar"></div>
      </div>

      <div class="result-panel table-card">
        <div class="panel-head">
          <h3>解译成果列表</h3>
          <el-input v-model="query.imageName" placeholder="影像名" size="small" clearable class="search"
            @keyup.enter.native="reload" />
        </div>
        <el-table :data="tableData" stripe size="small" v-loading="loading" highlight-current-row
          @current-change="onResultSelect">
          <el-table-column prop="taskName" label="任务" min-width="100" show-overflow-tooltip />
          <el-table-column prop="imageName" label="影像" min-width="120" show-overflow-tooltip />
          <el-table-column prop="modelName" label="模型" min-width="100" show-overflow-tooltip />
          <el-table-column prop="targetCount" label="目标数" width="70" align="right" />
          <el-table-column label="面积(㎡)" width="100" align="right">
            <template slot-scope="scope">{{ formatArea(scope.row.statisticArea) }}</template>
          </el-table-column>
          <el-table-column label="成果路径" min-width="140" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.previewPng || scope.row.resultTif || "-" }}</template>
          </el-table-column>
          <template slot="empty"><el-empty description="暂无解译成果，请先执行解译任务并同步状态" :image-size="60" /></template>
        </el-table>
        <div class="pager" v-if="total > 0">
          <el-pagination small layout="total, prev, pager, next" :total="total"
            :page-size="query.pageSize" :current-page.sync="query.pageNum" @current-change="loadList" />
        </div>
      </div>
    </div>

    <div class="map-panel">
      <div class="panel-head"><h3>影像覆盖范围示意</h3></div>
      <div class="fake-map">
        <div class="map-grid"></div>
        <div class="map-legend">
          <span v-for="(c, idx) in classStats" :key="c.classKey">
            <i :style="{ background: chartColor(c, idx) }"></i>{{ c.className }} {{ c.percent }}%
          </span>
        </div>
        <p class="map-hint">示意面板：对接 GeoServer / 地图 SDK 后可叠加 TIFF 与解译矢量图层</p>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import {
  fetchVisualizationOverview, fetchVisualizationResults, fetchClassStatistics,
} from "@/api/rsVisualization";

const CLASS_CHART_COLORS = ["#f5222d", "#fa8c16", "#52c41a", "#1890ff", "#8c8c8c"];

export default {
  name: "RemoteSensingVisualization",
  data() {
    return {
      loading: false,
      loadingOverview: false,
      overview: {},
      tableData: [],
      total: 0,
      query: { imageName: "", pageNum: 1, pageSize: 8 },
      classStats: [],
      selectedResultId: null,
      pieInst: null,
      barInst: null,
    };
  },
  computed: {
    overviewItems() {
      const o = this.overview || {};
      return [
        { label: "成果总数", value: o.resultCount || 0 },
        { label: "地物类别", value: o.classCount || 5 },
        { label: "支持识别", value: (o.supportedClasses || []).join("、") || "-" },
      ];
    },
    resultOptions() {
      return this.tableData;
    },
  },
  created() {
    this.bootstrap();
  },
  mounted() {
    this.initCharts();
    window.addEventListener("resize", this.resizeCharts);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeCharts);
    if (this.pieInst) this.pieInst.dispose();
    if (this.barInst) this.barInst.dispose();
  },
  methods: {
    async bootstrap() {
      this.loadingOverview = true;
      try {
        const res = await fetchVisualizationOverview();
        if (res && res.code === 200) this.overview = res.data || {};
      } finally {
        this.loadingOverview = false;
      }
      await this.loadList();
      this.loadChart();
    },
    initCharts() {
      if (this.$refs.pieChart) this.pieInst = echarts.init(this.$refs.pieChart);
      if (this.$refs.barChart) this.barInst = echarts.init(this.$refs.barChart);
    },
    resizeCharts() {
      if (this.pieInst) this.pieInst.resize();
      if (this.barInst) this.barInst.resize();
    },
    async loadList() {
      this.loading = true;
      try {
        const res = await fetchVisualizationResults({
          imageName: this.query.imageName || undefined,
          pageNum: this.query.pageNum,
          pageSize: this.query.pageSize,
        });
        if (res && res.code === 200 && res.data) {
          this.tableData = res.data.records || [];
          this.total = res.data.total || 0;
          if (!this.selectedResultId && this.tableData.length) {
            this.selectedResultId = this.tableData[0].id;
          }
        }
      } finally {
        this.loading = false;
      }
    },
    reload() {
      this.query.pageNum = 1;
      this.loadList();
    },
    onResultSelect(row) {
      if (row) {
        this.selectedResultId = row.id;
        this.loadChart();
      }
    },
    async loadChart() {
      const res = await fetchClassStatistics({
        resultId: this.selectedResultId || undefined,
      });
      if (res && res.code === 200) {
        this.classStats = res.data || [];
        this.renderCharts();
      }
    },
    renderCharts() {
      const data = this.classStats || [];
      if (this.pieInst) {
        this.pieInst.setOption({
          tooltip: { trigger: "item", formatter: "{b}: {c}㎡ ({d}%)" },
          legend: { bottom: 0 },
          series: [{
            type: "pie", radius: ["40%", "65%"],
            data: data.map((d, i) => ({
              name: d.className,
              value: d.areaSqm,
              itemStyle: { color: this.chartColor(d, i) },
            })),
          }],
        });
      }
      if (this.barInst) {
        this.barInst.setOption({
          tooltip: { trigger: "axis" },
          grid: { left: 50, right: 20, top: 20, bottom: 40 },
          xAxis: { type: "category", data: data.map((d) => d.className) },
          yAxis: { type: "value", name: "面积(㎡)" },
          series: [{
            type: "bar",
            data: data.map((d, i) => ({
              value: d.areaSqm,
              itemStyle: { color: this.chartColor(d, i) },
            })),
          }],
        });
      }
    },
    chartColor(item, index) {
      return CLASS_CHART_COLORS[index % CLASS_CHART_COLORS.length];
    },
    formatArea(v) {
      if (v == null) return "-";
      return Number(v).toLocaleString();
    },
  },
};
</script>

<style lang="scss" scoped>
.viz-page { padding: 16px; }
.overview-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
.ov-card { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.ov-label { font-size: 13px; color: #666; margin-bottom: 6px; }
.ov-value { font-size: 18px; font-weight: 600; }
.main-row { display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; margin-bottom: 16px; }
.chart-panel, .result-panel, .map-panel { background: #fff; border-radius: 8px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
  h3 { margin: 0; font-size: 15px; } .search { width: 140px; } }
.chart-box { height: 220px; }
.chart-box.bar { height: 200px; }
.pager { margin-top: 10px; text-align: right; }
.fake-map { position: relative; height: 200px; background: linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 50%, #1a2a4a 100%);
  border-radius: 6px; overflow: hidden; }
.map-grid { position: absolute; inset: 0;
  background-image: linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
  background-size: 40px 40px; }
.map-legend { position: absolute; bottom: 12px; left: 12px; display: flex; flex-wrap: wrap; gap: 10px;
  span { font-size: 12px; color: #fff; display: flex; align-items: center; gap: 4px;
    i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; } } }
.map-hint { position: absolute; top: 12px; right: 12px; font-size: 12px; color: rgba(255,255,255,.7); margin: 0; }
@media (max-width: 1100px) {
  .overview-row { grid-template-columns: 1fr; }
  .main-row { grid-template-columns: 1fr; }
}
</style>
