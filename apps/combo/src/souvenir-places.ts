export type Place = {
  name: string;
  area: string;
  description: string;
  url: string;
};

// Exploration suggestions, linked to official tourism information.
const places = {
  yingge: {
    name: "Yingge Old Street", area: "Yingge · New Taipei",
    description: "Follow the pottery streets through ceramic shops, tea sets, and handmade keepsakes.",
    url: "https://newtaipei.travel/en/attractions/detail/112334",
  },
  ceramics: {
    name: "Yingge Ceramics Museum", area: "Yingge · New Taipei",
    description: "Explore the craft and history behind Taiwan’s ceramic objects.",
    url: "https://newtaipei.travel/en/attractions/detail/111459",
  },
  maokong: {
    name: "Maokong", area: "Wenshan · Taipei",
    description: "Take the tea ritual into the hills, among tea-growing slopes, trails, and teahouses.",
    url: "https://travel.taipei/en/pictorial/article/67812",
  },
  jiufen: {
    name: "Jiufen Old Street", area: "Ruifang · New Taipei",
    description: "Explore hillside lanes, warm evening lights, teahouses, and traditional snacks such as taro balls.",
    url: "https://newtaipei.travel/en/Attractions/Detail/112939",
  },
  shifen: {
    name: "Shifen Old Street", area: "Pingxi · New Taipei",
    description: "Discover a railway town where sky-lantern shops and little eateries sit beside the tracks.",
    url: "https://newtaipei.travel/en/attractions/detail/111989",
  },
  meinong: {
    name: "Meinong Paper Umbrella Culture Village", area: "Meinong · Kaohsiung",
    description: "See paper-umbrella making and explore the crafts of this Hakka community.",
    url: "https://khh.travel/en/attractions/detail/387/",
  },
  longshan: {
    name: "Longshan Temple", area: "Wanhua · Taipei",
    description: "Pause among ornate roofs, ceramic decoration, and the courtyards of a living temple.",
    url: "https://travel.taipei/en/attraction/details/487",
  },
  alishan: {
    name: "Alishan Forest Railway", area: "Chiayi · Alishan",
    description: "Follow the story of the red railway through mountain landscapes and forest.",
    url: "https://eng.taiwan.net.tw/m1.aspx?id=250&sNo=0002117",
  },
  dihua: {
    name: "Dihua Street", area: "Dadaocheng · Taipei",
    description: "Wander heritage shopfronts for tea, traditional pastries, fabrics, and little gifts.",
    url: "https://www.travel.taipei/en/pictorial/article/64884",
  },
  yongle: {
    name: "Yongle Fabric Market", area: "Dadaocheng · Taipei",
    description: "Explore colorful fabrics and sewing accessories, with traditional food in the surrounding lanes.",
    url: "https://travel.taipei/en/attraction/details/1697",
  },
  yongkang: {
    name: "Yongkang Street", area: "Dongmen · Taipei",
    description: "A neighborhood for soup dumplings, beef noodles, mango shaved ice, and scallion pancakes.",
    url: "https://travel.taipei/en/media/audio-guide/details/231",
  },
  gongguan: {
    name: "Gongguan Shopping District", area: "Gongguan · Taipei",
    description: "Browse the university neighborhood’s restaurants, cafés, and hand-shaken drink shops.",
    url: "https://travel.taipei/en/attraction/details/2419",
  },
  ningxia: {
    name: "Ningxia Night Market", area: "Datong · Taipei",
    description: "Follow your appetite through a compact collection of traditional Taiwanese snack stalls.",
    url: "https://www.travel.taipei/en/attraction/details/1689",
  },
  raohe: {
    name: "Raohe Street Night Market", area: "Songshan · Taipei",
    description: "Explore street-food stalls, including beef noodles, steamed buns, and cold drinks.",
    url: "https://travel.taipei/en/attraction/details/1691",
  },
  shilin: {
    name: "Shilin Night Market", area: "Shilin · Taipei",
    description: "A lively place to explore oyster omelets, scallion pancakes, shaved ice, and other street snacks.",
    url: "https://www.travel.taipei/en/attraction/details/1692",
  },
  jade: {
    name: "Jianguo Holiday Jade Market", area: "Da’an · Taipei",
    description: "Browse jade, gemstones, antiques, and decorative knot accessories beneath the elevated road.",
    url: "https://www.travel.taipei/en/attraction/details/2022",
  },
  tower: {
    name: "Taipei 101", area: "Xinyi · Taipei",
    description: "Find the skyline landmark behind this miniature and look out across the Taipei Basin.",
    url: "https://eng.taiwan.net.tw/m1.aspx?id=3469&sno=0002016",
  },
  memorial: {
    name: "Chiang Kai-shek Memorial Hall", area: "Zhongzheng · Taipei",
    description: "Explore the white memorial, its blue roof, and the broad public plaza around it.",
    url: "https://travel.taipei/en/attraction/details/445",
  },
  fort: {
    name: "Fort San Domingo", area: "Tamsui · New Taipei",
    description: "Explore the historic fort and former consulate, with views toward the Tamsui River.",
    url: "https://newtaipei.travel/en/attractions/detail/111530",
  },
  yehliu: {
    name: "Yehliu Geopark", area: "Wanli · New Taipei",
    description: "Meet the Queen’s Head in its coastal setting among rocks shaped by weathering and the sea.",
    url: "https://newtaipei.travel/en/attractions/detail/111495",
  },
  ruifang: {
    name: "Ruifang & Houtong", area: "Ruifang · New Taipei",
    description: "Explore railway villages and local food keepsakes, including Houtong’s cat-shaped pineapple cakes.",
    url: "https://newtaipei.travel/en/regional/sightseeing/32",
  },
} satisfies Record<string, Place>;

