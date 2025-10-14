<template>
  <div class="group-container">
    <!-- 左侧分组树形列表 -->
    <div class="group-left">
      <div class="group-header">
        <span>主机分组</span>
        <el-button type="text" size="small" @click="showCreateDialog" :icon="Plus" />
      </div>
      <el-tree
        :data="groupList"
        :props="treeProps"
        @node-click="handleNodeClick"
        highlight-current
        default-expand-all
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <span v-if="editingId !== data.id">{{ node.label }}</span>
            <el-input
              v-else
              v-model="editName"
              size="small"
              @blur="submitEdit(data)"
              @keyup.enter="submitEdit(data)"
              autofocus
            />
            <span class="tree-actions" v-if="data.id && editingId !== data.id">
              <el-button type="text" size="small" @click.stop="startEdit(data)" :icon="Edit" />
              <el-button type="text" size="small" @click.stop="deleteGroup(data)" :icon="Delete" />
            </span>
          </span>
        </template>
      </el-tree>
    </div>

    <!-- 右侧主机分页列表 -->
    <div class="group-right">
      <div class="host-header">
        <span>主机列表</span>
        <el-button type="danger" size="small" plain @click="removeHostFromGroup" :disabled="!currentGroupId || selectedRemoveHostIds.length === 0">移除</el-button>
        <el-button type="primary" size="small" plain @click="showAddHostDialog" :disabled="!currentGroupId">添加</el-button>
      </div>
      <el-table :data="hostList" style="width: 100%" v-loading="loading" @selection-change="handleRemoveSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="主机ID" />
        <el-table-column prop="name" label="主机名称" />
        <el-table-column prop="spec" label="主机规格" />
        <el-table-column prop="ip" label="IP地址" />
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 30]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        style="margin-top: 10px;"
      />
    </div>

    <!-- 创建分组对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建分组">
      <el-form :model="createForm">
        <el-form-item label="父级分组">
            <el-cascader
                :options="groupList"
                :props="{ checkStrictly: true, value: 'id', label: 'name' }"
                placeholder="请选择上级菜单"
                clearable
                class="w100"
                v-model="parentIds"
            >
                <template #default="{ node, data }">
                    <span>{{ data.name }}</span>
                    <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
                </template>
            </el-cascader>
        </el-form-item>
        <el-form-item label="分组名称">
          <el-input v-model="createForm.name" placeholder="请输入分组名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="onGroupCancel">取消</el-button>
        <el-button type="primary" @click="createGroup">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加主机对话框 -->
    <el-dialog v-model="addHostDialogVisible" title="添加主机">
      <el-table :data="availableHostList" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="主机ID" />
        <el-table-column prop="name" label="主机名称" />
        <el-table-column prop="ip" label="IP地址" />
      </el-table>
      <el-pagination
        @size-change="handleAvailableHostSizeChange"
        @current-change="handleAvailableHostCurrentChange"
        :current-page="availableHostCurrentPage"
        :page-sizes="[10, 20, 30]"
        :page-size="availableHostPageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="availableHostTotal"
        style="margin-top: 10px;"
      />
      <template #footer>
        <el-button @click="addHostDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addHostsToGroup">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useGroupApi } from '/@/api/group';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Edit, } from '@element-plus/icons-vue'

const groupApi = useGroupApi();

// 分组列表
const groupList = ref([]);
const treeProps = {
  children: 'children',
  label: 'name',
};

const parentIds = ref([]); // 级联选择的父级ID数组

// 主机列表
const hostList = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const currentGroupId = ref('');

// 创建分组对话框
const createDialogVisible = ref(false);
const createForm = reactive({
  parentId: '',
  name: '',
});

// 添加主机对话框
const addHostDialogVisible = ref(false);
const availableHostList = ref([]);
const loadingAvailableHosts = ref(false);
const availableHostCurrentPage = ref(1);
const availableHostPageSize = ref(10);
const availableHostTotal = ref(0);

// 初始化分组列表
const fetchGroupList = async () => {
  const res = await groupApi.getGroupTree();
  if (res && res.code === 200) {
    groupList.value = res.data;
  }
};

// 初始化主机列表
const fetchHostList = async () => {
  if (!currentGroupId.value) return;
  loading.value = true;
  const res = await groupApi.pageGroupInstance({
    groupId: currentGroupId.value,
    pageNum: currentPage.value,
    pageSize: pageSize.value,
  });
  if (res && res.code === 200) {
    hostList.value = res.data.data;
    total.value = res.data.total;
  }
  loading.value = false;
};

// 点击分组节点
const handleNodeClick = (data: any) => {
  currentGroupId.value = data.id;
  fetchHostList();
};

// 显示创建分组对话框
const showCreateDialog = () => {
  createDialogVisible.value = true;
};

