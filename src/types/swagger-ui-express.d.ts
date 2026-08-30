declare module 'swagger-ui-express' {
  import { Request, Response, NextFunction } from 'express';

  interface SwaggerOptions {
    explorer?: boolean;
    customCss?: string;
    customJs?: string;
    customSiteTitle?: string;
    swaggerOptions?: any;
  }

  export const serve: (req: Request, res: Response, next: NextFunction) => void;

  export function setup(
    swaggerDoc: any,
    options?: SwaggerOptions
  ): (req: Request, res: Response) => void;
}
