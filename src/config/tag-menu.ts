import type { TagMenuNode } from '@/resources/tag';
import { buildTagMenu, shouldShowBloodline, shouldShowQueryStatItems, shouldShowUserPicture } from '@/mocks/data/tag';

export { shouldShowBloodline, shouldShowQueryStatItems, shouldShowUserPicture };

export function getTagMenuData(area: string): TagMenuNode[] {
  return buildTagMenu(area);
}
