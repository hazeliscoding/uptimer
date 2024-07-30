import { Sequelize } from 'sequelize';
import { POSTGRES_DB } from './config';

export const sequelize: Sequelize = new Sequelize(POSTGRES_DB, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    multipleStatements: true,
  },
});

export async function databaseConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
