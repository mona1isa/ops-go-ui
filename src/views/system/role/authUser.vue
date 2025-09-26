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
					<el-button @click="onCancel" size="default">取 消</el-button>
					<el-button type="primary" @click="onSubmit" size="default">{{ state.dialog.submitTxt }}</el-button>
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
import { number } from 'echarts';


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
    selectedUserIds: [] as number[], // 已选择的用户ID
	tableData: {
	    data: [],
	    total: 0,
	    loading: false,
	    param: {
	        pageNum: 1,
	        pageSize: 10,
	    },
	} as any,
	dialog: {
		isShowDialog: false,
		type: '',
		title: '',
		submitTxt: '',
	},
	form: {
	    id: 0, // 角色ID
	    selectedUserIds: [] as number[],
	},
});

// 获取用户列表并回显选中已经被分配角色的用户ID
const getTableData = () => {
	state.tableData.loading = true;
    let selectedUserIds = [] as number[];
    roleApi.getAssignUserInfo(state.form.id).then((res) => {
        const data = res.data;
        // 合并所有用户
        state.transferData = [...(data.assigned || []), ...(data.unassigned || [])];
        // 只取已分配用户的id
        state.selectedUserIds = (data.assigned || []).map((item: any) => item.id);
        state.tableData.loading = false;
        
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

const handleSelectionChange = (val: any[]) => {
    state.form.selectedUserIds = val.map(item => item.id);
};

const onSubmit = async () => {
    // if (state.form.selectedUserIds.length === 0) {
    //     ElMessage.warning('请至少选择一个用户');
    //     return;
    // }
    
    try {
        await roleApi.assignUsers({
            roleId: state.form.id,
            userIds: state.form.selectedUserIds
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
