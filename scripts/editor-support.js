/**
 * This file serves as a redirect/wrapper for the Universal Editor.
 * The actual editor-support logic is now located at /ext/scripts/editor-support.js
 * This file exists here because the Universal Editor loads editor-support.js
 * from /scripts/ by convention.
 */
import '/content/wbcopy.resource/ext/scripts/editor-support.js';
