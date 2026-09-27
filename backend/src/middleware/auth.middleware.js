import { getAuth } from "@clerk/express";
import User from "../models/User.model.js";

const protectRoute = async(req,res,next)=>{


    try{

const {userId} = getAuth(req);

if(!userId){

        return res.status(401).send("unauthorised access");
}

// if there is a user

    const user = await User.findOne({clerkId : userId});
    if(!user){
        return res.status(404).send("user not found");
    }

    req.user = user;

    next();

    }
    catch(err){
        console.log("error", err);

        return res.status(500).send("auth middleware error");
    }

}

export {protectRoute}