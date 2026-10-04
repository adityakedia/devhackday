# Taiwan souvenir collection — Series 01–04

Forty-three original, procedurally modeled Three.js objects for Combo. Open `/souvenirs` for the focused asset viewer; the root page opens the journey interface. This is an asset collection, not the complete discovery/basket product.

## Objects

| ID | Object | Source file |
| --- | --- | --- |
| yingge-tea-cup | Blue-and-white cup, tea, and saucer | tea-food.ts |
| gongfu-teapot | Clay teapot with spout, lid, and handle | tea-food.ts |
| pineapple-cake | Cut pineapple cake and paper wrapper | tea-food.ts |
| bubble-tea | Milk tea, pearls, sealed lid, and straw | tea-food.ts |
| jiufen-lantern | Ribbed red lantern with tassel | crafts.ts |
| pingxi-sky-lantern | Paper wish lantern with bamboo opening | crafts.ts |
| meinong-umbrella | Painted oil-paper umbrella with bamboo ribs | crafts.ts |
| temple-pouch | Embroidered peace keepsake with cord | crafts.ts |
| rail-ticket | Curved, punched souvenir ticket | travel-objects.ts |
| alishan-train | Forest railway miniature on display track | travel-objects.ts |
| blue-flip-flops | Pair of textured blue-and-white slippers | travel-objects.ts |
| market-bag | Open striped woven shopping bag | travel-objects.ts |
| dumpling-steamer | Pleated dumplings in a bamboo steamer | food-series-two.ts |
| beef-noodles | Ceramic bowl of noodles, broth, and toppings | food-series-two.ts |
| mango-ice | Shaved ice with mango and milk accents | food-series-two.ts |
| oolong-tin | Illustrated metal tea tin and loose leaves | food-series-two.ts |
| jade-pendant | Green decorative pendant with knotted red cord | craft-series-two.ts |
| yingge-ocarina | Celadon ceramic instrument | craft-series-two.ts |
| bamboo-fan | Pleated landscape fan with bamboo ribs | craft-series-two.ts |
| floral-purse | Flower-cloth pouch with zipper and stitching | craft-series-two.ts |
| taipei-tower | Taipei 101-inspired architectural miniature | travel-series-two.ts |
| city-scooter | Original city scooter miniature | travel-series-two.ts |
| travel-camera | Vintage film camera with layered lens | travel-series-two.ts |
| taiwan-postcards | Illustrated curved postcard stack | travel-series-two.ts |

| papaya-milk | A sunny little sip — Printed retro glass and creamy foam, Papaya wedge with individual seeds, Textured cork coaster | drinks-series-three.ts |
| winter-melon-tea | Cool down, keep wandering — Hollow translucent cup, Separate ice cubes and straw, Original illustrated drink label | drinks-series-three.ts |
| cold-oolong | Mountains in a bottle — Glass bottle with ridged screw cap, Original mountain label, Ceramic tasting cup | drinks-series-three.ts |
| plum-juice | A sweet and sour afternoon — Fluted glass and translucent juice, Individual ice cubes, Dried plums and citrus garnish | drinks-series-three.ts |
| gua-bao | A bun full of stories — Sculpted folded bun, Separate pork and fat layers, Peanuts, pickles, and coriander | food-series-three.ts |
| taro-bowl | Meet me at the dessert shop — Hollow glazed ceramic bowl, Individual taro and sweet potato pieces, Red beans and metal spoon | food-series-three.ts |
| oyster-omelette | One more night-market stop — Irregular browned egg surface, Sculpted oysters and leafy greens, Starch patches and sauce ribbons | food-series-three.ts |
| scallion-pancake | Follow the smell of the griddle — Six separate cut wedges, Layered pastry edges, Browned surface, scallions, and crumbs | food-series-three.ts |
| memorial-hall | Under the blue roof — Curved double octagonal roofs, Stepped podium and staircase, Arched entrance and gold finial | landmarks-series-three.ts |
| fort-san-domingo | Red walls by the river — Locally drawn weathered brickwork, Arched openings and window bars, Crenellations and corner towers | landmarks-series-three.ts |
| queens-head | A shape made by the sea — Asymmetric sculpted crown and neck, Honeycomb sandstone texture, Irregular rocky display base | landmarks-series-three.ts |
| longshan-gate | Pause at the temple gate — Curved tile roofs and red columns, Paired ridge dragons and brackets, Original Chinese name board | landmarks-series-three.ts |

