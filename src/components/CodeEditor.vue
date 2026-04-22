<template>
  <div ref="containerRef" class="code-editor" />
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { monaco } from '@/utils/monaco-setup';

interface Props {
  modelValue: string;
  language?: string;
  readonly?: boolean;
  theme?: 'vs' | 'vs-dark' | 'hc-black';
  minimap?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  language: 'sql',
  readonly: false,
  theme: 'vs',
  minimap: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
}>();

const containerRef = ref<HTMLDivElement>();
let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
let internalUpdate = false;

onMounted(() => {
  if (!containerRef.value) return;
  editorInstance = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: props.language,
    readOnly: props.readonly,
    theme: props.theme,
    fontSize: 13,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    minimap: { enabled: props.minimap },
    automaticLayout: true,
    wordWrap: 'on',
    tabSize: 2,
    renderLineHighlight: 'line',
  });
  editorInstance.onDidChangeModelContent(() => {
    if (!editorInstance) return;
    internalUpdate = true;
    emit('update:modelValue', editorInstance.getValue());
    internalUpdate = false;
  });
});

watch(
  () => props.modelValue,
  (val) => {
    if (!editorInstance || internalUpdate) return;
    if (editorInstance.getValue() !== val) editorInstance.setValue(val ?? '');
  },
);

watch(
  () => props.language,
  (lang) => {
    const model = editorInstance?.getModel();
    if (model) monaco.editor.setModelLanguage(model, lang);
  },
);

watch(
  () => props.readonly,
  (ro) => editorInstance?.updateOptions({ readOnly: ro }),
);

onBeforeUnmount(() => {
  editorInstance?.dispose();
  editorInstance = null;
});
</script>

<style scoped>
.code-editor {
  width: 100%;
  height: 100%;
  min-height: 180px;
}
</style>
