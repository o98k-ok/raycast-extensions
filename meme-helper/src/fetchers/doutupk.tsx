import { Meme } from "./define";

import * as cheerio from 'cheerio';

const DOUTUPK_API_URL = 'https://www.doutupk.com/search?keyword=';
const platformDOUTUPK = 'doutupk';

export async function fetchMemes(keyword: string, limit: number = 10): Promise<Meme[]> {
    try {
        // 构建搜索URL
        const searchUrl = `${DOUTUPK_API_URL}${encodeURIComponent(keyword)}`;

        // 获取网页内容
        const response = await fetch(searchUrl);
        const html = await response.text();

        // 使用cheerio解析HTML
        const $ = cheerio.load(html);
        const memes: Meme[] = [];

        // 查找所有表情包容器
        // 格式: <a class="col-xs-6 col-md-2" href="..."><img ... data-original="..." /><p>标题文本</p></a>
        $("a.col-xs-6.col-md-2").each((_, element) => {
            const $container = $(element);
            const $img = $container.find("img.img-responsive.lazy.image_dtb");
            const imgUrl = $img.attr("data-original") || "";
            const title = $container.find("p").text().trim() || "斗图啦赞助";

            if (imgUrl) {
                memes.push({
                    title: title,  // 使用p标签中的文本作为标题
                    url: imgUrl.replace("http://", "https://"),
                    platform: platformDOUTUPK,
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