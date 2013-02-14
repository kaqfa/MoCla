var SyncML = function(){
    this.header = new Header();
    this.body = new Body();
    this.xml = '<syncml>';
    
    this.setUser = function(uname,passwd){
        this.header.cred = {username:uname,password:passwd};
    }
    
    this.getLocalUser = function(){
        db.transaction(
        function(tx){tx.executeSql("select * from cl_users where username = ? and password = ?", 
            [this.header.cred.username, this.header.cred.password], 
            this.header.getDbUser, errorCB);}, errorCB);
    }        
    
    this.parseMessage = function(message){
        
    }
    
    this.doProcess = function(){
        
    }
    
    this.sendMessage = function(){
        this.xml += this.header.generateHeader();
        this.xml += this.body.generateBody();
        this.xml += '</syncml>';
        
        return this.xml;
    }
}

var Header = function(){
    this.sessionId = 1;
    this.msgId = 1;
    this.target = 'http://sync.claroline.com';
    this.source = {uuid:'device.uuid',platform:'device.platform',model:'device.model',
                        os_version:'device.version',utc_time:"UTC+7"};
    this.cred = {};
    
    this.val = '<SyncHdr>';
    
    this.getDbUser = function(tx, results){
        
    }
    
    this.validateMsg = function(){
        
    }
    
    this.setElement = function(){
        
    }
    
    this.getCred = function(){
        this.cred = {username:'kaqfa',password:'123'};
        return $.toJSON(this.cred);
    }
            
    this.generateHeader = function(){
        this.val += '<SessionID>'+this.sessionId+'</SessionID>';
        this.val += '<MsgID>'+this.msgId+'</MsgID>';
        this.val += '<Target><LocURI>'+this.target+'</LocURI></Target>';
        this.val += '<Source><LocURI>'+$.toJSON(this.source)+'</LocURI></Source>';
        this.val += '<Cred>'+this.getCred()+'</Cred>';
        
        this.val += '</SyncHdr>';
        return this.val;
    }
}

var Body = function(){
    this.cmd = 1;
    this.mode = 200;
    this.anchor = {last:'',next:''};
    this.jsondata = null; 
    
    this.val = '<SyncBody>';
    
    this.validateAnchor = function(){
        
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
        this.val += '<CmdID>'+this.cmd+'</CmdID>';
        this.val += '<Mode>'+this.mode+'</Mode>';
        this.val += '<Anchor><Last>'+this.anchor.last+'</Last><Next>'+this.anchor.next+'</Next></Anchor>';
        if(this.jsondata != null){
            this.val += '<Data>'+this.mode+'</Data>';
        }
        this.val += '</SyncBody>';
        
        return this.val;
    }
    
    this.executeChange = function(){
        
    }
}

var JSonData = function(){
    this.insert = array();
    this.update = array();
    this.del    = array();
    
    this.parseMessage = function(jsonMessage){
        var obj = $.parseJSON(jsonMessage);
        this.insert = obj.insert;
        this.update = obj.update;
        this.del = obj.del;
        
        
    }
    
    this.queryChangeLogs = function(){
        db.transaction(
        function(tx){
            tx.executeSql("select * from sync_change_logs", 
                [], this.getChangeLogs, errorCB);
        }, 
        errorCB);
    }
    
    this.getChangeLogs = function(tx, results){
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
        
}
