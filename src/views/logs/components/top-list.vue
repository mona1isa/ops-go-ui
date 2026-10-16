<template>
    <div class="top-list">
        <div v-if="items.length === 0" class="top-empty">暂无数据</div>
        <div v-for="(item, index) in items" :key="`${item.name}-${index}`" class="top-row">
            <span class="top-rank" :class="{ 'top-rank-hot': index < 3 }">{{ index + 1 }}</span>
            <span class="top-name" :title="item.name">{{ item.name || '（空）' }}</span>
            <div class="top-bar">
                <div class="top-bar-inner" :style="{ width: barWidth(item.count) }"></div>
            </div>
            <span class="top-count">{{ item.count }}</span>
        </div>
    </div>
</template>

<script setup lang="ts" name="logsTopList">
import { computed } from 'vue';
import { LogTopItemType } from '/@/types/views';

const props = defineProps<{ items: LogTopItemType[] }>();

const max = computed(() => Math.max(1, ...(props.items || []).map((item) => Number(item.count) || 0)));

const barWidth = (count: number) => `${Math.max(2, Math.round((Number(count) / max.value) * 100))}%`;
</script>

<style scoped lang="scss">
.top-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-size: 12px;
}

.top-rank {
    width: 18px;
    height: 18px;
    line-height: 18px;
    text-align: center;
    border-radius: 4px;
    background: var(--el-fill-color);
    color: var(--el-text-color-secondary);
    flex: none;
}

.top-rank-hot {
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
}

.top-name {
    width: 110px;
    flex: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.top-bar {
    flex: 1;
    height: 8px;
    border-radius: 4px;
    background: var(--el-fill-color-light);
    overflow: hidden;
}

.top-bar-inner {
    height: 100%;
    background: var(--el-color-primary);
    border-radius: 4px;
}

.top-count {
    width: 44px;
    text-align: right;
    flex: none;
}

.top-empty {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    padding: 16px 0;
    text-align: center;
}
</style>
