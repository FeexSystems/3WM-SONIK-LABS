import express, { Express, Router } from 'express';
import cors from 'cors';

export function createTestApp(router: Router, path: string = '/api/v1'): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(path, router);

  return app;
}
