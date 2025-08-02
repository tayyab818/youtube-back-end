import { asyncHandler } from "../utils/Asynchandler.js";
import ApiError from "../utils/apierror.js";
import { User } from "../models/user.models.js";
import ApiResponse from "../utils/apiresponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import apierror from "../utils/apierror.js";
import jwt from "jsonwebtoken"
import apiresponse from "../utils/apiresponse.js";

const generateaccessandrefresstoken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const Accesstoken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshtoken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { Accesstoken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "while creating refresh token error occurred");
  }
};

const registeruser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
  );
});

const loginuser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  console.log(email, username, password);

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (!user) {
    throw new ApiError(400, "User not found");
  }

  const passwordcheck = await user.isPasswordCorrect(password);
  if (!passwordcheck) {
    throw new ApiError(400, "Email or password is incorrect");
  }

  const { refreshToken, Accesstoken } = await generateaccessandrefresstoken(user._id);
  const loginUser = await User.findById(user._id).select("-password -refreshToken");

  const option = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, option)
    .cookie("Accesstoken", Accesstoken, option)
    .json(new ApiResponse(200, { user: loginUser, refreshToken, Accesstoken }, "User login successful"));
});

const logoutuser = asyncHandler(async (req, res) => {
  // 1. Ensure req.user._id exists (comes from verifyJWT middleware)
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized or missing user data");
  }

  // 2. Clear refreshToken from database
  await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshtoken: undefined }
  }, { new: true });

  // 3. Clear cookies
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None" // ✅ Important if you're using cross-origin cookies
  };

  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("Accesstoken", options)
    .json(new ApiResponse(200, {}, "User logout successful"));
});
const refreshaccesstoken =asyncHandler(async(req,res)=>{
    const incomingrefreshtoken =req.cookies.refreshToken || req.body.refreshToken
    if (!incomingrefreshtoken) {
        new apierror(404,"unauthorize request ")
    }
    const decodedjwt =jwt.verify(incomingrefreshtoken,process.env.REFRESH_TOKEN_SECRET)
    const user =await User.findById(decodedjwt?._id)
    if (!user) {
        new apierror(404,"user not found  ")
    }
    if (incomingrefreshtoken !== user.refreshToken) {
        new apierror(400,"refresh token is expire or used ")
    }
     const option = {
    httpOnly: true,
    secure: true
  };
    const {Accesstoken,newrefreshToken}=generateaccessandrefresstoken(user._id)
    return res.status(200)
    .cookie("Accesstoken",Accesstoken,option)
    .cookie("Refreshtoken",newrefreshToken,option)
    .json(new apiresponse(200,{Accesstoken, refreshtoken:newrefreshToken},"user data refresh"))


})
const changeyourpassword=asyncHandler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body
    const user= await User.findById(req.user?._id)
    const ispasswordcorrect=user.isPasswordCorrect(oldpassword)
    if (!ispasswordcorrect){
        throw new apierror(400,"invalid old password ")
    }
      user.password = newpassword
       await user.save({validateBeforeSave:false})
       return res.status(200).json(new apiresponse(200,{},"password change successfully"))

})
const currentuser=asyncHandler(async(req,res)=>{
    return res.status(200).json(new apiresponse(200,{userdata:req.user._id},"user data fetch success fully"))
})
const updateuserdetail=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body
    if (!fullname || !email) {
        throw new apierror(404,"fullname and email required")
    }
    const user=User.findByIdAndUpdate(req.user?._id,{$set:{fullname,email}},{new:true}).select("-password")
    return res.status(200).json(new apiresponse(200,{user},"User detail updated"))
})
const updateuseravatar=asyncHandler(async(req,res)=>{
    const avatarlocalpath=req.file?.poth
    if (!avatarlocalpath) {
        throw new apierror(400,"avatar could not upload ")
    }
   const avatar= await uploadOnCloudinary(avatarlocalpath)
   if (!avatar.url) {
    throw new apierror(400,"avatar could not upload on cloudinary  ")
   }
    const user =await User.findByIdAndUpdate(req.user._id,{$set:{
        avatar:avatar.url
    }},{new:true}).select("-password")
    
    return res.status(200).json(new apiresponse(200,{user:user},"user avatar update successfully"))
  
})
const updateusercoverimage=asyncHandler(async(req,res)=>{
    const coverimagelocalpath=req.file?.poth
    if (!coverimagelocalpath) {
        throw new apierror(400,"cover image  could not upload ")
    }
   const coverimage= await uploadOnCloudinary(coverimagelocalpath)
   if (!coverimage.url) {
    throw new apierror(400,"cover image  could not upload on cloudinary  ")
   }
    const user =await User.findByIdAndUpdate(req.user._id,{$set:{
        coverimage:coverimage.url
    }},{new:true}).select("-password")
    
    return res.status(200).json(new apiresponse(200,{user:user},"user cover image  update successfully"))
  
})
const userchannalprofile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new apierror(400, "Username is not available");
  }

  const channal = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "channal",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriberto"
      }
    },
    {
      $addFields: {
        subscribercount: { $size: "$subscribers" },
        channalsubscribercount: { $size: "$subscriberto" },
        issubscribe: {
          $in: [req.user?._id, "$subscribers.subscriber"]
        }
      }
    },
    {
      $project: {
        username: 1,
        fullname: 1,
        email: 1,
        avatar: 1,
        coverimage: 1,
        issubscribe: 1,
        channalsubscribercount: 1,
        subscribercount: 1
      }
    }
  ]);

  if (!channal[0]) {
    throw new apierror(404, "User not found");
  }

  res.status(200).json(
    new apiresponse(200, channal[0], "User channel page data fetched successfully")
  );
});

export { registeruser, loginuser, logoutuser ,refreshaccesstoken,changeyourpassword,currentuser
    ,updateuserdetail,updateuseravatar,updateusercoverimage,userchannalprofile };
