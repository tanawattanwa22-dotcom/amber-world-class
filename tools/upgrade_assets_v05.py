from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
from pathlib import Path
import math,random,json
R=Path(__file__).resolve().parents[1]/'assets'
M=R/'maps';S=R/'sprites';F=R/'effects';U=R/'ui'
for p in [M,S,F,U]:p.mkdir(exist_ok=True,parents=True)
PALETTES=[('#e9ad61','#975c49','#629f63','#57bada'),('#9bdca9','#487b59','#80d9b9','#5be6bc'),('#eacc94','#da9149','#bfbc6b','#92d4f5'),('#aac5ed','#7f91c5','#87a69c','#b0dcff'),('#ffd19c','#ba7055','#d7aa6c','#fed17d'),('#d0f2ff','#6e9fcb','#e9f5ff','#84dbff'),('#ffad6b','#b94142','#8c4953','#ff6d44'),('#cbb1e9','#62477c','#a491c2','#b56bee'),('#fff3d5','#a5b9d0','#b1f1e3','#ffd87a'),('#f6a28c','#832b37','#6b475d','#fd764e')]
def C(t):return tuple(int(t.lstrip('#')[i:i+2],16) for i in (0,2,4))
def mix(a,b,t):return tuple(int(a[k]*(1-t)+b[k]*t) for k in range(3))
def rgba(color,a=255):return (*C(color),a)
def hline(d,x,y,w,c,t=1):d.rectangle((x,y,x+w,y+t),fill=c)
def brick(d,x,y,w,h,r,col):
 d.rectangle((x,y,x+w,y+h),fill=col,outline='#564a60',width=2)
 for k in range(int(h/7)):
  yy=y+4+k*7
  for j in range(int(w/16)+1):
   xx=x+(j*16+(8 if k%2 else 0))
   if xx<=x+w-5:d.line((xx,yy,xx+9,yy),fill='#dbc4ab',width=1)
   if r.random()<.25:d.point((xx+4,yy-3),fill='#736671')
