// Enable chromereload by uncommenting this line:
// import 'chromereload/devonly';
chrome.browserAction.onClicked.addListener( function(){
    chrome.tabs.getSelected(null, function(tab) {
        if (tab.url.match('http://www.nicovideo.jp/watch') !== null) {
            chrome.tabs.sendMessage(tab.id, {type: 'reloadCommentGraph'})
        }
    })
});
