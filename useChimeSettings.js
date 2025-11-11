// useChimeSettings.js
import { ref } from 'vue';

// one shared reactive object
const ChimeCallSettings = ref({
  callCamStatus: false,
  callMicStatus: false,
  userAvatarUrl: '',
});

export function useChimeSettings() {
  const set = (key, value) => {
    ChimeCallSettings.value[key] = value;
  };

  const merge = (obj = {}) => {
    Object.assign(ChimeCallSettings.value, obj);
  };

  const get = (key, fallback = undefined) => {
    return ChimeCallSettings.value[key] ?? fallback;
  };

  return { ChimeCallSettings, set, get, merge };
}
