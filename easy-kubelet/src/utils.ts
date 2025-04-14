import { exec } from "child_process";
import { promisify } from "util";
import { getPreferenceValues } from "@raycast/api";

interface Preferences {
    namespace: string;
    kubectlPath: string;
}

const execPromise = promisify(exec);

export interface Pod {
    name: string;
    ready: string;
    status: string;
    restarts: string;
    age: string;
    ip: string;
    node: string;
    // health: string;
}

export interface PodResource {
    name: string;
    cpu: string;
    memory: string;
}

/**
 * 获取 kubectl 命令路径
 * @returns kubectl 命令完整路径
 */
function getKubectlCommand(): string {
    const preferences = getPreferenceValues<Preferences>();
    return preferences.kubectlPath ? preferences.kubectlPath : "kubectl";
}




export async function getPods(): Promise<Pod[]> {
    const preferences = getPreferenceValues<Preferences>();
    const kubectlCommand = getKubectlCommand();

    try {
        const { stdout } = await execPromise(`${kubectlCommand} get pods -n ${preferences.namespace} -o wide`);

        // 跳过标题行
        const lines = stdout.split('\n').filter(line => line.trim().length > 0).slice(1);

        return lines.map(line => {
            const parts = line.trim().split(/\s+/);
            return {
                name: parts[0],
                ready: parts[1],
                status: parts[2],
                restarts: parts[3],
                age: parts[4],
                ip: parts[5],
                node: parts[6],
            };
        });
    } catch (error) {
        console.error('Error getting pods:', error);
        return [];
    }
}

export async function getPodResources(): Promise<PodResource[]> {
    const preferences = getPreferenceValues<Preferences>();
    const kubectlCommand = getKubectlCommand();

    try {
        const { stdout } = await execPromise(`${kubectlCommand} top pod -n ${preferences.namespace}`);

        // 跳过标题行
        const lines = stdout.split('\n').filter(line => line.trim().length > 0).slice(1);

        return lines.map(line => {
            const parts = line.trim().split(/\s+/);
            return {
                name: parts[0],
                cpu: parts[1],
                memory: parts[2],
            };
        });
    } catch (error) {
        console.error('Error getting pod resources:', error);
        return [];
    }
} 