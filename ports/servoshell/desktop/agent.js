// Sentience Platform - Semantic Accessibility Tree Extractor
// This script extracts a semantic, LLM-friendly representation of a web page

(function() {
    'use strict';

    // Helper function to check if an element is visible
    function isVisible(element) {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return false;
        }

        const style = window.getComputedStyle(element);

        // Check if element is hidden via CSS
        if (style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0') {
            return false;
        }

        // Check if element has dimensions
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
            return false;
        }

        return true;
    }

    // Get semantic role of an element
    function getSemanticRole(element) {
        // Explicit ARIA role takes precedence
        if (element.hasAttribute('role')) {
            return element.getAttribute('role');
        }

        // Map HTML tags to semantic roles
        const tagRoleMap = {
            'nav': 'navigation',
            'main': 'main',
            'header': 'banner',
            'footer': 'contentinfo',
            'aside': 'complementary',
            'section': 'region',
            'article': 'article',
            'form': 'form',
            'button': 'button',
            'a': 'link',
            'img': 'image',
            'h1': 'heading',
            'h2': 'heading',
            'h3': 'heading',
            'h4': 'heading',
            'h5': 'heading',
            'h6': 'heading',
            'ul': 'list',
            'ol': 'list',
            'li': 'listitem',
            'table': 'table',
            'input': 'textbox',
            'textarea': 'textbox',
            'select': 'combobox',
            'dialog': 'dialog',
        };

        const tag = element.tagName.toLowerCase();
        return tagRoleMap[tag] || null;
    }

    // Get accessible name for an element
    function getAccessibleName(element) {
        // Priority order for accessible name:
        // 1. aria-label
        if (element.hasAttribute('aria-label')) {
            return element.getAttribute('aria-label');
        }

        // 2. aria-labelledby
        if (element.hasAttribute('aria-labelledby')) {
            const id = element.getAttribute('aria-labelledby');
            const labelElement = document.getElementById(id);
            if (labelElement) {
                return labelElement.textContent.trim();
            }
        }

        // 3. For images: alt attribute
        if (element.tagName.toLowerCase() === 'img' && element.hasAttribute('alt')) {
            return element.getAttribute('alt');
        }

        // 4. For links/buttons: text content
        if (['a', 'button'].includes(element.tagName.toLowerCase())) {
            return element.textContent.trim();
        }

        // 5. For inputs: associated label or placeholder
        if (element.tagName.toLowerCase() === 'input') {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) {
                return label.textContent.trim();
            }
            if (element.hasAttribute('placeholder')) {
                return element.getAttribute('placeholder');
            }
            if (element.hasAttribute('name')) {
                return element.getAttribute('name');
            }
        }

        // 6. title attribute
        if (element.hasAttribute('title')) {
            return element.getAttribute('title');
        }

        return null;
    }

    // Extract text content (direct children only, not nested)
    function getDirectText(element) {
        let text = '';
        for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            }
        }
        return text.trim();
    }

    // Get relevant attributes for semantic understanding
    function getRelevantAttributes(element) {
        const attrs = {};
        const tag = element.tagName.toLowerCase();

        // Links
        if (tag === 'a' && element.hasAttribute('href')) {
            attrs.href = element.getAttribute('href');
        }

        // Images
        if (tag === 'img') {
            if (element.hasAttribute('src')) {
                attrs.src = element.getAttribute('src');
            }
            if (element.hasAttribute('alt')) {
                attrs.alt = element.getAttribute('alt');
            }
        }

        // Forms and inputs
        if (['input', 'textarea', 'select', 'button'].includes(tag)) {
            if (element.hasAttribute('type')) {
                attrs.type = element.getAttribute('type');
            }
            if (element.hasAttribute('name')) {
                attrs.name = element.getAttribute('name');
            }
            if (element.hasAttribute('value')) {
                attrs.value = element.getAttribute('value');
            }
            if (element.hasAttribute('placeholder')) {
                attrs.placeholder = element.getAttribute('placeholder');
            }
        }

        // Headings
        if (/^h[1-6]$/.test(tag)) {
            attrs.level = parseInt(tag.charAt(1));
        }

        // ID and class for identification
        if (element.hasAttribute('id')) {
            attrs.id = element.getAttribute('id');
        }
        if (element.hasAttribute('class')) {
            const classes = element.getAttribute('class').trim();
            if (classes) {
                attrs.class = classes;
            }
        }

        // ARIA attributes
        const ariaAttrs = ['aria-expanded', 'aria-selected', 'aria-checked', 'aria-pressed', 'aria-disabled'];
        for (let attr of ariaAttrs) {
            if (element.hasAttribute(attr)) {
                attrs[attr] = element.getAttribute(attr);
            }
        }

        return Object.keys(attrs).length > 0 ? attrs : null;
    }

    // Recursively build the semantic tree
    function buildSemanticTree(element, depth = 0, maxDepth = 50) {
        // Prevent infinite recursion
        if (depth > maxDepth) {
            return null;
        }

        // Skip if not visible
        if (!isVisible(element)) {
            return null;
        }

        const role = getSemanticRole(element);
        const name = getAccessibleName(element);
        const text = getDirectText(element);
        const attrs = getRelevantAttributes(element);

        // Build node object (only include non-null/non-empty values)
        const node = {
            tag: element.tagName.toLowerCase(),
        };

        if (role) node.role = role;
        if (name) node.name = name;
        if (text) node.text = text;
        if (attrs) node.attrs = attrs;

        // Process children
        const children = [];
        for (let child of element.children) {
            const childNode = buildSemanticTree(child, depth + 1, maxDepth);
            if (childNode) {
                children.push(childNode);
            }
        }

        if (children.length > 0) {
            node.children = children;
        }

        return node;
    }

    // Extract metadata from the page
    function extractMetadata() {
        const meta = {
            title: document.title,
            url: window.location.href,
        };

        // Extract meta tags
        const description = document.querySelector('meta[name="description"]');
        if (description) {
            meta.description = description.getAttribute('content');
        }

        const keywords = document.querySelector('meta[name="keywords"]');
        if (keywords) {
            meta.keywords = keywords.getAttribute('content');
        }

        // OpenGraph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            meta.og_title = ogTitle.getAttribute('content');
        }

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
            meta.og_description = ogDescription.getAttribute('content');
        }

        return meta;
    }

    // Main execution
    try {
        const semanticTree = {
            metadata: extractMetadata(),
            tree: buildSemanticTree(document.body),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
        };

        // Output as JSON to stdout
        console.log(JSON.stringify(semanticTree, null, 2));
    } catch (error) {
        // Output error as JSON
        console.error(JSON.stringify({
            error: true,
            message: error.message,
            stack: error.stack,
        }, null, 2));
    }
})();
