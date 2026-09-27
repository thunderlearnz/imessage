const checkUser = async(req,res)=>{

    const userPayload = req.user;
    return res.status(200).json({
        success: true,
        data: userPayload
    })

}


export {checkUser}