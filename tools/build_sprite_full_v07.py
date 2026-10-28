#!/usr/bin/env python3
"""AMBER WORLD CLASS V0.7 - original deterministic frame-by-frame pixel art.
Only writes generated files into public/assets/v07/; existing game assets remain untouched.
No third-party game files, reference image crops, database access or API secrets.
"""
from __future__ import annotations
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
from math import sin, cos, pi
import random, json, argparse, colorsys

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'/'assets'/'v07'
ACTS=['idle','walk','attack','cast','hurt','die']
CLASSES=['Sword','Archer','Mage','Fighter']
KINDS=['slime','fox','mushroom','golem','bat','skeleton','scorpion','dragon','elemental','plant','spirit','mimic']
COLORS=[
 ('#f65f79','#a9295b','#ffd1cf'),('#6dd39d','#126e59','#e0ffd0'),
 ('#66bbff','#293e9e','#d9f5ff'),('#ffc66b','#d4543f','#fff4cc')]
SKILL_NAMES=['จันทร์เสี้ยว','คมดาบ','พายุ','ทะลวง','ประกาย','มหาจักร','กระแทก','ดวงดาว','คลื่น','ทะยาน','ฟาดฟัน','คริสตัล','พลังมังกร','แสงอรุณ','ระเบิด','วงแหวน','สายฟ้า','มหาเวท','ศรวิญญาณ','จิตพิฆาต','อุกกาบาต','ลมหมุน','ราชัน','สลาตัน','แยกเงา','ประกายฟ้า','พลังอสูร','มหาพายุ','จันทรา','อัลติเมต']

def hexrgb(s):return tuple(int(s[i:i+2],16) for i in (1,3,5))
def rgba(s,a=255):return (*hexrgb(s),a)
def darker(c,k=.55):return tuple(int(x*k) for x in c[:3])+(255,)
def rect(d,box,fill,outline=None,w=1):d.rectangle(tuple(int(v) for v in box),fill=fill,outline=outline,width=w)
def ellipse(d,box,fill,outline=None,w=1):d.ellipse(tuple(int(v) for v in box),fill=fill,outline=outline,width=w)
def polygon(d,pts,fill,outline=None):d.polygon([(int(x),int(y)) for x,y in pts],fill=fill);d.line([(int(x),int(y)) for x,y in pts+[pts[0]]],fill=outline,width=1) if outline else None

