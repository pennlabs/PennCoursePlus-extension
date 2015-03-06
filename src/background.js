// Handle requests for passwords
var classes;
chrome.runtime.onMessage.addListener(function(request) {
    if (request.type === 'launch_scheduler') {
        classes = request.data;
        chrome.tabs.create({
            url: chrome.extension.getURL('scheduler.html'),
            active: false
        }, function(tab) {
            // After the tab has been created, open a window to inject the tab
            chrome.windows.create({
                tabId: tab.id,
                type: 'popup',
                focused: true
                // incognito, top, left, ...
            });
        });
    }
});