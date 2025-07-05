const API_BASE_URL = 'https://humanize.undetectable.ai';
const DETECTOR_API_BASE_URL = 'https://ai-detect.undetectable.ai';
const API_KEY = 'ae11d4c0-2975-414a-b930-ec5000402ac2';

export interface HumanizeRequest {
  content: string;
  readability: 'High School' | 'University' | 'Doctorate' | 'Journalist' | 'Marketing';
  purpose: 'General Writing' | 'Essay' | 'Article' | 'Marketing Material' | 'Story' | 'Cover Letter' | 'Report' | 'Business Material' | 'Legal Material';
  strength?: 'Quality' | 'Balanced' | 'More Human';
  model?: 'v2' | 'v11';
  id?: string; // For streaming support
}

export interface HumanizeResponse {
  status: string;
  id: string;
}

export interface DocumentResponse {
  id: string;
  output: string;
  input: string;
  readability: string;
  createdDate: string;
  purpose: string;
}

export interface ListDocumentsResponse {
  pagination: boolean;
  documents: DocumentResponse[];
}

export interface UserCredits {
  baseCredits: number;
  boostCredits: number;
  credits: number;
}

export interface HandoverResponse {
  content: string;
  id: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

// Detector API interfaces
export interface DetectorRequest {
  text: string;
  model?: string;
  retry_count?: number;
}

export interface DetectorResponse {
  id: string;
  input: string;
  model: string;
  result: number | null;
  result_details: {
    scoreGptZero: number;
    scoreOpenAI: number;
    scoreWriter: number;
    scoreCrossPlag: number;
    scoreCopyLeaks: number;
    scoreSapling: number;
    scoreContentAtScale: number;
    scoreZeroGPT: number;
    human: number;
  } | null;
  status: 'pending' | 'done' | 'failed';
  retry_count: number;
}

export interface DetectorCredits {
  baseCredits: number;
  boostCredits: number;
  credits: number;
}

// WebSocket event types
export interface WebSocketEvent {
  event_type: 'document_watch' | 'document_id' | 'document_chunk' | 'document_done' | 'document_error' | 'document_halt';
  api_key?: string;
  document_id?: string;
  success?: boolean;
  model?: string;
  chunk?: string;
  error_code?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API request failed: ${error.message}`);
      }
      throw new Error('API request failed: Unknown error');
    }
  }

  async submitDocument(request: HumanizeRequest): Promise<HumanizeResponse> {
    return this.request<HumanizeResponse>('/submit', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getDocument(id: string): Promise<DocumentResponse> {
    return this.request<DocumentResponse>('/document', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  }

  async rehumanizeDocument(id: string): Promise<HumanizeResponse> {
    return this.request<HumanizeResponse>('/rehumanize', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  }

  async listDocuments(offset?: number): Promise<ListDocumentsResponse> {
    const body = offset ? { offset } : {};
    return this.request<ListDocumentsResponse>('/list', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getAllDocuments(): Promise<DocumentResponse[]> {
    let allDocuments: DocumentResponse[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await this.listDocuments(offset);
      allDocuments = [...allDocuments, ...response.documents];
      
      if (response.pagination) {
        offset += 10;
      } else {
        hasMore = false;
      }
    }

    return allDocuments;
  }

  async getUserCredits(): Promise<UserCredits> {
    return this.request<UserCredits>('/check-user-credits', {
      method: 'GET',
    });
  }

  async handoverDocument(content: string): Promise<HandoverResponse> {
    return this.request<HandoverResponse>('/handover', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // WebSocket streaming support
  createWebSocketConnection(userId: string): WebSocket {
    const wsUrl = `wss://humanize.undetectable.ai/ws/${userId}`;
    return new WebSocket(wsUrl);
  }

