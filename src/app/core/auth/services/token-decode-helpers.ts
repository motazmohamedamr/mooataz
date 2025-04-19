/* tslint:disable:no-conditional-assignment no-bitwise */

import { AuthEmptyTokenError, AuthInvalidJWTTokenError } from './auth.errors';

export function urlBase64Decode(str: string): string {
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0: {
      break;
    }
    case 2: {
      output += '==';
      break;
    }
    case 3: {
      output += '=';
      break;
    }
    default: {
      throw new Error('Illegal base64url string!');
    }
  }
  return b64DecodeUnicode(output);
}

// base54 decoding from https://github.com/davidchambers/Base64.js
export function b64decode(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';

  str = String(str).replace(/=+$/, '');

  if (str.length % 4 === 1) {
    throw new Error(`'atob' failed: The string to be decoded is not correctly encoded.`);
  }

  for (
    // initialize result and counters
    let bc = 0, bs: any, buffer: any, idx = 0;
    // get next character
    (buffer = str.charAt(idx++));
    // character found in table? initialize bit storage and add its ascii value;
    ~buffer &&
    ((bs = bc % 4 ? bs * 64 + buffer : buffer),
    // and if not first of each 4 characters,
    // convert the first 8 bits to one ascii character
    bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    // try to find character in table (0-63, not found => -1)
    buffer = chars.indexOf(buffer);
  }
  return output;
}

// https://developer.mozilla.org/en/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
export function b64DecodeUnicode(str: any): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(b64decode(str), (c: any) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
}

// JWT decoding
export function decodeJwtPayload(payload: string): any {
  if (!payload || payload.length === 0) {
    throw new AuthEmptyTokenError('Cannot extract from an empty payload.');
  }

  const parts = payload.split('.');

  if (parts.length !== 3) {
    throw new AuthInvalidJWTTokenError(
      `The payload ${payload} is not valid JWT payload and must consist of three parts.`
    );
  }

  let decoded: any;

  try {
    decoded = urlBase64Decode(parts[1]);
  } catch (e) {
    throw new AuthInvalidJWTTokenError(
      `The payload ${payload} is not valid JWT payload and cannot be parsed.`
    );
  }

  if (!decoded) {
    throw new AuthInvalidJWTTokenError(
      `The payload ${payload} is not valid JWT payload and cannot be decoded.`
    );
  }

  return JSON.parse(decoded);
}
