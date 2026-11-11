// Reads settings from environment variables.
// "node --env-file=../.env" loads the .env file in the project root before we start.

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  shopName: process.env.SHOP_NAME || 'Threadnest',
  // The address of the React dev server. Only this origin may call the API from a browser.
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  // How many login attempts one IP may make in 15 minutes.
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 20,
};

// Stop at startup with a clear message instead of failing later in a strange way.
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is missing. Copy .env.example to .env in the project root.');
}
if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is missing. Copy .env.example to .env in the project root.');
}
