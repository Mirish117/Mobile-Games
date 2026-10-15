"""Original procedural Echos of Light first-pass 3D assets. Requires numpy and Pillow."""
import os,json,math,struct,random,copy,wave,zipfile
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
random.seed(117)
PAL={'skin':'e7b28a','hair':'422b24','hairlight':'634232','eye':'211917','white':'f0e4c9','cream':'ddd1b3','pants':'333940','leather':'714b33','leatherlight':'a67b4b','metal':'b3b6aa','gold':'d9ac46','crimson':'ba3c41','azure':'387aa9','violet':'7854a5','leaf':'558447','leaflight':'79a84d','leafdark':'355c3f','trunk':'74523a','stone':'8c927e','stonelight':'b4baa0','moss':'607b47','dirt':'b69b6d','grass':'81934f','water':'398f9c','waterlight':'79c9bb','shadow':'262b40','dark':'37354b','ember':'c37a3b','lava':'e97336','brass':'9e8050','glass':'a3c6cf','pink':'c68ea9','bark':'695c3c','flower':'f5ebc4','night':'444d6a'}
def color(c):
 c=PAL.get(c,c);return [int(c[i:i+2],16)/255 for i in (0,2,4)]+[1]
def quat(axis,angle):
 a=np.array(axis,float);a/=np.linalg.norm(a);return list(a*math.sin(angle/2))+[math.cos(angle/2)]
def qmat(q):
 x,y,z,w=q;return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w),0],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w),0],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y),0],[0,0,0,1.]])
def sphere():
 v=[];f=[];N=12;L=8
 for i in range(L+1):
  t=math.pi*i/L
  for j in range(N):
   a=2*math.pi*j/N;v.append([math.sin(t)*math.cos(a),math.cos(t),math.sin(t)*math.sin(a)])
 for i in range(L):
  for j in range(N):
   a=i*N+j;b=i*N+(j+1)%N;c=a+N;d=b+N
   if i: f.append([a,b,c])
   if i<L-1:f.append([b,d,c])
 return np.array(v,float),np.array(f,int)
def cylinder(n=12,top=1):
 v=[];f=[]
 for y,r in [(-.5,1),(.5,top)]:
  for i in range(n):
   a=i*2*math.pi/n;v.append([r*math.cos(a),y,r*math.sin(a)])
 v.extend([[0,-.5,0],[0,.5,0]])
 for i in range(n):
  j=(i+1)%n;f.extend([[i,j,n+i],[j,n+j,n+i],[2*n,j,i],[2*n+1,n+i,n+j]])
 return np.array(v,float),np.array(f,int)
def box():
 v=[];f=[]
 faces=[((1,0,0),[(.5,-.5,-.5),(.5,.5,-.5),(.5,.5,.5),(.5,-.5,.5)]),((-1,0,0),[(-.5,-.5,.5),(-.5,.5,.5),(-.5,.5,-.5),(-.5,-.5,-.5)]),((0,1,0),[(-.5,.5,-.5),(-.5,.5,.5),(.5,.5,.5),(.5,.5,-.5)]),((0,-1,0),[(-.5,-.5,.5),(-.5,-.5,-.5),(.5,-.5,-.5),(.5,-.5,.5)]),((0,0,1),[(.5,-.5,.5),(.5,.5,.5),(-.5,.5,.5),(-.5,-.5,.5)]),((0,0,-1),[(-.5,-.5,-.5),(-.5,.5,-.5),(.5,.5,-.5),(.5,-.5,-.5)])]
 for _,pts in faces:
  k=len(v);v+=pts;f.extend([[k,k+1,k+2],[k,k+2,k+3]])
 return np.array(v,float),np.array(f,int)
def ring(n=32):
 v=[];f=[]
 for r in [.8,1]:
  for i in range(n):a=i*2*math.pi/n;v.append([r*math.cos(a),0,r*math.sin(a)])
 for i in range(n):j=(i+1)%n;f.extend([[i,n+i,j],[j,n+i,n+j]])
 return np.array(v,float),np.array(f,int)
SHAPES={'sphere':sphere(),'cylinder':cylinder(),'cone':cylinder(top=0),'box':box(),'ring':ring()}
# Consistent outward winding; sphere generation has opposite winding.
for key,(v,f) in list(SHAPES.items()):
 n=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
 f=f[np.linalg.norm(n,axis=1)>1e-8];n=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
 if key!='ring':
  inward=np.sum(n*v[f].mean(axis=1),axis=1)<0;f[inward]=f[inward][:,::-1]
 used=np.unique(f); remap=np.zeros(len(v),dtype=int);remap[used]=np.arange(len(used));v=v[used];f=remap[f]
 SHAPES[key]=(v,f)
class Asset:
 def __init__(self,name):self.name=name;self.nodes=[];self.roots=[];self.anims=[];self.meta={}
 def node(self,name,pos=(0,0,0),scale=(1,1,1),rot=None,parent=None,shape=None,mat=None,extras=None):
  d={'name':name,'translation':list(pos),'scale':list(scale)}
  if rot:d['rotation']=rot
  if shape:d['_shape']=shape;d['_mat']=mat or 'stone'
  if extras:d['extras']=extras
  k=len(self.nodes);self.nodes.append(d)
  if parent is None:self.roots.append(k)
  else:self.nodes[parent].setdefault('children',[]).append(k)
  return k
 def part(self,name,shape,pos,scale,mat,parent=None,rot=None,extras=None):return self.node(name,pos,scale,rot,parent,shape,mat,extras)
 def bone(self,name,pos,parent=None):return self.node(name,pos,parent=parent)
 def track(self,clip,node,path,times,values):
  a=next((x for x in self.anims if x['name']==clip),None)
  if a is None:a={'name':clip,'tracks':[]};self.anims.append(a)
  a['tracks'].append((node,path,times,values))
 def rtrack(self,clip,node,axis,angles,times):self.track(clip,node,'rotation',times,[quat(axis,a) for a in angles])
 def embed(self,other,pos=(0,0,0),scale=(1,1,1),yaw=0,name=None):
  p=self.node(name or other.name,pos,scale,quat([0,1,0],yaw));off=len(self.nodes)
  for old in other.nodes:
   d=copy.deepcopy(old)
   if 'children'in d:d['children']=[i+off for i in d['children']]
   self.nodes.append(d)
  self.nodes[p]['children']=[i+off for i in other.roots]
  return p
 def export(self,path):
  g={'asset':{'version':'2.0','generator':'Echos of Light procedural first-pass asset builder'},'scene':0,'scenes':[{'name':self.name,'nodes':self.roots,'extras':self.meta}],'nodes':[],'materials':[],'meshes':[],'accessors':[],'bufferViews':[],'buffers':[]}
  buf=bytearray();materials={};meshes={}
  def acc(arr,typ,component,target=None):
   arr=np.array(arr,dtype='<f4' if component==5126 else '<u4');pad=(-len(buf))%4;buf.extend(b'\0'*pad);start=len(buf);buf.extend(arr.tobytes())
   view={'buffer':0,'byteOffset':start,'byteLength':arr.nbytes}
   if target:view['target']=target
   vi=len(g['bufferViews']);g['bufferViews'].append(view);d={'bufferView':vi,'componentType':component,'count':len(arr),'type':typ}
   if component==5126:
    d['min']=np.min(arr,axis=0).reshape(-1).tolist();d['max']=np.max(arr,axis=0).reshape(-1).tolist()
   ai=len(g['accessors']);g['accessors'].append(d);return ai
  for old in self.nodes:
   d={k:v for k,v in old.items() if not k.startswith('_')}
   if '_shape'in old:
    sh=old['_shape'];m=old['_mat'];key=(sh,m)
    if m not in materials:
     mi=len(g['materials']);materials[m]=mi;em=m in ['lava','waterlight','gold','pink']
     md={'name':m,'pbrMetallicRoughness':{'baseColorFactor':[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in color(m)[:3]]+[1],'metallicFactor':.35 if m in ['metal','gold','brass'] else 0,'roughnessFactor':.75},'doubleSided':sh=='ring'}
     if em:md['emissiveFactor']=[c*.12 for c in color(m)[:3]]
     g['materials'].append(md)
    if key not in meshes:
     v,f=SHAPES[sh];norm=np.zeros_like(v)
     for face in f:
      a,b,c=v[face];n=np.cross(b-a,c-a);norm[face]+=n
     length=np.linalg.norm(norm,axis=1);length[length==0]=1;norm/=length[:,None]
     pa=acc(v,'VEC3',5126,34962);na=acc(norm,'VEC3',5126,34962);ia=acc(f.reshape(-1),'SCALAR',5125,34963)
     meshes[key]=len(g['meshes']);g['meshes'].append({'name':sh+'_'+m,'primitives':[{'attributes':{'POSITION':pa,'NORMAL':na},'indices':ia,'material':materials[m]}]})
    d['mesh']=meshes[key]
   g['nodes'].append(d)
  if self.anims:
   g['animations']=[]
   for a in self.anims:
    ani={'name':a['name'],'samplers':[],'channels':[]}
    for node,track_path,t,v in a['tracks']:
     ti=acc(np.array(t)[:,None],'SCALAR',5126);vo=acc(v,'VEC4' if track_path=='rotation' else 'VEC3',5126);si=len(ani['samplers']);ani['samplers'].append({'input':ti,'output':vo,'interpolation':'LINEAR'});ani['channels'].append({'sampler':si,'target':{'node':node,'path':track_path}})
    g['animations'].append(ani)
  g['buffers']=[{'byteLength':len(buf)}];j=json.dumps(g,separators=(',',':')).encode();j+=b' '*((-len(j))%4);buf.extend(b'\0'*((-len(buf))%4))
  payload=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(buf))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(buf),0x004e4942)+buf
  path=ROOT/path;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(payload)
  return {'id':self.name,'file':str(path.relative_to(ROOT)),'nodes':len(self.nodes),'triangles':sum(len(SHAPES[n['_shape']][1]) for n in self.nodes if '_shape'in n),'animations':[a['name'] for a in self.anims],'bytes':len(payload),'status':'first_pass_3d'}
