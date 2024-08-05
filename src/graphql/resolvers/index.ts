import { monitorResolver } from './monitor';
import { NotificationResolver } from './notification';
import { UserResolver } from './user';

export const resolvers = [UserResolver, NotificationResolver, monitorResolver];
