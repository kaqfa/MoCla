generatedXML = '<?xml version="1.0"?><SyncML>';

theLast = '0';
theNext = '0';

var SyncML = function(){
  this.header = new Header();
  this.body = new Body();    
  this.jsondata = new JSonData();
  this.theXml = {};
    
  this.constructor = function(){
    this.header = new Header();
    this.body = new Body();    
    this.jsondata = new JSonData();
    generatedXML = '<?xml version="1.0"?><SyncML>';
    this.theXml = {};
  }

  this.setUser = function(uname,passwd){            
    console.log(this.header);
    this.header.cred = {
      username:uname,
      password:passwd
    };        
  }

  this.initSync = function(){    
    this.sendMessage(1);
  }
  
  this.parseMessage = function(message){
    console.log(message);
    $syncml = new SyncML();
    $syncml.theXml = $($.parseXML(message));
    var hd = $syncml.theXml.find('SyncHdr');
    var bd = $syncml.theXml.find('SyncBody');
    
    $syncml.header.sessionId = hd.find('SessionID').text();
    $syncml.header.msgId = hd.find('MsgID').text();
    $syncml.header.target = $.parseJSON(hd.find('Target').find('LocURI').text());
    $syncml.header.source = hd.find('Source').text();
    $syncml.header.cred = $.parseJSON(hd.find('Cred').text());
    
    $syncml.body.cmd = bd.find('CmdID').text();
    $syncml.body.mode = bd.find('Mode').text();
    $syncml.body.anchor.first = bd.find('Anchor').find('first').text();
    $syncml.body.anchor.last = bd.find('Anchor').find('last').text();
    $syncml.body.jsondata = $.parseJSON(bd.find('Data').text());        
    
    if(this.body.cmd == 1){ // init                
      // if mode == 400 delete all, send changes
      if($syncml.body.mode == 400){
        console.log('mode 400');
        db.transaction(function(tx){
          tx.executeSql('delete from c_en_wrk_assignment where 1');
          tx.executeSql('delete from c_en_wrk_submission where 1');
          tx.executeSql('delete from c_en_announcement where 1');
          tx.executeSql('delete from c_en_calendar_event where 1');
          tx.executeSql('delete from c_en_course_description where 1');  
          tx.executeSql('delete from cl_cours where 1');
          tx.executeSql('delete from cl_user where 1');
          tx.executeSql('delete from sync_change_logs where 1');
          tx.executeSql('delete from sync_maps where 1');
          tx.executeSql('delete from sync_anchors where 1');
        }, transError); 
      }
      this.jsondata.queryChangeLogs( function(objResult){
        $syncml.body.data = objResult;
        $syncml.sendMessage(2);
      });
    } else if(this.body.cmd == 2){ // sync
      // execute changes
      console.log($syncml.body.jsondata);      
      this.jsondata.jsonToQuery($syncml.body.jsondata);
      theLast = this.body.anchor.last;
      theNext = this.body.anchor.next;
      db.transaction(this.body.insertAnchor,transError);
    } else { // login
      // insert user & course
    }  
  }
  
  this.loginApp = function(){    
    var uname  = this.header.cred.username;
    var passwd = this.header.cred.password;    
    var me = this;
    db.transaction(
      function(tx){
        tx.executeSql("select * from cl_user where username = ? and password = ?", 
          [uname,passwd], 
          function(tx, results){
            //var $syncml = new SyncML();
            if(results.rows.length > 0){        
              $.mobile.changePage( "main.html");
            //console.log('login');
            } else {
              me.sendMessage(3);                        
            }
          }, exeError);
      }, transError);    
  }  

  this.generateMessage = function(type){
    generatedXML += this.header.generateHeader();
    generatedXML += this.body.generateBody();
    generatedXML += '</SyncML>';    
    
    var me = this;
    
    if(type == 1 || type == 2){ // init
      console.log('generate init');
      console.log(generatedXML);
      $.post("http://localhost:8880/clasync/index.php",{
        "message":generatedXML
      })
      .done(function(data){            
        me.parseMessage(data);        
      }).fail(function(){
        alert('gagal');
      });          
    } else { // if type == 3 --> login
      $.post("http://localhost:8880/clasync/index.php",{
        "message":generatedXML
      })
      .done(function(data){                                        
        me.parseMessage(data);
        if( me.header.cred.valid == true ){
          $.mobile.changePage( "main.html");
        } else {
          $('#loginmessage').html("<p>Sorry, that user is not registerred</p>");
          $('#loginmessage').css('visibility', 'visible');
        }
      }).fail(function(){
        alert('gagal');
      });
    }    
  }     

  this.generateAnchor = function(type){
    console.log('generate anchor');
    me = this;
    db.transaction(
      function(tx){
        console.log('query anchor');
        tx.executeSql("select local_next from sync_anchors order by id desc limit 1", //
          [], function(tx,results){
            console.log('query anchor execute');            
            if(results.rows.length > 0){
              me.body.anchor.last = results.rows.item(0).local_next;
            }
            me.generateMessage(type);
          }, exeError);
      }, transError);
  }

  this.generateSession = function(type){
    
    if(type == 3){
      console.log('login happen');
      this.header.sessionId = hex_md5(curDate()).substr(0, 5);
      this.header.msgId = 1;
      this.generateMessage(type);
    } else if(type == 2){
      this.header.msgId = 2;
      //this.header.sessionId = hex_md5(curDate()).substr(0, 5);
      this.generateAnchor(type);
    } else if( type == 1){  // init
      console.log('initialization happen');
      this.header.msgId = 1;
      this.header.sessionId = hex_md5(curDate()).substr(0, 5);
      this.generateAnchor(type);
    }
  }

  this.sendMessage = function(type){            
    generatedXML = '<?xml version="1.0"?><SyncML>';       
    this.header.target = 'http://sync.claroline.com';
    this.header.source = {
      uuid:'device.uuid',
      platform:'device.platform',
      model:'device.model',
      os_version:'device.version',
      utc_time:"UTC+7"
    }
    this.body.cmd = type;        
    
    this.generateSession(type);    
  }
  
}

