chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Test");
  console.log(message);
  if (message.action === 'open_side_panel') {
    chrome.sidePanel.open().catch(error => {
      console.error('Failed to open side panel:', error);
    });
  }
});