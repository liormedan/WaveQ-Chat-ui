import type { 
    PythonRequest, 
    PythonResponse, 
    PythonEngineConfig 
} from '../types/python';
import { audioChatConfig } from '../config/audio-chat';

export class PythonEngineClient {
    private ws: WebSocket | null = null;
    private config: PythonEngineConfig;
    private requestQueue = new Map<string, {
        resolve: (value: PythonResponse) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
    }>();

    constructor(config?: Partial<PythonEngineConfig>) {
        this.config = {
            ...audioChatConfig.pythonEngine,
            ...config
        };
    }

    async connect(): Promise<void> {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.config.endpoint);

                const connectionTimeout = setTimeout(() => {
                    this.ws?.close();
                    reject(new Error('Connection timeout'));
                }, this.config.timeout);

                this.ws.onopen = () => {
                    clearTimeout(connectionTimeout);
                    console.log('Connected to Python engine');
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };

                this.ws.onclose = () => {
                    clearTimeout(connectionTimeout);
                    console.log('Python engine connection closed');
                };

                this.ws.onerror = (error) => {
                    clearTimeout(connectionTimeout);
                    console.error('Python engine WebSocket error:', error);
                    reject(new Error('WebSocket connection failed'));
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    async sendRequest(request: PythonRequest): Promise<PythonResponse> {
        await this.connect();

        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            const timeout = setTimeout(() => {
                this.requestQueue.delete(request.id);
                reject(new Error(`Request timeout after ${this.config.timeout}ms`));
            }, this.config.timeout);

            this.requestQueue.set(request.id, {
                resolve,
                reject,
                timeout
            });

            try {
                this.ws.send(JSON.stringify(request));
            } catch (error) {
                this.requestQueue.delete(request.id);
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const response: PythonResponse = JSON.parse(event.data);
            
            const requestHandler = this.requestQueue.get(response.id);
            if (requestHandler) {
                clearTimeout(requestHandler.timeout);
                this.requestQueue.delete(response.id);
                
                if (response.status === 'error') {
                    requestHandler.reject(new Error(response.error || 'Unknown error'));
                } else {
                    requestHandler.resolve(response);
                }
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        for (const [id, handler] of this.requestQueue.entries()) {
            clearTimeout(handler.timeout);
            handler.reject(new Error('Client disconnected'));
        }
        this.requestQueue.clear();
    }
}

export const pythonEngineClient = new PythonEngineClient();