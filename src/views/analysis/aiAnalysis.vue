<template>
    <div class="container">
        <div class="main-wrapper card">
            <div class="page-title">AI 智能分析</div>
            <div class="chart-row">
                <div class="chart-card">
                    <div class="chart-title">PCI 等级统计</div>
                    <div ref="pciChart" class="chart-dom"></div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">
                        资产统计
                        <span class="chart-total">总数：{{ assetData.total || 0 }}</span>
                    </div>
                    <div ref="assetChart" class="chart-dom"></div>
                </div>
            </div>
            <div class="chart-row time-filter-row">
                <div class="filter-bar">
                    <span class="filter-label">时间筛选</span>
                    <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至" size="small"
                        start-placeholder="开始" end-placeholder="结束" value-format="yyyy-MM-dd HH:mm:ss"
                        class="f-item wide" @change="handleTimeSearch" />

                </div>
            </div>
            <div class="chart-row">
                <div class="chart-card">
                    <div class="chart-title">
                        病害统计
                        <span class="chart-total">总数：{{ diseaseData.total || 0 }}</span>
                    </div>
                    <div ref="diseaseChart" class="chart-dom"></div>
                </div>
                <div class="chart-card">
                    <div class="chart-title">
                        异常事件统计
                        <span class="chart-total">总数：{{ abnormalData.total || 0 }}</span>
                    </div>
                    <div ref="abnormalChart" class="chart-dom"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import * as echarts from "echarts";
import {
    getPciStatistics,
    getAssetStatistics,
    getDiseaseStatistics,
    getAbnormalEventStatistics
} from "@/api/analysis";

