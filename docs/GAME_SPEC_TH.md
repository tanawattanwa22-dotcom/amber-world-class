# AMBER WORLD CLASS — GAME DESIGN FREEZE (V1)

**ไม่ใช่ 55 AMBERLANDS เวอร์ชันใหม่:** เป็นเกมใหม่ชื่อ AMBER WORLD CLASS อยู่คนละ GitHub Repository, คนละ Supabase Project, คนละ OAuth redirect URI, คนละ hosting และคนละ namespace ตัวละคร / ไอเทม

## Art direction (อิงภาพ 6 ใบที่ผู้ใช้ให้)
- แนวทาง: Fantasy MMORPG 2D Pixel Art แบบ Chibi สีสด แสงเงาและ UI แฟนตาซีสีทอง/น้ำเงิน วาดขึ้นใหม่ทุกชิ้น
- ฉากใช้ tile set และ object sprites แยก ไม่มีการเอาภาพคอลลาจมาตัดใส่ฉากหรือเกม
- 8 ทิศ (Down, Down-Left, Left, Up-Left, Up, Up-Right, Right, Down-Right), เพิ่มเฟรม Idle/Walk/Attack/Cast/Hurt/Die
- Character layers: body, face, hair, upper/lower clothes, gloves, shoes, equipped weapon, glow, wings; anchor อาวุธติดมือทุกทิศ; ไม่ใช้ภาพดาบลอยหรือ sprite กรอบสี่เหลี่ยม
- เอฟเฟกต์สกิลเป็นชุด sprite sheet มี metadata (frame width/height, margin/gap, anchor, ms per frame), ภาพพื้นหลังโปร่งใส
- รองรับมือถือแนวตั้ง/แนวนอน, UI ไม่บังตัวละคร, สัมผัส joystick+attack+skills+auto

## Player design
- Level cap = 100
- Class Novice LV1–9; change at LV10 to Sword / Archer / Mage / Fighter
- ทุกอาชีพมี POW / DEX / INT = 3 เส้นทาง, เส้นทางละ 10 สกิล -> 4 × 3 × 10 = **120 สกิล**
- 5 stat points per level, STR/DEX/INT/POW/VIT; ห้ามเชื่อ stat/damage ที่ส่งจาก browser
- Server-authoritative: EXP, gold, gems, HP/MP, level, skill, move, cooldown, drop rolls, equip, refine, trade, boss contribution

## Map / monster plan
| ID | แผนที่ | เลเวลแนะนำ | มอนสเตอร์เป้าหมาย | บอส |
|---|---|---|---:|---|
| 01 | หมู่บ้านอำพัน | 1–10 | 5 | ราชาสไลม์ |
| 02 | ป่ามรกต | 5–15 | 5 | จอมไม้โบราณ |
| 03 | ทุ่งสายลม | 10–25 | 5 | ราชาอินทรีสายฟ้า |
| 04 | นครหินผา | 20–35 | 5 | ผู้พิทักษ์หินผา |
| 05 | ทะเลทรายเพลิง | 30–45 | 5 | ฟาโรห์ทราย |
| 06 | ภูเขาหิมะ | 40–60 | 5 | มังกรน้ำแข็ง |
| 07 | หุบเขามังกร | 55–80 | 5 | มังกรเพลิงอัคคี |
| 08 | นครรัตติกาล | 70–100 | 5 | ราชินีรัตติกาล |
| 09 | ดินแดนสวรรค์ | 80+ | 4 | เทพธิดาแห่งแสง |
| 10 | ป้อมจอมมาร | 100 | 4 | จอมมารอมตะ |

**Total monsters: 48 unique enemy assets + 10 unique bosses.** Currently prototype only has ten reusable enemy archetype sprites and one prototype boss entity per map. Must finish 48 unique designs before final release.

## Feature ownership and future work

| Feature | Client | Server | Stage |
|---|---|---|---|
| 8-direction player movement | render + input | speed-limit authoritative | V0.1 foundation |
| HP/MP, attack, skill, monsters | render + input | damage/cooldown/XP | V0.1 foundation |
| Character auth | Google OAuth UI | token verification | V0.1 foundation (needs provisioning) |
| Party / shared EXP | UI pending | party membership and reward split | planned |
| Card collection bonus | inventory UI pending | bonuses from owned cards | planned |
| Gear / refine +0..+10 | visual layers pending | atomic refine success and currency cost | planned |
| Pets and hunger | sprites pending | persistent stats and buff computation | planned |
| Market, trade, auctions | UI pending | atomic transactions + ownership | planned |
| Guilds + Guild War | UI pending | combat matchmaking + seasons | planned |
| Dungeon/world bosses | instanced UI pending | authorized damage contribution | planned |
| Ranked leaderboards | HUD pending | aggregates from server events | planned |

## Production-release security gates
1. New repo and new Supabase ref verified; explicit deploy audit must ensure old IDs are not present.
2. No service key shipped to browser. RLS on all exposed tables, absence of direct character write policies.
3. All reward and economic transitions atomic server transactions or trusted locked RPC; no concurrent double reward.
4. Server controls physics/pathfinding/collision/mob AI and ability target validation.
5. Server backpressure, rate limits, transport TLS, session revocation, reconnect replay protection, item and trade audit.
6. Test under concurrent players and unreliable Android mobile networks before calling it production-ready.