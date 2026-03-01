<script setup lang="ts">
import { ref, computed } from 'vue';
import { availableSites, matchSite, type Album, type DownloadSettings } from './AlbumPattern'

const emit = defineEmits<{
    startDownload: [album: Album, settings: DownloadSettings],
}>();

enum FormState {
    Valid,
    InvalidUrl,
    NotDoubanUrl,
}

const albumUrl = ref("");
const concurrency = ref(5);
const retries = ref(3);
const pageFetchTimeout = ref(30);
const imageDownloadTimeout = ref(60);
const formState = ref(FormState.Valid);
const isDragOver = ref(false);

function onDragOver(event: DragEvent) {
    isDragOver.value = true;
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
    }
}

function onDragLeave() {
    isDragOver.value = false;
}

function onDrop(event: DragEvent) {
    isDragOver.value = false;
    if (!event.dataTransfer) return;

    const uriList = event.dataTransfer.getData('text/uri-list');
    let url = '';
    if (uriList) {
        url = uriList.split('\n').map(l => l.trim()).find(l => l && !l.startsWith('#')) ?? '';
    }
    if (!url) {
        url = event.dataTransfer.getData('text/plain').trim();
    }
    if (url) {
        albumUrl.value = url;
        formState.value = FormState.Valid;
    }
}

const invalidFeedback = computed(() => {
    switch (formState.value) {
        case FormState.InvalidUrl:
            return "Not a valid URL"
        case FormState.NotDoubanUrl:
            return "Not a douban URL"
        default:
            return ""
    }
});

const urlInputCls = computed(() => ({
    'is-invalid': formState.value != FormState.Valid,
}))

function handleSubmitDownload() {
    let parsedUrl;
    try {
        parsedUrl = new URL(albumUrl.value);
    } catch {
        formState.value = FormState.InvalidUrl;
        return;
    }

    const site = matchSite(parsedUrl)
    if (site === null) {
        formState.value = FormState.NotDoubanUrl;
        return
    }

    formState.value = FormState.Valid;
    emit('startDownload', site, { concurrency: concurrency.value, retries: retries.value, pageFetchTimeout: pageFetchTimeout.value, imageDownloadTimeout: imageDownloadTimeout.value })
}

</script>

<template>
<form @submit.prevent="handleSubmitDownload">
    <div class="mb-3 drop-zone" :class="{ 'drop-zone-active': isDragOver }" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop">
        <label for="inputAlbumUrl" class="form-label">Album URL</label>
        <input v-model="albumUrl" type="text" class="form-control" :class="urlInputCls" id="inputAlbumUrl" aria-describedby="inputAlbumUrlHelp inputAlbumUrlFeedback" required>
        <div id="inputAlbumUrlFeedback" class="invalid-feedback">{{ invalidFeedback }}</div>
        <div id="inputAlbumUrlHelp" class="form-text">
        Should be something like
        <template v-for="site in availableSites" :key="site.example">
            <br /><code>{{ site.example }}</code>
        </template>
        <br />or drag a URL here
        </div>
    </div>
    <button type="submit" class="btn btn-primary">Download</button>
    <div class="mt-3">
        <a data-bs-toggle="collapse" href="#settingsCollapse" role="button" aria-expanded="false" aria-controls="settingsCollapse" class="text-decoration-none">
            Settings <span class="small">&#9660;</span>
        </a>
        <div class="collapse mt-2" id="settingsCollapse">
            <div class="mb-3">
                <label for="inputConcurrency" class="form-label">Max parallel downloads</label>
                <input v-model.number="concurrency" type="number" class="form-control" id="inputConcurrency" min="1" max="20" required>
            </div>
            <div class="mb-3">
                <label for="inputRetries" class="form-label">Page fetch retries</label>
                <input v-model.number="retries" type="number" class="form-control" id="inputRetries" aria-describedby="inputRetriesHelp" min="0" max="10" required>
                <div id="inputRetriesHelp" class="form-text">Number of retry attempts for failed page fetches (0 = no retries)</div>
            </div>
            <div class="mb-3">
                <label for="inputPageFetchTimeout" class="form-label">Page fetch timeout (seconds)</label>
                <input v-model.number="pageFetchTimeout" type="number" class="form-control" id="inputPageFetchTimeout" min="5" max="300" required>
            </div>
            <div class="mb-3">
                <label for="inputImageDownloadTimeout" class="form-label">Image download timeout (seconds)</label>
                <input v-model.number="imageDownloadTimeout" type="number" class="form-control" id="inputImageDownloadTimeout" min="5" max="600" required>
            </div>
        </div>
    </div>
</form>
</template>

<style scoped>
.drop-zone {
    padding: 0.75rem;
    border: 2px dashed transparent;
    border-radius: 0.375rem;
    transition: border-color 0.2s, background-color 0.2s;
}

.drop-zone-active {
    border-color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.05);
}
</style>
