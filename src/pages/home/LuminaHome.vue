<!--
  @file LuminaHome.vue
  @description DataLumina 风格首页（复刻自 cn-data-lumina/src/pages/home/index.vue）
  保留：粉蓝霓虹科技感背景、活力动效 SVG Logo、打字机标语、三张功能卡片。
  单机版：去掉 Agent 能力校验（原版会请求 `/explore/space` 接口）。
-->

<template>
  <div class="home-container">
    <div class="tech-background">
      <div class="grid-overlay" />
      <div class="glow-orb orb-1" />
      <div class="glow-orb orb-2" />
      <div class="glow-orb orb-3" />
    </div>

    <div class="main-content">
      <div class="logo-section" v-html="animatedLogo" />

      <div class="tagline-section">
        <p class="tagline">
          <span class="typing-text">智能数据分析，驱动业务增长</span>
          <span class="cursor">|</span>
        </p>
      </div>

      <div class="feature-cards">
        <div class="feature-card" @click="navigateTo('/data-map')">
          <div class="card-icon"><FundViewOutlined /></div>
          <h3>探索分析</h3>
          <p>自助式数据探索与可视化</p>
        </div>

        <div class="feature-card" @click="navigateTo('/metric/catalog')">
          <div class="card-icon"><UngroupOutlined /></div>
          <h3>指标管理</h3>
          <p>统一指标定义与管理</p>
        </div>

        <div class="feature-card" @click="navigateTo('/workbench')">
          <div class="card-icon"><TagsOutlined /></div>
          <h3>标签管理</h3>
          <p>数据资产分类与标签体系</p>
        </div>
      </div>

      <div class="enter-hint">
        <router-link to="/pilot-home" class="enter-link">← Pilot 风格</router-link>
        <router-link to="/workbench" class="enter-link enter-link--primary">
          进入工作台
        </router-link>
      </div>
    </div>

    <div class="bottom-line" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { FundViewOutlined, UngroupOutlined, TagsOutlined } from '@ant-design/icons-vue';

const router = useRouter();

function navigateTo(path: string) {
  router.push(path);
}

