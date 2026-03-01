declare interface GlobElectron {
    createOutputDirectory: ({ dirName }: { dirName: string }) => Promise<{ outputDir?: string, canceled: boolean }>
    downloadSingleImage:  ({ imgUrl, outputPath }: { imgUrl: string, outputPath: string }) => Promise<{ error?: string }>
    cancelAllDownloads: () => Promise<void>
    path: {
        basename: (p: string, ext?: string) => Promise<string>
        join: (...paths: string[]) => Promise<string>
    }
}
