function doPost(e) {
  var response;
  if (e.parameter.payload) {var errorOutput = clickResponse(JSON.parse(e.parameter.payload)) 
    } else {var errorOutput = parseCommand(e.parameter.command,e.parameter.trigger_id,e.parameter.user_id)};
  if (!errorOutput) {response = ContentService.createTextOutput("");
    } else {response = ContentService.createTextOutput(errorOutput).setMimeType(ContentService.MimeType.JSON);}
  return response;  
}

//*********************************************************
//Parse slash command input
//*********************************************************

function parseCommand(commandRecieved, triggerID, userID) {
  if (commandRecieved == "/newteamrequest") {
    var payload = {
      channel: userID,
      text: "*Add Team Request*",
      attachments: [
        {
          title: "Select Team Type",
          callback_id: "type_button",
          text: "What kind of team are you searching for?",
          actions: [
            {
              name: "league",
              type: "button",
              text: "League Team",
              value: "league"
            },
            {
              name: "bonspiel",
              type: "button",
              text: "Bonspiel Team",
              value: "bonspiel"
            }
          ]
        }
      ]
    };
    Slack.sendPrivatePayload(userID,payload, getProperty("API_TOKEN"));
    //Slack.sendPayload(payload, 'post',getProperty("SLACK_INCOMING_WEBHOOK"));
  }
  
  if (commandRecieved == "/cancelteamrequest") {
    dialogBuilder("remove_member",triggerID,userID);
  }
  
  if (commandRecieved == "/recruitmember") {
    dialogBuilder("recruit_member",triggerID,userID);
  }
  
  if (commandRecieved == "/listteamrequests") {
    var payload = {
      text: "*List Open Team Requests*",
      attachments: [
        {
          title: "Select Team Type",
          callback_id: "list_type",
          text: "What kind of team are you searching for?",
          actions: [
            {
              name: "league",
              type: "button",
              text: "League Team",
              value: "league"
            },
            {
              name: "bonspiel",
              type: "button",
              text: "Bonspiel Team",
              value: "bonspiel"
            }
          ]
        }
      ]
    };
    Slack.sendPrivatePayload(userID,payload, getProperty("API_TOKEN"));
    //Slack.sendPayload(payload, 'post',getProperty("SLACK_INCOMING_WEBHOOK"));
  }    
}

//*********************************************************
//Create Dialog Payload
//*********************************************************

function dialogBuilder(commandRecieved,triggerID,userID) {
  
  var caller = Slack.queryUserInfo(userID);
  var positionMenu = [{
      label: "Lead",
      value: "Lead"
    },
    {
      label: "Second",
      value: "Second"
    },
    {
      label: "Vice",
      value: "Vice"
    },
    {
      label: "Skip",
      value: "Skip"
    },
    {
      label: "Front End",
      value: "Front End"
    },
    {
      label: "Back End",
      value: "Back End"
    },
    {
      label: "Any",
      value: "any"
    }];   
  
  if (commandRecieved == "add_league") {
    var sheet = Sheets.getSheet(getProperty("SPREADSHEET_ID"),"League Info");

    var leagueNames = sheet.getRange(1,1,1,sheet.getLastColumn());
    var leagueMenu = [];
    
    for (i=0; i<sheet.getLastColumn();i++) {
      leagueMenu.push({
        label: sheet.getRange(1,i+1).getValue(),
        value: JSON.stringify(sheet.getRange(1,i+1).getValue())
      });
    }  

    var payload = {
      trigger_id: triggerID,
      dialog: {
        callback_id: "league_diag",
        title: "Add League Team Request",
        submit_label: "Submit",
        notify_on_cancel: true,
        elements: [
          {
            label: "Select League",
            type: "select",
            name: "league_selection",
            options: leagueMenu
          },
          {
            label: "Preferred Position",
            type: "select",
            name: "position_selection",
            options: positionMenu
          },
          {
            label: "Years of Experience", 
            type: "text",
            name: "experience",
            placeholder: "0.0 (to the nearest 1/2 year)"
          }
        ]
      }
    }; 
  }
  
  if (commandRecieved == "add_bonspiel") {
    var payload = {
      trigger_id: triggerID,
      dialog: {
        callback_id: "bonspiel_diag",
        title: "Add Spiel Team Request",
        submit_label: "Submit",
        notify_on_cancel: true,
        elements: [
          {
            label: "Enter Bonspiel Name",
            type: "text",
            name: "bonspiel",
            placeholder: "ExampleSpiel '18"
          },
          {
            label: "Preferred Position",
            type: "select",
            name: "position_selection",
            options: positionMenu
          },
          {
            label: "Years of Experience", 
            type: "text",
            name: "experience",
            placeholder: "0.0 (to the nearest 1/2 year)"
          }
         ]
       }
     };
   }
   
  if (commandRecieved == "recruit_member") {
     var sheet = Sheets.getSheet(getProperty("SPREADSHEET_ID"),"Team Matching");
     var playersArr = [];
     var recruitMenu = [];
     
     if (sheet.getMaxRows()-1 == 0) {Slack.sendPrivateMessage(userID, "No members currently looking for teams.", Slack.getProperty("API_TOKEN"));}
     for (i=0; i<(sheet.getMaxRows()-1); i++) {
      playersArr = rowValues(sheet,i+2,"y");
      recruitMenu.push({
        label: "Player: "+playersArr[0]+"     Event/League: "+playersArr[1],
        value: playersArr[playersArr.length-2]
      });       
     }
     
     var payload = {
     trigger_id: triggerID,
     dialog: {
       callback_id: "recruit_diag",
       title: "Recruit Member",
       submit_label: "Submit",
       notify_on_cancel: true,
       elements: [
         {
          label: "Select Member to Recruit",
          type: "select",
          name: "member_selection",
          options: recruitMenu
         }
       ]
     }
   };
 }
  
  if (commandRecieved == "remove_member") {
     var sheet = Sheets.getSheet(getProperty("SPREADSHEET_ID"),"Team Matching");
     var playersArr = [];
     var removeMenu = [];
     for (var i=0; i<(sheet.getMaxRows()-1); i++) {
        playersArr = rowValues(sheet,i+2,"y");
        removeMenu.push({
        label: "Player: "+playersArr[0]+"     Event/League: "+playersArr[1],
        value: playersArr[playersArr.length-1]
      });
     }
     
     var payload = {
     trigger_id: triggerID,
     dialog: {
       callback_id: "remove_diag",
       title: "Remove Member",
       submit_label: "Remove",
       notify_on_cancel: false,
       elements: [
         {
          label: "Select Entry to Remove",
          type: "select",
          name: "member_remove",
          options: removeMenu
         }
        ]
      }
    };
  }  
  Slack.openDialog(payload, getProperty("API_TOKEN"));
}