const animatedLogo = ref(`
<svg width="360" height="120" viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="b-animated" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2A7BFF">
        <animate attributeName="stop-color" values="#2A7BFF;#7C3BFF;#FF55C8;#2A7BFF" dur="8s" repeatCount="indefinite"/>
      </stop>
      <stop offset="50%" stop-color="#7C3BFF">
        <animate attributeName="stop-color" values="#7C3BFF;#FF55C8;#2A7BFF;#7C3BFF" dur="8s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" stop-color="#FF55C8">
        <animate attributeName="stop-color" values="#FF55C8;#2A7BFF;#7C3BFF;#FF55C8" dur="8s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    <linearGradient id="d-animated" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2A7BFF">
        <animate attributeName="stop-color" values="#2A7BFF;#7C3BFF;#FF55C8;#2A7BFF" dur="8s" repeatCount="indefinite"/>
      </stop>
      <stop offset="50%" stop-color="#7C3BFF">
        <animate attributeName="stop-color" values="#7C3BFF;#FF55C8;#2A7BFF;#7C3BFF" dur="8s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" stop-color="#FF55C8">
        <animate attributeName="stop-color" values="#FF55C8;#2A7BFF;#7C3BFF;#FF55C8" dur="8s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    <radialGradient id="a-animated" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#fff"/>
      <stop offset="40%" stop-color="#2A7BFF" stop-opacity=".9"/>
      <stop offset="80%" stop-color="#FF55C8" stop-opacity=".35"/>
      <stop offset="100%" stop-opacity="0"/>
    </radialGradient>
    <filter id="c-animated">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <style>
      .icon-circle { animation: pulse-glow 3s ease-in-out infinite; }
      .icon-path { animation: path-flow 4s linear infinite; }
      .icon-dot-1 { animation: dot-pulse 2s ease-in-out infinite; }
      .icon-dot-2 { animation: dot-pulse 2s ease-in-out infinite 0.6s; }
      .icon-dot-3 { animation: dot-pulse 2s ease-in-out infinite 1.2s; }
      .icon-core { animation: core-pulse 3s ease-in-out infinite; }
      .icon-highlight { animation: highlight-twinkle 2s ease-in-out infinite; }
      .neural-node { animation: node-pulse 2s ease-in-out infinite; }
      .ai-badge { animation: badge-glow 2.5s ease-in-out infinite; }
      @keyframes pulse-glow { 0%,100%{opacity:.8;transform:scale(1)} 50%{opacity:1;transform:scale(1.02)} }
      @keyframes path-flow { 0%{stroke-dasharray:0,200;opacity:.7} 50%{stroke-dasharray:100,200;opacity:1} 100%{stroke-dasharray:0,200;opacity:.7} }
      @keyframes dot-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.9} }
      @keyframes core-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
      @keyframes highlight-twinkle { 0%,100%{opacity:.85} 50%{opacity:1} }
      @keyframes node-pulse { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.3);opacity:.8} }
      @keyframes badge-glow { 0%,100%{opacity:.9} 50%{opacity:1} }
    </style>
  </defs>
  <g transform="translate(20 10)">
    <circle cx="50" cy="50" r="45" fill="url(#a-animated)" opacity=".8" class="icon-circle"/>
    <circle cx="50" cy="8" r="2.5" fill="url(#b-animated)" opacity="0.5" class="neural-node" style="animation-delay:0s"/>
    <circle cx="50" cy="92" r="2.5" fill="url(#b-animated)" opacity="0.5" class="neural-node" style="animation-delay:.25s"/>
    <circle cx="8" cy="50" r="2.5" fill="url(#b-animated)" opacity="0.5" class="neural-node" style="animation-delay:.5s"/>
    <circle cx="92" cy="50" r="2.5" fill="url(#b-animated)" opacity="0.5" class="neural-node" style="animation-delay:.75s"/>
    <circle cx="28" cy="15" r="2.5" fill="url(#b-animated)" opacity="0.5" class="neural-node" style="animation-delay:1s"/>
    <circle cx="72" cy="15" r="2.5" fill="url(#b-animated)" opacity="0.5" class="neural-node" style="animation-delay:1.25s"/>
    <circle cx="28" cy="85" r="2.5" fill="url(#b-animated)" opacity="0.5" class="neural-node" style="animation-delay:1.5s"/>
    <circle cx="72" cy="85" r="2.5" fill="url(#b-animated)" opacity="0.5" class="neural-node" style="animation-delay:1.75s"/>
    <path d="M20 58a35 35 0 0 1 60-16" fill="none" stroke="url(#b-animated)" stroke-width="4" stroke-linecap="round" opacity=".9" filter="url(#c-animated)" class="icon-path"/>
    <circle cx="25" cy="57" r="3" fill="#2A7BFF" class="icon-dot-1"/>
    <circle cx="42" cy="64" r="2.4" fill="#7C3BFF" class="icon-dot-2"/>
    <circle cx="70" cy="48" r="3" fill="#FF55C8" class="icon-dot-3"/>
    <circle cx="50" cy="50" r="18" fill="url(#b-animated)" filter="url(#c-animated)" class="icon-core"/>
    <circle cx="46" cy="46" r="7" fill="#fff" opacity=".85" class="icon-highlight" style="animation-delay:0s"/>
    <circle cx="50" cy="40" r="1.6" fill="#fff" opacity=".9" class="icon-highlight" style="animation-delay:.3s"/>
    <circle cx="57" cy="46" r="1.4" fill="#fff" opacity=".85" class="icon-highlight" style="animation-delay:.6s"/>
    <circle cx="48" cy="56" r="1.4" fill="#fff" opacity=".85" class="icon-highlight" style="animation-delay:.9s"/>
    <circle cx="54" cy="60" r="1.3" fill="#fff" opacity=".8" class="icon-highlight" style="animation-delay:1.2s"/>
    <g transform="translate(85 0)">
      <rect x="0" y="0" width="28" height="18" rx="9" fill="url(#b-animated)" opacity="0.9" class="ai-badge"/>
      <text x="14" y="13" font-size="9" fill="#fff" text-anchor="middle" font-weight="700" letter-spacing="0.1em">AI</text>
    </g>
  </g>
  <g font-family="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif">
    <text y="32" font-size="32" font-weight="600" fill="url(#d-animated)" transform="translate(120 35)">
      <tspan letter-spacing=".03em">Data</tspan><tspan letter-spacing=".05em">Lumina</tspan>
    </text>
    <text x="2" y="54" font-size="12" fill="#9ba4c6" letter-spacing=".16em" style="text-transform:uppercase" transform="translate(120 35)">
      让数据发光，让业务看见价值
    </text>
  </g>
</svg>
`);
</script>

