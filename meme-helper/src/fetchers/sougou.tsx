// curl--get--data - urlencode  "keyword=ok" --data - urlencode "routeName=emosearch" https://pic.sogou.com/napi/wap/emoji/searchlist

import { Meme } from './define';

const SOUGOU_API_URL = 'https://pic.sogou.com/napi/wap/emoji/searchlist';
const platformSOUGOU = 'sougou';

type SougouEmotion = {
    thumbSrc: string;
    idx: number;
    source: string;
}

export async function searchMemes(keyword: string, limit: number = 10): Promise<Meme[]> {
    try {
        const params = new URLSearchParams({
            keyword: keyword,
            routeName: 'emosearch'
        });
        const url = `${SOUGOU_API_URL}?${params.toString()}`;
        const response = await fetch(url, {
            method: 'GET',
        })

        const text = await response.text();
        const data = JSON.parse(text);


        const memes: Meme[] = [];
        data["data"]["emotions"].forEach((item: SougouEmotion) => {
            memes.push({
                title: "搜狗精心赞助",
                url: item.thumbSrc,
                platform: platformSOUGOU,
            });
        });

        memes.sort(() => Math.random() - 0.5);
        return memes.slice(0, limit);
    } catch (error) {
        console.error('Error searching memes:', error);
        return [];
    }
}
