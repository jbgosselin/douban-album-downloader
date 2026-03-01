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

async function fetchWithRetry(url: string, retries: number): Promise<Response> {
    const maxAttempts = retries + 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                return res;
            }
            if (res.status === 429 || res.status >= 500) {
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
const isFetchingPages = ref(true);
const pagesFetched = ref(0);
const imagesFound = ref(0);

const hasError = computed(() => (imageIDs.value.filter(name => images.value[name].status === DownloadStatus.Error).length > 0))

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
    const errorUrls: string[] = [];

    for (const imageID of imageIDs.value) {
        const img = images.value[imageID]
        if (img.status !== DownloadStatus.Error) {
            continue;
        }
        errorUrls.push(img.uri.replace(imageSizeRegex, 'photo/xl/public'));
    }

    console.log(`Waiting all downloads finished`);
    await mapWithConcurrency(errorUrls, props.settings.concurrency, downloadImage, () => cancelled.value);
    doneAllDownloads.value = true;
}

async function downloadImage(imgUrl: string) {
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

    const { error } = await window.electron.downloadSingleImage({ imgUrl, outputPath });
    if (error) {
        if (error === 'cancelled') return;
        console.error(error);
        images.value[imgName].status = DownloadStatus.Error;
        return;
    }

    images.value[imgName].status = DownloadStatus.Success;
}

onMounted(async () => {
    let valueMax = 0;
    const imgUrls: string[] = [];

    try {
        for (; ;) {
            if (cancelled.value) break;

            console.log(`Fetching ${props.album.albumId} ${valueMax}`);
            const pageUrl = `${props.album.albumUrl}?${props.album.pageKey}=${valueMax}`;
            const res = await fetchWithRetry(pageUrl, props.settings.retries);
            const content = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const pageImages = doc.querySelectorAll(props.album.imgSelector) as NodeListOf<HTMLImageElement>;

            if (pageImages.length === 0) {
                break;
            }

            for (const img of pageImages) {
                imgUrls.push(img.src.replace(imageSizeRegex, 'photo/xl/public'));
                valueMax += 1;
            }
            pagesFetched.value += 1;
            imagesFound.value = imgUrls.length;
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        pageFetchError.value = `Failed to fetch album pages: ${message}`;
        isFetchingPages.value = false;
        return;
    }

    if (imgUrls.length === 0) {
        pageFetchError.value = 'No images found in this album.';
        isFetchingPages.value = false;
        return;
    }

    isFetchingPages.value = false;

    console.log(`Waiting all downloads finished`);
    await mapWithConcurrency(imgUrls, props.settings.concurrency, downloadImage, () => cancelled.value);
    doneAllDownloads.value = true;
});

</script>

<template>
    <template v-if="pageFetchError">
        <div class="row">
            <div class="col">
                <div class="alert alert-danger" role="alert">{{ pageFetchError }}</div>
            </div>
        </div>
        <div class="row">
            <div class="col col-xs">
                <button class="btn btn-primary" @click="resetApp">Restart</button>
            </div>
        </div>
    </template>

    <template v-else-if="doneAllDownloads">
        <div class="row">
            <div class="col">
                <p>Finished !</p>
            </div>
            <div class="col col-xs" v-if="hasError">
                <button class="btn btn-warning" @click="retryErrors">Retry Errors</button>
            </div>
            <div class="col col-xs">
                <button class="btn btn-primary" @click="resetApp">Restart</button>
            </div>
        </div>
        <br />
    </template>

    <template v-else>
        <div class="row">
            <div class="col col-xs">
                <p v-if="isFetchingPages">Fetching pages... (page {{ pagesFetched }}, {{ imagesFound }} images found)</p>
                <p v-else>Downloading...</p>
            </div>
            <div class="col" v-if="!isFetchingPages">
                <ProgressBar :value-now="imageIDs.filter(name => images[name].status !== DownloadStatus.Pending).length"
                    :value-max="imageIDs.length" />
            </div>
            <div class="col col-xs">
                <button class="btn btn-danger" @click="cancelDownload">Cancel</button>
            </div>
        </div>
    </template>

    <div class="row" v-if="imageIDs.length > 0">
        <div class="col">
            <table class="table table-striped table-bordered table-sm">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="img in images" :key="img.name">
                        <td>{{ img.name }}</td>
                        <td>{{ img.status }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
