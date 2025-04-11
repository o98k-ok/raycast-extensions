import * as cheerio from "cheerio";
import { Meme } from "./define";
const platformPIDAN = "pdan";

/**
 * 通过关键词从pdan.com.cn搜索表情包
 * @param keyword 搜索关键词
 * @returns 表情包列表，包含名称和图片URL
 */
export async function searchMemes(keyword: string, limit: number = 10): Promise<Meme[]> {
    try {
        // 构建搜索URL
        const searchUrl = `https://pdan.com.cn/?s=${encodeURIComponent(keyword)}`;

        // 获取网页内容
        const response = await fetch(searchUrl);
        const html = await response.text();

        // 使用cheerio解析HTML
        const $ = cheerio.load(html);
        const memes: Meme[] = [];

        // 查找所有表情包链接
        // 格式: <a class="imageLink image loading" href="URL" target="_blank"><img src="IMAGE_URL" alt="TITLE"/><span class="bg">TITLE</span></a>
        $("a.imageLink.image.loading").each((_, element) => {
            // 优先使用title属性，如果没有则尝试获取alt属性或span内容
            let title = $(element).attr("title") || "";
            const imgElement = $(element).find("img");

            // 如果没有title，尝试从img的alt属性获取
            if (!title) {
                title = imgElement.attr("alt") || "";
            }

            // 如果还没有，尝试从span.bg获取
            if (!title) {
                title = $(element).find("span.bg").text() || "";
            }

            // 图片URL，优先使用data-src，其次是src
            const imgSrc = imgElement.attr("data-src") || imgElement.attr("src") || "";

            if (title && imgSrc) {
                memes.push({
                    title: title,
                    url: imgSrc,
                    platform: platformPIDAN,
                });
            }
        });

        memes.sort(() => Math.random() - 0.5);
        return memes.slice(0, limit);
    } catch (error) {
        console.error("获取表情包失败:", error);
        return [];
    }
}

/**
 * 获取pdan.com.cn首页推荐的表情包
 * @returns 表情包列表
 */
export async function getRecommendedMemes(limit: number = 10): Promise<Meme[]> {
    try {
        // 获取网页内容
        const response = await fetch("https://pdan.com.cn/");
        const html = await response.text();

        // 使用cheerio解析HTML
        const $ = cheerio.load(html);
        const memes: Meme[] = [];

        // 查找所有表情包链接
        // 格式: <a class="imageLink image loading" href="URL" target="_blank"><img src="IMAGE_URL" alt="TITLE"/><span class="bg">TITLE</span></a>
        $("a.imageLink.image.loading").each((_, element) => {
            // 优先使用title属性，如果没有则尝试获取alt属性或span内容
            let title = $(element).attr("title") || "";
            const imgElement = $(element).find("img");

            // 如果没有title，尝试从img的alt属性获取
            if (!title) {
                title = imgElement.attr("alt") || "";
            }

            // 如果还没有，尝试从span.bg获取
            if (!title) {
                title = $(element).find("span.bg").text() || "";
            }

            // 图片URL，优先使用data-src，其次是src
            const imgSrc = imgElement.attr("data-src") || imgElement.attr("src") || "";

            if (title && imgSrc) {
                memes.push({
                    title: title,
                    url: imgSrc,
                    platform: platformPIDAN,
                });
            }
        });

        memes.sort(() => Math.random() - 0.5);
        return memes.slice(0, limit);
    } catch (error) {
        console.error("获取推荐表情包失败:", error);
        return [];
    }
}
