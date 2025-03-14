chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type == "search") {
        if (typeof fuzzyHighlight === 'function') {
            fuzzyHighlight(message.message);
        } else {
            console.error('fuzzyHighlight function not found');
        }
    } else if (message.type == "result") {
        const inserter = new ButtonInserter();
        inserter.displaySummary(message.message);
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