def link(a,name,p1,p2,r,mat,parent=None):
 p1=np.array(p1);p2=np.array(p2);delta=p2-p1;l=np.linalg.norm(delta);u=delta/l;up=np.array([0.,1,0]);axis=np.cross(up,u);angle=math.acos(np.clip(np.dot(up,u),-1,1));rot=quat(axis,angle) if np.linalg.norm(axis)>1e-8 else ([1,0,0,0] if u[1]<0 else None)
 return a.part(name,'cylinder',(p1+p2)/2,(r,l,r),mat,parent,rot)
def gem(a,name,pos,size,mat,parent=None):
 root=a.node(name,pos,parent=parent);a.part('crystal_lower','cone',(0,-size*.15,0),(size,size*.8,size),mat,root,quat([1,0,0],math.pi));a.part('crystal_upper','cone',(0,size*.45,0),(size,size*.7,size),mat,root);return root
def cape(a,root,mat):
 for i in range(4):a.part('cape_fold_'+str(i),'box',((i-1.5)*.14,-.3,.22+i*.01),(.16,.72,.045),mat,root,quat([1,0,0],-.22))
def weapon(a,kind,parent):
 if kind=='sword':
  a.part('sword_grip','cylinder',(0,-.04,0),(.045,.24,.045),'leather',parent);a.part('sword_guard','box',(0,.11,0),(.28,.045,.075),'gold',parent);a.part('sword_blade','box',(0,.48,0),(.09,.67,.035),'metal',parent);a.part('sword_tip','cone',(0,.85,0),(.065,.1,.035),'metal',parent)
 elif kind=='shield':
  a.part('shield','cylinder',(0,0,-.05),(.36,.085,.36),'azure',parent,quat([1,0,0],math.pi/2));a.part('shield_rim','cylinder',(0,0,0),(.39,.045,.39),'gold',parent,quat([1,0,0],math.pi/2));a.part('shield_face','cylinder',(0,0,-.035),(.35,.04,.35),'azure',parent,quat([1,0,0],math.pi/2));a.part('shield_sun','sphere',(0,0,-.08),(.12,.12,.04),'gold',parent)
 elif kind=='staff':
  a.part('staff_shaft','cylinder',(0,.25,0),(.035,1.5,.035),'leatherlight',parent);a.part('staff_socket','cylinder',(0,1.02,0),(.1,.14,.1),'gold',parent);gem(a,'prism',(0,1.23,0),.14,'glass',parent)
 elif kind=='bow':
  for i in range(7):
   t=-1.1+i*2.2/6;tn=-1.1+(i+1)*2.2/6
   link(a,'bow_limb_'+str(i),(.26*math.cos(t),.43*math.sin(t),0),(.26*math.cos(tn),.43*math.sin(tn),0),.024,'gold',parent)
  link(a,'bowstring',(.118,-.383,0),(.118,.383,0),.006,'cream',parent)
 elif kind=='lance':
  a.part('lance_shaft','cylinder',(0,.38,0),(.04,1.8,.04),'dark',parent);a.part('lance_head','cone',(0,1.48,0),(.13,.5,.13),'shadow',parent)
