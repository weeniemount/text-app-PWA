class PWAAdapter {
  constructor() {
    this.windows = [];
    this.fileHandles = new Map();
    this.storageListeners = [];
    this.initChromePolyfills();
    this.initServiceWorker();
    this.initFileHandling();
  }

  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('./service-worker.js');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  initFileHandling() {
    if ('launchQueue' in window) {
      window.launchQueue.setConsumer(async (launchParams) => {
        if (launchParams.files && launchParams.files.length) {
          const fileHandles = await Promise.all(
            launchParams.files.map(f => f.getFile())
          );
          this.openFiles(fileHandles);
        }
      });
    }
  }

  initChromePolyfills() {
    if (typeof chrome === 'undefined') {
      window.chrome = {};
    }

    if (!chrome.i18n) {
      const self = this;
      chrome.i18n = {
        getMessage: (messageName, substitutions) => {
          const locale = navigator.language.replace('-', '_');
          const messages = self.loadMessages(locale);
          
          if (messages && messages[messageName]) {
            let message = messages[messageName].message;
            
            if (substitutions) {
              if (!Array.isArray(substitutions)) {
                substitutions = [substitutions];
              }
              substitutions.forEach((sub, index) => {
                message = message.replace('$' + (index + 1), sub);
              });
            }
            
            return message;
          }
          
          return messageName;
        },
        getUILanguage: () => navigator.language
      };
    }

    if (!chrome.storage) {
      chrome.storage = {
        local: this.createStorageArea('local'),
        sync: this.createStorageArea('sync'),
        onChanged: {
          addListener: (callback) => {
            this.storageListeners.push(callback);
          },
          removeListener: (callback) => {
            const index = this.storageListeners.indexOf(callback);
            if (index > -1) {
              this.storageListeners.splice(index, 1);
            }
          }
        }
      };
    }

    if (!chrome.runtime) {
      chrome.runtime = {
        lastError: null,
        getBackgroundPage: (callback) => {
          const mockBackground = {
            background: {
              onWindowReady: (textApp) => {
                setTimeout(() => {
                  if (textApp.tabs_ && !textApp.tabs_.hasOpenTab()) {
                    textApp.tabs_.newTab();
                  }
                }, 100);
              },
              newWindow: () => {
                window.open(window.location.href, '_blank');
              },
              copyFileEntry: (entry, callback) => {
                callback(entry);
              }
            }
          };
          setTimeout(() => callback(mockBackground), 0);
        },
        onInstalled: {
          addListener: (callback) => {
            if (!localStorage.getItem('pwa-installed')) {
              localStorage.setItem('pwa-installed', 'true');
              setTimeout(() => callback({ reason: 'install' }), 0);
            }
          }
        }
      };
    }
  }

  createStorageArea(areaName) {
    const prefix = 'chrome-storage-' + areaName + '-';
    const self = this;
    
    return {
      get: (keys, callback) => {
        const result = {};
        
        if (keys === null || keys === undefined) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
              const actualKey = key.substring(prefix.length);
              try {
                result[actualKey] = JSON.parse(localStorage.getItem(key));
              } catch (e) {
                result[actualKey] = localStorage.getItem(key);
              }
            }
          }
        } else if (typeof keys === 'string') {
          keys = [keys];
        } else if (typeof keys === 'object' && !Array.isArray(keys)) {
          const defaultValues = keys;
          keys = Object.keys(defaultValues);
          keys.forEach(key => {
            result[key] = defaultValues[key];
          });
        }
        
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            const value = localStorage.getItem(prefix + key);
            if (value !== null) {
              try {
                result[key] = JSON.parse(value);
              } catch (e) {
                result[key] = value;
              }
            }
          });
        }
        
        setTimeout(() => callback(result), 0);
      },
      
      set: (items, callback) => {
        const changes = {};
        
        Object.keys(items).forEach(key => {
          const oldValue = localStorage.getItem(prefix + key);
          const newValue = items[key];
          
          localStorage.setItem(prefix + key, JSON.stringify(newValue));
          
          changes[key] = {
            oldValue: oldValue ? JSON.parse(oldValue) : undefined,
            newValue: newValue
          };
        });
        
        self.storageListeners.forEach(listener => {
          listener(changes, areaName);
        });
        
        if (callback) setTimeout(callback, 0);
      },
      
      remove: (keys, callback) => {
        if (typeof keys === 'string') {
          keys = [keys];
        }
        
        keys.forEach(key => {
          localStorage.removeItem(prefix + key);
        });
        
        if (callback) setTimeout(callback, 0);
      },
      
      clear: (callback) => {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        if (callback) setTimeout(callback, 0);
      }
    };
  }

  loadMessages(locale) {
    if (window.i18nMessages && window.i18nMessages[locale]) {
      return window.i18nMessages[locale];
    }
    
    if (window.i18nMessages && window.i18nMessages['en']) {
      return window.i18nMessages['en'];
    }
    
    return {};
  }

  openFiles(files) {
    if (window.textApp && window.textApp.tabs_) {
      files.forEach(file => {
        window.textApp.tabs_.openFile(file);
      });
    }
  }

  async openFilePicker(options = {}) {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description: 'Text Files',
          accept: {
            'text/*': ['.txt', '.md', '.js', '.json', '.html', '.css', '.xml']
          }
        }]
      });
      return fileHandle;
    } catch (err) {
      console.log('User cancelled file picker');
      return null;
    }
  }

  async saveFilePicker(suggestedName = 'untitled.txt') {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName,
        types: [{
          description: 'Text Files',
          accept: {
            'text/*': ['.txt', '.md', '.js', '.json', '.html', '.css', '.xml']
          }
        }]
      });
      return fileHandle;
    } catch (err) {
      console.log('User cancelled save picker');
      return null;
    }
  }

  async readFile(fileHandle) {
    const file = await fileHandle.getFile();
    return await file.text();
  }

  async writeFile(fileHandle, contents) {
    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
  }
}

window.pwaAdapter = new PWAAdapter();
