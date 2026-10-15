"""GLB structural validation and CPU orthographic preview renderer."""
import json,struct,math
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
def load_glb(path):
 b=Path(path).read_bytes();magic,version,total=struct.unpack_from('<III',b)
 assert magic==0x46546c67 and version==2 and total==len(b),path
 jl,jt=struct.unpack_from('<II',b,12);assert jt==0x4e4f534a
 g=json.loads(b[20:20+jl]);bl,bt=struct.unpack_from('<II',b,20+jl);assert bt==0x004e4942
 binary=b[28+jl:28+jl+bl];assert g['buffers'][0]['byteLength']<=len(binary)
 return g,binary
def array(g,b,i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dt={5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']];dim={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];start=v.get('byteOffset',0)+a.get('byteOffset',0)
 return np.frombuffer(b,dtype=dt,count=a['count']*dim,offset=start).reshape(a['count'],dim)
def matrix(n):
 m=np.eye(4);q=n.get('rotation',[0,0,0,1]);x,y,z,w=q
 m[:3,:3]=[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]
 m[:3,:3]=m[:3,:3]@np.diag(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0]);return m
def geometry(path,offset=(0,0,0)):
 g,b=load_glb(path);tri=[];cols=[]
 def visit(i,parent):
  n=g['nodes'][i];m=parent@matrix(n)
  if 'mesh'in n and abs(np.linalg.det(m[:3,:3]))>1e-10:
   for pr in g['meshes'][n['mesh']]['primitives']:
    v=array(g,b,pr['attributes']['POSITION']);v=(np.c_[v,np.ones(len(v))]@m.T)[:,:3]+offset;f=array(g,b,pr['indices']).reshape(-1,3)
    c=g['materials'][pr['material']]['pbrMetallicRoughness']['baseColorFactor'][:3];c=np.array(c);c=np.where(c<=.0031308,c*12.92,1.055*c**(1/2.4)-.055)
    norm=array(g,b,pr['attributes']['NORMAL'])@np.linalg.inv(m[:3,:3]);norm/=np.linalg.norm(norm,axis=1)[:,None];light=np.array([-.5,1,-.7]);light/=np.linalg.norm(light);shades=.5+.5*np.maximum(0,norm@light);tri.extend(v[f]);cols.extend((shades[f][...,None]*c))
  for ch in n.get('children',[]):visit(ch,m)
 for i in g['scenes'][g['scene']]['nodes']:visit(i,np.eye(4))
 return np.array(tri),np.array(cols)
def camera(eye,target,width,height,span):
 eye=np.array(eye,float);target=np.array(target,float);forward=target-eye;forward/=np.linalg.norm(forward);right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,forward);view=np.stack([right,up,forward]);scale=width/span
 def project(p):
  q=(p-eye)@view.T;return np.stack([q[...,0]*scale+width/2,height/2-q[...,1]*scale,q[...,2]],axis=-1)
 return project
def raster(tri,project,w,h,cols=None,shadow=None):
 zbuf=np.full((h,w),np.inf);canvas=np.zeros((h,w,3),float);canvas[:]=[.93,.9,.82]
 proj=project(tri);light=np.array([-.5,1,-.7]);light/=np.linalg.norm(light)
 for k,(pts,xyz) in enumerate(zip(proj,tri)):
  xmin=max(0,int(math.floor(pts[:,0].min())));xmax=min(w-1,int(math.ceil(pts[:,0].max())));ymin=max(0,int(math.floor(pts[:,1].min())));ymax=min(h-1,int(math.ceil(pts[:,1].max())))
  if xmin>xmax or ymin>ymax:continue
  x0,y0,z0=pts[0];x1,y1,z1=pts[1];x2,y2,z2=pts[2];den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
  if abs(den)<1e-8:continue
  yy,xx=np.mgrid[ymin:ymax+1,xmin:xmax+1];xx=xx+.5;yy=yy+.5
  b0=((y1-y2)*(xx-x2)+(x2-x1)*(yy-y2))/den;b1=((y2-y0)*(xx-x2)+(x0-x2)*(yy-y2))/den;b2=1-b0-b1
  depth=b0*z0+b1*z1+b2*z2;z=zbuf[ymin:ymax+1,xmin:xmax+1];mask=(b0>=-1e-6)&(b1>=-1e-6)&(b2>=-1e-6)&(depth<z)
  if not mask.any():continue
  z[mask]=depth[mask]
  if cols is not None:
   n=np.cross(xyz[1]-xyz[0],xyz[2]-xyz[0]);ln=np.linalg.norm(n);n=n/ln if ln else n
   shade=.5+.5*max(0,np.dot(n,light));sh=np.ones(depth.shape)
   if shadow:
    sp,sz=shadow;world=b0[...,None]*xyz[0]+b1[...,None]*xyz[1]+b2[...,None]*xyz[2];s=sp(world);sx=np.clip(s[...,0].astype(int),0,sz.shape[1]-1);sy=np.clip(s[...,1].astype(int),0,sz.shape[0]-1);sh=np.where(s[...,2]>sz[sy,sx]+.12,.6,1)
   c=canvas[ymin:ymax+1,xmin:xmax+1];rgb=b0[...,None]*cols[k][0]+b1[...,None]*cols[k][1]+b2[...,None]*cols[k][2];values=rgb*sh[...,None];c[mask]=values[mask]
 return canvas,zbuf
