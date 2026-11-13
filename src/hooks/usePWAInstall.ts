import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export interface BrowserInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isChrome: boolean;
  isSafari: boolean;
  isEdge: boolean;
  isFirefox: boolean;
  isSamsungBrowser: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  isInIframe: boolean;
  isInAppBrowser: boolean;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredInstallPrompt) {
      return window.__deferredInstallPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    isAndroid: false,
    isIOS: false,
    isChrome: false,
    isSafari: false,
    isEdge: false,
    isFirefox: false,
    isSamsungBrowser: false,
    isMobile: false,
    isStandalone: false,
    isInIframe: false,
    isInAppBrowser: false
  });

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Browser & Device detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);
    const isMobileDevice = isIOSDevice || isAndroidDevice || /mobile|tablet/.test(ua);
    const isSamsung = /samsungbrowser/.test(ua);
    const isEdgeBrowser = /edg\//.test(ua) || /edga\//.test(ua) || /edgios\//.test(ua);
    const isFirefoxBrowser = /firefox|fxios/.test(ua);
    const isChromeBrowser = (/chrome|crios/.test(ua)) && !isEdgeBrowser && !isSamsung;
    const isSafariBrowser = /safari/.test(ua) && !isChromeBrowser && !isEdgeBrowser && !isSamsung && !isFirefoxBrowser;
    const isInApp = /fban|fbav|instagram|whatsapp|tiktok|bytedance|musical_ly|line|micromessenger|\bwv\b/.test(ua);

    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch {
      inIframe = true;
    }

    setBrowserInfo({
      isAndroid: isAndroidDevice,
      isIOS: isIOSDevice,
      isChrome: isChromeBrowser,
      isSafari: isSafariBrowser,
      isEdge: isEdgeBrowser,
      isFirefox: isFirefoxBrowser,
      isSamsungBrowser: isSamsung,
      isMobile: isMobileDevice,
      isStandalone,
      isInIframe: inIframe,
      isInAppBrowser: isInApp
    });

    // Pick up any prompt captured before React hydrated
    if (window.__deferredInstallPrompt) {
      setDeferredPrompt(window.__deferredInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvt = e as BeforeInstallPromptEvent;
      window.__deferredInstallPrompt = promptEvt;
      setDeferredPrompt(promptEvt);
    };

    const handleEarlyPromptReady = () => {
      if (window.__deferredInstallPrompt) {
        setDeferredPrompt(window.__deferredInstallPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__deferredInstallPrompt = null;
      setShowGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('hanoi-pwa-prompt-ready', handleEarlyPromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('hanoi-pwa-prompt-ready', handleEarlyPromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<'accepted' | 'dismissed' | 'manual_guide'> => {
    const activePrompt = deferredPrompt || window.__deferredInstallPrompt;
    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const { outcome } = await activePrompt.userChoice;
        window.__deferredInstallPrompt = null;
        setDeferredPrompt(null);
        if (outcome === 'accepted') {
          setIsInstalled(true);
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('Error running native install prompt:', err);
        setShowGuide(true);
        return 'manual_guide';
      }
    }

    setShowGuide(true);
    return 'manual_guide';
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS: browserInfo.isIOS,
    browserInfo,
    showGuide,
    setShowGuide,
    install,
    deferredPrompt
  };
}
