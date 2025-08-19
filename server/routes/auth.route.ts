import { Router } from "express";
import { login } from "server/controller/auth.controller";

export function registerAuthRoutes(router: Router) {
  const authRouter = Router();

  authRouter.post("/auth/login", login);

  router.use("/admin", authRouter);
}
