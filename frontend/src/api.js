// One small helper for every call to the backend.
// "credentials: include" sends the login cookie with each request.

async function request(method, path, body, extraHeaders) {
  const options = { method: method, credentials: 'include', headers: {} };
  if (extraHeaders) {
    Object.assign(options.headers, extraHeaders);
  }
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch('/api' + path, options);

  // Some answers have no body, so reading JSON can fail.
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const info = data && data.error ? data.error : {};
    const error = new Error(info.message || 'Request failed');
    error.status = response.status;
    error.code = info.code;
    error.details = info.details;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body, headers) => request('POST', path, body === undefined ? {} : body, headers),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};

// Turns an error into text for the screen, including field problems from validation.
export function errorText(error) {
  let text = error.message;
  if (Array.isArray(error.details)) {
    const lines = error.details.map((item) => item.field + ': ' + item.message);
    text = text + ' (' + lines.join('; ') + ')';
  }
  return text;
}
