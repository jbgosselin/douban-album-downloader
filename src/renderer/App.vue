<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AlbumUrlForm from './AlbumUrlForm.vue';
import DownloadList from './DownloadList.vue';
import type { Album, DownloadSettings } from './AlbumPattern';
import { bridge } from './tauri-bridge';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const isDownloading = ref(false)
const outputDirRef = ref("")
const albumRef = ref<Album>()
const settingsRef = ref<DownloadSettings>({ concurrency: 5, retries: 3, pageFetchTimeout: 30, imageDownloadTimeout: 60 })

const pendingUpdate = ref<Update | null>(null)
const updateDismissed = ref(false)
const isUpdating = ref(false)

onMounted(async () => {
  try {
    const update = await check()
    if (update && localStorage.getItem('skippedVersion') !== update.version) {
      pendingUpdate.value = update
    }
  } catch (e) {
    console.warn('Update check failed:', e)
  }
})

async function doUpdate() {
  if (!pendingUpdate.value) return
  isUpdating.value = true
  await pendingUpdate.value.downloadAndInstall()
  await relaunch()
}

function skipVersion() {
  if (!pendingUpdate.value) return
  localStorage.setItem('skippedVersion', pendingUpdate.value.version)
  pendingUpdate.value = null
}

function dismissUpdate() {
  updateDismissed.value = true
}

async function startDownloadAlbum(album: Album, settings: DownloadSettings) {
  const { outputDir, canceled } = await bridge.createOutputDirectory({ dirName: album.albumId });
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
  <div class="app-shell" :class="{ 'app-shell-download': isDownloading }" @dragover.prevent @drop.prevent>
    <Transition name="fade" mode="out-in">
      <div v-if="!isDownloading" key="form" class="card shadow" style="width: 100%; max-width: 560px;">
        <div class="card-header">
          <h5 class="mb-0">Douban Album Downloader</h5>
        </div>
        <div v-if="pendingUpdate && !updateDismissed" class="card-header d-flex align-items-center gap-2 bg-info-subtle border-bottom">
          <span class="flex-grow-1 small">Version {{ pendingUpdate.version }} is available</span>
          <button class="btn btn-sm btn-primary" :disabled="isUpdating" @click="doUpdate">
            {{ isUpdating ? 'Updating…' : 'Update now' }}
          </button>
          <button class="btn btn-sm btn-outline-secondary" :disabled="isUpdating" @click="skipVersion">Skip</button>
          <button class="btn btn-sm btn-outline-secondary" :disabled="isUpdating" @click="dismissUpdate">Later</button>
        </div>
        <div class="card-body">
          <AlbumUrlForm
            @start-download="startDownloadAlbum"
          />
        </div>
      </div>
      <div v-else key="download" class="download-shell">
        <div class="download-header">
          <h5 class="mb-0">Douban Album Downloader</h5>
        </div>
        <div class="download-body">
          <DownloadList
            :album="albumRef!"
            :output-dir="outputDirRef"
            :settings="settingsRef"
          />
        </div>
      </div>
    </Transition>
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

.app-shell-download {
  align-items: stretch;
  padding: 0;
}

.download-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
}

.download-header {
  padding: 0.75rem 1rem;
  background-color: var(--bs-body-bg);
  border-bottom: 1px solid var(--bs-border-color);
  flex-shrink: 0;
}

.download-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
