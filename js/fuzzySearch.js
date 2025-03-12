// Simple fuzzysort implementation
window.fuzzysort = {
    single: (needle, haystack) => {
        needle = needle.toLowerCase();
        haystack = haystack.toLowerCase();
        
        const indexes = [];
        let needleIdx = 0;
        let score = 0;
        
        // Try to find consecutive characters from needle in haystack
        for (let haystackIdx = 0; haystackIdx < haystack.length && needleIdx < needle.length; haystackIdx++) {
            if (haystack[haystackIdx] === needle[needleIdx]) {
                indexes.push(haystackIdx);
                score += haystackIdx;
                needleIdx++;
            }
        }
        
        // Return null if we didn't find all characters
        if (needleIdx !== needle.length) {
            return null;
        }
        
        // Return match object similar to fuzzysort's format
        return {
            target: haystack,
            score: score,
            indexes: indexes
        };
    }
};

// Fuzzy search and highlight functionality using fuzzysort
window.fuzzyHighlight = (searchText) => {
    console.log(searchText);
    // Remove any existing highlights
    const existingHighlights = document.querySelectorAll('.fuzzy-highlight');
    existingHighlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    });

    if (!searchText.trim()) return;

    // Get all text nodes in the body
    const textNodes = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Skip script and style tags
                if (node.parentElement.tagName === 'SCRIPT' || 
                    node.parentElement.tagName === 'STYLE') {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    while (walker.nextNode()) {
        textNodes.push({
            node: walker.currentNode,
            text: walker.currentNode.textContent
        });
    }

    // Use fuzzysort to find matches
    let firstMatch = null;
    textNodes.forEach(({ node, text }) => {
        const result = fuzzysort.single(searchText, text);
        if (result) {
            const matchStart = result.indexes[0];
            const matchEnd = result.indexes[result.indexes.length - 1] + 1;
            
            // Create highlight element
            const highlightSpan = document.createElement('span');
            highlightSpan.className = 'fuzzy-highlight';
            highlightSpan.style.backgroundColor = '#ffeb3b';
            highlightSpan.style.color = '#000';
            
            // Split the text node and insert highlight
            const beforeText = text.substring(0, matchStart);
            const matchText = text.substring(matchStart, matchEnd);
            const afterText = text.substring(matchEnd);
            
            const fragment = document.createDocumentFragment();
            fragment.appendChild(document.createTextNode(beforeText));
            highlightSpan.appendChild(document.createTextNode(matchText));
            fragment.appendChild(highlightSpan);
            fragment.appendChild(document.createTextNode(afterText));
            
            node.parentNode.replaceChild(fragment, node);
            
            // Store first match for scrolling
            if (!firstMatch) {
                firstMatch = highlightSpan;
            }
        }
    });

    // Scroll to first match if found
    if (firstMatch) {
        firstMatch.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
};