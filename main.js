"use strict";

// you have to require the utils module and call adapter function
var utils =    require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter = utils.adapter('paw');
var http = require('http');

adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    // Warning, obj can be null if it was deleted
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

var sms={};
// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    /*
     if(sms.state_old==undefined) sms.state_old=0;
     if(id==adapter.namespace +'.smscount.LocalUnread'){
     if(state.val != sms.state_old&&state.val>sms.state_old&&state.val!='0'){
     var count = Number(state.val )- sms.state_old
     hilink.listNew(function (response) {
     var res = {};
     res.response = response.response[0]
     delete res.response.Priority
     delete res.response.SaveType
     delete res.response.Sca
     delete res.response.SmsType
     delete res.response.Smstat
     adapter.getState('last_sms.Date', function (err, state) {
     if(state==null||state.val!=res.response.Date){
     setHilink("last_sms",res);
     adapter.log.info('res ' + JSON.stringify(res));
     }
     });
     });
     }
     sms.state_old=state.val;
     }
     */
});

// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function (obj) {
    /*
     adapter.log.info('send obg '+JSON.stringify(obj));
     if (typeof obj == 'object' && obj.message) {
     if (obj.command == 'control') {
     //adapter.log.info(JSON.stringify(obj.message));
     if (obj.message == 'conect' || obj.message == 'desconect' || obj.message == 'reboot') {
     //adapter.log.info(JSON.stringify(obj.message));
     hilink.control(obj.message, function (response) {
     if (obj.callback)adapter.sendTo(obj.from, obj.command, response, obj.callback);
     });
     }
     } else if (obj.command == 'send') {
     if (obj.message.phone && obj.message.message) {
     hilink.send(obj.message.phone, obj.message.message, function (response) {
     if (obj.callback)adapter.sendTo(obj.from, obj.command, response, obj.callback);
     });
     }
     } else if (obj.command == 'read') {
     if (obj.message == 'outbox' || obj.message == 'inbox' || obj.message == 'new') {
     if (obj.message == 'inbox') {
     hilink.listInbox(function (response) {
     if (obj.callback)adapter.sendTo(obj.from, obj.command, response, obj.callback);
     });
     } else if (obj.message == 'outbox') {
     hilink.listOutbox(function (response) {
     if (obj.callback)adapter.sendTo(obj.from, obj.command, response, obj.callback);
     });
     } else if (obj.message == 'new') {
     hilink.listNew(function (response) {
     if (obj.callback)adapter.sendTo(obj.from, obj.command, response, obj.callback);
     });
     }
     }
     } else if (obj.command == 'ussd') {
     if (obj.message) {
     hilink.ussd(obj.message,function(response){
     if (obj.callback)adapter.sendTo(obj.from, obj.command, response, obj.callback);
     });
     }
     }else if (obj.command == 'delete'){
     if (obj.message) {
     hilink.delete(obj.message,function(response){
     if (obj.callback)adapter.sendTo(obj.from, obj.command, response, obj.callback);
     });
     }
     }else if (obj.command == 'clear'){
     if (obj.message=='inbox'||obj.message=='outbox') {
     if(obj.message=='inbox') hilink.clearInbox();
     if(obj.message=='outbox') hilink.clearOutbox();
     }
     }else if (obj.command == 'setRead'){
     if (obj.message=='all'){
     hilink.readAll(function(response ){
     if (obj.callback)adapter.sendTo(obj.from, obj.command, response, obj.callback);
     });
     }else{
     hilink.setRead(obj.message,function(response ){
     if (obj.callback)adapter.sendTo(obj.from, obj.command, response, obj.callback);
     });
     }
     }
     }
     */
});

adapter.on('ready', function () {
    main();
    getdata('192.168.1.71','8080','/get.xhtml');
});

function setdata (setid, response ) {
    for (var key in response) {
        var val = response[key];
        //adapter.log.info("key: " + response[key]);
        adapter.setObject(setid+'.'+key, {
            type: 'state',
            common: {
                name: key,
                type: 'mixed',
                role: 'indicator',
                "read": "true",
                "write": "false"
            },
            native: {}
        });
        adapter.setState(setid+'.' + key, {val: val, ack: true});
    }
}




function parsedata(data,path) {

    if(path=='/get.xhtml'){
        if(data.sensors) {
            delete data.sensors.info
            setdata ('sensors', data.sensors );
        }
        if(data.wifi) setdata ('wifi', data.wifi );
        if(data.battery) setdata ('battery', data.battery );
        if(data.cpu) setdata ('cpu', data.cpu );
        if(data.audio_volume.info) setdata ('audio_volume.info', data.audio_volume.info );
        if(data.audio_volume) {
            delete data.audio_volume.info
            setdata ('audio_volume', data.audio_volume );
        }
        if(data.memory) setdata ('memory', data.memory );
        if(data.info) setdata ('info', data.info );
        if(typeof data.gps ==='object') setdata ('gps', data.gps );
    }
    adapter.log.info("data: " + data);

}


function getdata(ip,port,path) {
    var options = {
        host: ip,
        port: port,
        path: path,
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded',}
    };

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        var buffer = "";
        res.on( "data", function( data ) {
            buffer = buffer + data;
        });
        res.on( "end", function( data ) {
            data = JSON.parse(buffer);
            parsedata (data,path);
        });
    });
    req.write('');
    req.end();
}



function main() {
    adapter.log.info('config getip: ' + adapter.config.getip);
    adapter.log.info('config trafficInfo: ' + adapter.config.trafficInfo);
    adapter.log.info('config settime: ' + adapter.config.settime);
    adapter.log.info('config setTest: ' + adapter.config.setTest);

    //adapter.subscribeStates('smscount.LocalUnread');
}

