export interface PythonCode {
  id: string;
  code: string;
  content: string;
  language: 'python';
  filename?: string;
  description?: string;
  status?: 'pending' | 'running' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}