//*********************************************************
//Respond to button click
//*********************************************************

function clickResponse(inputJSON) {
  var webhookUrl = getProperty("SLACK_INCOMING_WEBHOOK");
  
  var callbackID = inputJSON.callback_id;
  var caller = Slack.queryUserInfo(inputJSON.user.id,getProperty("API_TOKEN"));
  var triggerID = inputJSON.trigger_id;
  
  if (callbackID == "type_button") {
    if (inputJSON.actions[0].value == "league") {
      dialogBuilder("add_league",triggerID,inputJSON.user.id);
    }
    if (inputJSON.actions[0].value == "bonspiel") {
      dialogBuilder("add_bonspiel",triggerID,inputJSON.user.id);
    }
  }
  
  if (callbackID == "league_diag") {
    var validationResponse = validateInput(inputJSON, caller, callbackID, triggerID);
    if (validationResponse[0] != 1) {return JSON.stringify(validationResponse[1])};
    
    var sheet = Sheets.getSheet(getProperty("SPREADSHEET_ID"),"Team Matching");
    var appendArr = [caller.user.profile.real_name,
                     inputJSON.submission.league_selection.replace(/["]+/g, ''),"",
                     inputJSON.submission.position_selection,
                     inputJSON.submission.experience, randIdGen(), caller.user.id];               
    Sheets.appendRow(sheet,appendArr);
  }
  
  if (callbackID == "bonspiel_diag") {
    var validationResponse = validateInput(inputJSON, caller, callbackID, triggerID);
    if (validationResponse[0] != 1) {return JSON.stringify(validationResponse[1])};
    
    var sheet = Sheets.getSheet(getProperty("SPREADSHEET_ID"),"Team Matching");
    var appendArr = [caller.user.profile.real_name, "",
                     inputJSON.submission.bonspiel,
                     inputJSON.submission.position_selection,
                     inputJSON.submission.experience,
                     randIdGen(), caller.user.id];
    Sheets.appendRow(sheet,appendArr);
  }
  
  if(callbackID == "remove_diag") {
    var validationResponse = validateInput(inputJSON, caller, callbackID, triggerID);
    if (validationResponse[0] != 1) {return JSON.stringify(validationResponse[1])};
    
    var sheet = Sheets.getSheet(getProperty("SPREADSHEET_ID"), "Team Matching");
    var requestID = inputJSON.submission.member_remove.replace(/["]+/g, '');
    sheet.deleteRow(Sheets.rowLookup(sheet, requestID, 7));
  }
  
  if(callbackID == "recruit_diag") {
    var sheet = Sheets.getSheet(getProperty("SPREADSHEET_ID"), "Team Matching");
    var rowNum = Sheets.rowLookup(sheet, inputJSON.submission.member_selection, 6)
    var userID = Sheets.getValue(sheet,rowNum, 7);
    
    var message = caller.user.profile.real_name+" would like to invite you to their team! \n";
    message += "If you accept, be sure to cancel you search request by using the `/cancelteam` command.";
    
    Slack.sendPrivateMessage(userID, message, getProperty("API_TOKEN"));
  }
  
  if(callbackID == "list_type") {
     var sheet = Sheets.getSheet(getProperty("SPREADSHEET_ID"),"Team Matching");
     var playersArr = [];
     
     if (inputJSON.actions[0].value == "league") {
       var message = "*Players Looking for League Teams* \n";
     }
     if (inputJSON.actions[0].value == "bonspiel") {
       var message = "*Players Looking for Bonspiel Teams* \n";
     }
     
     for (i=0; i<(sheet.getMaxRows()-1); i++) {
      playersArr = rowValues(sheet,i+2,"n");
      if (playersArr.length == 0) {message = "*No open team requests found*";}

      if (inputJSON.actions[0].value == "league") {
        if (playersArr[1] != "") {
          message += "*Player:* "+playersArr[0]+"   ";
          message += "*League:* "+playersArr[1]+"   ";
          message += "*Position:* "+playersArr[3]+"   ";
          message += "*Years Experience:* "+playersArr[4]+"\n";
          } 
       }
      if (inputJSON.actions[0].value == "bonspiel") {
        message += "*Player:* "+playersArr[0]+"   ";
        message += "*Bonspiel:* "+playersArr[2]+"   ";
        message += "*Position:* "+playersArr[3]+"   ";
        message += "*Years Experience:* "+playersArr[4]+"\n";        
      }
    } 
    Slack.sendPrivateMessage(inputJSON.user.id, message, getProperty("API_TOKEN"));
  }
}

//*********************************************************
//Validate input
//*********************************************************

function validateInput(inputJSON, caller, callbackID, triggerID){
  var sheet = Sheets.getSheet(getProperty("SPREADSHEET_ID"), "Team Matching");
  var validationResponse;
  var errorList = [];
  var errorPayload;
  var validInput = 0;
  
  if (callbackID == "league_diag"){
    var experience = inputJSON.submission.experience.match(/^(\d+)\.(\d{1})$/);
    if (experience != null) {
      if (experience[2] == 0 || experience[2] == 5) {
        validInput = 1;
      }
    }
    if (validInput != 1) {
      errorList.push({ name: "experience", 
      error: "Invalid experience entered.  Round to nearest half-year"})
      ;}
  }
  
  if (callbackID == "bonspiel_diag"){
    var validExp = 0;
    
    var experience = inputJSON.submission.experience.match(/^(\d+)\.(\d{1})$/);
    if (experience != null) {
      if (experience[2] == 0 || experience[2] == 5) {
        validExp = 1;
      }
    }
    if (validExp != 1) {
      errorList.push({ name: "experience", 
      error: "Invalid experience entered.  Round to nearest half-year"})
    ;}
    
    if ((validExp == 1)) {validInput = 1};    
  }
  
  
  if (callbackID == "remove_diag"){
    //var rowNum = Sheets.rowLookup(sheet, inputJSON.submission.member_remove, 7);
    //DEBUG
    //Slack.sendMessage(inputJSON.submission.member_remove, getProperty("SLACK_INCOMING_WEBHOOK"));
    //Slack.sendMessage(JSON.stringify(rowNum), getProperty("SLACK_INCOMING_WEBHOOK"));
    //DEBUG 
    //var userID = sheet.getRange(rowNum,7).getValue();
    var userID = inputJSON.submission.member_remove;
    if (caller.user.id == userID) {validInput = 1;}
    else {errorList.push({ name: "member_remove", error: "User name does not match request creator."});}
  }
  
  if (validInput == 1) {
    errorPayload = HtmlService.createHtmlOutput();
  } else {errorPayload = { errors: errorList};}
  
  var status = [validInput, errorPayload];
  return status;
}

//*********************************************************
//Return the value of the given script property
//*********************************************************

function getProperty(propertyName){
  return PropertiesService.getScriptProperties().getProperty(propertyName);
}

//*********************************************************
//Simple 2-word random string generator
//*********************************************************

function randIdGen() {
  var id = "";
  var termList = ["backline","biter","blank","end",
                  "bonspiel","brush","burned","stone",
                  "button","counter","curl","draw",
                  "weight","guard","hacks","hammer",
                  "heavy","hit","hog","line","house",
                  "in-turn","lead","out-turn","pebble",
                  "raise","roll","second","sheet","shot",
                  "skip","spare","slider","sweep","take-out",
                  "tee-line","vice"];
  
  var adjList = ["safe","sturdy","terrible","obnoxious","fierce",
                 "splendid","fancy","pleasant","wandering","real",
                 "roomy","humorous","overconfident","debonair","wry",
                 "foolish","lively","premium","acrid","sneaky",
                 "ritzy","cooperative","mighty","humble","intense"];
  
  id += adjList[Math.floor(Math.random()*adjList.length)]+"_"+termList[Math.floor(Math.random()*termList.length)];
  
  return id;
}

//Move rowValues from Sheets library
//here to speed up execution time
//*****************************************
function rowValues(sheet, row, cws) {
  var rowArr = [];
  var cellValue;
  for (i=1;i<(sheet.getLastColumn()+1); i++) {
    cellValue = sheet.getRange(row,i).getValue();
    if (cws == "y" || cws == "Y" || cws == "yes" || cws == "Yes") {
      if(cellValue != "") {rowArr.push(cellValue);}
    } else {
      if(cellValue == "") {rowArr.push("");} else {rowArr.push(cellValue);}
    }
  }
  return rowArr;
}