const souvenirPlaces: Record<string, Place[]> = {
  "yingge-tea-cup": [places.yingge, places.ceramics],
  "gongfu-teapot": [places.maokong, places.jiufen],
  "pineapple-cake": [places.dihua, places.ruifang],
  "bubble-tea": [places.gongguan, places.raohe],
  "jiufen-lantern": [places.jiufen, places.shifen],
  "pingxi-sky-lantern": [places.shifen, places.jiufen],
  "meinong-umbrella": [places.meinong],
  "temple-pouch": [places.longshan, places.jade],
  "rail-ticket": [places.shifen, places.alishan],
  "alishan-train": [places.alishan, places.shifen],
  "blue-flip-flops": [places.gongguan, places.dihua],
  "market-bag": [places.yongle, places.dihua],
  "dumpling-steamer": [places.yongkang, places.raohe],
  "beef-noodles": [places.yongkang, places.raohe],
  "mango-ice": [places.yongkang, places.shilin],
  "oolong-tin": [places.maokong, places.dihua],
  "jade-pendant": [places.jade],
  "yingge-ocarina": [places.yingge, places.ceramics],
  "bamboo-fan": [places.yongle, places.jiufen],
  "floral-purse": [places.yongle, places.dihua],
  "taipei-tower": [places.tower, places.memorial],
  "city-scooter": [places.gongguan, places.dihua],
  "travel-camera": [places.jiufen, places.tower],
  "taiwan-postcards": [places.shifen, places.jiufen],
  "papaya-milk": [places.gongguan, places.raohe],
  "winter-melon-tea": [places.gongguan, places.raohe],
  "cold-oolong": [places.maokong, places.dihua],
  "plum-juice": [places.gongguan, places.raohe],
  "gua-bao": [places.gongguan, places.ningxia],
  "taro-bowl": [places.jiufen, places.ningxia],
  "oyster-omelette": [places.shilin, places.ningxia],
  "scallion-pancake": [places.yongkang, places.shilin],
  "memorial-hall": [places.memorial, places.yongkang],
  "fort-san-domingo": [places.fort],
  "queens-head": [places.yehliu],
  "longshan-gate": [places.longshan],
  "ceramic-wind-bell": [places.yingge, places.ceramics],
  "woven-fish-charm": [places.yongle, places.jade],
  "chinese-knot": [places.jade, places.longshan],
  "bamboo-chime": [places.meinong, places.yingge],
  "taiwan-island-charm": [places.yehliu, places.alishan],
  "mini-lantern-charm": [places.jiufen, places.shifen],
  "taiwan-black-bear-charm": [places.alishan],
};

export function getSouvenirPlaces(id: string): Place[] {
  return souvenirPlaces[id] ?? [];
}
