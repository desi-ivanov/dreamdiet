import * as functions from "firebase-functions";
import { AuthData, CallableRequest } from "firebase-functions/lib/common/providers/https";

export const withAuth = <T = any, U = any>(f: (req: CallableRequest<T> & { auth: AuthData }) => U) => {
  return (req: CallableRequest<T>) => {
    if (!req.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User is not authenticated");
    }
    return f(req as CallableRequest<T> & { auth: AuthData });
  };
};
