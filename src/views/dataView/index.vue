<template>
    <v-scale-screen width="1920" height="1080" fullScreen>
        <div class="screen" v-loading="loading" element-loading-text="数据加载中" element-loading-spinner="el-icon-loading">
            <div class="main">
                <ul class="portion-set">
                    <li class="portion">
                        <div class="chunks">
                            <div class="title">设备统计</div>
                            <div class="content">
                                <div class="gauge-list" v-if="deviceInfo.Camerasum > 0">
                                    <div class="chart-item">
                                        <div id="gauge-chart-one" class="gauge-chart"></div>
                                        <div class="chart-title">监控数量</div>
                                    </div>
                                    <div class="chart-item">
                                        <div id="gauge-chart-two" class="gauge-chart"></div>
                                        <div class="chart-title">有效占比</div>
                                    </div>
                                    <div class="chart-item">
                                        <div id="gauge-chart-three" class="gauge-chart"></div>
                                        <div class="chart-title">失效占比</div>
                                    </div>
                                </div>
                                <div class="empty-text" v-else>暂未添加摄像头</div>
                            </div>
                        </div>
                        <div class="chunks">
                            <div class="title">视频标签</div>
                            <div class="content">
                                <div id="bubble-chart" class="chart" v-if="labelList.length > 0"></div>
                                <div class="empty-text" v-else>暂无数据</div>
                            </div>
                        </div>
                        <div class="chunks">
                            <div class="title">本月预警事件前十统计</div>
                            <div class="content">
                                <div id="strip-chart" class="chart" v-if="Object.keys(alertTopInfo).length > 0"></div>
                                <div class="empty-text" v-else>暂无数据</div>
                            </div>
                        </div>
                    </li>
                    <li class="portion">
                        <div class="chunks">
                            <div class="header">
                                <div class="heading">{{ systemName }}</div>
                            </div>
                            <div class="title">摄像头布控预警占比统计</div>
                            <div class="content">
                                <div id="pie-chart" class="chart" v-if="Object.keys(locationInfo).length > 0"></div>
                                <div class="shadow" v-if="Object.keys(locationInfo).length > 0"></div>
                                <div class="grid" v-if="Object.keys(locationInfo).length > 0"></div>
                                <div class="empty-text" v-else>暂无数据</div>
                            </div>
                        </div>
                        <div class="chunks">
                            <div class="title">预警排名走势</div>
                            <div class="content">
                                <div class="action">
                                    <el-button-group>
                                        <el-button type="primary" :class="{ 'active': activeAlarmIndex == 1 }"
                                            @click="changeAlarmTrend(1)">近24小时</el-button>
                                        <el-button type="primary" :class="{ 'active': activeAlarmIndex == 2 }"
                                            @click="changeAlarmTrend(2)">近7天</el-button>
                                        <el-button type="primary" :class="{ 'active': activeAlarmIndex == 3 }"
                                            @click="changeAlarmTrend(3)">近1个月</el-button>
                                    </el-button-group>
                                </div>
                                <div id="area-chart" class="chart"></div>
                            </div>
                        </div>
                    </li>
                    <li class="portion">
                        <div class="chunks">
                            <div class="title">实时告警事件</div>
                            <div class="content">
                                <div class="warning-list" v-if="eventList.length > 0">
                                    <div class="warning-info">
                                        <div class="warning-image" v-viewer>
                                            <img :src="eventInfo.capturedImage" alt="">
                                        </div>
                                        <div class="warning-detail">
                                            <div class="detail-item">
                                                <span class="label">时间</span>
                                                <span class="value">{{ eventInfo.alertTime }}</span>
                                            </div>
                                            <div class="detail-item">
                                                <span class="label">地点</span>
                                                <span class="value">{{ eventInfo.cameraPosition }}</span>
                                            </div>
                                            <!-- <div class="detail-item">
                                                <span class="label">事件</span>
                                                <span class="value alarm-type">{{ eventInfo.alertType }}</span>
                                            </div> -->
                                            <div class="detail-item">
                                                <span class="label">事件</span>
                                                <div class="value alarm-type">
                                                    {{ Array.isArray(eventInfo.alertType) ? eventInfo.alertType.join(', ') : eventInfo.alertType }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="event-list">
                                        <div class="event-item" :class="{ 'active': activeEventIndex == index }"
                                            v-for="(item, index) in warningEventList" :key="index"
                                            @click="changeEvent(index)">
                                            <img :src="item.capturedImage" alt="" loading="lazy">
                                        </div>
                                    </div>
                                </div>
                                <div class="empty-text" v-else>暂无数据</div>
                            </div>
                        </div>
                        <div class="chunks">
                            <div class="title">预警类型占比</div>
                            <div class="content">
                                <div id="doughnut-chart" class="chart" v-if="Object.keys(alertTypeInfo).length > 0">
                                </div>
                                <div class="empty-text" v-else>暂无数据</div>
                            </div>
                        </div>
                        <div class="chunks">
                            <div class="title">报警事件统计</div>
                            <div class="content">
                                <div id="bar-chart" class="chart"></div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </v-scale-screen>
</template>

<script>
import Highcharts from 'highcharts/highstock';
import 'highcharts/highcharts-more';
import 'highcharts/modules/drilldown';
import 'highcharts/highcharts-3d';
import * as echarts from 'echarts';
import { getDeviceStats, getCameraLocationProportion, getRealtimeAlertEvents, getAlertTypeProportion, getTodayAlertTrend, getWeekAlertTrend, getMonthAlertTrend, getAlertEventTop10, getVideoLabels } from "@/api/dataView";
import baseURL from "@/utils/request";
export default {
    components: {},
    props: {},
    data() {
        return {
            loading: false,
            activeAlarmIndex: 1,
            deviceInfo: {},
            locationInfo: {},
            eventList: [],
            warningEventList: [],
            activeEventIndex: 0,
            eventInfo: {
                capturedImage: "",
                alertTime: "",
                cameraPosition: "",
                alertType: ""
            },
            alertTypeInfo: {},
            alertTopInfo: {},
            labelList: [],
            userId: null,
            systemName: ""
        };
    },
    created() {
    },
    mounted() {
        this.systemName = "智能公路巡检平台智能体";
        this.initScreen();

        setInterval(() => {
            this.initScreen();
        }, 1000 * 120);
    },
    watch: {},
    computed: {},
    methods: {
        initScreen() {
            this.loading = true;
            var requests = [getDeviceStats({}), getCameraLocationProportion(), getRealtimeAlertEvents({}), getAlertTypeProportion(), getTodayAlertTrend({}), getWeekAlertTrend({}), getAlertEventTop10({}), getVideoLabels()];
            Promise.all(requests).then(results => {
                var deviceResult = results[0];
                if (deviceResult.code == 200) {
                    this.deviceInfo = deviceResult.data;
                    if (deviceResult.data.Camerasum > 0) {
                        var cameraCount = deviceResult.data.Camerasum;
                        var effectiveRate = parseInt(deviceResult.data.working / cameraCount * 100);
                        var ineffectiveRate = parseInt((cameraCount - deviceResult.data.working) / cameraCount * 100);
                        this.$nextTick(() => {
                            this.initGaugeChartOne(cameraCount);
                            this.initGaugeChartTwo(effectiveRate);
                            this.initGaugeChartThree(ineffectiveRate);
                        })
                    }
                }

                var locationResult = results[1];
                if (locationResult.code == 200) {
                    this.locationInfo = locationResult.data;
                    var threedPieChartData = [];
                    if (locationResult.data && Object.keys(locationResult.data).length > 0) {
                        var count = 0;
                        for (const key in locationResult.data) {
                            if (count == 0) {
                                threedPieChartData.push(
                                    {
                                        name: key,
                                        y: locationResult.data[key],
                                        color: '#d13df2',
                                        sliced: true,
                                        selected: true
                                    }
                                )
                            } else if (count == 1) {
                                threedPieChartData.push(
                                    {
                                        name: key,
                                        y: locationResult.data[key],
                                        color: '#6dcde6',
                                    }
                                )
                            } else if (count == 2) {
                                threedPieChartData.push(
                                    {
                                        name: key,
                                        y: locationResult.data[key],
                                        color: '#375bf3',
                                    }
                                )
                            } else if (count == 3) {
                                threedPieChartData.push(
                                    {
                                        name: key,
                                        y: locationResult.data[key],
                                        color: '#623ff3',
                                    }
                                )
                            } else if (count == 4) {
                                threedPieChartData.push(
                                    {
                                        name: key,
                                        y: locationResult.data[key],
                                        color: '#3f79ee',
                                    }
                                )
                            }
                            count++;
                        }
                        this.$nextTick(() => {
                            this.init3dPieChart(threedPieChartData);
                        })
                    }
                }

                var eventResult = results[2];
                if (eventResult.code == 200) {
                    this.eventList = eventResult.data;
                    var alertEvents = eventResult.data;
                    if (alertEvents.length > 0) {
                        alertEvents.forEach(item => {
                            item.capturedImage = baseURL.split("/api")[0] + item.capturedImage;
                            item.capturedVideo = baseURL.split("/api")[0] + item.capturedVideo;
                            item.alertTime = item.alertTime ? item.alertTime.slice(0, 16) : "";
                        });
                        this.warningEventList = alertEvents;
                        this.eventInfo = this.warningEventList[0];
                        this.$nextTick(() => {
                            var warningContainer = document.querySelector(".warning-image");
                            if (warningContainer) {
                                warningContainer.style.height = JSON.stringify(warningContainer.offsetWidth * 0.65) + 'px';
                            }
                        })
                    }
                }

                var alertTypeResult = results[3];
                if (alertTypeResult.code == 200) {
                    this.alertTypeInfo = alertTypeResult.data;
                    var pieChartData = [];
                    if (alertTypeResult.data && Object.keys(alertTypeResult.data).length > 0) {
                        for (const key in alertTypeResult.data) {
                            pieChartData.push({ name: key, value: alertTypeResult.data[key] });
                        }
                        this.$nextTick(() => {
                            this.initDoughnutChart(pieChartData);
                        })
                    }
                }

                var trendResult = results[4];
                if (trendResult.code == 200) {
                    // 特殊处理今日预警趋势（24小时数据），确保x轴显示00:00-23:00格式
                    var dateArray = [];
                    var dataArray = [];
                    
                    // 由于这是初始化加载，使用与changeAlarmTrend相同的逻辑处理24小时数据
                    // 检查是否是24小时格式的数据
                    if (trendResult.data && Object.keys(trendResult.data).length > 0) {
                        // 创建24小时的时间标签（00:00, 01:00, ..., 23:00）
                        var labels24 = [];
                        for (let h = 0; h < 24; h++) {
                            labels24.push(h.toString().padStart(2, '0') + ":00");
                        }
                        
                        // 创建24小时的数据数组
                        var data24 = new Array(24).fill(0);
                        
                        for (const key in trendResult.data) {
                            // 处理后端返回的格式，键可能是 "0", "1", ..., "23"
                            var hour = parseInt(key, 10);
                            if (!isNaN(hour) && hour >= 0 && hour <= 23) {
                                data24[hour] = trendResult.data[key];
                            }
                        }
                        
                        this.initAreaChart(labels24, data24);
                    }
                }

                var statsResult = results[5];
                if (statsResult.code == 200) {
                    var dateArray = [];
                    var dataArray = [];
                    if (statsResult.data && Object.keys(statsResult.data).length > 0) {
                        for (const key in statsResult.data) {
                            dateArray.push(key.split("/")[1]);
                            dataArray.push(statsResult.data[key]);
                        }
                    }
                    this.initBarChart(dateArray, dataArray);
                }

                var alertTopResult = results[6];
                if (alertTopResult.code == 200) {
                    this.alertTopInfo = alertTopResult.data;
                    var dateArray = [];
                    var dataArray = [];
                    if (alertTopResult.data && Object.keys(alertTopResult.data).length > 0) {
                        for (const key in alertTopResult.data) {
                            dateArray.push(key);
                            dataArray.push(alertTopResult.data[key]);
                        }
                        this.$nextTick(() => {
                            this.initStripChart(dateArray, dataArray);
                        })
                    }

                }

                var labelResult = results[7];
                if (labelResult.code == 200) {
                    this.labelList = labelResult.data;
                    var bubbleChartData = [];
                    if (labelResult.data && labelResult.data.length > 0) {
                        labelResult.data.forEach((item, index) => {
                            var obj = { ...item };
                            if (index == 0) {
                                obj.marker = {
                                    fillColor: {
                                        radialGradient: {
                                            cx: 0.5, // 渐变中心的 x 坐标，0 到 1 之间，0.5 表示中心
                                            cy: 0.5, // 渐变中心的 y 坐标，0 到 1 之间，0.5 表示中心
                                            r: 0.7 // 渐变半径，0 到 1 之间，0.5 表示从中心向外一半的距离
                                        },
                                        stops: [
                                            [0, '#0f1296'], // 渐变起始颜色
                                            [1, '#2f98d8']  // 渐变结束颜色
                                        ]
                                    }
                                }
                            } else if (index == 1) {
                                obj.marker = {
                                    fillColor: {
                                        radialGradient: {
                                            cx: 0.5, // 渐变中心的 x 坐标，0 到 1 之间，0.5 表示中心
                                            cy: 0.5, // 渐变中心的 y 坐标，0 到 1 之间，0.5 表示中心
                                            r: 0.9 // 渐变半径，0 到 1 之间，0.5 表示从中心向外一半的距离
                                        },
                                        stops: [
                                            [0, '#092fa5'], // 渐变起始颜色
                                            [1, '#1e9ccb']  // 渐变结束颜色
                                        ]
                                    }
                                }
                            } else if (index == 2) {
                                obj.marker = {
                                    fillColor: {
                                        radialGradient: {
                                            cx: 0.5, // 渐变中心的 x 坐标，0 到 1 之间，0.5 表示中心
                                            cy: 0.5, // 渐变中心的 y 坐标，0 到 1 之间，0.5 表示中心
                                            r: 1 // 渐变半径，0 到 1 之间，0.5 表示从中心向外一半的距离
                                        },
                                        stops: [
                                            [0, '#0229a9'], // 渐变起始颜色
                                            [1, '#48c2e4']  // 渐变结束颜色
                                        ]
                                    }
                                }
                            } else if (index == 3) {
                                obj.marker = {
                                    fillColor: {
                                        radialGradient: {
                                            cx: 0.5, // 渐变中心的 x 坐标，0 到 1 之间，0.5 表示中心
                                            cy: 0.5, // 渐变中心的 y 坐标，0 到 1 之间，0.5 表示中心
                                            r: 0.8 // 渐变半径，0 到 1 之间，0.5 表示从中心向外一半的距离
                                        },
                                        stops: [
                                            [0, '#0d17a9'], // 渐变起始颜色
                                            [1, '#263caa']  // 渐变结束颜色
                                        ]
                                    }
                                }
                            }
                            if (labelResult.data.length >= 7) {
                                if (index == labelResult.data.length - 3) {
                                    obj.marker = {
                                        fillColor: {
                                            radialGradient: {
                                                cx: 0.5, // 渐变中心的 x 坐标，0 到 1 之间，0.5 表示中心
                                                cy: 0.5, // 渐变中心的 y 坐标，0 到 1 之间，0.5 表示中心
                                                r: 0.8 // 渐变半径，0 到 1 之间，0.5 表示从中心向外一半的距离
                                            },
                                            stops: [
                                                [0, '#cc9959'], // 渐变起始颜色
                                                [1, '#9f755f']  // 渐变结束颜色
                                            ]
                                        }
                                    }
                                } else if (index == labelResult.data.length - 2) {
                                    obj.marker = {
                                        fillColor: {
                                            radialGradient: {
                                                cx: 0.2, // 渐变中心的 x 坐标，0 到 1 之间，0.5 表示中心
                                                cy: 0.2, // 渐变中心的 y 坐标，0 到 1 之间，0.5 表示中心
                                                r: 0.5 // 渐变半径，0 到 1 之间，0.5 表示从中心向外一半的距离
                                            },
                                            stops: [
                                                [0, '#1c82cb'], // 渐变起始颜色
                                                [1, '#48c2e4']  // 渐变结束颜色
                                            ]
                                        }
                                    }
                                } else if (index == labelResult.data.length - 1) {
                                    obj.marker = {
                                        fillColor: {
                                            radialGradient: {
                                                cx: 0.5, // 渐变中心的 x 坐标，0 到 1 之间，0.5 表示中心
                                                cy: 0.5, // 渐变中心的 y 坐标，0 到 1 之间，0.5 表示中心
                                                r: 0.8 // 渐变半径，0 到 1 之间，0.5 表示从中心向外一半的距离
                                            },
                                            stops: [
                                                [0, '#178084'], // 渐变起始颜色
                                                [1, '#42c190']  // 渐变结束颜色
                                            ]
                                        }
                                    }
                                }
                            }
                            bubbleChartData.push(obj);
                        })

                        this.$nextTick(() => {
                            this.initBubbleChart(bubbleChartData);
                        })
                    }

                }
            }).finally(() => {
                this.loading = false;
            })
        },
        initGaugeChartOne(value) {
            var chartDom = document.getElementById('gauge-chart-one');
            if (!chartDom) return;
            var myChart = echarts.init(chartDom);
            var option;

            option = {
                series: [
                    {
                        type: "gauge",
                        startAngle: 80,
                        endAngle: -280,
                        pointer: {
                            show: false,
                        },
                        progress: {
                            show: true,
                            overlap: false,
                            roundCap: true,
                            clip: false,
                        },
                        color: '#d13df2',
                        axisLine: {
                            lineStyle: {
                                width: 12,
                                color: [
                                    [0.0, "lime"],
                                    [1, "rgba(0,0,0,0)"],
                                ],
                            },
                        },
                        splitLine: {
                            show: false,
                        },
                        axisTick: {
                            show: false,
                        },
                        axisLabel: {
                            show: false,
                        },
                        data: [
                            {
                                value,
                                detail: {
                                    valueAnimation: true,
                                    offsetCenter: ["0%", "0%"],
                                },
                            },
                        ],
                        detail: {
                            fontSize: 24,
                            color: "#fff",
                            formatter: "{value}",
                        },
                    },
                ],
            };

            option && myChart.setOption(option);
        },
        initGaugeChartTwo(value) {
            var chartDom = document.getElementById('gauge-chart-two');
            if (!chartDom) return;
            var myChart = echarts.init(chartDom);
            var option;

            option = {
                series: [
                    {
                        type: "gauge",
                        startAngle: 80,
                        endAngle: -280,
                        pointer: {
                            show: false,
                        },
                        progress: {
                            show: true,
                            overlap: false,
                            roundCap: true,
                            clip: false,
                        },
                        color: '#6ccee6',
                        axisLine: {
                            lineStyle: {
                                width: 12,
                                color: [
                                    [0.0, "lime"],
                                    [1, "rgba(0,0,0,0)"],
                                ],
                            },
                        },
                        splitLine: {
                            show: false,
                        },
                        axisTick: {
                            show: false,
                        },
                        axisLabel: {
                            show: false,
                        },
                        data: [
                            {
                                value,
                                detail: {
                                    valueAnimation: true,
                                    offsetCenter: ["0%", "0%"],
                                },
                            },
                        ],
                        detail: {
                            fontSize: 24,
                            color: "#fff",
                            formatter: "{value}%",
                        },
                    },
                ],
            };

            option && myChart.setOption(option);
        },
        initGaugeChartThree(value) {
            var chartDom = document.getElementById('gauge-chart-three');
            if (!chartDom) return;
            var myChart = echarts.init(chartDom);
            var option;

            option = {
                series: [
                    {
                        type: "gauge",
                        startAngle: 80,
                        endAngle: -280,
                        pointer: {
                            show: false,
                        },
                        progress: {
                            show: true,
                            overlap: false,
                            roundCap: true,
                            clip: false,
                        },
                        color: '#4366f3',
                        axisLine: {
                            lineStyle: {
                                width: 12,
                                color: [
                                    [0.0, "lime"],
                                    [1, "rgba(0,0,0,0)"],
                                ],
                            },
                        },
                        splitLine: {
                            show: false,
                        },
                        axisTick: {
                            show: false,
                        },
                        axisLabel: {
                            show: false,
                        },
                        data: [
                            {
                                value,
                                detail: {
                                    valueAnimation: true,
                                    offsetCenter: ["0%", "0%"],
                                },
                            },
                        ],
                        detail: {
                            fontSize: 24,
                            color: "#fff",
                            formatter: "{value}%",
                        },
                    },
                ],
            };

            option && myChart.setOption(option);
        },
        initBubbleChart(data) {
            if (!document.getElementById('bubble-chart')) return;
            Highcharts.chart('bubble-chart', {
                credits: {
                    enabled: false // 禁用版权信息
                },
                chart: {
                    type: 'packedbubble',
                    backgroundColor: 'transparent',
                    // height: '100%'
                },
                title: {
                    text: '',
                },
                tooltip: {
                    enabled: false,
                    // useHTML: true,
                    // pointFormat: '<b>{point.name}:</b> {point.value}m CO<sub>2</sub>'
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    packedbubble: {
                        minSize: '60%',
                        maxSize: '140%',
                        zMin: data[data.length - 1].value,
                        zMax: data[0].value,
                        layoutAlgorithm: {
                            // enableSimulation: false,  // 气泡自动聚拢的模拟
                            splitSeries: false, //数据点分成多个组
                            gravitationalConstant: 0.001, // 调整气泡之间的相互吸引力
                        },
                        dataLabels: {
                            enabled: true,
                            useHTML: true,
                            formatter: function () {
                                // 返回要显示的文本
                                return '<div style="text-align:center;width:100%;height:100%;">' + '<span class="bubble-text">' + this.point.value + '</span><br /><span class="bubble-text">' + this.point.name + '</span></div>';
                            },
                            style: {
                                color: '#fff',
                                textOutline: 'none',
                                fontWeight: 'normal',
                            }
                        },
                        marker: {
                            fillColor: {
                                radialGradient: {
                                    cx: 0.5, // 渐变中心的 x 坐标，0 到 1 之间，0.5 表示中心
                                    cy: 0.5, // 渐变中心的 y 坐标，0 到 1 之间，0.5 表示中心
                                    r: 0.8 // 渐变半径，0 到 1 之间，0.5 表示从中心向外一半的距离
                                },
                                stops: [
                                    [0, '#040794'], // 渐变起始颜色
                                    [1, '#2f99d6']  // 渐变结束颜色
                                ]
                            }
                        }
                    }
                },
                series: [
                    {
                        color: 'rgba(0,0,0,0)',
                        data
                    }]
            });

        },
        initStripChart(dateArray, dataArray) {
            var chartDom = document.getElementById('strip-chart');
            if (!chartDom) return;
            var myChart = echarts.init(chartDom);
            var option;

            option = {
                // tooltip: {
                //     trigger: 'axis',
                //     axisPointer: {
                //         type: 'shadow'
                //     }
                // },
                legend: {
                    show: false
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'value',
                    boundaryGap: [0, 0.01],
                    axisLine: {
                        show: false // 隐藏 X 轴的竖线
                    },
                    axisLabel: {
                        fontSize: 16
                    },
                    splitLine: {
                        show: false
                    }
                },
                yAxis: {
                    type: 'category',
                    data: dateArray,
                    inverse: true,//升序排序
                    axisTick: {
                        show: false // 不显示 Y 轴刻度
                    },
                    axisLine: {
                        show: false
                    },
                    axisLabel: {
                        color: '#fff',
                        fontSize: 16
                    }
                },
                grid: {
                    left: '5%',
                    right: '5%',
                    top: "5%",
                    bottom: '0',
                    containLabel: true
                },
                series: [
                    {
                        // name: '2011',
                        type: 'bar',
                        data: dataArray,
                        showBackground: true,
                        backgroundStyle: {
                            color: 'rgba(180, 180, 180, 0.2)'
                        },
                        itemStyle: {
                            normal: {
                                color: function (params) {
                                    // 根据索引设置颜色
                                    if (params.dataIndex == 0) {
                                        return new echarts.graphic.LinearGradient(
                                            0, 0, 1, 0, // 渐变从左到右
                                            [
                                                { offset: 0, color: '#a633c0' }, // 0% 位置的颜色
                                                { offset: 1, color: '#34265b' }  // 100% 位置的颜色
                                            ]
                                        );
                                    } else if (params.dataIndex == 1) {
                                        return new echarts.graphic.LinearGradient(
                                            0, 0, 1, 0,
                                            [
                                                { offset: 0, color: '#6342be' },
                                                { offset: 1, color: '#2a285e' }
                                            ]
                                        );
                                    } else if (params.dataIndex == 2) {
                                        return new echarts.graphic.LinearGradient(
                                            0, 0, 1, 0,
                                            [
                                                { offset: 0, color: '#1a339e' },
                                                { offset: 1, color: '#172341' }
                                            ]
                                        );
                                    } else {
                                        return '#6dcde6';
                                    }
                                }
                            }
                        },
                        label: {
                            normal: {
                                show: true, // 显示标签
                                position: 'right', // 标签显示位置
                                // 可以设置更多样式，如颜色、字体大小等
                                textStyle: {
                                    color: '#fff',
                                    fontSize: 15
                                }
                            }
                        },
                    }
                ]
            };

            option && myChart.setOption(option);
        },
        init3dPieChart(data) {
            if (!document.getElementById('pie-chart')) return;
            Highcharts.chart('pie-chart', {
                credits: {
                    enabled: false // 禁用版权信息
                },
                chart: {
                    type: 'pie',
                    backgroundColor: 'transparent',
                    reflow: true,
                    options3d: {
                        enabled: true, // 启用3D效果
                        alpha: 60, // X轴旋转角度，设置饼图倾斜的角度
                        beta: 0  // Y轴旋转角度，0表示饼图仅沿X轴倾斜
                    },
                },
                title: {
                    text: ""
                },
                accessibility: {
                    point: {
                        valueSuffix: '%'
                    }
                },
                tooltip: {
                    enabled: false,
                    // pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                },
                plotOptions: {
                    pie: {
                        center: ['50%', '58%'],
                        size: '55%',
                        slicedOffset: 45, // 设置选中块拉开的距离
                        allowPointSelect: true, // 确保允许点选择和设置手型图标
                        cursor: 'pointer',
                        animation: false, // 取消动画效果
                        depth: 150,
                        dataLabels: {
                            enabled: true,
                            backgroundColor: 'rgba(255, 255, 255, 0)',
                            distance: 45, // 设置数据标签与饼图边缘的距离
                            connectorColor: '#fff', //连接线的颜色
                            formatter: function () { // 自定义数据标签的文本内容
                                var pointColor = this.point.color;
                                return '<span class="pie-chart-text" style="font-size:18px;">' + this.point.name + '</span>' +
                                    '<br/>' +
                                    '<span class="pie-chart-text" style="color:' + pointColor + ';font-size:24px;font-weight:600;">' + this.point.percentage.toFixed(1) + '%</span>';
                            },
                            style: { // 设置数据标签的样式
                                color: '#fff', // 文字颜色
                                fontSize: '14px', // 字体大小
                                fontWeight: 'normal', // 字体粗细
                            },
                        }
                    }
                },
                series: [
                    {
                        type: 'pie',
                        name: 'Share',
                        data
                    }
                ]
            });
        },
        initAreaChart(dateArray, dataArray) {
            console.log("dateArray="+dateArray+" dataArray="+dataArray)
            var container = document.getElementById('area-chart');
            if (!container) return;
            var myChart = echarts.init(container);
            myChart.dispose();
            container = document.getElementById('area-chart');
            if (container) {
                myChart = echarts.init(container);
                var option;
                option = {
                    tooltip: {
                        trigger: 'axis',
                    },
                    xAxis: {
                        type: 'category',
                        boundaryGap: false,
                        data: dateArray,
                        axisTick: {
                            show: false // 不显示 X 轴刻度
                        },
                        axisLabel: {
                            fontSize: 14,
                            // 根据时间范围调整x轴标签显示格式
                            formatter: function (value) {
                                // 如果是24小时数据（格式为 "00:00", "01:00"...），直接显示
                                if (dateArray.length === 24 && /^\d{2}:\d{2}$/.test(value)) {
                                    return value;
                                }
                                // 如果是日期格式，根据需要调整显示格式
                                return value;
                            }
                        },
                    },
                    yAxis: {
                        type: 'value',
                        splitLine: {
                            lineStyle: {
                                color: ['#3b3e4c'] // 设置 Y 轴分隔线的颜色
                            }
                        },
                        axisLabel: {
                            fontSize: 14
                        },
                    },
                    grid: {
                        left: '5%',
                        right: '5%',
                        top: "12%",
                        bottom: '0',
                        containLabel: true
                    },
                    series: [
                        {
                            data: dataArray,
                            type: 'line',
                            symbol: 'none', // 隐藏数据点
                            smooth: 0.1,
                            lineStyle: {
                                color: '#0377d0',
                                width: 3,
                            },
                            areaStyle: { // 设置面积样式
                                color: new echarts.graphic.LinearGradient(
                                    0, 0, 0, 1, // 渐变从 y=0 (顶部) 到 y=1 (底部)
                                    [
                                        { offset: 0, color: '#6dcde6' }, // 0% 位置的颜色
                                        { offset: 0.5, color: '#5aabe9' }, // 50% 位置的颜色
                                        { offset: 1, color: '#3261f0' }  // 100% 位置的颜色
                                    ]
                                )
                            }
                        }
                    ]
                };

                option && myChart.setOption(option);
                
                // 添加响应式处理
                window.addEventListener('resize', function() {
                    myChart.resize();
                });
            }
        },
        initDoughnutChart(data) {
            var chartDom = document.getElementById('doughnut-chart');
            if (!chartDom) return;
            var myChart = echarts.init(chartDom);
            var option;

            option = {
                tooltip: {
                    trigger: 'item'
                },
                legend: {
                    show: false
                },
                color: ['#008cff', '#bd41ef', '#3f79ee', '#875ffc', '#6ccce5'],
                series: [
                    {
                        // name: 'Access From',
                        type: 'pie',
                        radius: ['45%', '65%'],
                        avoidLabelOverlap: false,
                        label: {
                            normal: {
                                show: true,
                                position: 'outside',
                                formatter: function (params) {
                                    // 自定义 HTML 格式
                                    return '{percent|' + params.percent.toFixed(1) + '%}\n' + '{name|' + params.name + '}';
                                },
                                rich: {
                                    percent: {
                                        color: '#fff',
                                        fontSize: 17,
                                        padding: [0, 0, 5, 0] // 这里设置padding来控制间距
                                    },
                                    name: {
                                        color: '#6c7384',
                                        fontSize: 17,
                                    }
                                },
                                textStyle: {
                                    color: '#fff', // 标签文本的颜色，这里设置为黑色
                                    fontWeight: 'normal' // 标签文本的字体粗细
                                }
                            }
                        },
                        // emphasis: {
                        //     label: {
                        //         show: true,
                        //         fontSize: 40,
                        //         fontWeight: 'bold'
                        //     }
                        // },
                        labelLine: {
                            show: true
                        },
                        data
                    }
                ]
            };

            option && myChart.setOption(option);
            window.onresize
        },
        initBarChart(dateArray, dataArray) {
            var chartDom = document.getElementById('bar-chart');
            if (!chartDom) return;
            var myChart = echarts.init(chartDom);
            var option;

            option = {
                xAxis: {
                    type: 'category',
                    data: dateArray,
                    axisTick: {
                        show: false // 不显示 X 轴刻度
                    },
                    axisLabel: {
                        fontSize: 16
                    },
                },
                yAxis: {
                    type: 'value',
                    splitLine: {
                        lineStyle: {
                            color: ['#3b3e4c'] // 设置 Y 轴分隔线的颜色
                        }
                    },
                    axisLabel: {
                        fontSize: 16
                    },
                },
                grid: {
                    left: '5%',
                    right: '5%',
                    top: "15%",
                    bottom: '0',
                    containLabel: true
                },
                series: [
                    {
                        data: dataArray,
                        type: 'bar',
                        itemStyle: {
                            // 设置柱状图的渐变色
                            color: new echarts.graphic.LinearGradient(
                                0, 0, 0, 1, // 渐变方向，从上到下
                                [
                                    { offset: 0, color: '#6dcde6' }, // 0% 位置的颜色
                                    { offset: 0.5, color: '#5aabe9' }, // 50% 位置的颜色
                                    { offset: 1, color: '#3261f0' }  // 100% 位置的颜色
                                ]
                            )
                        },
                        label: {
                            normal: {
                                show: true, // 显示标签
                                position: 'top', // 标签显示在柱子顶部
                                formatter: '{c}',// 标签显示内容，这里显示数据值
                                color: '#fff',
                                fontSize: 17
                            }
                        }
                    }
                ]
            };

            option && myChart.setOption(option);
        },
        changeEvent(index) {
            this.activeEventIndex = index;
            this.eventInfo = this.warningEventList[index];
        },
        changeAlarmTrend(index) {
            this.activeAlarmIndex = index;
            var methods;
            if (index == 1) {
                methods = getTodayAlertTrend;
            } else if (index == 2) {
                methods = getWeekAlertTrend;
            } else {
                methods = getMonthAlertTrend;
            }
            methods({}).then(res => {
                if (res.code == 200) {
                    // 如果是近24小时，生成 00:00-23:00 点的刻度并将 API 返回的小时数据映射到对应小时槽（缺失为 0）
                    if (index == 1) {
                        // 创建24小时的时间标签（00:00, 01:00, ..., 23:00）
                        var labels24 = [];
                        for (let h = 0; h < 24; h++) {
                            labels24.push(h.toString().padStart(2, '0') + ":00");
                        }
                        
                        // 创建24小时的数据数组
                        var data24 = new Array(24).fill(0);
                        
                        if (res.data && Object.keys(res.data).length > 0) {
                            for (const key in res.data) {
                                // 处理后端返回的格式，键可能是 "0", "1", ..., "23"
                                var hour = parseInt(key, 10);
                                if (!isNaN(hour) && hour >= 0 && hour <= 23) {
                                    data24[hour] = res.data[key];
                                }
                            }
                        }
                        
                        this.initAreaChart(labels24, data24);
                    } else {
                        var dateArray = [];
                        var dataArray = [];
                        if (res.data && Object.keys(res.data).length > 0) {
                            for (const key in res.data) {
                                // 对于7天和30天，保留原有的处理方式
                                if (index == 2) {
                                    // 7天模式：显示月份/日期（如 "12/15"）
                                    dateArray.push(key.split("/")[1]);
                                } else {
                                    // 30天模式：显示月份/日期
                                    dateArray.push(key.split("/")[1]);
                                }
                                dataArray.push(res.data[key]);
                            }
                        }
                        
                        this.initAreaChart(dateArray, dataArray);
                    }
                }
            })
        },
        getLastTwelveHours() {
            let now = new Date();
            let times = [];
            // 循环12次，每次倒推2小时
            for (let i = 0; i < 12; i++) {
                if (i == 0) {
                    now.setHours(now.getHours());
                } else {
                    now.setHours(now.getHours() - 2);
                }
                // 格式化时间，只保留小时和分钟（00分钟）
                let time = now.getHours().toString().padStart(2) + "时";
                times.push(time);
            }
            // 如果需要按照时间顺序排列，可以对数组进行反转
            times.reverse();
            return times;
        },
        getLastSevenDays() {
            let now = new Date();
            let dates = [];
            // 循环7次，每次倒推1天
            for (let i = 0; i < 7; i++) {
                if (i == 0) {
                    now.setDate(now.getDate());
                } else {
                    now.setDate(now.getDate() - 1);
                }
                let date = now.getDate().toString().padStart(2).trim() + "日";
                dates.unshift(date);
            }
            return dates;
        },
        getLastThirtyDays() {
            let now = new Date();
            let dates = [];
            // 循环15次，每次倒推3天
            for (let i = 0; i < 10; i++) {
                if (i == 0) {
                    now.setDate(now.getDate());
                } else {
                    now.setDate(now.getDate() - 2);
                }
                let date = now.getDate().toString().padStart(2).trim() + "日";
                dates.unshift(date);
            }
            return dates;
        },
        timestampToDate(timestamp) {
            let now = new Date(timestamp);
            let y = now.getFullYear();
            let m = now.getMonth() + 1;
            let d = now.getDate();
            return y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d) + " " + now.toTimeString().substring(0, 8);
        },
        setDocumentTitle(newTitle) {
            let titleElement = document.querySelector('title');

            if (!titleElement) {
                titleElement = document.createElement('title');
                document.head.appendChild(titleElement);
            }

            titleElement.textContent = newTitle;
        },
        setFavicon(iconUrl) {
            let link = document.querySelector("link[rel*='icon']");

            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }

            link.href = iconUrl;
        },
    }
};
</script>
<style lang="scss" scoped>
@import "../../assets/scss/dataView/index.scss";
</style>