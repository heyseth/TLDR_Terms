// async function getActiveTab() {
//     const [tab] = await chrome.tabs.query({
//         active: true,
//         lastFocusedWindow: true
//     });
//     return tab;
// }

// async function getCurrentTab() {
//     let queryOptions = { active: true, lastFocusedWindow: true };
//     // `tab` will either be a `tabs.Tab` instance or `undefined`.
//     let [tab] = await chrome.tabs.query(queryOptions);
//     return tab;
//   }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type = "search") {
        if (typeof fuzzyHighlight === 'function') {
            fuzzyHighlight(message.message);
        } else {
            console.error('fuzzyHighlight function not found');
        }
    }
    return true
});

// Main execution
(function() {
    const detector = new TermsDetector();
    const isTermsPage = detector.detectTermsPage();
    //console.log('Is Terms Page:', isTermsPage);
    
    if (isTermsPage) {
        const inserter = new ButtonInserter();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => inserter.insert());
        } else {
            inserter.insert();
        }
    }
})();