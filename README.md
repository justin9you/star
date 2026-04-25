# 亚星电子销售管理系统

> 轻量级、可视化、全流程家电销售 + 库存 + 报表一体化管理系统

## 项目简介

亚星电子销售管理系统是一个专为小型家电门店/经销商设计的本地销售管理系统，支持离线运行，零基础员工即可上手。

### 核心功能

- **库存管理**: 品牌管理、电器类型管理、商品管理、多仓库管理、库存预警、二维码生成
- **销售管理**: 客户管理、销售开单、以旧换新、订单管理、一键打印
- **报表统计**: 今日销售、利润统计、库存报表、旧货报表、热销排行、Excel 导出

### 技术栈

| 技术层 | 技术选型 |
|--------|---------|
| 前端 | TypeScript + React + Vite + Ant Design |
| 后端 | Python + FastAPI + SQLAlchemy |
| 数据库 | SQLite |
| 部署 | 本地单机版，解压即用 |

## 快速开始

### 环境要求

- Python 3.12+
- Node.js 18+
- pnpm 8+ (推荐) 或 npm

### 后端启动

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn app.main:app --reload
```

访问 http://127.0.0.1:8000/docs 查看 API 文档

### 前端启动

```bash
cd frontend
pnpm install
pnpm dev
```

访问 http://localhost:5173 查看前端页面

### 生产构建

```bash
scripts/build.bat
```

## 项目结构

```
yaxing-sales-system/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── hooks/          # 自定义 hooks
│   │   ├── pages/          # 页面
│   │   ├── services/       # API 服务
│   │   ├── stores/         # 状态管理
│   │   ├── utils/          # 工具函数
│   │   └── types/          # TypeScript 类型
│   └── package.json
├── backend/                 # 后端项目
│   ├── app/
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # 数据校验
│   │   ├── routers/        # API 路由
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── data/               # SQLite 数据文件
│   ├── backups/            # 数据备份
│   └── requirements.txt
├── docs/                    # 项目文档
│   ├── PRD.md              # 产品需求文档
│   └── PROJECT-CREATION.md # 项目创建指南
├── scripts/                 # 部署脚本
│   ├── build.bat           # 打包脚本
│   └── start.bat           # 启动脚本
├── .env.example             # 环境变量模板
└── README.md
```

## 核心特性

### 数据联动

- ✅ 销售商品 → 自动扣减库存
- ✅ 以旧换新 → 自动增加旧货库存
- ✅ 采购入库 → 自动增加库存
- ✅ 销售单作废 → 自动恢复库存

### 性能指标

- 启动时间 < 3 秒
- 操作响应 < 500ms
- 数据查询 < 1 秒 (万级数据)
- 7×24 小时稳定运行

### 默认配置

- 默认地址: 江苏省 - 苏州市 - 吴中区 - 临湖镇
- 备份保留: 最近 30 天
- 单管理员账号

## 文档

- [产品需求文档 (PRD)](docs/PRD.md)
- [项目创建指南](docs/PROJECT-CREATION.md)

## 开发进度

- [x] 项目规划与需求分析
- [x] 技术选型与架构设计
- [ ] 后端开发 (进行中)
- [ ] 前端开发
- [ ] 测试与优化
- [ ] 部署与交付

## License

MIT