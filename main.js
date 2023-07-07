import * as THREE from 'three';
// import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {SingleTireSystem, PointMass, SpringDamper} from './spring.js';

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


// Create Tire
const tireGeometry = new THREE.CylinderGeometry( 1, 1, 1, 32 );
// Grey color -
const tireMaterial = new THREE.MeshLambertMaterial( {color: 'grey'} );
const tire = new THREE.Mesh( tireGeometry, tireMaterial );
scene.add( tire );


tire.rotation.x = Math.PI/2;
camera.position.z = 7;
camera.position.y = 3;


// Tire Mount
const tireMountGeometry = new THREE.CylinderGeometry( 0.5, 0.5, 0.5, 32 );
const tireMountMaterial = new THREE.MeshLambertMaterial( {color: 'grey'} );
const tireMount = new THREE.Mesh( tireMountGeometry, tireMountMaterial );
scene.add( tireMount );
tireMount.position.y = 4;



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

const geometry = new THREE.PlaneGeometry( 80, 80 , 200, 200);
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
				// position.z + 1. + sin(position.x/2. + u_time )*0.5  + cos(position.y/1.0)*0.5  );
				position.z - 1. + abs(cos((position.x + cameraPos.x)/5.)) + cos(position.y + cameraPos.y/1.0)*0.1
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




// const 
// spring.start(0, -.1);

const k = 15000;
const b = 1400;
const l = 4;

const start_height = 4;


const massObj = new PointMass(new THREE.Vector3(0, 4 + start_height, 0), new THREE.Vector3(0, 0, 0), 1000);
const tireObj = new PointMass(new THREE.Vector3(0, 0 + start_height, 0), new THREE.Vector3(0, 0, 0), 100);
const springObj = new SpringDamper(k, b, l)


const tireSystem = new SingleTireSystem(massObj, tireObj, springObj);



const start = window.performance.now();
let last = start;
let dt
let time



const substeps = 1;
	

const input = {

}
document.addEventListener('keydown', (event) => {
	input[event.key] = true;
});
document.addEventListener('keyup', (event) => {
	input[event.key] = false;
});

function animate(timestamp) {
	dt = (timestamp - last)/1000; time = timestamp/1000 - start/1000; last = timestamp;
	if (dt > 0.1) dt = 0.1;


	const masspos = tireSystem.mass.p;
	const tirepos = tireSystem.tire.p;
	tire.position.x = tirepos.x;
	tire.position.y = tirepos.y;
	tire.position.z = tirepos.z;


	tireMount.position.x = masspos.x;
	tireMount.position.y = masspos.y;
	tireMount.position.z = masspos.z;


	plane.position.x = camera.position.x;

	for (let i = 0; i < substeps; i++) {
		time += dt/substeps;
		tireSystem.step(dt/substeps, time, input);
	}

	camera.position.x = tireSystem.mass.p.x;
	uniformData.u_time.value = time;
	uniformData.cameraPos.value = camera.position;
	renderer.render( scene, camera );
	requestAnimationFrame( animate );
	console.log(camera.position.x)
}

animate(start);