<style lang="less" scoped>
.home-container {
  height: 100vh;
  background: #0a0e27;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.tech-background {
  position: absolute;
  inset: 0;
  overflow: hidden;

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(42, 123, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(42, 123, 255, 0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: grid-move 20s linear infinite;
  }

  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
    animation: orb-float 8s ease-in-out infinite;

    &.orb-1 {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, #2a7bff 0%, transparent 70%);
      top: -100px;
      left: -100px;
    }
    &.orb-2 {
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, #7c3bff 0%, transparent 70%);
      bottom: -50px;
      right: -50px;
      animation-delay: 2s;
    }
    &.orb-3 {
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, #ff55c8 0%, transparent 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: 4s;
    }
  }
}

.main-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 2rem;
  margin-top: -4rem;
}

.logo-section {
  margin-bottom: 2rem;
  animation: fade-in-up 1s ease-out;

  :deep(svg) {
    filter: drop-shadow(0 0 30px rgba(42, 123, 255, 0.3));
  }
}

.tagline-section {
  margin-bottom: 3rem;
  animation: fade-in-up 1s ease-out 0.3s both;

  .tagline {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.72);
    letter-spacing: 0.1em;

    .typing-text {
      display: inline-block;
      overflow: hidden;
      white-space: nowrap;
      animation: typing 3s steps(16) 1s forwards;
      width: 0;
    }

    .cursor {
      display: inline-block;
      color: #2a7bff;
      animation: blink 1s step-end infinite;
      margin-left: 2px;
      vertical-align: top;
      font-weight: 300;
    }
  }
}

.feature-cards {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  animation: fade-in-up 1s ease-out 0.6s both;
}

.feature-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  width: 220px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(42, 123, 255, 0.4);
    transform: translateY(-8px);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 0 30px rgba(42, 123, 255, 0.2);

    .card-icon {
      transform: scale(1.1);
      color: #7c3bff;
    }
  }

  .card-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 1rem;
    padding: 12px;
    background: linear-gradient(135deg, rgba(42, 123, 255, 0.2), rgba(124, 59, 255, 0.2));
    border-radius: 12px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: rgba(255, 255, 255, 0.8);
  }

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #2a7bff, #7c3bff, #ff55c8);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.5;
    margin: 0;
  }
}

.enter-hint {
  margin-top: 48px;
  display: flex;
  justify-content: center;
  gap: 20px;
  animation: fade-in-up 1s ease-out 0.9s both;
}

.enter-link {
  padding: 10px 22px;
  border-radius: 999px;
  font-size: 13px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.15);
  text-decoration: none;
  transition: all 0.25s ease;

  &:hover {
    color: #fff;
    border-color: rgba(42, 123, 255, 0.6);
    background: rgba(42, 123, 255, 0.1);
    transform: translateY(-2px);
  }

  &--primary {
    background: linear-gradient(135deg, #2a7bff, #7c3bff);
    border-color: transparent;
    color: #fff;
  }
}

.bottom-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    #2a7bff 20%,
    #7c3bff 50%,
    #ff55c8 80%,
    transparent 100%
  );
  opacity: 0.6;
  animation: line-glow 3s ease-in-out infinite;
}

@keyframes grid-move {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}
@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
  50% { transform: translate(20px, -20px) scale(1.1); opacity: 0.6; }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes typing {
  from { width: 0; }
  to { width: 16em; }
}
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
@keyframes line-glow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

@media (max-width: 768px) {
  .feature-cards {
    flex-direction: column;
    align-items: center;
  }
  .feature-card { width: 100%; max-width: 280px; }
}
</style>