// ========================================================================
   
var Header = function (){
  this.sessionId = 1;
  this.msgId = 1;
  this.target = 'http://sync.claroline.com';
  this.source = {
    uuid:'device.uuid',
    platform:'device.platform',
    model:'device.model',
    os_version:'device.version',
    utc_time:"UTC+7"
  };
  this.cred = {
    username:null, 
    password:null
  };
  this.val = '<SyncHdr>';
  this.userValid = false;
    
  this.construct = function(obj){
    this.sessionId = obj.find('SessionID').text();
    this.msgId = obj.find('MsgID').text();
    this.msgId = obj.find('Target').find('LocURI').text();
    this.source = obj.find('Source').text(); //$.parseJSON()
    this.cred = obj.find('Cred').text(); //$.parseJSON()
  }
    
  this.getCred = function(){
    this.cred = {
      username:this.cred.username,
      password:this.cred.password
    };
    return $.toJSON(this.cred);
  }
            
  this.generateHeader = function(){
    this.val = '<SyncHdr>';
    this.val += '<SessionID>'+this.sessionId+'</SessionID>';
    this.val += '<MsgID>'+this.msgId+'</MsgID>';
    this.val += '<Target><LocURI>'+this.target+'</LocURI></Target>';
    this.val += '<Source><LocURI>'+$.toJSON(this.source)+'</LocURI></Source>';
    this.val += '<Cred>'+this.getCred()+'</Cred>';        
    this.val += '</SyncHdr>';
    return this.val;
  }
}

// =======================================================
var Body = function(){
  this.cmd = 1;
  this.mode = 200;
  this.anchor = {
    last:'0000/00/00 00:00:00',
    next:''
  };
  this.val = '<SyncBody>';
  this.data = {};
    
  this.insertAnchor = function(tx){
    var query = 'insert into sync_anchors values (null, ?, ?, 0, ?, 0)';
    tx.executeSql(query,["this device",theLast,theNext],
      function(tx,result){
        console.log(result)
      },exeError);
  }

  this.getChange = function(from){
    this.jsondata = new JSonData();
    if(from == 'message'){
      this.jsondata.parseMessage(this.jsondata);
    } else if(from == 'db'){
      this.jsondata = this.jsondata.getDbChanges();
    }
  }

  this.generateBody = function(){
    this.val = '<SyncBody>';
    this.anchor.next = curDate()
    this.val += '<CmdID>'+this.cmd+'</CmdID>'; // 1 = init; 2 = sync; 3 = auth
    this.val += '<Mode>'+this.mode+'</Mode>';    
    this.val += '<Anchor><Last>'+this.anchor.last+'</Last><Next>'+this.anchor.next+'</Next></Anchor>';
    
    if(this.cmd == 2){
      this.val += '<Data>'+$.toJSON(this.data)+'</Data>';
    }
    this.val += '</SyncBody>';

    return this.val;
  }  
}

