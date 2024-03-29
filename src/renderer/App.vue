<script setup lang="ts">
import { ref } from 'vue';
import AlbumUrlForm from './AlbumUrlForm.vue';
import DownloadList from './DownloadList.vue';
import type { Album } from './AlbumPattern';

const isDownloading = ref(false)
const outputDirRef = ref("")
const albumRef = ref<Album>()

async function startDownloadAlbum(album: Album) {
  const { outputDir, canceled } = await window.electron.createOutputDirectory({ dirName: album.albumId });
  if (canceled === true || outputDir === undefined) {
    return;
  }
  albumRef.value = album;
  outputDirRef.value = outputDir
  isDownloading.value = true
}

</script>

<template>
  <div class="container">
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
      />
    </template>

  </div>
</template>
