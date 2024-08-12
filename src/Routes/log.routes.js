import Router from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getlog } from "../controllers/log.controller.js";

const router=Router({})
router.use(verifyJWT);
router.route("/getlog").post(getlog);

export default Router;