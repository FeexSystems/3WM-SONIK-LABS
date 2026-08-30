export enum CircuitBreakerState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures before opening
  successThreshold?: number; // Number of successes before closing from half-open
  timeout?: number; // Time in ms before attempting to half-open
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttemptTime: number = 0;

  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;

  constructor(
    private name: string,
    options?: CircuitBreakerOptions
  ) {
    this.failureThreshold = options?.failureThreshold || 3;
    this.successThreshold = options?.successThreshold || 2;
    this.timeout = options?.timeout || 5000;
  }

  async fire<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() > this.nextAttemptTime) {
        this.state = CircuitBreakerState.HALF_OPEN;
        console.log(
          `[CircuitBreaker:${this.name}] State changed to HALF_OPEN. Testing external service.`
        );
      } else {
        throw new Error(
          `CircuitBreaker:${this.name} is OPEN. Request denied to prevent cascading failure.`
        );
      }
    }

    try {
      const response = await operation();
      this.onSuccess();
      return response;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
        console.log(`[CircuitBreaker:${this.name}] State changed to CLOSED. Service restored.`);
      }
    }
  }

  private onFailure(error: Error) {
    this.failureCount++;
    console.warn(
      `[CircuitBreaker:${this.name}] Failure ${this.failureCount}/${this.failureThreshold}: ${error.message}`
    );
    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = Date.now() + this.timeout;
      console.warn(
        `[CircuitBreaker:${this.name}] State changed to OPEN. Will retry after ${this.timeout}ms`
      );
    }
  }
}

// Global instances for external services
export const firebaseBreaker = new CircuitBreaker('Firebase', { timeout: 10000 });
export const geminiBreaker = new CircuitBreaker('GeminiAI', { timeout: 15000 });
export const elevenLabsBreaker = new CircuitBreaker('ElevenLabs', { timeout: 15000 });
