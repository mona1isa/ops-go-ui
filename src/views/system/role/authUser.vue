<template>
	<div class="system-role-container layout-padding">
        <el-dialog :title="state.dialog.title" v-model="state.dialog.isShowDialog">
            <div class="system-role-transfer-center">
                <el-transfer
                    v-model="state.selectedUserIds"
                    :data="state.transferData"
                    filterable
                    filter-placeholder="请输入用户名搜索"
                    :props="{ key: 'id', label: 'name' }"
                    :titles="['未分配', '已分配']"
                    :button-texts="['移除', '添加']"
                    :loading="state.tableData.loading"
                    ref="userTableRef"
                    @change="handleSelectionChange"
                >
                    <template #left-empty>
                        <el-empty :image-size="60" description="No data" />
                    </template>
                    <template #right-empty>
                        <el-empty :image-size="60" description="No data" />
                    </template>
                </el-transfer>
            </div>
            <template #footer>
				<span class="dialog-footer">
					<el-button plain type="info" @click="onCancel" size="default">取 消</el-button>
					<el-button plain type="primary" @click="onSubmit" size="default">{{ state.dialog.submitTxt }}</el-button>
				</span>
			</template>
        </el-dialog>
	</div>
</template>

<script setup lang="ts" name="systemRoleDialog">
import { reactive, ref, nextTick } from 'vue';
import { useRoleApi } from '/@/api/role';
import { useUserInfoApi } from '/@/api/user';
import { ElMessage } from 'element-plus';


// 角色接口
const roleApi = useRoleApi();

// 用户接口
const userApi = useUserInfoApi();

// 定义子组件向父组件传值/事件
const emit = defineEmits(['refresh']);

// Define userTableRef
const userTableRef = ref();

const initialState = {
  id: 0,
  name: '',
  status: '1',
  remark: '',
  selectedUserIds: [] as number[],
};

const state = reactive({
    transferData: [] as any[],
    selectedUserIds: [] as number[], // 当前选中的用户ID
    assignedUserIds: [] as number[], // 初始分配的用户ID
    addedUserIds: [] as number[],    // 新添加的用户ID
    removedUserIds: [] as number[],  // 被移除的用户ID
    tableData: {
        loading: false,
    },
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
	form: {
	    id: 0, // 角色ID
	},
});

// 获取用户列表并回显选中已经被分配角色的用户ID
const getTableData = () => {
	state.tableData.loading = true;
    roleApi.getAssignUserInfo(state.form.id).then((res) => {
        const data = res.data;
        // 合并所有用户
        state.transferData = [...(data.assigned || []), ...(data.unassigned || [])];
        // 保存初始分配的用户ID
        state.assignedUserIds = (data.assigned || []).map((item: any) => item.id);
        // 当前选中的用户ID
        state.selectedUserIds = [...state.assignedUserIds];
        state.tableData.loading = false;
        nextTick(() => {
            if (userTableRef.value) {
                userTableRef.value.clearQuery();
            }
        });
    });
}

// 打开弹窗
const openDialog = (row: any) => {
	state.dialog.title = '分配用户';
    state.dialog.submitTxt = '分 配';
	state.dialog.isShowDialog = true;
    state.form.id = row.id;
    getTableData();
};
// 关闭弹窗
const closeDialog = () => {
	state.dialog.isShowDialog = false;
};
// 取消
const onCancel = () => {
	closeDialog();
};

// 监听穿梭框变化，计算新增和移除的用户ID
const handleSelectionChange = (newSelectedIds: number[]) => {
    // 新添加的用户：现在有，原来没有
    state.addedUserIds = newSelectedIds.filter(id => !state.assignedUserIds.includes(id));
    // 被移除的用户：原来有，现在没有
    state.removedUserIds = state.assignedUserIds.filter(id => !newSelectedIds.includes(id));
    // 更新当前选中的用户ID
    state.selectedUserIds = newSelectedIds;
};

const onSubmit = async () => {
    try {
        await roleApi.assignUsers({
            roleId: state.form.id,
            addedUserIds: state.addedUserIds,
            removedUserIds: state.removedUserIds
        });
        ElMessage.success('分配成功');
        closeDialog();
        emit('refresh');
    } catch (error) {
        ElMessage.error('分配失败');
    }
};


// 暴露变量
defineExpose({
	openDialog,
	getTableData,
});
</script>

<style scoped lang="scss">
.system-role-transfer-center {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px; // 可根据需要调整高度
}
</style>
