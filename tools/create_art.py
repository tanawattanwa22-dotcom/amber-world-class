from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import random,math,os
R=random.Random(60554)
PROJECT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('AWC_ASSET_DIR', str(PROJECT / 'public' / 'assets')))
OUT.mkdir(parents=True,exist_ok=True)
SZ=576
im=Image.new('RGB',(SZ,SZ),'#245344');d=ImageDraw.Draw(im)

def mix(c1,c2,t):
 c1=tuple(int(c1[i:i+2],16) for i in (1,3,5));c2=tuple(int(c2[i:i+2],16) for i in (1,3,5));return tuple(int(c1[i]*(1-t)+c2[i]*t) for i in range(3))
def poly(p,fill,outline=None,width=1):d.polygon(p,fill=fill);outline and d.line(p+[p[0]],fill=outline,width=width)
def rect(box,fill,outline=None,width=1):d.rectangle(box,fill=fill,outline=outline,width=width)
def line(pts,fill,width=1,joint='curve'):d.line(pts,fill=fill,width=width,joint=joint)
def ellipse(box,fill,outline=None,width=1):d.ellipse(box,fill=fill,outline=outline,width=width)
# base checker foliage with tiny individual blades, flowers and clover
for y in range(0,SZ,4):
 for x in range(0,SZ,4):
  c=R.choice(['#2a6049','#2d6850','#347352','#2a5944','#397452','#20533f','#3c7953']);rect((x,y,x+3,y+3),c)
for i in range(17000):
 x=R.randrange(SZ);y=R.randrange(SZ)
 c=R.choice(['#47885b','#3b8c61','#5c955f','#286444','#1c573f','#639358','#a2a56a']);rect((x,y,x+R.choice([0,0,1]),y+R.choice([0,0,1])),c)
