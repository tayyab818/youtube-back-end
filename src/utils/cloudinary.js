import {v2 as Cloudinary} from "cloudinary"
import fs from "fs"
 

Cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    const uploadoncloudinary= async(filepath)=>{
   try {
     if(!filepath) return null
    // upload  on cloudinary 
    const response = await Cloudinary.uploader.upload(filepath,{
        resource_type:"auto"
    })
  fs.unlinkSync(filepath)
    return response
   } catch (error) {
    fs.unlinkSync(filepath)
   }
    }


    export default uploadoncloudinary