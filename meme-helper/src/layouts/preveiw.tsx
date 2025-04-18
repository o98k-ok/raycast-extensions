import { Detail, ActionPanel, Action } from "@raycast/api";
import { Meme } from "../fetchers/define";
import { processMeme } from "../process/process";

interface PreviewProps {
    meme: Meme;
}

/**
 * 表情包预览组件
 * 显示表情包的大图和详细信息
 */
export function MemePreview({ meme }: PreviewProps) {
    // 准备Markdown内容
    const previewUrl = meme.url.includes("?")
        ? `${meme.url}&raycast-width=300&raycast-height=300`
        : `${meme.url}?raycast-width=300&raycast-height=300`;
    const markdown = `
![${meme.title}](${previewUrl})

${meme.title}
`;

    return (
        <Detail
            markdown={markdown}
            navigationTitle={`预览: ${meme.title} `}
            metadata={
                <Detail.Metadata>
                    <Detail.Metadata.Label title="来源" text={meme.platform} />
                    <Detail.Metadata.Label title="名称" text={meme.title} />
                    <Detail.Metadata.Link title="查看详情" target={meme.url} text={meme.url} />
                </Detail.Metadata>
            }
            actions={
                <ActionPanel>
                    <Action title="复制到剪贴板" onAction={() => processMeme(meme)} />
                    <Action.OpenInBrowser title="浏览器打开" url={meme.url} />
                </ActionPanel>
            }
        />
    );
}
