chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.message != "openpanel") {
            sendResponse({message: "received content"});
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
        hiddenSearch = hiddenSearch[hiddenSearch.length - 1];
        // remove the last match from the original text
        li.innerText = li.innerText.replace('[' + hiddenSearch + ']', '').trim();

        // remove any quotes or “” from the hidden search text
        hiddenSearch = hiddenSearch.replace(/["“”]/g, '');
        // replace any ellipses with spaces
        hiddenSearch = hiddenSearch.replace(/…/g, ' ');

        // add a hidden subelement to the li element with the hidden search text
        let hidden = document.createElement('span');
        hidden.style.display = 'none';
        hidden.innerText = hiddenSearch;
        li.appendChild(hidden);

        li.addEventListener('click', () => {
            console.log("testing");

            // set searchText to the text from the hidden sub element
            let searchText = li.querySelector('span').innerText;

            if (typeof fuzzyHighlight === 'function') {
                fuzzyHighlight(searchText);
            } else {
                console.error('fuzzyHighlight function not found');
            }
        });
    });
};