import {bulkDelete, bulkDeleteFailureMessage} from './bulkDelete';

describe('bulkDelete', () => {
  it('keeps going when one delete rejects and reports it', async () => {
    const remove = vi.fn((id: string) => (id === 'b' ? Promise.reject(new Error('nope')) : Promise.resolve(true)));
    const result = await bulkDelete(['a', 'b', 'c'], remove);
    expect(remove).toHaveBeenCalledTimes(3);
    expect(result.deleted).toEqual(['a', 'c']);
    expect(result.failed).toEqual(['b']);
  });

  it('reports all deleted when none fail', async () => {
    const result = await bulkDelete(['a'], () => Promise.resolve());
    expect(result).toEqual({deleted: ['a'], failed: []});
  });

  it('builds partial and total failure messages', () => {
    expect(bulkDeleteFailureMessage(1, 3)).toBe('Deleted 2 of 3. 1 could not be deleted');
    expect(bulkDeleteFailureMessage(2, 2)).toBe('Could not delete 2 expenses');
    expect(bulkDeleteFailureMessage(1, 1)).toBe('Could not delete the expense');
  });
});
