<!--
  标签管理首页：介绍 + 快捷入口
-->
<template>
  <div class="tag-home">
    <div class="hero">
      <div class="hero-tag">Barrett · 标签管理</div>
      <h1 class="hero-title">让用户画像更清晰</h1>
      <p class="hero-desc">
        统一管理自定义标签、人群、画像与使用审计，为风控、运营、画像分析提供一致的用户分层能力。
      </p>
      <a-space :size="12">
        <a-button type="primary" @click="goMetrics">
          开始使用指标管理
          <template #icon><RightOutlined /></template>
        </a-button>
        <a-button @click="goGroups">人群管理</a-button>
      </a-space>
    </div>

    <div class="home-sections">
      <a-card class="info-card" title="核心能力">
        <ul class="feature-list">
          <li><BarChartOutlined /><span>指标管理：统一的业务指标体系</span></li>
          <li><TagOutlined /><span>自定义标签：规则化构建用户标签</span></li>
          <li><UsergroupAddOutlined /><span>人群管理：圈选目标客群并下发</span></li>
          <li><LineChartOutlined /><span>使用统计：追踪用户标签使用情况</span></li>
        </ul>
      </a-card>

      <a-card class="info-card" title="快捷入口">
        <div class="shortcut-grid">
          <div
            v-for="item in shortcuts"
            :key="item.menuKey"
            class="shortcut-item"
            @click="openByMenu(item.menuKey, item.title, item.routePath)"
          >
            <component :is="item.icon" class="shortcut-icon" />
            <div>
              <div class="shortcut-title">{{ item.title }}</div>
              <div class="shortcut-desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue';
import {
  ApartmentOutlined,
  BarChartOutlined,
  LineChartOutlined,
  RightOutlined,
  SafetyOutlined,
  TagOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons-vue';
import { useTagTabsStore } from '@/store/tag-tabs';

const tabsStore = useTagTabsStore();

const shortcuts = [
  {
    menuKey: 'metrics',
    routePath: '/clientele/metrics',
    title: '指标管理',
    desc: '查看与维护业务指标',
    icon: h(BarChartOutlined),
  },
  {
    menuKey: 'rule',
    routePath: '/clientele/rule',
    title: '自定义标签',
    desc: '规则化构建用户标签',
    icon: h(TagOutlined),
  },
  {
    menuKey: 'group',
    routePath: '/clientele/group',
    title: '人群管理',
    desc: '圈选目标人群并下发',
    icon: h(UsergroupAddOutlined),
  },
  {
    menuKey: 'bloodline',
    routePath: '/clientele/bloodline',
    title: '血缘查询',
    desc: '追溯指标血缘与依赖',
    icon: h(ApartmentOutlined),
  },
  {
    menuKey: 'system-auth',
    routePath: '/clientele/system-auth',
    title: '系统权限',
    desc: '管理人员与角色权限',
    icon: h(SafetyOutlined),
  },
  {
    menuKey: 'stat',
    routePath: '/clientele/stat',
    title: '使用统计',
    desc: '标签使用情况监控',
    icon: h(LineChartOutlined),
  },
];

function openByMenu(menuKey: string, title: string, routePath: string) {
  tabsStore.openTab({ menuKey, title, routePath });
}

function goMetrics() {
  openByMenu('metrics', '指标管理', '/clientele/metrics');
}
function goGroups() {
  openByMenu('group', '人群管理', '/clientele/group');
}
</script>

<style lang="less" scoped>
.tag-home {
  padding: 24px;
}
.hero {
  background: linear-gradient(135deg, #1677ff 0%, #722ed1 100%);
  color: #fff;
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 16px;
}
.hero-tag {
  display: inline-block;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 12px;
  margin-bottom: 12px;
}
.hero-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #fff;
}
.hero-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 20px;
}

.home-sections {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 16px;
}

.info-card {
  :deep(.ant-card-head-title) {
    font-size: 15px;
  }
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    color: rgba(0, 0, 0, 0.85);
    .anticon {
      color: #1677ff;
      font-size: 16px;
    }
    & + li {
      border-top: 1px dashed rgba(5, 5, 5, 0.06);
    }
  }
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.shortcut-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(5, 5, 5, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  align-items: center;
  &:hover {
    border-color: #1677ff;
    box-shadow: 0 4px 12px rgba(22, 119, 255, 0.12);
  }
}
.shortcut-icon {
  color: #1677ff;
  font-size: 24px;
}
.shortcut-title {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}
.shortcut-desc {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
