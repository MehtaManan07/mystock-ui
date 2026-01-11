import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../stores/notificationStore';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

// Global shortcuts registry
const shortcuts: ShortcutConfig[] = [];

/**
 * Hook to register and handle keyboard shortcuts
 */
export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const notification = useNotification();

  // Navigation shortcuts
  const navigationShortcuts: ShortcutConfig[] = [
    {
      key: 'h',
      alt: true,
      action: () => navigate('/dashboard'),
      description: 'Go to Dashboard',
    },
    {
      key: 'p',
      alt: true,
      action: () => navigate('/products'),
      description: 'Go to Products',
    },
    {
      key: 'c',
      alt: true,
      action: () => navigate('/containers'),
      description: 'Go to Containers',
    },
    {
      key: 'o',
      alt: true,
      action: () => navigate('/contacts'),
      description: 'Go to Contacts',
    },
    {
      key: 't',
      alt: true,
      action: () => navigate('/transactions'),
      description: 'Go to Transactions',
    },
    {
      key: 'm',
      alt: true,
      action: () => navigate('/payments'),
      description: 'Go to Payments',
    },
    {
      key: 'i',
      alt: true,
      action: () => navigate('/inventory'),
      description: 'Go to Inventory',
    },
    // Quick actions
    {
      key: 's',
      alt: true,
      shift: true,
      action: () => navigate('/transactions/new-sale'),
      description: 'New Sale',
    },
    {
      key: 'b',
      alt: true,
      shift: true,
      action: () => navigate('/transactions/new-purchase'),
      description: 'New Purchase',
    },
    // Help
    {
      key: '/',
      ctrl: true,
      action: () => {
        notification.info('Keyboard shortcuts: Alt+H (Dashboard), Alt+P (Products), Alt+T (Transactions), Alt+Shift+S (New Sale)');
      },
      description: 'Show shortcuts help',
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const allShortcuts = [...navigationShortcuts, ...shortcuts];

      for (const shortcut of allShortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = !!shortcut.shift === event.shiftKey;
        const altMatch = !!shortcut.alt === event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [navigate, location, notification]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: [...navigationShortcuts, ...shortcuts],
  };
};

/**
 * Hook to register a custom shortcut for a specific page
 */
export const usePageShortcut = (
  key: string,
  action: () => void,
  options?: { ctrl?: boolean; shift?: boolean; alt?: boolean }
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const keyMatch = event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = !!options?.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = !!options?.shift === event.shiftKey;
      const altMatch = !!options?.alt === event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, action, options]);
};
