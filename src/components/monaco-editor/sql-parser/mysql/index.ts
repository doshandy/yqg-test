import { createParser } from 'syntax-parser';
import type { IStatements } from '../base/define';
import { sqlTokenizer } from './lexer';
import { root } from './parser';

const isTextTooComplex = (text: string): boolean => {
  if (text.length > 1000) return true;

  const nestingLevel = (text.match(/\(/g) || []).length;
  if (nestingLevel > 50) return true;

  return false;
};

// @ts-ignore
export const mysqlParser = (text: string, cursorIndex: number = null) => {
  if (isTextTooComplex(text)) {
    return {
      ast: null,
      error: null,
      nextMatchings: [],
      cursorKeyPath: [],
    };
  }

  return createParser<IStatements>(root, sqlTokenizer, {
    cursorTokenExcludes: (token) => {
      return token?.value === '.' || token?.value === ':';
    },
  })(text, cursorIndex);
};
