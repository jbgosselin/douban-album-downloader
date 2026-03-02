import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

export const bridge = {
    async createOutputDirectory({ dirName }: { dirName: string }): Promise<{ outputDir?: string; canceled: boolean }> {
        return await invoke('create_output_directory', { dirName });
    },

    async downloadSingleImage({ imgUrl, outputPath, timeout, referer }: {
        imgUrl: string;
        outputPath: string;
        timeout: number;
        referer: string;
    }): Promise<{ error?: string; fileUrl?: string }> {
        const result: { error?: string; filePath?: string } = await invoke('download_single_image', {
            imgUrl,
            outputPath,
            timeout,
            referer,
        });
        if (result.filePath) {
            return { error: result.error ?? undefined, fileUrl: convertFileSrc(result.filePath) };
        }
        return { error: result.error ?? undefined };
    },

    async cancelAllDownloads(): Promise<void> {
        await invoke('cancel_all_downloads');
    },

    async openOutputDirectory({ dirPath }: { dirPath: string }): Promise<void> {
        await invoke('open_output_directory', { dirPath });
    },

    async randomUserAgent(): Promise<string> {
        return await invoke('random_user_agent');
    },

    async fetchPage({ url, referer, timeout }: {
        url: string;
        referer: string;
        timeout: number;
    }): Promise<string> {
        return await invoke('fetch_page', { url, referer, timeout });
    },

    path: {
        basename(p: string): string {
            const parts = p.replace(/\\/g, '/').split('/');
            return parts[parts.length - 1] || '';
        },
        join(...paths: string[]): string {
            return paths.join('/').replace(/\/+/g, '/');
        },
    },

    theme: {
        async isDark(): Promise<boolean> {
            const theme = await getCurrentWindow().theme();
            return theme === 'dark';
        },
        onChange(callback: (isDark: boolean) => void): void {
            getCurrentWindow().onThemeChanged(({ payload }) => {
                callback(payload === 'dark');
            });
        },
    },
};
