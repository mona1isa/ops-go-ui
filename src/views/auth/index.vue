<template>
    <div class="auth-container">
        <el-row :gutter="20">
            <el-col :span="6">
                <el-card class="user-list-card">
                    <UserList ref="userListRef" @user-change="handleUserChange"/>
                </el-card>
            </el-col>

            <el-col :span="18">
                <!-- 右侧主机信息和分组 -->
                <div class="auth-right">
                   <el-card class="host-info-card">
                    <el-tabs v-model="activeTab">
                        <el-tab-pane label="主机信息" name="instanceInfo">
                            <InstanceInfo ref="instanceRef" :user-id="currentUserId"/>
                        </el-tab-pane>
                        <el-tab-pane label="主机分组" name="groupInfo">
                            <GroupInfo ref="groupRef"/>
                        </el-tab-pane>
                    </el-tabs>
                   </el-card>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script lang="ts" setup name="authIndex">
import { defineAsyncComponent, ref } from 'vue';

// 引入组件
const UserList = defineAsyncComponent(() => import('/@/views/auth/components/users.vue'));
const InstanceInfo = defineAsyncComponent(() => import('/@/views/auth/components/instances.vue'));
const GroupInfo = defineAsyncComponent(() => import('/@/views/auth/components/groups.vue'));

// 默认激活主机信息 tab
const activeTab = ref('instanceInfo');

// 当前选中的用户ID
const currentUserId = ref<number | null>(null);

const userListRef = ref();
const instanceRef = ref();
const groupRef = ref();

// 处理用户切换
const handleUserChange = (userId: number) => {
    currentUserId.value = userId;
    // 刷新主机信息和分组信息
    if (instanceRef.value) {
        console.log('index.vue用户切换，用户ID:', userId);
        instanceRef.value.loadUserInstance(userId);
    }
};

</script>

<style scoped lang="scss">
.user-list-card {
    margin-left: 10px;
    margin-top: 20px;
    height: 600px;
}

.auth-right {
  flex: 1;
  padding: 20px;
}
</style>