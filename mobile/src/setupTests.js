import '@testing-library/jest-dom/extend-expect';

// Workaround for TextEncoder/TextDecoder in JSDOM for Firebase dependencies
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}
