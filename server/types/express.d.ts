// Type definitions for Express Request extensions
import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                username: string;
                role: string;
            };
            requestId?: string;
        }
    }
}

export { };
