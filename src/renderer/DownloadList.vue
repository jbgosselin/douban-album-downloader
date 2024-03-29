<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Album } from './AlbumPattern';
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
}>()

const imageIDs = ref<string[]>([]);
const images = ref<DownloadedImageMap>({})
const doneAllDownloads = ref(false);

const hasError = computed(() => (imageIDs.value.filter(name => images.value[name].status === DownloadStatus.Error).length > 0))

function resetApp() {
    window.location.reload()
}

async function retryErrors() {
    doneAllDownloads.value = false;
    const imagesPromises: Promise<void>[] = [];

    for (const imageID of imageIDs.value) {
        const img = images.value[imageID]
        if (img.status !== DownloadStatus.Error) {
            continue;
        }
        const imgUrl = img.uri.replace(imageSizeRegex, 'photo/xl/public');
        imagesPromises.push(downloadImage(imgUrl));
    }

    console.log(`Waiting all downloads finished`);
    await Promise.all(imagesPromises);
    doneAllDownloads.value = true;
}

async function downloadImage(imgUrl: string) {
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
        console.error(error);
        images.value[imgName].status = DownloadStatus.Error;
        return;
    }

    images.value[imgName].status = DownloadStatus.Success;
}

onMounted(async () => {
    let valueMax = 0;
    const imagesPromises: Promise<void>[] = [];

    for (; ;) {
        console.log(`Fetching ${props.album.albumId} ${valueMax}`);
        const pageUrl = `${props.album.albumUrl}?${props.album.pageKey}=${valueMax}`;
        const { content, error } = await window.electron.downloadAlbumPage({ pageUrl });
        if (error !== null || content === null) {
            break;
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const images = doc.querySelectorAll(props.album.imgSelector) as NodeListOf<HTMLImageElement>;

        if (images.length === 0) {
            break;
        }

        for (const img of images) {
            const imgUrl = img.src.replace(imageSizeRegex, 'photo/xl/public');
            imagesPromises.push(downloadImage(imgUrl));
            valueMax += 1;
        }
    }

    console.log(`Waiting all downloads finished`);
    await Promise.all(imagesPromises);
    doneAllDownloads.value = true;
});

</script>

<template>
    <template v-if="doneAllDownloads">
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
                <p>Downloading...</p>
            </div>
            <div class="col">
                <ProgressBar :value-now="imageIDs.filter(name => images[name].status !== DownloadStatus.Pending).length"
                    :value-max="imageIDs.length" />
            </div>
        </div>
    </template>

    <div class="row">
        <div class="col">
            <table class="table table-striped table-bordered table-sm">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="img in images">
                        <td>{{ img.name }}</td>
                        <td>{{ img.status }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
