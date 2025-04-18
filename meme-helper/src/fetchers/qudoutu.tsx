import * as cheerio from "cheerio";
import { Meme } from "./define";
const platformQUDOUTU = "qudoutu";

/**
 * 通过关键词从qudoutu.cn搜索表情包
 * @param keyword 搜索关键词
 * @returns 表情包列表，包含名称和图片URL
 */
export async function searchMemes(keyword: string, limit: number = 10): Promise<Meme[]> {
    try {
        // 构建搜索URL
        const searchUrl = `https://www.qudoutu.cn/search/?keyword=${encodeURIComponent(keyword)}`;

        // 获取网页内容
        const response = await fetch(searchUrl);
        const html = await response.text();

        // 使用cheerio解析HTML
        const $ = cheerio.load(html);
        const memes: Meme[] = [];

        // 查找所有表情包容器
        // 格式: <li><a href="/xxx.html" class="Link"><img alt="标题" src="图片URL"></a><p>标题</p></li>
        $("li").each((_, element) => {
            const $container = $(element);
            const $img = $container.find("a.Link img");
            const $title = $container.find("p");

            // 获取图片URL，需要添加域名前缀
            const imgPath = $img.attr("src") || "";
            const imgUrl = imgPath.startsWith("/") ? `https://www.qudoutu.cn${imgPath}` : imgPath;

            // 获取标题文本，移除可能的HTML标签
            const title = $title.text().trim() || "趣斗图";

            if (imgUrl) {
                memes.push({
                    title: title,
                    url: `http://127.0.0.1:8000?url=${encodeURIComponent(imgUrl)}&referer=${encodeURIComponent(searchUrl)}`,
                    platform: platformQUDOUTU,
                });
            }
        });

        // 随机排序并限制数量
        memes.sort(() => Math.random() - 0.5);
        return memes.slice(0, limit);
    } catch (error) {
        console.error("获取表情包失败:", error);
        return [];
    }
}
