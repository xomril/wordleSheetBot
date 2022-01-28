var words5 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("words5");
var tweets = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("tweets");
var BotLog = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("BotLog");
var winners = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("winners");
var logs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("logs");


var botId = "1144250328562503680";
var botName = "@cuteWordleBot ";
var gameStatus = BotLog.getRange(1, 2);
var currentTweet = BotLog.getRange(2, 2);
var lastWinner = BotLog.getRange(5, 2);

function getWordForTweet(id){
  var word = "";
  var values = tweets.getDataRange().getValues();
  for(var i=0; i< values.length; i++){
    if(values[i][0] == id) {
      word = values[i][1];
      break;
    }
  }
  return word;
}

function addwinner(winner){
  var values = winners.getDataRange().getValues();
  var winRow = 0;
  var score = 1;
  for(var i=0; i< values.length; i++){
    Logger.log(values[i])
    if(values[i][0] == winner) {
      Logger.log('found winner')
      winRow = i+1;
      score = values[i][1] + score;
      break;
    }
  }
  if(winRow == 0) {
    winners.appendRow([winner, score])
  } else {
    winners.getRange(winRow, 2).setValue(score);
  }
}

function doGame(){
  Logger.log('game status: ' + gameStatus.getValue());
   switch(gameStatus.getValue()){
    case 0:
      sendNewWord(words5);
      gameStatus.setValue('1');
      break;
      
    case 1:
      var replies = getReplies(currentTweet.getValue());
      parseReplies(replies);
      break;
  }
  
}

function parseReplies(replies){
  logs.insertRowAfter(1)
  logs.getRange(2, 1).setValue(JSON.stringify(replies))
   for(var item in replies.data){
    if(replies.data[item].author_id != botId) {
      responseToWeet(replies.data[item]);
    }
  }
}

function responseToWeet(tweet){
  var currentWord = getWordForTweet(currentTweet.getValue());
  var userWord = tweet.text.replace(botName,"");
  userWord = userWord.toLowerCase().replace(/@(\S+)/g,'').replace(' ','');
  if(userWord.length != currentWord.length ) {
    doReply(tooLongMsg, getUserById(tweet.author_id) ,tweet.id)
  }
  if(userWord == currentWord){
    gameStatus.setValue(0);
    declareWinner(getUserById(tweet.author_id))
    doReply(success, getUserById(tweet.author_id) ,tweet.id)
  } else {
    //check for bool
    var bool = [];
    for(var i=0; i< currentWord.length; i++){
      var pos = currentWord.indexOf(userWord[i]);
      var tempCube = black;      
      if(pos > i || pos < i) {
        tempCube = yellow;
      }
      if(pos == -1) {
        tempCube = black;
      }
      if(userWord[i] == currentWord[i]) {
        tempCube = green;
      } 
      
      bool.push(tempCube)
    }
    Logger.log(bool.join(""))
    doReply(bool.join(""), getUserById(tweet.author_id) ,tweet.id)
    bool = undefined;
  } 
}

function declareWinner(winner){
  addwinner(winner)
  lastWinner.setValue(winner)
  doTweet(winTweet + " @" + winner); 
 
  
}

function getWinnerScore(winner){
  var score = 0;
  var values = winners.getDataRange().getValues();
  for(var i=0; i< values.length; i++){
    if(values[i][0] == winner) {
      score = values[i][1];
      break;
    }
  }
  return score;
}

function sendNewWord(sheet) {
  var values = sheet.getDataRange().getValues();
  var word = values[Math.floor(Math.random() * (values.length))][0];
  var cubes =  new Array(word.length + 1).join(black);
  
  var tweetId = doTweet( lastWinner.getValue() + winnerPrefix +' וצבר/ה עד כה ' + getWinnerScore(lastWinner.getValue())  + ' נקודות \n' + newTweet + '\n' + cubes);
  tweets.insertRowAfter(1);
  tweets.getRange(2, 1).setValue(tweetId);
  tweets.getRange(2, 2).setValue(word);
  currentTweet.setValue(tweetId)
}


function getReplies(id) {
  Logger.log("replies")
  var since_id = BotLog.getRange(3, 2).getValue();
  var url = "https://api.twitter.com/2/tweets/search/recent?query=conversation_id:" + id + "&since_id=" + since_id + "&max_results=100&tweet.fields=in_reply_to_user_id,author_id,created_at,conversation_id&expansions=entities.mentions.username";
  var BEARER_TOKEN = ""
  var headers = {
    "Authorization" : "Basic " + Utilities.base64Encode(consumer_key + ':' + consumer_secret)
  };
  var payload = {
    "grant_type": 'client_credentials',    
  };
  
  var params = {
    "method":"POST",
    "payload": payload,
    "headers":headers,
    "muteHttpExceptions":true
  };

  var response = JSON.parse(UrlFetchApp.fetch('https://api.twitter.com/oauth2/token', params));
  var token = response.access_token;
  headers = {
      "Authorization": "Bearer " + token
    }
  
  var options = {
    "headers":headers
  }
  
  var result = JSON.parse(UrlFetchApp.fetch(url, options))
  Logger.log(result)
  return result
  
  if(result.meta.result_count == 0){
    return;
  }
  
}
