import { NextApiRequest, NextApiResponse } from 'next';

export interface ApiError extends Error {
  statusCode?: number;
}

export const handleApiError = (error: unknown, res: NextApiResponse) => {
  console.error('API Error:', error);

  if (error instanceof Error) {
    const statusCode = (error as ApiError).statusCode || 500;
    return res.status(statusCode).json({
      message: error.message || 'Internal server error',
    });
  }

  return res.status(500).json({
    message: 'An unexpected error occurred',
  });
};

export const validateMethod = (req: NextApiRequest, res: NextApiResponse, allowedMethods: string[]) => {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.status(405).json({
      message: `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
    });
    return false;
  }
  return true;
};

export const validateRequiredFields = (body: any, requiredFields: string[]) => {
  const missingFields = requiredFields.filter(field => !body[field]);

  if (missingFields.length > 0) {
    const error = new Error(`Missing required fields: ${missingFields.join(', ')}`) as ApiError;
    error.statusCode = 400;
    throw error;
  }
};

export const withDbConnection = <T extends any[]>(
  handler: (...args: T) => Promise<any>
) => {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    }
  };
};