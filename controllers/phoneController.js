require('dotenv').config();
const mainUrl = 'https://quivlent.com'


//AFRICAS TALKING ================================================================================

// Set your app credentials
const credentials = {

    apiKey: process.env.AFRICAS_TALKING_API_KEY,
    username: 'quivlent',
    
}

// Initialize the SDK
const AfricasTalking = require('africastalking')(credentials);

// Get the SMS service
const sms = AfricasTalking.SMS;

exports.sendSms = async(urlPath, receiver) => {

  

    const options = {
        // Set the numbers you want to send to in international format
        to: [receiver],
        // Set your message
        message:`Quivlent Verify Click: ${mainUrl}/${urlPath}`,
        // Set your shortCode or senderId
        //from: 'XXYYZZ'
    }

    try {
        // Await the send SMS operation
        const response = await sms.send(options);
        console.log('SMS sent successfully:', response?.SMSMessageData?.Recipients);
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
}


//TWILIO ================================================================================


// const twilioAccSid = process.env.TWILIO_ACC_SID
// const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
// const twilioNumber = '+16674018163'


// const twilio = require('twilio')(twilioAccSid, twilioAuthToken);

//     exports.sendSms = async (urlPath, receiver) => {

       
//         try {
//         const message = await twilio.messages.create({
//             body: `Quivlent Verify Click: ${mainUrl}/${urlPath}`,
//             from: twilioNumber,  // Your Twilio trial number
//             to: receiver          // Recipient's Kenyan number
//         });
//         console.log('Message sent successfully:', message.sid);  // Log the message SID for confirmation
//         } catch (err) {
//         console.error('Error sending SMS:', err);  // Enhanced error logging
//         }
//     };
  
