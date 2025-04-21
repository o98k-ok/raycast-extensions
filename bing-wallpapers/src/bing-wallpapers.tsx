import { useState, useEffect } from "react";
import { ActionPanel, Action, Icon, Grid, Color, showToast, Toast, getPreferenceValues } from "@raycast/api";
import { runAppleScript } from "run-applescript";
import fs from "fs";
import path from "path";
import fetchLastestBingImages from "./bing";
import { getImageMeta } from "./bing";

// 定义首选项接口
interface Preferences {
  wallpaperPath: string;
}

// 支持的图片文件扩展名
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

// 获取文件的修改时间
function getFileCreationTime(filePath: string): Date {
  try {
    const stats = fs.statSync(filePath);
    return stats.ctime;
  } catch (error) {
    console.error(`Error getting file creation time: ${error}`);
    return new Date(0);
  }
}

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [wallpapers, setWallpapers] = useState<string[]>([]);
  const preferences = getPreferenceValues<Preferences>();


  fetchLastestBingImages();

  // 加载图片文件
  useEffect(() => {
    async function loadWallpapers() {
      try {
        const wallpaperDir = preferences.wallpaperPath;

        if (!fs.existsSync(wallpaperDir)) {
          await showToast({
            style: Toast.Style.Failure,
            title: "目录不存在",
            message: "配置的壁纸目录不存在，请在扩展设置中更新",
          });
          setIsLoading(false);
          return;
        }

        // 读取目录内容
        const files = fs.readdirSync(wallpaperDir);

        // 过滤出图片文件并获取完整路径
        const imageFiles = files
          .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return IMAGE_EXTENSIONS.includes(ext);
          })
          .map(file => path.join(wallpaperDir, file));

        // 按修改时间排序（最新的在前面）
        imageFiles.sort((a, b) =>
          getFileCreationTime(b).getTime() - getFileCreationTime(a).getTime()
        );

        imageFiles.slice(5).sort(() => Math.random() - 0.5);
        setWallpapers(imageFiles.slice(0, 100))
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading wallpapers:", error);
        await showToast({
          style: Toast.Style.Failure,
          title: "加载失败",
          message: String(error),
        });
        setIsLoading(false);
      }
    }

    loadWallpapers();
  }, [preferences.wallpaperPath]);

  return (
    <Grid
      columns={5}
      aspectRatio={"16/9"}
      fit={Grid.Fit.Fill}
      isLoading={isLoading}
      navigationTitle={`壁纸浏览器 (${wallpapers.length}张图片)`
      }
    >
      {
        wallpapers.length === 0 && !isLoading ? (
          <Grid.EmptyView
            icon={{ source: Icon.Image, tintColor: Color.PrimaryText }}
            title="未找到图片"
          />
        ) : (
          wallpapers.map((wallpaper) => {
            const { startdate, title, copyright } = getImageMeta(wallpaper);
            return (
              <Grid.Item
                key={wallpaper}
                content={{ source: `${wallpaper}` }}
                title={title}
                accessory={{
                  icon: Icon.Info,
                  tooltip: `${startdate} - ${copyright}`,
                }}
                actions={
                  <ActionPanel>
                    <Action title="设置为壁纸" icon={Icon.Desktop} onAction={() => setDesktopPicture(wallpaper)} />
                    <Action.ShowInFinder title="打开Finder" icon={Icon.Eye} path={wallpaper} />
                  </ActionPanel>
                }
              />
            );
          })
        )
      }
    </Grid >
  );
}


function setDesktopPicture(path: string) {
  const script = `
  tell application "Finder" to set desktop picture to POSIX file "${path}"
  `;
  runAppleScript(script);
}

