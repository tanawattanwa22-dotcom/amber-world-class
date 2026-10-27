from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import random,math,hashlib,json
BASE=Path(__file__).resolve().parents[1]/'public'/'assets';MAPS=BASE/'maps';SPR=BASE/'sprites';FX=BASE/'effects'
for p in [BASE,MAPS,SPR,FX]:p.mkdir(parents=True,exist_ok=True)
SIZE=576
PALETTES=[
 dict(grass='#347b57',top='#4b9b67',dark='#205a45',path='#bfa47a',pathlit='#e1c391',accent='#e8c46c',water='#367fb0',roof='#ba574e'),
 dict(grass='#245b4b',top='#417d55',dark='#153f41',path='#967b56',pathlit='#baa576',accent='#5ee6b9',water='#277b9b',roof='#38757f'),
 dict(grass='#76945b',top='#9db06b',dark='#466849',path='#caaa70',pathlit='#f1d79c',accent='#fcdf81',water='#439bb2',roof='#b97649'),
 dict(grass='#526a64',top='#658b73',dark='#354b53',path='#adb39c',pathlit='#cbd2af',accent='#9cc7fd',water='#46829c',roof='#566589'),
 dict(grass='#ad7853',top='#cf9c6b',dark='#70463b',path='#dfbb84',pathlit='#f6d9a4',accent='#ffb359',water='#886149',roof='#a44b3b'),
 dict(grass='#aecad3',top='#d4e9e9',dark='#738eac',path='#b7c3cf',pathlit='#e9f8fb',accent='#c4f3ff',water='#619ed0',roof='#567eac'),
 dict(grass='#653e4b',top='#8d4c47',dark='#3b283a',path='#76545a',pathlit='#a76f60',accent='#ff763d',water='#c35639',roof='#602f45'),
 dict(grass='#494668',top='#746181',dark='#292841',path='#686179',pathlit='#9584a8',accent='#b98bff',water='#6a5ba6',roof='#443a70'),
 dict(grass='#6fa2a0',top='#9dc2c5',dark='#4c728f',path='#b8b5ac',pathlit='#efdfd2',accent='#d5f9ff',water='#5b98ce',roof='#f9f5df'),
 dict(grass='#4b303d',top='#744047',dark='#251e32',path='#7e5b50',pathlit='#ac8271',accent='#ff5f3f',water='#b24f38',roof='#54213c')
]
def hx(s):return tuple(int(s.lstrip('#')[i:i+2],16) for i in (0,2,4))
def recol(s,fac=1,add=0):return tuple(max(0,min(255,int(x*fac+add))) for x in hx(s))
def lerp(c,d,t):return tuple(int(c[k]*(1-t)+d[k]*t) for k in range(3))
def grass_bg(d,r,p):
 bg=Image.new('RGB',(SIZE,SIZE),hx(p['grass']));pix=bg.load(); dark=hx(p['dark']); top=hx(p['top']); base=hx(p['grass']);
 for yy in range(SIZE):
  for xx in range(SIZE):
   z=(math.sin(xx*.018)+math.sin((yy+xx)*.014)+math.sin(yy*.027))*0.037+0.095
   zz=lerp(base,top,max(0,min(.32,z))); pix[xx,yy]=zz
 d=ImageDraw.Draw(bg,'RGB')
 for _ in range(23000):
  x=r.randrange(SIZE);y=r.randrange(SIZE);choice=r.random()
  col=recol(p['grass'],r.uniform(.73,1.25))
  if choice<.74:d.rectangle((x,y,x+r.randrange(1,4),y+r.randrange(1,3)),fill=col)
  else:
   co=recol(p['top'],r.uniform(.7,1.25));d.line((x,y,x+1,y-3),fill=co,width=1)
 return bg

def ellipse_shadow(d,bbox,a=0):d.ellipse(bbox,fill=(8,19,22,110))
def stone(d,x,y,w,h,col):
 d.polygon([(x+3,y),(x+w-3,y),(x+w,y+3),(x+w,y+h-3),(x+w-3,y+h),(x+3,y+h),(x,y+h-3),(x,y+3)],fill=col,outline='#62544e',width=1)
 d.line((x+3,y+2,x+w-4,y+2),fill='#f1dcc0',width=1)