export default {
    name: "AiAnalysis",
    data() {
        return {
            pciChart: null,
            assetChart: null,
            diseaseChart: null,
            abnormalChart: null,
            pciTotalCount: 0,
            pciLevels: [],
            assetData: {},
            diseaseData: {},
            abnormalData: {},
            dateRange: []
        };
    },
    mounted() {
        this.initTimeFilter();
        this.$nextTick(() => {
            this.initPciChart();
            this.initAssetChart();
            this.initDiseaseChart();
            this.initAbnormalChart();
        });
        this.loadPciStatistics();
        this.loadAssetStatistics();
        this.loadDiseaseStatistics();
        this.loadAbnormalEventStatistics();
        this.resizeHandler = () => {
            this.pciChart && this.pciChart.resize();
            this.assetChart && this.assetChart.resize();
            this.diseaseChart && this.diseaseChart.resize();
            this.abnormalChart && this.abnormalChart.resize();
        };
        window.addEventListener("resize", this.resizeHandler);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.resizeHandler);
        this.pciChart && this.pciChart.dispose();
        this.assetChart && this.assetChart.dispose();
        this.diseaseChart && this.diseaseChart.dispose();
        this.abnormalChart && this.abnormalChart.dispose();
    },
    methods: {
        loadPciStatistics() {
            getPciStatistics().then(res => {
                if (res) {
                    this.pciTotalCount = res.totalCount || 0;
                    this.pciLevels = res.levels || [];
                    this.initPciChart();
                } else {
                    this.$message.error(res && res.msg ? res.msg : "加载 PCI 等级统计失败");
                }
            }).catch(err => {
                console.error("加载 PCI 等级统计失败:", err);
                this.$message.error("加载 PCI 等级统计失败");
            });
        },
        loadAssetStatistics() {
            getAssetStatistics().then(res => {
                if (res && res.code === 200) {
                    this.assetData = res.data || {};
                    this.initAssetChart();
                } else {
                    this.$message.error(res && res.msg ? res.msg : "加载资产统计失败");
                }
            }).catch(err => {
                console.error("加载资产统计失败:", err);
                this.$message.error("加载资产统计失败");
            });
        },
        loadDiseaseStatistics() {
            const params = {
                beginTime: this.dateRange[0],
                endTime: this.dateRange[1]
            };
            getDiseaseStatistics(params).then(res => {
                if (res && res.code === 200) {
                    this.diseaseData = res.data || {};
                    this.updateDiseaseLine();
                } else {
                    this.$message.error(res && res.msg ? res.msg : "加载病害统计失败");
                }
            }).catch(err => {
                console.error("加载病害统计失败:", err);
                this.$message.error("加载病害统计失败");
            });
        },
        loadAbnormalEventStatistics() {
            const params = {
                beginTime: this.dateRange[0],
                endTime: this.dateRange[1]
            };
            getAbnormalEventStatistics(params).then(res => {
                if (res && res.code === 200) {
                    this.abnormalData = res.data || {};
                    this.updateAbnormalLine();
                } else {
                    this.$message.error(res && res.msg ? res.msg : "加载异常事件统计失败");
                }
            }).catch(err => {
                console.error("加载异常事件统计失败:", err);
                this.$message.error("加载异常事件统计失败");
            });
        },
        initTimeFilter() {
            const endTime = new Date();
            const beginTime = new Date();
            beginTime.setTime(beginTime.getTime() - 3600 * 1000 * 24 * 7);
            this.dateRange = [this.formatDate(beginTime), this.formatDate(endTime)]
        },
        formatDate(date) {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const day = date.getDate().toString().padStart(2, "0");
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const seconds = date.getSeconds().toString().padStart(2, "0");
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        },
        handleTimeSearch() {
            if (!this.dateRange || this.dateRange.length === 0) {
                this.$message.warning("请选择开始时间和结束时间");
                return;
            }
            this.loadDiseaseStatistics();
            this.loadAbnormalEventStatistics();
        },
        handleTimeReset() {
            this.initTimeFilter();
            this.loadDiseaseStatistics();
            this.loadAbnormalEventStatistics();
        },
        initPciChart() {
            const chartDom = this.$refs.pciChart;
            if (!chartDom) return;
            if (!this.pciChart) {
                this.pciChart = echarts.init(chartDom);
            }
            const categories = this.pciLevels.map(item => item.levelName);
            const values = this.pciLevels.map(item => item.count);
            const option = {
                grid: {
                    left: "5%",
                    right: "5%",
                    top: "10%",
                    bottom: "5%",
                    containLabel: true
                },
                tooltip: {
                    trigger: "axis",
                    axisPointer: { type: "shadow" }
                },
                xAxis: {
                    type: "category",
                    data: categories,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: "#303133", fontSize: 12 }
                },
                yAxis: {
                    type: "value",
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { lineStyle: { color: "#ebeef5" } },
                    axisLabel: { color: "#606266" }
                },
                series: [
                    {
                        type: "bar",
                        data: values,
                        barWidth: 20,
                        itemStyle: {
                            borderRadius: [8, 8, 0, 0],
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: "#409eff" },
                                { offset: 1, color: "#67c23a" }
                            ])
                        },
                        label: {
                            show: true,
                            position: "top",
                            color: "#303133",
                            fontSize: 12
                        }
                    }
                ]
            };
            this.pciChart.setOption(option, true);
        },
        initAssetChart() {
            const chartDom = this.$refs.assetChart;
            if (!chartDom) return;
            if (!this.assetChart) {
                this.assetChart = echarts.init(chartDom);
            }
            const capitals = this.assetData.capitals || [];
            const categories = capitals.map(item => item.capitalType);
            const values = capitals.map(item => item.num);
            const option = {
                grid: {
                    left: "5%",
                    right: "5%",
                    top: "10%",
                    bottom: "5%",
                    containLabel: true
                },
                tooltip: {
                    trigger: "axis",
                    axisPointer: { type: "shadow" }
                },
                xAxis: {
                    type: "category",
                    data: categories,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: "#303133", fontSize: 12 }
                },
                yAxis: {
                    type: "value",
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { lineStyle: { color: "#ebeef5" } },
                    axisLabel: { color: "#606266" }
                },
                series: [
                    {
                        type: "bar",
                        data: values,
                        barWidth: 20,
                        itemStyle: {
                            borderRadius: [8, 8, 0, 0],
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: "#409eff" },
                                { offset: 1, color: "#67c23a" }
                            ])
                        },
                        label: {
                            show: true,
                            position: "top",
                            color: "#303133",
                            fontSize: 12
                        }
                    }
                ]
            };
            this.assetChart.setOption(option, true);
        },
        initDiseaseChart() {
            const chartDom = this.$refs.diseaseChart;
            if (!chartDom) return;
            if (!this.diseaseChart) {
                this.diseaseChart = echarts.init(chartDom);
            }
            const option = {
                grid: {
                    left: "5%",
                    right: "8%",
                    top: "5%",
                    bottom: "5%",
                    containLabel: true
                },
                tooltip: {
                    trigger: "axis",
                    axisPointer: { type: "shadow" }
                },
                xAxis: {
                    type: "value",
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { lineStyle: { color: "#ebeef5" } },
                    axisLabel: { color: "#606266" }
                },
                yAxis: {
                    type: "category",
                    data: [],
                    inverse: true,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: "#303133", fontSize: 13 }
                },
                series: [
                    {
                        type: "bar",
                        data: [],
                        barWidth: 16,
                        itemStyle: {
                            borderRadius: [0, 8, 8, 0],
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                { offset: 0, color: "#f56c6c" },
                                { offset: 1, color: "#e6a23c" }
                            ])
                        },
                        label: {
                            show: true,
                            position: "right",
                            color: "#303133",
                            fontSize: 12
                        }
                    }
                ]
            };
            this.diseaseChart.setOption(option, true);
        },
        updateDiseaseLine() {
            const option = this.diseaseChart.getOption()
            const items = [
                { key: "slight", label: "轻微病害" },
                { key: "normal", label: "一般病害" },
                { key: "severe", label: "严重病害" }
            ];
            const categories = items.map(item => item.label);
            const newData = this.cleanKey(this.diseaseData)
            const values = items.map(item => newData?.[item.key] ?? 0);
            option.yAxis[0].data = categories;
            option.series[0].data = values;
            this.diseaseChart.setOption(option);
        },
        initAbnormalChart() {
            const chartDom = this.$refs.abnormalChart;
            if (!chartDom) return;
            if (!this.abnormalChart) {
                this.abnormalChart = echarts.init(chartDom);
            }
            const option = {
                grid: {
                    left: "5%",
                    right: "8%",
                    top: "5%",
                    bottom: "5%",
                    containLabel: true
                },
                tooltip: {
                    trigger: "axis",
                    axisPointer: { type: "shadow" }
                },
                xAxis: {
                    type: "value",
                    axisLine: { show: false },
                    axisTick: { show: false },
                    splitLine: { lineStyle: { color: "#ebeef5" } },
                    axisLabel: { color: "#606266" }
                },
                yAxis: {
                    type: "category",
                    data: [],
                    inverse: true,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: "#303133", fontSize: 13 }
                },
                series: [
                    {
                        type: "bar",
                        data: [],
                        barWidth: 16,
                        itemStyle: {
                            borderRadius: [0, 8, 8, 0],
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                { offset: 0, color: "#67c23a" },
                                { offset: 1, color: "#409eff" }
                            ])
                        },
                        label: {
                            show: true,
                            position: "right",
                            color: "#303133",
                            fontSize: 12
                        }
                    }
                ]
            };
            this.abnormalChart.setOption(option, true);
        },
        // 清除所有零宽不可见字符
        cleanKey(obj) {
            const result = {};
            Object.entries(obj).forEach(([k, v]) => {
                const newKey = k.replace(/[\u200B-\u200D\uFEFF]/g, '');
                result[newKey] = v;
            });
            return result;
        },
        updateAbnormalLine() {
            const option = this.abnormalChart.getOption()
            const items = [
                { key: "psw", label: "抛洒物数" },
                { key: "hlsh", label: "护栏损坏" },
                { key: "bphlzd", label: "标牌绿化遮挡" }
            ];
            const categories = items.map(item => item.label);
            const values = items.map(item => this.abnormalData[item.key] || 0);
            option.yAxis[0].data = categories;
            option.series[0].data = values;
            console.log({ values, option });

            this.abnormalChart.setOption(option);
        }
    }
};
</script>

<style lang="scss" scoped>
.page-title {
    font-size: 18px;
    font-weight: 600;
    color: #343a40;
    margin-bottom: 20px;
}

.chart-row {
    display: flex;
    gap: 20px;

    .chart-card {
        flex: 1;
        min-width: 0;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        padding: 20px;
        background: #fff;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

        &.full-width {
            flex: 0 0 100%;
        }

        .chart-title {
            font-size: 15px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;

            .chart-total {
                font-size: 13px;
                font-weight: normal;
                color: #606266;
            }
        }

        .chart-dom {
            width: 100%;
            height: 300px;
        }
    }
}

.time-filter-row {
    justify-content: flex-end;
    margin: 10px 0;

    .filter-bar {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 20px;
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

        .filter-label {
            font-size: 14px;
            color: #606266;
        }

        .filter-separator {
            color: #909399;
        }
    }
}

@media (max-width: 900px) {
    .chart-row {
        flex-direction: column;
    }
}
</style>
