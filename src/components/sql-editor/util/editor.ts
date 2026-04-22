import _ from 'lodash';
import type { IMatching } from 'syntax-parser';
import Sql from '@/resources/sql';
import type {
  ICursorInfo,
  ITableInfo,
} from '@/components/monaco-editor/sql-parser';

export const pipeKeywords = (
  keywords: IMatching[] = [],
): any[] => {
  const pre = keywords
    ?.filter((matching) => {
      return matching.type === 'string';
    })
    ?.map((matching) => {
      const value = /[a-zA-Z]+/.test(matching.value.toString())
        ? _.upperCase(matching.value.toString())
        : matching.value.toString();

      return {
        label: value,
        insertText: value,
        kind: 17,
      };
    });

  return pre;
};

const fetchDbList = async (dataSourceId: string) => {
  const {
    data: { body },
  } = await Sql.getDatabaseList({
    params: {
      dataSourceId,
      environmentType: "PROD",
    },
    hideLoading: true,
  });

  return body;
};

export const onSuggestFieldGroup = (tableNameOrAlias: string) => {
  return {
    label: tableNameOrAlias,
    insertText: tableNameOrAlias,
    kind: 23,
  };
};

const fetchTableList = async (dataSourceId: string, dbName: string, tableName: string) => {
  if (!dataSourceId || !dbName) {
    return [];
  }

  const {
    data: { body },
  } = await Sql.getTableList({
    params: {
      dataSourceId,
      databaseName: dbName,
      keyword: tableName,
      environmentType: dbName.includes('_dev') ? "DEV" : "PROD",
    },
    hideLoading: true,
  });

  return body;
};

const fetchColumnList = async (props: any, db: string, table: string) => {
  if (!table) {
    return [];
  }

  const {
    data: { body },
  } = await Sql.getColumnList({
    params: {
      dataSourceId: props.dataSourceId,
      database: db,
      table,
    },
    hideLoading: true,
  });

  return body;
};

export const onSuggestTableFields = async (cursorInfo: any, props: any) => {
  const { namespace, tableName } = cursorInfo;
  const data = await fetchColumnList(
    props,
    namespace?.value || props.curSqlParams?.database,
    tableName?.value,
  );

  return data.map(({ name }: any) => ({
    label: name,
    insertText: name,
    kind: 9,
    detail: 'column',
    weight: 100,
  }));
};

const fetchFunctionList = async (props: any) => {
  if (!props.dataSourceId || !props.engine) {
    return [];
  }

  const {
    data: { body },
  } = await Sql.getFunctions({
    params: {
      dataSourceId: props.dataSourceId,
      engine: props.engine,
    },
    hideLoading: true,
  });

  return body;
};

export const onSuggestFunctionName = async (props: any) => {
  const data = await fetchFunctionList(props);

  return data.map(({ functionName, comment }: any) => ({
    label: functionName,
    insertText: functionName,
    kind: 3,
    detail: comment || 'function',
    weight: 2,
  }));
};

export const onSuggestTableNames = async (
  cursorInfo: ICursorInfo<ITableInfo>,
  props: any,
) => {
  const name = cursorInfo?.namespace?.value || props.curSqlParams?.database;
  const tableName = cursorInfo?.tableName?.value;
  const dbList = props?.databaseOptions?.map((name: string) => ({
    label: name,
    insertText: name,
    kind: 23,
    detail: 'database',
  }));
  if (name) {
    const data = await fetchTableList(props.dataSourceId, name, tableName);
    if (data.length === 0) {
      return dbList;
    }

    return data[0].tableItems
      .map(({ tableName }: any) => ({
        label: tableName,
        insertText: tableName,
        kind: 6,
        detail: '表',
      }))
      .concat(dbList);
  } else {
    let dbList = props?.databaseOptions;
    if (props?.databaseOptions.length === 0) {
      dbList = await fetchDbList(props.dataSourceId);
    }

    return dbList.map((item: any) => ({
      label: item.name,
      insertText: item.name,
      kind: 23,
      detail: '库',
    }));
  }
};