def hero_frame(job,direction,phase,action):
    im=Image.new('RGBA',(48,48));d=ImageDraw.Draw(im);primary,accent,light=map(hexrgb,COLORS[job]);ink=(21,22,45,255)
    back=direction in (3,4,5); side=direction in (2,6); left=direction in (1,2,3)
    t=phase%4;bob=([0,1,0,-1] if action=='walk' else [0,0,1,0])[t]
    if action=='die':bob=8
    swing=([-3,0,3,0] if action in ('walk','attack') else [0,1,0,-1])[t]
    # ground contact shadows; no opaque tile rectangle
    ellipse(d,(12,41,37,45),(13,20,32,90))
    # body offsets vary per action; every frame changes genuine anatomy and equipment
    x=24;y=18+bob
    if action=='hurt':x+=([0,2,4,1][t]);y+=([0,-1,0,1][t])
    if action=='die':x=24+t*2;y=21+t*2
    # cloak silhouette and highlights
    if job==2: polygon(d,[(x-9,y+8),(x+9,y+8),(x+12,y+23),(x-12,y+23)],(47,41,113,255),ink)
    if job==1: polygon(d,[(x-8,y+7),(x+8,y+7),(x+6,y+22),(x-8,y+20)],(19,93,58,255),ink)
    if job==0: polygon(d,[(x-8,y+9),(x-13,y+20),(x+10,y+22),(x+7,y+8)],(89,25,55,255),ink)
    # legs with true walk cycle
    legspread=[-2,0,2,0][t] if action=='walk' else 0
    for sign in [-1,1]:
       lx=x+sign*5+sign*legspread
       rect(d,(lx-3,y+15,lx+2,y+23),(40,47,70,255),ink)
       rect(d,(lx-4,y+21,lx+3,y+25),(90,58,49,255),ink)
       rect(d,(lx-3,y+21,lx+1,y+22),(153,122,97,255))
    # armored / cloth torso
    torso=primary+(255,)
    rect(d,(x-9,y+5,x+8,y+17),torso,ink)
    rect(d,(x-7,y+6,x+5,y+8),light+(255,))
    rect(d,(x-8,y+14,x+7,y+16),accent+(255,))
    rect(d,(x-1,y+8,x+2,y+15),(255,217,123,255))
    # gloves and shoulder plates
    for sign in [-1,1]:
        ax=x+sign*11; ay=y+8+(swing if sign==1 else -swing)//2
        ellipse(d,(ax-4,ay-3,ax+3,ay+6),torso,ink)
        rect(d,(ax-3,ay+5,ax+3,ay+8),(212,160,138,255),ink)
    # neck + head
    rect(d,(x-3,y+2,x+3,y+7),(224,169,132,255),ink)
    ellipse(d,(x-11,y-12,x+10,y+7),(243,192,158,255),ink)
    ellipse(d,(x-10,y-11,x+9,y+2),(255,211,168,255))
    # hair on all directions, recognizable job-specific look
    hair=[(56,35,63,255),(50,108,62,255),(95,78,181,255),(205,83,56,255)][job]
    ellipse(d,(x-12,y-14,x+10,y-4),hair,ink)
    polygon(d,[(x-11,y-7),(x-15,y+1),(x-9,y+1),(x-5,y-7)],hair,ink)
    if job==2:polygon(d,[(x-12,y-8),(x-3,y-23),(x+12,y-8)],(59,50,155,255),ink);rect(d,(x-13,y-9,x+13,y-7),(255,218,113,255),ink)
    if job==1:polygon(d,[(x-6,y-13),(x,y-19),(x+5,y-13)],(30,109,66,255),ink)
    if job==0:rect(d,(x-10,y-11,x+10,y-9),(232,212,190,255),ink)
    if not back:
       ey=y-1
       if side:
           xx=x+3 if not left else x-4
           rect(d,(xx,ey,xx+2,ey+2),(22,33,65,255))
           rect(d,(xx+1,ey,xx+1,ey),(255,255,255,255))
       else:
           for xx in [x-5,x+4]:
               rect(d,(xx,ey,xx+2,ey+3),(22,33,65,255))
               rect(d,(xx,ey,xx,ey),(255,255,255,255))
           rect(d,(x-1,y+3,x+1,y+3),(161,72,89,255))
    else:
       rect(d,(x-8,y-6,x+8,y-4),(33,29,52,255))
    # weapon hand-rig: anchored directly to wrist, never floating
    wx=x+13+(3 if not left else -3);wy=y+12+swing
    if action=='attack':wy-=3+t*2;wx-=2+t*2
    if job==0: # sword
       d.line((wx,wy,wx+8-(t if action=='attack' else 0),wy-16+(t*3 if action=='attack' else 0)),fill=(225,236,255,255),width=3)
       d.line((wx+1,wy-3,wx+9,wy-18),fill=(75,178,242,255),width=1)
       d.line((wx-4,wy-5,wx+4,wy-2),fill=(255,206,107,255),width=3)
    elif job==1: # bow
       d.arc((wx-4,wy-15,wx+8,wy+7),-100,120,fill=(242,203,113,255),width=2)
       d.line((wx+4,wy-15,wx+4,wy+7),fill=(191,253,204,255),width=1)
       if action=='attack':d.line((wx-6,wy-4,wx+13,wy-9),fill=(231,237,248,255),width=2)
    elif job==2: # staff
       d.line((wx,wy+5,wx+2,wy-17),fill=(200,160,101,255),width=3)
       ellipse(d,(wx-3,wy-24,wx+7,wy-14),(75,210,253,255),ink)
       ellipse(d,(wx,wy-21,wx+4,wy-17),(245,255,255,255))
    else: # knuckles
       ellipse(d,(wx-4,wy-5,wx+4,wy+3),(245,140,45,255),ink)
       ellipse(d,(wx-2,wy-3,wx+2,wy+1),(255,245,144,255))
    if action=='cast':
       radius=4+t*2
       d.arc((x-20-radius,y-12-radius,x+18+radius,y+23+radius),0,290,fill=light+(255,),width=1)
       for q in range(3):rect(d,(x-18+q*15,y+3+((q+t)%3)*5,x-16+q*15,y+5+((q+t)%3)*5),(255,249,186,255))
    elif action=='attack':
       d.arc((x-19-t,y-10-t,x+22+t,y+24+t),220,300,fill=(251,234,169,255),width=2)
    elif action=='hurt':
       d.line((x-11,y-17,x+8,y+8),fill=(255,86,90,180),width=2)
    elif action=='die':
       # visibly falling with orientation changes
       rotated=im.rotate(-min(90,30+t*18),resample=Image.Resampling.NEAREST)
       return rotated
    return im

