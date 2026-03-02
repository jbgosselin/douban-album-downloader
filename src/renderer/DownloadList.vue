<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Album, DownloadSettings } from './AlbumPattern';
import ProgressBar from './ProgressBar.vue';

enum DownloadStatus {
    Pending = "PENDING",
    Error = "ERROR",
    Success = "SUCCESS",
}

interface DownloadedImage {
    name: string;
    status: DownloadStatus;
    uri: string;
    outputPath: string;
    fileUrl?: string;
}

interface DownloadedImageMap {
    [index: string]: DownloadedImage;
}

const imageSizeRegex = /photo\/\w+\/public/;

const props = defineProps<{
    outputDir: string,
    album: Album,
    settings: DownloadSettings,
}>()

async function mapWithConcurrency<T>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<void>,
    isCancelled?: () => boolean,
) {
    const executing: Promise<void>[] = [];
    for (const item of items) {
        if (isCancelled?.()) break;
        const p = fn(item).then(() => { executing.splice(executing.indexOf(p), 1); });
        executing.push(p);
        if (executing.length >= limit) {
            await Promise.race(executing);
        }
    }
    await Promise.all(executing);
}

async function fetchWithRetry(url: string, retries: number, timeout: number): Promise<Response> {
    const maxAttempts = retries + 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const res = await fetch(url, {
                signal: AbortSignal.timeout(timeout * 1000),
                headers: {
                    'Referer': url,
                    'User-Agent': await window.electron.randomUserAgent(),
                },
            });
            if (res.ok) {
                return res;
            }
            if (res.status === 418 || res.status === 429 || res.status >= 500) {
                if (attempt < maxAttempts - 1) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
        } catch (err) {
            if (err instanceof TypeError || (err instanceof Error && !err.message.startsWith('HTTP '))) {
                if (attempt < maxAttempts - 1) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            throw err;
        }
    }
    throw new Error(`Failed to fetch ${url} after ${maxAttempts} attempts`);
}

const imageIDs = ref<string[]>([]);
const images = ref<DownloadedImageMap>({})
const doneAllDownloads = ref(false);
const cancelled = ref(false);
const pageFetchError = ref<string | null>(null);
const isFetchingPage = ref(true);
const pagesFetched = ref(0);
const imagesFound = ref(0);

const successCount = computed(() => imageIDs.value.filter(name => images.value[name].status === DownloadStatus.Success).length);
const errorCount = computed(() => imageIDs.value.filter(name => images.value[name].status === DownloadStatus.Error).length);
const totalCount = computed(() => imageIDs.value.length);
const hasError = computed(() => errorCount.value > 0);

function openFolder() {
    window.electron.openOutputDirectory({ dirPath: props.outputDir });
}

function resetApp() {
    window.location.reload()
}

async function cancelDownload() {
    cancelled.value = true;
    await window.electron.cancelAllDownloads();
    doneAllDownloads.value = true;
}

async function retryErrors() {
    doneAllDownloads.value = false;
    cancelled.value = false;
    const errorEntries: { imgUrl: string, referer: string }[] = [];

    for (const imageID of imageIDs.value) {
        const img = images.value[imageID]
        if (img.status !== DownloadStatus.Error) {
            continue;
        }
        errorEntries.push({
            imgUrl: img.uri.replace(imageSizeRegex, 'photo/xl/public'),
            referer: props.album.albumUrl,
        });
    }

    console.log(`Waiting all downloads finished`);
    await mapWithConcurrency(errorEntries, props.settings.concurrency, downloadImage, () => cancelled.value);
    doneAllDownloads.value = true;
}

async function downloadImage({ imgUrl, referer }: { imgUrl: string, referer: string }) {
    if (cancelled.value) return;

    const imgName = await window.electron.path.basename(imgUrl);
    const outputPath = await window.electron.path.join(props.outputDir, imgName);
    imageIDs.value.push(imgName);
    images.value[imgName] = {
        name: imgName,
        status: DownloadStatus.Pending,
        uri: imgUrl,
        outputPath,
    };

    const { error, fileUrl } = await window.electron.downloadSingleImage({ imgUrl, outputPath, timeout: props.settings.imageDownloadTimeout, referer });
    if (error) {
        if (error === 'cancelled') return;
        console.error(error);
        images.value[imgName].status = DownloadStatus.Error;
        return;
    }

    images.value[imgName].fileUrl = fileUrl;
    images.value[imgName].status = DownloadStatus.Success;
}

