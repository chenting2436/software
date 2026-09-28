# 矿大 · 土行孙 V2

多源监测与分析平台，当前版本 **2.4.4**。包含网页端与 Windows 桌面端完整项目源码。

主要功能：设备管理与三维部件展示、数据接入与处理、算法工作区、历史回溯、风险处置，以及可保存、预览和编排的综合大屏。

## 开发环境

- 推荐使用此次验证环境：Windows x64、Node.js 24.14.0、npm 11.9.0、Go 1.27.1、Wails CLI 2.15.0。
- 项目声明 Go 1.25；前端工具要求 Node.js 20.19+ 或 22.12+。这些较低版本未在此次交付中重新验证。
- 桌面运行需要 Microsoft Edge WebView2；安装包构建需要 NSIS 3.x。
- 首次安装开发工具及下载 npm/Go 依赖需要网络。开发人员需要此仓库的访问权限，使用自己的 GitHub 认证，不共享他人的 SSH 私钥。

## 克隆与启动网页

```powershell
git clone git@github.com:chenting2436/software.git
cd software/frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

打开 <http://127.0.0.1:5174/>。本地登录账号和密码均为 `root`。

登录和角色切换仅为本地前端功能，不构成服务端安全认证。开发服务器默认只监听本机，不应直接作为生产服务暴露到公网。

## 检查与前端构建

在 `frontend` 目录执行：

```powershell
node --test --test-concurrency=2 tests/*.test.mjs
npm run build
```

前端产物生成后，回到项目根目录检查 Go 项目：

```powershell
cd ..
go test ./...
```

`main.go` 嵌入 `frontend/dist`，因此全新克隆后必须先生成前端产物再单独执行 `go test` / `go build`。Wails 构建流程会自动构建前端。

## Windows 桌面端与安装包

安装 Go、Node.js、WebView2 后，在项目根目录安装指定 Wails 版本：

```powershell
go install github.com/wailsapp/wails/v2/cmd/wails@v2.15.0
$env:Path = "$(go env GOPATH)\bin;" + $env:Path
wails dev
```

生成免安装 EXE：

```powershell
wails build -platform windows/amd64 -trimpath -m -nosyncgomod
```

安装 NSIS 后生成安装包；如果 NSIS 不在默认目录，请将下方路径替换为实际安装路径：

```powershell
$env:Path = "C:\Program Files (x86)\NSIS;" + $env:Path
wails build -nsis -platform windows/amd64 -trimpath -m -nosyncgomod
```

输出：

- `build/bin/Kuangda-Tuxingsun-V2-Demo.exe`：免安装桌面应用。
- `build/bin/Kuangda-Tuxingsun-V2.4.4-amd64-Setup.exe`：Windows x64 安装包。

程序未做商业代码签名，Windows 可能提示未知发布者；不要把成功打包等同于已完成所有目标电脑的兼容性验收。

## 项目目录

| 路径 | 内容 |
| --- | --- |
| `frontend/src/` | React / TypeScript 页面、交互、可视化和本地计算 |
| `frontend/public/scene-assets/` | 已打包的地形与设备素材；来源见 `SOURCES.md` |
| `frontend/tests/` | 前端自动化测试 |
| `frontend/scripts/` | 场景素材准备及设备模型生成脚本 |
| `frontend/wailsjs/` | 桌面桥接代码 |
| `app.go`、`main.go` | Wails 桌面入口 |
| `cmd/webserver/` | 可选 Windows 静态网页服务入口，非主桌面程序 |
| `build/` | 图标、平台配置和安装脚本，不含生成的安装包 |
| `docs/` | 设计、变更和验证记录 |

## 数据与交接边界

- 设备遥测、地形和巡检视景包含本地模拟数据与概念模型，未接入现场设备或实时视频。
- 换算、标定拟合、协议样本解析等包含实际本地计算；配置发布、回滚及工单仅保存本机记录，不下发硬件。
- 大屏及业务配置保存在当前浏览器来源的本地存储中，不属于源码。更换浏览器、访问地址或电脑不会自动同步；需要带走个人大屏方案时使用现有导出功能另行交接。
- 必要的本地图片、字体、GLB 模型及高程文件已纳入源码。默认场景不需要重新运行素材下载脚本；可选在线地图仍依赖外部服务和网络。
- 已取消 A / B / D 新功能与新增示例功能，对应文档仅为历史存档。`docs/` 也保留早期被后续方案替代的设计，当前状态参见 `V2.4.4修改与验证-2026-09-26.md`。
- 不上传 `node_modules`、编译产物、日志、私钥、私密配置或原始客户录音/需求附件。依赖按 `package-lock.json`、`go.mod` 和 `go.sum` 恢复，不需要复制原开发电脑的依赖目录。
