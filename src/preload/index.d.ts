declare interface GlobElectron {
    createOutputDirectory: ({ dirName }: { dirName: string }) => Promise<{ outputDir?: string, canceled: boolean }>
    downloadSingleImage:  ({ imgUrl, outputPath, timeout, referer }: { imgUrl: string, outputPath: string, timeout: number, referer: string }) => Promise<{ error?: string, fileUrl?: string }>
    cancelAllDownloads: () => Promise<void>
    openOutputDirectory: ({ dirPath }: { dirPath: string }) => Promise<void>
    randomUserAgent: () => Promise<string>
    path: {
        basename: (p: string, ext?: string) => Promise<string>
        join: (...paths: string[]) => Promise<string>
    }
    theme: {
        isDark: () => Promise<boolean>
        onChange: (callback: (_event: unknown, isDark: boolean) => void) => void
    }
}
