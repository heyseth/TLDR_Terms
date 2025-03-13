chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Store tab-specific content in session storage
const tabContent = new Map();

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === "openpanel") {
      (async () => {
        try {
          await chrome.sidePanel.open({ tabId: sender.tab.id });
          await chrome.sidePanel.setOptions({
            tabId: sender.tab.id,
            path: 'sidepanel.html',
            enabled: true
          });
          sendResponse({success: true});
        } catch (error) {
          console.error('Error opening side panel:', error);
          sendResponse({success: false, error: error.message});
        }
      })();
      return true; // Keep the message channel open for async response
    } else if (request.type === "main") {
      // Store the content for this tab
      if (sender.tab) {
        tabContent.set(sender.tab.id, request.message);
      }
      // Forward the message to the side panel along with the tab ID
      chrome.runtime.sendMessage({
        type: "main",
        message: request.message,
        tabId: sender.tab ? sender.tab.id : null
      });
    } else if (request.type === "getTabContent") {
      // Return stored content for the requested tab
      const content = tabContent.get(request.tabId);
      sendResponse({ content });
    }
    return true;
  }
);

// Clean up stored content when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabContent.delete(tabId);
});