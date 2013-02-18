var SyncML = {
    header : Header,
    body : Body,
    xml : '<syncml>',
    theXml : {}
};

SyncML.constructor = function(){
    this.header = Header;
    this.body = Body;
    this.xml = '<syncml>';
    this.theXml = {};
}

SyncML.setUser = function(uname,passwd){            
    console.log(this.header);
    this.header.cred = {
        username:uname,
        password:passwd
    };    
    
}

SyncML.loginApp = function(){    
    var uname  = this.header.cred.username;
    var passwd = this.header.cred.password;
    var me = this;
    db.transaction(
        function(tx){
            tx.executeSql("select * from cl_user where username = ? and password = ?", 
                [uname,passwd], 
                function(tx, results){    
                    if(results.rows.length > 0){        
                        $.mobile.changePage( "main.html");
                        //console.log('login');
                    } else {
                        $.post("http://localhost/clasync/index.php",{
                            "message":SyncML.sendMessage(3)
                        })
                        .done(function(data){            
                            var $syncml = SyncML;
                            $syncml.parseMessage(data);
                            if( $syncml.header.cred.valid == 'valid' ){
                                $.mobile.changePage( "main.html");
                            } else {
                                $('#loginmessage').html("<p>Sorry, that user is not registerred</p>");
                                $('#loginmessage').css('visibility', 'visible');
                            }
                        })
                        .fail(function(){
                            alert('gagal');
                        });
                    }
                }, exeError);
        }, transError);    
}   

SyncML.parseMessage = function(message){
    this.theXml = $($.parseXML(message));
    var hd = this.theXml.find('SyncHdr');
    var bd = this.theXml.find('SyncBody');
    
    this.header.sessionId = hd.find('SessionID').text();
    this.header.msgId = hd.find('MsgID').text();
    this.header.target = $.parseJSON(hd.find('Target').find('LocURI').text());
    this.header.source = hd.find('Source').text();
    this.header.cred = $.parseJSON(hd.find('Cred').text());
    
    this.body.cmd = bd.find('CmdID').text();
    this.body.mode = bd.find('Mode').text();
    this.body.anchor.first = bd.find('Anchor').find('first').text();
    this.body.anchor.last = bd.find('Anchor').find('last').text();
    this.body.jsondata = $.parseJSON(bd.find('Data').text());
    
//    console.log(this.header);
//    console.log(this.body);
}

SyncML.sendMessage = function(type){        
    this.body.cmd = type;
    if(type == 2){
        db.transaction(
        function(tx){
            tx.executeSql("select local_next from sync_anchors order by id limit 1", 
                [], function(tx,results){
                    this.body.anchor.next = curDate();
                    if(results.rows.length > 0)
                        this.body.anchor.last = results.rows[0].local_next;
                    else
                        this.body.anchor.last = '0000/00/00 00:00:00';
                    
                    this.xml += this.header.generateHeader();
                    this.xml += this.body.generateBody();
                    this.xml += '</syncml>';
                }, exeError);
        }, transError);
    } else {
        this.xml += this.header.generateHeader();
        this.xml += this.body.generateBody();
        this.xml += '</syncml>';
    }
    
    console.log(this.xml);

    return this.xml;
}

// ========================================================================
   
var Header = {
    sessionId : 1,
    msgId : 1,
    target : 'http://sync.claroline.com',
    source : {
        uuid:'device.uuid',
        platform:'device.platform',
        model:'device.model',
        os_version:'device.version',
        utc_time:"UTC+7"
    },
    cred : {
        username:null,
        password:null
    },
    val : '<SyncHdr>',
    userValid : false
};

Header.construct = function(obj){
    this.sessionId = obj.find('SessionID').text();
    this.msgId = obj.find('MsgID').text();
    this.msgId = obj.find('Target').find('LocURI').text();
    this.source = obj.find('Source').text(); //$.parseJSON()
    this.cred = obj.find('Cred').text(); //$.parseJSON()
}

Header.validateMsg = function(){
        
}
    
Header.setElement = function(){
        
    }
    
Header.getCred = function(){
    this.cred = {
        username:this.cred.username,
        password:this.cred.password
    };
    return $.toJSON(this.cred);
}
            
Header.generateHeader = function(){
    this.val += '<SessionID>'+this.sessionId+'</SessionID>';
    this.val += '<MsgID>'+this.msgId+'</MsgID>';
    this.val += '<Target><LocURI>'+this.target+'</LocURI></Target>';
    this.val += '<Source><LocURI>'+$.toJSON(this.source)+'</LocURI></Source>';
    this.val += '<Cred>'+this.getCred()+'</Cred>';
        
    this.val += '</SyncHdr>';
    return this.val;
}

// =======================================================
var Body = {};

Body.cmd = 1;
Body.mode = 200;
Body.anchor = {
    last:'',
    next:''
};
Body.jsondata = null; 
Body.val = '<SyncBody>';

Body.validateAnchor = function(){
        
}

Body.getChange = function(from){
    this.jsondata = new JSonData();
    if(from == 'message'){
        this.jsondata.parseMessage(this.jsondata);
    } else if(from == 'db'){
        this.jsondata = this.jsondata.getDbChanges();
    }
}

Body.generateBody = function(){
    this.val += '<CmdID>'+this.cmd+'</CmdID>'; // 1 = sync; 2 = init; 3 = auth
    this.val += '<Mode>'+this.mode+'</Mode>';    
    this.val += '<Anchor><Last>'+this.anchor.last+'</Last><Next>'+this.anchor.next+'</Next></Anchor>';
    //console.log('gen body');
    if(this.jsondata != null){
        this.val += '<Data>'+this.mode+'</Data>';
    }
    this.val += '</SyncBody>';

    return this.val;
}

Body.executeChange = function(){

}

var JSonData = {};

JSonData.insert = [];
JSonData.update = [];
JSonData.del    = [];

JSonData.parseMessage = function(jsonMessage){
    var obj = $.parseJSON(jsonMessage);
    this.insert = obj.insert;
    this.update = obj.update;
    this.del = obj.del;
}

JSonData.queryChangeLogs = function(){
    db.transaction(
        function(tx){
            tx.executeSql("select * from sync_change_logs", 
                [], this.getChangeLogs, exeError);
        }, 
        transError);
}

JSonData.getChangeLogs = function(tx, results){
    var size = results.rows.length;
    var i;
    for(i = 0;i < size;i++){
        if(results.rows.item(i).action == 'I'){
            this.insert[i].name = results.rows.item(i).table_name;

            changedVal = $.toJSON(results.rows.item(i).changed_val);
            this.insert[i].cols = changedVal.cols;
            this.insert[i].vals = changedVal.vals;
        } else if(results.rows.item(i).action == 'U') {
            this.update[i].name = results.rows.item(i).table_name;

            changedVal = $.toJSON(results.rows.item(i).changed_val);
            this.update[i].cols = changedVal.cols;
            this.update[i].vals = changedVal.vals;

            this.update[i].cond = results.rows.item(i).table_id+'= "'+results.rows.item(i).row_id+'"'; 
        } else if(results.rows.item(i).action == 'D'){
            this.del[i] = results.rows.item(i).table_name;
            this.update[i].cond = results.rows.item(i).table_id+'= "'+results.rows.item(i).row_id+'"'; 
        }
    }
}