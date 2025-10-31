import {
  decorateBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  loadBlock,
  loadBlocks,
} from '/content/wbcopy.resource/ext/scripts/aem.js';
import { decorateRichtext } from '/content/wbcopy.resource/ext/scripts/editor-support-rte.js';
import { decorateMain } from '/content/wbcopy.resource/ext/scripts/scripts.js';

async function applyChanges(event) {
  console.log('[EditorSupport] 🔧 applyChanges called');
  console.log('[EditorSupport] Event type:', event.type);
  
  // redecorate default content and blocks on patches (in the properties rail)
  const { detail } = event;
  console.log('[EditorSupport] Event detail:', detail);

  const resource = detail?.request?.target?.resource // update, patch components
    || detail?.request?.target?.container?.resource // update, patch, add to sections
    || detail?.request?.to?.container?.resource; // move in sections
  
  if (!resource) {
    console.log('[EditorSupport] ❌ No resource found in event');
    return false;
  }
  console.log('[EditorSupport] Processing resource:', resource);
  
  const updates = detail?.response?.updates;
  if (!updates.length) {
    console.log('[EditorSupport] ❌ No updates found in response');
    return false;
  }
  console.log('[EditorSupport] Found', updates.length, 'update(s)');
  
  const { content } = updates[0];
  if (!content) {
    console.log('[EditorSupport] ❌ No content in first update');
    return false;
  }
  console.log('[EditorSupport] Content length:', content.length, 'characters');

  const parsedUpdate = new DOMParser().parseFromString(content, 'text/html');
  console.log('[EditorSupport] Content parsed successfully');
  
  const element = document.querySelector(`[data-aue-resource="${resource}"]`);
  console.log('[EditorSupport] Found element:', element ? element.tagName : 'null');

  if (element) {
    console.log('[EditorSupport] ✓ Element found, determining type...');
    
    if (element.matches('main')) {
      console.log('[EditorSupport] 📄 Handling MAIN element update');
      const newMain = parsedUpdate.querySelector(`[data-aue-resource="${resource}"]`);
      
      if (!newMain) {
        console.log('[EditorSupport] ❌ Could not find new main in parsed update');
        return false;
      }
      
      console.log('[EditorSupport] Found new main element');
      newMain.style.display = 'none';
      element.insertAdjacentElement('afterend', newMain);
      console.log('[EditorSupport] New main inserted into DOM');
      
      console.log('[EditorSupport] Decorating main...');
      decorateMain(newMain);
      
      console.log('[EditorSupport] Decorating richtext...');
      decorateRichtext(newMain);
      
      console.log('[EditorSupport] Loading blocks...');
      await loadBlocks(newMain);
      
      console.log('[EditorSupport] Removing old main element');
      element.remove();
      newMain.style.display = null;
      
      console.log('[EditorSupport] Attaching event listeners to new main');
      // eslint-disable-next-line no-use-before-define
      attachEventListners(newMain);
      
      console.log('[EditorSupport] ✅ Main element update completed successfully');
      return true;
    }

    console.log('[EditorSupport] 🔍 Searching for parent block...');
    const block = element.parentElement?.closest('.block[data-aue-resource]') || element?.closest('.block[data-aue-resource]');
    
    if (block) {
      console.log('[EditorSupport] 🧱 Handling BLOCK element update');
      const blockResource = block.getAttribute('data-aue-resource');
      console.log('[EditorSupport] Block resource:', blockResource);
      console.log('[EditorSupport] Block classes:', block.className);
      
      const newBlock = parsedUpdate.querySelector(`[data-aue-resource="${blockResource}"]`);
      
      if (newBlock) {
        console.log('[EditorSupport] Found new block in parsed update');
        newBlock.style.display = 'none';
        block.insertAdjacentElement('afterend', newBlock);
        console.log('[EditorSupport] New block inserted into DOM');
        
        console.log('[EditorSupport] Decorating buttons...');
        decorateButtons(newBlock);
        
        console.log('[EditorSupport] Decorating icons...');
        decorateIcons(newBlock);
        
        console.log('[EditorSupport] Decorating block...');
        decorateBlock(newBlock);
        
        console.log('[EditorSupport] Decorating richtext...');
        decorateRichtext(newBlock);
        
        console.log('[EditorSupport] Loading block...');
        await loadBlock(newBlock);
        
        console.log('[EditorSupport] Removing old block');
        block.style.display = 'none';
        block.remove();
        newBlock.style.display = null;
        
        console.log('[EditorSupport] ✅ Block update completed successfully');
        return true;
      } else {
        console.log('[EditorSupport] ❌ Could not find new block in parsed update');
      }
    } else {
      console.log('[EditorSupport] 📑 No block found, handling as SECTION or DEFAULT CONTENT');
      // sections and default content, may be multiple in the case of richtext
      const newElements = parsedUpdate.querySelectorAll(`[data-aue-resource="${resource}"],[data-richtext-resource="${resource}"]`);
      console.log('[EditorSupport] Found', newElements.length, 'new elements');
      
      if (newElements.length) {
        const { parentElement } = element;
        console.log('[EditorSupport] Parent element:', parentElement ? parentElement.tagName : 'null');
        
        if (element.matches('.section')) {
          console.log('[EditorSupport] 📋 Handling SECTION update');
          const [newSection] = newElements;
          console.log('[EditorSupport] New section classes:', newSection.className);
          
          newSection.style.display = 'none';
          element.insertAdjacentElement('afterend', newSection);
          console.log('[EditorSupport] New section inserted into DOM');
          
          console.log('[EditorSupport] Decorating buttons...');
          decorateButtons(newSection);
          
          console.log('[EditorSupport] Decorating icons...');
          decorateIcons(newSection);
          
          console.log('[EditorSupport] Decorating richtext...');
          decorateRichtext(newSection);
          
          console.log('[EditorSupport] Decorating sections on parent...');
          decorateSections(parentElement);
          
          console.log('[EditorSupport] Decorating blocks on parent...');
          decorateBlocks(parentElement);
          
          console.log('[EditorSupport] Loading blocks on parent...');
          await loadBlocks(parentElement);
          
          console.log('[EditorSupport] Removing old section');
          element.remove();
          newSection.style.display = null;
          
          console.log('[EditorSupport] ✅ Section update completed successfully');
        } else {
          console.log('[EditorSupport] 📝 Handling DEFAULT CONTENT update');
          console.log('[EditorSupport] Replacing element with', newElements.length, 'new element(s)');
          
          element.replaceWith(...newElements);
          
          console.log('[EditorSupport] Decorating buttons on parent...');
          decorateButtons(parentElement);
          
          console.log('[EditorSupport] Decorating icons on parent...');
          decorateIcons(parentElement);
          
          console.log('[EditorSupport] Decorating richtext on parent...');
          decorateRichtext(parentElement);
          
          console.log('[EditorSupport] ✅ Default content update completed successfully');
        }
        return true;
      } else {
        console.log('[EditorSupport] ❌ No new elements found in parsed update');
      }
    }
  } else {
    console.log('[EditorSupport] ❌ Element not found in DOM');
  }

  console.log('[EditorSupport] ⚠️ applyChanges returning false - no changes applied');
  return false;
}

