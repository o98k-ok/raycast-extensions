import { useState, useEffect } from "react";
import { getPreferenceValues } from "@raycast/api";
import path from "path";
import fs from "fs";

// 定义Bing壁纸接口
interface BingImage {
    startdate: string;
    fullstartdate: string;
    enddate: string;
    url: string;
    urlbase: string;
    copyright: string;
    copyrightlink: string;
    title: string;
    quiz: string;
    wp: boolean;
    hsh: string;
    drk: number;
    top: number;
    bot: number;
    hs: unknown[];
}

interface BingResponse {
    images: BingImage[];
    tooltips: {
        loading: string;
        previous: string;
        next: string;
        walle: string;
        walls: string;
    };
}

// Bing壁纸API URL
const BING_API_URL = "https://bing.com/HPImageArchive.aspx?format=js&idx=0&n=10&mkt=en-US";

// 基础URL，用于构建完整图片URL
const BING_BASE_URL = "https://bing.com";

export default function fetchLastestBingImages() {
    const [images, setImages] = useState<BingImage[]>([]);
    const preferences = getPreferenceValues<Preferences>();

    // 获取Bing壁纸
    useEffect(() => {
        async function fetchBingImages() {
            try {
                const response = await fetch(BING_API_URL);

                if (!response.ok) {
                    throw new Error(`获取Bing壁纸失败: ${response.status} ${response.statusText}`);
                }

                const data = await response.json() as BingResponse;
                setImages(data.images);
            } catch (err) {
                console.error("获取Bing壁纸出错:", err);
            }
        }

        fetchBingImages();
    }, []);

    const itemPathFnc = (path: string, image: BingImage) => {
        return `${path}/${image.startdate}_${image.hsh}`
    }
    const getFullImageUrl = (url: string): string => {
        return BING_BASE_URL + url;
    };


    for (const image of images) {
        const itemPath = itemPathFnc(preferences.wallpaperPath, image);
        const metaPath = `${itemPath}.json`;

        if (!fs.existsSync(metaPath)) {
            const metaInfo = {
                startdate: image.startdate,
                title: image.title,
                copyright: image.copyright,
                url: image.url,
            }
            fs.writeFileSync(metaPath, JSON.stringify(metaInfo, null, 2));
        }


        const imageUrl = getFullImageUrl(image.url);
        const imagePath = `${itemPath}.jpg`;
        if (!fs.existsSync(imagePath)) {
            // 下载图片到本地
            async function downloadImage(url: string, path: string) {
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`下载图片失败: ${response.status} ${response.statusText}`);
                    }
                    const buffer = await response.arrayBuffer();
                    fs.writeFileSync(path, Buffer.from(buffer));
                } catch (err) {
                    console.error(`下载图片出错 ${url}:`, err);
                }
            }
            downloadImage(imageUrl, imagePath);
        }
    }
}



export function getImageMeta(imagePath: string): { startdate: string, title: string, copyright: string } {
    const imageName = imagePath.replaceAll(path.extname(imagePath), '')
    const metaPath = `${imageName}.json`;
    if (!fs.existsSync(metaPath)) {
        return { startdate: '', title: '', copyright: '' }
    }
    const metaInfo = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const startdate = metaInfo["startdate"]
    const title = metaInfo["title"]
    const copyright = metaInfo["copyright"]
    return { startdate, title, copyright }
}