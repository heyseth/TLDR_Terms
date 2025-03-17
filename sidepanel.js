// Request tab-specific content when sidepanel loads
chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
    if (tabs[0]) {
        const response = await chrome.runtime.sendMessage({
            type: "getTabContent",
            tabId: tabs[0].id
        });
        if (response && response.content) {
            // Content is already HTML, so use it directly
            document.getElementsByClassName("tos-popup-body")[0].innerHTML = response.content;
            addListItemSearchHandlers('.tos-popup-body');
        }
    }
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type == "main") {
            // Content is already HTML, so use it directly
            document.getElementsByClassName("tos-popup-body")[0].innerHTML = request.message;
            addListItemSearchHandlers('.tos-popup-body');
        }
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
        if (!hiddenSearch) return; // Skip if no search text found
        
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
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, {type: "search", message: li.querySelector('span').innerText}, function(response) {});  
            });
        });
    });
};