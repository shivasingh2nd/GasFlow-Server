declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: number; // Only present for regular users (not admin)
        role: "ADMIN" | "USER";
        email: string;
        name?: string;
      };
    }
  }
}

export {};
