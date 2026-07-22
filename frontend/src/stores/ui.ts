import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    darkMode: localStorage.getItem('darkMode') === 'true',
    toastMessage: '' as string,
    toastTimer: 0 as number,
  }),
  actions: {
    applyDarkMode() {
      document.body.classList.toggle('dark-mode', this.darkMode);
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', String(this.darkMode));
      this.applyDarkMode();
    },
    toast(message: string) {
      this.toastMessage = message;
      clearTimeout(this.toastTimer);
      this.toastTimer = window.setTimeout(() => {
        this.toastMessage = '';
      }, 2200);
    },
  },
});
