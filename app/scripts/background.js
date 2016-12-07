// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    chrome.cookies.get({name: 'user_session', url: request.url}, function(cookie){
        sendResponse(cookie.value)
    })
    return true
})
