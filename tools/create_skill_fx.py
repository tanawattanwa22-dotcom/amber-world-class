from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import math,random
out=Path('/mnt/data/awc_v06_build/assets/effects');out.mkdir(exist_ok=True,parents=True)
S=96

def draw_arc(draw,cx,cy,r,start,end,color,width=2):
 pts=[(int(cx+math.cos(start+(end-start)*j/40)*r),int(cy+math.sin(start+(end-start)*j/40)*r*.68)) for j in range(41)]
 draw.line(pts,fill=color,width=width,joint='curve')

def effect(role,frame):
 rnd=random.Random(92301+role*10000+frame*29)
 t=(frame+1)/16
 n=Image.new('RGBA',(S,S)); glow=Image.new('RGBA',(S,S)); d=ImageDraw.Draw(n);g=ImageDraw.Draw(glow)
 cx,cy=48,53
 colors=[((255,74,99,245),(255,205,130,255)),((94,242,152,245),(220,255,160,255)),((81,164,255,245),(217,246,255,255)),((255,126,54,245),(255,226,99,255))][role]
 col,light=colors
 amp=math.sin(min(1,t)*math.pi)**.5
 if role==0: # huge spinning sword slash, shifted across frames
  angle=-1.7+t*math.pi*2.3
  for k in range(3):
   radius=24+k*6+(t*8)
   draw_arc(g,cx,cy,radius,angle-1.1,angle+.6,(255,48,69,100),7)
   draw_arc(d,cx,cy,radius,angle-1.1,angle+.6,(255,76,92,int(180*amp+20)),4)
   draw_arc(d,cx,cy,radius,angle-.9,angle+.52,(255,225,185,int(210*amp+20)),2)
  for q in range(4):
   a=angle+q*.33;rr=35+q*5;px=cx+math.cos(a)*rr;py=cy+math.sin(a)*rr*.68
   d.line([(px-5,py+3),(px+5,py-3)],fill=(255,242,194,200),width=2)
  d.ellipse((cx-7,cy-7,cx+7,cy+7),outline=(255,206,134,int(160*amp)),width=2)
 elif role==1: # 5 homing emerald arrows / leaf spiral
  a=t*7
  for k in range(5):
   theta=a+k*math.pi*2/5;rr=8+t*33
   px=cx+math.cos(theta)*rr; py=cy+math.sin(theta)*rr*.72
   g.line([(cx,cy),(px,py)],fill=(51,247,120,70),width=5)
   d.line([(cx,cy),(px,py)],fill=(57,229,137,int(130+65*amp)),width=2)
   vx=math.cos(theta);vy=math.sin(theta)
   tip=(px+vx*9,py+vy*9)
   d.polygon([tip,(px-vy*5,py+vx*5),(px+vy*5,py-vx*5)],fill=(203,255,143,int(180+60*amp)))
  for k in range(3):
   rr=(8+t*35)+k*3
   draw_arc(d,cx,cy,rr,1+t*3,3.3+t*3,(124,254,160,int(100*amp+30)),1)
 elif role==2: # blue ice crystal summon circle, shards launch sky
  rr=11+t*32
  draw_arc(g,cx,cy,rr,0,2*math.pi,(77,153,255,int(95*amp+10)),7)
  draw_arc(d,cx,cy,rr,0,2*math.pi,(166,231,255,int(225*amp+20)),2)
  draw_arc(d,cx,cy,rr*.75,0,2*math.pi,(74,150,250,int(125*amp+40)),2)
  for k in range(7):
   a=k*2*math.pi/7+t*.3
   x=cx+math.cos(a)*rr; y=cy+math.sin(a)*rr*.75
   h=10+12*amp
   poly=[(x,y-h),(x-5,y+4),(x,y+11),(x+5,y+4)]
   d.polygon(poly,fill=(105,189,255,int(180*amp+60)),outline=(235,251,255,210))
   d.line([(x,y-h),(x,y+9)],fill=(223,253,255,245),width=1)
  d.ellipse((cx-6,cy-9,cx+6,cy+7),fill=(162,233,255,int(100*amp+40)))
 elif role==3: # sunburst fist landing and erupting magma sparks
  rr=4+35*t
  g.ellipse((cx-rr,cy-rr,cx+rr,cy+rr),fill=(255,93,24,int(65*amp+7)))
  d.ellipse((cx-rr*.65,cy-rr*.65,cx+rr*.65,cy+rr*.65),outline=(255,160,62,int(195*amp+30)),width=3)
  for k in range(16):
   a=k*math.pi/8+0.09;rad=rr*(.6+rnd.uniform(.2,.7));rad2=rad+8+8*amp
   x1=cx+math.cos(a)*rad;y1=cy+math.sin(a)*rad*.82
   x2=cx+math.cos(a)*rad2;y2=cy+math.sin(a)*rad2*.82
   d.line([(x1,y1),(x2,y2)],fill=colors[1],width=2 if k%3 else 4)
   g.line([(x1,y1),(x2,y2)],fill=(251,81,24,int(150*amp)),width=6)
  d.ellipse((cx-10*amp,cy-10*amp,cx+10*amp,cy+10*amp),fill=(255,247,170,int(205*amp+20)))
 # all styles independent particles with physically expanding radii and fade
 for k in range(38):
  a=rnd.uniform(0,math.pi*2);r=(12+rnd.uniform(0,45))*(t*.8+.12)
  x=cx+math.cos(a)*r;y=cy+math.sin(a)*r*.8
  alpha=int(180*amp*rnd.uniform(.45,1))
  if alpha<10:continue
  rr=rnd.choice([1,1,2,2,3]);d.rectangle((int(x),int(y),int(x)+rr,int(y)+rr),fill=(*light[:3],alpha))
 glow=glow.filter(ImageFilter.GaussianBlur(2.2))
 glow.alpha_composite(n)
 return glow
for role in range(4):
 sheet=Image.new('RGBA',(S*4,S*4))
 for f in range(16):sheet.alpha_composite(effect(role,f),((f%4)*S,(f//4)*S))
 sheet.save(out/f'skill-{role}.png',optimize=True)
 print(role,(out/f'skill-{role}.png').stat().st_size)
# effect comparison image
preview=Image.new('RGB',(1024,500),'#0d1526')
from PIL import ImageDraw
D=ImageDraw.Draw(preview);names=['SWORD ARC','ARCHER WAVE','MAGE CRYSTALS','FIGHTER BURST']
for r in range(4):
 D.text((16,15+r*119),names[r],fill='#e3bf8b')
 src=Image.open(out/f'skill-{r}.png')
 for j,fi in enumerate([0,3,7,11,15]):
  cell=src.crop(((fi%4)*S,(fi//4)*S,((fi%4)+1)*S,((fi//4)+1)*S))
  cell=cell.resize((96,96),Image.Resampling.NEAREST)
  preview.paste(cell,(245+j*144,7+r*119),cell)
preview.save('/mnt/data/AWC_V06_SKILL_PREVIEW.png',optimize=True)