def humanoid(name,aspect='crimson',role='hero'):
 a=Asset(name);root=a.bone('Root',(0,0,0));hips=a.bone('Hips',(0,.78,0),root);body=a.bone('Spine',(0,.1,0),hips)
 a.part('tunic','sphere',(0,.19,0),(.28,.35,.18),'cream',body);a.part('belt','cylinder',(0,-.04,0),(.285,.09,.19),'leather',body);a.part('belt_buckle','box',(0,-.04,-.2),(.12,.1,.045),'gold',body)
 a.part('chest_strap','box',(-.02,.2,-.17),(.075,.47,.04),'leather',body,quat([0,0,1],-.55));a.part('sun_brooch','sphere',(.15,.38,-.18),(.065,.065,.027),'gold',body)
 neck=a.bone('Neck',(0,.46,0),body);head=a.bone('Head',(0,.2,0),neck)
 a.part('face','sphere',(0,.05,0),(.36,.39,.3),'skin',head)
 for side in [-1,1]:
  a.part('ear','sphere',(side*.35,.03,0),(.07,.09,.07),'skin',head)
  a.part('eye_white','sphere',(side*.125,.075,-.272),(.092,.105,.025),'white',head)
  a.part('eye_iris','sphere',(side*.125,.065,-.294),(.057,.078,.015),'eye',head)
  a.part('eye_glint','sphere',(side*.111,.097,-.307),(.018,.023,.008),'white',head)
  a.part('eyebrow','box',(side*.125,.203,-.263),(.11,.028,.021),'hair',head,quat([0,0,1],side*.1))
 a.part('nose','sphere',(0,.015,-.307),(.045,.047,.05),'skin',head);a.part('smile','box',(0,-.105,-.28),(.075,.013,.013),'leather',head)
 a.part('hair_cap','sphere',(0,.26,.025),(.375,.245,.32),'hair',head)
 for i,(x,y,z,ang) in enumerate([(-.25,.25,-.17,-.8),(-.14,.35,-.24,-.45),(.03,.32,-.27,.55),(.18,.32,-.21,.8),(.29,.21,-.12,1.1),(-.27,.35,.02,-.7),(.07,.46,.02,.55),(.25,.38,.09,.8)]):
  a.part('hair_lock_'+str(i),'cone',(x,y,z),(.105,.35,.085),'hairlight' if i%3==0 else 'hair',head,quat([0,0,1],ang))
 scarf=a.bone('Scarf',(0,.44,0),body);a.part('scarf_collar','cylinder',(0,0,0),(.19,.105,.17),aspect,scarf);cape(a,scarf,aspect);a.part('scarf_front','sphere',(0,-.04,-.14),(.22,.09,.12),aspect,scarf);a.part('scarf_tail','box',(-.1,-.22,-.21),(.14,.36,.04),aspect,scarf,quat([0,0,1],-.2))
 arms={};legs={}
 for side,label in [(-1,'L'),(1,'R')]:
  arm=a.bone('UpperArm_'+label,(side*.29,.32,0),body);arms[label]=arm
  a.part('shoulder_guard','sphere',(side*.035,-.01,0),(.145,.13,.16),'metal',arm)
  a.part('upper_sleeve','sphere',(side*.055,-.17,0),(.105,.18,.11),'white',arm)
  elbow=a.bone('Forearm_'+label,(side*.075,-.31,0),arm);a.part('bracer','cylinder',(0,-.07,0),(.09,.18,.095),'leather',elbow)
  hand=a.bone('Hand_'+label,(0,-.21,0),elbow);a.part('hand','sphere',(0,0,0),(.085,.095,.075),'skin',hand)
  leg=a.bone('UpperLeg_'+label,(side*.135,-.13,0),hips);legs[label]=leg
  a.part('trouser','sphere',(0,-.17,0),(.12,.22,.135),'pants',leg)
  knee=a.bone('LowerLeg_'+label,(0,-.3,0),leg);a.part('boot_shaft','cylinder',(0,-.1,0),(.112,.2,.112),'leather',knee);a.part('boot_toe','sphere',(0,-.25,-.07),(.125,.08,.2),'leather',knee)
  if role=='hero':
   kind={'crimson':'sword','azure':'shield','gold':'staff','violet':'bow'}[aspect]
   if label=='R':
    mount=a.node('WeaponSocket',(0,-.02,-.15),parent=hand);weapon(a,kind,mount)
 if aspect=='gold':a.part('satchel','box',(.31,.0,.0),(.22,.29,.14),'leather',body)
 if role=='mira':a.part('tool_pouch','box',(.3,-.02,0),(.24,.25,.16),'leather',body);a.part('goggle_band','box',(0,.24,-.3),(.5,.065,.05),'leather',head)
 if role=='vey r':pass
 if role=='veyr':
  a.part('crown_band','cylinder',(0,.37,0),(.38,.08,.31),'brass',head)
  for x in [-.25,0,.25]:a.part('crown_spike','cone',(x,.48,0),(.06,.23,.06),'brass',head)
  cape(a,body,'shadow');weapon(a,'lance',next(i for i,n in enumerate(a.nodes) if n['name']=='Hand_R'))
 t=[0,.25,.5,.75,1]
 for clip,amp,dur in [('walk',.55,1),('run',.9,.65)]:
  tt=[x*dur for x in t]
  for label,sign in [('L',1),('R',-1)]:
   a.rtrack(clip,legs[label],[1,0,0],[0,amp*sign,0,-amp*sign,0],tt);a.rtrack(clip,arms[label],[1,0,0],[0,-amp*sign*.65,0,amp*sign*.65,0],tt)
  a.track(clip,hips,'translation',tt,[[0,.78,0],[0,.81,0],[0,.78,0],[0,.81,0],[0,.78,0]])
 a.track('idle',body,'scale',[0,1.5,3],[[1,1,1],[1,1.025,1],[1,1,1]])
 for k,vals in [('attack_1',[0,-.5,1.2,0]),('attack_2',[0,.4,-1.15,0]),('attack_3',[0,-1.3,.7,0]),('signature',[0,-1,.5,0])]:a.rtrack(k,arms['R'],[1,0,0],vals,[0,.18,.35,.65])
 a.rtrack('dodge',hips,[1,0,0],[0,.35,0],[0,.15,.4]);a.rtrack('hit',body,[1,0,0],[0,-.3,0],[0,.12,.3]);a.rtrack('downed',hips,[1,0,0],[0,-1.3,-1.3],[0,.5,1]);a.track('downed',hips,'translation',[0,.5,1],[[0,.78,0],[0,.3,0],[0,.3,0]])
 a.rtrack('revive',hips,[1,0,0],[-1.3,-.6,0],[0,.4,.8]);a.track('revive',hips,'translation',[0,.4,.8],[[0,.3,0],[0,.5,0],[0,.78,0]])
 a.rtrack('interact',arms['R'],[1,0,0],[0,1,.8,0],[0,.3,.8,1]);a.rtrack('celebrate',arms['R'],[0,0,1],[0,-2,-2,0],[0,.4,1,1.4]);a.rtrack('look',head,[0,1,0],[0,.35,-.35,0],[0,.8,1.6,2.4]);a.rtrack('scarf_flutter',scarf,[1,0,0],[0,.15,-.1,0],[0,.3,.6,1])
 a.meta={'kind':'character','rig':'articulated rigid node hierarchy; no skin deformation','units':'meters','up':'Y','forward':'-Z','ground':0,'aspect':aspect,'shared_identity':'Aren Vale' if role=='hero' else name,'art_status':'simplified procedural model; requires sculpted face and texture polish'}
 return a
ASSETS={};RECORDS=[]
def save(a,folder='models'):
 ASSETS[a.name]=a;RECORDS.append(a.export(Path(folder)/(a.name+'.glb')));return a
for asp in ['crimson','azure','gold','violet']:save(humanoid('aren_'+asp,asp))
for name,asp,role in [('mira','azure','mira'),('aren_unsplit','gold','hero'),('aren_child','crimson','civilian'),('aren_mother','violet','civilian'),('elin','gold','civilian'),('traveler','azure','civilian'),('survivor','crimson','civilian'),('baker','gold','civilian'),('veyr_keeper','violet','veyr')]:
 a=humanoid(name,asp,role)
 if name in ['aren_child','elin']:
  for root in a.roots:a.nodes[root]['scale']=[.7,.7,.7]
 save(a)
# Reusable weapons, independent of character hands.
for kind in ['sword','shield','staff','bow','lance']:
 a=Asset(kind);r=a.bone('EquipmentRoot',(0,0,0));weapon(a,kind,r);save(a,'props')
