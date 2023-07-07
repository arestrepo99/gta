import * as THREE from 'three';





export class PointMass {
    constructor(p, v, m){
        this.p = p;
        this.pPrev = p.clone();
        this.v = v;
        this.m = m;
        this.a = new THREE.Vector3(0, 0, 0);
    }
    
    applyForce(f) {
        this.a.add(f.clone().divideScalar(this.m));
    }

    // Verlet integration
    step(dt) {
        // Gravity
        if (dt == 0) return;
        this.applyForce(new THREE.Vector3(0, -9.8, 0).multiplyScalar(this.m));
        this.v = this.p.clone().sub(this.pPrev).divideScalar(dt);
        this.pPrev = this.p.clone();
        this.p.add(this.v.clone().multiplyScalar(dt)).add(this.a.clone().multiplyScalar(dt*dt));
        this.a.set(0, 0, 0);
    }

}

export class SpringDamper {

    constructor(k, b, l){
        // k: spring constant
        // b: damping constant
        // l: rest length
        this.k = k;
        this.b = b;
        this.l = l;
    }

    force(p1, p2, v1, v2){
        let dp = p1.clone().sub(p2);
        let dv = v1.clone().sub(v2);
        let l = dp.length();
        let f = dp.normalize().multiplyScalar(-this.k*(l-this.l)).sub(dv.multiplyScalar(this.b));
        return f;
    }


    // step(dt){
    //     let x = this.p1.x.clone().sub(this.p2.x);
    //     let v = this.p1.v.clone().sub(this.p2.v);
    //     let l = x.length();
    //     let f = x.normalize().multiplyScalar(-this.k*(l-this.l)).sub(v.multiplyScalar(this.b));
    //     this.p1.applyForce(f);
    //     this.p2.applyForce(f.multiplyScalar(-1));
    // }

}

// 1 dimension
export class SingleTireSystem {

    constructor(mass, tire, spring){
        this.mass = mass;
        this.tire = tire;
        this.spring = spring;

    }


    step(dt, time, input){
        
    
        let f = this.spring.force(this.mass, this.tire);
        this.mass.applyForce(f);
        this.tire.applyForce(f.multiplyScalar(-1));
        this.mass.step(dt);
        this.tire.step(dt);




        // Bottom constraint
        const position =  this.tire.p.clone();
        const floorHeight =   1. - Math.abs(Math.cos(position.x/5.)) + Math.cos(position.y/1.0)*0.1
        if (this.tire.p.y -1 < floorHeight){
            this.tire.p.y = floorHeight + 1;
        }

        // Order constraint
        this.mass.p.y = Math.max(this.mass.p.y, this.tire.p.y);

        // Make Sure the tire is always below the mass
        this.tire.p.x = this.mass.p.x
        this.tire.p.z = this.mass.p.z

        if (input.l){
            this.mass.applyForce(new THREE.Vector3(11*this.mass.m, 0, 0 ));
        }
        if (input.r){
            this.mass.applyForce(new THREE.Vector3(-11*this.mass.m, 0, 0 ));
        }

    }
}



export class RigidBody{

    constructor(mass, inertia, p, v, q, w){
        this.m = mass; // Mass Scalar
        this.I = inertia; // Moment of intertia Vetor3
        this.p = p; // Position Vector3
        this.pPrev = p.clone(); // Previous Position Vector3
        this.v = v;  // Velocity Vector3
        this.q = q; // Quaternion
        this.w = w; // Angular velocity Vector3


        this.a = new THREE.Vector3(0, 0, 0);
        // Acceleration Vector3
        this.alpha = new THREE.Vector3(0, 0, 0);
        // Angular acceleration Vector3


        // Rectangular prism
        this.bodyGeometry = new THREE.BoxGeometry(2, 0.1, 4);
        // Dark red
        this.bodyMaterial = new THREE.MeshLambertMaterial({color: 0x8B0000});
        this.mesh = new THREE.Mesh(this.bodyGeometry, this.bodyMaterial);
        this.mesh.position.copy(this.p);
        this.mesh.quaternion.copy(this.q);
        this.mesh.scale.set(1, 1, 1);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

    }

    applyForce(f, p){
        // f: force
        // p: point of application 
        // Torque to be applied to center of mass
        
        const r = p.clone().sub(this.p);
        let torque = r.clone().cross(f);
        let force = f.clone()
        this.a.add(force.clone().divideScalar(this.m));
        this.alpha.add(torque.clone().divide(this.I));
    }
    draw(){
        this.mesh.position.copy(this.p);
        this.mesh.quaternion.copy(this.q);
    }

