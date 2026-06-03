import { setupServer } from 'msw/node';
import { authHandlers } from './handlers/auth';
import { medicalHandlers } from './handlers/medical';

export const server = setupServer(...authHandlers, ...medicalHandlers);
