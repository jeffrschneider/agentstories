import { proxy, useSnapshot } from 'valtio';

// Sidebar state
interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
}

// Modal state for various dialogs
interface ModalState {
  newStory: boolean;
  deleteConfirm: boolean;
  exportOptions: boolean;
  templatePicker: boolean;
}

// Editor state
interface EditorState {
  isDirty: boolean;
  activeSection: string | null;
  previewMode: boolean;
}

// Toast notifications
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  sidebar: SidebarState;
  modals: ModalState;
  editor: EditorState;
  toasts: Toast[];
  theme: 'light' | 'dark' | 'system';
}

export const uiStore = proxy<UIState>({
  sidebar: {
    isOpen: true,
    isCollapsed: false,
  },
  modals: {
    newStory: false,
    deleteConfirm: false,
    exportOptions: false,
    templatePicker: false,
  },
  editor: {
    isDirty: false,
    activeSection: null,
    previewMode: false,
  },
  toasts: [],
  theme: 'system',
});

// Actions
export const uiActions = {
  // Sidebar
  toggleSidebar: () => {
    uiStore.sidebar.isOpen = !uiStore.sidebar.isOpen;
  },
  collapseSidebar: () => {
    uiStore.sidebar.isCollapsed = !uiStore.sidebar.isCollapsed;
  },

  // Modals
  openModal: (modal: keyof ModalState) => {
    uiStore.modals[modal] = true;
  },
  closeModal: (modal: keyof ModalState) => {
    uiStore.modals[modal] = false;
  },
  closeAllModals: () => {
    Object.keys(uiStore.modals).forEach((key) => {
      uiStore.modals[key as keyof ModalState] = false;
    });
  },

  // Editor
  setActiveSection: (section: string | null) => {
    uiStore.editor.activeSection = section;
  },
  setDirty: (dirty: boolean) => {
    uiStore.editor.isDirty = dirty;
  },
  togglePreviewMode: () => {
    uiStore.editor.previewMode = !uiStore.editor.previewMode;
  },

  // Toasts
  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    uiStore.toasts.push({ ...toast, id });

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        uiActions.removeToast(id);
      }, duration);
    }

    return id;
  },
  removeToast: (id: string) => {
    const index = uiStore.toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      uiStore.toasts.splice(index, 1);
    }
  },

  // Theme
  setTheme: (theme: UIState['theme']) => {
    uiStore.theme = theme;
  },
};

// Hook for easy access
export function useUI() {
  return useSnapshot(uiStore);
}
