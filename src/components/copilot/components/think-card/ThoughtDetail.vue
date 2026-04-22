<template>
  <div v-if="html" class="copilot-think__cot markdown-body" v-html="html"/>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps<{ thought: string }>();

const html = computed(() => {
  if (!props.thought) return '';

  return DOMPurify.sanitize(marked.parse(props.thought.replace(/<br\s*\/?>/g, '\n'), { async: false }));
});
</script>
