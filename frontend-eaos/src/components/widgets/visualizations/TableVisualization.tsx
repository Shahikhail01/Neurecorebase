'use client';

import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Card, Title, Text } from '@tremor/react';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
}

export interface TableVisualizationProps {
  title: string;
  subtitle?: string;
  columns: TableColumn[];
  rows: Array<Record<string, string | number | null>>;
  loading?: boolean;
  error?: Error | null;
}

export function TableVisualization({
  title,
  subtitle,
  columns,
  rows,
  loading,
  error,
}: TableVisualizationProps) {
  if (error) {
    return (
      <Card>
        <Text className="text-state-critical">{error.message}</Text>
      </Card>
    );
  }
  return (
    <Card>
      <Title>{title}</Title>
      {subtitle ? (
        <Text className="text-xs text-canvas-500 dark:text-canvas-400">
          {subtitle}
        </Text>
      ) : null}
      {loading ? (
        <p className="mt-4 text-sm text-canvas-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-canvas-500">No rows.</p>
      ) : (
        <Table className="mt-4">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableHeaderCell key={c.key} className={`text-${c.align ?? 'left'}`}>
                  {c.label}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={`text-${c.align ?? 'left'}`}>
                    {r[c.key] === null || r[c.key] === undefined ? '—' : String(r[c.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}