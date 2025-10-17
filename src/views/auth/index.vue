<template>
    <div class="auth-container">
        <el-row :gutter="10">
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
                            <el-tab-pane label="已授权-主机" name="instanceInfo">
                                <InstanceInfo ref="instanceRef" :user-id="currentUserId"/>
                            </el-tab-pane>
                            <el-tab-pane label="已授权-分组" name="groupInfo">
                                <GroupInfo ref="groupRef" :user-id="currentUserId"/>
                            </el-tab-pane>
                            <el-tab-pane label="主机授权" name="instanceAuth">
                                <InstanceAuth ref="instanceAuthRef" :user-id="currentUserId"/>
                            </el-tab-pane>
                            <el-tab-pane label="分组授权" name="groupAuth">
                                <GroupAuth ref="groupAuthRef" :user-id="currentUserId"/>
                            </el-tab-pane>
                        </el-tabs>
                   </el-card>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script lang="ts" setup name="authIndex">
import { defineAsyncComponent, ref, watch } from 'vue';

// 引入组件
const UserList = defineAsyncComponent(() => import('/@/views/auth/components/users.vue'));
const InstanceInfo = defineAsyncComponent(() => import('/@/views/auth/components/instances.vue'));
const GroupInfo = defineAsyncComponent(() => import('/@/views/auth/components/groups.vue'));
const InstanceAuth = defineAsyncComponent(() => import('/@/views/auth/components/instanceAuth.vue'));
const GroupAuth = defineAsyncComponent(() => import('/@/views/auth/components/groupAuth.vue'));

// 默认激活主机信息 tab
const activeTab = ref('instanceInfo');

// 当前选中的用户ID
const currentUserId = ref<number | null>(null);

const userListRef = ref();
const instanceRef = ref();
const groupRef = ref();

const instanceAuthRef = ref();
const groupAuthRef = ref();

// 处理用户切换
const handleUserChange = (userId: number) => {
    currentUserId.value = userId;
    // 刷新主机信息和分组信息
    if (instanceRef.value && activeTab.value === 'instanceInfo') {
        instanceRef.value.loadUserInstance(userId);
    }
    // 切换到主机信息 tab
    if (groupRef.value && activeTab.value === 'groupInfo') {
        groupRef.value.loadUserGroup(userId);
    }
    // 切换到主机授权 tab
    if (instanceAuthRef.value && activeTab.value === 'instanceAuth') {
        instanceAuthRef.value.loadInstance(userId);
    }
    // 切换到分组授权 tab
    if (groupAuthRef.value && activeTab.value === 'groupAuth') {
        groupAuthRef.value.loadGroup(userId);
    }
};

// 监听 activeTab 变化
watch(activeTab, (newTab) => {
    if (!currentUserId.value) {
        return;
    }
    if (newTab === 'groupInfo' && groupRef.value) {
        groupRef.value.loadUserGroup(currentUserId.value);
    } else if (newTab === 'instanceInfo' && instanceRef.value) {
        instanceRef.value.loadUserInstance(currentUserId.value);
    } else if (newTab === 'instanceAuth' && instanceAuthRef.value) {
        instanceAuthRef.value.loadInstance(currentUserId.value);
    } else if (newTab === 'groupAuth' && groupAuthRef.value) {
        groupAuthRef.value.loadGroup(currentUserId.value);
    }
});

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