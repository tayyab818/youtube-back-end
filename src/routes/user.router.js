import { Router } from "express";
import {registeruser,loginuser,logoutuser, refreshaccesstoken} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyjwt } from "../middlewares/auth.middleware.js";
 
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registeruser
    )
router.route("/loginuser").post(loginuser)

// secure routes
router.route("/logoutuser").post(verifyjwt,logoutuser)

router.route("/Refreshtoken").post(refreshaccesstoken)

export default router