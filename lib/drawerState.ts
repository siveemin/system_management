let _open = false;
const listeners: Array<() => void> = [];

export const drawerState = {
  isOpen: () => _open,
  open:   () => { _open = true;  listeners.forEach((l) => l()); },
  close:  () => { _open = false; listeners.forEach((l) => l()); },
  toggle: () => { _open = !_open; listeners.forEach((l) => l()); },
  subscribe: (fn: () => void) => {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i > -1) listeners.splice(i, 1);
    };
  },
};