# Organic creatures and animated bosses.
def creature(name,kind):
 a=Asset(name);r=a.bone('Root',(0,0,0));body=a.bone('Body',(0,.8,0),r)
 if kind=='stag':
  a.part('body','sphere',(0,.22,0),(.65,.45,.9),'bark',body);a.part('armor','sphere',(0,.35,0),(.68,.27,.75),'brass',body)
  head=a.bone('Head',(0,.6,-.75),body);a.part('neck','sphere',(0,-.12,.22),(.3,.48,.33),'bark',head);a.part('head','sphere',(0,.13,-.03),(.28,.33,.45),'bark',head)
  for s in [-1,1]:
   link(a,'antler', (s*.15,.34,0),(s*.45,1.05,0),.05,'leatherlight',head)
   for j in range(3):link(a,'antler_tine',(s*(.25+j*.07),.6+j*.14,0),(s*(.4+j*.08),.78+j*.14,-.2),.025,'leatherlight',head)
   a.part('eye','sphere',(s*.245,.24,-.18),(.05,.055,.065),'gold',head)
  gem(a,'dawn_seal',(0,.08,-.86),.16,'crimson',body)
  limb=[]
  for x in [-.4,.4]:
   for z in [-.6,.6]:
    leg=a.bone('Leg',(x,0,z),body);limb.append(leg);a.part('leg','cylinder',(0,-.35,0),(.1,.7,.1),'bark',leg);a.part('hoof','box',(0,-.75,-.03),(.22,.14,.25),'dark',leg)
 elif kind=='bird':
  a.part('bird_body','sphere',(0,.55,0),(.52,.65,.4),'ember',body);head=a.bone('Head',(0,1.15,-.13),body);a.part('head','sphere',(0,0,0),(.28,.3,.3),'ember',head);a.part('beak','cone',(0,-.05,-.4),(.12,.35,.12),'gold',head,quat([1,0,0],-math.pi/2))
  for s in [-1,1]:a.part('eye','sphere',(s*.22,.08,-.16),(.04,.045,.045),'eye',head)
  limb=[]
  for s in [-1,1]:
   w=a.bone('Wing_L' if s<0 else 'Wing_R',(s*.4,.75,0),body);limb.append(w)
   for j in range(7):a.part('feather','sphere',(s*(.2+j*.19),-.05-j*.055,.08+j*.1),(.42,.1,.17),'gold' if j%3==0 else 'ember',w,quat([0,0,1],s*-.15))
   link(a,'bird_leg',(s*.2,.1,0),(s*.2,-.65,0),.065,'brass',body)
   for j in [-1,0,1]:link(a,'claw',(s*.2,-.67,0),(s*.2+j*.1,-.72,-.26),.035,'gold',body)
  gem(a,'dawn_seal',(0,.4,-.38),.17,'violet',body)
  for j in range(4):a.part('tail','sphere',((j-1.5)*.14,.15,.6),(.12,.13,.62),'ember',body,quat([1,0,0],-.6))
 elif kind=='moth':
  a.part('body','sphere',(0,0,0),(.12,.3,.13),'dark',body);head=a.bone('Head',(0,.3,0),body);a.part('head','sphere',(0,0,0),(.13,.14,.13),'ember',head);limb=[]
  for s in [-1,1]:
   w=a.bone('Wing',(s*.1,.1,0),body);limb.append(w);a.part('wing','sphere',(s*.27,0,0),(.35,.23,.035),'ember',w);a.part('wing_eye','sphere',(s*.3,0,-.035),(.09,.1,.015),'gold',w)
 elif kind=='thorn':
  a.part('body','sphere',(0,-.3,0),(.35,.36,.35),'moss',body);head=body;limb=[]
  for j in range(8):
   ang=j*math.pi/4;a.part('thorn','cone',(.3*math.cos(ang),-.1,.3*math.sin(ang)),(.06,.35,.06),'bark',body)
  for s in [-1,1]:a.part('eye','sphere',(s*.12,-.2,-.31),(.04,.05,.03),'gold',body)
 else:
  a.part('body','sphere',(0,0,0),(.3,.4,.3),'glass',body);head=body;limb=[];gem(a,'wisp_core',(0,0,-.1),.12,'waterlight',body)
 t=[0,.25,.5,.75,1]
 a.track('idle',body,'translation',[0,1,2],[[0,.8,0],[0,.86,0],[0,.8,0]])
 for clip,amp in [('move',.5),('charge',1.0),('attack',.8),('stagger',.18)]:
  for j,l in enumerate(limb):a.rtrack(clip,l,[0,0,1] if kind in ['bird','moth'] else [1,0,0],[0,amp*(-1)**j,0,-amp*(-1)**j,0],t)
  a.rtrack(clip,head,[1,0,0],[0,.2,-.2,0],[0,.3,.6,1])
 a.track('defeat',body,'translation',[0,.8,1.5],[[0,.8,0],[0,.35,0],[0,.25,0]])
 a.meta={'kind':kind,'rig':'rigid node animation','up':'Y','forward':'-Z','units':'meters'};return a
save(creature('briarhorn','stag'));save(creature('ashwing','bird'));save(creature('thornling','thorn'));save(creature('drowned_wisp','wisp'));save(creature('ash_moth','moth'))
a=humanoid('nereth','azure','civilian');a.part('water_robe','cone',(0,.63,0),(.5,1.15,.5),'water',a.roots[0]);lan=a.bone('Lantern',(0,.9,-.5),a.roots[0]);a.part('lantern_frame','cylinder',(0,0,0),(.18,.35,.18),'brass',lan);gem(a,'seal',(0,0,-.15),.09,'azure',lan);a.rtrack('wave',lan,[1,0,0],[0,-.8,0],[0,.5,1.3]);save(a)
a=Asset('glasswright');r=a.bone('Root',(0,0,0));b=a.bone('Body',(0,1.2,0),r);a.part('torso','sphere',(0,0,0),(.65,.75,.45),'brass',b);eye=a.bone('Eye',(0,.15,-.45),b);a.part('eye_socket','cylinder',(0,0,0),(.4,.1,.4),'metal',eye,quat([1,0,0],math.pi/2));gem(a,'seal',(0,0,-.15),.2,'gold',eye)
for side in [-1,1]:
 l=a.bone('Arm',(side*.65,.2,0),b);a.part('arm','cylinder',(0,-.3,0),(.12,.65,.12),'brass',l);a.part('leg','cylinder',(side*.3,-.82,0),(.16,.8,.16),'brass',b)
a.rtrack('sweep',eye,[0,1,0],[-.9,.9,-.9],[0,2,4]);a.rtrack('idle',b,[0,1,0],[0,.08,0],[0,1,2]);a.track('defeat',b,'translation',[0,1],[[0,1.2,0],[0,.5,0]]);save(a)
sentry=humanoid('stillborn_sentry','violet','civilian');weapon(sentry,'lance',next(i for i,n in enumerate(sentry.nodes) if n['name']=='Hand_R'));save(sentry)
a=Asset('mirror_shard');gem(a,'shard',(0,.7,0),.5,'glass');a.rtrack('idle',0,[0,1,0],[0,math.pi,math.pi*2],[0,1.5,3]);save(a)
a=humanoid('veyr_last_shadow','violet','veyr')
for n in a.nodes:
 if n.get('_mat')in ['skin','cream','white','metal']:n['_mat']='dark'
save(a)
a=Asset('veyr_hollow_sun');r=a.bone('Root',(0,0,0));b=a.bone('ShadowBody',(0,3,0),r);a.part('torso','sphere',(0,1,0),(1.8,2,1),'shadow',b);a.part('head','sphere',(0,3,0),(.8,.95,.7),'dark',b);gem(a,'eclipsed_core',(0,1,-1),.7,'gold',b)
for side in [-1,1]:
 arm=a.bone('Arm',(side*1.65,2,0),b);link(a,'upper_arm',(0,0,0),(side*.9,-1.3,0),.35,'shadow',arm);a.part('hand','sphere',(side*.9,-1.4,0),(.5,.6,.35),'dark',arm);a.rtrack('slam',arm,[1,0,0],[0,-1.2,.6,0],[0,.7,1.1,2])
