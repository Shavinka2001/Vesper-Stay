export interface AppConfig {
  app: {
    nodeEnv: string;
    port: number;
    apiPrefix: string;
    corsOrigin: boolean | string | string[];
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}