    step(dt, time, input){
        if (dt == 0) return;
        // Gravity
        this.applyForce(new THREE.Vector3(0, -9.8, 0).multiplyScalar(this.m), this.p);


        // Apply forces relative to the direction of the quaternion
        const directionVector = new THREE.Vector3(0, 0, -1).applyQuaternion(this.q);

        if (input['ArrowUp']){
            this.applyForce(directionVector.clone().multiplyScalar(this.m*5), this.p.clone().add(new THREE.Vector3(0, 0, 0)));
        }
         if (input['ArrowDown']){
            this.applyForce(directionVector.clone().multiplyScalar(-this.m*5), this.p.clone().add(new THREE.Vector3(0, 0, 0)));
        }

        if (input['ArrowLeft']){
            // this.applyForce(new THREE.Vector3(100, 0, 0), this.p.clone().add(new THREE.Vector3(0, 0, 0.1)));
            this.w = new THREE.Vector3(0, 1, 0);
        } 
        else if (input['ArrowRight']){
            this.w = new THREE.Vector3(0,-1, 0);
            // this.applyForce(new THREE.Vector3(-100, 0, 0), this.p.clone().add(new THREE.Vector3(0, 0, 0.1)));
        } else {
            this.w = new THREE.Vector3(0, 0, 0);
        }




        this.w.add(this.alpha.clone().multiplyScalar(dt));
        this.q.multiply(new THREE.Quaternion().setFromAxisAngle(this.w.clone().normalize(), this.w.length()*dt));
        this.q.normalize();
        this.alpha.set(0, 0, 0);

        this.v = this.p.clone().sub(this.pPrev).divideScalar(dt);
        this.pPrev = this.p.clone();
        this.p.add(this.v.clone().multiplyScalar(dt)).add(this.a.clone().multiplyScalar(dt*dt));
        this.a.set(0, 0, 0);

    }

}





export class Tire {
    constructor(p, v, m){
        this.p = p;
        this.pPrev = p.clone();
        this.v = v;
        this.m = m;
        this.a = new THREE.Vector3(0, 0, 0);

        
        const tireGeometry = new THREE.CylinderGeometry( 1, 1, 1, 32 );
        const tireMaterial = new THREE.MeshLambertMaterial( {color: 'grey'} );
        this.mesh = new THREE.Mesh( tireGeometry, tireMaterial );
        this.mesh.rotation.z = Math.PI/2;
        this.mesh.position.copy(this.p);


    }
    
    applyForce(f) {
        this.a.add(f.clone().divideScalar(this.m));
    }

    draw(){
        this.mesh.position.copy(this.p);
        // this.mesh.quaternion.copy(this.q);
        this.mesh.rotation.z = Math.PI/2;
    }

    // Verlet integration
    step(dt) {
        // Gravity
        if (dt == 0) return;
        this.applyForce(new THREE.Vector3(0, -9.8, 0).multiplyScalar(this.m));
        this.v = this.p.clone().sub(this.pPrev).divideScalar(dt);
        this.pPrev = this.p.clone();
        this.p.add(this.v.clone().multiplyScalar(dt)).add(this.a.clone().multiplyScalar(dt*dt));
        this.a.set(0, 0, 0);
    }

}




export class MonoCar{
    
    constructor(){

        this.rigidBody = new RigidBody(
            1000, 
            new THREE.Vector3(100, 100, 100),
            new THREE.Vector3(0, 5, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Quaternion(0, 0, 0, 1),
            new THREE.Vector3(0, 0, 0)
        );

        

        // Create Tire
        this.tire = new Tire(
            new THREE.Vector3(0, 3, 0),
            new THREE.Vector3(0, 0, 0),
            100,
        )
        
        const k = 35000;
        const b = 3000;
        const l = 2;

        this.spring = new SpringDamper(k,b,l)
        // Connect the tire to the tire mount
    }

    draw(){
        this.rigidBody.draw();

        this.tire.draw();
    }

    step(dt, time, input){


        let f = this.spring.force(this.rigidBody.p, this.tire.p, this.rigidBody.v, this.tire.v);

        this.rigidBody.applyForce(f, this.tire.p);
        this.rigidBody.step(dt, time, input);
        this.tire.applyForce(f.clone().multiplyScalar(-1));
        this.tire.step(dt, time, input);

        
        //  Tire and tiremount constraints
        // First move the rigid body with the force from the spring
        const position = this.rigidBody.p
        const quaternion = this.rigidBody.q
        
        // const tireMountPOsition = position.clone().add(this.relativeTireMountPosition.applyQuaternion(quaternion))
        // this.tireMount.p = tireMountPOsition;
    
        this.tire.p.x = this.rigidBody.p.x;
        this.tire.p.z = this.rigidBody.p.z;

        // this.tire.p = position.clone().add(this.relativeTireMountPosition).add(this.relativeTirePosition.clone().multiplyScalar(l)).applyQuaternion(quaternion)
        // Constraint the tire to be in the projection the vector from tireMount to tireIdealPosition
        // const tirePosition = tireMountPOsition.clone().add(tireIdealPosition.clone().sub(tireMountPOsition).projectOnVector(tireMountPOsition.clone().sub(this.rigidBody.p)))


        // Floor constraint
        const tirePosition = this.tire.p;
        const floorHeight =   1. - Math.abs(Math.cos(tirePosition.x/5.)) + Math.cos(tirePosition.y/1.0)*0.1
        if (this.tire.p.y -1 < floorHeight){
            this.tire.p.y = floorHeight + 1;
        }


        // this.tire.step(dt, time, input);
        
        // Order constraint
        // this.mass.p.y = Math.max(this.mass.p.y, this.tire.p.y);

        // Make Sure the tire is always below the mass
        // this.tire.p.x = this.mass.p.x
        // this.tire.p.z = this.mass.p.z

        // if (input.l){
        //     this.mass.applyForce(new THREE.Vector3(11*this.mass.m, 0, 0 ));
        // }
        // if (input.r){
        //     this.mass.applyForce(new THREE.Vector3(-11*this.mass.m, 0, 0 ));
        // }

    }

}
    


export class Bike{
    
