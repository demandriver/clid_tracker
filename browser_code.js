drTrack = function(){
  /*
  This script contains tools to store clids in a 1st party cookie and send them out
  
    cookie_format = 
      [{"type":"none","string":"none","timestamp":01125153534,"agency":"self","source":"unknown"},
      {"type":"fbclid","string":"xkklnasdg2351uyi231231sdf5","timestamp":01125153534,"agency":"demandriver","source":"instagram"}]
  */
  
  //define vars accessible within namespace drTrack
  var cookie_name;
  var clid_duration;
  var clid_types;
  var url;
  var time;
  var now;
  var future_cutoff;
  var past_cutoff;
  var clid_array;
  var credited_clid_array;
  var agency;
  var click_src;
  
  //init namespace vares and run clid handler
  function init(clids, cookie = "dr_clids", duration = 30*24*60*60*1000){ //days*hours*minutes*seconds*milliseconds
    cookie_name = cookie;
    clid_duration = duration;
    clid_types = clids;
    url = new URL(window.location.href); // JavaScript URL(); object from window
    time = new Date(); // JavaScript date constructor
    now = time.getTime(); // integer, milliseconds since Jan 1, 1970
    future_cutoff = now + clid_duration; // integer, milliseconds since Jan 1, 1970 until future cutoff date for cookie/clid duration
    past_cutoff = now - clid_duration; // integer, milliseconds since Jan 1, 1970 until past cutoff date for cookie/clid duration
    clid_array = [];
    credited_clid_array = [];
    agency = url.searchParams.get("agency");
    switch(url.searchParams.get("source")){
      case 'fb':
        click_src = "facebook";
        break;
      case 'ig':
        click_src = "instagram";
        break;
      case 'msg':
        click_src = "messenger";
        break;
      case 'an':
        click_src = "fb_audience_network";
        break;
      case 'g':
        click_src = "google_search";
        break;
      case 's':
        click_src = "google_search_partners";
        break;
      case 'd':
        click_src = "google_display";
        break;
      case 'u':
        click_src = "google_smart_shopping";
        break;
      case 'ytv':
        click_src = "youtube_videos";
        break;
      case 'yts':
        click_src = "youtube_search";
        break;
      case 'vp':
        click_src = "google_video_partners";
        break;
      default:
        click_src = "unknown";
    }
    runClidHandler(); // see if there are clids, update and load into vars
  } 
        
  function getStoredClids(){
    // this is a cool regex to get the cookie string if there is one
    const getCookie = (name) => (
      document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || undefined
    )
    var stored_clids = getCookie(cookie_name);
    if (stored_clids){clid_array = JSON.parse(stored_clids);} // if a cookie was found load it into the namespace clids
  }
  
  function updateClids(){
    getStoredClids(); // load stored clids into namespace clids if any
    no_clids = true;
    for (x in clid_types){ //for each time of clid we are tracking
      var clid_type = clid_types[x];
      var clid_string = url.searchParams.get(clid_type); // pick off the value from url
      if (clid_string){
        no_clids = false;
        clid_array.push({"type":clid_type, "string":clid_string, "timestamp":now, "agency":agency, "source":click_src});
      } // if you found a value, add the clid into namespace clids
    }
    if ( no_clids ){clid_array.push({"type":"none", "string":"none", "timestamp":now, "agency":agency, "source":click_src});}
    //repeat following until timestamp on first entry is greater than past cutoff
    while ( clid_array[0].timestamp < past_cutoff ){clid_array.shift();} //remove top (oldest) clid from array
  }
      
  function runClidHandler(){
    if (agency){ // only run if agency parameter found in url
      updateClids();
      time.setTime(future_cutoff); //set expiration date
      var cookie_str = 'dr_clids=' + JSON.stringify(clid_array) + ';expires=' + time.toUTCString() + ';path=/';
      document.cookie = cookie_str; // save the cookie
    }
  }

  function clearClids(){
    time.setTime(past_cutoff);
    var cookie_str = 'dr_clids=' + "clearing" + ';expires=' + time.toUTCString() + ';path=/';
    document.cookie = cookie_str;
  }
      
  function attributeCredit(attribution_model){
    credited_clid_array = clid_array; // don't overwrite the clid array, use another array
    if (credited_clid_array.length == 0){return;} // if no clids, don't do anything, exit function
    if (credited_clid_array.length == 1){credited_clid_array[0]["credit"] = 1.0;return;} // if one clid, that one gets all the credit, exit function
    switch (attribution_model) {
      case 'last':
        for (x in credited_clid_array){credited_clid_array[x]["credit"] = 0.0;} // all clids get no credit
        credited_clid_array[credited_clid_array.length - 1]["credit"] = 1.0; // except the last one which gets all credit
        break;
      case 'first':
        for (x in credited_clid_array){credited_clid_array[x]["credit"] = 0.0;} // all clids get no credit
        credited_clid_array[0]["credit"] = 1.0; // except first one which gets all credit
        break;
      case 'position':
        if (credited_clid_array.length == 2){
          credited_clid_array[0]["credit"] = 0.5; // if 2 clids, split credit 50/50
          credited_clid_array[1]["credit"] = 0.5;
        } else {
          for (x in credited_clid_array){credited_clid_array[x]["credit"] = 0.2/(credited_clid_array.length-2);} // otherwise split .2 credit among middle clicks
          credited_clid_array[0]["credit"] = 0.4; // and credit first/last with more
          credited_clid_array[credited_clid_array.length - 1]["credit"] = 0.4;
        }
        break;
      case 'linear':
        for (x in credited_clid_array){credited_clid_array[x]["credit"] = 1.0/credited_clid_array.length;} // weight all clids equally
        break;
      case 'any':
        for (x in credited_clid_array){credited_clid_array[x]["credit"] = 1.0;} // weight all clids as if they got full credit
        break;
      default:
        for (x in credited_clid_array){credited_clid_array[x]["credit"] = 0.0;}; // credit none
    }
  }

  function reportConversion(type, model, endpoint, data = ""){
    getStoredClids();
    attributeCredit(model); // choose an attribution model and apply it
    var xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true); // open request
    //xhr.setRequestHeader('content-type', 'application/json');
    xhr.send(JSON.stringify([{"type":type,"timestamp":now,"clicks":credited_clid_array,"data":data}])); // send data
    if(type == "purchase"){clearClids();}
  }

  //functions available after loading script
  return{
    init:init,
    conversion:reportConversion
  }
}();