# city roads with precise tiles, stone mosaics and soft contrasting borders
rect((224,0,348,575),'#b99f78');rect((210,0,223,575),'#65765a');rect((349,0,361,575),'#65765a')
rect((0,210,575,338),'#c1aa83');rect((0,197,575,209),'#62745c');rect((0,339,575,351),'#62745c')
# crossroads stone circles
ellipse((170,166,405,402),'#d8bc8d', '#716857',4)
ellipse((182,177,394,392),'#c6a47b','#eed7aa',3)
# redraw road with crossing, cobble paths
rect((224,0,348,575),'#c6a57b');rect((0,210,575,338),'#cbb18b')
# lightly damaged cobbles clipped to streets
for row in range(0,SZ,9):
 offset=5 if (row//9)%2 else 0
 for col in range(-12,580,19):
  x=col+offset+R.randint(-2,2); y=row+R.randint(-1,1)
  street=(225<=x<=347) or (209<=y<=337)
  if street:
   c=R.choice(['#e5cba3','#ad8869','#d5b590','#9f876f','#eedcb1','#bda080'])
   line([(x+1,y),(x+14,y)],c,R.choice([1,1,2]))
   if R.random()<.52:line([(x+15,y),(x+15,y+7)],'#ab8c70')
for i in range(4000):
 x,y=R.randrange(SZ),R.randrange(SZ)
 if 220<x<352 or 205<y<345:rect((x,y,x+R.choice([0,1]),y+R.choice([0,1])),R.choice(['#f0d4a4','#9f8569','#e1c9a2']))
# castle ramparts / gate top region. Distinct from playfield and retaining pass-through central avenue.
def wall(x,y,w,h):
 rect((x+5,y+7,x+w+6,y+h+8),'#1b303b')
 rect((x,y,x+w,y+h),'#a5a7a0','#505865',2)
 for yy in range(y+5,y+h,10):
  for xx in range(x+4+((yy//10)%2)*10,x+w-4,20):
   line([(xx,yy),(xx+14,yy)],R.choice(['#d2c9b8','#768c8b','#eee1bb']),1)
   line([(xx+10,yy),(xx+10,yy+6)],'#677782')
 for xx in range(x,x+w,14):rect((xx,y-7,xx+8,y+3),'#acb2a6','#3e5563')
for bx in [0,385]:
 wall(bx,0,191,90)
# high walls and roofs small towers
for x,y in [(20,17),(150,12),(390,18),(520,14)]:
 ellipse((x-3,y+41,x+57,y+56),'#1c3c42')
 rect((x,y+10,x+51,y+50),'#9eaaa8','#414e63',3)
 poly([(x-6,y+14),(x+25,y-17),(x+57,y+14)],'#315a90','#e5c281',3)
 for px in range(x+3,x+46,13):line([(px,y+10),(px+25,y+9)],'#416caa',1)
 rect((x+18,y+18,x+33,y+35),'#34475f','#dfbc76',2)
# stately entrance arch top center, leave road through
rect((190,0,385,46),'#8a9b96','#3f5160',3)
for i in range(6):
 rect((199+i*29,0,218+i*29,13),'#b7bbae','#384959',1)
rect((224,9,348,47),'#263a45','#d4bb89',3)
for x in range(229,346,13):line([(x,12),(x,45)],'#384a55')
# sidewalk ornamental stepped terraces
for box in [(0,170,205,193),(370,171,575,195),(0,352,210,367),(365,350,575,365)]:
 rect(box,'#819887','#273f43',2)
 for q in range(box[0]+5,box[2],14):line([(q,box[1]+2),(q+7,box[3]-2)],'#a9af91',1)
# roofed houses with stone facade and flower window boxes

def house(x,y,w,h,roof='#b94b42',side='#e5cfac'):
 rect((x+4,y+h-2,x+w+12,y+h+12),'#163b38')
 rect((x+8,y+18,x+w,y+h),side,'#4a4b53',3)
 for k in range(40):
  px=R.randint(x+11,x+w-3); py=R.randint(y+27,y+h-6)
  line([(px,py),(px+R.randrange(2,9),py)],R.choice(['#f2ddbd','#8a8d81','#b4a58e']),1)
 poly([(x-7,y+24),(x+w//2,y-9),(x+w+9,y+24)],'#462c40','#f1b177',2)
 poly([(x-5,y+19),(x+w//2,y-11),(x+w+7,y+19)],roof,'#462737',2)
 for off in range(0,w,9):
  xx=x+off;yy=int(y+16-abs((xx-x-w//2)/(w/2))*(-23))
  line([(xx,yy),(xx+8,yy)],'#df8c62',2)
 for q in [int(x+w*.25),int(x+w*.72)]:
  rect((q-5,y+27,q+6,y+43),'#533e4f','#f7cc77',2)
  rect((q-3,y+29,q+4,y+39),'#56889f');line([(q,y+29),(q,y+40)],'#f8ce74')
  rect((q-9,y+42,q+10,y+45),'#523f39');
  for qq in range(q-7,q+9,4):ellipse((qq,y+39,qq+3,y+44),R.choice(['#d85f78','#f5b95e','#f0e5d9']))
 rect((x+w//2-7,y+h-14,x+w//2+8,y+h),'#4d333b','#d5a56d',2)
 ellipse((x+w//2+4,y+h-6,x+w//2+6,y+h-4),'#f2d28c')
 # ivy in shaded corner
 for j in range(20):
  px=R.randint(x+9,x+17);py=R.randint(y+28,y+h-3)
  rect((px,py,px+2,py+2),R.choice(['#39754a','#6e9655','#b6aa57']))

def arbor(x,y,r):
 ellipse((x-r+7,y+r*.53,x+r+6,y+r+11),'#1b3a3a')
 rect((x-4,y-1,x+5,y+r),'#654a3d','#372f35',2)
 line([(x,y+8),(x-12,y-7)],'#87624b',3);line([(x,y+2),(x+12,y-8)],'#87624b',3)
 for ox,oy,rad in [(-r*.52,-r*.45,r*.6),(r*.48,-r*.58,r*.66),(0,-r*.87,r*.72),(-r*.12,-r*.18,r*.63)]:
  cx=int(x+ox);cy=int(y+oy);rr=int(rad)
  ellipse((cx-rr+3,cy-rr+4,cx+rr+3,cy+rr+4),'#1b4341')
  ellipse((cx-rr,cy-rr,cx+rr,cy+rr),'#285d4f','#173f3d',3)
  for j in range(45):
   xx=cx+R.uniform(-rr*.73,rr*.73); yy=cy+R.uniform(-rr*.7,rr*.7)
   if (xx-cx)**2+(yy-cy)**2<rr*rr*.65:
    col=R.choice(['#3b835a','#4f9662','#78a66d','#1f654e','#b0c875','#39795d','#74ab7b'])
    rect((int(xx),int(yy),int(xx)+R.choice([1,2,3]),int(yy)+R.choice([1,2,3])),col)
  for j in range(4):
   xx=int(cx+R.uniform(-rr/2,rr/2)); yy=int(cy+R.uniform(-rr/2,0))
   rect((xx,yy,xx+2,yy+1),'#b7c97d')

def lantern(x,y):
 ellipse((x-7,y+13,x+8,y+17),'#243d37')
 rect((x-2,y-4,x+2,y+15),'#36424b')
 rect((x-7,y-14,x+7,y-3),'#473b44','#d2a35f',2)
 rect((x-5,y-12,x+5,y-6),'#f9d989','#e7a857')
 rect((x-10,y-16,x+10,y-13),'#292e42');poly([(x-8,y-16),(x,y-24),(x+8,y-16)],'#41495d','#d6a76a')
 # light halo 2 px
 for xx,yy in [(x-11,y-10),(x+9,y-10),(x-2,y-26)]: rect((xx,yy,xx+2,yy+2),'#f9dd8b')

def stall(x,y,colors):
 rect((x-4,y+34,x+76,y+41),'#27383b')
 for q in [0,62]:rect((x+q,y+8,x+q+5,y+35),'#5b4639','#a67f55')
 rect((x+3,y+24,x+63,y+36),'#76513e','#332f39',2)
 for q in range(6):
  px=x+4+q*9;ellipse((px,y+22,px+7,y+28),R.choice(['#ef9459','#87a756','#cd6379','#efce71']))
 poly([(x-11,y+8),(x+11,y-10),(x+55,y-10),(x+76,y+8)],colors[0],'#46333f',3)
 for k in range(6):
  x0=x-8+k*13;poly([(x0,y+7),(x0+13,y+7),(x0+13,y-6),(x0,y-6)], colors[k%len(colors)])
 for k in range(7):ellipse((x-9+k*13,y+5,x-4+k*13,y+12),'#b35d43')

def flowers(cx,cy,n=50,spread=18):
 for k in range(n):
  x=int(cx+R.gauss(0,spread*.6));y=int(cy+R.gauss(0,spread*.6));
  if not 0<=x<576 or not 0<=y<576:continue
  col=R.choice(['#ffde94','#f49aaf','#f2e2f0','#bca5e2','#f07b9a','#d2bd78','#a4d1b6'])
  rect((x,y,x+2,y+2),col)
  if k%3==0:rect((x-2,y+1,x-1,y+2),'#71a36e')
# structures
house(8,98,112,82,'#bc564d');house(412,88,136,96,'#4478a1');house(11,385,132,103,'#a0455b');house(393,374,160,112,'#bb5d43');
house(23,17,122,62,'#8a57a0');house(413,12,126,61,'#ac6b37')
# flower/vegetation borders
for x,y in [(176,70),(397,70),(151,168),(410,175),(106,348),(414,364),(128,522),(424,512)]:
 for j in range(5):
  ellipse((x-25+j*11,y-3,x-8+j*11,y+15),'#244c3f','#1c383c',2)
 flowers(x,y,45,35)
# trees only outside roads main
for ar in [(150,90,34),(380,113,29),(21,283,36),(520,276,36),(154,402,32),(374,424,30),(86,535,30),(504,548,27),(195,540,25),(381,548,28)]:arbor(*ar)
# V0.6.1 visual correction: keep the player spawn on the paved plaza, never inside fountain water.
# Change only fountain graphics; all world coordinates and combat remain unchanged.
FOUNTAIN_Y_OFFSET=-69
def town_ellipse(b,*a,**kw):
 return ellipse((b[0],b[1]+FOUNTAIN_Y_OFFSET,b[2],b[3]+FOUNTAIN_Y_OFFSET),*a,**kw)
def town_rect(b,*a,**kw):
 return rect((b[0],b[1]+FOUNTAIN_Y_OFFSET,b[2],b[3]+FOUNTAIN_Y_OFFSET),*a,**kw)
def town_poly(points,*a,**kw):
 return poly([(x,y+FOUNTAIN_Y_OFFSET) for x,y in points],*a,**kw)
# fountain circular central stone basin / water animated glints not static sprite player overlap
town_ellipse((234,230,347,339),'#3e5360')
town_ellipse((237,224,344,330),'#8a9e9a','#e0cdb0',5)
town_ellipse((247,237,335,322),'#2c819f','#32596a',4)
town_ellipse((252,242,330,316),'#379fc4','#80dbef',2)
for k in range(100):
 a=R.uniform(0,2*math.pi);rr=R.uniform(4,35);x=int(291+rr*math.cos(a));y=int(282+rr*math.sin(a))
 if R.random()<.46:town_rect((x,y,x+2,y+1),R.choice(['#b3edee','#4dcde5','#74c5e7','#9ce5ee']))
town_rect((285,254,298,281),'#c7d7d0','#2e6773',2)
town_poly([(279,255),(291,231),(304,255)],'#dce7d9','#a3bcb2',2)
town_ellipse((278,278,307,289),'#94c2c3','#426977',2)
for p in [(270,265),(306,260),(289,298)]:
 for j in range(10):
  x=p[0]+R.randint(-10,10);y=p[1]+R.randint(-11,11)
  town_rect((x,y,x+1,y+2),'#a6f4f0')
# water canals small ponds along green edge
for x,y,w,h in [(384,146,99,45),(58,365,116,33)]:
 ellipse((x,y,x+w,y+h),'#6b8177','#c8c1a2',4)
 ellipse((x+7,y+5,x+w-7,y+h-5),'#2e91b6','#6ac8d9',2)
 for j in range(35):
  px=R.randint(x+12,x+w-12);py=R.randint(y+8,y+h-8)
  rect((px,py,px+R.randint(2,8),py+1),'#90d9da')
# market stalls outside center walk
stall(16,211,['#f6d0a0','#bd5363']);stall(486,326,['#f0d78f','#2b75a7']);stall(14,327,['#f5c9a7','#2f7da6']);stall(476,201,['#f2d18c','#b45a4d'])
# flowers and boxes and signposts
for p in [(19,194),(155,203),(361,191),(549,177),(21,349),(360,369),(490,376),(192,395),(196,160),(401,165)]:flowers(*p,45,16)
# stone plinth planter boxes
for x,y in [(174,184),(365,176),(174,358),(373,355),(21,521),(543,522)]:
 rect((x-14,y-1,x+14,y+15),'#987c63','#c4ad7a',2)
 rect((x-13,y-5,x+13,y+4),'#53684e','#e6ca8d',1)
 flowers(x,y-8,28,18)
# gem and banners
for x,y in [(196,138),(386,142),(178,411),(396,414)]:
 line([(x,y),(x,y+29)],'#5c473b',3)
 poly([(x-4,y+2),(x+11,y+5),(x+10,y+24),(x+2,y+19),(x-4,y+24)],'#255a9d','#dfb76b',2)
 poly([(x+3,y+6),(x+8,y+12),(x+3,y+18),(x-2,y+12)],'#f1d78a')
# lamps on borders
for p in [(204,120),(366,127),(191,403),(376,411),(125,195),(440,199),(135,359),(454,356),(70,506),(473,497)]:lantern(*p)
# final sparkles are scarce and natural
for j in range(95):
 x=R.randrange(15,560);y=R.randrange(20,560)
 if not(220<x<360 or 195<y<350):
  if R.random()<.56:
   rect((x,y,x+1,y+1),R.choice(['#f9e4bc','#ffbabc','#f4d18b']))
# upscale detailed pixel art to game coordinate
im=im.resize((1152,1152),Image.Resampling.NEAREST)
OUT.joinpath('maps').mkdir(exist_ok=True,parents=True)
im.save(OUT/'maps/map-01.png',optimize=True)
print('map:', (OUT/'maps/map-01.png').stat().st_size)
# sprites: 48x48, 8 directions x 4 frames, original individually layered and anchored at feet.
# dir order from engine 0 Down, 1 Down-left, 2 Left, 3 Up-left, 4 Up, 5 Up-right, 6 Right, 7 Down-right
JOBS=[
 dict(name='Sword',hair='#332e47',light='#65536d',robe='#c9d2dd',robe2='#6e7f9a',cape='#a33a40',metal='#f0c476',weapon='#f5dbad',gem='#ec5267',skin='#f2c6a3'),
 dict(name='Archer',hair='#537849',light='#9ba96c',robe='#7dad70',robe2='#326a50',cape='#6a7c38',metal='#e8cb80',weapon='#e4bb74',gem='#57e6af',skin='#f2c6ac'),
 dict(name='Mage',hair='#c3bde8',light='#f1e5ff',robe='#5667c5',robe2='#252f89',cape='#3f3293',metal='#e0b6f2',weapon='#a9dff5',gem='#73d6ff',skin='#f0cad2'),
 dict(name='Fighter',hair='#af5133',light='#e8a368',robe='#cb8a46',robe2='#7d3940',cape='#8c4038',metal='#f3c778',weapon='#f1b56d',gem='#ffba57',skin='#e9b397')
]

def sprite(job,dir,frame):
 cfg=JOBS[job];s=Image.new('RGBA',(48,48),(0,0,0,0));z=ImageDraw.Draw(s)
 side=dir in (2,6);back=dir in (3,4,5);diag=dir in (1,3,5,7); left=dir in (1,2,3)
 step=[0,2,0,-2][frame];hop=[0,1,0,1][frame]
 # shadow transparent, anchor base y=44
 z.ellipse((11,40,38,44),fill=(6,18,34,85))
 # cape rear flutter
 z.polygon([(16,20-hop),(32,20-hop),(40+step,35),(33,42),(13-step,38),(8-step,34)],fill=cfg['cape'],outline='#302b45')
 for q in range(4):z.line((13,25+q*3,35,29+q*3),fill=cfg['robe2'],width=1)
 # boots and articulated legs
 for x,shift in [(17,step),(28,-step)]:
  z.rectangle((x-4,33,x+4,39+shift),fill='#423c4d',outline='#1e2f40',width=1)
  z.rectangle((x-4,38+shift,x+5,42+shift),fill=cfg['robe2'],outline='#212639')
  z.line([(x-3,39+shift),(x+3,39+shift)],fill=cfg['metal'],width=1)
 # tunic torso with padded shoulders and armor
 z.polygon([(14,18-hop),(33,18-hop),(36,32),(31,37),(16,37),(11,32)],fill=cfg['robe2'],outline='#25263a')
 z.polygon([(17,20-hop),(30,20-hop),(31,33),(23,36),(16,33)],fill=cfg['robe'],outline='#273b55')
 z.line([(19,25),(28,25)],fill=cfg['metal'],width=2);z.rectangle((21,30,27,34),fill=cfg['metal'])
 z.point((24,31),fill=cfg['gem'])
 # arms near body
 for ax in (11,35):
  off=(step if ax==11 else -step)//2
  z.ellipse((ax-5,21+off,ax+3,29+off),fill=cfg['robe2'],outline='#232d3e')
  z.rectangle((ax-4,28+off,ax+2,32+off),fill='#e0bd96',outline='#4f3a3d')
  z.line([(ax-3,25+off),(ax+2,25+off)],fill=cfg['metal'],width=2)
 # head / ear / neck
 z.rectangle((21,16-hop,27,22-hop),fill=cfg['skin'])
 z.ellipse((9 if side else 12,3-hop,38 if not side else 36,24-hop),fill='#25243a')
 z.ellipse((13 if not side else 15,5-hop,35,23-hop),fill=cfg['skin'],outline='#6d5155',width=1)
 if back:
  z.polygon([(10,14-hop),(12,5-hop),(19,1-hop),(33,4-hop),(37,10-hop),(35,22-hop),(15,21-hop)],fill=cfg['hair'],outline='#2e2d45')
  for k in range(3):z.line([(16+k*5,6-hop),(17+k*5,16-hop)],fill=cfg['light'],width=2)
 else:
  z.polygon([(11,15-hop),(10,7-hop),(18,2-hop),(29,2-hop),(38,7-hop),(37,14-hop),(33,10-hop),(28,12-hop),(22,10-hop),(16,16-hop)],fill=cfg['hair'],outline='#24253a')
  for k in range(3):z.line([(14+k*7,5-hop),(11+k*7,12-hop)],fill=cfg['light'],width=2)
  if side:
   eye=20 if left else 29;z.rectangle((eye,15-hop,eye+2,17-hop),fill='#292a45');z.point((eye+1,15-hop),fill='#f2f1ed')
  else:
   for eye in (18,30):
    z.rectangle((eye,15-hop,eye+2,18-hop),fill='#283146');z.point((eye+1,15-hop),fill='#f6f0ed')
  z.line([(22,21-hop),(26,21-hop)],fill='#c5868e')
 # class-specific props; swords angled with hand anchor; bows and staves distinct
 if job==0:
  xx=33 if left else 11
  z.line([(xx,30),(xx+(10 if left else -10),10)],fill='#273041',width=5)
  z.line([(xx,30),(xx+(10 if left else -10),10)],fill=cfg['weapon'],width=3)
  z.line([(xx-4,28),(xx+4,32)],fill=cfg['metal'],width=3)
  z.point((xx+(10 if left else -10),9),fill='#ffffff')
 elif job==1:
  xx=34 if left else 12
  z.arc((xx-13,15,xx+9,38),-85,92 if left else 270,fill=cfg['weapon'],width=3)
  z.line([(xx-3,14),(xx-1,38)],fill='#f7e8b5')
  z.line([(xx-3,14),(xx-6,30)],fill='#6f4b37')
 elif job==2:
  xx=35 if left else 10
  z.line([(xx,10),(xx,38)],fill='#7b597d',width=4)
  z.line([(xx,10),(xx,38)],fill='#d9b8eb',width=2)
  z.ellipse((xx-5,6,xx+5,15),fill=cfg['gem'],outline='#eef6ff',width=2)
  z.point((xx,8),fill='#ffffff')
 else:
  for xx in (9,36):
   z.ellipse((xx-5,27,xx+5,36),fill=cfg['metal'],outline='#813c46',width=2)
   z.line([(xx-3,28),(xx+2,28)],fill='#fff0c3',width=1)
 # pixels of armor reflection
 for q in range(3):
  x=17+q*5;z.point((x,27),fill='#fef7e2')
 return s

for j in range(4):
 sheet=Image.new('RGBA',(192,384),(0,0,0,0))
 for direct in range(8):
  for f in range(4):sheet.alpha_composite(sprite(j,direct,f),(f*48,direct*48))
 sheet.save(OUT/f'sprites/hero-{j}.png',optimize=True)
 print('hero',j,(OUT/f'sprites/hero-{j}.png').stat().st_size)
# visual proof panel: map and 4 hero strips
from PIL import ImageFont
canvas=Image.new('RGB',(1460,1230),'#0c1424');cv=ImageDraw.Draw(canvas)
canvas.paste(im,(20,45))
cv.text((20,13),'AMBER WORLD CLASS - V0.6 / ORIGINAL PIXEL ART DEMO',fill='#ffdc94')
cv.text((1192,48),'CHARACTERS - 8 DIRECTIONS / 4 FRAMES',fill='#ffdb94')
for j in range(4):
 sheet=Image.open(OUT/f'sprites/hero-{j}.png');sheet=sheet.resize((240,480),Image.Resampling.NEAREST)
 row=45+j*285
 # use two-direction strips (one down, one up) not crop into game, preview only
 sample=Image.open(OUT/f'sprites/hero-{j}.png')
 clip=sample.crop((0,0,192,96)).resize((240,120),Image.Resampling.NEAREST)
 canvas.paste(clip,(1202,row+55),clip)
 cv.text((1202,row+28),JOBS[j]['name'].upper(),fill='#ffdf98')
preview=PROJECT/'docs'/'previews'/'AWC_V06_ART_PREVIEW.png'
preview.parent.mkdir(parents=True,exist_ok=True)
canvas.save(preview,optimize=True)
print('preview done')
