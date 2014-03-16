//Create webGI object if neccessary
if (typeof webGI === 'undefined') {
    webGI = {}
}

//Add module to webGI namespace
webGI.options = (function($) {
    //We have jquery/zepto available ($)

    //Public attributes
    var my = {};
    my.client = {};
    my.client.show_dtc = true;
    my.server = {};


    //Private attributes
    var ws_conf = new WebSocket(webGI.conf.websocket_host+"/ws_conf");
    ws_conf.onopen = function() {
        my.request();
    }

    ws_conf.onmessage = function(e) {
       var msg = JSON.parse(e.data);
       //console.log(msg);
       switch(msg.type) {
            case "geigerconf":
                update(msg)
            break;

            default:
                console.log("INVALID MESSAGE",msg);
        }
    }

    //Public Function
    my.save = function() {
        my.server.sim_dose_rate = parseFloat($('#server_cnf_sim_dose_rate').val());
        if ($('#server_cnf_gps_mode_mobile').is(':checked')){
            my.server.opmode = "mobile";
        } else {
            my.server.opmode = "static";
            my.server.lat = parseFloat($('#server_cnf_node_lat').val());
            my.server.lon = parseFloat($('#server_cnf_node_lon').val());
            my.server.alt = parseFloat($('#server_cnf_node_alt').val());
        };
        
        if ($('#server_cnf_opmode_env').is(':checked')){
            my.server.source = "env";
        } else if ($('#server_cnf_opmode_test').is(':checked')){
            my.server.source = "test";
        } else if ($('#server_cnf_opmode_sim').is(':checked')){
            my.server.source = "sim";
        }
        
        if ($('#cgw_abc').is(':checked')){
            my.server.window = "abc";
        } else if ($('#cgw_bc').is(':checked')){
            my.server.window = "bc";
        } else if ($('#cgw_c').is(':checked')){
            my.server.source = "c";
        }
        
        var cmd = {
            "cmd" : "save",
            "conf": my.server
        };
        ws_conf.send(JSON.stringify(cmd));
        console.log("Saving options", my.server);
        my.request()
    }

    my.request = function() {
        var cmd = {
        "cmd" : "get",
        }
        ws_conf.send(JSON.stringify(cmd));
        //console.log("Requesting options");
    }

    my.lin2log = function(position) {
        var minp = 0;
        var maxp = 100;
        var minv = Math.log(0.01);
        var maxv = Math.log(1000);
        var scale = (maxv-minv) / (maxp-minp);
        return (Math.exp(minv + scale*(position-minp))).toFixed(2);
    }

    my.log2lin = function(value) {
        var minp = 0;
        var maxp = 100;
        var minv = Math.log(0.01);
        var maxv = Math.log(1000);
        var scale = (maxv-minv) / (maxp-minp);
        return ((Math.log(value)-minv) / scale + minp).toFixed(2);
    }

    my.geoSnapshotCallback = function (position) {
        //console.log(position);
        $('#server_cnf_node_lat').val(position.coords.latitude.toFixed(5));
        $('#server_cnf_node_lon').val(position.coords.longitude.toFixed(5));
        $('#server_cnf_node_alt').val(position.coords.altitude);

    }

    //Private Function
    function update(msg) {
        console.log("Options:",msg)
        $('#cnf_node_uuid').text(msg.uuid);
        $('#cnf_node_name').text(msg.name);
        
        my.server.sim_dose_rate = msg.sim_dose_rate;
        $('#server_cnf_sim_dose_rate').val(my.server.sim_dose_rate);
        $('#simRanger').val(webGI.options.log2lin(my.server.sim_dose_rate));
        
        $('#server_cnf_node_lat').val(msg.lat);
        $('#server_cnf_node_lon').val(msg.lon);
        $('#server_cnf_node_alt').val(msg.alt);
        
        if(msg.opmode==="stationary"){
            $('#server_cnf_gps_mode_static').prop('checked',true);
        } else if (msg.opmode==="mobile") {
            $('#server_cnf_gps_mode_mobile').prop('checked',true);
        }
        
        $('#server_cnf_opmode_'+msg.source).prop('checked',true);
        
        $('#cgw_'+msg.window).prop('checked',true);
        
    }

    //Do not forget to return my, otherwise nothing will work.
    return my;
}($));  //Pass jq/zepto to the module construction function call
