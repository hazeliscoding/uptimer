import {
  AppContext,
  IMonitorArgs,
  IMonitorDocument,
} from '../../interfaces/monitor.interface';
import logger from '../../server/logger';
import { createMonitor, toggleMonitor } from '../../services/monitor.service';
import { startSingleJob, stopSingleBackgroundJob } from '../../utils/jobs';
import { appTimeZone, authenticateGraphQLRoute } from '../../utils/utils';

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
        startSingleJob(body.name, appTimeZone, 10, () => {
          logger.info('This is callled every 10 seconds');
        });
      }

      return {
        monitors: [monitor],
      };
    },
    async toggleMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { monitorId, userId, name, active } = args.monitor!;
      const results: IMonitorDocument[] = await toggleMonitor(
        monitorId!,
        userId,
        active as boolean
      );
      if (!active) {
        logger;
        stopSingleBackgroundJob(name, monitorId!);
      } else {
        // TODO: Add a resume method here
        logger.info(`Resume monitor`);
        startSingleJob(name, appTimeZone, 10, () => {
          logger.info('Resumed after 10 seconds');
        });
      }

      return {
        monitors: results,
      };
    },
  },
};
