<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    successCount?: number,
    errorCount?: number,
    totalCount?: number,
}>(), {
    successCount: 0,
    errorCount: 0,
    totalCount: 100,
})

const successPct = computed(() => props.totalCount > 0 ? (props.successCount / props.totalCount) * 100 : 0)
const errorPct = computed(() => props.totalCount > 0 ? (props.errorCount / props.totalCount) * 100 : 0)
</script>

<template>
    <div class="progress-stacked">
        <div class="progress" role="progressbar" :aria-valuenow="props.successCount" aria-valuemin="0"
            :aria-valuemax="props.totalCount" :style="{ width: successPct + '%' }">
            <div class="progress-bar bg-success"></div>
        </div>
        <div class="progress" role="progressbar" :aria-valuenow="props.errorCount" aria-valuemin="0"
            :aria-valuemax="props.totalCount" :style="{ width: errorPct + '%' }">
            <div class="progress-bar bg-danger"></div>
        </div>
    </div>
</template>
