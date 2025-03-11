class TermsDetector {
    // Weighted scores for different detection methods - adjusted weights
    static DETECTION_WEIGHTS = {
        URL_MATCH: 0.5,        // Increased from 0.4 - URL pattern is a strong signal
        HEADER_MATCH: 0.2,     // Decreased from 0.3 - headers may be missing/varied
        CONTENT_LENGTH: 0.2,   // Kept the same
        KEYWORD_MATCH: 0.1     // Kept the same
    };

    // Keywords for detection
    static KEYWORDS = [
        'terms of service',
        'terms & conditions',
        'terms and conditions',
        'service agreement',
        'legal agreement',
        'user agreement'
    ];

    // Comprehensive list of search engines and their search URL patterns
    static SEARCH_ENGINES = [
        // Global search engines
        'google.com/search',
        'bing.com/search',
        'search.yahoo.com',
        'duckduckgo.com',
        'search.brave.com',
        'ecosia.org/search',
        'qwant.com',
        'swisscows.com/web',
        'searchencrypt.com/search',
        'startpage.com/do/search',
        'search.aol.com',
        'wolframalpha.com/input',
        'archive.org/search',
        'yippy.com/search',
        'gibiru.com/results',
        'metacrawler.com/search',
        'search.carrot2.org',
        'dogpile.com/serp',
        'peekier.com/#',
        'boardreader.com/s',

        // Regional search engines
        'baidu.com/s',         // China
        'yandex.ru/search',    // Russia
        'yandex.com/search',
        'naver.com/search',    // South Korea
        'search.naver.com',
        'daum.net/search',     // South Korea
        'seznam.cz/search',    // Czech Republic
        'coccoc.com/search',   // Vietnam
        'virgilio.it/ricerca', // Italy
        'search.goo.ne.jp',    // Japan
        'ya.ru',              // Russia
        'rambler.ru/search',  // Russia
        'sogou.com/web',      // China
        '360.cn/so',          // China
        'sm.cn',              // China
        'so.com/s',           // China
        'yam.com/search',     // Taiwan
        'onet.pl/search',     // Poland
        'wp.pl/search',       // Poland
        'sapo.pt/pesquisa',   // Portugal

        // Academic search engines
        'scholar.google.com',
        'academic.microsoft.com/search',
        'base-search.net/Search',
        'semanticscholar.org/search',

        // AI-powered search engines
        'perplexity.ai/search',
        'you.com/search',
        'phind.com/search',
        'kagi.com/search',

        // Search subdomains and variations
        'search.',
        '/search',
        '/find',
        '/seek',
        '/results',
        '/serp',
        '/web?q=',
        '?q=',
        '?query=',
        '?search=',
        '/searchresults'
    ];

    constructor() {
        this.score = 0;
        this.scores = {
            url: 0,
            header: 0,
            content: 0,
            keyword: 0
        };
    }

    detectTermsPage() {
        // First check if we're on a search engine results page
        if (this.isSearchResultsPage()) {
            console.log('Page detected as search results page - skipping terms detection');
            return false;
        }

        this.checkURL();
        this.checkHeaders();
        this.checkContentLength();
        this.checkKeywords();

        // Log detailed scoring information
        console.log('Terms Detection Scores:', {
            url: `${this.scores.url} (${this.scores.url ? 'Match' : 'No match'})`,
            header: `${this.scores.header} (${this.scores.header ? 'Match' : 'No match'})`,
            content: `${this.scores.content} (${this.scores.content ? 'Match' : 'No match'})`,
            keyword: `${this.scores.keyword} (${this.scores.keyword ? 'Match' : 'No match'})`,
            total: `${this.score.toFixed(2)} (Threshold: 0.6)`
        });

        return this.score >= 0.6;
    }

    isSearchResultsPage() {
        const currentURL = window.location.href.toLowerCase();
        return TermsDetector.SEARCH_ENGINES.some(engine => {
            // For exact matches (like specific domains)
            if (currentURL.includes(engine)) {
                return true;
            }
            
            // For pattern matches (like query parameters)
            if (engine.startsWith('?') || engine.startsWith('/')) {
                const urlParams = new URLSearchParams(window.location.search);
                const hasSearchParam = Array.from(urlParams.keys()).some(key => 
                    ['q', 'query', 'search', 'p', 'text', 'keyword'].includes(key)
                );
                if (hasSearchParam) {
                    return true;
                }
            }
            
            return false;
        });
    }

    checkURL() {
        const url = window.location.href.toLowerCase();
        const urlKeywords = ['terms', 'tos', 'terms-of-service', 'legal'];
        
        // URL patterns to match terms pages in any directory
        const urlPatterns = [
            /\/terms(?:\/|$)/,
            /\/terms-of-service(?:\/|$)/,
            /\/tos(?:\/|$)/,
            /\/legal(?:\/|$)/,
            /\/terms-and-conditions(?:\/|$)/
        ];

        const urlMatch = urlPatterns.some(pattern => pattern.test(url)) || 
            urlKeywords.some(keyword => url.includes('/' + keyword + '/'));

        if (urlMatch) {
            this.score += TermsDetector.DETECTION_WEIGHTS.URL_MATCH;
            this.scores.url = TermsDetector.DETECTION_WEIGHTS.URL_MATCH;
            console.log('URL Match:', { url, patterns: urlPatterns.map(p => p.toString()) });
        }
    }

    checkHeaders() {
        const headers = document.querySelectorAll('h1, h2');
        let foundKeyword = false;
        let matchedHeader = null;
        
        for (const header of headers) {
            const headerText = header.textContent.toLowerCase();
            if (TermsDetector.KEYWORDS.some(keyword => headerText.includes(keyword))) {
                if (!this.isPartOfSearchResult(header)) {
                    foundKeyword = true;
                    matchedHeader = headerText;
                    break;
                }
            }
        }

        if (foundKeyword) {
            this.score += TermsDetector.DETECTION_WEIGHTS.HEADER_MATCH;
            this.scores.header = TermsDetector.DETECTION_WEIGHTS.HEADER_MATCH;
            console.log('Header Match:', { matchedHeader });
        }
    }

    isPartOfSearchResult(element) {
        const searchContainers = [
            'search-results',
            'searchresults',
            'search-container',
            'results',
            'serp'
        ];

        let current = element;
        while (current && current !== document.body) {
            const classAndId = (current.className + ' ' + current.id).toLowerCase();
            if (searchContainers.some(container => classAndId.includes(container))) {
                return true;
            }
            current = current.parentElement;
        }
        return false;
    }

    checkContentLength() {
        const bodyText = document.body.textContent;
        const contentLength = bodyText.length;
        const hasLegal = this.hasLegalStructure(bodyText);
        
        if (contentLength > 8000 && hasLegal) {
            this.score += TermsDetector.DETECTION_WEIGHTS.CONTENT_LENGTH;
            this.scores.content = TermsDetector.DETECTION_WEIGHTS.CONTENT_LENGTH;
            console.log('Content Length Match:', { 
                length: contentLength, 
                hasLegalStructure: hasLegal 
            });
        }
    }

    hasLegalStructure(text) {
        const legalIndicators = [
            /section \d/i,
            /article \d/i,
            /^\d+\./m,
            /agreement/i,
            /governing law/i,
            /liability/i,
            /rights and responsibilities/i
        ];

        let indicatorCount = 0;
        const matchedIndicators = [];
        legalIndicators.forEach(indicator => {
            if (indicator.test(text)) {
                indicatorCount++;
                matchedIndicators.push(indicator.toString());
            }
        });

        console.log('Legal Indicators:', { 
            matched: matchedIndicators,
            count: indicatorCount
        });

        return indicatorCount >= 3;
    }

    checkKeywords() {
        const bodyText = document.body.textContent.toLowerCase();
        let keywordCount = 0;
        let paragraphsWithKeywords = 0;
        const matchedKeywords = new Set();

        const paragraphs = bodyText.split(/\n\s*\n/);

        for (const paragraph of paragraphs) {
            let hasKeyword = false;
            for (const keyword of TermsDetector.KEYWORDS) {
                if (paragraph.includes(keyword)) {
                    keywordCount++;
                    hasKeyword = true;
                    matchedKeywords.add(keyword);
                }
            }
            if (hasKeyword) {
                paragraphsWithKeywords++;
            }
        }

        if (keywordCount >= 3 && paragraphsWithKeywords >= 2) {
            this.score += TermsDetector.DETECTION_WEIGHTS.KEYWORD_MATCH;
            this.scores.keyword = TermsDetector.DETECTION_WEIGHTS.KEYWORD_MATCH;
            console.log('Keyword Matches:', {
                uniqueKeywords: Array.from(matchedKeywords),
                totalMatches: keywordCount,
                paragraphsWithMatches: paragraphsWithKeywords
            });
        }
    }
}

