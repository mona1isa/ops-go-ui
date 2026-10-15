// CMDB 资产模型与字典定义：前端唯一的模型字段 schema 来源，后端 attrs 只存 JSON

export interface CmdbAttrField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select';
    options?: { label: string; value: string }[];
    placeholder?: string;
}

export const cmdbModelTypes: { value: string; label: string; color: string }[] = [
    { value: 'server', label: '服务器', color: '#409EFF' },
    { value: 'network', label: '网络设备', color: '#67C23A' },
    { value: 'database', label: '数据库', color: '#E6A23C' },
    { value: 'middleware', label: '中间件', color: '#909399' },
    { value: 'domain', label: '域名', color: '#F56C6C' },
    { value: 'ssl', label: 'SSL证书', color: '#B37FEB' },
];

export const cmdbStatusOptions: { value: number; label: string; type: 'info' | 'primary' | 'success' | 'warning' | 'danger' }[] = [
    { value: 1, label: '采购', type: 'info' },
    { value: 2, label: '上架', type: 'primary' },
    { value: 3, label: '运行', type: 'success' },
    { value: 4, label: '维护', type: 'warning' },
    { value: 5, label: '退役', type: 'danger' },
];

export const cmdbRelationTypes: { value: string; label: string }[] = [
    { value: 'runs_on', label: '部署于' },
    { value: 'binds_to', label: '绑定' },
    { value: 'connects_to', label: '连接' },
    { value: 'depends', label: '依赖' },
    { value: 'resolves', label: '解析' },
];

// 各模型类型的专属属性字段（存入 attrs JSON）
export const cmdbAttrSchema: Record<string, CmdbAttrField[]> = {
    server: [
        { key: 'cpu', label: 'CPU核数', type: 'number' },
        { key: 'memGb', label: '内存(GB)', type: 'number' },
        { key: 'diskGb', label: '磁盘(GB)', type: 'number' },
        { key: 'os', label: '操作系统', type: 'text', placeholder: '如 Ubuntu 22.04' },
        { key: 'vendor', label: '硬件厂商', type: 'text', placeholder: '如 Dell / 阿里云' },
        { key: 'model', label: '型号/规格', type: 'text' },
    ],
    network: [
        { key: 'deviceType', label: '设备类型', type: 'select', options: [
            { label: '交换机', value: 'switch' },
            { label: '路由器', value: 'router' },
            { label: '防火墙', value: 'firewall' },
            { label: '负载均衡', value: 'lb' },
        ] },
        { key: 'model', label: '设备型号', type: 'text' },
        { key: 'ports', label: '端口数', type: 'number' },
    ],
    database: [
        { key: 'engine', label: '数据库引擎', type: 'select', options: [
            { label: 'MySQL', value: 'MySQL' },
            { label: 'PostgreSQL', value: 'PostgreSQL' },
            { label: 'Redis', value: 'Redis' },
            { label: 'MongoDB', value: 'MongoDB' },
            { label: 'ClickHouse', value: 'ClickHouse' },
        ] },
        { key: 'version', label: '版本', type: 'text' },
        { key: 'port', label: '端口', type: 'number' },
    ],
    middleware: [
        { key: 'mwType', label: '中间件类型', type: 'select', options: [
            { label: 'Nginx', value: 'Nginx' },
            { label: 'Kafka', value: 'Kafka' },
            { label: 'RabbitMQ', value: 'RabbitMQ' },
            { label: 'Zookeeper', value: 'Zookeeper' },
            { label: 'Tomcat', value: 'Tomcat' },
        ] },
        { key: 'version', label: '版本', type: 'text' },
        { key: 'port', label: '端口', type: 'number' },
    ],
    domain: [
        { key: 'registrar', label: '注册商', type: 'text', placeholder: '如 阿里云万网' },
        { key: 'dns', label: 'DNS服务商', type: 'text' },
    ],
    ssl: [
        { key: 'issuer', label: '签发机构', type: 'text', placeholder: '如 Let\'s Encrypt' },
        { key: 'domains', label: '绑定域名', type: 'text' },
        { key: 'algorithm', label: '加密算法', type: 'text' },
    ],
};

export const modelLabel = (value: string) => cmdbModelTypes.find((m) => m.value === value)?.label ?? value;
export const modelColor = (value: string) => cmdbModelTypes.find((m) => m.value === value)?.color ?? '#909399';
export const statusOption = (value: number) => cmdbStatusOptions.find((s) => s.value === value);
export const relationLabel = (value: string) => cmdbRelationTypes.find((r) => r.value === value)?.label ?? value;

// attrs JSON 解析（后端存字符串，容错返回空对象）
export const parseAttrs = (raw?: string): Record<string, any> => {
    if (!raw) return {};
    try {
        const obj = JSON.parse(raw);
        return obj && typeof obj === 'object' ? obj : {};
    } catch {
        return {};
    }
};
