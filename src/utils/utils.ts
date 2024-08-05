import { Request } from 'express';
import { GraphQLError } from 'graphql';
import { IAuthPayload } from '../interfaces/user.interface';
import { JWT_TOKEN } from '../server/config';
import { verify } from 'jsonwebtoken';

export const appTimeZone: string =
  Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Check if a string is an email
 * @param email
 * @returns {boolean}
 */
export const isEmail = (email: string): boolean => {
  const regexExp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
  return regexExp.test(email);
};

/**
 * Authenticate a user for a GraphQL route
 * @param req
 */
export const authenticateGraphQLRoute = (req: Request): void => {
  if (!req.session?.jwt) {
    throw new GraphQLError('Not authenticated');
  }

  try {
    const payload: IAuthPayload = verify(
      req.session?.jwt,
      JWT_TOKEN
    ) as IAuthPayload;
    req.currentUser = payload;
  } catch (error) {
    throw new GraphQLError('Not authenticated');
  }
};
