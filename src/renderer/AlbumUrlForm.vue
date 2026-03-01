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
const formState = ref(FormState.Valid);

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
    emit('startDownload', site, { concurrency: concurrency.value, retries: retries.value })
}

</script>

<template>
<form @submit.prevent="handleSubmitDownload">
    <div class="mb-3">
        <label for="inputAlbumUrl" class="form-label">Album URL</label>
        <input v-model="albumUrl" type="text" class="form-control" :class="urlInputCls" id="inputAlbumUrl" aria-describedby="inputAlbumUrlHelp inputAlbumUrlFeedback" required>
        <div id="inputAlbumUrlFeedback" class="invalid-feedback">{{ invalidFeedback }}</div>
        <div id="inputAlbumUrlHelp" class="form-text">
        Should be something like
        <template v-for="site in availableSites" :key="site.example">
            <br /><code>{{ site.example }}</code>
        </template>
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
        </div>
    </div>
</form>
</template>
