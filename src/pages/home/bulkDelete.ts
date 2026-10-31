/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

export type BulkDeleteResult<T> = {
  deleted: T[];
  failed: T[];
};

/**
 * Runs every delete and reports which items succeeded and which failed,
 * so one failed delete never hides the others.
 */
export async function bulkDelete<T>(
  items: T[],
  remove: (item: T) => Promise<unknown>,
): Promise<BulkDeleteResult<T>> {
  const results = await Promise.allSettled(items.map((item) => remove(item)));
  const deleted: T[] = [];
  const failed: T[] = [];
  results.forEach((result, index) => {
    (result.status === 'fulfilled' ? deleted : failed).push(items[index]);
  });
  return {deleted, failed};
}

export function bulkDeleteFailureMessage(failed: number, total: number): string {
  return failed === total
    ? `Could not delete ${failed === 1 ? 'the expense' : `${failed} expenses`}`
    : `Deleted ${total - failed} of ${total}. ${failed} could not be deleted`;
}
