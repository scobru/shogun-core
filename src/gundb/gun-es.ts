// Import Gun and SEA FIRST - extensions depend on Gun.chain being defined
import Gun from 'gun';
import 'gun/sea';

// Now import Gun extensions - they can safely access Gun.chain
import 'gun/lib/then.js';
import 'gun/lib/radix.js';
import 'gun/lib/radisk.js';
import 'gun/lib/store.js';
import 'gun/lib/rindexed.js';
import 'gun/lib/webrtc.js';

export { Gun };
export { default as SEA } from 'gun/sea';
