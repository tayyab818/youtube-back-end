import jwt from "jsonwebtoken";
import apierror from "../utils/apierror.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/Asynchandler.js";

export const verifyjwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.Accesstoken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apierror(400, "Unauthorized request - token missing");
     
    }
 
    const decodedjwt = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  

    const user = await User.findById(decodedjwt?._id).select("-password -refreshtoken");
   

    if (!user) {
      throw new apierror(404, "Invalid access token - user not found");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new apierror(401, error?.message || "Invalid or expired access token");
  }
});
