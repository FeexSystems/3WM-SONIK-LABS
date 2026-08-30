export interface ProviderAdapter<TRequest, TResponse> {
  id: string;
  name: string;
  execute(request: TRequest): Promise<TResponse>;
  checkHealth?(): Promise<boolean>;
}

export abstract class BaseProviderAdapter<TRequest, TResponse> implements ProviderAdapter<
  TRequest,
  TResponse
> {
  constructor(
    public id: string,
    public name: string
  ) {}

  abstract execute(request: TRequest): Promise<TResponse>;

  async checkHealth(): Promise<boolean> {
    return true;
  }
}
