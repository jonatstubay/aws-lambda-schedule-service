const AWS = require('aws-sdk');
AWS.config.update({region: "ap-southeast-2"});

exports.handler = (event, context, callback) => {
    console.log(event.Details.ContactData.Attributes);
    
    const documentClient = new AWS.DynamoDB.DocumentClient({region: "ap-southeast-2"});
    var phone_number    = event.Details.ContactData.CustomerEndpoint.Address;
    var date_schedule   = event.Details.ContactData.Attributes.dateSchedule;
    var time_schedule   = tConvert(event.Details.ContactData.Attributes.timeSchedule);
    var ticketNumber    = event.Details.ContactData.Attributes.ticketNumber;
    var cust_num        = event.Details.ContactData.Attributes.inputNumber;
    
    
    console.log(event.Details.ContactData.Attributes);
    console.log(event);
    
    if(typeof cust_num !== 'undefined' && cust_num){ 
        var params = {
          TableName: "northcott_customer",
          FilterExpression: "#account_number = :account_numberVal",
          ExpressionAttributeNames: {
              "#account_number": "account_number",
          },
          ExpressionAttributeValues: { ':account_numberVal' : cust_num }
        };
    }else{
        // set up parameter for checking of existing user
        var params = {
          TableName: "northcott_customer",
          FilterExpression: "#phone_number = :phone_number_val",
          ExpressionAttributeNames: {
              "#phone_number": "phone_number",
          },
          ExpressionAttributeValues: { ":phone_number_val": phone_number.toString() }
        };
    }
    
    documentClient.scan(params, onScan);
  
    var item;
    var response;
  
    function onScan(err, data) {
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        } else {        
            data.Items.forEach(function(itemdata) {
              item = itemdata;
            });
            
            var update_params = {
                TableName : "northcott_customer",
                Key: {
                    id: item.id 
                  
                },
                UpdateExpression: "set date_scheduled_service = :scheduled_serviceVal, time_scheduled_service = :time_scheduled_serviceVal",
                ExpressionAttributeValues:{
                    ":scheduled_serviceVal":date_schedule,
                    ":time_scheduled_serviceVal": time_schedule
                },
                ReturnValues:"UPDATED_NEW"
            };
            
            documentClient.update(update_params, function(err, data) {
                if (err) {
                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                    response={
                        "status": "failed"
                    };
                } else {
                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                    response={
                        "status": "success",
                        'new_date_schedule'     : data.Attributes.date_scheduled_service,
                        'new_Time_schedule'     : data.Attributes.time_scheduled_service,
                        'new_type_of_service'   : data.Attributes.type_of_service,
                        'ticketNumber'          : ticketNumber,
                        'first_name'            : item.first_name
                        
                    };
                    callback(null,  response);
                }
            });
        }
    }
};




function tConvert (time) {
  // Check correct time format and split into components
  time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  if (time.length > 1) { // If time format correct
    time = time.slice (1);  // Remove full string match value
    time[5] = +time[0] < 12 ? 'AM' : 'PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }
  return time.join (''); // return adjusted time or original string
}