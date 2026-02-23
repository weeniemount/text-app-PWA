(function() {
  const enMessages = {
    "appDesc": { "message": "A text editor for the web." },
    "fileMenuNew": { "message": "New" },
    "fileMenuOpen": { "message": "Open" },
    "fileMenuSave": { "message": "Save" },
    "fileMenuSaveas": { "message": "Save as" },
    "menuSettings": { "message": "Settings" },
    "menuShortcuts": { "message": "Keyboard shortcuts" },
    "fontsizeSetting": { "message": "Font size" },
    "fontsizeTooltip": { "message": "Set with Ctrl- and Ctrl+" },
    "spacestabSetting": { "message": "Tabs to spaces" },
    "tabsizeSetting": { "message": "Tab size" },
    "wraplinesSetting": { "message": "Wrap lines" },
    "linenumbersSetting": { "message": "Show line numbers" },
    "smartindentSetting": { "message": "Smart indent" },
    "themeSetting": { "message": "Themes" },
    "alwaysOnTopSetting": { "message": "Always on top" },
    "deviceThemeOption": { "message": "Use device theme" },
    "lightThemeOption": { "message": "Light" },
    "darkThemeOption": { "message": "Dark" },
    "helpSection": { "message": "Help" },
    "closeSettings": { "message": "Back" },
    "openSidebarButton": { "message": "Open sidebar" },
    "closeSidebarButton": { "message": "Close sidebar" },
    "searchPlaceholder": { "message": "Find..." },
    "searchCounting": { "message": "$1 of $2" },
    "searchNextButton": { "message": "Next" },
    "searchPreviousButton": { "message": "Previous" },
    "errorTitle": { "message": "Error" },
    "loadingTitle": { "message": "Loading..." },
    "minimizeButton": { "message": "Minimize" },
    "maximizeButton": { "message": "Maximize" },
    "restoreButton": { "message": "Restore" },
    "closeButton": { "message": "Quit" },
    "yesDialogButton": { "message": "Yes" },
    "noDialogButton": { "message": "No" },
    "cancelDialogButton": { "message": "Cancel" },
    "saveFilePromptLine1": { "message": "$1 has been modified." },
    "saveFilePromptLine2": { "message": "Do you want to save it before closing?" },
    "okDialogButton": { "message": "OK" },
    "closeFileButton": { "message": "Close file" }
  };

  window.i18nMessages = {
    'en': enMessages,
    'en_US': enMessages,
    'en_GB': enMessages
  };

  const userLocale = navigator.language.replace('-', '_');
  const baseLocale = userLocale.split('_')[0];

  async function loadLocaleMessages(locale) {
    try {
      const response = await fetch(`/_locales/${locale}/messages.json`);
      if (response.ok) {
        const messages = await response.json();
        window.i18nMessages[locale] = messages;
        window.i18nMessages[locale.replace('_', '-')] = messages;
        console.log(`Loaded messages for locale: ${locale}`);
        return true;
      }
    } catch (e) {
      return
    }
    return false;
  }

  (async function() {
    let loaded = await loadLocaleMessages(userLocale);
    
    if (!loaded && userLocale !== baseLocale) {
      loaded = await loadLocaleMessages(baseLocale);
    }
    
    window.dispatchEvent(new CustomEvent('i18nMessagesLoaded'));
  })();
})();
