import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ErrorResponseSchema } from "../schemas";

export const validate = (schema: z.ZodObject<z.ZodRawShape>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse = ErrorResponseSchema.parse({
          error: "Validation failed",
          details: error.issues.map(err => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
        res.status(400).json(errorResponse);
        return;
      }
      next(error);
    }
  };
};
