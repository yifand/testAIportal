<template>
  <div class="interpret-page">
    <div class="page-top-action">
      <div class="filters">
        <el-input v-model="query.taskName" placeholder="任务名称" size="small" clearable class="f-item"
          @keyup.enter.native="reload" />
        <el-input v-model="query.imageName" placeholder="影像名称" size="small" clearable class="f-item"
          @keyup.enter.native="reload" />
        <el-select v-model="query.taskStatus" placeholder="任务状态" size="small" clearable class="f-item"
          @change="reload">
          <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-select v-model="query.taskType" placeholder="任务类型" size="small" clearable class="f-item"
          @change="reload">
          <el-option v-for="t in taskTypeOptions" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
        <el-select v-model="query.modelTypeId" placeholder="模型类型" size="small" clearable class="f-item" 
          @change="reload">
          <el-option v-for="t in modelTypesFlat" :key="t.typeId" :label="t.typeName" :value="t.typeId" />
        </el-select>
        <el-date-picker v-model="query.dateRange" type="datetimerange" range-separator="至" size="small"
          start-placeholder="开始" end-placeholder="结束" value-format="yyyy-MM-dd HH:mm:ss" class="f-item wide"
          @change="reload" />
        <el-button type="default" size="small" @click="resetFilters">重置</el-button>
      </div>
      <div class="actions">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="openCreate">新建任务</el-button>
        <el-button type="danger" size="small" plain :disabled="!selection.length" @click="batchDelete(false)">批量删除</el-button>
        <el-button type="danger" size="small" plain :disabled="!selection.length"
          @click="batchDelete(true)">批量删除并清理结果文件</el-button>
      </div>
    </div>

    <div class="table-card" v-loading="loading">
      <el-table :data="tableData" stripe style="width: 100%" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="48" :selectable="rowSelectable" />
        <el-table-column prop="id" label="任务ID" width="88" />
        <el-table-column prop="taskName" label="任务名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="类型" width="108" align="center">
          <template slot-scope="scope">
            <el-tag size="mini" :type="scope.row.taskType === 'CHANGE_DETECT' ? 'warning' : 'info'">
              {{ taskTypeLabel(scope.row.taskType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="imageCount" label="影像数" width="80" align="center" />
        <el-table-column prop="modelNames" label="选用模型" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <span :class="['status-pill', 'st-' + scope.row.taskStatus]">{{ statusLabel(scope.row.taskStatus) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170">
          <template slot-scope="scope">{{ formatTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="进度" width="100" align="center">
          <template slot-scope="scope">{{ formatProgress(scope.row.progress) }}</template>
        </el-table-column>
        <el-table-column label="影像总大小(GB)" width="120" align="right">
          <template slot-scope="scope">{{ formatSize(scope.row.totalSizeGb) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="340" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" :disabled="!canBrowseChange(scope.row)"
              @click="browseChange(scope.row)">对比</el-button>
            <el-button type="text" size="small" :disabled="!canStart(scope.row)"
              @click="startTask(scope.row)">执行</el-button>
            <el-button type="text" size="small" :disabled="!canStop(scope.row)"
              @click="stopTask(scope.row)">终止</el-button>
            <el-button type="text" size="small" :disabled="!canSync(scope.row)"
              @click="syncStatus(scope.row)">同步</el-button>
            <el-button type="text" size="small" :disabled="!canEdit(scope.row)"
              @click="openEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="small" class="text-red" :disabled="!canDelete(scope.row)"
              @click="removeOne(scope.row, false)">删除</el-button>
          </template>
        </el-table-column>
        <template slot="empty">
          <el-empty description="暂无解译任务"></el-empty>
        </template>
      </el-table>
      <div class="pager" v-if="total > 0">
        <el-pagination layout="total, prev, pager, next, sizes" :total="total" :page-size="query.pageSize"
          :current-page.sync="query.pageNum" :page-sizes="[10, 20, 50]" @size-change="reload"
          @current-change="loadList" />
      </div>
    </div>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="720px" :close-on-click-modal="false"
      custom-class="interpret-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" size="small">
        <el-form-item label="任务名称" prop="taskName">
          <el-input v-model="form.taskName" maxlength="255" show-word-limit placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.taskTag" placeholder="如：海岸带/季度巡检" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="form.priority">
            <el-radio :label="1">普通</el-radio>
            <el-radio :label="2">加急</el-radio>
            <el-radio :label="3">最高</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="任务类型" prop="taskType">
          <el-radio-group v-model="form.taskType" :disabled="!isCreate" @change="onTaskTypeChange">
            <el-radio label="SINGLE">单时相解译</el-radio>
            <el-radio label="CHANGE_DETECT">双时相变化检测</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="原始影像" prop="imageIds" v-if="isCreate">
          <div class="picker-hint" v-if="isChangeDetect">
            变化检测须选 <b>2</b> 张影像：按勾选顺序，第 1 张为前期 T1，第 2 张为后期 T2。
          </div>
          <div class="picker-hint" v-else>仅创建可选影像；编辑时影像源不可改。</div>
          <div class="picker-toolbar">
            <el-input v-model="imageKeyword" placeholder="搜索影像" size="small" clearable class="grow"
              @keyup.enter.native="loadImagePicker" />
            <el-button size="small" @click="loadImagePicker">查询</el-button>
          </div>
          <el-table ref="imgTable" :data="imageRows" height="220" size="small" @selection-change="onImageSelect">
            <el-table-column type="selection" width="45" />
            <el-table-column prop="imageName" label="文件名" min-width="160" show-overflow-tooltip />
            <el-table-column label="拍摄时间" width="110" v-if="isChangeDetect">
              <template slot-scope="scope">{{ formatShootTime(scope.row.shootTime) }}</template>
            </el-table-column>
            <el-table-column prop="imageSize" label="大小(GB)" width="90" />
            <el-table-column prop="resolution" label="分辨率" width="80" />
            <el-table-column prop="bandNumber" label="波段" width="60" />
          </el-table>
          <div class="picker-pager">
            <el-pagination small layout="prev, pager, next" :total="imageTotal" :page-size="imagePageSize"
              :current-page.sync="imagePage" @current-change="loadImagePicker" />
          </div>
          <div v-if="isChangeDetect && orderedSelectedImages.length" class="selected-order">
            <span class="order-label">已选顺序：</span>
            <el-tag v-for="(im, idx) in orderedSelectedImages" :key="im.id" size="mini" style="margin: 2px">
              {{ idx === 0 ? "T1" : "T2" }} {{ im.imageName }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="已选影像" v-else>
          <el-tag v-for="im in form.imagesLocked" :key="im.id" style="margin: 4px">{{ im.imageName }}</el-tag>
        </el-form-item>

        <el-form-item label="AI模型" prop="modelIds">
          <el-select v-model="form.modelIds" multiple filterable placeholder="按类型分组多选" style="width: 100%">
            <el-option-group v-for="grp in modelTree" :key="grp.typeId" :label="grp.typeName">
              <el-option v-for="m in grp.models" :key="m.modelId" :label="m.modelName" :value="m.modelId" />
            </el-option-group>
          </el-select>
        </el-form-item>

        <el-form-item label="模型说明">
          <div class="plan-box" v-if="selectedPlans.length">
            <div v-for="(p, idx) in selectedPlans" :key="idx" class="plan-item">
              <div class="plan-title">{{ p.modelName }}</div>
              <div class="plan-scene" v-if="p.scene">适用：{{ p.scene }}</div>
              <div class="plan-desc">{{ p.modelExplain || "暂无简介" }}</div>
            </div>
          </div>
          <span v-else class="text-muted">选择模型后展示 model_plan 说明</span>
        </el-form-item>

        <el-form-item label="分片尺寸">
          <el-input v-model="form.sliceSize" placeholder="如 2048*2048" />
        </el-form-item>
        <el-form-item label="置信度阈值">
          <el-slider v-model="form.confidencePercent" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="保留切片">
          <el-switch v-model="form.keepSliceBool" active-text="是" inactive-text="否" />
        </el-form-item>
        <el-form-item label="输出格式">
          <el-checkbox-group v-model="form.outputFormats">
            <el-checkbox label="png">PNG 预览</el-checkbox>
            <el-checkbox label="tif">TIF 栅格</el-checkbox>
            <el-checkbox label="shp">SHP 矢量</el-checkbox>
            <el-checkbox label="json">JSON 标注</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.taskRemark" type="textarea" :rows="2" placeholder="任务备注（选填）" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">{{ isCreate ? "创建" : "保存" }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  fetchInterpretTasks,
  getInterpretTask,
  createInterpretTask,
  updateInterpretTask,
  deleteInterpretTask,
  batchDeleteInterpretTasks,
  fetchRsModelOptions,
  fetchRsImages,
  startInterpretTask,
  stopInterpretTask,
  syncInterpretTaskStatus,
  TASK_TYPE_SINGLE,
  TASK_TYPE_CHANGE_DETECT,
} from "@/api/rsInterpret";

export default {
  name: "RemoteInterpretTask",
  data() {
    return {
      loading: false,
      saving: false,
      tableData: [],
      total: 0,
      selection: [],
      query: {
        taskName: "",
        imageName: "",
        taskStatus: null,
        taskType: null,
        modelTypeId: null,
        dateRange: [],
        pageNum: 1,
        pageSize: 10,
      },
      taskTypeOptions: [
        { label: "单时相解译", value: TASK_TYPE_SINGLE },
        { label: "变化检测", value: TASK_TYPE_CHANGE_DETECT },
      ],
      statusOptions: [
        { label: "未执行", value: 0 },
        { label: "排队中", value: 1 },
        { label: "运行中", value: 2 },
        { label: "已完成", value: 3 },
        { label: "执行失败", value: 4 },
        { label: "已终止", value: 5 },
      ],
      modelTree: [],
      dialogVisible: false,
      isCreate: true,
      editId: null,
      form: {
        taskName: "",
        taskRemark: "",
        taskTag: "",
        taskType: TASK_TYPE_SINGLE,
        priority: 1,
        imageIds: [],
        imagesLocked: [],
        modelIds: [],
        sliceSize: "2048*2048",
        confidencePercent: 50,
        keepSliceBool: false,
        outputFormats: ["png", "tif", "shp"],
      },
      rules: {
        taskName: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
        imageIds: [{
          validator: (r, v, cb) => {
            if (!this.isCreate) return cb();
            if (!v || !v.length) cb(new Error("请选择影像"));
            else if (this.isChangeDetect && v.length !== 2) cb(new Error("变化检测须选择 2 张影像"));
            else cb();
          }, trigger: "change"
        }],
        modelIds: [{ type: "array", required: true, message: "请选择模型", trigger: "change" }],
        priority: [{ required: true, message: "请选择优先级", trigger: "change" }],
      },
      imageKeyword: "",
      imageRows: [],
      imageTotal: 0,
      imagePage: 1,
      imagePageSize: 8,
      imageCache: {},
    };
  },
  computed: {
    isChangeDetect() {
      return this.form.taskType === TASK_TYPE_CHANGE_DETECT;
    },
    orderedSelectedImages() {
      const ids = this.form.imageIds || [];
      return ids.map((id) => this.imageCache[id]).filter(Boolean);
    },
    dialogTitle() {
      return this.isCreate ? "新建解译任务" : "编辑解译任务";
    },
    modelTypesFlat() {
      return (this.modelTree || []).map((t) => ({ typeId: t.typeId, typeName: t.typeName }));
    },
    selectedPlans() {
      const ids = new Set(this.form.modelIds || []);
      const out = [];
      for (const g of this.modelTree || []) {
        for (const m of g.models || []) {
          if (ids.has(m.modelId) && m.plan) out.push(m.plan);
        }
      }
      return out;
    },
  },
  created() {
    this.bootstrap();
  },
  methods: {
    blankForm() {
      return {
        taskName: "",
        taskRemark: "",
        taskTag: "",
        taskType: TASK_TYPE_SINGLE,
        priority: 1,
        imageIds: [],
        imagesLocked: [],
        modelIds: [],
        sliceSize: "2048*2048",
        confidencePercent: 50,
        keepSliceBool: false,
        outputFormats: ["png", "tif", "shp"],
      };
    },
    async bootstrap() {
      await this.loadModelTree();
      this.loadList();
    },
    async loadModelTree() {
      const res = await fetchRsModelOptions();
      if (res && res.code === 200 && Array.isArray(res.data)) {
        this.modelTree = res.data;
      } else {
        this.modelTree = [];
      }
    },
    taskTypeLabel(v) {
      if (v === TASK_TYPE_CHANGE_DETECT) return "变化检测";
      return "单时相";
    },
    formatShootTime(t) {
      if (!t) return "-";
      return String(t).slice(0, 10);
    },
    statusLabel(v) {
      const f = this.statusOptions.find((s) => s.value === v);
      return f ? f.label : "-";
    },
    formatTime(t) {
      if (!t) return "-";
      return String(t).replace("T", " ").slice(0, 16);
    },
    formatProgress(p) {
      if (p === null || p === undefined) return "0%";
      const n = Number(p);
      if (Number.isNaN(n)) return "0%";
      return `${n.toFixed(0)}%`;
    },
    formatSize(s) {
      if (s === null || s === undefined) return "-";
      const n = Number(s);
      if (Number.isNaN(n)) return "-";
      return n.toFixed(2);
    },
    rowSelectable(row) {
      return row.taskStatus !== 2;
    },
    canEdit(row) {
      const st = row.taskStatus;
      return st === 0 || st === 1;
    },
    canDelete(row) {
      return row.taskStatus !== 2;
    },
    canStart(row) {
      return row.taskStatus === 0 || row.taskStatus === 4;
    },
    canStop(row) {
      return row.taskStatus === 1 || row.taskStatus === 2;
    },
    canSync(row) {
      return row.taskStatus === 1 || row.taskStatus === 2;
    },
    canBrowseChange(row) {
      return row.taskType === TASK_TYPE_CHANGE_DETECT && row.taskStatus === 3;
    },
    onTaskTypeChange() {
      if (this.isChangeDetect && (this.form.imageIds || []).length > 2) {
        this.form.imageIds = this.form.imageIds.slice(0, 2);
      }
    },
    reload() {
      this.query.pageNum = 1;
      this.loadList();
    },
    resetFilters() {
      this.query = {
        taskName: "",
        imageName: "",
        taskStatus: null,
        taskType: null,
        modelTypeId: null,
        dateRange: [],
        pageNum: 1,
        pageSize: this.query.pageSize,
      };
      this.loadList();
    },
    async loadList() {
      this.loading = true;
      const q = {
        pageNum: this.query.pageNum,
        pageSize: this.query.pageSize,
        taskName: this.query.taskName || undefined,
        imageName: this.query.imageName || undefined,
        taskStatus: this.query.taskStatus,
        taskType: this.query.taskType || undefined,
        modelTypeId: this.query.modelTypeId || undefined,
        startTime: this.query.dateRange && this.query.dateRange[0],
        endTime: this.query.dateRange && this.query.dateRange[1],
      };
      try {
        const res = await fetchInterpretTasks(q);
        if (res && res.code === 200 && res.data) {
          this.tableData = res.data.records || [];
          this.total = res.data.total || 0;
        } else {
          this.tableData = [];
          this.total = 0;
        }
      } finally {
        this.loading = false;
      }
    },
    onSelectionChange(rows) {
      this.selection = rows || [];
    },
    openCreate() {
      this.isCreate = true;
      this.editId = null;
      this.form = this.blankForm();
      this.imageKeyword = "";
      this.imagePage = 1;
      this.dialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.formRef) this.$refs.formRef.clearValidate();
        this.loadImagePicker();
      });
    },
    async openEdit(row) {
      this.isCreate = false;
      this.editId = row.id;
      this.dialogVisible = true;
      const res = await getInterpretTask(row.id);
      if (!res || res.code !== 200 || !res.data) {
        this.$message.error(res.msg || "加载失败");
        this.dialogVisible = false;
        return;
      }
      const d = res.data;
      this.form = {
        taskName: d.taskName,
        taskRemark: d.taskRemark || "",
        taskTag: d.taskTag || "",
        taskType: d.taskType || TASK_TYPE_SINGLE,
        priority: d.priority || 1,
        imageIds: d.imageIds || [],
        imagesLocked: d.images || [],
        modelIds: d.modelIds || [],
        sliceSize: d.sliceSize || "2048*2048",
        confidencePercent: d.confidenceThreshold != null ? Math.round(Number(d.confidenceThreshold) * 100) : 50,
        keepSliceBool: !!d.keepSlice,
        outputFormats: d.outputFormat ? d.outputFormat.split(",").map((x) => x.trim()).filter(Boolean) : ["png", "tif", "shp"],
      };
      this.$nextTick(() => {
        if (this.$refs.formRef) this.$refs.formRef.clearValidate();
      });
    },
    async loadImagePicker() {
      const res = await fetchRsImages({
        keyword: this.imageKeyword || undefined,
        pageNum: this.imagePage,
        pageSize: this.imagePageSize,
      });
      if (res && res.code === 200 && res.data) {
        this.imageRows = res.data.records || [];
        this.imageTotal = res.data.total || 0;
        this.imageRows.forEach((row) => { this.imageCache[row.id] = row; });
        this.$nextTick(() => this.syncImageSelection());
      }
    },
    syncImageSelection() {
      const t = this.$refs.imgTable;
      if (!t) return;
      t.clearSelection();
      const set = new Set(this.form.imageIds || []);
      this.imageRows.forEach((row) => {
        if (set.has(row.id)) t.toggleRowSelection(row, true);
      });
    },
    onImageSelect(rows) {
      const selectedOnPage = (rows || []).map((r) => r.id);
      const currentPageIds = this.imageRows.map((r) => r.id);
      let next = (this.form.imageIds || []).filter((id) => !currentPageIds.includes(id));
      selectedOnPage.forEach((id) => {
        if (!next.includes(id)) next.push(id);
      });
      if (this.isChangeDetect && next.length > 2) {
        this.$message.warning("变化检测最多选择 2 张影像（T1 + T2）");
        next = next.slice(0, 2);
      }
      this.form.imageIds = next;
      (rows || []).forEach((r) => { this.imageCache[r.id] = r; });
    },
    payloadFromForm() {
      return {
        id: this.isCreate ? undefined : this.editId,
        taskName: this.form.taskName,
        taskRemark: this.form.taskRemark,
        taskTag: this.form.taskTag,
        taskType: this.form.taskType,
        priority: this.form.priority,
        imageIds: this.isCreate ? this.form.imageIds : undefined,
        modelIds: this.form.modelIds,
        sliceSize: this.form.sliceSize,
        confidencePercent: this.form.confidencePercent,
        keepSlice: this.form.keepSliceBool ? 1 : 0,
        outputFormats: this.form.outputFormats,
      };
    },
    submit() {
      this.$refs.formRef.validate(async (ok) => {
        if (!ok) return;
        this.saving = true;
        try {
          const body = this.payloadFromForm();
          let res;
          if (this.isCreate) res = await createInterpretTask(body);
          else res = await updateInterpretTask(body);
          if (res && res.code === 200) {
            this.$message.success(this.isCreate ? "创建成功" : "保存成功");
            this.dialogVisible = false;
            this.loadList();
          }
        } finally {
          this.saving = false;
        }
      });
    },
    removeOne(row, withFiles) {
      const tip = withFiles ? "删除任务并尝试删除本次解译结果文件？原始 TIFF 不会删除。" : "仅删除任务记录（软删除），解译结果文件保留？";
      this.$confirm(tip, "提示", { type: "warning" }).then(async () => {
        const res = await deleteInterpretTask(row.id, withFiles);
        if (res && res.code === 200) {
          this.$message.success("已删除");
          this.loadList();
        }
      }).catch(() => { });
    },
    batchDelete(withFiles) {
      const ok = this.selection.filter((r) => r.taskStatus !== 2);
      if (!ok.length) {
        this.$message.warning("所选中含运行中任务或无可删项");
        return;
      }
      const tip = withFiles ? "批量删除并尝试删除对应结果文件？" : "批量删除任务记录？";
      this.$confirm(tip, "提示", { type: "warning" }).then(async () => {
        const res = await batchDeleteInterpretTasks({
          ids: ok.map((r) => r.id),
          deleteResultFiles: withFiles,
        });
        if (res && res.code === 200) {
          this.$message.success("已删除");
          this.loadList();
        }
      }).catch(() => { });
    },
    startTask(row) {
      const tip = row.taskType === TASK_TYPE_CHANGE_DETECT
        ? "提交双时相变化检测到远端大模型执行？"
        : "提交到远端大模型执行？将使用影像 FTP 路径调用解译服务。";
      this.$confirm(tip, "提示", { type: "info" })
        .then(async () => {
          const res = await startInterpretTask(row.id);
          if (res && res.code === 200) {
            this.$message.success("已提交执行");
            this.loadList();
          }
        }).catch(() => {});
    },
    stopTask(row) {
      this.$confirm("确认终止该任务？", "提示", { type: "warning" }).then(async () => {
        const res = await stopInterpretTask(row.id);
        if (res && res.code === 200) {
          this.$message.success("已终止");
          this.loadList();
        }
      }).catch(() => {});
    },
    syncStatus(row) {
      syncInterpretTaskStatus(row.id).then((res) => {
        if (res && res.code === 200) {
          this.$message.success("已同步远端状态");
          this.loadList();
        }
      });
    },
    browseChange(row) {
      this.$router.push({ path: "/remote/change-compare", query: { taskId: row.id } });
    },
  },
};
</script>

<style lang="scss" scoped>
.interpret-page {
  padding: 16px;

  .page-top-action {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    .f-item {
      width: 140px;
    }

    .f-item.wide {
      width: 360px;
    }
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .table-card {
    background: #fff;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .pager {
    margin-top: 12px;
    text-align: right;
  }

  .status-pill {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    background: #f0f2f5;
    color: #333;
  }

  .st-0 {
    background: #eef1f6;
  }

  .st-1 {
    background: #e6f7ff;
    color: #1890ff;
  }

  .st-2 {
    background: #fff7e6;
    color: #fa8c16;
  }

  .st-3 {
    background: #f6ffed;
    color: #52c41a;
  }

  .st-4 {
    background: #fff1f0;
    color: #f5222d;
  }

  .st-5 {
    background: #f5f5f5;
    color: #666;
  }

  .text-red {
    color: #f56c6c;
  }

  .text-muted {
    color: #909399;
    font-size: 13px;
  }

  .picker-hint {
    font-size: 12px;
    color: #909399;
    margin-bottom: 6px;
  }

  .picker-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;

    .grow {
      flex: 1;
    }
  }

  .picker-pager {
    margin-top: 8px;
    text-align: right;
  }

  .selected-order {
    margin-top: 8px;
    font-size: 12px;
    color: #606266;
    .order-label { margin-right: 4px; }
  }

  .plan-box {
    max-height: 200px;
    overflow: auto;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 8px;
    background: #fafbfc;
  }

  .plan-item {
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .plan-title {
    font-weight: 600;
    font-size: 13px;
  }

  .plan-scene {
    font-size: 12px;
    color: #606266;
    margin: 4px 0;
  }

  .plan-desc {
    font-size: 12px;
    color: #606266;
    line-height: 1.5;
  }
}
</style>