a.track('idle',b,'translation',[0,1.5,3],[[0,3,0],[0,3.15,0],[0,3,0]]);a.rtrack('collapse',b,[1,0,0],[0,-1.2],[0,2]);save(a)
print('Characters and creatures:',len(RECORDS),flush=True)
# Environment kit: independent meshes with real depth, authored pivots and collision hints.
def prop(name,kind):
 a=Asset(name);r=a.bone('Root',(0,0,0))
 if kind=='tree':
  a.part('trunk','cylinder',(0,1.1,0),(.22,2.2,.22),'trunk',r)
  for i,(x,y,z,sz) in enumerate([(0,2.5,0,1),(-.65,2.1,0,.75),(.6,2.2,.1,.8),(0,2,-.65,.75),(0,2.15,.6,.75)]):a.part('canopy_'+str(i),'sphere',(x,y,z),(sz,sz*.72,sz),'leaflight' if i==0 else 'leaf',r)
  for i in range(4):t=i*math.pi/2;link(a,'root',(0,.15,0),(.55*math.cos(t),.04,.55*math.sin(t)),.07,'trunk',r)
 elif kind=='pine':
  a.part('trunk','cylinder',(0,1,0),(.15,2,.15),'trunk',r)
  for i in range(3):a.part('needles','cone',(0,1.2+i*.65,0),(.95-i*.22,1.4,.95-i*.22),'leafdark' if i==0 else 'leaf',r)
 elif kind=='rock':a.part('rock','sphere',(0,.35,0),(.65,.45,.55),'stone',r,quat([0,0,1],.16))
 elif kind=='wall':
  for row in range(4):
   for col in range(3):a.part('stone','box',((col-1)*.58+(.12 if row%2 else 0),.2+row*.39,0),(.55,.36,.42),'stone' if (row+col)%3 else 'stonelight',r)
  for j in range(3):a.part('moss','sphere',((j-1)*.6,1.5,.02),(.32,.055,.25),'moss',r)
 elif kind=='pillar':
  a.part('base','box',(0,.12,0),(.85,.24,.85),'stonelight',r);a.part('column','box',(0,.95,0),(.5,1.5,.5),'stone',r);a.part('cap','box',(0,1.75,0),(.7,.15,.7),'stonelight',r)
 elif kind=='bridge':
  for j in range(12):a.part('plank','box',(0,.13,(j-5.5)*.27),(1.65,.15,.24),'leatherlight',r)
  for s in [-1,1]:
   link(a,'rail',(s*.9,.6,-1.6),(s*.9,.6,1.6),.045,'leather',r)
   for z in [-1.5,0,1.5]:a.part('post','cylinder',(s*.9,.35,z),(.065,.7,.065),'trunk',r)
 elif kind=='stairs':
  for j in range(6):a.part('step','box',(0,(j+1)*.1,-j*.35),(2.3,(j+1)*.2,.36),'stone',r)
 elif kind=='gate':
  for s in [-1,1]:a.embed(ASSETS['stone_pillar'],(s*1.1,0,0))
  a.part('lintel','box',(0,2,0),(2.7,.4,.5),'stone',r);door=a.bone('Door',(0,0,0),r);a.part('door','box',(0,.9,0),(1.8,1.8,.18),'dark',door);a.part('sun','cylinder',(0,1.3,-.12),(.25,.05,.25),'gold',door,quat([1,0,0],math.pi/2));a.track('open',door,'translation',[0,1.4],[[0,0,0],[0,-1.85,0]])
 elif kind=='flower':
  for j in range(5):
   t=j*math.pi*2/5;a.part('petal','sphere',(.07*math.cos(t),.2,.07*math.sin(t)),(.08,.027,.05),'flower',r)
  a.part('center','sphere',(0,.215,0),(.04,.03,.04),'gold',r);a.part('stem','cylinder',(0,.1,0),(.012,.2,.012),'leaf',r)
 elif kind=='bush':
  for j in range(3):a.part('leaves','sphere',((j-1)*.23,.32,0),(.38,.36,.35),'leaflight' if j==1 else 'leaf',r)
 elif kind=='root':
  for j in range(4):link(a,'root_segment',(j*.4,.08+j*.08,0),((j+1)*.4,.16+j*.05,.15*math.sin(j)),.15-j*.018,'bark',r)
 elif kind=='barrel':
  a.part('staves','cylinder',(0,.4,0),(.33,.8,.33),'leatherlight',r)
  for y in [.12,.65]:a.part('band','cylinder',(0,y,0),(.34,.045,.34),'metal',r)
 elif kind=='crate':
  a.part('crate','box',(0,.35,0),(.7,.7,.7),'leatherlight',r)
  for y in [.08,.62]:a.part('brace','box',(0,y,-.37),(.73,.07,.045),'leather',r)
 elif kind=='dummy':
  a.part('post','cylinder',(0,.6,0),(.06,1.2,.06),'trunk',r);a.part('body','box',(0,.85,0),(.45,.55,.17),'leatherlight',r);a.part('head','sphere',(0,1.25,0),(.15,.15,.15),'leatherlight',r);a.part('arms','box',(0,1,0),(.9,.08,.12),'trunk',r)
 elif kind=='target':
  a.part('post','box',(0,.6,0),(.1,1.2,.1),'trunk',r)
  for rad,mat,z in [(.42,'cream',0),(.31,'crimson',-.03),(.2,'cream',-.06),(.1,'crimson',-.09)]:a.part('target_ring','cylinder',(0,1,z),(rad,.04,rad),mat,r,quat([1,0,0],math.pi/2))
 elif kind=='beacon':
  a.part('base','cylinder',(0,.13,0),(.6,.26,.6),'stone',r);a.part('pedestal','cylinder',(0,.6,0),(.22,.8,.22),'stonelight',r);g=gem(a,'core',(0,1.35,0),.24,'gold',r);a.rtrack('glow_idle',g,[0,1,0],[0,math.pi,math.pi*2],[0,2,4])
 elif kind=='bell':
  a.part('frame','box',(0,1.6,0),(.85,.15,.3),'leather',r)
  for s in [-1,1]:a.part('post','box',(s*.36,.8,0),(.1,1.6,.1),'leather',r)
  b=a.bone('Bell',(0,1.3,0),r);a.part('bronze_bell','cone',(0,-.15,0),(.32,.45,.32),'gold',b);a.rtrack('ring',b,[1,0,0],[0,.4,-.3,.15,0],[0,.2,.4,.65,1])
 elif kind=='valve':
  a.part('housing','box',(0,.35,0),(.5,.7,.5),'stone',r);w=a.bone('Valve',(0,.8,-.1),r);a.part('wheel','ring',(0,0,0),(.35,1,.35),'brass',w,quat([1,0,0],math.pi/2));a.rtrack('turn',w,[0,0,1],[0,math.pi,math.pi*2],[0,.6,1.2])
 elif kind=='mirror':
  a.part('stand','box',(0,.6,0),(.12,1.2,.2),'brass',r);a.part('rim','box',(0,1.2,0),(.8,.9,.1),'brass',r);a.part('glass','box',(0,1.2,-.07),(.68,.78,.025),'glass',r)
 elif kind=='telescope':
  for s in [-1,0,1]:link(a,'tripod',(0,.9,0),(s*.4,0,.3 if s else -.4),.04,'brass',r)
  a.part('tube','cylinder',(0,1.1,0),(.15,1.3,.15),'brass',r,quat([1,0,0],1.1));a.part('lens','sphere',(0,1.4,.58),(.145,.12,.08),'glass',r)
 elif kind=='brazier':
  a.part('base','cylinder',(0,.13,0),(.4,.25,.4),'stone',r);a.part('stem','cylinder',(0,.55,0),(.14,.7,.14),'brass',r);a.part('bowl','sphere',(0,.95,0),(.4,.15,.4),'brass',r);fl=gem(a,'fire',(0,1.2,0),.22,'lava',r);a.track('flicker',fl,'scale',[0,.2,.4,.6],[[1,1,1],[.9,1.2,.9],[1.1,.9,1.1],[1,1,1]])
 elif kind=='anchor':
  a.part('anchor_ring','ring',(0,.03,0),(.7,1,.7),'gold',r);gem(a,'lantern',(0,.45,0),.12,'violet',r)
 elif kind=='fountain':
  a.part('basin','cylinder',(0,.25,0),(1.3,.5,1.3),'stone',r);a.part('water','cylinder',(0,.52,0),(1.1,.04,1.1),'water',r);a.part('column','cylinder',(0,1,0),(.2,1,.2),'stonelight',r);a.part('bowl','sphere',(0,1.5,0),(.7,.12,.7),'stone',r)
  for j in range(8):t=j*math.pi/4;link(a,'water_jet',(.35*math.cos(t),1.55,.35*math.sin(t)),(.8*math.cos(t),.56,.8*math.sin(t)),.025,'waterlight',r)
 elif kind=='house':
  a.part('walls','box',(0,1,0),(2.4,2,2),'cream',r);a.part('door','box',(0,.5,-1.02),(.55,1,.05),'leather',r)
  for x in [-.75,.75]:a.part('window','box',(x,1.2,-1.03),(.4,.5,.05),'glass',r)
  for s in [-1,1]:a.part('roof','box',(s*.65,2.25,0),(1.55,.14,2.5),'crimson',r,quat([0,0,1],s*-.55))
 elif kind=='stall':
  a.part('counter','box',(0,.55,0),(1.6,1.1,.8),'leatherlight',r)
  for s in [-1,1]:a.part('post','box',(s*.75,1.1,.3),(.06,2.2,.06),'leather',r)
  a.part('canopy','box',(0,2.15,0),(1.9,.08,1.25),'gold',r)
 elif kind=='memorial':
  a.part('plinth','box',(0,.12,0),(1.6,.24,1),'stone',r);a.part('stone','box',(0,.9,0),(1.2,1.5,.4),'stonelight',r);a.part('plaque','box',(0,.9,-.22),(.9,1.1,.035),'brass',r)
 elif kind=='bed':
  a.part('frame','box',(0,.25,0),(1.1,.5,1.9),'leather',r);a.part('blanket','box',(0,.57,.15),(1,.15,1.45),'azure',r);a.part('pillow','sphere',(0,.65,-.65),(.4,.12,.23),'cream',r)
 elif kind=='sun_core':gem(a,'dawnheart',(0,1.3,0),.75,'gold',r);a.part('core_ring','ring',(0,1.3,0),(1.25,1,1.25),'brass',r,quat([1,0,0],math.pi/2))
 elif kind=='seedling':a.part('stem','cylinder',(0,.15,0),(.025,.3,.025),'trunk',r);a.part('leaf','sphere',(.1,.25,0),(.15,.03,.07),'leaflight',r)
 elif kind=='paper_bird':
  for s in [-1,1]:a.part('folded_wing','box',(s*.14,.08,0),(.3,.012,.22),'cream',r,quat([0,0,1],s*.3))
  a.part('body','cone',(0,0,-.03),(.06,.3,.06),'cream',r,quat([1,0,0],math.pi/2))
 elif kind=='toy':a.part('toy','sphere',(0,.12,0),(.18,.12,.18),'crimson',r);a.part('stem','cylinder',(0,.3,0),(.025,.2,.025),'gold',r)
 elif kind=='recording':gem(a,'recording_stone',(0,.25,0),.18,'glass',r)
 else:a.part(kind,'box',(0,.25,0),(.5,.5,.5),'stone',r)
 a.meta={'kind':'prop','units':'meters','up':'Y','ground':0};return a
