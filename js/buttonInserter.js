let mdConverter = new showdown.Converter();

class ButtonInserter {
    constructor() {
        this.button = this.createButton();
        this.popup = this.createPopup();
        this.inserted = false;
        // Use the globally available Server class
        this.server = new Server();
    }

    createButton() {
        const button = document.createElement('button');
        button.textContent = '✨ Understand Terms of Service';
        button.className = 'tos-copy-button tos-fixed-position';
        button.addEventListener('click', async () => {
            // Send loading state first
            await chrome.runtime.sendMessage({
                type: "main",
                message: `
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">Analyzing...</div>
                    </div>
                `
            });
            // open the side panel
            await chrome.runtime.sendMessage({type: "openpanel", message: ""});
            // do something with response here, not outside the function
            this.analyzeTOS();
        });
        return button;
    }

    createPopup() {
        const popup = document.createElement('div');
        popup.className = 'tos-popup';
        popup.innerHTML = `
            <div class="tos-popup-content">
                <button class="tos-popup-close">×</button>
                <h2>Terms of Service Summary</h2>
                <p id="disclaimer">This summary is for informational purposes only and is not legal advice. Please read the full Terms of Service for complete details.</p>
                
                <div class="tos-popup-body"></div>
            </div>
        `;
        
        // Close button functionality
        popup.querySelector('.tos-popup-close').addEventListener('click', () => {
            popup.classList.remove('active');
        });
        
        // Click outside to close
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.classList.remove('active');
            }
        });
        
        return popup;
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
        document.body.appendChild(this.popup);
        this.inserted = true;

        // Setup mutation observer to ensure button stays on page
        this.observeButtonRemoval(container);
    }

    observeButtonRemoval(container) {
        const observer = new MutationObserver((mutations) => {
            if (!document.contains(container)) {
                document.body.appendChild(container);
            }
            if (!document.contains(this.popup)) {
                document.body.appendChild(this.popup);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async analyzeTOS() {
        this.button.classList.add('fadeOutRight');
        // add on animationend event listener to button element
        this.button.addEventListener('animationend', () => {
            // remove the button element from the DOM
            this.button.remove();
        });
        try {
            const content = this.extractTermsContent();
            this.showFeedback('success', 'Analyzing...');
            const response = await chrome.runtime.sendMessage({type: "server", message: content});
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showFeedback('error', 'Failed to analyze');
        }
    }

    displaySummary(text) {        
        let formattedText = text;
        // remove all text before the first * symbol
        const startIndex = formattedText.indexOf('*');
        if (startIndex > 0) {
            formattedText = formattedText.substring(startIndex);
        }
        // convert markdown to html
        formattedText = mdConverter.makeHtml(formattedText);
        // replace all * in formattedText with &#x2022;
        formattedText = formattedText.replace(/\* /g, '');

        const disclaimer = '<p id="disclaimer"> This summary is for informational purposes only and is not legal advice. Please read the full Terms of Service for complete details.</p><br>';
        const popupBody = this.popup.querySelector('.tos-popup-body');
        popupBody.innerHTML = formattedText;

        // Find the first p and ul elements
        const firstP = popupBody.querySelector('p');
        const firstUl = popupBody.querySelector('ul');

        if (firstP && firstUl) {
            // Create a wrapper div
            const wrapper = document.createElement('div');
            wrapper.className = 'tos-popup-initial-content';

            // Move the elements into the wrapper
            const pClone = firstP.cloneNode(true);
            const ulClone = firstUl.cloneNode(true);
            wrapper.appendChild(pClone);
            wrapper.appendChild(ulClone);

            // Replace the original elements with the wrapper
            firstP.parentNode.insertBefore(wrapper, firstP);
            firstP.remove();
            firstUl.remove();
        }

        //this.popup.classList.add('active');
        //this.showFeedback('success', 'Success!');
        popupBody.innerHTML = disclaimer + popupBody.innerHTML;

        this.sendSummary(popupBody.innerHTML);
        //addListItemSearchHandlers('.tos-popup-body');
    }

    async sendSummary(text) {
        const response = await chrome.runtime.sendMessage({type: "main", message: text});
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
        this.button.textContent = message;
        this.button.classList.add(type);
    }
}