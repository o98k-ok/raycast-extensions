# Easy Kubelet Changelog

## [v1.0.0] - 2023-10-26

### 🚀 首次发布

- ✨ 基本功能实现：通过 Raycast UI 查看 Kubernetes Pod 信息
- 🔧 支持 `kubectl get pods` 命令查询 Pod 列表
- 📊 支持 `kubectl top pod` 命令查询资源使用
- 🔍 支持搜索和筛选 Pod
- 🎨 状态颜色标识，直观显示 Pod 健康状况
- 🏷️ 根据 Pod 名称前缀自动分类
- 🛠️ 可配置的命名空间和 kubectl 路径
- 📋 详细信息查看页面
- 📝 支持复制 Pod 名称和 IP 地址