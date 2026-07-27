<template>
    <div class="container">
        <div class="main-wrapper card">
            <div class="page-top-action">
                <div class="table-filter">
                    <div class="filter-params">
                        <span class="filter-label">关键字：</span>
                        <el-input v-model="query.uploadName" placeholder="任务名称" size="small" class="search-input"
                            clearable @keyup.enter.native="handleSearch"></el-input>
                    </div>
                    <div class="filter-params">
                        <span class="filter-label">状态：</span>
                        <el-select v-model="query.aiCheckStatus" placeholder="全部" size="small" clearable
                            style="width: 120px;">
                            <el-option label="待检测" value="0"></el-option>
                            <el-option label="检测完成" value="1"></el-option>
                            <el-option label="检测失败" value="2"></el-option>
                        </el-select>
                    </div>
                </div>
                <div class="right-search right-button">
                    <el-button type="primary" icon="el-icon-search" size="small" @click="handleSearch">查询</el-button>
                    <el-button icon="el-icon-refresh-left" size="small" @click="handleReset">重置</el-button>
                    <el-button type="primary" size="small" icon="el-icon-plus" @click="openAddDialog">新增检测记录</el-button>
                </div>
            </div>

            <div class="table">
                <div class="table-action flex-between" style="margin-bottom: 15px;">
                    <div class="table-title">检测记录</div>

                </div>
                <el-table :data="tableData" stripe v-loading="loading" size="small">
                    <el-table-column type="index" label="序号" width="60" align="center">
                        <template slot-scope="scope">{{ (query.pageNum - 1) * query.pageSize + scope.$index + 1
                        }}</template>
                    </el-table-column>
                    <el-table-column prop="uploadName" label="任务名称" min-width="140"
                        show-overflow-tooltip></el-table-column>
                    <el-table-column prop="roadName" label="道路名" min-width="120"
                        show-overflow-tooltip></el-table-column>
                    <el-table-column prop="pci" label="路面状况指数" min-width="120" align="center"
                        show-overflow-tooltip>
                        <template slot-scope="scope">
                            {{ scope.row.pci != null ? scope.row.pci : '-' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="aiCheckResult" label="检测结果" min-width="140"
                        show-overflow-tooltip></el-table-column>
                    <el-table-column label="状态" width="90" align="center">
                        <template slot-scope="scope">
                            <el-tag size="mini" :type="statusType(scope.row.aiCheckStatus)">{{
                                statusLabel(scope.row.aiCheckStatus) }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="上传时间" width="160">
                        <template slot-scope="scope">{{ formatTime(scope.row.uploadTime) }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="180" align="center">
                        <template slot-scope="scope">
                            <el-button type="text" size="mini" @click="showDetail(scope.row)">详情</el-button>
                            <el-button type="text" size="mini" :disabled="scope.row.aiCheckStatus != 1"
                                @click="viewDetail(scope.row)">查看报告</el-button>
                            <el-button type="text" size="mini" class="danger-text"
                                @click="deleteRecord(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                    <template slot="empty">
                        <el-empty description="暂无检测记录"></el-empty>
                    </template>
                </el-table>
                <el-pagination v-if="total > 0" @size-change="handleSizeChange" @current-change="handleCurrentChange"
                    :current-page.sync="query.pageNum" :page-sizes="[10, 20, 30, 50]" :page-size="query.pageSize"
                    layout="total, sizes, prev, pager, next, jumper" :total="total"></el-pagination>
            </div>

            <el-dialog title="检测记录详情" :visible.sync="detailVisible" width="540px">
                <div class="detail-wrap" v-loading="detailLoading">
                    <div class="detail-item">
                        <span class="detail-label">任务名称：</span>
                        <span class="detail-value">{{ detailInfo.uploadName || '-' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">道路名：</span>
                        <span class="detail-value">{{ detailInfo.roadName || '-' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">状态：</span>
                        <span class="detail-value">
                            <el-tag size="mini" :type="statusType(detailInfo.aiCheckStatus)">{{
                                statusLabel(detailInfo.aiCheckStatus) }}</el-tag>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">路面状况指数：</span>
                        <span class="detail-value">{{ detailInfo.pci != null ? detailInfo.pci : '-' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">上传时间：</span>
                        <span class="detail-value">{{ formatTime(detailInfo.uploadTime) }}</span>
                    </div>
                    <div class="detail-item" v-if="detailInfo.imageUrlList && detailInfo.imageUrlList.length">
                        <span class="detail-label">图片：</span>
                        <span class="detail-value">
                            <div class="detail-image-list">
                                <el-image v-for="(url, index) in detailInfo.imageUrlList" :key="index" :src="url"
                                    :preview-src-list="detailInfo.imageUrlList" fit="cover" class="detail-image">
                                </el-image>
                            </div>
                        </span>
                    </div>
                </div>
            </el-dialog>

            <el-dialog title="新增检测记录" :visible.sync="addVisible" width="560px" :close-on-click-modal="false"
                @closed="resetAddForm">
                <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-position="right" label-width="100px"
                    v-loading="addLoading">
                    <el-form-item label="上传图片" prop="imageList">
                        <div class="image-grid">
                            <div class="preview-item" v-for="(item, index) in addForm.imageList" :key="index">
                                <img :src="item.url">
                                <div class="upload-actions">
                                    <span @click.stop="removeImage(index)"><i class="el-icon-delete"></i></span>
                                </div>
                            </div>
                            <el-upload v-if="addForm.imageList.length < 3" class="record-uploader" action="#"
                                :auto-upload="false" :show-file-list="false" :on-change="handleImageChange"
                                accept=".jpg,.png,.jpeg">
                                <div class="upload-box">
                                    <i class="el-icon-plus"></i>
                                    <div class="upload-text">点击上传</div>
                                </div>
                            </el-upload>
                        </div>
                        <div class="upload-tip">最多上传3张，支持 jpg/png 格式，单张不超过5MB</div>
                    </el-form-item>
                    <el-form-item label="任务名称" prop="uploadName">
                        <el-input v-model="addForm.uploadName" placeholder="请输入任务名称" size="small" maxlength="50"
                            show-word-limit></el-input>
                    </el-form-item>
                    <el-form-item label="道路选择" prop="roadId">
                        <el-select v-model="addForm.roadId" placeholder="请选择道路" size="small" style="width: 100%;">
                            <el-option label="G6" value="G6"></el-option>
                        </el-select>
                    </el-form-item>
                </el-form>
                <div slot="footer" class="dialog-footer">
                    <el-button @click="addVisible = false" size="small">取 消</el-button>
                    <el-button type="primary" @click="submitAddForm" size="small" :loading="addLoading">确 定</el-button>
                </div>
            </el-dialog>
        </div>
    </div>
</template>

<script>
import { getMonitorRecordList, createMonitorRecord, deleteMonitorRecord, getMonitorRecordDetail } from "@/api/monitorRecord";

export default {
    name: "DataMonitorRecord",
    data() {
        return {
            loading: false,
            detailLoading: false,
            detailVisible: false,
            detailInfo: {},
            addVisible: false,
            addLoading: false,
            addForm: {
                imageList: [],
                uploadName: "",
                roadId: ""
            },
            addRules: {
                imageList: [
                    { required: true, message: "请至少上传一张图片", trigger: "change" }
                ],
                uploadName: [
                    { required: true, message: "请输入任务名称", trigger: "blur" }
                ],
                roadId: [
                    { required: true, message: "请选择道路", trigger: "change" }
                ]
            },
            query: {
                uploadName: "",
                aiCheckStatus: "",
                pageNum: 1,
                pageSize: 10
            },
            tableData: [],
            total: 0
        };
    },
    created() {
        this.fetchList();
    },
    methods: {
        async fetchList() {
            this.loading = true;
            try {
                const params = this.buildParams();
                const res = await getMonitorRecordList(params);
                if (res && res.records) {
                    this.tableData = res.records || [];
                    this.total = res.total || 0;
                }
            } finally {
                this.loading = false;
            }
        },
        buildParams() {
            const params = {
                pageNum: this.query.pageNum,
                pageSize: this.query.pageSize,
                uploadName: this.query.uploadName,
                aiCheckStatus: this.query.aiCheckStatus
            };
            return params;
        },
        handleSearch() {
            this.query.pageNum = 1;
            this.fetchList();
        },
        handleReset() {
            this.query = {
                uploadName: "",
                aiCheckStatus: "",
                pageNum: 1,
                pageSize: this.query.pageSize
            };
            this.fetchList();
        },
        handleSizeChange(val) {
            this.query.pageNum = 1;
            this.query.pageSize = val;
            this.fetchList();
        },
        handleCurrentChange(val) {
            this.query.pageNum = val;
            this.fetchList();
        },
        viewDetail(row) {
            if (row.aiCheckStatus != 1) {
                this.$message.warning("仅检测完成状态的记录可查看报告");
                return;
            }
            this.$router.push({
                path: "/patrol-report",
                query: { recordId: row.id }
            });
        },
        showDetail(row) {
            this.detailLoading = true;
            this.detailVisible = true;
            getMonitorRecordDetail(row.id).then(res => {
                if (res) {
                    this.detailInfo = res;
                } else {
                    this.$message.error(res && res.msg ? res.msg : "获取详情失败");
                }
            }).catch(() => {
                this.$message.error("获取详情失败");
            }).finally(() => {
                this.detailLoading = false;
            });
        },
        deleteRecord(row) {
            this.$confirm("确定删除该检测记录吗？", "提示", {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning"
            }).then(() => {
                deleteMonitorRecord(row.id).then(res => {
                    if (res === 'success') {
                        this.$message.success("删除成功");
                        this.fetchList();
                    } else {
                        this.$message.error(res && res.msg ? res.msg : "删除失败");
                    }
                }).catch(() => {
                    this.$message.error("删除失败");
                });
            });
        },
        openAddDialog() {
            this.addVisible = true;
            this.$nextTick(() => {
                this.$refs.addFormRef && this.$refs.addFormRef.resetFields();
            });
        },
        resetAddForm() {
            this.addForm.imageList.forEach(item => {
                URL.revokeObjectURL(item.url);
            });
            this.addForm = {
                imageList: [],
                uploadName: "",
                roadId: ""
            };
            this.$refs.addFormRef && this.$refs.addFormRef.resetFields();
        },
        async handleImageChange(file, fileList) {
            if (this.addForm.imageList.length >= 3) {
                this.$message.warning("最多只能上传3张图片");
                return;
            }
            const raw = file.raw;
            const isImage = /\.(jpg|jpeg|png)$/i.test(raw.name);
            if (!isImage) {
                this.$message.warning("仅支持 jpg/png 格式的图片");
                return;
            }
            const isLt5M = raw.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                this.$message.warning("图片大小不能超过 5MB");
                return;
            }
            this.addForm.imageList.push({
                url: URL.createObjectURL(raw),
                file: raw
            });
            this.$refs.addFormRef && this.$refs.addFormRef.validateField("imageList");
        },
        removeImage(index) {
            if (this.addForm.imageList[index]) {
                URL.revokeObjectURL(this.addForm.imageList[index].url);
                this.addForm.imageList.splice(index, 1);
            }
            this.$refs.addFormRef && this.$refs.addFormRef.validateField("imageList");
        },
        submitAddForm() {
            this.$refs.addFormRef.validate((valid) => {
                if (!valid) return;
                this.addLoading = true;
                const params = {
                    uploadName: this.addForm.uploadName,
                    roadId: this.addForm.roadId,
                    roadName: this.addForm.roadId,
                    images: this.addForm.imageList.map(item => item.file)
                };
                createMonitorRecord(params).then(res => {
                    if (res === "success") {
                        this.$message.success("新增成功");
                        this.addVisible = false;
                        this.query.pageNum = 1;
                        this.fetchList();
                    } else {
                        this.$message.error(res && res.msg ? res.msg : "新增失败");
                    }
                }).catch(() => {
                    this.$message.error("新增失败");
                }).finally(() => {
                    this.addLoading = false;
                });
            });
        },
        statusLabel(status) {
            return { 0: "待检测", 1: "检测完成", 2: "检测失败" }[status] || "-";
        },
        statusType(status) {
            return { 0: "info", 1: "success", 2: "danger" }[status] || "info";
        },
        formatTime(time) {
            return time ? String(time).replace("T", " ").slice(0, 19) : "-";
        }
    }
};
</script>

<style lang="scss" scoped>
.table-title {
    font-size: 15px;
    font-weight: 600;
    color: #343a40;
}

.record-uploader {
    ::v-deep .el-upload {
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        width: 120px;
        height: 120px;
        display: inline-block;

        &:hover {
            border-color: #409eff;
        }
    }

    .upload-box {
        width: 120px;
        height: 120px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        i {
            font-size: 28px;
            color: #c0c4cc;
        }

        .upload-text {
            font-size: 12px;
            color: #909399;
            margin-top: 8px;
        }
    }

    .upload-preview {
        width: 120px;
        height: 120px;
        position: relative;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .upload-actions {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 28px;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;

            span {
                color: #fff;
                cursor: pointer;
                font-size: 14px;
            }
        }
    }
}

.danger-text {
    color: #f56c6c;
}

.detail-wrap {
    padding: 10px 20px;

    .detail-item {
        display: flex;
        margin-bottom: 18px;
        font-size: 14px;
        line-height: 1.5;

        &:last-child {
            margin-bottom: 0;
        }

        .detail-label {
            width: 80px;
            color: #909399;
            flex-shrink: 0;
        }

        .detail-value {
            flex: 1;
            color: #303133;
            word-break: break-all;
        }
    }
}

.detail-image-list {
    display: flex;
    gap: 12px;

    .detail-image {
        width: 120px;
        height: 120px;
        border-radius: 6px;
        border: 1px solid #ebeef5;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &:hover {
            transform: scale(1.04);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        ::v-deep img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
    }
}

.image-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .preview-item {
        width: 120px;
        height: 120px;
        position: relative;
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid #ebeef5;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .upload-actions {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 28px;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;

            span {
                color: #fff;
                cursor: pointer;
                font-size: 14px;
            }
        }
    }
}

.upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
}
</style>
