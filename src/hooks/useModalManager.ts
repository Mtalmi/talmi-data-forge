import { useState, useCallback } from 'react';

type ModalId = string | null;

/**
 * Global-ish modal state manager — ensures only one modal is open at a time.
 * Use at the layout or page level, pass down via context or props.
 *
 * @example
 * const modal = useModalManager();
 * modal.open('nouveau-devis');  // closes any currently open modal first
 * modal.isOpen('nouveau-devis'); // true
 * modal.close(); // closes whatever is open
 */
export function useModalManager() {
  const [activeModal, setActiveModal] = useState<ModalId>(null);

  const open = useCallback((id: string) => {
    setActiveModal(id);
  }, []);

  const close = useCallback(() => {
    setActiveModal(null);
  }, []);

  const isOpen = useCallback((id: string) => {
    return activeModal === id;
  }, [activeModal]);

  const toggle = useCallback((id: string) => {
    setActiveModal(prev => (prev === id ? null : id));
  }, []);

  return { activeModal, open, close, isOpen, toggle };
}