// 创建分组对话框按钮取消
const onGroupCancel = () => {
    createDialogVisible.value = false;
    createForm.name = '';
    parentIds.value = [];
};

// 创建分组
const createGroup = async () => {
    let parentId = parentIds.value[parentIds.value.length - 1];
    createForm.parentId = String(parentId);
    const res = await groupApi.addGroup(createForm);
    if (res && res.code === 200) {
        createDialogVisible.value = false;
        fetchGroupList();
    }
    createForm.name = '';
    parentIds.value = [];
};

// 开始编辑分组
const editingId = ref('');
const editName = ref('');

const startEdit = (data: any) => {
  editingId.value = data.id;
  editName.value = data.name;
};

// 提交编辑分组
const submitEdit = async (data: any) => {
  if (!editName.value || editName.value === data.name) {
    editingId.value = '';
    return;
  }

  console.log("type of data.id:", typeof data.id);

  const res = await groupApi.editGroup({
    id: data.id,
    name: editName.value,
  });
  if (res && res.code === 200) {
    ElMessage.success('编辑成功');
    editingId.value = '';
    fetchGroupList();
  }
};

// 删除分组
const deleteGroup = async (data: any) => {
    try {
        await ElMessageBox.confirm('确认删除该分组吗？', '提示', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'warning',
        });
        const res = await groupApi.deleteGroup(data.id);
        if (res && res.code === 200) {
            ElMessage.success('删除成功');
            if (currentGroupId.value === data.id) {
                currentGroupId.value = '';
                hostList.value = [];
            }
            fetchGroupList();
        }
    } catch (error) {
        // 用户取消操作
    }
};

// 显示添加主机对话框
const showAddHostDialog = async () => {
    if (!currentGroupId.value) return;
    loadingAvailableHosts.value = true;
    const res = await groupApi.pageAvailableGroupInstance({
        groupId: currentGroupId.value,
        pageNum: availableHostCurrentPage.value,
        pageSize: availableHostPageSize.value,
    });
    if (res && res.code === 200) {
        availableHostList.value = res.data.data;
        availableHostTotal.value = res.data.total;
        addHostDialogVisible.value = true;
    }
    loadingAvailableHosts.value = false;
};

// 分页变化
const handleAvailableHostSizeChange = (val: number) => {
  availableHostPageSize.value = val;
  showAddHostDialog();
};

const handleAvailableHostCurrentChange = (val: number) => {
  availableHostCurrentPage.value = val;
  showAddHostDialog();
};

// 选中主机列表
const selectedHostIds = ref<number[]>([]);

// 处理复选框选中事件
const handleSelectionChange = (selection: any[]) => {
  selectedHostIds.value = selection.map(item => item.id);
};

// 添加主机到分组
const addHostsToGroup = async () => {
  if (selectedHostIds.value.length === 0) {
    return;
  }
  const res = await groupApi.groupInstanceOps({
    groupId: currentGroupId.value,
    instanceIds: selectedHostIds.value,
    opsType: 'add',
  });
  if (res && res.code === 200) {
    ElMessage.success('添加成功');
    addHostDialogVisible.value = false;
    fetchHostList();
  }
};

// 处理移除主机列表
const selectedRemoveHostIds = ref<number[]>([]);
const handleRemoveSelectionChange = (selection: any[]) => {
    selectedRemoveHostIds.value = selection.map(item => item.id);
};

// 从分组移除主机
const removeHostFromGroup = async () => {
  if (selectedRemoveHostIds.value.length === 0 || !currentGroupId.value) {
    return;
  }
  try {
    await ElMessageBox.confirm('确认移除选中的主机吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    });
    const res = await groupApi.groupInstanceOps({
      groupId: currentGroupId.value,
      instanceIds: selectedRemoveHostIds.value,
      opsType: 'remove',
    });
    if (res && res.code === 200) {
      ElMessage.success('移除成功');
      selectedRemoveHostIds.value = [];
      fetchHostList();
    }
  } catch (error) {
    // 用户取消操作
  }
};

// 分页变化
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchHostList();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchHostList();
};

onMounted(() => {
  fetchGroupList();
});
</script>

<style scoped>
.custom-tree-node {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.tree-actions {
  display: none;
  gap: 10px;
}

.custom-tree-node:hover .tree-actions {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.group-container {
  display: flex;
  height: 100%;
}
.group-left {
  width: 300px;
  padding: 20px;
  border-right: 1px solid #eee;
}
.group-right {
  flex: 1;
  padding: 20px;
}
.group-header, .host-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.host-header {
  gap: 10px;
}

.host-header span {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-right: auto;
}

.host-header .el-button {
    margin-left: 10px;
}

.dashed-button {
  border: 1px dashed var(--el-color-primary);
  padding: 0 8px;
}
</style>