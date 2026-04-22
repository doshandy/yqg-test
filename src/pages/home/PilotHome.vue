<!--
  @file PilotHome.vue
  @description DataPilot 风格科技感首页。
  特性：Canvas 粒子背景、Logo 光环动画、打字机效果、鼠标跟随光效、特性卡片。
-->

<template>
  <div class="pilot-home">
    <canvas ref="bgCanvas" class="bg-canvas" />
    <div class="grid-background" />
    <div class="gradient-overlay" />

    <div class="content-wrapper">
      <div class="slogan-box">
        <div class="logo-wrapper">
          <div class="logo-ring logo-ring-1" />
          <div class="logo-ring logo-ring-2" />
          <div class="logo-container">
            <svg viewBox="0 0 100 100" class="logo-svg">
              <defs>
                <linearGradient id="pilotLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#3b82f6" />
                  <stop offset="100%" stop-color="#8b5cf6" />
                </linearGradient>
              </defs>
              <rect
                x="10" y="10" width="80" height="80" rx="20"
                stroke="url(#pilotLogoGrad)" stroke-width="6" fill="none"
                class="logo-dash"
              />
              <g class="logo-pulse">
                <circle cx="50" cy="50" r="18" fill="url(#pilotLogoGrad)" />
                <circle cx="50" cy="50" r="10" fill="white" fill-opacity="0.3" />
              </g>
              <path
                d="M50 10 V30 M50 70 V90 M10 50 H30 M70 50 H90"
                stroke="white" stroke-opacity="0.1" stroke-width="2"
              />
              <circle r="2" fill="#fff">
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M50 10 V30" />
              </circle>
              <circle r="2" fill="#fff">
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M50 90 V70" />
              </circle>
              <circle r="2" fill="#fff">
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M10 50 H30" />
              </circle>
              <circle r="2" fill="#fff">
                <animateMotion dur="1.5s" repeatCount="indefinite" path="M90 50 H70" />
              </circle>
            </svg>
          </div>
        </div>

        <div class="title-wrapper">
          <h1 class="title">
            <span class="title-text">DataPilot 数智工场</span>
          </h1>
        </div>

        <p class="slogan">
          <span ref="typingText" class="slogan-text" />
          <span class="cursor-blink" />
        </p>

        <div class="features">
          <div
            v-for="item in features"
            :key="item.title"
            class="feature-item glass"
            :class="`feature-item--${item.color}`"
            @click="$router.push(item.to)"
          >
            <div class="feature-content">
              <div class="feature-icon-wrapper">
                <component :is="item.icon" class="feature-icon" />
              </div>
              <div class="feature-text-wrapper">
                <div class="feature-title">{{ item.title }}</div>
                <div class="feature-divider" />
                <div class="feature-desc">{{ item.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="enter-hint">
          <router-link to="/workbench" class="enter-link">进入工作台 →</router-link>
          <router-link to="/lumina-home" class="enter-link enter-link--ghost">
            切换到 Lumina 风格
          </router-link>
        </div>
      </div>
    </div>

    <div ref="mouseLight" class="mouse-light" />
  </div>
</template>

<script lang="ts" setup>
import { h, onMounted, onUnmounted, ref } from 'vue';
import {
  DatabaseOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue';

const bgCanvas = ref<HTMLCanvasElement | null>(null);
const typingText = ref<HTMLElement | null>(null);
const mouseLight = ref<HTMLElement | null>(null);

const features = [
  {
    title: '智能数据',
    desc: '自动化数据建模与治理',
    color: 'blue',
    icon: () => h(DatabaseOutlined),
    to: '/data-map',
  },
  {
    title: '高效处理',
    desc: '毫秒级实时计算引擎',
    color: 'purple',
    icon: () => h(ThunderboltOutlined),
    to: '/workbench',
  },
  {
    title: 'AI 驱动',
    desc: '全场景模型赋能业务',
    color: 'light-blue',
    icon: () => h(RocketOutlined),
    to: '/metric/catalog',
  },
];

// Canvas 粒子
interface Particle {
  baseX: number;
  baseY: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
}

let canvasCtx: CanvasRenderingContext2D | null = null;
let canvasWidth = 0;
let canvasHeight = 0;
let particles: Particle[] = [];
const mouse = { x: -1000, y: -1000 };
let animationFrameId: number | null = null;
let rafId: number | null = null;
let isUpdating = false;
let mouseX = 0;
let mouseY = 0;
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let typingTimer: ReturnType<typeof setTimeout> | null = null;

const typingContent = 'Say hello to DataPilot! Discover the limitless potential of AI + Data.';
let charIndex = 0;

const updateMouseLight = () => {
  if (mouseLight.value) {
    mouseLight.value.style.left = `${mouseX}px`;
    mouseLight.value.style.top = `${mouseY}px`;
  }
  isUpdating = false;
  rafId = null;
};

const handleMouseMove = (e: MouseEvent) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  if (!isUpdating) {
    isUpdating = true;
    rafId = requestAnimationFrame(updateMouseLight);
  }
};

const initCanvas = () => {
  if (!bgCanvas.value) return;
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  bgCanvas.value.width = canvasWidth;
  bgCanvas.value.height = canvasHeight;
  canvasCtx = bgCanvas.value.getContext('2d');
  if (!canvasCtx) return;

  particles = [];
  for (let i = 0; i < 60; i++) {
    particles.push({
      baseX: Math.random() * canvasWidth,
      baseY: Math.random() * canvasHeight,
      size: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: (Math.random() - 0.5) * 0.25,
      color:
        i % 3 === 0
          ? 'rgba(96, 165, 250, 0.3)'
          : i % 3 === 1
          ? 'rgba(167, 139, 250, 0.3)'
          : 'rgba(255, 255, 255, 0.15)',
    });
  }
};

const animateCanvas = () => {
  if (!canvasCtx || !bgCanvas.value) return;
  canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

  const movedPoints = particles.map((p) => {
    p.baseX += p.speedX;
    p.baseY += p.speedY;
    if (p.baseX < 0) p.baseX = canvasWidth;
    if (p.baseX > canvasWidth) p.baseX = 0;
    if (p.baseY < 0) p.baseY = canvasHeight;
    if (p.baseY > canvasHeight) p.baseY = 0;
    const dx = mouse.x - p.baseX;
    const dy = mouse.y - p.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const force = Math.max(0, (300 - dist) / 300);
    return {
      x: p.baseX + dx * force * 0.18,
      y: p.baseY + dy * force * 0.18,
      size: p.size,
      color: p.color,
    };
  });

  movedPoints.forEach((p, idx) => {
    canvasCtx!.beginPath();
    canvasCtx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    canvasCtx!.fillStyle = p.color;
    canvasCtx!.fill();
    for (let j = idx + 1; j < movedPoints.length; j++) {
      const q = movedPoints[j];
      const distBetween = Math.hypot(p.x - q.x, p.y - q.y);
      if (distBetween < 140) {
        canvasCtx!.beginPath();
        canvasCtx!.moveTo(p.x, p.y);
        canvasCtx!.lineTo(q.x, q.y);
        canvasCtx!.strokeStyle = `rgba(100, 150, 255, ${0.07 * (1 - distBetween / 140)})`;
        canvasCtx!.lineWidth = 0.5;
        canvasCtx!.stroke();
      }
    }
  });

  animationFrameId = requestAnimationFrame(animateCanvas);
};

const handleResize = () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initCanvas, 150);
};

