const ACCESS_TOKEN = "アクセストークン";
const spst =  SpreadsheetApp.openById("スプレッドシートID");
const order = spst.getSheetByName("DHHリスト");
const attends = spst.getSheetByName("参加者");
const userIdList = spst.getSheetByName("userID")
const _dev = spst.getSheetByName("_dev");
const groupID = "グループID"
const userID = "開発者のユーザーID"
const url = 'https://api.line.me/v2/bot/message/push';

//out soursed logger
//https://console.cloud.google.com/logs/query;xxxxxxxxxxxxxxx

function addOneDay(date){
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()+1)
}

function delColm(){
  order.getRange(2,1,1,3).deleteCells(SpreadsheetApp.Dimension.ROWS);
}

function _reset(){
  attends.getRange(1,4,50,50).clearContent();
  attends.getRange(1,4,50,50).removeCheckboxes();

  var numMember = attends.getLastRow()-1;
  var listLength = order.getLastRow();
  attends.getRange(2,4,numMember,numMember).insertCheckboxes();
  attends.getRange(2,4,numMember,numMember).check();

  var lastDate = order.getRange(listLength,1).getValue();
  var currentDate = addOneDay(lastDate);
  for(cnt = 0;cnt<numMember;cnt++){
  attends.getRange(1,cnt+4).setValue(currentDate);
  currentDate = addOneDay(currentDate);
  }
}

function testFunc(){
  var today = new Date();
  var tomorrow = today;
  tomorrow.setDate(today.getDate()+1);
  var row = order.getLastRow();
  var row_ = attends.getLastRow();
  var dates = order.getRange(2,1,row-1,1).getValues();
  var userIDs = attends.getRange(2,1,row_-1,2).getValues();

  //日付が一致する列を検索
  dates.forEach(function(elem, index){
    if(elem[0].toDateString()===tomorrow.toDateString()){
      hitRow = index+2;
    }
  })
}

function include(array,target){
  let result = false;
  for(cnt=0;cnt<array.length;cnt++){
    if(array[cnt]==target){
      result = true;
      break;
    }
  }
  return result;
}

function flatten(array){
  result　= [];
  for(cnt=0;cnt<array.length;cnt++){
    result[cnt] = array[cnt][0];
  }
  return result;
}

//送信
function sendMessage(text,target){
  var testMode = false;
  var sendTo = "";
  if(testMode){
    sendTo = userID
  }
  else{
    sendTo = target
  }

  var headers = {
    "Authorization": "Bearer " + ACCESS_TOKEN,
  }

  var postData = {
      'to': sendTo,
      'messages':[{
        'type': 'text',
        'text': text ,
      }]
  }

  var options = {
    "method" : "post",
    "contentType" : "application/json",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
  }

  UrlFetchApp.fetch(url, options)

  //Logger.log("to API:"+text)
}

function sendError(text){
  var headers = {
    "Authorization": "Bearer " + ACCESS_TOKEN,
  }

  var postData = {
      'to': userID,
      'messages':[{
        'type': 'text',
        'text': text ,
      }]
  }

  var options = {
    "method" : "post",
    "contentType" : "application/json",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
  }

  UrlFetchApp.fetch(url, options)
}

function logError(error,data=""){
  row = _dev.getLastRow();
  now = new Date();
  _dev.getRange(row+1,1,1,3).setValues([[now,error,data]]);
}

function doPost(e){
  let json = JSON.parse(e.postData.contents);
  let userID = json.events[0].source.userId;
  let userInfo_json = "";

  let row = userIdList.getLastRow();
  let knownIDs = userIdList.getRange(1,2,row+1).getValues();

  if(!(include(flatten(knownIDs),userID))){
    let options = {"headers" : {
      "Authorization" : "Bearer " + ACCESS_TOKEN},
      "muteHttpExceptions" : true
      }
    try{
      userInfo_json = UrlFetchApp.fetch("https://api.line.me/v2/bot/profile/"+userID, options);
    }
    catch(e){
      logError(e);
      try{
        userInfo_json = json.events[0].message.text;
      }
      catch(e){
        logError(e,json);
      }
    }
    let userInfo = JSON.parse(userInfo_json);
    let username = userInfo.displayName;

    userIdList.getRange(row+1,1,1,2).setValues([[username,userID]]);
  }


}




//配列シャッフル
function shuffle(array){
  result = [];
  for (cnt = array.length;cnt>0;cnt--){
    num = Math.floor(Math.random()*array.length);
    result.push(array[num]);
    array.splice(num, 1);
  }
  return result;
}

//不参加日がないか（ない=true、ある=false）
function falseCheck(list){
  result = true;

  list.forEach(function(elem,index){
    if(!elem){
      result = false;
    }
  })

  return result;
}

//trueのカウント
function trueCounter(list){
  result = 0;
  list.forEach(function(elem){
    if(typeof(elem)==="object"){
      elem = elem[0]
    }
    if(elem){
      result++;
    }
  })
  return result;
}

