import { useEffect, useState } from "react";
import { ActionPanel, Action, Grid, Icon, showToast, Toast } from "@raycast/api";
import { searchMemes as searchPdanMemes, getRecommendedMemes } from "./fetchers/pdan";
import { searchMemes as searchSougouMemes } from "./fetchers/sougou";
import { fetchMemes as searchDoutupkMemes } from "./fetchers/doutupk";
import { searchMemes as searchQudoutuMemes } from "./fetchers/qudoutu";
import { searchMemes as searchFabiaoqingMemes } from "./fetchers/fabiaoqing";
import { Meme } from "./fetchers/define";
import { processMeme } from "./process/process";
import { MemePreview } from "./layouts/preveiw";






export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [allIcons, setAllIcons] = useState<Meme[]>([]);
  const [displayIcons, setDisplayIcons] = useState<Meme[]>([]);
  const [statusText, setStatusText] = useState<string>("加载推荐表情包...");
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [pageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;
    const lastSearchText = searchText;

    async function fetchMemes() {
      try {
        // 更新加载状态和提示文本
        setIsLoading(true);

        if (lastSearchText) {
          setStatusText(`搜索表情包: "${lastSearchText}"...`);
          await showToast({
            style: Toast.Style.Animated,
            title: "正在搜索",
            message: `查找表情包: "${lastSearchText}"`,
            primaryAction: {
              title: "取消",
              onAction: () => {
                setSearchText("");
              },
            },
          });
        } else {
          setStatusText("加载推荐表情包...");
        }

        // 执行搜索
        let result: Meme[] = [];
        if (lastSearchText) {
          const searchFuncs = [searchFabiaoqingMemes, searchQudoutuMemes, searchDoutupkMemes, searchPdanMemes, searchSougouMemes];
          for (const searchFunc of searchFuncs) {
            const onceResult = await searchFunc(lastSearchText, 50);
            result = [...result, ...onceResult];
            if (result.length > 50) {
              break;
            }
          }
        } else {
          result = await getRecommendedMemes(50);
        }


        // 随机打乱
        result.sort(() => Math.random() - 0.5);

        // 确保组件仍然挂载且搜索文本未变化
        if (isMounted && lastSearchText === searchText) {
          setAllIcons(result);

          // 重置分页状态
          setCurrentPage(1);

          // 显示第一页内容
          const firstPageItems = result.slice(0, pageSize);
          setDisplayIcons(firstPageItems);

          // 设置是否有更多页
          setHasMore(result.length > pageSize);

          setIsLoading(false);

          // 显示结果状态
          if (result.length === 0) {
            setStatusText("未找到匹配的表情包");
            await showToast({
              style: Toast.Style.Failure,
              title: "未找到结果",
              message: lastSearchText ? `未找到"${lastSearchText}"相关表情包` : "未能获取推荐表情包",
            });
          } else {
            setStatusText(lastSearchText ? `找到 ${result.length} 个相关表情包` : `推荐表情包 (${result.length})`);
            await showToast({
              style: Toast.Style.Success,
              title: "搜索完成",
              message: `找到 ${result.length} 个表情包`,
            });
          }
        }
      } catch (error) {
        console.error("获取表情包失败:", error);
        if (isMounted && lastSearchText === searchText) {
          setIsLoading(false);
          setStatusText("获取表情包失败，请重试");
          await showToast({
            style: Toast.Style.Failure,
            title: "搜索失败",
            message: String(error),
          });
        }
      }
    }

    // 使用setTimeout添加轻微延迟，避免频繁搜索
    const timer = setTimeout(() => {
      fetchMemes();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchText, pageSize]);

  // 加载更多表情包
  const loadMore = async () => {
    if (!hasMore) return;

    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * pageSize;
    const endIndex = nextPage * pageSize;

    // 添加新的表情包到显示列表
    const nextPageItems = allIcons.slice(startIndex, endIndex);
    setDisplayIcons([...displayIcons, ...nextPageItems]);

    // 更新分页状态
    setCurrentPage(nextPage);
    setHasMore(endIndex < allIcons.length);

    await showToast({
      style: Toast.Style.Success,
      title: "加载更多",
      message: `已加载 ${Math.min(endIndex, allIcons.length)} / ${allIcons.length} 个表情包`,
    });
  };

  // 处理预览逻辑
  const handlePreview = (meme: Meme) => {
    setSelectedMeme(meme);
    setShowPreview(true);
  };

  // 处理返回逻辑
  const handleGoBack = () => {
    setShowPreview(false);
    setSelectedMeme(null);
  };

  // 如果显示预览，渲染预览组件
  if (showPreview && selectedMeme) {
    return <MemePreview meme={selectedMeme} onGoBack={handleGoBack} />;
  }

  return (
    <Grid
      columns={6}
      fit={Grid.Fit.Fill}
      throttle={true}
      isLoading={isLoading}
      searchBarPlaceholder="搜索表情包..."
      onSearchTextChange={setSearchText}
      navigationTitle={statusText}
      onSelectionChange={(id) => {
        if (id === "load-more") {
          loadMore();
        }
      }}
    >
      {displayIcons.length === 0 && !isLoading ? (
        <Grid.Item
          title="未找到表情包"
          content={{ source: Icon.QuestionMark }}
          subtitle={searchText ? `未找到与"${searchText}"相关的表情包` : "无法获取推荐表情包"}
        />
      ) : (
        <>
          {displayIcons.map((meme, index) => (
            <Grid.Item
              key={index}
              content={meme.url}
              title={meme.title}
              accessory={{
                icon: Icon.Info,
                tooltip: meme.title,
              }}
              actions={
                <ActionPanel>
                  <Action title="复制到剪贴板" icon={Icon.Clipboard} onAction={() => processMeme(meme)} />
                  <Action title="预览表情包" icon={Icon.Eye} onAction={() => handlePreview(meme)} />
                </ActionPanel>
              }
            />
          ))}

          {hasMore && (
            <Grid.Item
              id="load-more"
              title="加载更多表情包"
              subtitle={`已显示 ${displayIcons.length} / ${allIcons.length} 个`}
              content={{ source: Icon.Plus }}
              actions={
                <ActionPanel>
                  <Action
                    title="加载更多表情包"
                    icon={Icon.Plus}
                    onAction={loadMore}
                    shortcut={{ modifiers: ["cmd"], key: "l" }}
                  />
                </ActionPanel>
              }
            />
          )}
        </>
      )}
    </Grid>
  );
}
