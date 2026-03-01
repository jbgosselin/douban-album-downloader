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

const matchedAlbum = computed(() => {
    if (!albumUrl.value) return null;
    try {
        const parsed = new URL(albumUrl.value);
        return matchSite(parsed);
    } catch {
        return null;
    }
});

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
    <div class="drop-zone" :class="{ 'drop-zone-active': isDragOver }" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop">
        <div class="drop-zone-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/>
                <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
            </svg>
        </div>
        <div class="drop-zone-text">Paste or drop a Douban album URL</div>
        <input v-model="albumUrl" type="text" class="form-control" :class="urlInputCls" id="inputAlbumUrl" aria-describedby="inputAlbumUrlHelp inputAlbumUrlFeedback" placeholder="https://www.douban.com/photos/album/..." required>
        <div id="inputAlbumUrlFeedback" class="invalid-feedback">{{ invalidFeedback }}</div>
        <div v-if="matchedAlbum" class="match-feedback mt-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
            Album #{{ matchedAlbum.albumId }} matched
        </div>
        <div v-else-if="!matchedAlbum && !albumUrl" id="inputAlbumUrlHelp" class="form-text">
        Supported formats:
        <template v-for="site in availableSites" :key="site.example">
            <br /><code>{{ site.example }}</code>
        </template>
        </div>
    </div>
    <div class="d-grid mt-3">
        <button type="submit" class="btn btn-primary btn-lg">Download</button>
    </div>
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
    padding: 1.5rem;
    border: 2px dashed var(--bs-border-color);
    border-radius: 0.5rem;
    text-align: center;
    transition: border-color 0.2s, background-color 0.2s;
}

.drop-zone-active {
    border-color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.05);
}

.drop-zone-icon {
    color: var(--bs-secondary-color);
    margin-bottom: 0.5rem;
}

.drop-zone-text {
    color: var(--bs-secondary-color);
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
}

.match-feedback {
    color: var(--bs-success);
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
}
</style>
