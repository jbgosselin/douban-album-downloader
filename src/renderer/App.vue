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
  <div class="container" @dragover.prevent @drop.prevent>
    <div class="row">
      <div class="col">
        <h1>Douban Album Downloader</h1>
      </div>
    </div>

    <template v-if="!isDownloading">
      <div class="row">
        <div class="col">
          <AlbumUrlForm 
            @start-download="startDownloadAlbum" 
          />
        </div>
      </div>
    </template>

    <template v-else>
      <DownloadList
        :album="albumRef!"
        :output-dir="outputDirRef"
        :settings="settingsRef"
      />
    </template>

  </div>
</template>