PROPS=[('broadleaf_tree','tree'),('pine_tree','pine'),('rock','rock'),('ruin_wall','wall'),('stone_pillar','pillar'),('wood_bridge','bridge'),('stone_stairs','stairs'),('sun_gate','gate'),('flower','flower'),('bush','bush'),('tangled_root','root'),('barrel','barrel'),('crate','crate'),('training_dummy','dummy'),('archery_target','target'),('resonance_beacon','beacon'),('abbey_bell','bell'),('sluice_valve','valve'),('mirror_plinth','mirror'),('telescope','telescope'),('brazier','brazier'),('light_anchor','anchor'),('fountain','fountain'),('house','house'),('market_stall','stall'),('memorial','memorial'),('elin_bed','bed'),('dawnheart','sun_core'),('seedling','seedling'),('paper_bird','paper_bird'),('elin_toy','toy'),('recording_stone','recording')]
for name,kind in PROPS:save(prop(name,kind),'props')
for asp in ['crimson','azure','gold','violet']:
 a=Asset('seal_'+asp);gem(a,'dawn_seal',(0,.25,0),.2,asp);a.rtrack('spin',0,[0,1,0],[0,math.pi,math.pi*2],[0,2,4]);save(a,'props')
# Effects are actual geometry plus loop clips; materials can be replaced with engine shaders.
for effect,mat,shape in [('ward','azure','sphere'),('resonance_ring','gold','ring'),('tide_ring','waterlight','ring'),('danger_ring','crimson','ring'),('prism_beam','gold','cylinder'),('lantern_arrow','violet','cone'),('ember','lava','sphere'),('stillness_orb','shadow','sphere'),('revive_spark','gold','sphere'),('memory_shard','glass','cone'),('root_cage','bark','cylinder'),('light_tether','gold','cylinder')]:
 a=Asset(effect);r=a.bone('Root',(0,0,0))
 if effect=='root_cage':
  for j in range(8):t=j*math.pi/4;a.part('root','cone',(.6*math.cos(t),.6,.6*math.sin(t)),(.08,1.2,.08),mat,r)
 else:a.part('effect',shape,(0,0,0),(1,1,1),mat,r)
 a.track('pulse',r,'scale',[0,.5,1],[[.7,.7,.7],[1,1,1],[.7,.7,.7]])
 a.meta={'kind':'effect','material_note':'opaque base mesh; configure transparent/additive shader in runtime where appropriate'};save(a,'effects')