class ButtonInserter {
    constructor() {
        this.button = this.createButton();
        this.inserted = false;
    }

    createButton() {
        const button = document.createElement('button');
        button.textContent = '✨ Understand Terms of Service';
        button.className = 'tos-copy-button tos-fixed-position';
        button.addEventListener('click', () => this.copyTermsToClipboard());
        return button;
    }

    insert() {
        if (this.inserted) return;
        
        // Create a container for the button that's always at the root level
        const container = document.createElement('div');
        container.id = 'tos-button-container';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '2147483647';
        container.appendChild(this.button);
        
        // Insert at root level to avoid React conflicts
        document.body.appendChild(container);
        this.inserted = true;

        // Setup mutation observer to ensure button stays on page
        this.observeButtonRemoval(container);
    }

    observeButtonRemoval(container) {
        const observer = new MutationObserver((mutations) => {
            if (!document.contains(container)) {
                document.body.appendChild(container);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async copyTermsToClipboard() {
        try {
            const content = this.extractTermsContent();
            //console.log('Terms of Service:', content);
            this.sendTermsToServer(content);

            this.showFeedback('success', 'Copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showFeedback('error', 'Failed to copy');
        }
    }

    metaprompt = 
    `You are an assistant that summarizes Terms and Conditions into plain language. Read the provided text and extract its key points, including:

    Concerning elements: anything which the user may find concerning
    Purpose & Scope: What the document covers.
    User Obligations: Responsibilities and limitations.
    Privacy & Data Usage: How data is collected and used.
    Liabilities & Disclaimers: Key limitations and warranties.
    Dispute Resolution: Methods for resolving conflicts.
    Present the summary in concise bullet points or a brief paragraph, using simple language and avoiding legal jargon. End with a disclaimer that the summary is for informational purposes only and not legal advice.

    Present a second, even shorter summary, with just 3 short bullet points per section.`
    ;

    async sendTermsToServer(content) {
        const GEMINI_API_KEY = 'AIzaSyAFgQsNt9APZ7UKrBikOmap8LEPiY1P9F4'; // FIXME:
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: this.metaprompt + content
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Server response:', data);
        } catch (error) {
            console.error('Failed to send to server:', error);
            throw error;
        }
    }

    extractTermsContent() {
        const excludeTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'IMG', 'BR', 'HR']);
        const MIN_TEXT_LENGTH = 1000;
    
        function isInHeaderFooter(element) {
            let el = element;
            while (el) {
                const tag = el.tagName.toLowerCase();
                const id = el.id.toLowerCase();
                const cls = el.className.toLowerCase();
                if (tag === 'header' || tag === 'footer' || 
                    /(^|\\b)header(\\b|$)/.test(cls) || 
                    /(^|\\b)footer(\\b|$)/.test(cls) ||
                    id.includes('header') || id.includes('footer')) {
                    return true;
                }
                el = el.parentElement;
            }
            return false;
        }
    
        function traverseDOM(el, depth = 0, candidates = []) {
            if (excludeTags.has(el.tagName)) return candidates;
            
            const text = el.textContent.trim();
            if (text.length >= MIN_TEXT_LENGTH) {
                const score = text.length * (depth + 1); // Depth bonus
                candidates.push({ el, text, score, depth });
            }
    
            for (const child of el.children) {
                traverseDOM(child, depth + 1, candidates);
            }
            return candidates;
        }
    
        const candidates = traverseDOM(document.body)
            .filter(c => !isInHeaderFooter(c.el))
            .sort((a, b) => b.score - a.score);
    
        // Return the highest-scoring candidate that's not near the top
        for (const candidate of candidates) {
            if (candidate.depth > 2) { // Prefer deeper elements
                return candidate.text;
            }
        }

        if (candidates[0]?.text) {
            // remove whitespace
            candidates[0].text.replace(/\s+/g, ' ');
            // remove line breaks
            candidates[0].text.replace(/\n/g, ' ');
        }
        // remove extra whitespace from the text
    
        return candidates[0]?.text || 'No substantial content found';
    }

    showFeedback(type, message) {
        const originalText = this.button.textContent;
        this.button.textContent = message;
        this.button.classList.add(type);

        setTimeout(() => {
            this.button.textContent = originalText;
            this.button.classList.remove(type);
        }, 2000);
    }
}

// Main execution
(function() {
    const detector = new TermsDetector();
    const isTermsPage = detector.detectTermsPage();
    console.log('Is Terms Page:', isTermsPage);
    
    if (isTermsPage) {
        const inserter = new ButtonInserter();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => inserter.insert());
        } else {
            inserter.insert();
        }
    }
})();