var JSonData = function(){
  this.insert = [];
  this.update = [];
  this["delete"] = [];

  this.parseMessage = function(jsonMessage){
    var obj = $.parseJSON(jsonMessage);
    this.insert = obj.insert;
    this.update = obj.update;
    this.del = obj.del;
  }
  
  this.jsonToQuery = function(jsondata){      
    json = jsondata;
    db.transaction(
      function(tx){
        var $sql = '';
        for(var i = 0; i < json.insert.length; i++){
          $sql = ' INSERT INTO '+json.insert[i].name+'(';
          for(var t = 0; t < json.insert[i].cols.length; t++){
            $sql += json.insert[i].cols[t]+',';
          }
          $sql = $sql.substring(0,$sql.length-1)+') values (';
          for(t = 0; t < json.insert[i].vals.length; t++){
            $sql += '"'+json.insert[i].vals[t]+'",';
          }
          $sql = $sql.substring(0,$sql.length-1)+'); ';          
          tx.executeSql($sql,[],null,transError);                      
        }

        for(i = 0; i < json.update.length; i++){
          $sql = 'UPDATE '+json.update[i].name+' SET ';      
          for(t = 0; t < json.update[i].cols.length; t++){
            $sql += json.update[i].cols[t]+' = "'+ json.update[i].vals[t]+'",';
          }
          $sql = $sql.substring(0,$sql.length-1)+' WHERE '+
          json.update[i].cols[0]+' = "'+json.update[i].vals[0]+'";';
          tx.executeSql($sql);
        }

        for(i = 0; i < json['delete'].length; i++){
          $sql = 'DELETE FROM '+json['delete'][i].name+' WHERE '+
          json['delete'][i].cols[0]+' = "'+json['delete'][i].vals[0]+'";';
          tx.executeSql($sql);
        }
        $.mobile.changePage('main.html');
        tx.executeSql("select * from cl_cours", [], function(tx, results){
          var size = results.rows.length;
          var i;
          for(i = 0;i < size;i++){
            $('#coursedata').empty().append('<li><a href="course_view.html?course='+
              results.rows.item(i).code.toLowerCase()+'">'+
              results.rows.item(i).intitule+'</a></li>');
          }    
          $('#coursedata').listview('refresh');
        }, exeError);
      }, 
      transError);
  }

  this.queryChangeLogs = function(callback){    
    db.transaction(
      function(tx){
        tx.executeSql("select * from sync_change_logs", [], 
          function(tx, results){ // getChangesLog
            var size = results.rows.length;
            var i; 
            var data = {
              insert : [],
              update : []              
            };
            data['delete'] = [];
            for(i = 0;i < size;i++){
              if(results.rows.item(i).action == 'I'){
                data.insert[i].name = results.rows.item(i).table_name;

                changedVal = $.toJSON(results.rows.item(i).changed_val);
                data.insert[i].cols = changedVal.cols;
                data.insert[i].vals = changedVal.vals;
              } else if(results.rows.item(i).action == 'U') {
                data.update[i].name = results.rows.item(i).table_name;

                changedVal = $.toJSON(results.rows.item(i).changed_val);
                data.update[i].cols = changedVal.cols;
                data.update[i].vals = changedVal.vals;

                data.update[i].cond = results.rows.item(i).table_id+'= "'+results.rows.item(i).row_id+'"'; 
              } else if(results.rows.item(i).action == 'D'){
                data['delete'][i] = results.rows.item(i).table_name;
                data['delete'][i].cond = results.rows.item(i).table_id+'= "'+results.rows.item(i).row_id+'"'; 
              }
            }
            callback(data);
          }
          , exeError);
      }, transError);
  }
}