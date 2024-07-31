import { GraphQLError } from 'graphql';
import { toUpper, upperFirst } from 'lodash';
import { sign } from 'jsonwebtoken';

import { IUserDocument, IUserResponse } from '../../interfaces/user.interface';
import { AppContext } from '../../server/server';
import {
  createNewUser,
  getUserByUsernameOrEmail,
} from '../../services/user.service';
import { INotificationDocument } from '../../interfaces/notification.interface';
import {
  createNotificationGroup,
  getAllNotificationGroups,
} from '../../services/notification.service';
import { JWT_TOKEN } from '../../server/config';
import { Request } from 'express';

export const UserResolver = {
  Mutation: {
    async registerUser(
      _: undefined,
      args: { user: IUserDocument },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      const { user } = args;

      // TODO: Add data validation
      const { username, email, password } = user;
      const checkIfUserExist: IUserDocument | undefined =
        await getUserByUsernameOrEmail(username!, email!);
      if (checkIfUserExist) {
        throw new GraphQLError('Invalid credentials. Email or username.');
      }

      const authData: IUserDocument = {
        username: upperFirst(username),
        email: toUpper(email),
        password,
      } as IUserDocument;

      const result: IUserDocument = await createNewUser(authData);
      const response: IUserResponse = await userReturnValue(
        req,
        result,
        'register'
      );

      return response;
    },
  },
  User: {
    createdAt: (user: IUserDocument) => new Date(user.createdAt!).toISOString(),
  },
};

async function userReturnValue(
  req: Request,
  result: IUserDocument,
  type: string
): Promise<IUserResponse> {
  let notifications: INotificationDocument[] = [];
  if (type === 'register' && result && result.id && result.email) {
    const notification = await createNotificationGroup({
      userId: result.id,
      groupName: 'Default Contact Group',
      emails: JSON.stringify([result.email]),
    });
    notifications.push(notification);
  } else if (type === 'login' && result && result.id && result.email) {
    notifications = await getAllNotificationGroups(result.id);
  }

  const userJwt: string = sign(
    {
      id: result.id,
      email: result.email,
      username: result.username,
    },
    JWT_TOKEN
  );

  req.session = { jwt: userJwt, enableAutomaticRefresh: false };
  const user: IUserDocument = {
    id: result.id,
    username: result.username,
    email: result.email,
    createdAt: result.createdAt,
  } as IUserDocument;

  return { user, notifications };
}