def monster_frame(index,direction,phase):
    kind=KINDS[index%12];var=index//12; rng=random.Random(index*719+var*43);im=Image.new('RGBA',(48,48));d=ImageDraw.Draw(im)
    palettes=[[(119,223,132),(238,111,130),(119,177,244),(252,197,81)],
      [(99,208,164),(222,136,97),(144,111,203),(236,209,92)],
      [(128,141,230),(103,220,174),(246,138,187),(239,144,88)],
      [(252,126,98),(143,195,233),(185,135,232),(230,209,120)]]
    base=palettes[var][index%4];dark=darker(base,.45);highlight=tuple(min(255,int(x*1.25)) for x in base)+(255,)
    bounce=[0,-2,0,1][phase%4]; sway=[-2,0,2,0][phase%4];cx=24+sway//2;cy=25+bounce
    back=direction in (3,4,5)
    ellipse(d,(10,42,39,45),(3,15,25,77))
    if kind=='slime':
       polygon(d,[(7,cy+11),(10,cy-1),(17,cy-10),(cx,cy-14),(32,cy-9),(39,cy+4),(40,cy+12)],base+(255,),dark)
       ellipse(d,(14,cy-6,33,cy+2),highlight)
    elif kind=='fox':
       for sign in [-1,1]:
          polygon(d,[(cx+sign*6,cy-4),(cx+sign*11,cy-20),(cx+sign*16,cy-5)],dark,base+(255,))
       ellipse(d,(12,cy-7,36,cy+13),base+(255,),dark)
       polygon(d,[(cx+6,cy+11),(cx+17,cy+18),(cx+21,cy+9)],highlight,dark)
    elif kind=='mushroom':
       rect(d,(cx-6,cy,cx+7,cy+15),(224,208,184,255),dark)
       ellipse(d,(6,cy-14,42,cy+5),base+(255,),dark)
       for s in range(4):ellipse(d,(11+s*7,cy-9+(s%2)*3,14+s*7,cy-6+(s%2)*3),highlight)
    elif kind=='golem':
       for sign in [-1,1]:
          polygon(d,[(cx+sign*10,cy-7),(cx+sign*17,cy-4),(cx+sign*19,cy+13),(cx+sign*8,cy+12)],base+(255,),dark)
       rect(d,(13,cy-16,35,cy+15),base+(255,),dark,2)
       for x in [19,29]:d.line((x,cy-12,x-3,cy+12),fill=dark,width=1)
    elif kind=='bat':
       for sign in [-1,1]:polygon(d,[(cx,cy),(cx+sign*10,cy-12),(cx+sign*23,cy-8),(cx+sign*20,cy+13),(cx+sign*8,cy+9)],base+(255,),dark)
       ellipse(d,(15,cy-9,33,cy+11),dark,highlight)
    elif kind=='skeleton':
       rect(d,(cx-7,cy-2,cx+7,cy+14),(217,204,177,255),dark)
       for k in range(3):d.line((cx-8,cy+k*4,cx+8,cy+k*4),fill=dark,width=1)
       ellipse(d,(cx-11,cy-18,cx+10,cy+1),(244,230,205,255),dark)
    elif kind=='scorpion':
       for sign in [-1,1]:polygon(d,[(cx+sign*7,cy+2),(cx+sign*18,cy+9),(cx+sign*21,cy-1)],base+(255,),dark)
       ellipse(d,(12,cy-10,36,cy+13),base+(255,),dark)
       d.arc((cx-5,cy-30,cx+23,cy+7),180,355,fill=dark,width=4)
    elif kind=='dragon':
       for sign in [-1,1]:polygon(d,[(cx+sign*3,cy-7),(cx+sign*23,cy-22),(cx+sign*16,cy+8)],base+(255,),dark)
       ellipse(d,(14,cy-9,34,cy+11),base+(255,),dark)
       polygon(d,[(cx-9,cy-6),(cx-8,cy-19),(cx+1,cy-7)],highlight,dark)
    elif kind=='elemental':
       polygon(d,[(cx,cy-27),(cx+12,cy-6),(cx+7,cy+13),(cx-6,cy+11),(cx-15,cy-5)],base+(255,),dark)
       polygon(d,[(cx+2,cy-20),(cx-7,cy),(cx+4,cy-5),(cx+7,cy+9),(cx+11,cy-4)],highlight,dark)
    elif kind=='plant':
       rect(d,(cx-3,cy-10,cx+3,cy+14),(68,134,68,255),dark)
       for sign in [-1,1]:polygon(d,[(cx,cy),(cx+sign*22,cy-11),(cx+sign*16,cy+9)],base+(255,),dark)
       ellipse(d,(cx-12,cy-20,cx+12,cy+2),base+(255,),dark)
    elif kind=='spirit':
       polygon(d,[(cx,cy-19),(cx+14,cy-7),(cx+15,cy+15),(cx+7,cy+10),(cx,cy+18),(cx-8,cy+10),(cx-15,cy+15),(cx-13,cy-6)],(*base,215),dark)
       ellipse(d,(cx-9,cy-13,cx+9,cy+2),highlight)
    else: # mimic
       rect(d,(9,cy-8,39,cy+15),(95,55,40,255),dark,2)
       polygon(d,[(8,cy-9),(13,cy-21),(36,cy-21),(41,cy-9)],base+(255,),dark)
       for k in range(5):polygon(d,[(13+k*5,cy-8),(15+k*5,cy-2),(17+k*5,cy-8)],(240,233,201,255),dark)
    if not back:
       for sign in (-1,1):
           ex=cx+sign*6
           ellipse(d,(ex-3,cy-2,ex+2,cy+3),(17,19,39,255))
           rect(d,(ex-1,cy-2,ex-1,cy-2),(255,247,246,255))
    else:rect(d,(cx-5,cy,cx+5,cy+2),dark)
    # distinctive ornaments per variation; light particle scales with phase
    for k in range(var+1):
        px=(index*17+k*11+phase*3)%39+4;py=(index*7+k*17+direction*3)%24+8
        ellipse(d,(px,py,px+1,py+1),highlight)
    return im