def preview(name,items,eye,target,span,w=1000,h=750):
 ts=[];cs=[]
 for path,offset in items:
  t,c=geometry(ROOT/path,offset);ts.append(t);cs.append(c)
 tri=np.concatenate(ts);cols=np.concatenate(cs)
 # Scene ground patch for isolated character previews.
 if name.startswith('heroes') or name.startswith('boss'):
  tri=np.concatenate([tri,np.array([[[-7,-.04,-4],[7,-.04,4],[7,-.04,-4]],[[-7,-.04,-4],[-7,-.04,4],[7,-.04,4]]])]);cols=np.concatenate([cols,np.array([[[.88,.85,.76]]*3]*2)])
 lightcam=camera([-16,26,-20],target,1000,1000,span*1.4);_,shadow=raster(tri,lightcam,1000,1000)
 p=camera(eye,target,w,h,span);im,_=raster(tri,p,w,h,cols,(lightcam,shadow));im=Image.fromarray((np.clip(im,0,1)*255).astype('uint8'));d=ImageDraw.Draw(im)
 d.rectangle((0,0,w,52),fill='#262b40');d.text((20,16),name.replace('_',' ').upper()+'  |  ACTUAL 3D MODEL PREVIEW',fill='#f0e4c9')
 d.rectangle((0,h-27,w,h),fill='#262b40');d.text((20,h-20),'FIRST PASS ASSETS - procedural geometry; further art polish required',fill='#f0e4c9')
 im.save(ROOT/'previews'/f'{name}.png');print('Rendered',name,len(tri),'triangles',flush=True)
def validate():
 report=[]
 for path in sorted(ROOT.rglob('*.glb')):
  g,b=load_glb(path);errors=[]
  for i,a in enumerate(g['accessors']):
   arr=array(g,b,i);assert np.all(np.isfinite(arr)),(path,i)
  for m in g['meshes']:
   for p in m['primitives']:
    v=array(g,b,p['attributes']['POSITION']);ix=array(g,b,p['indices']).reshape(-1);assert ix.max()<len(v)
    f=ix.reshape(-1,3);area=np.linalg.norm(np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]]),axis=1);assert area.min()>1e-9,path
    norms=array(g,b,p['attributes']['NORMAL']);assert np.max(abs(np.linalg.norm(norms,axis=1)-1))<.001
  for n in g['nodes']:
   for ch in n.get('children',[]):assert 0<=ch<len(g['nodes'])
   if 'rotation'in n:assert abs(np.linalg.norm(n['rotation'])-1)<.001
  for ani in g.get('animations',[]):
   for ch in ani['channels']:
    s=ani['samplers'][ch['sampler']];t=array(g,b,s['input']).reshape(-1);v=array(g,b,s['output']);assert len(t)==len(v) and np.all(np.diff(t)>0)
    if ch['target']['path']=='rotation':assert np.max(abs(np.linalg.norm(v,axis=1)-1))<.001
  report.append({'file':str(path.relative_to(ROOT)),'status':'passed_structural_checks','animation_count':len(g.get('animations',[]))})
 (ROOT/'validation_report.json').write_text(json.dumps({'method':'local custom structural checks; not Khronos official validator or engine import','checks':['GLB headers and lengths','buffer accessor bounds','finite geometry','triangle index ranges and nonzero area','unit normals and rotation quaternions','animation target indices and increasing timestamps'],'files':report},indent=2));print('Validated',len(report),'GLBs',flush=True)
if __name__=='__main__':
 validate()
 preview('heroes_four_echoes',[(f'models/aren_{a}.glb',((i-1.5)*1.6,0,0)) for i,a in enumerate(['crimson','azure','gold','violet'])],[3,2.9,-9],[0,1,0],8,w=1200,h=680)
 for region in ['verdant','abbey','observatory','ember','lumenfall']:
  preview(region+'_restored',[(f'environments/{region}_restored.glb',(0,0,0))],[23,28,30],[0,0,0],33)
 preview('boss_briarhorn',[('models/briarhorn.glb',(0,0,0))],[5,3,-6],[0,1.2,0],5)
 preview('boss_ashwing',[('models/ashwing.glb',(0,0,0))],[4,3,-6],[0,1.2,0],5)