const typeText = () => {
  if (typingText.value && charIndex < typingContent.length) {
    typingText.value.textContent = typingContent.substring(0, charIndex + 1);
    charIndex++;
    typingTimer = setTimeout(typeText, 70);
  }
};

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('resize', handleResize);
  initCanvas();
  animateCanvas();
  setTimeout(typeText, 400);
});

onUnmounted(() => {
  if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
  if (rafId !== null) cancelAnimationFrame(rafId);
  if (resizeTimer) clearTimeout(resizeTimer);
  if (typingTimer) clearTimeout(typingTimer);
  charIndex = 0;
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('resize', handleResize);
});
</script>

<style lang="less" scoped>
.pilot-home {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #050a18;
  color: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  text-align: center;
  padding-top: 6vh;
}

.bg-canvas {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
}

.grid-background {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

.gradient-overlay {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(30, 64, 175, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(88, 28, 135, 0.2) 0%, transparent 50%);
  pointer-events: none;
}

.content-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1200px;
  padding: 0 24px;
}

.slogan-box {
  animation: fadeInUp 1.5s ease-out;
}

.logo-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 48px;
}

.logo-ring {
  position: absolute;
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.logo-ring-1 {
  width: 160px;
  height: 160px;
  animation: rotate-slow 15s linear infinite;
}

.logo-ring-2 {
  width: 128px;
  height: 128px;
  border-color: rgba(139, 92, 246, 0.1);
  animation: rotate-slow 10s linear infinite reverse;
}

.logo-container {
  position: relative;
  width: 128px;
  height: 128px;
  filter: drop-shadow(0 0 15px rgba(96, 165, 250, 0.4));
}

.logo-svg {
  width: 100%;
  height: 100%;
}

.logo-dash {
  stroke-dasharray: 20 10;
  animation: dash-move 2s linear infinite;
}

.logo-pulse {
  animation: logo-pulse 3s ease-in-out infinite;
}

.title {
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: 0.3em;
  margin: 0 0 32px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.4) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.slogan {
  color: rgba(147, 197, 253, 0.6);
  font-size: 1.125rem;
  font-weight: 300;
  margin: 0 0 72px 0;
  min-height: 1.5em;
  letter-spacing: 0.05em;
}

.cursor-blink {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: #60a5fa;
  margin-left: 4px;
  vertical-align: middle;
  animation: blink 1s infinite;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-item {
  position: relative;
  cursor: pointer;
  min-height: 280px;

  &.glass {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 48px 24px;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(96, 165, 250, 0.3);
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.1);

      .feature-desc {
        opacity: 1;
        transform: translateY(0);
      }

      .feature-divider {
        width: 48px;
      }
    }
  }

  &--blue .feature-icon {
    color: #60a5fa;
  }
  &--purple .feature-icon {
    color: #a78bfa;
  }
  &--light-blue .feature-icon {
    color: #93c5fd;
  }
}

