declare module 'swagger-jsdoc' {
  interface Options {
    definition?: Record<string, unknown>;
    swaggerDefinition?: Record<string, unknown>;
    apis?: string[];
    [key: string]: unknown;
  }

  function swaggerJsdoc(options: Options): Record<string, unknown>;

  export default swaggerJsdoc;
  export type { Options };
}
