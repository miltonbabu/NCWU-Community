interface TransformResult {
  sql: string;
  params: unknown[];
}

export function transformSqlForPostgresql(sql: string, params: unknown[] = []): TransformResult {
  let transformedSql = sql;
  const transformedParams = [...params];

  transformedSql = replaceDatetimeFunctions(transformedSql);
  transformedSql = replacePragmaStatements(transformedSql);
  const { sql: finalSql, params: finalParams } = replacePlaceholders(transformedSql, transformedParams);

  return { sql: finalSql, params: finalParams };
}

function replaceDatetimeFunctions(sql: string): string {
  let result = sql;

  result = result.replace(
    /datetime\(\s*'now'\s*,\s*'-?\d+\s*(hour|hours|day|days|week|weeks|month|months|year|years)'\s*\)/gi,
    (_match, unit) => `NOW() - INTERVAL '1 ${unit}'`,
  );

  result = result.replace(/datetime\(\s*'now'\s*\)/gi, 'NOW()');

  result = result.replace(/date\(\s*'now'\s*\)/gi, 'CURRENT_DATE');

  return result;
}

function replacePragmaStatements(sql: string): string {
  if (sql.trim().toUpperCase().startsWith('PRAGMA')) {
    return '-- [PRAGMA stripped for PostgreSQL compatibility]';
  }
  return sql;
}

function replacePlaceholders(sql: string, params: unknown[]): { sql: string; params: unknown[] } {
  let paramIndex = 0;
  const newParams: unknown[] = [];

  const result = sql.replace(/\?/g, () => {
    paramIndex++;
    if (paramIndex <= params.length) {
      newParams.push(params[paramIndex - 1]);
    }
    return `$${paramIndex}`;
  });

  return { sql: result, params: newParams };
}
