/* eslint-disable */
// noinspection JSUnresolvedReference
// noinspection SpellCheckingInspection
// noinspection JSUnusedGlobalSymbols
// noinspection JDuplicatedCode
// noinspection JSUnresolvedReference


/*
Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; version 3 of the License.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details, or get a copy at
<https://www.gnu.org/licenses/gpl-3.0.txt>.
*/


/*
 * Copyright (C) 2025 <rushikc> <rushikc.dev@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details, or get a copy at
 * <https://www.gnu.org/licenses/gpl-3.0.txt>.
 */


/**
 * A helper function to find and decode the email body from nested parts.
 * It prefers HTML to plain text if both are present.
 * @param {object[]} parts The parts array from the email payload.
 * @return {string|null} The decoded email body text, or null if not found.
 */
function findBody(parts) {
    if (!parts || parts.length === 0) {
        return null;
    }

    let htmlBody = null;
    let plainTextBody = null;

    for (const part of parts) {
        if (part.body && part.body.data) {
            if (part.mimeType === 'text/html') {
                htmlBody = base64Decode(part.body.data);
            } else if (part.mimeType === 'text/plain') {
                plainTextBody = base64Decode(part.body.data);
            }
        }

        if (part.parts && part.parts.length > 0) {
            const nestedBody = findBody(part.parts);
            if (nestedBody) {
                return nestedBody;
            }
        }
    }

    if (htmlBody) {
        return htmlBody;
    } else if (plainTextBody) {
        return plainTextBody;
    }

    return null;
}

/**
 * A helper function to decode Base64-encoded strings or convert byte arrays to text.
 * @param {string|number[]} inputData The Base64-encoded string or array of byte numbers to decode.
 * @return {string|null} The decoded plain text, or null if decoding fails or input is invalid.
 */
function base64Decode(inputData) {
    if (typeof inputData === 'string' && inputData.length > 0) {
        const base64 = inputData.replace(/-/g, '+').replace(/_/g, '/');
        try {
            return Utilities.newBlob(Utilities.base64Decode(base64)).getDataAsString();
        } catch (e) {
            console.error('Error decoding Base64 string:', e, 'Input was:', inputData);
            return null;
        }
    } else if (Array.isArray(inputData) && inputData.length > 0 && typeof inputData[0] === 'number') {
        try {
            const uint8Array = new Uint8Array(inputData);
            return Utilities.newBlob(uint8Array).getDataAsString();
        } catch (e) {
            console.error('Error converting byte array to string:', e, 'Input was:', inputData);
            return null;
        }
    } else {
        console.warn('base64Decode received invalid or empty input:', inputData);
        return null;
    }
}

/**
 * Extracts plain text content from an HTML string by removing tags and decoding HTML entities.
 * This function is designed for Google Apps Script, where direct DOM parsing is not available.
 * @param {string} html The HTML string to parse.
 * @return {string} The extracted plain text.
 */
function extractPlainTextFromHtml(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    let text = html;

    // Remove <style> tags and their content
    text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
    // Remove <script> tags and their content
    text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    // Remove HTML comments
    text = text.replace(/<!--[\s\S]*?-->/g, '');

    // 1. Replace <br> and <p> tags with newlines to preserve some formatting
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<p[^>]*>/gi, '\n\n');
    text = text.replace(/<\/p>/gi, '');

    // 2. Remove all other HTML tags
    text = text.replace(/<[^>]*>/g, '');

    // 3. Decode common HTML entities (a simplified approach for Apps Script)
    // Utilities.newBlob(text, 'text/html').getDataAsString() can sometimes help,
    // but it's not a general HTML parser. Manual replacements are more reliable here.
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, '\''); // Single quote
    text = text.replace(/&nbsp;/g, ' '); // Non-breaking space
    text = text.replace(/&copy;/g, '©'); // Copyright symbol
    text = text.replace(/&reg;/g, '®'); // Registered symbol
    text = text.replace(/&trade;/g, '™'); // Trademark symbol
    text = text.replace(/&mdash;/g, '—'); // Em dash
    text = text.replace(/&ndash;/g, '–'); // En dash

    // Handle numeric and hexadecimal entities (e.g., &#x20AC; or &#8364;) - a basic approach
    text = text.replace(/&#(\d+);/g, (match, code) => String.fromCharCode(parseInt(code, 10)));
    text = text.replace(/&#x([0-9a-fA-F]+);/g, (match, code) => String.fromCharCode(parseInt(code, 16)));

    // 4. Normalize whitespace: replace multiple spaces/newlines with single space
    text = text.replace(/\s+/g, ' ').trim();

    return text;
}