//ここから実行
function start(){
  var today = new Date();
  var tomorrow = today;
  tomorrow.setDate(today.getDate()+1);
  var row = order.getLastRow();
  var row_ = attends.getLastRow();
  var dates = order.getRange(2,1,row-1,1).getValues();
  var userIDs = attends.getRange(2,1,row_-1,2).getValues();

  //日付が一致する列を検索
  dates.forEach(function(elem, index){
    if(elem[0].toDateString()===tomorrow.toDateString()){
      hitRow = index+2;
    }
  })

  

  //テキストを生成&送信
  var info = order.getRange(hitRow,1,1,3).getDisplayValues();
  userIDs.forEach(function(elem){
    if(info[0][2]==elem[0]){
      userID_ = elem[1];
    }
  })
  message = `${info[0][2]}さん\n明日のDHHよろしくお願いします！\n【${info[0][1]}】`
  try{
  sendMessage(message,userID_);
  }
  catch(e){
    try{
    sendMessage(message+"\nbotの友達登録＆メッセージ送信も忘れずに！",groupID);
    console.log(e);
    }
    catch(e){
      sendMessage(e+"\n"+message+"\nbotの友達登録＆メッセージ送信も忘れずに！",userID);
      console.log(e)
    }
  }
  //2日前警告
  if(row-hitRow===8){
  //参加者リスト更新
    //初期化
    attends.getRange(1,4,50,50).clearContent();
    attends.getRange(1,4,50,50).removeCheckboxes();

    //チェックボックス挿入
    var numMember = attends.getLastRow()-1;
    var listLength = order.getLastRow();
    attends.getRange(2,4,numMember,numMember).insertCheckboxes();
    attends.getRange(2,4,numMember,numMember).check();

    //日付入力
    var lastDate = order.getRange(listLength,1).getValue();
    var currentDate = addOneDay(lastDate);
    for(cnt = 0;cnt<numMember;cnt++){
    attends.getRange(1,cnt+4).setValue(currentDate);
    currentDate = addOneDay(currentDate);
    }

    message = "5日後に次のリストを作成します。\n参加・不参加を切り替えたい方は以下のリンクから変更できます。参加できない日がある方も以下から調整してください。\nhttps://docs.google.com/spreadsheets/d/1q4gCSlYinQx2Ctqs9NnRu-Dm9nOiYxG-0L8Xbqm0MM4/edit#gid=129178977"
    sendMessage(message,groupID)
  }

  //新リスト作成
  if(row-hitRow===3){
    var members = attends.getLastRow();
    var attendStatus = attends.getRange(2,3,members-1).getValues();
    var active_full = [];
    var active_part = [];
    var messageNewOrder = "DHH list\n日程の変更は河本まで";
    var days = trueCounter(attendStatus);
    var newOrder = Array(days);

    //参加者リストアップ&参加不可日がある人を振り分け
    attendStatus.forEach(function(elem, index){
      var attendID = index+2;
      if(elem[0]){
        var availableDayCheckList = attends.getRange(attendID,4,1,days).getValues()[0];
        var fullAttend = falseCheck(availableDayCheckList);
        if(fullAttend){
          active_full.push(attendID);
        }
        else{
          active_part.push(attendID);
        }
      }
    })
    Logger.log(attendStatus);
    Logger.log(active_full);
    Logger.log(active_part);

    active_full = shuffle(active_full);　//row番号のリストで管理
    active_part = shuffle(active_part);

    //順番調整 
    //部分参加の調整 
    active_part.forEach(function(elem,index){
      var availableDayCheckList = attends.getRange(elem,4,1,days).getValues()[0];
      var done = false;
      for(var dateIndex=days-1;!done&&dateIndex>-1;dateIndex--){
        if(newOrder[dateIndex]==null && availableDayCheckList[dateIndex]){
          done = true;
          newOrder[dateIndex] = elem;
        }
        if(dateIndex<0){
          sendError("エラー：日程調整うまくいかなかった");
        }
      }
    })
    Logger.log(newOrder);

    //フル参加の調整
    active_full.forEach(function(elem,index){
      var done = false;
      for(var dateIndex=0;!done&&dateIndex<days;dateIndex++){
        if(newOrder[dateIndex]==null){
          newOrder[dateIndex] = elem;
          done = true;
        }
      }
    })

    Logger.log(newOrder);
    
    //リスト作成
    newOrder.forEach(function(elem, index){
      var row = order.getLastRow();
      var name = attends.getRange(elem,1).getValue();
      var lastNum = order.getRange(row,2).getValue();
      var lastDate = order.getRange(row,1).getValue();
      var newDate = new Date(lastDate.getFullYear(),lastDate.getMonth(),lastDate.getDate()+1);
      var newNum = lastNum+1;

      order.getRange(row+1,1,1,3).setValues([[newDate,newNum, name]]);
      messageNewOrder += `\n${newDate.getMonth()+1}/${newDate.getDate()}【${newNum}】${name}`;
    })
    sendMessage(messageNewOrder,groupID);
  }

  if(row>100){
    order.getRange(2,1,50,3).deleteCells(SpreadsheetApp.Dimention.ROWS);
  }

}
