import { ActionPanel, Action, Icon, List, Detail, showToast, Toast, Color } from "@raycast/api";
import { useState, useEffect } from "react";
import { getPods, getPodResources, Pod, PodResource } from "./utils";

export default function Command() {
  const [pods, setPods] = useState<Pod[]>([]);
  const [podResources, setPodResources] = useState<PodResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [podsData, resourcesData] = await Promise.all([getPods(), getPodResources()]);
        setPods(podsData);
        setPodResources(resourcesData);
      } catch (e) {
        console.error(e);
        setError(String(e));
        showToast({
          style: Toast.Style.Failure,
          title: "获取数据失败",
          message: String(e),
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // 查找 Pod 对应的资源使用信息
  const getPodResource = (podName: string) => {
    return podResources.find((resource) => resource.name === podName);
  };

  // 获取基于状态的颜色
  const getStatusColor = (status: string): Color => {
    switch (status.toLowerCase()) {
      case "running":
        return Color.Green;
      case "pending":
        return Color.Yellow;
      case "succeeded":
        return Color.Blue;
      case "failed":
        return Color.Red;
      case "crashloopbackoff":
        return Color.Magenta;
      case "imagepullbackoff":
        return Color.Orange;
      default:
        return Color.SecondaryText;
    }
  };

  if (error) {
    return <Detail markdown={`# Error\n\n${error}`} />;
  }

  const getPodPrefix = (pods: Pod[]): string[] => {
    const prefixes = new Set<string>();
    pods.forEach((pod) => {
      const prefix = pod.name.split("-").slice(0, -2).join("-");
      prefixes.add(prefix);
    });
    return Array.from(prefixes);
  };

  const getRestartColor = (restarts: string): Color => {
    if (restarts === "0") {
      return Color.Green;
    } else {
      return Color.Red;
    }
  };

  const podnames = ["all", ...getPodPrefix(pods)]

  const resultPods = pods.filter((pod) => {
    if (searchText === "") {
      return true;
    }
    return pod.name.toLowerCase().includes(searchText.toLowerCase());
  });

  return (
    <List isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown
          tooltip="展示布局"
          onChange={(newValue) => {
            if (newValue != "all") {
              setSearchText(newValue);
            } else {
              setSearchText("");
            }
          }}
          defaultValue="all"
        >
          {
            podnames.map((item) => {
              return <List.Dropdown.Item key={item} title={item} value={item} />
            })
          }
        </List.Dropdown>
      }
      searchBarPlaceholder="搜索 Pod...">
      {
        resultPods.map((pod) => {
          const resource = getPodResource(pod.name);
          const statusColor = getStatusColor(pod.status);
          const restartColor = getRestartColor(pod.restarts);
          return (
            <List.Item
              key={pod.name}
              icon={getStatusIcon(pod.status)}
              title={pod.name}
              subtitle={`内存: ${resource?.memory || "N/A"} • CPU: ${resource?.cpu || "N/A"}`}
              accessories={[
                { tag: { value: pod.status, color: statusColor }, tooltip: "状态" },
                { tag: { value: pod.restarts, color: restartColor }, tooltip: "重启次数" },
                { tag: { value: pod.age, color: Color.Green }, tooltip: "存活时间" },
              ]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="查看详细信息"
                    icon={Icon.Eye}
                    shortcut={{ modifiers: ["cmd"], key: "d" }}
                    target={<PodDetailView pod={pod} resource={resource} />}
                  />
                </ActionPanel>
              }
            />
          );
        })
      }
    </List >
  );
}

function PodDetailView({ pod, resource }: { pod: Pod; resource?: PodResource }) {
  const markdown = `
# ${pod.name}

## 状态信息
- **状态**: ${pod.status}
- **就绪**: ${pod.ready}
- **重启次数**: ${pod.restarts}
- **存活时间**: ${pod.age}
- **IP 地址**: ${pod.ip}
- **节点**: ${pod.node}

${resource ? `
## 资源使用
- **CPU**: ${resource.cpu}
- **内存**: ${resource.memory}
` : ''}
  `;

  return <Detail markdown={markdown} />;
}

function getStatusIcon(status: string): Icon {
  switch (status.toLowerCase()) {
    case "running":
      return Icon.Circle;
    case "pending":
      return Icon.Clock;
    case "succeeded":
      return Icon.CheckCircle;
    case "failed":
      return Icon.XmarkCircle;
    default:
      return Icon.QuestionMark;
  }
}
