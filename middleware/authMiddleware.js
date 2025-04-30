const jwt =require('jsonwebtoken')

const dotenv =require('dotenv');
dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET;



exports.auth = async (req,res,next) =>{
    try{
        const token = req.headers.authorization.split(" ")[1];
      
        const isCustomAuth = token.length < 500;

        let decodedData;
        decodedData = jwt.verify(token, JWT_SECRET);
   

        if (token && isCustomAuth){
            
            req.userId = decodedData?.userId;
            next();
            
        }else {
            // nothing
        }
        
        // else{
        //     decodedData = jwt.decode(token);

        //     req.userId =decodedData ?.sub;
        // }
        
    } catch (error){
        console.log(error);
    }
}