def boss_frame(n,dr,fr):
    im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im)
    palette=[(178,141,95),(104,177,88),(95,186,242),(228,71,52),(141,88,220),(247,224,151),(85,73,155),(152,156,159),(226,92,50),(227,170,211)][n]
    ink=(29,22,41,255);b=fr%4;cx=48;cy=54+[-2,0,2,0][b];back=dr in (3,4,5)
    ellipse(d,(17,84,80,90),(13,17,29,80))
    for sign in [-1,1]:
        polygon(d,[(cx+sign*11,cy-8),(cx+sign*28,cy-26),(cx+sign*38,cy+14),(cx+sign*14,cy+12)],(*palette,245),ink)
        ellipse(d,(cx+sign*14-6,cy+8,cx+sign*14+6,cy+26),palette,ink,2)
    polygon(d,[(cx-23,cy-21),(cx,cy-39),(cx+23,cy-20),(cx+20,cy+22),(cx-18,cy+21)],palette,ink)
    for sign in [-1,1]:polygon(d,[(cx+sign*10,cy-25),(cx+sign*19,cy-48-b*2),(cx+sign*24,cy-19)],(245,195,96,255),ink)
    ellipse(d,(cx-18,cy-34,cx+18,cy+6),palette,ink,3)
    polygon(d,[(cx,cy-43),(cx+10,cy-18),(cx-10,cy-18)],(252,218,124,255),ink)
    if not back:
       for dx in [-9,9]:
          ellipse(d,(cx+dx-5,cy-20,cx+dx+5,cy-9),(255,90,80,255),ink)
          ellipse(d,(cx+dx-2,cy-18,cx+dx+1,cy-14),(255,249,195,255))
    for i in range(9):
       angle=i*2*pi/9+b*.18
       xx=cx+int(35*cos(angle));yy=cy+int(31*sin(angle))
       ellipse(d,(xx-1,yy-1,xx+2,yy+2),(255,221,150,210))
    return im

