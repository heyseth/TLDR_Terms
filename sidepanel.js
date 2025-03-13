// Initialize the panel when it loads
async function initializePanel() {
    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs.length > 0) {
            const currentTab = tabs[0];
            console.log(`Initialized panel for tab ${currentTab.id} in window ${currentTab.windowId}`);
            
            // Store the tab information as data attributes
            document.body.dataset.windowId = currentTab.windowId;
            document.body.dataset.tabId = currentTab.id;

            // Request any existing content for this tab
            chrome.runtime.sendMessage(
                { type: "getTabContent", tabId: currentTab.id },
                response => {
                    if (response && response.content) {
                        displayContent(response.content);
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error initializing panel:', error);
    }
}

// Function to display content in the panel
function displayContent(content) {
    document.getElementById("disclaimer").style.display = "block";
    document.getElementsByClassName("tos-popup-body")[0].innerHTML = content;
    addListItemSearchHandlers('.tos-popup-body');
}

// Initialize when the panel loads
document.addEventListener('DOMContentLoaded', initializePanel);

// Listen for tab changes to update content
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        document.body.dataset.windowId = tab.windowId;
        document.body.dataset.tabId = tab.id;

        // Request content for the newly activated tab
        chrome.runtime.sendMessage(
            { type: "getTabContent", tabId: tab.id },
            response => {
                if (response && response.content) {
                    displayContent(response.content);
                } else {
                    // Clear content if none exists for this tab
                    document.getElementsByClassName("tos-popup-body")[0].innerHTML = '';
                    document.getElementById("disclaimer").style.display = "none";
                }
            }
        );
    } catch (error) {
        console.error('Error handling tab activation:', error);
    }
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        // Handle messages from the service worker
        if (request.type === "main") {
            // Only update content if it's for our current tab
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs.length > 0 && request.tabId === tabs[0].id) {
                    displayContent(request.message);
                }
            });
            return;
        }
        
        // For other messages, ensure they match our tab/window context
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length > 0) {
                const currentTab = tabs[0];
                if (document.body.dataset.windowId === currentTab.windowId.toString() &&
                    document.body.dataset.tabId === currentTab.id.toString()) {
                    if (request.message !== "openpanel") {
                        displayContent(request.message);
                    }
                }
            }
        });
        return true; // Keep the message channel open for async response
    }
);

// Function to add fuzzy search click handlers to list items
const addListItemSearchHandlers = (parentElement) => {
    // Accept either a selector string or DOM element
    const container = typeof parentElement === 'string' 
        ? document.querySelector(parentElement)
        : parentElement;

    if (!container) {
        console.error('Parent element not found');
        return;
    }

    // Find all list items within the container
    const listItems = container.querySelectorAll('li');

    // Add click handler to each list item
    listItems.forEach(li => {
        li.style.cursor = 'pointer';
        // extract the text that is between quotes
        let hiddenSearch = li.innerText.match(/\[(.*?)\]/);
        hiddenSearch = hiddenSearch[hiddenSearch.length - 1];
        // remove the last match from the original text
        li.innerText = li.innerText.replace('[' + hiddenSearch + ']', '').trim();

        // remove any quotes or "" from the hidden search text
        hiddenSearch = hiddenSearch.replace(/["""]/g, '');
        // replace any ellipses with spaces
        hiddenSearch = hiddenSearch.replace(/…/g, ' ');

        // add a hidden subelement to the li element with the hidden search text
        let hidden = document.createElement('span');
        hidden.style.display = 'none';
        hidden.innerText = hiddenSearch;
        li.appendChild(hidden);

        li.addEventListener('click', async () => {
            // Send search message to content script
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs.length > 0) {
                    const currentTab = tabs[0];
                    // Only send if we're in the correct window/tab context
                    if (document.body.dataset.windowId === currentTab.windowId.toString() &&
                        document.body.dataset.tabId === currentTab.id.toString()) {
                        chrome.tabs.sendMessage(
                            currentTab.id,
                            {type: "search", message: li.querySelector('span').innerText},
                            function(response) {}
                        );
                    }
                }
            });
        });
    });
};