.feature-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  height: 100%;
}

.feature-icon {
  font-size: 48px;
  transition: transform 0.4s ease;
}

.feature-item:hover .feature-icon {
  transform: scale(1.15);
}

.feature-text-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 300;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.9);
  transition: color 0.4s;
}

.feature-divider {
  height: 1px;
  width: 0;
  background: rgba(59, 130, 246, 0.5);
  transition: width 0.4s;
}

.feature-desc {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.45);
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.4s, transform 0.4s;
  line-height: 1.6;
  max-width: 220px;
}

.enter-hint {
  margin-top: 60px;
  display: flex;
  justify-content: center;
  gap: 24px;
}

.enter-link {
  color: rgba(147, 197, 253, 0.8);
  padding: 10px 20px;
  border: 1px solid rgba(147, 197, 253, 0.3);
  border-radius: 999px;
  font-size: 13px;
  letter-spacing: 0.08em;
  transition: all 0.3s ease;
  text-decoration: none;

  &:hover {
    background: rgba(147, 197, 253, 0.1);
    border-color: rgba(147, 197, 253, 0.6);
    color: #fff;
    transform: translateY(-2px);
  }

  &--ghost {
    color: rgba(167, 139, 250, 0.8);
    border-color: rgba(167, 139, 250, 0.3);

    &:hover {
      background: rgba(167, 139, 250, 0.1);
      border-color: rgba(167, 139, 250, 0.6);
    }
  }
}

.mouse-light {
  position: fixed;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, rgba(139, 92, 246, 0.1) 30%, transparent 70%);
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 5;
  filter: blur(40px);
  mix-blend-mode: screen;
}

@keyframes logo-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
    filter: drop-shadow(0 0 5px #60a5fa);
  }
  50% {
    transform: scale(1.15);
    opacity: 0.8;
    filter: drop-shadow(0 0 15px #a78bfa);
  }
}

@keyframes dash-move {
  to {
    stroke-dashoffset: -50;
  }
}

@keyframes rotate-slow {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
