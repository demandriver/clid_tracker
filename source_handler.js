drSources = function(){
  //initialize vars to be used inside the function
    
  var url;

  var url_sources_param_key = 'source';
  var url_sources_param;
  var url_sources;

  var stored_sources_cookie_name = 'dr_sources';
  var stored_sources_cookie;
  var stored_sources;

  var agency_param_key = 'agency';
  var dr_agency_param_value = 'demandriver';
  var agency_param;

  var last_touch_param_key = 'dr_lt';
  var last_touch_param;
  var last_touch_cookie_name = 'dr_lt';
  var last_touch_cookie;
  var last_touch;

  var all_sources;

  var cookie_duration;
  var time;
  var now;
  var expiration_time;

  const getCookie = (name) => (
    document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || undefined
  )

  function getCurrentStateVars(){
    url = new URL(window.location.href);
    url_sources_param = url.searchParams.get(url_sources_param_key); //strip off source param from url
    stored_sources_cookie = getCookie(stored_sources_cookie_name);
    agency_param = url.searchParams.get(agency_param_key);
    last_touch_param = parseInt(url.searchParams.get(last_touch_param_key));
    last_touch_cookie = parseInt(getCookie(last_touch_cookie_name));
    time = new Date();
    now = time.getTime();
  }  

  function getAllSources(){ //ok
    if(agency_param == dr_agency_param_value || last_touch_param){
      if(url_sources_param){url_sources = url_sources_param.split('-');} //if you found a source param in url, store as array in url_sources
    }
    if(stored_sources_cookie){stored_sources = stored_sources_cookie.split('-');} //get stored sources from cookie
    if(url_sources && stored_sources){
      all_sources = [...new Set(url_sources.concat(stored_sources))];
    }else if(url_sources){
      all_sources = [...new Set(url_sources)];
    }else if(stored_sources){
      all_sources = [...new Set(stored_sources)];
    }
  }

  function getLastTouch(){ //ok
    //last touch is now if agency=demandriver present. otherwise, last touch is latest of url param and cookie
    if(agency_param == dr_agency_param_value){
      last_touch = now;
    }else if(last_touch_param && last_touch_cookie){
      last_touch = Math.max(last_touch_param, last_touch_cookie);
    }else if(last_touch_param){
      last_touch = last_touch_param;
    }else if (last_touch_cookie){
      last_touch = last_touch_cookie;
    }     
  }

  function saveCookies(){ //ok
    if(all_sources){
      let cookie_str = '';
      expiration_time = last_touch + cookie_duration;
      time.setTime(expiration_time); //set expiration date
      cookie_str = stored_sources_cookie_name + '=' + all_sources.join('-') + ';expires=' + time.toUTCString() + ';path=/';
      document.cookie = cookie_str;
      cookie_str = last_touch_cookie_name + '=' + last_touch.toString() + ';expires=' + time.toUTCString() + ';path=/';
      document.cookie = cookie_str;
    }
  }

  function addParams(){ //ok
    if(all_sources){
      url.searchParams.set(last_touch_param_key,last_touch.toString());
      url.searchParams.set(url_sources_param_key,all_sources.join('-'));
      window.history.replaceState(null, null, url.href);
    }
  }

  function init(duration = 30*24*60*60*1000, debug = false){
    cookie_duration = duration;
    getCurrentStateVars(); //get params and cookies and init URL(), Date(), etc.
    getAllSources(); //combine stored sources and url sources
    getLastTouch();
    saveCookies();
    addParams();

    setInterval(function(){
      if(window.location.href != url.href){
        url.href = window.location.href;
        addParams();
      }
    }, 50);


    if(debug){
      console.log("drSource vars:");
      console.log(url_sources);
      console.log(stored_sources);
      console.log(all_sources);
      }
  }

  function sendSources(endpoint,data = ''){
    if(all_sources && last_touch){
      var xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint, true);
      xhr.send(JSON.stringify({'dr_sources':all_sources,'last_touch':last_touch,'data':data}));
    }
  }

  return{
    init:init,
    send:sendSources
  }

}();
