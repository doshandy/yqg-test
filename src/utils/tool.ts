import { format } from 'sql-formatter';

export const formatSqlWithLanguages = (scriptContent: string) => {
  const supportedLanguages = ['hive', 'sql', 'mysql', 'spark', 'postgresql'];
  for (const lang of supportedLanguages) {
    try {
      const formattedSql = format(scriptContent, { language: lang });
      if (formattedSql !== scriptContent) {
        return formattedSql;
      }
    } catch {
      continue;
    }
  }
  return null;
};