def fortified_building(d,r,x,y,w,h,roof,tone=0):
 # World-space building with wall facade, crenellations, window arches, flags and roof tile highlights.
 d.ellipse((x-10,y+h-4,x+w+13,y+h+13),fill='#293743')
 brick(d,x+4,y+12,w-8,h-8,r,'#a5a4a0' if tone==0 else '#8b7d77')
 for ix in range(x+15,x+w-12,23):
  d.rounded_rectangle((ix,y+28,ix+11,y+45),3,fill='#263449',outline='#d6b27f',width=2)
  d.line((ix+5,y+30,ix+5,y+40),fill='#f4dc97',width=1)
 for ix in range(x+8,x+w-6,14):d.rectangle((ix,y+4,ix+9,y+15),fill='#d6c3a5',outline='#6a5a60')
 d.polygon([(x-15,y+15),(x+w//2,y-30),(x+w+14,y+15)],fill='#3b3346',outline='#f0bd70',width=2)
 d.polygon([(x-10,y+9),(x+w//2,y-25),(x+w+9,y+9)],fill=roof,outline='#483247',width=2)
 for k in range(4):
  yy=y-17+k*7;span=int(w*(k+1)/10)
  d.line((x+w//2-span,yy,x+w//2+span,yy),fill='#f5c58e',width=2)
 for xx in range(x+13,x+w-6,16):d.line((xx,y+12,xx+6,y+16),fill='#76434b',width=1)
 for side in [x+4,x+w-5]:
  d.line((side,y+2,side,y-36),fill='#493948',width=2)
  d.polygon([(side,y-34),(side+12,y-30),(side,y-23)],fill='#2a66aa')
  d.line((side+2,y-30,side+8,y-30),fill='#efcf74',width=1)
def fancy_tower(d,r,x,y,h=105):
 d.ellipse((x-30,y-6,x+30,y+13),fill='#20303b')
 d.polygon([(x-22,y),(x-24,y-h+22),(x+21,y-h+22),(x+21,y)],fill='#9ea7a8',outline='#55616b',width=3)
 for k in range(5):
  yy=y-h+24+k*16;d.line((x-21,yy,x+20,yy),fill='#e0ccae',width=2)
 for yy in [y-h+46,y-h+66]:
  d.rounded_rectangle((x-7,yy-7,x+6,yy+8),4,fill='#2c3550',outline='#edc783',width=2)
 d.polygon([(x-32,y-h+23),(x,y-h-21),(x+33,y-h+23)],fill='#44344e',outline='#efc282',width=2)
 d.polygon([(x-26,y-h+19),(x,y-h-16),(x+27,y-h+19)],fill='#405d9e',outline='#d8a967')
 d.line((x,y-h-14,x,y-h-36),fill='#dec991',width=2)
 d.polygon([(x,y-h-34),(x+18,y-h-29),(x,y-h-20)],fill='#d64e5b')
def lamp(d,x,y):
 d.ellipse((x-7,y,x+10,y+6),fill='#2a3842')
 d.line((x,y,x,y-29),fill='#3b4056',width=5)
 d.rounded_rectangle((x-7,y-41,x+6,y-28),2,fill='#edb75f',outline='#4c4150',width=2)
 d.rectangle((x-3,y-40,x+3,y-30),fill='#ffe8a1')
 d.polygon([(x-9,y-42),(x,y-49),(x+9,y-42)],fill='#424156')
def decorated_tree(d,r,x,y,s=1.0,col='#49865d'):
 z=int(25*s);d.ellipse((x-z,y-2,x+z,y+12),fill='#1a3233')
 d.polygon([(x-5,y),(x+7,y),(x+6,y-31*s),(x-5,y-32*s)],fill='#6d5149')
 for j,(ax,ay) in enumerate([(-.65,-1.35),(.55,-1.36),(-.13,-1.82),(0,-.8)]):
  cx=int(x+z*ax);cy=int(y+z*ay);rr=int(z*.77)
  d.ellipse((cx-rr,cy-rr,cx+rr,cy+rr),fill='#204536',outline='#132c32',width=2)
  d.ellipse((cx-rr+4,cy-rr+3,cx+rr-3,cy+rr-3),fill=col)
  for _ in range(14):
   xx=cx+r.randint(-rr+3,rr-4);yy=cy+r.randint(-rr+3,rr-4)
   d.rectangle((xx,yy,xx+2,yy+2),fill=r.choice(['#9fd08d','#d4eead','#5cbb72','#ffda83','#e1f1c5']))
def banner(d,x,y,color='#335da2'):
 d.line((x,y-63,x,y+3),fill='#33394c',width=3)
 d.line((x,y-62,x+25,y-62),fill='#e4b96d',width=3)
 d.polygon([(x+3,y-58),(x+22,y-58),(x+22,y-21),(x+12,y-28),(x+3,y-21)],fill=color,outline='#f9d693',width=2)
 d.polygon([(x+12,y-52),(x+18,y-45),(x+12,y-33),(x+6,y-45)],fill='#ffdc80')
def flowerbeds(d,r,x,y,w=70,h=32):
 d.ellipse((x,y+h-9,x+w,y+h),fill='#315245')
 d.rounded_rectangle((x,y,x+w,y+h),6,fill='#2d684a',outline='#7f724d',width=2)
 for _ in range(70):
  xx=x+r.randint(6,w-7);yy=y+r.randint(4,h-5)
  d.point((xx,yy),fill=r.choice(['#f9e997','#f49ba9','#a3bcff','#fdfdf4','#eebd69','#a4d6ae']))
def temple(d,r,x,y,idx):
 color=PALETTES[idx];base='#555264' if idx in (3,7,9) else '#ad8b65'
 d.ellipse((x-11,y+65,x+165,y+86),fill='#1d303f')
 d.rectangle((x,y+22,x+156,y+72),fill=base,outline='#272d40',width=3)
 for j in range(6):
  xx=x+j*27+10;d.rectangle((xx,y+18,xx+12,y+68),fill='#b4a89c',outline='#4e4e65',width=2)
  d.rectangle((xx-3,y+10,xx+16,y+20),fill='#d8bd95',outline='#756a68')
 d.polygon([(x-10,y+12),(x+79,y-40),(x+166,y+12)],fill='#334862',outline='#efc57a',width=3)
 d.polygon([(x+2,y+9),(x+79,y-31),(x+155,y+9)],fill=color[1],outline='#cb9c70',width=1)
 for k in range(13):
  xx=x+k*12;d.line((xx,y+18,xx+5,y+18),fill='#eac495',width=1)
def glitter(d,r,idx):
 palette=PALETTES[idx]
 for _ in range(175):
  x=r.randrange(8,568);y=r.randrange(12,568)
  if 209<x<350 and 200<y<360:continue
  if r.random()<.22:
   d.line((x-2,y,x+2,y),fill=palette[0],width=1);d.line((x,y-2,x,y+2),fill=palette[3],width=1)
  else:d.point((x,y),fill=r.choice([palette[0],palette[2],'#f8ebbb']))
for idx in range(10):
 fp=M/f'map-{idx+1:02d}.png';img=Image.open(fp).convert('RGB').resize((576,576),Image.Resampling.NEAREST)
 d=ImageDraw.Draw(img);r=random.Random(5505+idx)
 # Preserve road intersection and spawn geometry; elaborate map periphery with detailed original tile buildings.
 if idx==0:
  fortified_building(d,r,18,52,125,79,'#ae564a')
  fancy_tower(d,r,475,101,111)
  fortified_building(d,r,391,383,138,68,'#be7356')
  for x,y,sz in [(151,88,1.3),(399,168,1.0),(78,512,1.2),(524,467,1.05),(530,208,.9),(65,385,1.2)]:decorated_tree(d,r,x,y,sz)
  for x,y in [(200,206),(350,206),(178,353),(390,342),(382,85)]:banner(d,x,y)
  for x,y in [(198,382),(365,399),(113,200),(417,436),(67,258)]:flowerbeds(d,r,x,y)
  for x,y in [(214,188),(338,187),(213,380),(346,384)]:lamp(d,x,y)
 elif idx==1:
  temple(d,r,384,402,idx)
  for x,y in [(60,110),(456,100),(468,467),(87,496),(144,437),(407,340),(87,347)]:decorated_tree(d,r,x,y,1.1,idx and '#2d9873')
  for x,y in [(142,161),(403,322),(351,162),(147,494)]:flowerbeds(d,r,x,y)
 elif idx==2:
  fortified_building(d,r,16,61,127,74,'#c16841')
  fancy_tower(d,r,486,134,88)
  for x,y in [(72,165),(425,92),(480,512),(73,491),(156,505)]:decorated_tree(d,r,x,y,.9,'#7dac54')
  for x,y in [(174,204),(350,399),(414,355),(35,382)]:flowerbeds(d,r,x,y)
 elif idx==3:
  temple(d,r,395,395,idx);fancy_tower(d,r,116,146,105);fortified_building(d,r,10,439,148,83,'#657da3')
  for x,y in [(137,388),(396,193),(161,200)]:banner(d,x,y,'#315788')
 elif idx==4:
  temple(d,r,385,384,idx);fortified_building(d,r,20,80,119,65,'#a97757');fancy_tower(d,r,470,120,89)
 elif idx==5:
  fancy_tower(d,r,129,148,111);temple(d,r,380,407,idx)
  for x,y in [(80,413),(430,152),(479,509),(190,105)]:decorated_tree(d,r,x,y,.85,'#9fcae8')
 elif idx==6:
  temple(d,r,383,370,idx);fancy_tower(d,r,125,143,110)
  for x,y in [(140,401),(403,202),(165,145)]:banner(d,x,y,'#9b2538')
 elif idx==7:
  temple(d,r,390,394,idx);fortified_building(d,r,36,82,138,76,'#553972');fancy_tower(d,r,481,116,109)
 elif idx==8:
  temple(d,r,384,384,idx);fortified_building(d,r,30,60,125,81,'#d5e0e8')
  for x,y in [(67,424),(497,154),(478,480)]:decorated_tree(d,r,x,y,.9,'#b4e5e2')
 else:
  temple(d,r,381,391,idx);fortified_building(d,r,17,70,142,76,'#542b43');fancy_tower(d,r,483,146,96)
 glitter(d,r,idx)
 img=ImageEnhance.Color(img).enhance(1.13);img=ImageEnhance.Contrast(img).enhance(1.08)
 img.resize((1152,1152),Image.Resampling.NEAREST).save(fp,optimize=True)
 print('ENHANCED',idx+1,fp.stat().st_size)

# 4-direction overlays preserving the sprite contract: 4 columns x 8 directions, each frame 48x48 with transparent background.
for job in range(4):
 r=random.Random(900+job);colors=[('#ffd98a','#f9a76d','#e6f9ff'),('#75e0a8','#e3ffbb','#d4ffc4'),('#73dbff','#c4eaff','#f5efff'),('#ffc16b','#ff713e','#fff4a1')][job]
 sheet=Image.new('RGBA',(192,384),(0,0,0,0))
 for dr in range(8):
  for frame in range(4):
   cell=Image.new('RGBA',(48,48));d=ImageDraw.Draw(cell)
   n=math.sin(frame*math.pi/2);flap=4*n
   if dr in (4,3,5):face=-1
   elif dr in (1,7,6):face=1
   else:face=0
   # animated independent magical cape/wing layer, connected to back anchor at (24,27).
   for side in [-1,1]:
    if dr==4: width=9
    else:width=14+int(flap*side*.5)
    x=24+side*2;tipx=24+side*(21+int(abs(flap)))
    d.polygon([(x,23),(24+side*10,17),(tipx,7-int(flap)),(24+side*width,31),(x,33)],fill=rgba(colors[1],220),outline=rgba(colors[0],250))
    for k in range(3):
     d.line((x+side*5,20+k*3,tipx-side*2,11+k*4-int(flap)),fill=rgba(colors[2],240),width=1)
   for k in range(3):
    x=6+((job*3+dr*7+frame*5+k*13)%34);y=6+((k*13+job*2+dr*3)%26)
    d.line((x-2,y,x+2,y),fill=rgba(colors[0],230));d.line((x,y-2,x,y+2),fill=rgba(colors[2],230))
   sheet.alpha_composite(cell,(frame*48,dr*48))
 sheet.save(S/f'wing-{job}.png',optimize=True)
 print('WING',job)

# Ten visually distinct boss creatures, real 4x8 PNG atlases with sprite-frame alignment and skill pose differences.
BOSS_LABELS=['Royal Slime','Ancient Treant','Thunder Griffin','Stone Guardian','Desert Pharaoh','Frost Wyrm','Ember Drake','Night Empress','Seraph','Immortal Demon']
BOSS_COLORS=[('#fa80c5','#f9bfd7','#ffda5f'),('#3f8b56','#b3d890','#d2a661'),('#a87e44','#fff1cb','#b7dfff'),('#67738d','#c7cbd3','#e7ac75'),('#b48e58','#e3c58f','#4bcbff'),('#3c8fdf','#defbff','#76ddff'),('#aa3537','#ff8241','#ffdb66'),('#513066','#bd86dc','#eb9cff'),('#e6d8a4','#fff4de','#b5dffa'),('#4c253a','#e44145','#ff8733')]
def draw_boss(d,kind,frame,direction):
 r=random.Random(kind*500+frame*17+direction)
 dark,light,accent=BOSS_COLORS[kind];bob=[0,1,0,-1][frame];cy=25+bob
 d.ellipse((9,42,41,47),fill=(6,10,30,85))
 # dark outline and oversize silhouette unique to each family
 if kind==0:
  d.ellipse((7,17+bob,43,42+bob),fill=rgba(dark),outline=rgba('#633d6b'),width=2)
  d.ellipse((10,19+bob,40,30+bob),fill=rgba(light))
  d.polygon([(15,18),(18,10),(23,14),(27,8),(30,15),(35,11),(35,20)],fill=rgba('#dba64a'),outline=rgba('#fff2a0'))
  d.ellipse((21,12,28,17),fill=rgba('#f4d662'))
 elif kind==1:
  d.rectangle((19,17+bob,32,42+bob),fill=rgba('#805b40'),outline=rgba('#433842'),width=2)
  for arm in [-1,1]:
   d.line((25,28+bob,25+arm*18,19+bob),fill=rgba('#755b45'),width=6)
   d.ellipse((min(25+arm*12,25+arm*23),12+bob,max(25+arm*12,25+arm*23),25+bob),fill=rgba(dark),outline=rgba(light))
  for x,y in [(12,18),(23,12),(34,16),(19,9),(31,9)]:d.ellipse((x-7,y-6,x+7,y+6),fill=rgba(dark),outline=rgba(accent))
 elif kind in (2,5,6,9):
  d.polygon([(24,24),(5,9+bob),(8,32+bob),(20,36+bob),(25,43)],fill=rgba(dark),outline=rgba(accent))
  d.polygon([(25,24),(42,9+bob),(39,32+bob),(30,38+bob),(26,43)],fill=rgba(dark),outline=rgba(accent))
  d.ellipse((13,22+bob,36,40+bob),fill=rgba(dark),outline=rgba(light),width=2)
  d.polygon([(11,26+bob),(15,12+bob),(22,17+bob),(28,8+bob),(34,22+bob),(37,27+bob)],fill=rgba(light),outline=rgba(accent))
  for x in [18,29]:d.polygon([(x-4,17+bob),(x,6+bob),(x+5,18+bob)],fill=rgba(accent))
 elif kind in (3,4,7,8):
  d.polygon([(14,42+bob),(16,23+bob),(11,13+bob),(23,6+bob),(34,12+bob),(30,23+bob),(35,42+bob)],fill=rgba(dark),outline=rgba(light),width=2)
  d.ellipse((15,11+bob,34,30+bob),fill=rgba(light),outline=rgba(accent),width=2)
  for arm in [-1,1]:
   d.polygon([(23+arm*7,24+bob),(23+arm*18,22+bob),(23+arm*20,40+bob),(23+arm*12,44+bob)],fill=rgba(dark),outline=rgba(accent))
  if kind==8:
   for arm in [-1,1]:d.polygon([(24+arm*8,18+bob),(24+arm*24,6+bob),(24+arm*20,31+bob)],fill=rgba('#f7f7ea'),outline=rgba(accent))
  else:d.polygon([(12,10+bob),(15,4+bob),(22,9+bob),(27,3+bob),(34,9+bob)],fill=rgba(accent))
 # eyes and glints
 for x in [20,30]:
  d.rectangle((x-2,23+bob,x+1,25+bob),fill=rgba('#172433'))
  d.point((x,23+bob),fill=rgba('#ffffff'))
 for k in range(12):
  x=r.randint(3,45);y=r.randint(3,39)
  if frame==2 or k<3:
   d.point((x,y),fill=rgba(accent,220));
   if k%5==0:d.line((x-2,y,x+2,y),fill=rgba(light))
for kind in range(10):
 sheet=Image.new('RGBA',(192,384),(0,0,0,0))
 for direction in range(8):
  for frame in range(4):
   cell=Image.new('RGBA',(48,48),(0,0,0,0));d=ImageDraw.Draw(cell)
   draw_boss(d,kind,frame,direction);sheet.alpha_composite(cell,(frame*48,direction*48))
 sheet.save(S/f'boss-{kind:02d}.png',optimize=True)
 print('BOSS',kind,(S/f'boss-{kind:02d}.png').stat().st_size)

# Four high-energy true animated 16-frame skill sprite sheets: 4 x 4 cells, each 96px transparent.
for job in range(4):
 sheet=Image.new('RGBA',(384,384),(0,0,0,0));rng=random.Random(23000+job)
 cs=[('#f76564','#ffd69c','#fff1c9'),('#5ffb98','#b4ffbd','#e6fff1'),('#3d8cf7','#8adeff','#e7f5ff'),('#ffa53e','#ffc35a','#fff0b8')][job]
 for frame in range(16):
  im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im)
  phase=frame/15;radius=7+phase*36;fade=255 if frame<11 else int(255*(1-(frame-10)/6))
  if job==0:
   # directional slash and explosive melee trails
   a=math.radians(-155+260*phase)
   for z in range(5):
    ang=a+z*.045;rad=radius+z*3
    box=(48-rad,48-rad,48+rad,48+rad)
    d.arc(box,math.degrees(ang),math.degrees(ang)+170,fill=rgba(cs[z%3],fade),width=max(1,7-z))
   d.line((48,48,48+math.cos(a)*radius*1.15,48+math.sin(a)*radius*1.15),fill=rgba(cs[2],fade),width=3)
  elif job==1:
   # emerald arrow burst ring and 8 feather rays
   for a in range(0,360,45):
    t=math.radians(a+frame*6);x=48+math.cos(t)*radius;y=48+math.sin(t)*radius
    d.line((48,48,x,y),fill=rgba(cs[0],fade),width=3)
    d.polygon([(x,y),(x-5*math.sin(t),y+5*math.cos(t)),(x+8*math.cos(t),y+8*math.sin(t))],fill=rgba(cs[1],fade))
   d.ellipse((48-radius*.4,48-radius*.4,48+radius*.4,48+radius*.4),outline=rgba(cs[2],fade),width=2)
  elif job==2:
   # ice crystals and magic circles
   for k in range(8):
    a=2*math.pi*k/8+phase*.2;x=48+math.cos(a)*radius;y=48+math.sin(a)*radius
    d.line((48,48,x,y),fill=rgba(cs[k%3],fade),width=3)
    d.polygon([(x,y-7),(x+4,y),(x,y+8),(x-4,y)],fill=rgba(cs[2],fade))
   d.arc((48-radius,48-radius,48+radius,48+radius),frame*22,frame*22+265,fill=rgba(cs[1],fade),width=3)
  else:
   # fire shockwave and pulsing meteors
   for k in range(10):
    a=(k*2*math.pi/10)+phase*.3;x=48+math.cos(a)*radius;y=48+math.sin(a)*radius
    rr=4+6*math.sin(phase*math.pi)
    d.polygon([(x,y-rr),(x+rr*.7,y+3),(x,y+rr*.9),(x-rr*.7,y+3)],fill=rgba(cs[k%3],fade))
   d.ellipse((48-radius*.6,48-radius*.6,48+radius*.6,48+radius*.6),outline=rgba(cs[0],fade),width=4)
  for k in range(10):
   x=rng.randint(10,86);y=rng.randint(10,86)
   if frame%2==k%2:d.point((x,y),fill=rgba(cs[1],max(0,fade-45)))
  sheet.alpha_composite(im,((frame%4)*96,(frame//4)*96))
 sheet.save(F/f'skill-{job}.png',optimize=True)
 print('SKILL',job,(F/f'skill-{job}.png').stat().st_size)

# UI icons - source-authored, transparent RGBA atlas, 6 columns x 4 rows, 64 px cells.
ic=Image.new('RGBA',(384,256));d=ImageDraw.Draw(ic)
colors=['#ffac68','#7ddcff','#f66b8a','#72d4a0','#bd94ff','#f3d77e']
for y in range(4):
 for x in range(6):
  cx=x*64+32;cy=y*64+32
  d.rounded_rectangle((cx-27,cy-27,cx+27,cy+27),9,fill='#12213d',outline='#a77743',width=3)
  d.rounded_rectangle((cx-23,cy-23,cx+23,cy+23),7,outline='#efc681',width=1)
  clr=colors[(y+x)%6]
  if y==0:
   d.polygon([(cx-7,cy+18),(cx+4,cy-18),(cx+13,cy-14),(cx+1,cy+18)],fill=clr,outline='#fff4cd')
  elif y==1:
   d.ellipse((cx-14,cy-14,cx+14,cy+14),fill=clr,outline='#fff0d1',width=3)
   d.rectangle((cx-4,cy-18,cx+4,cy-10),fill='#e8cb94')
  elif y==2:
   d.rectangle((cx-15,cy-14,cx+15,cy+16),fill=clr,outline='#f6d49c',width=2)
   d.line((cx-12,cy-2,cx+12,cy-2),fill='#14283e',width=3)
  else:
   d.polygon([(cx,cy-19),(cx+17,cy-5),(cx+13,cy+17),(cx-13,cy+17),(cx-17,cy-5)],fill=clr,outline='#f7e8b7',width=2)
  d.point((cx-13,cy-17),fill='#fff8d0')
ic.save(U/'interface-icons-v05.png',optimize=True)
manifest={
 'version':'0.5-art-foundation','frame':48,'hero_sprite':{'cols':4,'rows':8,'size':[192,384]},
 'boss_sprite':{'cols':4,'rows':8,'size':[192,384]},
 'wings':{'cols':4,'rows':8,'size':[192,384]},
 'skill_effect':{'cols':4,'rows':4,'frame':96,'size':[384,384]},
 'ui_atlas':{'cols':6,'rows':4,'frame':64,'size':[384,256]},
 'maps':[f'map-{i+1:02d}.png' for i in range(10)],
 'bosses':[f'boss-{i:02d}.png' for i in range(10)],
 'note':'Source-made layered procedurally pixel-rendered game assets, not crops of reference collages. Art remains an intermediate style iteration.'
}
(R/'manifest_v05.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('DONE')