def sprite_sheet(make,idx,size=48):
    sheet=Image.new('RGBA',(size*4,size*8))
    for dr in range(8):
        for fr in range(4):sheet.alpha_composite(make(idx,dr,fr),(fr*size,dr*size))
    return sheet

def vfx_frame(job,skill,frame):
    rng=random.Random(skill*1777+job*191+frame*31)
    im=Image.new('RGBA',(80,80));d=ImageDraw.Draw(im)
    palette=[[(255,72,107),(255,190,102)],[(94,255,165),(105,231,255)],[(82,162,255),(191,117,255)],[(255,165,55),(255,92,109)]][job]
    primary,other=palette;center=(40,40);progress=frame/19;r=5+int(30*sin(pi*progress*.8))
    style=skill%8
    if style in (0,4):
      for k in range(4):
         start=frame*17+k*90+skill*9
         d.arc((40-r,40-r,40+r,40+r),start,start+42+skill%35,fill=(*primary,255),width=2+(skill%3))
         d.arc((40-r+3,40-r+3,40+r-3,40+r-3),start+9,start+35,fill=(*other,255),width=2)
    elif style in (1,5):
       for k in range(6+skill%6):
          a=k*2*pi/(6+skill%6)+frame*.15
          x=40+r*cos(a);y=40+r*sin(a)
          w=4+skill%4
          polygon(d,[(x,y),(40+(r+w)*cos(a+.12),40+(r+w)*sin(a+.12)),(40+(r+w)*cos(a-.12),40+(r+w)*sin(a-.12))],(*primary,255))
    elif style in (2,6):
       for k in range(3+skill%5):
          x=40+int((k-3)*8);yy=40-rng.randrange(5,30)
          d.line((x,60-progress*30,x+int(sin(progress*12+k)*7),yy),fill=(*primary,255),width=3)
          ellipse(d,(x-4,yy-4,x+4,yy+4),(*other,225))
    else:
       for k in range(3+skill%6):
          a=2*pi*(k/(3+skill%6)+progress*.6)
          bx=40+(r//2)*cos(a);by=40+(r//2)*sin(a)
          d.line((bx-12*cos(a),by-12*sin(a),bx+12*cos(a),by+12*sin(a)),fill=(*primary,255),width=3)
          d.line((bx-5*sin(a),by+5*cos(a),bx+5*sin(a),by-5*cos(a)),fill=(*other,255),width=2)
    # dynamic diamond, sparks; never a still image offset
    sz=2+int(4*sin(pi*progress))
    polygon(d,[(40,40-sz),(40+sz,40),(40,40+sz),(40-sz,40)],(255,246,210,245))
    for k in range(8+skill%7):
       angle=rng.random()*2*pi;rr=(r+8)*rng.random();x=40+rr*cos(angle);y=40+rr*sin(angle)
       ellipse(d,(x-1,y-1,x+1,y+1),(*other,int(230*(1-progress)+25)))
    return im

def build(out:Path):
    out.mkdir(parents=True,exist_ok=True)
    stats={'heroes':0,'hero_actions':0,'monsters':0,'bosses':0,'skills':0,'frames':0}
    h=out/'heroes';m=out/'monsters';bo=out/'bosses';sk=out/'skills'
    for p in (h,m,bo,sk):p.mkdir(exist_ok=True)
    for job in range(4):
      for action in ACTS:
        path=h/f'hero-{job}-{action}.png'
        im=sprite_sheet(lambda k,dr,fr:hero_frame(k,dr,fr,action),job)
        im.save(path,optimize=True);stats['hero_actions']+=1;stats['frames']+=32
    for idx in range(48):
      im=sprite_sheet(monster_frame,idx);im.save(m/f'monster-{idx:02d}.png',optimize=True)
      stats['monsters']+=1;stats['frames']+=32
    for idx in range(10):
      im=sprite_sheet(boss_frame,idx,size=96);im.save(bo/f'boss-{idx:02d}.png',optimize=True)
      stats['bosses']+=1;stats['frames']+=32
    for job in range(4):
      for skill in range(30):
         im=Image.new('RGBA',(80*5,80*4))
         for fr in range(20):im.alpha_composite(vfx_frame(job,skill,fr),((fr%5)*80,(fr//5)*80))
         im.save(sk/f'skill-{job}-{skill:02d}.png',optimize=True)
         stats['skills']+=1;stats['frames']+=20
    manifest={'version':'v07','heroes':4,'classes':CLASSES,'hero_actions':ACTS,
      'hero':{'cell':[48,48],'grid':[4,8]},'monsters':48,'monster':{'cell':[48,48],'grid':[4,8]},
      'bosses':10,'boss':{'cell':[96,96],'grid':[4,8]},'skills':120,
      'skills_per_class':30,'skill':{'cell':[80,80],'grid':[5,4],'frame_count':20},
      'skill_names':SKILL_NAMES,'generated_files':stats,'notes':'Original procedural pixel sprites, not derived from collage. Each distinct 20-frame skill animation is visual-only; combat abilities remain server-authoritative and are NOT expanded by this art pack.'}
    (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    return stats

def verify(out:Path):
    from hashlib import sha256
    cats=[('heroes','hero-',24,(192,384),(48,48)),('monsters','monster-',48,(192,384),(48,48)),('bosses','boss-',10,(384,768),(96,96)),('skills','skill-',120,(400,320),(80,80))]
    totals=0
    for dirname,prefix,count,dim,frame in cats:
      files=sorted((out/dirname).glob('*.png'))
      assert len(files)==count,(dirname,len(files),count)
      for path in files:
        im=Image.open(path).convert('RGBA');assert im.size==dim,(path,im.size)
        fx,fy=frame;tiles=[im.crop((x,y,x+fx,y+fy)) for y in range(0,dim[1],fy) for x in range(0,dim[0],fx)]
        assert len(tiles)==(20 if dirname=='skills' else 32)
        assert all(t.getchannel('A').getbbox() for t in tiles),('empty',path)
        distinct=len({sha256(t.tobytes()).digest() for t in tiles})
        assert distinct>=(12 if dirname=='skills' else 8),('static frames',path,distinct)
        totals+=1
    manifest=json.loads((out/'manifest.json').read_text(encoding='utf-8'))
    assert manifest['skills']==120 and manifest['monsters']==48 and manifest['bosses']==10
    print('VALIDATED',totals,'sheets,',20*120+32*(24+48+10),'frames;',manifest['generated_files'])

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--out',type=Path,default=OUT);ap.add_argument('--verify',action='store_true');args=ap.parse_args()
    if not args.verify:print('GENERATED',build(args.out))
    verify(args.out)