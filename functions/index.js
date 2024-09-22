exports.generateOtp =async(length)=> {
    // const min = 10000; 
    // const max = 99999; 
    // return Math.floor(Math.random() * (max - min + 1)) + min;

    //Ls Is 0s and os removed due to confusion
    const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ123456789';
      let randomString = '';

      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
      }

      return randomString;

  }

exports.tokenVerifier = async(tok)=>{
    try{
    
      const decodedTok = await jwt.verify(tok, jwtSecretKey);
      console.log({decodedTok});
      return decodedTok
    
    }catch(error){

      //console.log(error?.message);

      return null

    }
   
  }

  exports.tokenOtpVerifier = async(tok, otp)=>{
    try{
    
      const decodedTok = await jwt.verify(tok, jwtSecretKey);
      console.log({decodedTok});
      const {otpNumber} = decodedTok;
      if (otpNumber === otp){
        return decodedTok
      }else{
        return null
      }
    }catch(error){

      //console.log(error?.message);

      return null

    }
   
  }

 