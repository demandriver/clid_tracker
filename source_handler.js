drSources = function(){
  
  //initialize vars to be used inside the function
  var url;
  var url_sources;
  var agency_param;
  
  var cookie_name;
  var cookie_sources;
  var cookie_duration;
  
  var all_sources;
  
  var time;
  var now;
  var future_cutoff;
  var past_cutoff;
  
  function init(cookie = 'dr_sources', duration = 30*24*60*60*1000, debug = false){
    //assign vars
    url = new URL(window.location.href);
    agency_param = url.searchParams.get('agency');
    if(agency_param == 'demandriver'){
      let source_param = url.searchParams.get('source'); //strip of source param from url
      if(source_param){url_sources = source_param.split('-');} //if you found a source param, store as array in url_sources
    }
    
    cookie_name = cookie;
    cookie_sources = storedSources(); //get stored sources from cookie
    cookie_duration = duration;

    all_sources = getAllSources(); //combine stored sources and url sources

    time = new Date();
    now = time.getTime();
    future_cutoff = now + cookie_duration;

    saveSources();
    addSourceParam();

    if(debug){
      console.log("drSource vars:");
      console.log(url_sources);
      console.log(cookie_sources);
      console.log(all_sources);
    }
  }
  
  function storedSources(){
    const getCookie = (name) => (
      document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || undefined
    )
    let cookie = getCookie(cookie_name);
    if(cookie){
      return cookie.split('-');
    }else{
      return null;
    }
  }
  
  function getAllSources(){
    if(url_sources && cookie_sources){
      return [...new Set(url_sources.concat(cookie_sources))];
    }else if(url_sources){
      return [...new Set(url_sources)];
    }else if(cookie_sources){
      return [...new Set(cookie_sources)];
    }else{
      return null;
    }
  }
  
  function saveSources(){
    if(all_sources){
      time.setTime(future_cutoff); //set expiration date
      let cookie_str = cookie_name + '=' + all_sources.join('-') + ';expires=' + time.toUTCString() + ';path=/';
      document.cookie = cookie_str;
    }
  }
  
  function addSourceParam(){
    if(all_sources){
      url.searchParams.set('agency','demandriver');
      url.searchParams.set('source',all_sources.join('-'));
      window.history.replaceState(null, null, url.href);
    }
  }
  
  function sendSources(endpoint,data = ''){
    if(all_sources){
      var xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      xhr.send(JSON.stringify({cookie_name:all_sources,'data':data}));
    }
  }
  
  return{
    init:init,
    send:sendSources
  }

}();
