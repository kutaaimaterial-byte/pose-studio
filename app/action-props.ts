import * as THREE from "three";
import type { Triple, SupportKind } from "./action-authoring";

export type ActionProp = {id:string;kind:SupportKind|"door";position:Triple;rotation:Triple;size:Triple;actorId?:string;bone?:string;offset?:Triple};

/** Neutral blocking geometry, not illustrative thumbnails. Dimensions and
 * placements are stored with the shot and survive export/import. */
export function createActionProp(prop:ActionProp):THREE.Group {
  const group=new THREE.Group();group.name=prop.id;
  const mat=new THREE.MeshStandardMaterial({color:prop.kind==="cup"?"#a6c8d5":"#b4bfce",roughness:.8});
  const box=(size:Triple,at:Triple)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);mesh.position.set(...at);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);};
  const [w,h,d]=prop.size;
  if(prop.kind==="chair"){
    box([w,.12,d],[0,h,0]);box([w,h*.85,.1],[0,h*1.42,-d/2+.05]);
    for(const x of [-1,1])for(const z of [-1,1])box([.09,h,.09],[x*(w/2-.09),h/2,z*(d/2-.09)]);
  }else if(prop.kind==="table"){
    box([w,.12,d],[0,h,0]);for(const x of [-1,1])for(const z of [-1,1])box([.1,h,.1],[x*(w/2-.1),h/2,z*(d/2-.1)]);
  }else if(prop.kind==="steps"){
    for(let i=0;i<3;i++)box([w,h*(i+1)/3,d/3],[0,h*(i+1)/6,-d/2+d*(i+.5)/3]);
  }else if(prop.kind==="cup"){
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(w/2,w*.44,h,24,1,true),mat);group.add(cup);
    const handle=new THREE.Mesh(new THREE.TorusGeometry(w*.37,w*.09,8,20),mat);handle.position.x=w*.52;group.add(handle);
  }else if(prop.kind==="column"){
    const column=new THREE.Mesh(new THREE.CylinderGeometry(w/2,w/2,h,20),mat);column.position.y=h/2;group.add(column);
  }else if(prop.kind==="rail"){
    box([w,.1,.1],[0,h,0]);box([w,.08,.08],[0,h*.55,0]);for(const x of [-1,1])box([.08,h,.08],[x*w*.42,h/2,0]);
  }else if(prop.kind==="bow"){
    const arc=new THREE.Mesh(new THREE.TorusGeometry(h/2,.035,8,32,Math.PI),mat);arc.rotation.z=-Math.PI/2;group.add(arc);box([.012,h,.012],[0,0,0]);
  }else if(prop.kind==="sword"){
    box([w*.25,h,d],[0,h*.3,0]);box([w,.06,d*2],[0,-h*.1,0]);box([w*.3,h*.24,d*1.5],[0,-h*.25,0]);
  }else {
    box([w,h,d],[0,prop.kind==="wall"||prop.kind==="door"?h/2:0,0]);
    if(prop.kind==="bag"||prop.kind==="suitcase")box([w*.45,.06,.08],[0,h*.62,0]);
  }
  group.position.set(...prop.position);group.rotation.set(...prop.rotation.map(THREE.MathUtils.degToRad) as Triple);
  return group;
}

export function disposeActionProps(group:THREE.Group){
  const materials=new Set<THREE.Material>();
  group.traverse(child=>{if(child instanceof THREE.Mesh){child.geometry.dispose();(Array.isArray(child.material)?child.material:[child.material]).forEach(material=>materials.add(material));}});
  materials.forEach(material=>material.dispose());
}
