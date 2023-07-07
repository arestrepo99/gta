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

    force(point1, point2){
        let dp = point1.p.clone().sub(point2.p);
        let dv = point1.v.clone().sub(point2.v);
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



// export class RigidBody{

//     constructor(mass, inertia, p, v, q, w){
//         this.m = mass; // Mass Scalar
//         this.I = inertia; // Moment of intertia Vetor3
//         this.p = p; // Position Vector3
//         this.v = v;  // Velocity Vector3
//         this.q = q; // Quaternion
//         this.w = w; // Angular velocity Vector3

//         this.a = new THREE.Vector3(0, 0, 0);
//         // Acceleration Vector3
//         this.alpha = new THREE.Vector3(0, 0, 0);
//         // Angular acceleration Vector3
//     }

//     applyForce(f, p){
//         // f: force
//         // p: point of application 
//         // Torque to be applied to center of mass

//         let torque = p.clone().sub(this.p).cross(f);
//         // Force to be applied to center of mass
//         let force = f.clone()

//         this.a.add(force.clone().divideScalar(this.m));
//         this.alpha.add(torque.clone().divide(this.I));

        
//     }

//     step(dt){
//         // Gravity
//         this.applyForce(new THREE.Vector3(0, -9.8, 0).multiplyScalar(this.m), this.p);
//         this.v.add(this.a.clone().multiplyScalar(dt));
//         this.p.add(this.v.clone().multiplyScalar(dt));

//         this.w.add(this.alpha.clone().multiplyScalar(dt));
//         this.q.add(new THREE.Quaternion().setFromAxisAngle(this.w.clone().normalize(), this.w.length()*dt));
//         this.q.normalize();

//         this.a.set(0, 0, 0);
//         this.alpha.set(0, 0, 0);
//     }

// }
