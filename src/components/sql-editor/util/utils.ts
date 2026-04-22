export const splitSql = (sql: string) => {
  const statements = [];
  let currentStatement = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escapeNext = false;
  let startLine = 1;
  let currentLine = 1;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];

    // Update line number if we encounter a newline character
    if (c === '\n') {
      currentLine++;
    }

    if (escapeNext) {
      currentStatement += c;
      escapeNext = false;
    } else if (inLineComment) {
        if (c === '\n') {
          inLineComment = false;
        }

        currentStatement += c;
      } else if (inBlockComment) {
        if (c === '*' && sql[i + 1] === '/') {
          inBlockComment = false;
          i++; // Skip the '/'
          currentStatement += '*/'; // Include the end of block comment
        } else {
          currentStatement += c;
        }
      } else if (inSingleQuote) {
        if (c === "'" && sql[i - 1] !== '\\') {
          // Consider escaped quotes
          inSingleQuote = false;
        }

        currentStatement += c;
      } else if (inDoubleQuote) {
        if (c === '"' && sql[i - 1] !== '\\') {
          // Consider escaped quotes
          inDoubleQuote = false;
        }

        currentStatement += c;
      } else {
        switch (c) {
          case '\\':
            escapeNext = true;
            currentStatement += c;
            break;
          case "'":
            inSingleQuote = true;
            currentStatement += c;
            break;
          case '"':
            inDoubleQuote = true;
            currentStatement += c;
            break;
          case '-':
            if (sql[i + 1] === '-') {
              inLineComment = true;
              i++; // Skip the second '-'
              currentStatement += '--';
            } else {
              currentStatement += c;
            }

            break;
          case '/':
            if (sql[i + 1] === '*') {
              inBlockComment = true;
              i++; // Skip the '*'
              currentStatement += '/*'; // Include the start of block comment
            } else {
              currentStatement += c;
            }

            break;
          case ';':
            currentStatement += c;
            // Split only if not inside quotes or comments
            statements.push({
              statement: currentStatement,
              startLine,
              endLine: currentLine,
            });
            currentStatement = '';
            startLine = currentLine + 1; // New statement starts after this line
            break;
          default:
            currentStatement += c;
            break;
        }
      }
  }

  if (currentStatement) {
    statements.push({
      statement: currentStatement,
      startLine,
      endLine: currentLine,
    });
  }

  return statements;
};
