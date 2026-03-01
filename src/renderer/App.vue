<script setup lang="ts">
import { ref } from 'vue';
import AlbumUrlForm from './AlbumUrlForm.vue';
import DownloadList from './DownloadList.vue';
import type { Album, DownloadSettings } from './AlbumPattern';

const isDownloading = ref(false)
const outputDirRef = ref("")
const albumRef = ref<Album>()
const settingsRef = ref<DownloadSettings>({ concurrency: 5, retries: 3, pageFetchTimeout: 30, imageDownloadTimeout: 60 })

async function startDownloadAlbum(album: Album, settings: DownloadSettings) {
  const { outputDir, canceled } = await window.electron.createOutputDirectory({ dirName: album.albumId });
  if (canceled === true || outputDir === undefined) {
    return;
  }
  albumRef.value = album;
  outputDirRef.value = outputDir
  settingsRef.value = settings
  isDownloading.value = true
}

</script>

<template>
  <div class="app-shell" @dragover.prevent @drop.prevent>
    <div class="card shadow" style="width: 100%; max-width: 560px;">
      <div class="card-header">
        <h5 class="mb-0">Douban Album Downloader</h5>
      </div>
      <div class="card-body">
        <Transition name="fade" mode="out-in">
          <div v-if="!isDownloading" key="form">
            <AlbumUrlForm
              @start-download="startDownloadAlbum"
            />
          </div>
          <div v-else key="download">
            <DownloadList
              :album="albumRef!"
              :output-dir="outputDirRef"
              :settings="settingsRef"
            />
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