SCENES=[]
def scene(name,region,state='restored'):
 a=Asset(name);world=a.bone('Environment',(0,0,0));coll=[];surfaces=[];spawns=[]
 floor={'verdant':'grass','abbey':'stone','observatory':'night','ember':'bark','lumenfall':'dirt','refuge':'grass','chamber':'dark','elin_room':'leather','hollow_arena':'night'}[region]
 def ground(label,pos,size,mat,walk=True):
  n=a.part(label,'box',pos,size,mat,world,extras={'walkable':walk,'collision':'box' if walk else 'none'})
  if walk:surfaces.append({'name':label,'center':list(pos),'size':list(size),'surface_y':pos[1]+size[1]/2})
  return n
 def put(key,x,z,y=0,scale=1,yaw=0,solid=False):
  n=a.embed(ASSETS[key],(x,y,z),(scale,scale,scale),yaw)
  if solid:
   bounds={'broadleaf_tree':[1.3,3,1.3],'pine_tree':[1,3,1],'ruin_wall':[1.9,1.6,.5],'stone_pillar':[.85,1.9,.85],'house':[2.6,3,2.6],'rock':[1.3,.9,1.1]}.get(key,[.8,1.5,.8])
   coll.append({'node':n,'shape':'box','center':[x,y+bounds[1]*scale/2,z],'size':[v*scale for v in bounds],'yaw':yaw})
  return n
 def path(x,z,w=2,d=3):ground('walk_path',(x,.025,z),(w,.05,d),'dirt')
 if region not in ['observatory','hollow_arena']:ground('ground',(0,-.25,0),(22,.5,22),floor)
 if region=='verdant':
  # River has no full-height walk surface underneath; build separate banks.
  a.nodes[1]['scale']=[1,1,1]
  # Replace global plane with east and west banks; water gap is real geometry.
  a.nodes[1].pop('_shape',None);a.nodes[1].pop('_mat',None);surfaces=[]
  ground('east_bank',(3.5,-.25,0),(15,.5,22),'grass');ground('west_bank',(-9,-.25,0),(4,.5,22),'grass');ground('stream',(-5.5,-.24,0),(3,.12,22),'water',False)
  put('wood_bridge',-5.5,2,y=.05,yaw=math.pi/2);surfaces.append({'name':'bridge_deck','center':[-5.5,.105,2],'size':[3.24,.15,1.65],'surface_y':.18})
  path(0,6,2,9);path(2,0,7,5);path(6,-4,2,7);path(-2,2,6,2)
  ground('training_yard',(1,.06,-1),(6,.12,5),'dirt')
  for x,z,yaw in [(-2,-3,0),(0,-3,0),(2,-3,0),(4,-3,0),(-2,0,math.pi/2),(4,0,math.pi/2)]:put('ruin_wall',x,z,yaw=yaw,solid=True)
  for x in [0,1.4,2.8]:put('training_dummy',x,-.7)
  put('archery_target',2,-2);put('barrel',-1,-2);put('crate',3,1)
  ground('boss_grove',(6,.5,-7),(6,1,5),'stone');put('stone_stairs',6,-3.8)
  for x in [4,8]:
   for z in [-5.5,-8.5]:put('stone_pillar',x,z,y=1,solid=True)
  put('sun_gate',6,-9,y=1);put('resonance_beacon',6,-7,y=1)
  for x,z in [(-9,-7),(-9,-3),(-9,5),(-9,9),(-2,-8),(1,-8),(-2,6),(3,7),(6,6),(9,7),(9,2),(9,-2),(-2,10),(2,10),(6,10),(-2,-5)]:put('broadleaf_tree',x,z,scale=1+random.random()*.25,solid=True)
  for j in range(14):put('rock',-4+random.random()*.3,-10+j*1.5,scale=.55+random.random()*.4,solid=True)
  for j in range(25):
   x=random.uniform(-2,9);z=random.uniform(-9,9)
   if abs(x)<1 or (-2<x<4 and -3<z<2):continue
   put('flower',x,z,scale=1.4)
  if state=='corrupted':
   for x,z in [(0,4),(4,-1),(6,-5)]:put('tangled_root',x,z,scale=1.5)
  spawns=[{'id':'party_start','position':[0,0,9]},{'id':'briarhorn','position':[6,1,-7]},{'id':'thornling_1','position':[2,0,4]}]
 elif region=='lumenfall':
  for x in [-5,5]:
   for z in [-6,-2,3,7]:put('house',x,z,scale=1.15,solid=True)
  ground('square',(0,.04,0),(7,.08,7),'stone');put('fountain',0,0);put('market_stall',-2.8,3);put('market_stall',2.8,3)
  ground('canal',(8,-.1,0),(2,.1,22),'water',False);put('wood_bridge',8,0,yaw=math.pi/2)
  for x in [-2.5,2.5]:
   for z in [-3,3]:put('stone_pillar',x,z)
  put('sun_gate',0,-9,scale=1.4)
  for x in [-9,9]:
   for z in [-8,-4,4,8]:put('broadleaf_tree',x,z,scale=.8,solid=True)
  if state=='restored':put('memorial',-2,0);put('seedling',2,1)
  else:
   for x,z in [(0,-4),(1,-5),(-1,4)]:put('rock',x,z,scale=.8,solid=True)
  spawns=[{'id':'party_start','position':[0,0,9]},{'id':'mira','position':[1,0,-8]}]
 elif region=='refuge':
  path(0,2,3,18);put('resonance_beacon',0,-2);put('house',-5,-4,solid=True);put('market_stall',4,1);put('brazier',0,1)
  for x,z in [(-4,4),(4,5),(-8,-8),(8,-8),(-8,6),(8,7),(-5,9)]:put('broadleaf_tree',x,z,solid=True)
  for x in [-2,2]:put('crate',x,1);put('barrel',x,2)
  spawns=[{'id':'party_start','position':[0,0,7]},{'id':'mira','position':[2,0,-2]}]
 elif region=='abbey':
  ground('nave_water',(0,.03,-1),(12,.06,15),'water' if state=='corrupted' else 'stonelight',False)
  for x in [-7,7]:
   ground('upper_walkway',(x,.5,0),(3,1,20),'stone')
   for z in [-8,-4,0,4,8]:put('stone_pillar',x,z,y=1,solid=True)
  for z in [-8,7]:ground('balcony',(0,.5,z),(14,1,3),'stone')
  for x,z in [(-4,-8),(0,-8),(4,-8)]:put('abbey_bell',x,z,y=1)
  for x in [-7,7]:put('sluice_valve',x,1,y=1);put('stone_stairs',x,5)
  put('sun_gate',0,-10,y=1);put('resonance_beacon',0,7,y=1)
  for x in [-10,10]:
   for z in [-8,-4,0,4,8]:put('ruin_wall',x,z,yaw=math.pi/2,solid=True)
  spawns=[{'id':'party_start','position':[0,1,8]},{'id':'nereth','position':[0,0,-2]}]
 elif region in ['observatory','hollow_arena']:
  for x,z in [(-5,-5),(5,-5),(-5,5),(5,5)]:
   ground('floating_platform',(x,-.35,z),(7,.7,7),'stone' if region=='observatory' else 'dark')
   ground('connector_x',(0,-.15,z),(4,.3,1.7),'brass' if region=='observatory' else 'gold');ground('connector_z',(x,-.15,0),(1.7,.3,4),'brass' if region=='observatory' else 'gold')
   if region=='observatory':put('telescope',x,z);put('mirror_plinth',x,z-2);put('light_anchor',x+2,z+2)
   else:put('brazier',x,z);put('stone_pillar',x-2,z-2)
  if region=='observatory':
   ground('central_dome',(0,-.2,0),(3,.4,3),'brass');put('resonance_beacon',0,0)
   for x,z in [(-7,-7),(7,-7),(-7,7),(7,7)]:put('stone_pillar',x,z)
  spawns=[{'id':'party_start','position':[-5,0,6]},{'id':'boss','position':[0,0,0]}]
 elif region=='ember':
  ground('lava_channel',(0,.015,0),(3,.03,22),'lava',False)
  for x in [-6,6]:
   for z,y in [(6,.4),(0,1.2),(-6,2)]:
    ground('terrace',(x,y-.25,z),(7,.5,6),'stone');put('brazier',x,z,y=y);put('light_anchor',x+1,z+1,y=y)
   for z,y in [(4,.4),(-2,1.2)]:put('stone_stairs',x,z,y=y)
  ground('nest', (0,1.75,-8),(7,.5,5),'bark')
  for x,z in [(-2,-9),(2,-9),(-2,-7),(2,-7)]:put('brazier',x,z,y=2)
  for x in [-10,10]:
   for z in [-8,-3,2,7]:put('rock',x,z,scale=1.7,solid=True)
  if state=='restored':
   for x in [-5,5]:
    for z in [-4,0,4]:put('seedling',x,z,y=1.2 if z<=0 else .4,scale=1.5)
  spawns=[{'id':'party_start','position':[-6,.4,8]},{'id':'ashwing','position':[0,2,-8]}]
 elif region=='chamber':
  ground('dais',(0,.25,-3),(7,.5,7),'stone');put('dawnheart',0,-3,y=1.3)
  for x in [-5,5]:
   for z in [-6,0,6]:put('stone_pillar',x,z,scale=1.5,solid=True)
  for asp,(x,z) in zip(['crimson','azure','gold','violet'],[(-3,0),(3,0),(-3,-6),(3,-6)]):put('seal_'+asp,x,z,y=.5)
  put('stone_stairs',0,2);put('sun_gate',0,10,yaw=math.pi)
  spawns=[{'id':'party_start','position':[0,0,7]},{'id':'veyr','position':[0,.5,-4]},{'id':'mira','position':[6,0,-4]}]
 elif region=='elin_room':
  for x in [-5,5]:ground('room_wall',(x,1.3,0),(.3,2.6,10),'cream',False)
  ground('back_wall',(0,1.3,-5),(10,2.6,.3),'cream',False);put('elin_bed',-2,-2);put('elin_toy',-2,-2,y=1.2);put('recording_stone',1,-3,y=.8);put('crate',1,-3);put('memorial',3,-3,scale=.6)
  spawns=[{'id':'party_start','position':[0,0,3]},{'id':'veyr','position':[-1,0,-2]}]
 # Change foliage and light colors for unrecovered states without removing actual depth.
 if state=='corrupted':
  for n in a.nodes:
   if n.get('_mat')in ['leaflight','leaf']:n['_mat']='leafdark'
 a.meta={'kind':'environment','region':region,'state':state,'units':'meters','up':'Y','camera':{'type':'orthographic','position':[22,27,30],'target':[0,0,0]},'collision_file':name+'.layout.json','render_note':'light and contact shadows must be added by runtime','status':'first-pass scene; layout needs game traversal testing'}
 layout={'scene':name,'region':region,'state':state,'walk_surfaces':surfaces,'obstacle_colliders':coll,'spawn_points':spawns,'notes':['Box colliders are starter approximations. Gameplay must test and refine boundaries.','GLB contains actual geometry, no flattened map image.','No characters embedded in environment; load characters at spawn points.','Y up. -Z is character forward. Units meters.','Water/lava are visual surfaces, not gameplay code. Water in abbey requires state-dependent traversal logic.']}
 (ROOT/'environments'/f'{name}.layout.json').write_text(json.dumps(layout,indent=2));save(a,'environments');SCENES.append(a);return a
for region in ['verdant','abbey','observatory','ember','lumenfall']:
 for state in ['corrupted','restored']:scene(region+'_'+state,region,state)
