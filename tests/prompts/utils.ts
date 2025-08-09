export function createTestPrompt() {
  return [{ id: '1', type: 'text-delta', delta: 'Test prompt' }];
}

export function getResponseChunksByPrompt() {
  return [{ id: '1', type: 'text-delta', delta: 'Test response' }];
}