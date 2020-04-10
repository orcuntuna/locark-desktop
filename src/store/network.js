import { writable } from 'svelte/store';

export const status = writable(null);
export const local_ip = writable(null);
export const local_pin = writable(null);