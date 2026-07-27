<template>
  <div class="data-page">
    <div class="summary-bar">
      <span>已登记 <strong>{{ total }}</strong> 条影像</span>
      <span class="sep">|</span>
      <span>原始影像库合计 <strong>{{ formatSize(totalSizeGb) }}</strong> GB</span>
    </div>

    <div class="page-top-action">
      <div class="filters">
        <el-input v-model="query.keyword" placeholder="文件名/路径" size="small" clearable class="f-item"
          @keyup.enter.native="reload" />
        <el-button type="default" size="small" @click="reload">查询</el-button>
        <el-button type="default" size="small" @click="resetFilters">重置</el-button>
      </div>
      <div class="actions">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="openCreate">登记影像</el-button>
        <el-button type="success" size="small" icon="el-icon-upload2" @click="ftpDialogVisible = true">FTP 同步</el-button>
      </div>
    </div>

    <div class="table-card" v-loading="loading">
      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="imageName" label="文件名" min-width="160" show-overflow-tooltip />
        <el-table-column prop="imagePath" label="FTP/存储路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="imageSize" label="大小(GB)" width="90" align="right" />
        <el-table-column prop="resolution" label="分辨率" width="80" />
        <el-table-column prop="bandNumber" label="波段" width="60" align="center" />
        <el-table-column label="拍摄时间" width="155">
          <template slot-scope="scope">{{ formatTime(scope.row.shootTime) }}</template>
        </el-table-column>
        <el-table-column label="范围(经纬度)" min-width="180" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.minLon">{{ scope.row.minLon }},{{ scope.row.minLat }} ~ {{ scope.row.maxLon }},{{ scope.row.maxLat }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="openEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="small" class="text-red" @click="removeOne(scope.row)">删除</el-button>
          </template>
        </el-table-column>
        <template slot="empty"><el-empty description="暂无遥感影像数据" /></template>
      </el-table>
      <div class="pager" v-if="total > 0">
        <el-pagination layout="total, prev, pager, next, sizes" :total="total" :page-size="query.pageSize"
          :current-page.sync="query.pageNum" :page-sizes="[10, 20, 50]" @size-change="reload" @current-change="loadList" />
      </div>
    </div>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="640px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" size="small">
        <el-form-item label="文件名" prop="imageName">
          <el-input v-model="form.imageName" placeholder="如 scene_2024_01.tif" />
        </el-form-item>
        <el-form-item label="存储路径" prop="imagePath">
          <el-input v-model="form.imagePath" placeholder="如 /remote/data/xxx.tif" />
        </el-form-item>
        <el-form-item label="大小(GB)" prop="imageSize">
          <el-input-number v-model="form.imageSize" :min="0.01" :precision="2" :step="0.1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="格式">
          <el-input v-model="form.imageSuffix" placeholder="tiff" />
        </el-form-item>
        <el-form-item label="分辨率">
          <el-input v-model="form.resolution" placeholder="0.5m" />
        </el-form-item>
        <el-form-item label="波段数">
          <el-input-number v-model="form.bandNumber" :min="1" :max="32" />
        </el-form-item>
        <el-form-item label="拍摄时间">
          <el-date-picker v-model="form.shootTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="经纬度范围">
          <div class="bbox-row">
            <el-input v-model="form.minLon" placeholder="最小经度" />
            <el-input v-model="form.minLat" placeholder="最小纬度" />
            <el-input v-model="form.maxLon" placeholder="最大经度" />
            <el-input v-model="form.maxLat" placeholder="最大纬度" />
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </div>
    </el-dialog>

    <el-dialog title="从 FTP 同步影像" :visible.sync="ftpDialogVisible" width="520px">
      <el-form :model="ftpForm" label-width="100px" size="small">
        <el-form-item label="FTP 路径">
          <el-input v-model="ftpForm.ftpPath" placeholder="/remote/data" />
        </el-form-item>
        <el-form-item label="递归扫描">
          <el-switch v-model="ftpForm.recursive" />
        </el-form-item>
        <el-form-item label="后缀过滤">
          <el-input v-model="ftpForm.suffixFilter" placeholder="tif,tiff" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="ftpDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="syncing" @click="doFtpSync">开始同步</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  fetchDataImages, createDataImage, updateDataImage, deleteDataImage, syncFtpData,
} from "@/api/rsData";