onMounted(async () => {
    let valueMax = 0;

    try {
        for (; ;) {
            if (cancelled.value) break;
            isFetchingPage.value = true;

            console.log(`Fetching ${props.album.albumId} ${valueMax}`);
            const pageUrl = `${props.album.albumUrl}?${props.album.pageKey}=${valueMax}`;
            const res = await fetchWithRetry(pageUrl, props.settings.retries, props.settings.pageFetchTimeout);
            const content = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const pageImages = doc.querySelectorAll(props.album.imgSelector) as NodeListOf<HTMLImageElement>;

            if (pageImages.length === 0) {
                break;
            }

            const pageEntries: { imgUrl: string, referer: string }[] = [];
            for (const img of pageImages) {
                pageEntries.push({
                    imgUrl: img.src.replace(imageSizeRegex, 'photo/xl/public'),
                    referer: pageUrl,
                });
                valueMax += 1;
            }
            pagesFetched.value += 1;
            imagesFound.value += pageEntries.length;
            isFetchingPage.value = false;

            console.log(`Downloading ${pageEntries.length} images from page ${pagesFetched.value}`);
            await mapWithConcurrency(pageEntries, props.settings.concurrency, downloadImage, () => cancelled.value);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        pageFetchError.value = `Failed to fetch album pages: ${message}`;
        isFetchingPage.value = false;
        return;
    }

    if (totalCount.value === 0) {
        pageFetchError.value = 'No images found in this album.';
        isFetchingPage.value = false;
        return;
    }

    doneAllDownloads.value = true;
});

</script>

<template>
    <template v-if="pageFetchError">
        <div class="controls-bar">
            <div class="alert alert-danger mb-0" role="alert">{{ pageFetchError }}</div>
            <button class="btn btn-primary btn-sm" @click="resetApp">Restart</button>
        </div>
    </template>

    <template v-else>
        <!-- Fixed controls bar -->
        <div class="controls-bar">
            <div class="controls-row">
                <!-- Stats -->
                <span v-if="!doneAllDownloads" class="text-secondary">
                    <template v-if="isFetchingPage">
                        Fetching page {{ pagesFetched + 1 }}...
                    </template>
                    <template v-else>
                        Downloading page {{ pagesFetched }}... ({{ successCount + errorCount }} / {{ imagesFound }})
                    </template>
                </span>
                <span v-else class="text-secondary">
                    {{ successCount }} / {{ totalCount }} downloaded<template v-if="errorCount > 0"> &mdash; {{ errorCount }} failed</template>
                </span>

                <!-- Action buttons -->
                <div class="d-flex gap-2">
                    <button v-if="!doneAllDownloads" class="btn btn-outline-danger btn-sm" @click="cancelDownload">Cancel</button>
                    <template v-if="doneAllDownloads">
                        <button class="btn btn-success btn-sm" @click="openFolder">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="me-1" viewBox="0 0 16 16" style="vertical-align: -2px;">
                                <path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.825a2 2 0 0 1-1.991-1.819l-.637-7a2 2 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3m-8.322.12C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981z"/>
                            </svg>
                            Open Folder
                        </button>
                        <button v-if="hasError" class="btn btn-warning btn-sm" @click="retryErrors">Retry Errors</button>
                        <button class="btn btn-outline-secondary btn-sm" @click="resetApp">New Download</button>
                    </template>
                </div>
            </div>

            <!-- Progress bar -->
            <div v-if="imagesFound > 0">
                <ProgressBar :success-count="successCount" :error-count="errorCount" :total-count="imagesFound" />
            </div>
        </div>

        <!-- Scrollable thumbnail grid -->
        <div v-if="imageIDs.length > 0" class="thumbnail-scroll">
            <div class="thumbnail-grid">
                <div v-for="id in imageIDs" :key="id" class="thumbnail-item">
                    <!-- Thumbnail for successful downloads -->
                    <template v-if="images[id].status === DownloadStatus.Success && images[id].fileUrl">
                        <img :src="images[id].fileUrl" class="thumbnail-img">
                    </template>
                    <!-- File icon for pending/error -->
                    <template v-else>
                        <svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M6.502 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/>
                            <path d="M14 14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zM4 1a1 1 0 0 0-1 1v10l2.224-2.224a.5.5 0 0 1 .61-.075L8 11l2.157-3.02a.5.5 0 0 1 .764-.07L13 10V4.5h-2A1.5 1.5 0 0 1 9.5 3V1z"/>
                        </svg>
                        <div class="tile-filename">{{ images[id].name }}</div>
                    </template>
                    <!-- Status overlay -->
                    <div class="thumbnail-overlay">
                        <!-- Pending: spinner -->
                        <template v-if="images[id].status === DownloadStatus.Pending">
                            <div class="spinner-border spinner-border-sm text-light" role="status" style="width: 14px; height: 14px; border-width: 2px;">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </template>
                        <!-- Success: checkmark -->
                        <template v-else-if="images[id].status === DownloadStatus.Success">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#4ade80" viewBox="0 0 16 16">
                                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0"/>
                            </svg>
                        </template>
                        <!-- Error: X -->
                        <template v-else>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#f87171" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                            </svg>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </template>
</template>

<style scoped>
.controls-bar {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--bs-border-color);
    background-color: var(--bs-body-bg);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}

.thumbnail-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
}

.thumbnail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 4px;
}

.thumbnail-item {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 4px;
    background-color: var(--bs-tertiary-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.thumbnail-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.tile-icon {
    width: 32px;
    height: 32px;
    color: var(--bs-secondary-color);
}

.tile-filename {
    position: absolute;
    bottom: 2px;
    left: 2px;
    right: 26px;
    font-size: 9px;
    color: var(--bs-secondary-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.thumbnail-overlay {
    position: absolute;
    bottom: 2px;
    right: 2px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
