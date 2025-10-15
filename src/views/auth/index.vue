<template>
    <div class="auth-container">
        <el-row :gutter="20">
            <el-col :span="6">
                <el-card class="user-list-card">
                    <UserList />
                </el-card>
            </el-col>

            <el-col :span="18">
                <!-- 右侧主机信息和分组 -->
                <div class="auth-right">
                   <el-card class="host-info-card">
                    <el-tabs v-model="activeTab">
                        <el-tab-pane label="主机信息" name="instance">
                            <InstanceInfo />
                        </el-tab-pane>
                        <el-tab-pane label="主机分组" name="group">
                            <GroupInfo />
                        </el-tab-pane>
                    </el-tabs>
                   </el-card>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script lang="ts" setup name="authIndex">
import { ref } from 'vue';
import UserList from '/@/views/auth/components/users.vue';
import InstanceInfo from '/@/views/auth/components/instances.vue';
import GroupInfo from '/@/views/auth/components/groups.vue';

const activeTab = ref('instanceInfo');
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