<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    label?: string,
    valueNow?: number,
    valueMax?: number,
}>(), {
    label: "",
    valueNow: 0,
    valueMax: 100,
})

const barStyle = computed(() => ({
    'width': `${props.valueNow * 100 / props.valueMax}%`,
}))

</script>

<template>
    <div class="progress" role="progressbar" aria-label="{{ props.label }}" aria-valuenow="{{ props.valueNow }}" aria-valuemin="0"
        aria-valuemax="{{ props.valueMax }}">
        <div class="progress-bar" :style="barStyle"></div>
    </div>
</template>
