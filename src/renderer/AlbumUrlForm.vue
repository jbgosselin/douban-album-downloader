<script setup lang="ts">
import { ref, computed } from 'vue';
import { availableSites, matchSite, type Album } from './AlbumPattern'

const emit = defineEmits<{
    startDownload: [albumUrl: Album],
}>();

enum FormState {
    Valid,
    InvalidUrl,
    NotDoubanUrl,
}

let albumUrl = ref("");
let formState = ref(FormState.Valid);

let invalidFeedback = computed(() => {
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

    let site = matchSite(parsedUrl)
    if (site === null) {
        formState.value = FormState.NotDoubanUrl;
        return
    }

    formState.value = FormState.Valid;
    emit('startDownload', site)
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
        <template v-for="site in availableSites">
            <br /><code>{{ site.example }}</code>
        </template>
        </div>
    </div>
    <button type="submit" class="btn btn-primary">Download</button>
</form>
</template>
