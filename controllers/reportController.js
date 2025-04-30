const { ReportsModel } = require('../models/reportsModel');

exports.postReportCtrl = async(req,res) => {
 

    try{
    
      const userId = req.userId;
      const {type, reportedId, reason} = req.body;

        const newReportData = {
            reporterId: userId,
            reportedId,
            type,
            reason,
          };

          const newReport = new ReportsModel(newReportData);
           const savedReport = await newReport.save();

 
          
          res.json({status:'success', message:'Reported Successfully!'});
        

        } catch (error){
            console.log(error);
            res.json({ status:'error', message: 'Internal Server Error.'});
        
       }


}