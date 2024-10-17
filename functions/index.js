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

  exports.convertToUnixTime = (dateString) => {
    // Check if the input is already a numeric string and convert it to a number
    if (!isNaN(dateString)) {
      return Number(dateString); // Convert to number if it's a numeric string
    }
  
    const dateObj = new Date(dateString);
    return Math.floor(dateObj.getTime() / 1000); // Return the Unix timestamp
  };



 exports.generateRandomString = (length) =>{
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

exports.generateUsernameFromEmail = (email) => {
    const [username] = email.split('@'); // Get the part before '@'
    const randomCode = exports.generateRandomString(6); // Change the number to adjust the length of the random code
    return `${username}${randomCode}`; // Combine username and random code
}




 