  sendWebSocketMessage(ws: WebSocket, message: WebSocketEvent): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Detector API methods
  async submitDetection(request: DetectorRequest): Promise<DetectorResponse> {
    const url = `${DETECTOR_API_BASE_URL}/detect`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: request.text,
        key: this.apiKey,
        model: request.model || 'xlm_ud_detector',
        retry_count: request.retry_count || 0,
      }),
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Detector API request failed: ${error.message}`);
      }
      throw new Error('Detector API request failed: Unknown error');
    }
  }

  async queryDetection(id: string): Promise<DetectorResponse> {
    const url = `${DETECTOR_API_BASE_URL}/query`;
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Detector query failed: ${error.message}`);
      }
      throw new Error('Detector query failed: Unknown error');
    }
  }

  async getDetectorCredits(): Promise<DetectorCredits> {
    const url = `${DETECTOR_API_BASE_URL}/check-user-credits`;
    const config: RequestInit = {
      method: 'GET',
      headers: {
        'apikey': this.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Detector credits check failed: ${error.message}`);
      }
      throw new Error('Detector credits check failed: Unknown error');
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL, API_KEY);

// Enhanced streaming class for WebSocket support
export class StreamingClient {
  private ws: WebSocket | null = null;
  private documentId: string | null = null;
  private onChunk: ((chunk: string) => void) | null = null;
  private onComplete: ((fullText: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private fullText: string = '';

  constructor(private userId: string) {}

  async startStreaming(
    request: HumanizeRequest,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    this.onChunk = onChunk;
    this.onComplete = onComplete;
    this.onError = onError;
    this.fullText = '';

    try {
      // Create WebSocket connection
      this.ws = apiClient.createWebSocketConnection(this.userId);

      this.ws.onopen = () => {
        // Send document_watch request
        apiClient.sendWebSocketMessage(this.ws!, {
          event_type: 'document_watch',
          api_key: API_KEY,
        });
      };

      this.ws.onmessage = async (event) => {
        const data: WebSocketEvent = JSON.parse(event.data);
        
        switch (data.event_type) {
          case 'document_id':
            if (data.success && data.document_id) {
              this.documentId = data.document_id;
              // Submit document for processing
              await apiClient.submitDocument({
                ...request,
                id: data.document_id,
              });
            }
            break;
            
          case 'document_chunk':
            if (data.chunk) {
              this.fullText += data.chunk;
              this.onChunk?.(data.chunk);
            }
            break;
            
          case 'document_done':
            if (data.chunk) {
              this.fullText += data.chunk;
            }
            this.onComplete?.(this.fullText);
            this.disconnect();
            break;
            
          case 'document_error':
            const errorMessage = data.message || 'Unknown streaming error';
            this.onError?.(errorMessage);
            this.disconnect();
            break;
        }
      };

      this.ws.onerror = () => {
        this.onError?.('WebSocket connection error');
        this.disconnect();
      };

      this.ws.onclose = () => {
        this.disconnect();
      };

    } catch (error) {
      this.onError?.(error instanceof Error ? error.message : 'Failed to start streaming');
    }
  }

  stopStreaming(): void {
    if (this.ws && this.documentId) {
      apiClient.sendWebSocketMessage(this.ws, {
        event_type: 'document_halt',
        document_id: this.documentId,
      });
    }
    this.disconnect();
  }

  private disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.documentId = null;
  }
}

// Helper function to poll for document completion
export async function pollForDocument(
  id: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<DocumentResponse> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const document = await apiClient.getDocument(id);
      
      // Check if document has output (processing complete)
      if (document.output && document.output.trim() !== '') {
        return document;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;
    } catch (error) {
      if (attempts === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;
    }
  }
  
  throw new Error('Document processing timed out');
}

// Helper function to poll for detector result
export async function pollForDetection(
  id: string,
  maxAttempts: number = 30,
  initialIntervalMs: number = 2000
): Promise<DetectorResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const detection = await apiClient.queryDetection(id);
      
      if (detection.status === 'done') {
        return detection;
      }
      
      if (detection.status === 'failed') {
        throw new Error('Detection processing failed');
      }
      
      // Wait before next attempt with exponential backoff
      const waitTime = Math.min(initialIntervalMs * Math.pow(1.5, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Detection processing failed or timed out');
}

// Helper function to validate text length
export function validateTextLength(text: string): boolean {
  return text.trim().length >= 50;
}

// Helper function to format error messages
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

// Helper function to generate handover URL
export function generateHandoverUrl(handoverId: string): string {
  return `https://undetectable.ai/detector-humanizer?handoverId=${handoverId}`;
} 