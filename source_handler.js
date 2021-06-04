document.addEventListener('DOMContentLoaded', (event) => {
  var a_tags = document.querySelectorAll('a');
  let url = new URL(window.location);
  let source_code = url.searchParams.get('source');
  if (source_code){
    for (var i = 0; i < a_tags.length; i++){
      url.href = a_tags[i].href; //reset URL object href to current <a> href
      window_host = window.location.hostname.split(".").slice(-2).join(".");
      a_tag_host = a_tags[i].hostname.split(".").slice(-2).join(".");
      if ( window_host == a_tag_host  && !url.searchParams.get('source')){ //if link is insite and source isn't already in the <a> link
        url.searchParams.append('source', source_code);
        a_tags[i].href = url.href;
      }
    }
  }
});
  
drInSite = function(){
  
  var cookie_name;
  var cookie_duration;
  var time;
  var now;
  var future_cutoff;
  var past_cutoff;
  var url;
  var click_src;
  var sources;
    
  function run(cookie = "dr_sources", duration = 30*24*60*60*1000){
    cookie_name = cookie;
    cookie_duration = duration;
    url = new URL(window.location.href);
    time = new Date();
    now = time.getTime();
    future_cutoff = now + cookie_duration;
    past_cutoff = now + cookie_duration;
    getSource();
    readStoredSources();
    addSource();
    saveSources();
  }
    
  function getSource(){
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
  }
   
  function readStoredSources(){
    const getCookie = (name) => (
      document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || undefined
    )
    var stored_sources = getCookie(cookie_name);
    if (stored_sources){sources = JSON.parse(stored_sources);}else{sources = [];}
  }
        
  function addSource(){
    if (click_src != "unknown" && !sources.includes(click_src)){
      sources.push(click_src);
    }
  }
    
  function saveSources(){
    time.setTime(future_cutoff); //set expiration date
    var cookie_str = cookie_name + '=' + JSON.stringify(sources) + ';expires=' + time.toUTCString() + ';path=/';
    document.cookie = cookie_str;
  }
        
  function sendSources(endpoint){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.send(JSON.stringify(sources));
  }
        
  return{
    run:run,
    send:sendSources
    //conversion:reportConversion
  }
}();
