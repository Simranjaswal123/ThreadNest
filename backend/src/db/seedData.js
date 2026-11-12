// Demo data for seed.js. Only data here, no logic.
// Prices are in paise (1 rupee = 100 paise), so 49900 is shown as Rs 499.00.

export const categories = ['T-shirts', 'Hoodies', 'Caps', 'Tote bags', 'Socks'];

// Only these categories have sizes. All other products have colours only.
export const sizedCategories = ['T-shirts', 'Hoodies'];
export const sizes = ['S', 'M', 'L', 'XL'];

// Short colour codes used inside SKUs, like TN-TSH1-BLK-M.
export const colorCodes = { Black: 'BLK', White: 'WHT', Navy: 'NVY', Grey: 'GRY', Olive: 'OLV', Sand: 'SND', Red: 'RED' };

// Colours of the placeholder pictures (hex without #), picked by each product's first colour.
export const imageColors = {
  Black: { background: '2b2b2b', text: 'ffffff' },
  White: { background: 'f5f5f6', text: '282c3f' },
  Navy: { background: '1f2a44', text: 'ffffff' },
  Grey: { background: 'b8bcc4', text: '282c3f' },
  Olive: { background: '6b7f3a', text: 'ffffff' },
  Sand: { background: 'e3d3b8', text: '282c3f' },
  Red: { background: 'c62828', text: 'ffffff' },
};

// These variants get special stock so we can test "almost sold out" and "sold out".
export const specialStock = { 'TN-TSH1-BLK-XL': 1, 'TN-HOD1-GRY-S': 1, 'TN-CAP1-BLK': 0 };

export const products = [
  { code: 'TSH1', category: 'T-shirts', name: 'Classic Crew Tee', price_cents: 49900, colors: ['Black', 'White'] },
  { code: 'TSH2', category: 'T-shirts', name: 'V-Neck Tee', price_cents: 44900, colors: ['Navy', 'White'] },
  { code: 'TSH3', category: 'T-shirts', name: 'Pocket Tee', price_cents: 52900, colors: ['Grey', 'Black'] },
  { code: 'TSH4', category: 'T-shirts', name: 'Long Sleeve Tee', price_cents: 59900, colors: ['Black', 'Sand'] },
  { code: 'TSH5', category: 'T-shirts', name: 'Striped Tee', price_cents: 54900, colors: ['Navy', 'White'] },
  { code: 'TSH6', category: 'T-shirts', name: 'Oversized Tee', price_cents: 57900, colors: ['Olive', 'Black'] },
  { code: 'HOD1', category: 'Hoodies', name: 'Pullover Hoodie', price_cents: 119900, colors: ['Grey', 'Navy'] },
  { code: 'HOD2', category: 'Hoodies', name: 'Zip Hoodie', price_cents: 129900, colors: ['Black', 'Grey'] },
  { code: 'HOD3', category: 'Hoodies', name: 'Fleece Hoodie', price_cents: 149900, colors: ['Navy', 'Olive'] },
  { code: 'HOD4', category: 'Hoodies', name: 'Cropped Hoodie', price_cents: 109900, colors: ['Sand', 'Black'] },
  { code: 'HOD5', category: 'Hoodies', name: 'Heavyweight Hoodie', price_cents: 169900, colors: ['Black', 'Grey'] },
  { code: 'HOD6', category: 'Hoodies', name: 'Lightweight Hoodie', price_cents: 94900, colors: ['Navy', 'Sand'] },
  { code: 'CAP1', category: 'Caps', name: 'Baseball Cap', price_cents: 39900, colors: ['Black', 'Navy'] },
  { code: 'CAP2', category: 'Caps', name: 'Dad Cap', price_cents: 34900, colors: ['Sand', 'Olive'] },
  { code: 'CAP3', category: 'Caps', name: 'Bucket Hat', price_cents: 44900, colors: ['Black', 'Sand'] },
  { code: 'CAP4', category: 'Caps', name: 'Snapback Cap', price_cents: 49900, colors: ['Red', 'Black'] },
  { code: 'CAP5', category: 'Caps', name: 'Beanie', price_cents: 29900, colors: ['Grey', 'Black'] },
  { code: 'CAP6', category: 'Caps', name: 'Trucker Cap', price_cents: 37900, colors: ['Navy', 'White'] },
  { code: 'TOT1', category: 'Tote bags', name: 'Canvas Tote', price_cents: 29900, colors: ['Sand'] },
  { code: 'TOT2', category: 'Tote bags', name: 'Mini Tote', price_cents: 24900, colors: ['Black'] },
  { code: 'TOT3', category: 'Tote bags', name: 'Market Tote', price_cents: 34900, colors: ['Olive'] },
  { code: 'TOT4', category: 'Tote bags', name: 'Zip Tote', price_cents: 39900, colors: ['Navy'] },
  { code: 'TOT5', category: 'Tote bags', name: 'Denim Tote', price_cents: 44900, colors: ['Navy'] },
  { code: 'TOT6', category: 'Tote bags', name: 'Striped Tote', price_cents: 32900, colors: ['White'] },
  { code: 'SOC1', category: 'Socks', name: 'Crew Socks', price_cents: 19900, colors: ['White', 'Black'] },
  { code: 'SOC2', category: 'Socks', name: 'Ankle Socks', price_cents: 17900, colors: ['White', 'Grey'] },
  { code: 'SOC3', category: 'Socks', name: 'Sport Socks', price_cents: 24900, colors: ['Black'] },
  { code: 'SOC4', category: 'Socks', name: 'Wool Socks', price_cents: 29900, colors: ['Grey', 'Olive'] },
  { code: 'SOC5', category: 'Socks', name: 'Knee Socks', price_cents: 21900, colors: ['Navy'] },
  { code: 'SOC6', category: 'Socks', name: 'Striped Socks', price_cents: 22900, colors: ['Red'] },
];
