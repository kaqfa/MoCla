var SyncML = function(){
    this.header = new Header();
    this.body = new Body();
    this.xml = '<syncml>';
    
    this.doProcess = function(){
        
    }
    
    this.getReply = function(){
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
    
}
