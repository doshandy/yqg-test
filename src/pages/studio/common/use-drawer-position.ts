import { computed } from 'vue';

/**
 * 单机版简化：固定 header 高度 56，右侧工具栏宽度 48
 */
export const useDrawerPosition = (options?: { right?: string }) => {
  const BASE_TOP = 56;

  const drawerTop = computed(() => `${BASE_TOP}px`);
  const drawerHeight = computed(
    () => `${100 - (BASE_TOP / window.innerHeight) * 100}vh`,
  );

  const drawerRootStyle = computed(() => ({
    top: drawerTop.value,
    right: options?.right ?? '48px',
    height: drawerHeight.value,
    outline: 'none',
    border: 'none',
    boxShadow: 'none',
  }));

  return { drawerTop, drawerHeight, drawerRootStyle };
};