for name,reg in [('hillside_refuge','refuge'),('sun_chamber','chamber'),('elin_memory_room','elin_room'),('hollow_sun_arena','hollow_arena')]:scene(name,reg)
print('Models and scenes:',len(RECORDS),flush=True)
# Additional story props and final-stage geometry.
for name,kind in [('bench','bench'),('memory_blanket','blanket'),('mill_wheel','wheel'),('sun_controls','controls'),('seed_lamp','lamp'),('root_switch','switch'),('lens_carriage','carriage'),('banner','banner'),('broken_gear','gear'),('feather_spear','feather')]:
 a=Asset(name);r=a.bone('Root',(0,0,0))
 if kind=='bench':
  a.part('seat','box',(0,.4,0),(1.4,.12,.45),'leatherlight',r)
  for x in [-.5,.5]:a.part('leg','box',(x,.2,0),(.15,.4,.3),'leather',r)
 elif kind=='blanket':a.part('folded_blanket','box',(0,.035,0),(.6,.07,.5),'azure',r);a.part('initial_stitch','box',(.18,.075,0),(.03,.015,.22),'cream',r)
 elif kind in ['wheel','gear']:
  a.part('outer_ring','ring',(0,1,0),(1,1,1),'leather' if kind=='wheel' else 'brass',r,quat([1,0,0],math.pi/2))
  for j in range(8):t=j*math.pi/4;link(a,'spoke',(0,1,0),(.8*math.cos(t),1+.8*math.sin(t),0),.05,'leatherlight',r)
  a.rtrack('rotate',r,[0,0,1],[0,math.pi,math.pi*2],[0,3,6])
 elif kind=='controls':
  a.part('console','box',(0,.5,0),(1.8,1,.8),'stone',r)
  for j,asp in enumerate(['crimson','azure','gold','violet']):gem(a,'socket_'+asp,((j-1.5)*.4,1.1,0),.1,asp,r)
 elif kind=='lamp':
  a.embed(ASSETS['seedling']);gem(a,'lamp',(0,.6,0),.1,'gold',r)
 elif kind=='switch':a.part('base','box',(0,.2,0),(.5,.4,.5),'bark',r);gem(a,'switch',(0,.5,0),.08,'gold',r)
 elif kind=='carriage':
  a.part('cart','box',(0,.4,0),(1.5,.2,1),'leather',r)
  for x in [-.65,.65]:
   for z in [-.4,.4]:a.part('wheel','cylinder',(x,.22,z),(.22,.08,.22),'brass',r,quat([0,0,1],math.pi/2))
  a.embed(ASSETS['mirror_plinth'],(0,.5,0))
 elif kind=='banner':
  a.part('pole','cylinder',(0,1.2,0),(.04,2.4,.04),'trunk',r);a.part('cloth','box',(.35,1.7,0),(.7,.9,.03),'crimson',r);a.part('sun','sphere',(.35,1.7,-.025),(.14,.14,.02),'gold',r)
 else: a.part('spear','cone',(0,.8,0),(.1,1.6,.08),'ember',r)
 save(a,'props')
a=Asset('last_shadow_arena');coll=[]
for x,z in [(-4,-4),(4,-4),(-4,4),(4,4)]:
 a.part('room_fragment','box',(x,-.25,z),(6,.5,6),'leather');a.embed(ASSETS['elin_bed'],(x,0,z)) if x<0 and z<0 else a.embed(ASSETS['light_anchor'],(x,0,z))
 a.part('light_path_x','box',(0,-.1,z),(3,.2,1.5),'gold');a.part('light_path_z','box',(x,-.1,0),(1.5,.2,3),'gold')
a.meta={'kind':'environment','region':'last_shadow','state':'final_boss_stage_3','units':'meters','up':'Y'};save(a,'environments');SCENES.append(a)
# Original synthesized audio sketches: no borrowed samples or voice acting.
SR=22050
rng=np.random.default_rng(117)
def wavsave(name,samples):
 samples=np.array(samples,float);samples=np.clip(samples,-.92,.92);data=(samples*32767).astype('<i2')
 with wave.open(str(ROOT/'audio'/f'{name}.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(data.tobytes())
 return {'file':'audio/'+name+'.wav','duration_seconds':round(len(data)/SR,3),'kind':'original_synthesized_audio_sketch'}
AUDIO=[]
for name,freq,dur in [('sword_swing',180,.24),('shield_block',130,.35),('prism_shot',880,.35),('lantern_arrow',660,.4),('hero_hit',90,.2),('revive',523,1),('seal_recovered',784,1.3),('beacon',440,1.4),('bell',392,2),('root_break',110,.5),('water_wave',160,1),('ash_gust',220,.8),('boss_stagger',65,.6),('boss_defeat',98,2),('gate_open',82,1.3),('footstep',110,.12),('menu_confirm',880,.15),('menu_back',440,.18),('stillness_pulse',55,1.5)]:
 t=np.arange(int(SR*dur))/SR;env=np.sin(np.minimum(t/.03,1)*math.pi/2)*np.exp(-t/(dur*.28));noise=rng.normal(0,.1,len(t));samples=(np.sin(2*math.pi*(freq*t+(freq*.2)*t*t))*.28+noise)*env
 if name=='bell':samples=sum(np.sin(2*math.pi*freq*k*t)*(.3/k)*np.exp(-t/(1.4/k)) for k in [1,2,3,5])
 AUDIO.append(wavsave(name,samples))
melodies={'courage':[60,64,67,72,67,64,62,60],'compassion':[60,65,64,62,60,57,60,62],'reason':[60,67,64,69,67,64,62,67],'hope':[60,64,67,71,72,71,67,64],'veyr':[48,51,55,54,48,0,51,0]}
for name,notes in melodies.items():
 out=np.zeros(SR*8)
 for j,n in enumerate(notes):
  if not n:continue
  t=np.arange(SR)/SR;hz=440*2**((n-69)/12);out[j*SR:(j+1)*SR]+=(np.sin(2*math.pi*hz*t)*.22+np.sin(2*math.pi*hz*2*t)*.07)*np.sin(math.pi*np.minimum(t/.02,1)/2)*np.exp(-t*4)
 AUDIO.append(wavsave('theme_'+name,out))
# UI vectors, naturally sharp at mobile display sizes.
ICONS={'crimson':('<path d="M43 83L72 20L81 25L52 88ZM36 70L62 83"/>','crimson'),'azure':('<path d="M32 26Q64 12 96 26V61Q88 89 64 105Q40 89 32 61Z"/>','azure'),'gold':('<path d="M64 14L91 55L64 102L37 55ZM37 55H91M64 14V102"/>','gold'),'violet':('<path d="M47 18Q104 64 47 110M47 18V110M24 64H102M85 49L103 64L85 79"/>','violet'),'sun':('<circle cx="64" cy="64" r="22"/><path d="M64 8V29M64 99V120M8 64H29M99 64H120M24 24L39 39M89 89L104 104M104 24L89 39M39 89L24 104"/>','gold'),'attack':('<path d="M31 100L90 23L105 19L104 35L45 111ZM23 80L60 107"/>','cream'),'dodge':('<path d="M24 64H100L78 42M100 64L78 86M19 34H60M19 94H60"/>','cream'),'interact':('<circle cx="64" cy="64" r="39"/><path d="M64 39V89M39 64H89"/>','cream'),'pause':('<path d="M46 26V102M82 26V102"/>','cream'),'revive':('<path d="M64 20V108M20 64H108"/>','gold')}
for name,(shape,mat) in ICONS.items():
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="59" fill="#262b40"/ ><g fill="none" stroke="#{PAL[mat]}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">{shape}</g></svg>'.replace('/ >','/>')
 (ROOT/'ui'/f'{name}.svg').write_text(svg)
(ROOT/'audio'/'audio_manifest.json').write_text(json.dumps(AUDIO,indent=2))
(ROOT/'asset_manifest.json').write_text(json.dumps({'title':'Echos of Light','version':'0.1 first-pass 3D asset kit','models':RECORDS,'audio':AUDIO,'palette':PAL,'not_a_finished_game':True,'limitations':['Procedural simplified artwork does not match reference-level sculpting or hand-painted textures.','Articulated node animations, not skinned deforming meshes.','No voice acting or final score.','Maps are first-pass scenes with approximate collision metadata; traversal is not implemented.','No networking, combat code, or playable app included.']},indent=2))
print('Audio and UI complete',flush=True)
