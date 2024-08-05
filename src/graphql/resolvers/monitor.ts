import {
  AppContext,
  IMonitorArgs,
  IMonitorDocument,
} from '@app/interfaces/monitor.interface';
import logger from '@app/server/logger';
import {
  createMonitor,
  deleteSingleMonitor,
  toggleMonitor,
  updateSingleMonitor,
} from '@app/services/monitor.service';
import { startSingleJob, stopSingleBackgroundJob } from '@app/utils/jobs';
import { appTimeZone, authenticateGraphQLRoute } from '@app/utils/utils';

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
    async updateMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { monitorId, userId, monitor } = args;
      const monitors: IMonitorDocument[] = await updateSingleMonitor(
        parseInt(`${monitorId}`),
        parseInt(`${userId}`),
        monitor!
      );
      return {
        monitors,
      };
    },
    async deleteMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { monitorId, userId, type } = args;
      await deleteSingleMonitor(
        parseInt(`${monitorId}`),
        parseInt(`${userId}`),
        type!
      );
      return {
        id: monitorId,
      };
    },
  },
};
