import { writable } from 'svelte/store';

export const downloads_listing = writable(false);
export const downloads_data = writable([]);
export const target_ip = writable(null);