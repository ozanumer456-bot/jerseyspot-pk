export type Product = {
  id: string;
  name: string;
  team: string;
  category: "Club" | "National" | "Retro" | "Training";
  type: "Home" | "Away" | "Third";
  price: number;
  salePrice?: number;
  image: string;
  sizes: string[];
  stock: number;
  description: string;
  isNew?: boolean;
  rating: number;
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&h=500&fit=crop`;

const IMG = {
  realMadrid: u("1522778119026-d647f0596c20"),
  barcelona: u("1606925797300-0b35e9d1794e"),
  psg: u("1518091043644-c1d4457512c6"),
  manUtd: u("1543326727-cf6c39e8f84c"),
  argentina: u("1589487391730-58f20eb2c308"),
  brazil: u("1574629810360-7efbbe195018"),
  pakistan: u("1551698618-1dfe5d97d256"),
  liverpool: u("1508098682722-e99c43a406b2"),
  bayern: u("1560272564-c83b66b1ad12"),
  chelsea: u("1553778263-73a83bab9b0c"),
  retroArg: u("1547347298-4074fc3086f0"),
  training: u("1571019613454-1cb2f99b2d8b"),
};

export const SAMPLE_PRODUCTS: Product[] = [
  { id: "p1", name: "Real Madrid Home 2024", team: "Real Madrid", category: "Club", type: "Home", price: 4500, salePrice: 3499, image: IMG.realMadrid, sizes: ["S","M","L","XL","XXL"], stock: 24, description: "Official-style Real Madrid home kit 2024. Breathable fabric, premium stitching.", isNew: true, rating: 5 },
  { id: "p2", name: "Barcelona Away 2024", team: "Barcelona", category: "Club", type: "Away", price: 4200, salePrice: 3299, image: IMG.barcelona, sizes: ["S","M","L","XL"], stock: 18, description: "FC Barcelona away kit, lightweight dri-fit fabric.", rating: 5 },
  { id: "p3", name: "PSG Home 2024", team: "PSG", category: "Club", type: "Home", price: 4300, image: IMG.psg, sizes: ["M","L","XL","XXL"], stock: 12, description: "Paris Saint-Germain home jersey in iconic navy.", isNew: true, rating: 4 },
  { id: "p4", name: "Man United Third 2024", team: "Manchester United", category: "Club", type: "Third", price: 4100, salePrice: 3199, image: IMG.manUtd, sizes: ["S","M","L","XL"], stock: 20, description: "Manchester United third kit. Classic Red Devils style.", rating: 4 },
  { id: "p5", name: "Pakistan National Team", team: "Pakistan", category: "National", type: "Home", price: 2500, image: IMG.pakistan, sizes: ["S","M","L","XL","XXL"], stock: 50, description: "Pakistan national team jersey — Shaheens pride!", isNew: true, rating: 5 },
  { id: "p6", name: "Argentina World Cup 2022", team: "Argentina", category: "National", type: "Home", price: 3800, salePrice: 2999, image: IMG.argentina, sizes: ["S","M","L","XL"], stock: 30, description: "Champion edition Argentina jersey. Vamos Albiceleste!", rating: 5 },
  { id: "p7", name: "Brazil Home 2024", team: "Brazil", category: "National", type: "Home", price: 3700, image: IMG.brazil, sizes: ["M","L","XL"], stock: 15, description: "Iconic yellow Brazil kit — Samba football.", rating: 4 },
  { id: "p8", name: "Bayern Munich Home", team: "Bayern Munich", category: "Club", type: "Home", price: 4000, salePrice: 3199, image: IMG.bayern, sizes: ["S","M","L","XL","XXL"], stock: 22, description: "Bayern Munich home jersey — German champions style.", rating: 4 },
  { id: "p9", name: "Chelsea Home 2024", team: "Chelsea", category: "Club", type: "Home", price: 3900, image: IMG.chelsea, sizes: ["S","M","L","XL"], stock: 18, description: "Chelsea FC classic blue home kit.", rating: 4 },
  { id: "p10", name: "Liverpool Home 2024", team: "Liverpool", category: "Club", type: "Home", price: 4200, salePrice: 3399, image: IMG.liverpool, sizes: ["M","L","XL","XXL"], stock: 25, description: "Liverpool FC home jersey — You'll Never Walk Alone.", isNew: true, rating: 5 },
  { id: "p11", name: "Argentina Retro 1986", team: "Argentina", category: "Retro", type: "Home", price: 3500, image: IMG.retroArg, sizes: ["M","L","XL"], stock: 10, description: "Legendary 1986 Maradona-era Argentina jersey.", rating: 5 },
  { id: "p12", name: "Pakistan Training Kit", team: "Pakistan", category: "Training", type: "Home", price: 1800, image: IMG.training, sizes: ["S","M","L","XL"], stock: 14, description: "Lightweight training kit — perfect for practice sessions.", rating: 4 },
];

export const TEAMS = ["Real Madrid","Barcelona","PSG","Manchester United","Pakistan","Argentina","Brazil","Bayern Munich","Chelsea","Liverpool"];
export const SIZES = ["S","M","L","XL","XXL"];
export const TYPES = ["Home","Away","Third"];

export const formatPKR = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;
