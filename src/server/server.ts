import {
  Express,
  json,
  NextFunction,
  Request,
  Response,
  urlencoded,
} from 'express';
import http from 'http';
import cors from 'cors';
import coookieSession from 'cookie-session';

import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { expressMiddleware } from '@apollo/server/express4';

import {
  CLIENT_URL,
  NODE_ENV,
  PORT,
  SCRERET_KEY_ONE,
  SCRERET_KEY_TWO,
} from './config';
import logger from './logger';
import { mergedGQLSchema } from '../graphql/schema';
import { GraphQLSchema } from 'graphql';
import { BaseContext } from '@apollo/server';
import { resolvers } from '../graphql/resolvers';

export interface AppContext {
  req: Request;
  res: Response;
}

export default class MonitorServer {
  private app: Express;
  private httpServer: http.Server;
  private apolloServer: ApolloServer;

  constructor(app: Express) {
    this.app = app;
    this.httpServer = new http.Server(app);

    const schema: GraphQLSchema = makeExecutableSchema({
      typeDefs: mergedGQLSchema,
      resolvers,
    });
    this.apolloServer = new ApolloServer<AppContext | BaseContext>({
      schema,
      introspection: NODE_ENV !== 'production',
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),
        NODE_ENV === 'production'
          ? ApolloServerPluginLandingPageDisabled()
          : ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      ],
    });
  }

  async start(): Promise<void> {
    /**
     * Note that you must call the start() method on the ApolloServer
     * instance before passing the instance to expressMiddleware
     */
    await this.apolloServer.start();
    this.standardMiddleware(this.app);
    this.startServer();
  }

  private standardMiddleware(app: Express): void {
    app.set('trust proxy', 1);
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      next();
    });
    app.use(
      coookieSession({
        name: 'session',
        keys: [SCRERET_KEY_ONE, SCRERET_KEY_TWO],
        maxAge: 24 * 7 * 3600000,
        secure: NODE_ENV !== 'development',
        ...(NODE_ENV !== 'development' && { sameSite: 'none' }),
      })
    );
    this.graphqlRoute(app);
    this.healthRoute(app);
  }

  private graphqlRoute(app: Express): void {
    app.use(
      '/graphql',
      cors({
        origin: CLIENT_URL,
        credentials: true,
      }),
      json({ limit: '200mb' }),
      urlencoded({ extended: true, limit: '200mb' }),
      expressMiddleware(this.apolloServer, {
        context: async ({ req, res }: { req: Request; res: Response }) => {
          return { req, res };
        },
      })
    );
  }

  private healthRoute(app: Express): void {
    app.get('/health', (_req: Request, res: Response) => {
      res.status(200).send('Uptimer monitor server is healthy and OK.');
    });
  }

  private async startServer(): Promise<void> {
    try {
      const SERVER_PORT: number = parseInt(PORT!, 10) || 5000;
      logger.info(`Uptimer server has started with process id ${process.pid}`);
      this.httpServer.listen(SERVER_PORT, () => {
        logger.info(`Uptimer server is running on port ${SERVER_PORT}`);
      });
    } catch (error) {
      logger.error('startServer() error method:', error);
    }
  }
}