| ceramic-wind-bell | A breeze from the pottery town — Hollow decorated porcelain bell, Suspension cord and internal clapper, Dangling paper windcatcher | hanging-crafts.ts |
| woven-fish-charm | Carry a little abundance — Textured woven body and sculpted fins, Detailed eyes and tail, Hanging loop and strand tassel | hanging-crafts.ts |
| chinese-knot | A knot for the journey — Interwoven three-dimensional cords, Gold bead and hanging loop, Individual tassel strands | hanging-crafts.ts |
| bamboo-chime | Bring a little breeze home — Hollow bamboo tubes of different lengths, Canopy and suspension cords, Central clapper and windcatcher | hanging-crafts.ts |
| taiwan-island-charm | An island to carry close — Thick island silhouette, Gold edge and raised mountain details, Metal bail, red cord, and tassel | hanging-keepsakes.ts |
| mini-lantern-charm | A little light for the road — Hexagonal frame and decorated paper panels, Detailed roof and open bottom, Hanging loop and tassel | hanging-keepsakes.ts |
| taiwan-black-bear-charm | A mountain friend — Sculpted ears, muzzle, and paws, Raised cream V chest marking, Brass bail and cord loop | hanging-keepsakes.ts |

## Use

`apps/combo/src/souvenirs/catalog.ts` provides names, descriptions, IDs, and a `create()` function for each object. Each factory returns a new `THREE.Group`. Geometry, materials, and textures belong to that group; dispose them when removing it. The existing viewer handles this lifecycle.

Factories generate deterministic canvas textures locally. They require a browser DOM and should be invoked after mounting, not during server rendering. No remote texture downloads or copied third-party meshes are used. Chinese lettering uses the device’s available Chinese fonts.

The viewer normalizes each object’s largest dimension to 2.5 scene units and places its base above the shadow plane. The lighting uses a locally generated room environment, warm key light, and cool rim light. Drag to orbit, scroll/pinch to zoom, or reset the camera.

Series 04 contains seven hanging charms. Catalog entries have `hanging: true`; each factory supplies `group.userData.hangAnchor` as local `[x, y, z]` coordinates at its upper loop. The viewer aligns that point with a small rail and hides the floor for these models. Cords, loops, bails, and tassels are part of the exported asset; the display rail is not. A quality refinement pass adds sculpted silhouettes, raised fish weaving, a compact closed-loop knot, smoother porcelain, shaped bamboo nodes, carved island relief, curved lantern roofing, and sculpted plush details. The hanging view uses a frontal camera and a curved hook below its rail. These are static models with orbit controls; elastic pulling and swing physics are not implemented.

Use **Download 3D object** to export the selected object as a binary `.glb` with embedded textures and materials. Export excludes the viewer’s floor, camera, and lighting. The project currently stores editable factory source rather than pre-exported GLB files. Cloth/paper use double-sided surfaces; these are visual assets rather than watertight manufacturing models.

## References and interpretation

- [Charmling](https://charmling.app/#content): collectible object detail and visual character; no assets copied.
- [Taiwan Tourism Administration souvenirs](https://eng.taiwan.net.tw/m1.aspx?sNo=0029014): tea, ceramics, and pastry inspiration.
- [Taiwan Tourism shopping guide](https://eng.taiwan.net.tw/att/files/%E5%8F%B0%E7%81%A3%E6%97%85%E9%81%8A%E6%8C%87%E5%8D%97_%E8%8B%B1%E6%96%87%E7%89%88_%E6%91%BA%E9%A0%81_%E8%B3%BC%E7%89%A9.pdf): souvenir lantern and painted umbrella inspiration.
- [New Taipei selected souvenirs](https://newtaipei.travel/en/shop/souvenir): Yingge ceramic ocarinas.
- [Taipei food guide](https://www.travel.taipei/file/35630/): dumpling folds and noodle inspiration.

- [Taipei papaya milk](https://www.travel.taipei/en/pictorial/article/24177): local drink inspiration.
- [Memorial Hall architecture](https://www.cksmh.gov.tw/en/cp.aspx?n=6369): roof and architectural reference.
- [Yehliu Geopark](https://newtaipei.travel/en/attractions/detail/111495): Queen’s Head sandstone inspiration.

Objects are artistic studies inspired by Taiwan’s travel culture, not scans or authenticated reproductions. The ticket is explicitly marked as a souvenir and is not valid for travel. The train is an interpreted miniature, not an engineering reconstruction. The temple pouch is decorative, not a consecrated item.

## Verification status

The previous 24-object collection passed approved workspace TypeScript checks and the production build. Series 03 and 04 source has been reviewed; validation of the expanded 43-object collection awaits approval. Individual visual inspection and GLB export checks remain pending. The previous build reported a bundle-size warning.
