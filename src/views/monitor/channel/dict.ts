// 通知渠道类型字典，与后端 models/ops_monitor_notify_channel.go 常量保持一致
export const CHANNEL_TYPES = [
    { label: 'Webhook', value: 1 },
    { label: '邮件', value: 2 },
    { label: '钉钉机器人', value: 3 },
    { label: '企业微信机器人', value: 4 },
    { label: '飞书机器人', value: 5 },
];

export const channelTypeName = (type: number): string => CHANNEL_TYPES.find((item) => item.value === type)?.label || '未知';

export const channelTypeTag = (type: number): string => {
    const tags: Record<number, string> = { 1: 'primary', 2: 'info', 3: 'warning', 4: 'success', 5: 'danger' };
    return tags[type] || 'info';
};

// 机器人渠道（钉钉/企微/飞书）
export const isRobotChannel = (type: number): boolean => type >= 3 && type <= 5;
