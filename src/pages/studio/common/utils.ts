/**
 * 下载辅助（单机 mock 场景，不走 blob response，直接前端生成 CSV）
 */
export const saveFileFromResponse = (response: {
  data: Blob;
  headers: { [x: string]: any };
}) => {
  const cd = response.headers?.['content-disposition'] || '';
  const fileNameMatch = cd.match(/;filename[*]?=['"]?([^'";\n]+)['"]?/i);
  const fileName = fileNameMatch?.[1] ?? 'download.csv';

  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 在树中查找某个节点的完整路径（用于面包屑/定位）
 * 从原版 cn-data-pilot common/utils.ts 原样复刻
 */
export function findPath(
  tree: any[],
  targetKey: any,
  targetName?: string,
  keyField = 'id',
  childrenField = 'children',
): any[] {
  for (const node of tree) {
    if (targetKey && node[keyField] === targetKey) {
      return [node];
    }

    if (!targetKey && targetName && node.taskName === targetName) {
      return [node];
    }

    if (node[childrenField]) {
      const path = findPath(
        node[childrenField],
        targetKey,
        targetName,
        keyField,
        childrenField,
      );
      if (path.length) {
        return [node, ...path];
      }
    }
  }

  return [];
}

export const buildCsvBlob = (headers: string[], rows: any[][]) => {
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(',')];
  rows.forEach((row) => lines.push(row.map(escape).join(',')));
  // 加 BOM 防止 Excel 打开中文乱码
  return new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
};
