import type { Updater } from '@tanstack/vue-table';
import type { Ref } from 'vue';
export declare function valueUpdater<T>(updaterOrValue: Updater<T>, ref: Ref<T>): void;
