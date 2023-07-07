import * as THREE from 'three';
// import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {SingleTireSystem, PointMass, SpringDamper, RigidBody, MonoCar} from './spring.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// const controls = new OrbitControls( camera, renderer.domElement );

// Background color white
renderer.setClearColor("#ffffff");

// Light
const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
scene.add( light );	




// define uniform data
const uniformData = {
	u_time: {
	  type: 'f',
	  value: null,
	},
	cameraPos: {
		type: 'v3',
		value: camera.position,
	}
  };

const geometry = new THREE.PlaneGeometry( 200, 200 , 200, 200);
// ShaderMaterial
const material = new THREE.ShaderMaterial( {
	wireframe: true,
	uniforms: uniformData,
	vertexShader: `
		varying vec3 vPos;
		uniform float u_time;
		uniform vec3 cameraPos;
		void main() {
			vPos = vec3(
				position.x,
				position.y,
				// position.z + 1. + sin(position.x/2.  )*0.5  + cos(position.y/1.0)*0.5  );
				position.z - 1. + abs(cos((position.x + cameraPos.x)/5.))
			);

			gl_Position = projectionMatrix * modelViewMatrix * vec4( vPos, 1.0 );
		}
	`,
	fragmentShader: `
		varying vec3 vPos;
		void main() {
			gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
		}
	`
} );

const plane = new THREE.Mesh( geometry, material ).rotateX(Math.PI/2);
scene.add( plane );

const monocar = new MonoCar();

scene.add(monocar.tire.mesh);
scene.add(monocar.rigidBody.mesh);


const start = window.performance.now();
let last = start;
let dt
let time



const substeps = 10;
	

const input = {}
document.addEventListener('keydown', (event) => {
	input[event.key] = true;
});
document.addEventListener('keyup', (event) => {
	delete input[event.key];
});


monocar.rigidBody.q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/4));
function animate(timestamp) {
	dt = (timestamp - last)/1000; time = timestamp/1000 - start/1000; last = timestamp;
	if (dt > 0.1) dt = 0.1;
	



	for (let i = 0; i < substeps; i++) {
		time += dt/substeps;
		monocar.step(dt/substeps, time, input);
	}
	monocar.draw();


	camera.quaternion.copy(monocar.rigidBody.mesh.quaternion);
	const q_direction_vector = new THREE.Vector3(0, -3, -15).applyQuaternion(camera.quaternion);
	const position = monocar.rigidBody.mesh.position.clone().sub(q_direction_vector);
	camera.position.set(position.x, position.y, position.z);

	plane.position.z = camera.position.z;
	plane.position.x = camera.position.x;

	uniformData.u_time.value = time;
	uniformData.cameraPos.value = camera.position;

	renderer.render( scene, camera );
	requestAnimationFrame( animate );
}

animate(start);