def path_and_plaza(bg,d,r,p,mapidx):
 shadow=recol(p['path'],.67);light=hx(p['pathlit']);base=hx(p['path']);
 if mapidx==0:
  # connected plaza and paths. stone checker rings around fountain
  d.polygon([(201,0),(300,0),(304,211),(432,211),(576,247),(576,316),(376,294),(331,336),(333,576),(230,576),(240,336),(0,323),(0,246),(194,217)],fill=base)
  d.ellipse((184,186,367,364),fill=base)
  d.ellipse((194,197,357,351),outline=light,width=8)
 elif mapidx==1:
  d.polygon([(254,0),(309,0),(325,125),(400,169),(427,266),(360,342),(315,437),(304,576),(225,576),(229,410),(273,326),(327,257),(267,206),(215,113)],fill=base)
  d.polygon([(0,293),(154,252),(269,280),(576,250),(576,308),(269,332),(135,308),(0,355)],fill=base)
 elif mapidx==2:
  d.polygon([(217,0),(311,0),(320,214),(576,244),(576,300),(331,292),(331,576),(227,576),(234,302),(0,323),(0,256),(212,211)],fill=base)
 else:
  d.polygon([(208,0),(315,0),(323,212),(576,232),(576,306),(320,317),(327,576),(219,576),(226,324),(0,309),(0,248),(201,215)],fill=base)
 if mapidx!=1:
  d.ellipse((190,204,367,372),fill=base)
 # mosaic small paving everywhere the path pixel matches
 mask=Image.new('L',(SIZE,SIZE)); maskd=ImageDraw.Draw(mask)
 for shape in [((x,y),) for x,y in []]:pass
 # classify path color via RGB snapshot; add tiles
 pi=bg.load()
 for y in range(2,SIZE-3,10):
  for x in range(0,SIZE-8,12):
   if pi[x+3,y+3]!=base:continue
   w=9+r.randint(-2,1);h=7+r.randint(-2,1);off=(5 if (y//10)%2 else 0)
   xx=x+off
   if xx>=SIZE-8 or pi[xx+3,y+3]!=base:continue
   clr=lerp(base,light,.11+r.random()*.21)
   d.rectangle((xx,y,xx+w,y+h),fill=clr)
   d.line((xx,y,xx+w,y),fill=lerp(clr,light,.55),width=1)
   if r.random()<.16:d.point((xx+r.randrange(1,w),y+r.randrange(1,h)),fill=recol(p['path'],.72))
 # broken stone cracks
 for _ in range(150):
  x=r.randrange(8,568);y=r.randrange(8,568)
  if pi[x,y]==base:d.line((x,y,x+r.randint(2,7),y+r.randint(-2,3)),fill=recol(p['path'],.74),width=1)

def tree(d,r,x,y,scale=1.0,theme=0):
 rad=int(19*scale);h=int(21*scale)
 d.ellipse((x-rad,y+3,x+rad,y+13),fill='#1c3332')
 d.polygon([(x-4,y),(x+5,y),(x+7,y-22*scale),(x-3,y-29*scale)],fill='#6b3e2f')
 d.polygon([(x-4,y-10),(x-18*scale,y-24*scale),(x-15*scale,y-27*scale),(x+2,y-16)],fill='#a66e45')
 leaf=[['#143c37','#2e6c4b','#438e58','#79b65d'],['#153837','#286c54','#3a9681','#7cc89c'],['#38654a','#629c56','#8ec965','#b7da7f'],['#254454','#416870','#6f8d83','#b7b5a0'],['#674a39','#8e633f','#b38f50','#dac37c'],['#58769e','#94b7d3','#c8ddea','#f1f7fc'],['#4a2939','#843e40','#c25c43','#fca353'],['#2d2d51','#594469','#8264aa','#bb94d8'],['#4d6c76','#7aa9ad','#badadd','#fff9ed'],['#3e283d','#713746','#a65050','#ff8555']][theme]
 centers=[(-.62,-.95),(.35,-1.1),(.92,-.8),(-.33,-1.65),(.4,-1.7),(.03,-1.35)]
 for i,(bx,by) in enumerate(centers):
  cx=int(x+rad*bx);cy=int(y+rad*by);rr=int(rad*(.58 if i<3 else .64))
  d.ellipse((cx-rr,cy-rr,cx+rr,cy+rr),fill=leaf[0],outline='#122f31',width=2)
  d.ellipse((cx-rr+3,cy-rr+2,cx+rr-3,cy+rr-4),fill=leaf[1])
  for j in range(11):
   px=cx+r.randint(-rr+4,rr-5);py=cy+r.randint(-rr+4,rr-6)
   d.rectangle((px,py,px+r.choice([1,2,3]),py+r.choice([1,2])),fill=r.choice(leaf[2:]))

def pines(d,r,x,y,theme=5,s=1):
 h=int(44*s);w=int(20*s)
 d.ellipse((x-w,y,x+w,y+10*s),fill='#4b6e86')
 d.rectangle((x-3,y-18*s,x+3,y),fill='#73584d')
 for i in range(3):
  yy=y-int(i*13*s)
  d.polygon([(x,yy-int((28-i*3)*s)),(x-w+i*4*s,yy),(x+w-i*4*s,yy)],fill=('#345c70' if theme==5 else '#2d5153'),outline='#1d344a')
  if theme==5:d.line((x-w/2,yy-5*s,x+w/2,yy-5*s),fill='#f4ffff',width=max(1,int(3*s)))

def flowers(d,r,x,y,theme=0):
 for _ in range(r.randrange(9,22)):
  bx=x+r.randint(-25,25);by=y+r.randint(-11,12)
  d.line((bx,by,bx+1,by-4),fill='#225745',width=1)
  col=r.choice(['#ffe28d','#fa89b3','#f6f5da','#9dd7ff','#ffd7cb','#d6b4ff'])
  d.rectangle((bx-1,by-5,bx+2,by-3),fill=col)
  d.point((bx,by-4),fill='#ffefc7')

def house(d,r,x,y,theme=0,s=1.0):
 # top-down visible facade + angular tile roof / porch
 w=int(82*s);h=int(62*s); x=int(x);y=int(y)
 d.ellipse((x+2,y+h-12,x+w+8,y+h+8),fill='#1e3036')
 d.rectangle((x+7,y+18,x+w-4,y+h),fill='#7b695a',outline='#372d35',width=2)
 d.rectangle((x+12,y+20,x+w-10,y+h-8),fill='#dcc4a0')
 for k in (12,w-20):
  d.rectangle((x+k,y+30,x+k+9,y+44),fill='#352f42',outline='#8a604b')
  d.rectangle((x+k+2,y+32,x+k+7,y+39),fill='#ffe18b')
 d.rectangle((x+w//2-7,y+h-17,x+w//2+8,y+h),fill='#604638',outline='#42323a',width=2)
 d.rectangle((x+w//2+5,y+h-9,x+w//2+7,y+h-7),fill='#ffdc83')
 roof=['#b35749','#286775','#b47843','#5e6986','#a45d42','#637eaf','#803a4e','#5f477d','#d8d3c6','#67354d'][theme]
 d.polygon([(x-10,y+18),(x+w//2,y-24),(x+w+10,y+18)],fill='#342e3a')
 d.polygon([(x-6,y+12),(x+w//2,y-22),(x+w+6,y+12)],fill=roof,outline='#3e3039')
 d.line((x+5,y+5,x+w//2,y-17,x+w-8,y+5),fill='#f2b58c',width=2)
 for k in range(4):
  yy=y-11+k*7;half=int((k+1)*w/11)
  d.line((x+w//2-half,yy,x+w//2+half,yy),fill=recol(roof,.75),width=1)
 d.rectangle((x+w-11,y-17,x+w-1,y-3),fill='#7d5963',outline='#372e37')
 d.rectangle((x+w-10,y-17,x+w-2,y-13),fill='#bb9b89')

def lamps(d,x,y):
 d.ellipse((x-8,y+3,x+11,y+8),fill='#1e252b')
 d.line((x,y,x,y-26),fill='#31363b',width=5)
 d.ellipse((x-7,y-32,x+7,y-16),fill='#61453a')
 d.rectangle((x-5,y-31,x+5,y-19),fill='#e9b358',outline='#69493c',width=2)
 d.rectangle((x-2,y-29,x+2,y-21),fill='#fff3b0')
 d.polygon([(x-8,y-32),(x,y-39),(x+8,y-32)],fill='#222d34')

def fountain(d,r,x=272,y=277,p=None):
 for rad,col in [(56,'#554e53'),(51,'#d2d6c1'),(45,'#6f7d80'),(39,'#5db4c3'),(30,'#388eb3'),(18,'#72dbe2')]:
  d.ellipse((x-rad,y-rad/2,x+rad,y+rad/2),fill=col,outline='#465460' if rad>30 else None,width=2)
 for _ in range(15):
  t=r.random()*math.pi*2;rr=r.randint(10,34)
  a=x+math.cos(t)*rr;b=y+math.sin(t)*rr/2
  d.line((a,b,a+r.randint(-2,2),b-r.randint(2,6)),fill='#b9f0f2',width=2)
 d.ellipse((x-13,y-30,x+13,y-18),fill='#9b9f9c',outline='#4e6671',width=2)
 d.rectangle((x-8,y-40,x+7,y-24),fill='#b3b3b1',outline='#6c777d')
 d.polygon([(x-3,y-51),(x+4,y-51),(x+9,y-39),(x-7,y-39)],fill='#eaece4')
 d.line((x,y-59,x,y-39),fill='#7feaf6',width=3)

def pond(d,r,x,y,w,h,color):
 d.ellipse((x-5,y-5,x+w+5,y+h+5),fill='#bdd3ad')
 d.ellipse((x,y,x+w,y+h),fill='#2b5262')
 d.ellipse((x+4,y+4,x+w-4,y+h-5),fill=color)
 for _ in range(30):
  xx=x+r.randint(8,w-8);yy=y+r.randint(8,h-8)
  d.line((xx,yy,xx+r.randint(4,11),yy),fill=r.choice(['#89d4dd','#7ebccf','#d1efdd']),width=1)
 for _ in range(10):
  t=r.random()*6.28;xx=x+w/2+math.cos(t)*w*.51;yy=y+h/2+math.sin(t)*h*.48
  d.ellipse((xx-3,yy-2,xx+3,yy+2),fill='#7fb459')

def portal(d,x,y,clr):
 d.ellipse((x-23,y-9,x+23,y+9),fill='#17272b')
 d.ellipse((x-19,y-15,x+19,y+15),fill='#eacb89')
 d.ellipse((x-16,y-19,x+16,y+12),fill='#364357')
 d.ellipse((x-12,y-23,x+12,y+9),fill=clr)
 d.ellipse((x-7,y-17,x+7,y+4),fill='#b5eff9')
 d.ellipse((x-3,y-8,x+3,y+0),fill='#f9ffff')
 for off in [-25,25]:
  d.rectangle((x+off-4,y-11,x+off+4,y+9),fill='#e4cf9b',outline='#4a414b')

def ruin(d,r,x,y,theme=3):
 w=r.randint(26,44);h=r.randint(30,67)
 d.ellipse((x-w,y+5,x+w,y+14),fill='#2f303f')
 d.polygon([(x-w//2,y),(x-w//2,y-h),(x+w//2,y-h+8),(x+w//2,y)],fill='#7e8586',outline='#333f4b',width=2)
 for k in range(4):
  yy=y-h+k*12;d.line((x-w//2+2,yy,x+w//2-2,yy),fill='#b4aea0',width=2)
 d.rectangle((x-7,y-29,x+8,y),fill='#232d3d',outline='#606678',width=2)

def terrain_map(idx):
 r=random.Random(201113+idx*97);p=PALETTES[idx]
 bg=grass_bg(None,r,p);d=ImageDraw.Draw(bg)
 path_and_plaza(bg,d,r,p,idx)
 if idx==0:
  pond(d,r,397,49,144,112,p['water']);pond(d,r,45,436,132,101,p['water'])
  # decorative detailed fountain with plaza
  for x,y in [(51,66),(141,85),(384,78),(502,180),(68,390),(500,457),(90,190),(448,525),(135,545)]:tree(d,r,x,y,1.14,idx)
  for x,y in [(57,145),(368,409),(489,360),(200,420),(111,458),(396,156)]:tree(d,r,x,y,.85,idx)
  for x,y in [(53,201),(142,387),(371,145),(429,419),(449,377),(113,316),(379,481)]:flowers(d,r,x,y)
  for x,y in [(45,144),(322,130),(356,398),(24,359),(421,493)]:house(d,r,x,y,idx,.9)
  for x,y in [(185,239),(375,235),(181,358),(365,345),(338,53),(338,527)]:lamps(d,x,y)
  fountain(d,r,278,289,p)
  # market tents/stalls  canopies left
  for x,y,co in [(114,165,'#b64f4d'),(390,349,'#498fac')]:
   d.rectangle((x,y,x+54,y+22),fill='#86644c',outline='#413f3a')
   for i in range(6):d.rectangle((x+i*9,y-16,x+i*9+8,y+1),fill=co if i%2==0 else '#e5d1a6')
   for i in range(4):d.ellipse((x+i*12+3,y+6,x+i*12+11,y+13),fill=['#bd634c','#f5b855','#9ecc64','#dbb7e3'][i])
  # fence and flags
  for i in range(7):
   x=16+i*21;d.rectangle((x,332,x+3,346),fill='#704b3b');d.line((x+1,333,x+23,333),fill='#b68b65',width=2)
  portal(d,449,282,'#367cd1')
 elif idx==1:
  for x,y in [(60,53),(128,57),(374,59),(480,86),(56,208),(498,208),(68,412),(160,493),(395,451),(484,498),(420,350),(152,375),(75,325)]:tree(d,r,x,y,r.uniform(.95,1.5),idx)
  for x,y in [(178,72),(353,202),(410,388),(100,335),(417,530),(170,401)]:flowers(d,r,x,y,idx)
  pond(d,r,367,134,144,100,p['water']);pond(d,r,40,423,91,63,p['water'])
  # old tree spirit grove
  x,y=120,265
  d.ellipse((x-66,y-6,x+72,y+24),fill='#1b433e');d.rectangle((x-21,y-91,x+20,y-6),fill='#6c553d',outline='#302b32',width=4)
  for x1,y1 in [(-60,-96),(-37,-126),(28,-130),(52,-88),(10,-164)]:
   d.line((x,y-75,x+x1,y+y1),fill='#886746',width=9)
   tree(d,r,x+x1,y+y1,.85,idx)
  portal(d,474,299,'#42dec3');ruin(d,r,350,422,idx)
 elif idx==2:
  pond(d,r,25,53,124,102,p['water']);pond(d,r,396,412,135,77,p['water'])
  for x,y in [(78,224),(476,81),(63,399),(447,355),(465,496),(153,483)]:tree(d,r,x,y,.8,idx)
  for x,y in [(58,191),(430,141),(411,475),(82,487),(136,160),(412,370),(342,452)]:flowers(d,r,x,y,idx)
  # windmill
  house(d,r,365,155,idx,1.15);wx,wy=412,138
  d.ellipse((wx-9,wy-9,wx+9,wy+9),fill='#e8e2cc',outline='#7b6f69')
  for angle in [0,math.pi/2,math.pi,1.5*math.pi]:
   ca,sa=math.cos(angle),math.sin(angle)
   pts=[(wx+int(ca*d-sa*u),wy+int(sa*d+ca*u)) for d,u in [(8,-7),(49,-12),(49,13),(8,7)]]
   d.polygon(pts,fill='#eee7cf',outline='#8c7870')
   for k in range(2,45,9):
    a1=(wx+int(ca*k-sa*-8),wy+int(sa*k+ca*-8));a2=(wx+int(ca*k-sa*8),wy+int(sa*k+ca*8));d.line((a1,a2),fill='#bdbaa8')
  for x,y in [(84,344),(101,345),(119,343)]:
   d.ellipse((x-7,y-7,x+7,y+8),fill='#f8e7c7',outline='#8d644f')
  portal(d,460,297,'#8bb9ff')
 else:
  if idx==5:
   for _ in range(24):pines(d,r,r.randrange(20,550),r.randrange(10,550),5,r.uniform(.7,1.4))
  else:
   for _ in range(16):
    x,y=r.randrange(23,550),r.randrange(28,550)
    if idx in (3,7,9):ruin(d,r,x,y,idx)
    elif idx in (4,6):
     d.polygon([(x,y-23),(x+22,y+9),(x-20,y+12)],fill=['#a9764d','#e5653e'][idx==6],outline='#65464a')
    else:tree(d,r,x,y,r.uniform(.55,.9),idx)
  for _ in range(9):flowers(d,r,r.randrange(26,550),r.randrange(35,545),idx)
  if idx in (6,9):
   # lava channels
   for sx in [40,370,460]:
    x=sx;rng=random.Random(sx*idx)
    for y in range(0,576,6):
     nx=x+rng.randrange(-5,6)
     d.line((x,y,nx,y+8),fill='#4e282f',width=21);d.line((x,y,nx,y+8),fill='#e65c31',width=15);d.line((x,y,nx,y+8),fill='#ffae42',width=4);x=nx
  if idx==8:
   for i in range(14):
    x=r.randrange(28,547);y=r.randrange(40,550)
    d.ellipse((x-23,y-13,x+23,y+13),fill='#ced6d2',outline='#728daa',width=2)
    d.polygon([(x,y-26),(x+7,y-6),(x,y+6),(x-9,y-6)],fill='#aeffff',outline='#497ea4')
  portal(d,458,283,p['accent'])
 # overlaid atmospheric specks
 for i in range(80):
  x=r.randint(0,575);y=r.randint(0,575)
  if i%3==0:d.point((x,y),fill=p['accent'])
 # output upscale nearest to exact world dimensions
 return bg.resize((1152,1152),resample=Image.Resampling.NEAREST)

for idx in range(10):
 im=terrain_map(idx);im.save(MAPS/f'map-{idx+1:02d}.png',optimize=True)
 print('map',idx+1,(MAPS/f'map-{idx+1:02d}.png').stat().st_size)

# Chibi characters — layered sprites, each sheet 4 columns (walk phases) × 8 direction rows.
JOBS=[
 {'hair':['#55362d','#8a5641','#dfae7d'],'armor':['#263f56','#466d80','#9bbac2'],'accent':'#e0b45d','pants':'#263147','skin':'#eac1a0','weapon':'#d7edf4'},
 {'hair':['#68452f','#a8764b','#eac27c'],'armor':['#26533e','#44986a','#81bd72'],'accent':'#ded18b','pants':'#283f36','skin':'#edc6a3','weapon':'#d8b077'},
 {'hair':['#48335e','#896cb0','#d7bdea'],'armor':['#392b68','#7257ac','#d0afd9'],'accent':'#82cfff','pants':'#382859','skin':'#f3ccae','weapon':'#84deff'},
 {'hair':['#753c40','#c17767','#f5bc9a'],'armor':['#58404e','#9d4e5a','#e49d67'],'accent':'#efcf8a','pants':'#452d3b','skin':'#eac09a','weapon':'#f2a47d'}
]
def poly(d,p,c,o='#192638'):d.polygon(p,fill=c,outline=o)
def hero_frame(job,dr,frame):
 data=JOBS[job];im=Image.new('RGBA',(48,48),(0,0,0,0));d=ImageDraw.Draw(im)
 bob=[0,1,0,-1][frame];phase=[0,-2,0,2][frame]
 # Ground shadow
 d.ellipse((11,43,37,46),fill=(4,16,23,95))
 # boots and animated legs
 for idx,px in enumerate((17,27)):
  dd=phase if idx==0 else -phase
  d.rectangle((px-2,34+dd,px+5,40+dd),fill=data['pants'],outline='#242538',width=1)
  d.rectangle((px-4,40+dd,px+6,43+dd),fill='#493a41',outline='#1a1e2f')
  d.line((px-2,40+dd,px+3,40+dd),fill='#b58b67')
 # Arms separately under torso
 for hand,x in enumerate((11,34)):
  shift=(phase//2 if hand==0 else -phase//2)
  d.rounded_rectangle((x-4,24+bob+shift,x+3,36+bob+shift),3,fill=data['armor'][1],outline='#1e2738',width=1)
  d.rectangle((x-4,26+bob+shift,x+3,29+bob+shift),fill=data['armor'][2])
  d.ellipse((x-3,34+bob+shift,x+2,38+bob+shift),fill=data['skin'],outline='#503b45')
 # torso rim cape
 if job==2:d.polygon([(15,23+bob),(33,23+bob),(36,40+bob),(12,41+bob)],fill='#553984')
 if job==1:d.polygon([(15,23+bob),(33,23+bob),(39,39+bob),(9,38+bob)],fill='#334e45')
 d.rounded_rectangle((15,21+bob,32,35+bob),3,fill=data['armor'][1],outline='#1a2635',width=2)
 d.polygon([(17,22+bob),(25,21+bob),(30,24+bob),(26,32+bob),(18,31+bob)],fill=data['armor'][2])
 d.line((16,30+bob,32,30+bob),fill=data['accent'],width=3)
 d.rectangle((23,29+bob,26,32+bob),fill='#eedca1')
 if job==0:
  d.polygon([(13,22+bob),(18,18+bob),(23,24+bob),(14,27+bob)],fill='#c1c7cf',outline='#3b596e')
  d.polygon([(30,22+bob),(35,18+bob),(37,27+bob),(28,27+bob)],fill='#a7bed0',outline='#3b596e')
 elif job==1:
  d.line((18,24+bob,29,33+bob),fill='#dabb66',width=3)
 elif job==2:
  d.polygon([(17,28+bob),(29,28+bob),(33,37+bob),(13,37+bob)],fill='#59428f')
  for xp in (17,30):d.rectangle((xp,34+bob,xp+2,38+bob),fill='#e7bb78')
 else:
  d.rounded_rectangle((10,26+bob,15,35+bob),3,fill='#f0aa57',outline='#6e2b3d')
  d.rounded_rectangle((33,26+bob,39,35+bob),3,fill='#f0aa57',outline='#6e2b3d')
 # neck
 d.rectangle((22,20+bob,26,25+bob),fill='#c5917a')
 # pixel hair and head, view-specific
 back=dr in (3,4,5);side=dr in (2,6)
 d.rounded_rectangle((12,5+bob,35,24+bob),7,fill=data['hair'][0],outline='#222235',width=1)
 d.rounded_rectangle((14,8+bob,33,24+bob),6,fill=data['skin'],outline='#79554c',width=1)
 d.ellipse((11,15+bob,16,20+bob),fill='#e3af90')
 d.ellipse((32,15+bob,37,20+bob),fill='#e3af90')
 if back:
  d.polygon([(12,8+bob),(20,4+bob),(31,6+bob),(35,12+bob),(35,21+bob),(24,19+bob),(14,23+bob)],fill=data['hair'][1],outline='#3e2d41')
  d.line((21,8+bob,28,14+bob),fill=data['hair'][2],width=2)
  if job==1:d.rectangle((19,6+bob,29,9+bob),fill='#528866')
 else:
  # layered fringe, bounce
  d.polygon([(11,14+bob),(12,8+bob),(17,4+bob),(24,6+bob),(29,3+bob),(36,10+bob),(35,15+bob),(29,11+bob),(26,15+bob),(20,12+bob),(17,16+bob)],fill=data['hair'][1],outline='#372e3e')
  d.line((13,12+bob,20,7+bob,25,10+bob),fill=data['hair'][2],width=2)
  d.line((26,6+bob,30,8+bob,32,11+bob),fill=data['hair'][2],width=2)
  if side:
   ex=20 if dr==6 else 28
   d.rectangle((ex,15+bob,ex+2,19+bob),fill='#332938')
   d.point((ex+1,15+bob),fill='#ffffff')
  else:
   for ex in (19,28):
    d.rectangle((ex-1,15+bob,ex+1,19+bob),fill='#302c42')
    d.point((ex,15+bob),fill='#f5f3fa')
   d.line((22,21+bob,26,21+bob),fill='#b96769')
  d.rectangle((16,20+bob,18,21+bob),fill='#e89a91')
  d.rectangle((30,20+bob,32,21+bob),fill='#e89a91')
 # ornaments head
 if job==0:
  d.line((12,11+bob,17,8+bob),fill='#f6d49c',width=2)
 elif job==1:
  d.line((14,11+bob,22,11+bob,31,9+bob),fill='#b6d87e',width=2)
 elif job==2:
  d.polygon([(8,11+bob),(39,11+bob),(25,0+bob)],fill='#493c8a',outline='#222a3a')
  d.rectangle((23,4+bob,27,8+bob),fill='#79e1f4')
 elif job==3:d.polygon([(16,9+bob),(24,7+bob),(31,9+bob),(31,12+bob),(15,12+bob)],fill='#e7bb65')
 # Equipped weapon: orientation-sensitive hand anchor
 sign=1 if dr in (5,6,7,0) else -1
 if job==0:  # sword  -- hilt and blade
  ax=35 if sign>0 else 10;ay=32+bob
  if dr in (3,4,5):
   d.line((ax,ay,ax+sign*4,ay+11),fill='#cad8e2',width=4);d.line((ax-5,ay,ax+5,ay),fill='#e4c37e',width=3)
  else:
   d.line((ax,ay,ax+sign*12,ay-18),fill='#304456',width=5)
   d.line((ax,ay,ax+sign*12,ay-18),fill='#e6f4f7',width=3)
   d.line((ax+sign*10,ay-17,ax+sign*14,ay-20),fill='#ffffff',width=1)
   d.line((ax-4,ay-2,ax+4,ay+3),fill='#edca77',width=2)
 elif job==1:
  x=39 if sign>0 else 7
  d.arc((x-7,17+bob,x+7,42+bob),-90 if sign>0 else 90,90 if sign>0 else 270,fill='#e6c37b',width=3)
  d.line((x,18+bob,x,41+bob),fill='#eae4cb',width=1)
  if frame in (1,3):d.line((x,29+bob,x+sign*7,27+bob),fill='#f3e2ac',width=1)
 elif job==2:
  x=39 if sign>0 else 9
  d.line((x,36+bob,x+sign*3,10+bob),fill='#dab482',width=3)
  d.ellipse((x+sign*3-4,8+bob,x+sign*3+4,16+bob),fill='#54d4f8',outline='#c6f8ff',width=2)
  d.point((x+sign*3,9+bob),fill='#ffffff')
 else:
  for x in (6,37):
   d.ellipse((x,26+bob,x+9,35+bob),fill='#a7534d',outline='#382f41',width=2)
   d.line((x+2,26+bob,x+6,29+bob),fill='#ffe39b',width=2)
 return im

for job in range(4):
 sheet=Image.new('RGBA',(4*48,8*48),(0,0,0,0))
 for dr in range(8):
  for frame in range(4):sheet.alpha_composite(hero_frame(job,dr,frame),(frame*48,dr*48))
 sheet.save(SPR/f'hero-{job}.png',optimize=True)
 print('hero',job,(SPR/f'hero-{job}.png').stat().st_size)

# Boss + monsters. Unique silhouettes for forest slime, fox, crab, wolf, golem, mummy, yeti, demon, ghost, angel etc.
MOB_PALETTES=[('#70cd7a','#2a8451','#d8f9a4'),('#bcaf83','#785841','#f4d7a1'),('#edb95d','#955846','#fff3ad'),('#8c99bb','#434b71','#d5dfff'),('#f5b76e','#b75b3f','#fce0aa'),('#98c6df','#4985b4','#e8fcff'),('#e87a53','#a03848','#ffc777'),('#a989e8','#554782','#e8c3ff'),('#b1e1ec','#5d82b2','#f2ffff'),('#c54b64','#622c4e','#ffa694')]
def mob_frame(kind,phase):
 r=random.Random(kind+phase*11);p=MOB_PALETTES[kind];im=Image.new('RGBA',(48,48));d=ImageDraw.Draw(im);dy=[0,-1,0,1][phase]
 d.ellipse((8,42,42,46),fill=(7,19,29,96))
 if kind==0:  # slime
  d.ellipse((5,12+dy,43,43+dy),fill=p[1],outline='#213c3c',width=2)
  d.ellipse((8,13+dy,40,39+dy),fill=p[0]);d.ellipse((10,14+dy,29,23+dy),fill=p[2])
  for x in [18,31]:d.ellipse((x,29+dy,x+4,34+dy),fill='#213946')
  d.arc((20,33+dy,31,41+dy),8,159,fill='#e9fff0',width=1)
 elif kind==1:  # treant mushroom
  d.rectangle((19,22+dy,29,39+dy),fill='#9f7651',outline='#493f39')
  for x in [19,30]:d.ellipse((x-4,32+dy,x+4,40+dy),fill='#72504a')
  d.polygon([(5,26+dy),(10,15+dy),(21,8+dy),(32,11+dy),(43,25+dy)],fill=p[1],outline='#352b43')
  d.ellipse((7,9+dy,41,29+dy),fill=p[0],outline='#513c43')
  for x,y in [(13,19),(24,12),(33,19),(25,24)]:d.ellipse((x-3,y-3+dy,x+3,y+1+dy),fill=p[2])
  for x in (21,29):d.rectangle((x,28+dy,x+2,32+dy),fill='#333247')
 elif kind==2:  # owl / fairy
  d.ellipse((13,13+dy,35,39+dy),fill=p[0],outline='#604340',width=2)
  for sign in [-1,1]:
   d.polygon([(24+sign*6,21+dy),(24+sign*22,17+dy),(24+sign*12,36+dy)],fill=p[1],outline='#69473b')
  d.polygon([(16,16+dy),(18,3+dy),(24,13+dy),(30,4+dy),(34,16+dy)],fill=p[0],outline='#754d42')
  for x in (20,29):d.ellipse((x-4,22+dy,x+3,30+dy),fill=p[2]);d.rectangle((x-1,24+dy,x+1,29+dy),fill='#373447')
 elif kind==3: # wolf
  poly(d,[(7,25+dy),(16,15+dy),(31,15+dy),(42,26+dy),(35,40+dy),(15,40+dy)],p[1])
  poly(d,[(10,17+dy),(8,5+dy),(22,11+dy),(31,10+dy),(40,4+dy),(39,26+dy),(25,33+dy)],p[0])
  for x in (18,30):d.rectangle((x-3,23+dy,x+2,26+dy),fill=p[2]);d.point((x,25+dy),fill='#222338')
  d.ellipse((22,29+dy,30,34+dy),fill='#51444c')
 elif kind==4: # scarab/crab
  d.ellipse((8,12+dy,40,41+dy),fill=p[1],outline='#5a3b3b',width=2)
  d.ellipse((12,13+dy,36,36+dy),fill=p[0]);d.ellipse((18,16+dy,28,27+dy),fill=p[2])
  for sign in [-1,1]:
   x=24+sign*14
   d.line((x,22+dy,x+sign*8,17+dy),fill=p[1],width=4)
   d.ellipse((x+sign*6-4,10+dy,x+sign*6+3,20+dy),fill=p[0]);d.line((x,33+dy,x+sign*8,41+dy),fill=p[1],width=3)
 elif kind==5: # ice golem
  poly(d,[(17,8+dy),(30,7+dy),(39,20+dy),(33,37+dy),(17,42+dy),(7,25+dy)],p[1])
  poly(d,[(20,11+dy),(32,11+dy),(34,25+dy),(28,36+dy),(12,27+dy)],p[0])
  for x in (17,30):d.line((x,19+dy,x+3,22+dy),fill=p[2],width=3)
  d.line((23,14+dy,28,8+dy),fill=p[2],width=2)
 elif kind==6: # dragon fire
  poly(d,[(11,35+dy),(4,14+dy),(22,25+dy),(29,10+dy),(43,34+dy)],p[1]);d.ellipse((11,20+dy,37,39+dy),fill=p[0],outline='#7b3339',width=2)
  d.polygon([(16,19+dy),(19,5+dy),(24,17+dy),(31,8+dy),(33,22+dy)],fill=p[0],outline='#752b3b')
  for x in (17,31):d.rectangle((x,25+dy,x+3,28+dy),fill=p[2])
 elif kind==7: # ghost witch
  d.polygon([(24,4+dy),(9,24+dy),(13,42+dy),(37,42+dy),(41,24+dy)],fill=p[1],outline='#34304b',width=2)
  d.ellipse((11,9+dy,38,30+dy),fill=p[0]);d.arc((11,8+dy,38,30+dy),205,338,fill=p[2],width=2)
  d.ellipse((15,22+dy,20,27+dy),fill='#e6e0ff');d.ellipse((28,22+dy,33,27+dy),fill='#e6e0ff')
 elif kind==8: # angel
  d.polygon([(12,24+dy),(2,12+dy),(5,34+dy),(16,41+dy)],fill='#f1f4e9',outline='#6387a6')
  d.polygon([(37,24+dy),(46,12+dy),(44,35+dy),(32,41+dy)],fill='#f1f4e9',outline='#6387a6')
  d.ellipse((15,11+dy,35,35+dy),fill=p[0],outline='#637e94')
  d.ellipse((15,7+dy,34,13+dy),outline='#fff8a2',width=2)
  for x in (20,30):d.ellipse((x-2,22+dy,x+1,25+dy),fill='#344060')
 else: # demon
  d.polygon([(8,37+dy),(5,14+dy),(17,23+dy),(27,7+dy),(42,23+dy),(41,40+dy)],fill=p[1],outline='#362338')
  d.polygon([(12,20+dy),(13,4+dy),(22,17+dy),(32,5+dy),(35,21+dy)],fill=p[0],outline='#43223f')
  d.ellipse((12,20+dy,37,39+dy),fill=p[0])
  for x in (18,30):d.rectangle((x,27+dy,x+3,30+dy),fill='#ffbd63')
 for i in range(6):
  if r.random()<.3:d.point((r.randrange(9,40),r.randrange(8,39)+dy),fill=p[2])
 return im

for i in range(10):
 im=Image.new('RGBA',(192,384))
 for row in range(8):
  for frame in range(4):
   unit=mob_frame(i,frame)
   if row in (1,2,3):unit=unit.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if row==2 else unit
   im.alpha_composite(unit,(frame*48,row*48))
 im.save(SPR/f'mob-{i}.png',optimize=True)
 print('mob',i,(SPR/f'mob-{i}.png').stat().st_size)

# True 16-frame alpha sprites for skill impact, not CSS shapes / repeated static images.
SKILL_COLOR=[('#fc9e4d','#ffdcb1'),('#80e6a0','#ffffff'),('#8ebdff','#e4ffff'),('#ff7686','#fff5aa')]
def effect_frame(kind,n):
 r=random.Random(kind*1000+n);im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im)
 t=n/15.;cx=48;cy=49;outer=12+t*30
 c=SKILL_COLOR[kind]
 # radial additive-like glowing rings, fully transparent background.
 for ring in range(4):
  if n in (0,15) and ring>1:continue
  rad=outer+(ring-2)*4
  alpha=int((150-ring*26)*(math.sin(t*math.pi)**.55))
  alpha=max(0,min(245,alpha))
  if rad>1:
   d.arc((cx-rad,cy-rad*.47,cx+rad,cy+rad*.47),int(n*32+ring*18),int(n*32+ring*18+270),fill=(*hx(c[0]),alpha),width=3 if ring<2 else 1)
 # class-specific main geometric combat shapes
 if kind==0: # sword sweeping slash
  angles=(210+n*13,325+n*13)
  for delta in range(4):
   rad=15+delta*4+t*7
   a0=math.radians(angles[0]);a1=math.radians(angles[1]);pts=[]
   for j in range(22):
    a=a0+(a1-a0)*j/21
    pts.append((cx+math.cos(a)*(rad+12),cy+math.sin(a)*(rad+12)))
   d.line(pts,fill=(*hx(c[0]),int(170*(1-t))),width=max(1,5-delta))
  d.line((cx-25,cy+16,cx+23,cy-19),fill=(*hx(c[1]),int(240*(1-t))),width=3)
 elif kind==1: # spiraling thorn arrows
  for arm in range(6):
   a=t*5+arm*math.pi/3
   x=cx+math.cos(a)*outer;y=cy+math.sin(a)*outer*.63
   d.polygon([(x,y-12),(x+4,y),(x,y+11),(x-4,y)],fill=(*hx(c[0]),int(220*(1-t))))
  d.ellipse((cx-8,cy-8,cx+8,cy+8),fill=(*hx(c[1]),int(100*(1-t))))
 elif kind==2: # ice celestial burst
  for arm in range(8):
   angle=math.pi*arm/4+t*.25;rr=10+20*t
   x=cx+math.cos(angle)*rr;y=cy+math.sin(angle)*rr
   x2=cx+math.cos(angle)*(rr+13);y2=cy+math.sin(angle)*(rr+13)
   d.line((x,y,x2,y2),fill=(*hx(c[0]),int(240*(1-t))),width=4)
   d.line((x,y,x2,y2),fill=(*hx(c[1]),int(220*(1-t))),width=1)
 else: # fiery star punching impact
  for arm in range(8):
   a=arm*math.pi/4+r.random()*.2
   rr=9+t*18
   x=cx+math.cos(a)*rr;y=cy+math.sin(a)*rr
   x2=cx+math.cos(a)*(rr+14);y2=cy+math.sin(a)*(rr+14)
   d.line((x,y,x2,y2),fill=(*hx(c[0]),int(240*(1-t))),width=4)
   d.line((x+2,y,x2,y2),fill=(*hx(c[1]),int(150*(1-t))),width=2)
 # changing particles
 for i in range(25):
  ang=r.random()*math.pi*2;radius=(10+r.random()*28)*(.7+t)
  x=cx+math.cos(ang)*radius;y=cy+math.sin(ang)*radius
  alpha=int((1-t)*200*r.random())
  if alpha>0:d.ellipse((x-1,y-1,x+1,y+1),fill=(*hx(c[i%2]),alpha))
 return im

for idx in range(4):
 atlas=Image.new('RGBA',(4*96,4*96))
 for n in range(16):atlas.alpha_composite(effect_frame(idx,n),((n%4)*96,(n//4)*96))
 atlas.save(FX/f'skill-{idx}.png',optimize=True)
 print('fx',idx,(FX/f'skill-{idx}.png').stat().st_size)

(BASE/'manifest.json').write_text(json.dumps({'version':'0.4','frame':{'hero':48,'mob':48,'effects':96},'columns':{'hero':4,'mob':4,'effects':4},'rows':{'hero':8,'mob':8,'effects':4},'maps':10,'hero_sheets':4,'monster_sheets':10,'effect_sheets':4},indent=2))
print('complete')