    constructor(){

        this.rigidBody = new RigidBody(
            1000, 
            new THREE.Vector3(100, 100, 100),
            new THREE.Vector3(0, 5, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Quaternion(0, 0, 0, 1),
            new THREE.Vector3(0, 0, 0)
        );

        

        // Create Tire
        this.tire1 = new Tire(
            new THREE.Vector3(0, 3, 0),
            new THREE.Vector3(0, 0, 0),
            100,
        )
        
        // Create Tire
        this.tire2 = new Tire(
            new THREE.Vector3(0, 3, 0),
            new THREE.Vector3(0, 0, 0),
            100,
        )

        const k = 35000;
        const b = 3000;
        const l = 2;

        this.spring1 = new SpringDamper(k,b,l)
        this.spring2 = new SpringDamper(k,b,l)
        // Connect the tire to the tire mount
    }

    draw(){
        this.rigidBody.draw();

        this.tire1.draw();
        this.tire2.draw();
    }

    step(dt, time, input){


        let f = this.spring.force(this.rigidBody.p, this.tire.p, this.rigidBody.v, this.tire.v);

        this.rigidBody.applyForce(f, this.tire.p);
        this.rigidBody.step(dt, time, input);
        this.tire.applyForce(f.clone().multiplyScalar(-1));
        this.tire.step(dt, time, input);

        
        //  Tire and tiremount constraints
        // First move the rigid body with the force from the spring
        const position = this.rigidBody.p
        const quaternion = this.rigidBody.q

        const tiremountpos = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).add(position)

        
        // const tireMountPOsition = position.clone().add(this.relativeTireMountPosition.applyQuaternion(quaternion))
        // this.tireMount.p = tireMountPOsition;
    
        this.tire.p.x = this.rigidBody.p.x + 1;
        this.tire.p.z = this.rigidBody.p.z;

        // this.tire.p = position.clone().add(this.relativeTireMountPosition).add(this.relativeTirePosition.clone().multiplyScalar(l)).applyQuaternion(quaternion)
        // Constraint the tire to be in the projection the vector from tireMount to tireIdealPosition
        // const tirePosition = tireMountPOsition.clone().add(tireIdealPosition.clone().sub(tireMountPOsition).projectOnVector(tireMountPOsition.clone().sub(this.rigidBody.p)))


        // Floor constraint
        const tirePosition = this.tire.p;
        const floorHeight =   1. - Math.abs(Math.cos(tirePosition.x/5.)) + Math.cos(tirePosition.y/1.0)*0.1
        if (this.tire.p.y -1 < floorHeight){
            this.tire.p.y = floorHeight + 1;
        }


        // this.tire.step(dt, time, input);
        
        // Order constraint
        // this.mass.p.y = Math.max(this.mass.p.y, this.tire.p.y);

        // Make Sure the tire is always below the mass
        // this.tire.p.x = this.mass.p.x
        // this.tire.p.z = this.mass.p.z

        // if (input.l){
        //     this.mass.applyForce(new THREE.Vector3(11*this.mass.m, 0, 0 ));
        // }
        // if (input.r){
        //     this.mass.applyForce(new THREE.Vector3(-11*this.mass.m, 0, 0 ));
        // }

    }

}
    