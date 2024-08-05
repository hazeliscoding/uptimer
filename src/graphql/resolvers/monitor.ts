import {
  AppContext,
  IMonitorArgs,
  IMonitorDocument,
} from '../../interfaces/monitor.interface';
import logger from '../../server/logger';
import { createMonitor } from '../../services/monitor.service';
import { authenticateGraphQLRoute } from '../../utils/utils';

export const monitorResolver = {
  Mutation: {
    async createMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const body: IMonitorDocument = args.monitor!;
      const monitor: IMonitorDocument = await createMonitor(body);
      if (body.active && monitor?.active) {
        // TODO: Start created monitor
        logger.info(`Monitor ${monitor.id} started`);
      }

      return {
        monitors: [monitor],
      };
    },
  },
};
