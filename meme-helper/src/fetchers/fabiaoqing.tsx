import * as cheerio from "cheerio";
import { Meme } from "./define";
import { getProxyConfig } from "../process/process";
const platformFABIAOQING = "fabiaoqing";

/**
 * 通过关键词从fabiaoqing.com搜索表情包
 * @param keyword 搜索关键词
 * @returns 表情包列表，包含名称和图片URL
 */
export async function searchMemes(keyword: string, limit: number = 10): Promise<Meme[]> {
    try {
        // 构建搜索URL
        const searchUrl = `https://fabiaoqing.com/search/bqb/keyword/${encodeURIComponent(keyword)}/type/bq/page/1.html`;

        // 获取网页内容
        const response = await fetch(searchUrl);
        const html = await response.text();

        // 使用cheerio解析HTML
        const $ = cheerio.load(html);
        const memes: Meme[] = [];

        // 查找所有表情包容器
        // 格式: <a href="/biaoqing/detail/id/654270.html" title="好小子!_小子表情">
        //        <img class="ui image bqppsearch lazy" data-original="https://img.soutula.com/bmiddle/0073Cjx6ly1ghtoytfmrmj302s02vt8h.jpg" ... />
        //      </a>
        $("a[href^='/biaoqing/detail/']").each((_, element) => {
            const $container = $(element);
            const $img = $container.find("img.bqppsearch");

            // 获取标题
            const title = $container.attr("title") || "发表情";

            // 获取图片URL，从data-original属性
            const imgUrl = $img.attr("data-original") || "";

            if (imgUrl) {
                memes.push({
                    title: title,
                    url: getProxyConfig() ? `${getProxyConfig()}?url=${encodeURIComponent(imgUrl)}&referer=${encodeURIComponent(searchUrl)}` : imgUrl,
                    platform: platformFABIAOQING,
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
