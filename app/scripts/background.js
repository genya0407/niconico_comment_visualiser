// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    chrome.cookies.get({name: 'user_session', url: 'http://www.nicovideo.jp/watch'}, function(cookie){
        sendResponse(cookie.value) //cookie
    })
    return true
})
