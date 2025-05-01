const OpenAI = require("openai");


require('dotenv').config();
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;


const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: deepseekApiKey
});



exports.commentsSummaryAI = async (postCaption, commentsArr) => {

    if (!postCaption || !commentsArr || postCaption.length === 0 || commentsArr.length === 0) {
        return '';
      }

    try {
      // Call DeepSeek API for chat completion
      const completion = await openai.chat.completions.create({
        model: "deepseek-chat", // Specify the DeepSeek model
        messages: [
            {
              role: "system",
              content: "Analyze post comments and summarize user sentiment and themes.",
            },
            {
              role: "user",
              content: `Caption: "${postCaption}". Summarize comments:\n${commentsArr.join("\n")}`,
            },
          ]
        // messages: [
        //   {
        //     role: "system",
        //     content: `You are a helpful assistant that analyzes
        //      comments and summarizes user
        //       sentiment and insights.`,
        //   },
        //   {
        //     role: "user",
        //     content: `Here is a post caption: "${postCaption}".
        //      Please analyze the following comments and provide a
        //       summary of what people are saying, including general
        //        sentiment and key themes:\n\n${commentsArr.join("\n")}`,
        //   },
        // ],
      });
  
      // Extract and log the result
      const summary = completion.choices[0].message.content;
      //console.log(summary);
      return summary;
    } catch (error) {
      console.error("Error while generating comment summary:", error);
      return null; // Re-throw the error for debugging
    }
};

  

