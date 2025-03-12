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