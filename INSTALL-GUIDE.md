# 亚星电子经营部销售管理系统 - 安装部署指南

> 本指南面向普通电脑用户，手把手教你从零开始安装和运行本系统。

## 目录

- [一、环境要求](#一环境要求)
- [二、安装 Python](#二安装-python)
- [三、安装 Node.js](#三安装-nodejs)
- [四、安装 pnpm](#四安装-pnpm)
- [五、下载项目](#五下载项目)
- [六、配置环境变量](#六配置环境变量)
- [七、安装后端依赖](#七安装后端依赖)
- [八、安装前端依赖](#八安装前端依赖)
- [九、启动系统](#九启动系统)
- [十、常见问题](#十常见问题)

---

## 一、环境要求

### 操作系统

- **Windows 10** 或 **Windows 11**（推荐）

### 硬件要求

| 配置项 | 最低要求 | 推荐配置 |
|--------|---------|---------|
| CPU | 双核 | 四核及以上 |
| 内存 | 4GB | 8GB 及以上 |
| 硬盘 | 500MB 可用空间 | 1GB 及以上 |

### 软件要求

| 软件 | 版本要求 | 用途 |
|------|---------|------|
| Python | 3.12 或更高 | 运行后端服务 |
| Node.js | 18.x 或更高 | 运行前端服务 |
| pnpm | 8.x 或更高 | 前端包管理器 |

---

## 二、安装 Python

### 步骤 1：下载 Python

1. 打开浏览器，访问 Python 官网：https://www.python.org/downloads/
2. 点击 **Download Python 3.x.x** 按钮（下载最新版本）
3. 等待下载完成

### 步骤 2：安装 Python

1. 双击下载的安装文件（如 `python-3.12.x-amd64.exe`）
2. **重要**：勾选底部的 **"Add python.exe to PATH"** 选项
   ![勾选 PATH](images/python-install-1.png)
3. 点击 **Install Now** 开始安装
4. 等待安装完成，点击 **Close** 关闭窗口

### 步骤 3：验证安装

1. 按 `Win + R` 打开运行窗口
2. 输入 `cmd` 并回车，打开命令提示符
3. 输入以下命令并回车：

   ```cmd
   python --version
   ```

4. 如果显示 `Python 3.12.x`，说明安装成功

### 步骤 4：安装 pip（通常已自动安装）

在命令提示符中输入：

```cmd
pip --version
```

如果显示版本号，说明 pip 已安装。如果提示找不到命令，请重新安装 Python 并确保勾选 PATH 选项。

---

## 三、安装 Node.js

### 步骤 1：下载 Node.js

1. 打开浏览器，访问 Node.js 官网：https://nodejs.org/
2. 下载 **LTS（长期支持版）** 版本（推荐 18.x 或 20.x）
3. 等待下载完成

### 步骤 2：安装 Node.js

1. 双击下载的安装文件（如 `node-v18.x.x-x64.msi`）
2. 点击 **Next** 继续
3. 勾选 **I accept the terms in the License Agreement**，点击 **Next**
4. 保持默认安装路径，点击 **Next**
5. 保持默认组件选择，点击 **Next**
6. 点击 **Install** 开始安装
7. 等待安装完成，点击 **Finish**

### 步骤 3：验证安装

打开新的命令提示符窗口，输入：

```cmd
node --version
```

如果显示 `v18.x.x` 或更高版本，说明安装成功。

同时验证 npm：

```cmd
npm --version
```

---

## 四、安装 pnpm

### 步骤 1：全局安装 pnpm

打开命令提示符，输入以下命令：

```cmd
npm install -g pnpm
```

等待安装完成。

### 步骤 2：验证安装

```cmd
pnpm --version
```

如果显示版本号（如 `8.x.x`），说明安装成功。

---

## 五、下载项目

### 方式一：从 GitHub 下载（推荐）

1. 访问项目地址：https://github.com/justin9you/star
2. 点击绿色的 **Code** 按钮
3. 选择 **Download ZIP**
4. 解压下载的文件到任意目录（如 `D:\yaxing-sales-system`）

### 方式二：使用 Git 克隆（需要安装 Git）

```cmd
git clone https://github.com/justin9you/star.git
```

---

## 六、配置环境变量

### 步骤 1：创建环境变量文件

1. 进入项目根目录
2. 找到 `.env.example` 文件
3. 复制一份，重命名为 `.env`（去掉 `.example` 后缀）

### 步骤 2：编辑环境变量（可选）

用记事本打开 `.env` 文件，可以根据需要修改以下配置：

```bash
# 数据库配置
DATABASE_PATH=./backend/data/yaxing.db

# 认证配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme    # 建议修改为复杂密码
JWT_SECRET=your-jwt-secret-here    # 建议修改为随机字符串
JWT_EXPIRES_IN=604800

# API 配置
API_HOST=127.0.0.1
API_PORT=8001    # 后端端口
API_PREFIX=/api/v1

# 备份配置
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=30

# 默认地址
DEFAULT_REGION_PROVINCE=江苏省
DEFAULT_REGION_CITY=苏州市
DEFAULT_REGION_DISTRICT=吴中区
DEFAULT_REGION_TOWN=临湖镇

# 店铺信息
SHOP_NAME=亚星电子经营部
SHOP_ADDRESS=江苏省苏州市吴中区临湖镇
SHOP_PHONE=138-0000-0000
```

---

## 七、安装后端依赖

### 步骤 1：进入后端目录

打开命令提示符，输入：

```cmd
cd /d 项目路径\backend
```

例如，如果项目解压在 `D:\yaxing-sales-system`：

```cmd
cd /d D:\yaxing-sales-system\backend
```

### 步骤 2：安装依赖

输入以下命令：

```cmd
pip install -r requirements.txt
```

等待安装完成（可能需要几分钟，取决于网络速度）。

### 步骤 3：验证安装

如果安装过程中没有报错，说明依赖安装成功。

---

## 八、安装前端依赖

### 步骤 1：进入前端目录

在命令提示符中输入：

```cmd
cd /d 项目路径\frontend
```

例如：

```cmd
cd /d D:\yaxing-sales-system\frontend
```

### 步骤 2：安装依赖

输入以下命令：

```cmd
pnpm install
```

等待安装完成（首次安装可能需要几分钟）。

### 步骤 3：验证安装

如果安装过程中没有报错，说明依赖安装成功。

---

## 九、启动系统

### 方式一：使用启动脚本（推荐）

双击运行项目根目录下的 `scripts\dev.bat` 文件，会自动启动后端和前端服务。

### 方式二：手动启动

#### 启动后端服务

1. 打开一个命令提示符窗口
2. 进入后端目录：

   ```cmd
   cd /d 项目路径\backend
   ```

3. 启动后端服务：

   ```cmd
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
   ```

4. 看到 `Uvicorn running on http://127.0.0.1:8001` 表示后端启动成功
5. **保持此窗口打开**

#### 启动前端服务

1. 打开另一个命令提示符窗口
2. 进入前端目录：

   ```cmd
   cd /d 项目路径\frontend
   ```

3. 启动前端服务：

   ```cmd
   pnpm dev
   ```

4. 看到 `Local: http://localhost:8082/` 表示前端启动成功
5. **保持此窗口打开**

#### 访问系统

打开浏览器，访问：http://localhost:8082

### 默认登录账号

- 用户名：`admin`
- 密码：`changeme`

---

## 十、常见问题

### Q1：Python 安装后提示"不是内部或外部命令"

**原因**：Python 没有添加到系统环境变量。

**解决方法**：
1. 重新运行 Python 安装程序
2. 勾选 **"Add python.exe to PATH"** 选项
3. 或者手动添加环境变量：
   - 右键"此电脑" → "属性" → "高级系统设置"
   - 点击"环境变量"
   - 在"系统变量"中找到"Path"，点击"编辑"
   - 添加 Python 安装路径（如 `C:\Users\用户名\AppData\Local\Programs\Python\Python312`）

### Q2：pip install 很慢或失败

**原因**：默认的 pip 源在国外，国内访问较慢。

**解决方法**：使用国内镜像源

```cmd
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

或者永久设置：

```cmd
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

### Q3：pnpm install 很慢或失败

**原因**：npm 源在国外，国内访问较慢。

**解决方法**：使用国内镜像源

```cmd
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

### Q4：端口被占用

**症状**：启动时提示 `Address already in use` 或 `端口被占用`

**解决方法**：

1. 查找占用端口的进程：

   ```cmd
   netstat -ano | findstr :8001
   ```

2. 根据显示的 PID 结束进程：

   ```cmd
   taskkill /PID 进程号 /F
   ```

### Q5：数据库文件找不到

**症状**：后端启动时报错 `no such table`

**解决方法**：
1. 确保 `.env` 文件中的 `DATABASE_PATH` 路径正确
2. 首次启动时，系统会自动创建数据库文件
3. 如果需要初始化数据，运行：

   ```cmd
   cd backend
   python scripts/init_db.py
   ```

### Q6：前端页面空白或报错

**可能原因**：
1. 后端服务未启动
2. 后端端口配置不正确
3. 浏览器缓存问题

**解决方法**：
1. 确保后端服务正在运行
2. 检查 `.env` 文件中的端口配置
3. 清除浏览器缓存或使用无痕模式
4. 检查浏览器控制台（F12）是否有错误信息

### Q7：无法登录

**可能原因**：
1. 数据库未初始化
2. 密码错误

**解决方法**：
1. 确保数据库已初始化
2. 使用默认账号：`admin` / `changeme`
3. 如需重置密码，删除数据库文件重新初始化

### Q8：打印功能不工作

**解决方法**：
1. 确保已安装打印机驱动
2. 在浏览器中按 `Ctrl + P` 测试打印
3. 检查浏览器是否阻止了弹出窗口

---

## 附录：一键安装脚本

如果你已经安装了 Python、Node.js 和 pnpm，可以创建以下批处理脚本一键安装和启动：

### install.bat（一键安装依赖）

```batch
@echo off
chcp 65001 >nul
echo === 亚星电子经营部销售管理系统 - 一键安装 ===
echo.

echo [1/4] 检查 Python...
python --version
if errorlevel 1 (
    echo 错误：请先安装 Python 3.12+
    pause
    exit /b 1
)

echo.
echo [2/4] 检查 Node.js...
node --version
if errorlevel 1 (
    echo 错误：请先安装 Node.js 18+
    pause
    exit /b 1
)

echo.
echo [3/4] 安装后端依赖...
cd backend
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
cd ..

echo.
echo [4/4] 安装前端依赖...
cd frontend
pnpm install
cd ..

echo.
echo === 安装完成 ===
echo 请运行 dev.bat 启动系统
pause
```

### dev.bat（一键启动开发环境）

```batch
@echo off
chcp 65001 >nul
echo === 亚星电子经营部销售管理系统 - 启动中 ===

REM 启动后端
start "后端服务" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

REM 等待后端启动
timeout /t 3 >nul

REM 启动前端
start "前端服务" cmd /k "cd /d %~dp0frontend && pnpm dev"

REM 等待前端启动
timeout /t 5 >nul

REM 打开浏览器
start http://localhost:8082

echo === 系统已启动 ===
echo 后端地址: http://127.0.0.1:8001
echo 前端地址: http://localhost:8082
echo 默认账号: admin / changeme
echo.
echo 关闭此窗口不会停止服务，请手动关闭后端和前端窗口
pause
```

---

## 技术支持

如有问题，请联系：

- GitHub Issues: https://github.com/justin9you/star/issues
- 店铺电话：138-0000-0000

---

**文档版本**: v1.0
**更新日期**: 2026-04-27