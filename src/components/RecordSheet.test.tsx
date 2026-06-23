import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecordSheetProvider, useRecordSheet } from './RecordSheet';

function Harness() {
  const { open } = useRecordSheet();
  return <button onClick={() => open('child-1')}>open</button>;
}

describe('RecordSheet', () => {
  it('打开后填身高+体重,提交合并到同一天', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ record: { id: 'r1' } }), { status: 200 }),
    );
    render(
      <RecordSheetProvider>
        <Harness />
      </RecordSheetProvider>,
    );
    fireEvent.click(screen.getByText('open'));
    // open() 会先 GET 最近记录;等它完成、预填稳定后再交互
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('身高'), { target: { value: '115.2' } });
    fireEvent.change(screen.getByLabelText('体重'), { target: { value: '21.5' } });
    fireEvent.click(screen.getByText(/保存/));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2)); // open GET + save POST
    const saveCall = (
      fetchMock.mock.calls as unknown as [string, RequestInit | undefined][]
    ).find(([, init]) => init?.method === 'POST');
    const body = JSON.parse((saveCall![1]!.body as string));
    expect(body).toMatchObject({ childId: 'child-1', height: 115.2, weight: 21.5 });
    fetchMock.mockRestore();
  });
});