export default {
  name: "RemoteSensingDataManagement",
  data() {
    return {
      loading: false,
      saving: false,
      syncing: false,
      tableData: [],
      total: 0,
      totalSizeGb: 0,
      query: { keyword: "", pageNum: 1, pageSize: 10 },
      dialogVisible: false,
      isCreate: true,
      editId: null,
      form: this.blankForm(),
      rules: {
        imageName: [{ required: true, message: "请输入文件名", trigger: "blur" }],
        imagePath: [{ required: true, message: "请输入路径", trigger: "blur" }],
        imageSize: [{ required: true, message: "请输入大小", trigger: "blur" }],
      },
      ftpDialogVisible: false,
      ftpForm: { ftpPath: "/remote/data", recursive: true, suffixFilter: "tif,tiff" },
    };
  },
  computed: {
    dialogTitle() {
      return this.isCreate ? "登记遥感影像" : "编辑影像元数据";
    },
  },
  created() {
    this.loadList();
  },
  methods: {
    blankForm() {
      return {
        imageName: "", imagePath: "", imageSize: 1.0, imageSuffix: "tiff",
        resolution: "", bandNumber: 4, shootTime: "", minLon: "", minLat: "", maxLon: "", maxLat: "",
      };
    },
    formatTime(t) {
      return t ? String(t).replace("T", " ").slice(0, 19) : "-";
    },
    formatSize(v) {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : "0.00";
    },
    reload() {
      this.query.pageNum = 1;
      this.loadList();
    },
    resetFilters() {
      this.query = { keyword: "", pageNum: 1, pageSize: this.query.pageSize };
      this.loadList();
    },
    async loadList() {
      this.loading = true;
      try {
        const res = await fetchDataImages({
          keyword: this.query.keyword || undefined,
          pageNum: this.query.pageNum,
          pageSize: this.query.pageSize,
        });
        if (res && res.code === 200 && res.data) {
          this.tableData = res.data.records || [];
          this.total = res.data.total || 0;
          this.totalSizeGb = res.data.totalSizeGb != null ? res.data.totalSizeGb : 0;
        }
      } finally {
        this.loading = false;
      }
    },
    openCreate() {
      this.isCreate = true;
      this.editId = null;
      this.form = this.blankForm();
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.formRef && this.$refs.formRef.clearValidate());
    },
    openEdit(row) {
      this.isCreate = false;
      this.editId = row.id;
      this.form = {
        imageName: row.imageName, imagePath: row.imagePath, imageSize: Number(row.imageSize),
        imageSuffix: row.imageSuffix || "tiff", resolution: row.resolution || "",
        bandNumber: row.bandNumber, shootTime: row.shootTime ? String(row.shootTime).replace("T", " ").slice(0, 19) : "",
        minLon: row.minLon, minLat: row.minLat, maxLon: row.maxLon, maxLat: row.maxLat,
      };
      this.dialogVisible = true;
    },
    payloadFromForm() {
      const p = { ...this.form, id: this.isCreate ? undefined : this.editId };
      ["minLon", "minLat", "maxLon", "maxLat"].forEach((k) => {
        if (p[k] === "" || p[k] == null) p[k] = null;
        else p[k] = Number(p[k]);
      });
      return p;
    },
    submit() {
      this.$refs.formRef.validate(async (ok) => {
        if (!ok) return;
        this.saving = true;
        try {
          const body = this.payloadFromForm();
          const res = this.isCreate ? await createDataImage(body) : await updateDataImage(body);
          if (res && res.code === 200) {
            this.$message.success("保存成功");
            this.dialogVisible = false;
            this.loadList();
          }
        } finally {
          this.saving = false;
        }
      });
    },
    removeOne(row) {
      this.$confirm("确认删除该影像元数据？（软删除，不影响 FTP 原文件）", "提示", { type: "warning" })
        .then(async () => {
          const res = await deleteDataImage(row.id);
          if (res && res.code === 200) {
            this.$message.success("已删除");
            this.loadList();
          }
        }).catch(() => {});
    },
    async doFtpSync() {
      if (!this.ftpForm.ftpPath) {
        this.$message.warning("请输入 FTP 路径");
        return;
      }
      this.syncing = true;
      try {
        const res = await syncFtpData(this.ftpForm);
        if (res && res.code === 200) {
          this.$message.success(res.data.message || "同步完成");
          this.ftpDialogVisible = false;
          this.loadList();
        }
      } finally {
        this.syncing = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.data-page { padding: 16px; }
.summary-bar {
  margin-bottom: 12px; padding: 10px 14px; background: #f6ffed; border: 1px solid #b7eb8f;
  border-radius: 6px; font-size: 13px; color: #389e0d;
}
.summary-bar .sep { margin: 0 10px; color: #95de64; }
.summary-bar strong { font-weight: 600; }
.page-top-action { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.filters, .actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.f-item { width: 200px; }
.table-card { background: #fff; border-radius: 8px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.pager { margin-top: 12px; text-align: right; }
.text-red { color: #f56c6c; }
.bbox-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
</style>
