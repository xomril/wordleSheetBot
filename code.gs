var botLog = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("BotLog");
var log = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("log");

function onOpen() {  
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Bot')
      .addItem('Tweet test text','test1')
      .addItem('revoke','authorizationRevoke') 
      
      .addToUi(); 
};

function authorizationRevoke(){
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteProperty('oauth1.twitter');
  msgPopUp('<p>Your Twitter authorization credentials have been deleted. You\'ll need to re-run "Send a Test Tweet" to reauthorize before you can start posting again.');
}


function getTwitterService() {  
  var twitter_name = ""
  var consumer_key = ""
  var consumer_secret = ""
  var project_key = ""
 
  var service = OAuth1.createService('twitter');   
  service.setAccessTokenUrl('https://api.twitter.com/oauth/access_token');  
  service.setRequestTokenUrl('https://api.twitter.com/oauth/request_token');
  service.setAuthorizationUrl('https://api.twitter.com/oauth/authorize');
  service.setConsumerKey(consumer_key);
  service.setConsumerSecret(consumer_secret);
  service.setProjectKey(project_key);
  service.setCallbackFunction('authCallback');
  service.setPropertyStore(PropertiesService.getScriptProperties());
  
  return service;   
}

function authCallback(request) {
  var service = getTwitterService();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this page.');
  } else { 
    return HtmlService.createHtmlOutput('Denied. You can close this page');
  }
}

function msgPopUp (msg) {
  var content = '<div style="font-family: Verdana;font-size: 22px; text-align:left; width: 95%; margin: 0 auto;">' + msg + '</div>';
   var htmlOutput = HtmlService
   .createHtmlOutput(content)
     .setSandboxMode(HtmlService.SandboxMode.IFRAME)
     .setWidth(600)
     .setHeight(500);
 SpreadsheetApp.getUi().showModalDialog(htmlOutput, ' ');
  
}

function fixedEncodeURIComponent (str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

function test1(){
 doTweet('HELLO');
}

function getSingleCell(){
  
  doTweet(botLog.getRange("A" + log.getRange("B1").getValue()).getValue())
  botLog.getRange("B" + log.getRange("B1").getValue()).setValue("Posted")
  log.getRange("B1").setValue(log.getRange("B1").getValue()+1)
  
}

function auth(){
  var service = getTwitterService();  
  var authorizationUrl = service.authorize();
  msgPopUp('<p>Please visit the following URL and then re-run "Send a Test Tweet": <br/> <a target="_blank" href="' + authorizationUrl + '">' + authorizationUrl + '</a></p>');

}
function doTweet(tweet) { 
  var service = getTwitterService();  
  Logger.log(service.hasAccess())
  if (service.hasAccess()) {
    var status = 'https://api.twitter.com/1.1/statuses/update.json';
    var payload = "status=" + fixedEncodeURIComponent(tweet);    
  } else {
    var authorizationUrl = service.authorize();
    msgPopUp('<p>Please visit the following URL and then re-run "Send a Test Tweet": <br/> <a target="_blank" href="' + authorizationUrl + '">' + authorizationUrl + '</a></p>');
  }

  var parameters = {
    "method": "POST",
    "escaping": false,
    "payload" : payload
  };

  try {
    var result = service.fetch('https://api.twitter.com/1.1/statuses/update.json', parameters);
    var json = JSON.parse(result.getContentText())
    return json.id_str;
   
  }  
  catch (e) {    
    Logger.log(e.toString());
  }
 
  

}

function doReply(tweet, userName ,status_id) { 
  var service = getTwitterService();  
  if (service.hasAccess()) {
    var status = 'https://api.twitter.com/1.1/statuses/update.json';
    var payload = {
      "in_reply_to_status_id": status_id,
      "status": "@" + userName + " " + tweet
    }
    var parameters = {
      "method": "POST",
      "escaping": false,
      "payload" : payload
    };
    
  try {
    var result = service.fetch('https://api.twitter.com/1.1/statuses/update.json', parameters);
    json = JSON.parse(result.getContentText())
    
    Logger.log(json);

    botLog.getRange('B3').setValue(json.id_str)
    botLog.getRange('B4').setValue(tweet)    
  }  
  catch (e) {    
    Logger.log("error: " + e.toString() );
  }
 }
}

function getUserById(userId){
  var service = getTwitterService(); 
  var result = service.fetch("https://api.twitter.com/1.1/users/show.json?user_id="+userId);
   var w = JSON.parse(result.getContentText());  
  return w.screen_name;
}
