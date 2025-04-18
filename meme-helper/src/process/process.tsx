import { showToast, Toast, getPreferenceValues, Clipboard, showHUD } from "@raycast/api";
import { homedir } from "os";
import { join, parse, join as pathJoin } from "path";
import fs from "fs";
import { execFile } from "child_process";
import { Meme } from "../fetchers/define";
import crypto from "crypto";

interface Preferences {
  downloadPath?: string;
}

/**
 * 获取图片保存目录
 * @returns 图片保存目录路径
 */
function getImageDirectory(): string {
  const preferences = getPreferenceValues<Preferences>();
  // 如果用户设置了下载路径，使用用户设置的路径
  if (preferences.downloadPath) {
    return preferences.downloadPath;
  }

  // 默认保存到用户主目录的Downloads/raycast-meme目录
  const downloadDir = join(homedir(), "Downloads", "raycast-meme");

  // 确保目录存在
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  return downloadDir;
}

/**
 * 获取图片文件名
 * @param meme 表情包信息
 * @returns 生成的文件名
 */
function generateFileName(meme: Meme): string {
  // 从URL中提取文件扩展名
  const md5Hash = crypto.createHash('md5').update(meme.url).digest('hex');

  // 使用平台名称和时间戳创建文件名
  const timestamp = new Date().getTime();
  return `${meme.platform}_${md5Hash}_${timestamp}`;
}

/**
 * 下载图片到本地
 * @param meme 表情包信息
 * @returns 返回下载后的本地文件路径
 */
export async function downloadImage(meme: Meme): Promise<string> {
  try {
    // 获取保存目录
    const saveDir = getImageDirectory();
    const fileName = generateFileName(meme);
    const filePath = join(saveDir, fileName);

    // 获取图片内容
    const response = await fetch(meme.url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 写入文件
    fs.writeFileSync(filePath, buffer);

    return filePath;
  } catch (error) {
    console.error("下载图片失败:", error);
    throw new Error("下载图片失败");
  }
}

/**
 * 复制图片到剪贴板
 * @param filePath 本地图片路径
 */
export async function copyImageToClipboard(filePath: string): Promise<void> {
  try {
    // 根据平台使用不同的方式复制图片
    if (process.platform === "darwin") {
      // macOS: 使用osascript
      await new Promise<void>((resolve, reject) => {
        execFile("osascript", ["-e", `set the clipboard to POSIX file "${filePath}"`], (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } else {
      // 其他平台：使用文本形式复制文件路径
      await Clipboard.copy(filePath);
    }

    await showHUD("图片已复制到剪贴板");
  } catch (error) {
    console.error("复制图片失败:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "复制图片失败",
      message: String(error),
    });
  }
}

/**
 * 处理表情包（下载并复制到剪贴板）
 * @param meme 表情包信息
 */
export async function processMeme(meme: Meme): Promise<void> {
  try {
    await showToast({
      style: Toast.Style.Animated,
      title: "正在下载表情包...",
    });

    const filePath = await downloadImage(meme);
    const isGif = await isGifImage(filePath);
    if (isGif) {
      await copyImageToClipboard(filePath);
    } else {
      const resizedFilePath = await resizeImage(filePath, 160);
      await copyImageToClipboard(resizedFilePath);
    }

    await showToast({
      style: Toast.Style.Success,
      title: "表情包已复制到剪贴板",
      message: meme.title,
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "处理表情包失败",
      message: String(error),
    });
  }
}

/**
 * 判断图片是否为GIF格式
 * 通过检查图片文件的二进制特征（魔数）来判断
 * @param imageUrl 图片URL或本地文件路径
 * @returns 是否为GIF图片
 */
export async function isGifImage(imageUrl: string): Promise<boolean> {
  try {
    // 如果是本地文件
    if (imageUrl.startsWith("/")) {
      try {
        // 读取文件头部
        const buffer = fs.readFileSync(imageUrl, { flag: "r" }).slice(0, 6);
        // 检查GIF魔数: GIF87a或GIF89a
        return buffer.toString("ascii", 0, 6) === "GIF87a" || buffer.toString("ascii", 0, 6) === "GIF89a";
      } catch (error) {
        console.error("读取本地文件失败:", error);
        return false;
      }
    }
    // 如果是远程URL
    else {
      try {
        // 只下载文件头部
        const response = await fetch(imageUrl, {
          method: "GET",
          headers: {
            Range: "bytes=0-5", // 只需要前6个字节
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        // 检查GIF魔数
        return buffer.toString("ascii", 0, 6) === "GIF87a" || buffer.toString("ascii", 0, 6) === "GIF89a";
      } catch (error) {
        console.error("检查远程图片失败:", error);

        // 服务器可能不支持Range请求，尝试完整下载
        try {
          const response = await fetch(imageUrl);
          const buffer = Buffer.from(await response.arrayBuffer()).slice(0, 6);
          return buffer.toString("ascii", 0, 6) === "GIF87a" || buffer.toString("ascii", 0, 6) === "GIF89a";
        } catch (secondError) {
          console.error("完整下载图片失败:", secondError);
          return false;
        }
      }
    }
  } catch (error) {
    console.error("判断图片类型失败:", error);
    return false;
  }
}

/**
 * 使用sips命令调整图片大小
 * @param imagePath 图片路径
 * @param width 目标宽度
 * @returns 处理后的图片路径
 */
export function resizeImage(imagePath: string, width: number): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // 使用path模块安全处理文件扩展名
      const parsedPath = parse(imagePath);
      const outputPath = pathJoin(
        parsedPath.dir,
        `${parsedPath.name}_${width}${parsedPath.ext}`
      );

      // 添加错误输出捕获
      execFile("sips",
        ["--resampleWidth", width.toString(), imagePath, "--out", outputPath],
        (error, stdout, stderr) => {
          if (error) {
            console.error(`sips stderr: ${stderr}`);
            reject(`调整图片失败: ${error.message}`);
          } else {
            console.log(`sips stdout: ${stdout}`);
            // 验证文件是否生成
            if (!fs.existsSync(outputPath)) {
              reject("输出文件未生成");
            }
            resolve(outputPath);
          }
        });
    } catch (error) {
      reject(`处理图片失败: ${error}`);
    }
  });
}

