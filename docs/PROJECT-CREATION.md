# 亚星电子销售管理系统 - 项目开发指南

> 本指南遵循 [development-workflow.md](~/.claude/rules/common/development-workflow.md) 定义的完整开发流程。  
> 完整产品需求详见 [PRD.md](./PRD.md)

## 项目信息

| 属性 | 值 |
|------|-----|
| **项目名称** | 亚星电子销售管理系统 |
| **技术栈** | 前端: TypeScript + React + Vite + Ant Design / 后端: Python + FastAPI / 数据库: SQLite |
| **部署方式** | 本地单机版,解压即用,Windows 优先适配 |
| **核心模块** | 库存管理、销售管理、报表统计 |
| **开发状态** | ✅ 已完成开发 |
| **仓库地址** | https://github.com/justin9you/star |

## 目录

- [1. 研究与重用](#1-研究与重用)
- [2. 规划阶段](#2-规划阶段)
- [3. 项目初始化](#3-项目初始化)
- [4. 测试驱动开发](#4-测试驱动开发)
- [5. 代码审查](#5-代码审查)
- [6. 提交与部署](#6-提交与部署)

---

## 1. 研究与重用

### 1.1 GitHub 代码搜索（强制第一步）

在编写任何新代码之前，**必须**先搜索现有解决方案：

```bash
# 搜索相关仓库
gh search repos "<项目类型或技术栈>" --sort stars --limit 20

# 搜索具体实现代码
gh search code "<具体功能>" --language=typescript --limit 50

# 示例：搜索全栈项目模板
gh search repos "fullstack starter template" --sort stars
gh search code "authentication JWT" --language=typescript
```

**目标**：
- 找到可复用的骨架项目（解决 80%+ 的问题）
- 发现成熟的模式和最佳实践
- 避免重复造轮子

### 1.2 包注册表搜索

检查现有库和工具：

```bash
# 前端包搜索
npm search <package-name>
pnpm search <package-name>

# 后端包搜索（根据技术栈）
pip search <package-name>        # Python
cargo search <crate-name>        # Rust
go search <module-name>          # Go

# 检查包的质量
npm info <package-name>
npm view <package-name> version
```

### 1.3 官方文档确认

使用 Context7 或官方文档确认：
- API 使用方式
- 版本兼容性
- 最佳实践

**顺序**：
1. GitHub 搜索
2. 官方文档
3. 包注册表
4. 仅在以上不足时使用 Exa 网络搜索

---

## 2. 规划阶段

### 2.1 启动 Planner 代理

使用 **planner** 代理创建实现计划：

```bash
# 在 Claude Code 中请求规划
"使用 planner 代理帮我规划这个全栈项目的实现"
```

### 2.2 生成规划文档

在编码前必须生成以下文档：

| 文档类型 | 文件名 | 用途 |
|---------|--------|------|
| 产品需求文档 | `PRD.md` | 定义功能、用户故事、验收标准 |
| 架构设计 | `ARCHITECTURE.md` | 系统架构、技术选型、模块划分 |
| 系统设计 | `SYSTEM-DESIGN.md` | 数据流、API 设计、数据库设计 |
| 技术文档 | `TECH-DOC.md` | 技术栈说明、依赖关系、配置说明 |
| 任务列表 | `TASKS.md` | 分解为可执行的开发任务 |

### 2.3 架构决策

使用 **architect** 代理处理：
- 技术栈选择（前端框架、后端框架、数据库）
- API 设计风格（REST/GraphQL）
- 认证方案（JWT/Session/OAuth）
- 部署架构

### 2.4 风险评估

识别并记录：
- 技术风险
- 时间风险
- 依赖风险
- 安全风险

---

## 3. 项目初始化

### 3.1 标准目录结构

```
yaxing-sales-system/                # 亚星电子销售管理系统
├── frontend/                        # 前端项目 (TypeScript + React)
│   ├── src/
│   │   ├── components/             # UI 组件
│   │   │   ├── common/            # 通用组件 (Button, Table, Modal, Search)
│   │   │   ├── inventory/         # 库存管理组件
│   │   │   ├── sales/             # 销售管理组件
│   │   │   ├── report/            # 报表统计组件
│   │   │   └── layout/            # 布局组件 (Sidebar, Header, MainLayout)
│   │   ├── hooks/                  # 自定义 hooks (useInventory, useSales, useReport)
│   │   ├── pages/                  # 页面
│   │   │   ├── Dashboard/         # 首页仪表盘
│   │   │   ├── Inventory/         # 库存管理页 (品牌/类型/商品/仓库)
│   │   │   ├── Sales/             # 销售管理页 (客户/开单/订单)
│   │   │   ├── Report/            # 报表统计页
│   │   │   ├── Settings/          # 系统设置页 (备份/恢复/用户)
│   │   │   └── Login/             # 登录页
│   │   ├── services/               # API 服务
│   │   │   ├── inventoryService.ts
│   │   │   ├── salesService.ts
│   │   │   ├── reportService.ts
│   │   │   └── authService.ts
│   │   ├── stores/                 # 状态管理 (Zustand)
│   │   │   ├── useInventoryStore.ts
│   │   │   ├── useSalesStore.ts
│   │   │   └── useAuthStore.ts
│   │   ├── utils/                  # 工具函数
│   │   │   ├── qrcode.ts          # 二维码生成/解析
│   │   │   ├── print.ts           # 打印工具
│   │   │   ├── export.ts          # Excel/CSV 导出
│   │   │   ├── region.ts          # 省市区镇联动数据
│   │   │   └── backup.ts          # 数据备份/恢复
│   │   └── types/                  # TypeScript 类型定义
│   │       ├── inventory.ts       # 库存相关类型
│   │       ├── sales.ts           # 销售相关类型
│   │       ├── report.ts          # 报表相关类型
│   │       └── common.ts          # 通用类型
│   ├── public/
│   │   └── regions/               # 省市区镇数据 JSON
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                         # 后端项目 (Python)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI 入口
│   │   ├── database.py            # SQLite 数据库连接
│   │   ├── models/                 # SQLAlchemy 数据模型
│   │   │   ├── brand.py
│   │   │   ├── category.py
│   │   │   ├── product.py
│   │   │   ├── warehouse.py
│   │   │   ├── inventory.py
│   │   │   ├── customer.py
│   │   │   ├── sales_order.py
│   │   │   ├── old_appliance.py
│   │   │   └── operation_log.py
│   │   ├── schemas/                # Pydantic 数据校验
│   │   │   ├── inventory.py
│   │   │   ├── sales.py
│   │   │   └── report.py
│   │   ├── routers/                # API 路由
│   │   │   ├── inventory.py       # 库存管理 API
│   │   │   ├── sales.py           # 销售管理 API
│   │   │   ├── report.py          # 报表统计 API
│   │   │   ├── auth.py            # 认证 API
│   │   │   └── backup.py          # 数据备份 API
│   │   ├── services/               # 业务逻辑
│   │   │   ├── inventory_service.py
│   │   │   ├── sales_service.py
│   │   │   ├── report_service.py
│   │   │   └── backup_service.py
│   │   └── utils/                  # 工具函数
│   │       ├── qrcode.py          # 二维码生成
│   │       └── export.py          # 报表导出
│   ├── data/                        # SQLite 数据文件目录
│   │   └── yaxing.db
│   ├── backups/                     # 数据备份目录
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
├── docs/                            # 项目文档
│   ├── PRD.md                      # 产品需求文档
│   ├── ARCHITECTURE.md             # 架构设计文档
│   ├── API.md                      # API 接口文档
│   └── USER-GUIDE.md              # 用户使用说明
├── scripts/                         # 部署脚本
│   ├── build.bat                   # Windows 打包脚本
│   └── start.bat                   # 启动脚本
├── .env.example                     # 环境变量示例
├── .gitignore
└── README.md
```

### 3.2 必需配置文件

创建以下配置文件：

#### 前端配置
- `package.json` - 依赖管理
- `tsconfig.json` - TypeScript 配置
- `.eslintrc.js` - ESLint 配置
- `.prettierrc` - Prettier 配置
- `vite.config.ts` / `next.config.js` - 构建配置

#### 后端配置 (Python)
- `requirements.txt` - Python 依赖管理
- `.flake8` / `pyproject.toml` - Lint 配置
- `pytest.ini` - 测试配置

#### 核心依赖
- `fastapi` - Web 框架
- `uvicorn` - ASGI 服务器
- `sqlalchemy` - ORM
- `pydantic` - 数据校验
- `qrcode` - 二维码生成
- `openpyxl` - Excel 导出
- `python-jose` - JWT 认证

#### 通用配置
- `.gitignore` - Git 忽略规则
- `.env.example` - 环境变量模板
- `.editorconfig` - 编辑器配置
- `.github/workflows/ci.yml` - CI/CD 配置

### 3.3 环境变量管理

创建 `.env.example` 文件：

```bash
# 数据库配置 (SQLite 本地存储)
DATABASE_PATH=./data/yaxing.db

# 认证配置 (单管理员账号)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d

# API 配置
API_HOST=127.0.0.1
API_PORT=8000
API_PREFIX=/api/v1

# 前端配置
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1

# 备份配置
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30

# 默认地址 (省市区镇四级联动)
DEFAULT_REGION_PROVINCE=江苏省
DEFAULT_REGION_CITY=苏州市
DEFAULT_REGION_DISTRICT=吴中区
DEFAULT_REGION_TOWN=临湖镇
```

**安全要求**：
- ❌ **永不**提交 `.env` 文件到 Git
- ✅ 只提交 `.env.example` 模板
- ✅ 启动时验证必需的环境变量

---

## 4. 测试驱动开发

### 4.1 启动 TDD-Guide 代理

使用 **tdd-guide** 代理强制执行测试先行：

```bash
# 在 Claude Code 中请求 TDD 指导
"使用 tdd-guide 代理指导我实现用户认证功能"
```

### 4.2 TDD 工作流

强制遵循 **RED-GREEN-REFACTOR** 循环：

1. **RED** - 先写测试（必须失败）
   ```bash
   npm test -- --watch
   # 或
   pytest tests/
   ```

2. **GREEN** - 编写最小实现（使测试通过）
   ```bash
   # 实现代码
   npm run dev
   ```

3. **REFACTOR** - 优化代码结构
   ```bash
   # 重构并确保测试仍通过
   npm test
   ```

### 4.3 测试覆盖率要求

**最低覆盖率：80%**

测试类型：
- ✅ **单元测试** - 函数、组件、工具类
- ✅ **集成测试** - API 端点、数据库操作
- ✅ **E2E 测试** - 关键用户流程

```bash
# 检查覆盖率
npm test -- --coverage
# 或
pytest --cov=src tests/
```

### 4.4 测试结构（AAA 模式）

```typescript
// 好的测试示例 - 商品入库测试
test('商品入库成功后自动更新库存数量', async () => {
  // Arrange - 准备
  const productData = {
    product_id: 1,
    warehouse_id: 1,
    quantity: 10,
    purchase_price: 1000.00
  };

  // Act - 执行
  const response = await inventoryService.stockIn(productData);

  // Assert - 断言
  expect(response.success).toBe(true);
  expect(response.data.quantity).toBe(10);
  expect(response.data.inventory).toBeDefined();
});

// Python 后端测试示例
def test_sales_order_creates_and_deducts_inventory():
    """测试销售单创建并自动扣减库存"""
    # Arrange
    order_data = {
        "customer_id": 1,
        "items": [
            {"product_id": 1, "quantity": 2, "unit_price": 1500.00}
        ]
    }

    # Act
    response = client.post("/api/v1/sales/orders", json=order_data)

    # Assert
    assert response.status_code == 201
    assert response.json()["total_amount"] == 3000.00

    # 验证库存扣减
    inventory = get_inventory(product_id=1)
    assert inventory.quantity == initial_quantity - 2
```

---

## 5. 代码审查

### 5.1 自动触发审查

编写代码后，**立即**使用 **code-reviewer** 代理：

```bash
# 在 Claude Code 中请求审查
"使用 code-reviewer 代理审查我刚写的认证模块"
```

### 5.2 审查检查清单

在标记代码完成前验证：

#### 代码质量
- [ ] 代码可读且命名良好
- [ ] 函数聚焦（<50 行）
- [ ] 文件内聚（<800 行）
- [ ] 无深层嵌套（>4 层）
- [ ] 无硬编码值（使用常量或配置）
- [ ] 无 console.log 或调试语句

#### 错误处理
- [ ] 错误显式处理
- [ ] 用户友好的错误消息
- [ ] 服务器端详细日志记录
- [ ] 无静默错误吞噬

#### 安全检查
- [ ] 无硬编码密钥或凭据
- [ ] 用户输入已验证
- [ ] SQL 注入防护（参数化查询）
- [ ] XSS 防护（HTML 净化）
- [ ] CSRF 保护已启用
- [ ] 认证/授权已验证

### 5.3 安全审查触发条件

**停止并使用 security-reviewer 代理**：

- 认证或授权代码
- 用户输入处理
- 数据库查询
- 文件系统操作
- 外部 API 调用
- 加密操作
- 支付或金融代码

### 5.4 审查严重级别

| 级别 | 含义 | 行动 |
|------|------|------|
| 🔴 CRITICAL | 安全漏洞或数据丢失风险 | **阻止合并** - 必须立即修复 |
| 🟠 HIGH | Bug 或重大质量问题 | **警告** - 应在合并前修复 |
| 🟡 MEDIUM | 可维护性问题 | **建议** - 考虑修复 |
| 🟢 LOW | 风格或次要建议 | **可选** |

---

## 6. 提交与部署

### 6.1 Git 工作流

遵循 [git-workflow.md](~/.claude/rules/common/git-workflow.md)：

#### 提交消息格式

```
<type>: <description>

<optional body>
```

**类型**：
- `feat` - 新功能
- `fix` - Bug 修复
- `refactor` - 重构
- `docs` - 文档
- `test` - 测试
- `chore` - 杂项
- `perf` - 性能优化
- `ci` - CI/CD 配置

#### 提交前检查

```bash
# 1. 查看状态
git status

# 2. 查看差异
git diff

# 3. 查看提交历史
git log --oneline -10

# 4. 添加文件（明确指定，避免 git add .）
git add src/auth/login.ts
git add tests/auth/login.test.ts

# 5. 提交（遵循格式）
git commit -m "feat: 实现用户登录功能

- 添加 JWT 认证
- 实现登录 API
- 添加单元测试和集成测试
- 覆盖率：85%"

# 6. 推送
git push origin feature/auth
```

### 6.2 Pull Request 流程

1. **创建 PR**
   ```bash
   # 使用 gh CLI
   gh pr create --title "feat: 实现用户认证系统" --body-file pr-template.md
   ```

2. **PR 内容要求**
   - 清晰的标题和描述
   - 关联的 Issue
   - 测试计划（TODO 列表）
   - 截图（如有 UI 变更）

3. **PR 模板示例**
   ```markdown
   ## Summary
   - 实现用户注册和登录
   - 添加 JWT 认证中间件
   - 集成测试覆盖率 85%

   ## Test Plan
   - [ ] 单元测试通过
   - [ ] 集成测试通过
   - [ ] 手动测试登录流程
   - [ ] 检查错误处理

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

### 6.3 本地打包部署

本项目为本地单机版,使用以下脚本打包部署：

#### Windows 打包脚本 (scripts/build.bat)

```batch
@echo off
echo === 亚星电子销售管理系统 - 打包 ===

REM 1. 构建前端
cd frontend
call pnpm install
call pnpm build
cd ..

REM 2. 安装后端依赖
cd backend
pip install -r requirements.txt
pip install pyinstaller
pyinstaller --onefile --name yaxing-server app/main.py
cd ..

REM 3. 组装发布包
mkdir dist\yaxing-sales-system
xcopy frontend\dist dist\yaxing-sales-system\frontend\ /E /I
copy backend\dist\yaxing-server.exe dist\yaxing-sales-system\
copy scripts\start.bat dist\yaxing-sales-system\

echo === 打包完成 ===
```

#### 启动脚本 (scripts/start.bat)

```batch
@echo off
echo 正在启动亚星电子销售管理系统...
start "" yaxing-server.exe
timeout /t 2 >nul
start http://127.0.0.1:8000
```

### 6.4 部署前最终检查

- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] CI/CD 通过
- [ ] 环境变量已配置
- [ ] 数据库迁移已测试
- [ ] 安全审查完成
- [ ] 性能测试通过
- [ ] 文档已更新

---

## 附录

### A. 必需代理列表

| 代理 | 使用时机 | 用途 |
|------|---------|------|
| **planner** | 规划阶段 | 创建实现计划 |
| **architect** | 架构决策 | 技术选型、系统设计 |
| **tdd-guide** | 开发阶段 | 强制测试先行 |
| **code-reviewer** | 编码后 | 代码质量审查 |
| **security-reviewer** | 安全敏感代码 | 安全漏洞检测 |
| **build-error-resolver** | 构建失败 | 修复构建错误 |
| **e2e-runner** | E2E 测试 | 关键用户流程测试 |

### B. 参考规则

- [common/development-workflow.md](~/.claude/rules/common/development-workflow.md) - 完整开发流程
- [common/coding-style.md](~/.claude/rules/common/coding-style.md) - 编码风格
- [common/testing.md](~/.claude/rules/common/testing.md) - 测试要求
- [common/security.md](~/.claude/rules/common/security.md) - 安全指南
- [common/git-workflow.md](~/.claude/rules/common/git-workflow.md) - Git 工作流
- [common/agents.md](~/.claude/rules/common/agents.md) - 代理编排

### C. 常用命令速查

```bash
# 项目初始化
npm init -y
npm install

# 测试
npm test
npm test -- --coverage
npm test -- --watch

# Lint 和格式化
npm run lint
npm run lint:fix
npm run format

# 构建
npm run build
npm run dev

# Git
git status
git add <files>
git commit -m "<type>: <description>"
git push origin <branch>

# GitHub
gh pr create
gh pr view
gh issue list
```

---

## 快速启动清单

开始亚星电子销售管理系统开发时，按顺序执行：

1. [ ] **研究与重用** - GitHub 搜索类似库存管理系统、销售系统
2. [ ] **规划** - 启动 planner 代理，生成规划文档 (PRD.md 已完成)
3. [ ] **架构设计** - 启动 architect 代理，设计数据库表结构、API 接口
4. [ ] **初始化** - 创建目录结构、配置文件 (TypeScript + React + Python + SQLite)
5. [ ] **数据库设计** - 设计 SQLite 表结构、索引、关系
6. [ ] **TDD 开发** - 启动 tdd-guide 代理，测试先行
   - [ ] 库存管理模块 (品牌/类型/商品/仓库)
   - [ ] 销售管理模块 (客户/开单/订单)
   - [ ] 报表统计模块 (今日销售/利润/库存报表)
7. [ ] **代码审查** - 启动 code-reviewer 代理
8. [ ] **安全审查** - 启动 security-reviewer 代理 (JWT 认证、数据备份)
9. [ ] **提交** - 遵循 Git 工作流
10. [ ] **打包部署** - 执行 build.bat 打包,测试解压即用
11. [ ] **用户文档** - 编写 USER-GUIDE.md (开单/入库/打印/导出操作说明)

---

## 项目特定注意事项

### 数据联动规则
- ✅ 销售商品 → 自动扣减库存
- ✅ 以旧换新 → 自动增加旧货库存
- ✅ 采购入库 → 自动增加库存
- ✅ 销售单作废 → 自动恢复库存

### 性能要求
- 启动时间 < 3 秒
- 操作响应 < 500ms
- 数据查询 < 1 秒 (万级数据)
- 7×24 小时稳定运行

### 默认配置
- 默认地址: 江苏省 - 苏州市 - 吴中区 - 临湖镇
- 备份保留: 最近 30 天
- 单管理员账号

---

**记住**：质量优先于速度。遵循这个流程可以确保项目从一开始就建立在坚实的基础之上。