const recentlyHandled = new Set();

function attachEventListners(main) {
  if (!main) {
    console.log('[EditorSupport] ⚠️ attachEventListners called with null/undefined main');
    return;
  }
  
  if (main._aueListenersAttached) {
    console.log('[EditorSupport] ℹ️ Event listeners already attached to this main element');
    return;
  }
  
  console.log('[EditorSupport] 🎧 Attaching Universal Editor event listeners to main');
  main._aueListenersAttached = true;

  const eventTypes = ['aue:content-patch', 'aue:content-update', 'aue:content-add', 'aue:content-move', 'aue:content-remove'];
  console.log('[EditorSupport] Listening for event types:', eventTypes);
  
  eventTypes.forEach((eventType) => {
      main.addEventListener(eventType, async (event) => {
        console.log('[EditorSupport] ========================================');
        console.log('[EditorSupport] 📨 Event received:', eventType);
        console.log('[EditorSupport] Timestamp:', new Date().toISOString());
        
        const resource = event?.detail?.request?.target?.resource
          || event?.detail?.request?.target?.container?.resource
          || event?.detail?.request?.to?.container?.resource;

        if (!resource) {
          console.log('[EditorSupport] ⚠️ No resource in event, ignoring');
          return;
        }
        
        console.log('[EditorSupport] Resource:', resource);

        if (recentlyHandled.has(resource)) {
          console.log(`[EditorSupport] ⏭ Ignoring duplicate event for resource: ${resource}`);
          return;
        }

        console.log('[EditorSupport] Adding resource to recently handled set');
        recentlyHandled.add(resource);
        setTimeout(() => {
          recentlyHandled.delete(resource);
          console.log('[EditorSupport] 🧹 Removed resource from recently handled set:', resource);
        }, 100); // allow retry after 100ms

        console.log(`[EditorSupport] ⚙️ Starting to handle event for: ${resource}`);
        event.stopPropagation();
        
        const applied = await applyChanges(event);
        
        if (!applied) {
          console.log('[EditorSupport] ❌ Changes could not be applied, reloading page...');
          window.location.reload();
        } else {
          console.log('[EditorSupport] ✅ Event handled successfully');
        }
        
        console.log('[EditorSupport] ========================================');
      });
    });
    
  console.log('[EditorSupport] ✅ All event listeners attached successfully');
}

console.log('[EditorSupport] 🚀 Editor Support module loaded');
console.log('[EditorSupport] Looking for main element...');
const mainElement = document.querySelector('main');
console.log('[EditorSupport] Main element:', mainElement ? 'found' : 'not found');
attachEventListners(mainElement);


/**
 * Decorates a block.
 * @param {Element} block The block element
 */
function decorateReferences(block) {
  console.log('[EditorSupport] 🔗 decorateReferences called');
  console.log('[EditorSupport] Block:', block);
  
  const shortBlockName = block.classList[0];
  console.log('[EditorSupport] Block name:', shortBlockName);
  console.log('[EditorSupport] Block status:', block.dataset.blockStatus);
  
  if (shortBlockName && !block.dataset.blockStatus) {
    console.log('[EditorSupport] ℹ️ Block has name but no status - processing references');
  }
}